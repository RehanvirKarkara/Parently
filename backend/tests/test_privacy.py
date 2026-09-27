"""Automated tests for Privacy, Consent, Authorizations, and Data Management."""
import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def create_test_user(prefix: str = "priv"):
    uid = uuid.uuid4().hex[:6]
    email = f"{prefix}_{uid}@example.com"
    pwd = "TestPassword123!"
    res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": pwd,
        "first_name": "Test",
        "last_name": "User",
        "agree_terms": True,
        "agree_privacy": True,
        "agree_health_processing": True,
        "opt_in_marketing": False,
    })
    assert res.status_code == 200
    data = res.json()
    token = data["tokens"]["access_token"]
    return {
        "email": email,
        "password": pwd,
        "user_id": data["user"]["id"],
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
    }


def test_public_policies():
    """Verify policies and real third-party service disclosures are accessible publicly without auth."""
    res = client.get("/api/v1/privacy/policies")
    assert res.status_code == 200
    data = res.json()
    assert "policies" in data
    assert "third_party_services" in data
    assert "privacy_contact" in data

    policy_types = [p["policy_type"] for p in data["policies"]]
    assert "terms" in policy_types
    assert "privacy_policy" in policy_types
    assert "medical_disclaimer" in policy_types
    assert "ai_data_processing" in policy_types
    assert "cookie_policy" in policy_types

    services = [s["name"] for s in data["third_party_services"]]
    assert any("Groq" in s for s in services)
    assert any("ChromaDB" in s for s in services)
    assert any("Brevo" in s or "SMTP" in s for s in services)
    assert any("Firebase" in s for s in services)
    assert any("LocalStorage" in s for s in services)


def test_registration_consent_lifecycle():
    """Verify registration creates explicit consent records and user can grant/withdraw optional consents."""
    user = create_test_user("consent")

    # 1. Get status
    res = client.get("/api/v1/privacy/consent", headers=user["headers"])
    assert res.status_code == 200
    data = res.json()
    active_types = data["active_types"]
    assert "terms" in active_types
    assert "privacy_policy" in active_types
    assert "health_data_processing" in active_types
    assert len(data["missing_required"]) == 0

    # 2. Grant optional AI processing
    res = client.post("/api/v1/privacy/consent", json={"consent_type": "ai_processing"}, headers=user["headers"])
    assert res.status_code == 200
    item = res.json()
    assert item["consent_type"] == "ai_processing"
    assert item["status"] == "granted"

    # 3. Withdraw AI processing
    res = client.post("/api/v1/privacy/consent/withdraw", json={"consent_type": "ai_processing", "reason": "User opt-out"}, headers=user["headers"])
    assert res.status_code == 200
    revoked = res.json()
    assert revoked["status"] == "revoked"
    assert revoked["revoked_at"] is not None


def test_data_export_isolation():
    """Verify data export contains user's own data and is strictly isolated (no IDOR)."""
    user1 = create_test_user("exp1")
    user2 = create_test_user("exp2")

    # Export user1
    res1 = client.get("/api/v1/privacy/export", headers=user1["headers"])
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["user_profile"]["email"] == user1["email"]
    assert data1["user_profile"]["id"] == user1["user_id"]

    # Export user2
    res2 = client.get("/api/v1/privacy/export", headers=user2["headers"])
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["user_profile"]["email"] == user2["email"]

    # Verify no leak between users
    assert data1["user_profile"]["id"] != data2["user_profile"]["id"]
    assert user2["email"] not in str(data1)
    assert user1["email"] not in str(data2)


def test_selective_data_deletion_security():
    """Verify data deletion requires valid password re-authentication."""
    user = create_test_user("del_data")

    # Bad password must fail with 401
    bad_res = client.post("/api/v1/privacy/delete-data", json={
        "password": "WrongPassword123!",
        "delete_scope": "notifications",
    }, headers=user["headers"])
    assert bad_res.status_code == 401

    # Good password succeeds
    ok_res = client.post("/api/v1/privacy/delete-data", json={
        "password": user["password"],
        "delete_scope": "notifications",
    }, headers=user["headers"])
    assert ok_res.status_code == 200
    assert ok_res.json()["success"] is True


def test_account_deletion_flow():
    """Verify account deletion verifies password and confirmation, cascades data, and revokes access."""
    user = create_test_user("del_acc")

    # Invalid confirmation string
    bad_conf = client.post("/api/v1/privacy/delete-account", json={
        "password": user["password"],
        "confirmation": "NO",
    }, headers=user["headers"])
    assert bad_conf.status_code == 400

    # Wrong password
    bad_pwd = client.post("/api/v1/privacy/delete-account", json={
        "password": "WrongPassword",
        "confirmation": "DELETE",
    }, headers=user["headers"])
    assert bad_pwd.status_code == 401

    # Valid deletion
    del_res = client.post("/api/v1/privacy/delete-account", json={
        "password": user["password"],
        "confirmation": "DELETE",
    }, headers=user["headers"])
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Subsequent API calls with old token must be 401 Unauthorized
    revoked_res = client.get("/api/v1/privacy/consent", headers=user["headers"])
    assert revoked_res.status_code == 401
