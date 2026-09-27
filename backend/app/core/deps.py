"""FastAPI dependencies: auth, parent/offspring context, family resolution."""
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models import Family, FamilyMember, Parent, User

bearer_scheme = HTTPBearer(auto_error=False)


def _extract_subject(
    credentials: HTTPAuthorizationCredentials | None,
    token_type: str,
) -> tuple[str, str]:
    """Return (subject, kind). Raises 401 if missing/invalid."""
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(credentials.credentials, token_type)  # type: ignore[arg-type]
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload["sub"], payload.get("kind", "user")


def get_principal(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> tuple[str, str]:
    """Return (subject_id, kind) for any valid access token (user or parent)."""
    return _extract_subject(credentials, "access")


def get_current_user_id(
    principal: tuple[str, str] = Depends(get_principal),
) -> str:
    subject, kind = principal
    if kind != "user":
        raise HTTPException(status_code=401, detail="User token required")
    return subject


def get_current_parent_id(
    principal: tuple[str, str] = Depends(get_principal),
) -> str:
    subject, kind = principal
    if kind != "parent":
        raise HTTPException(status_code=401, detail="Parent token required")
    return subject


def get_current_user(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> User:
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


def get_current_parent(
    parent_id: str = Depends(get_current_parent_id),
    db: Session = Depends(get_db),
) -> Parent:
    parent = db.get(Parent, parent_id)
    if parent is None or not parent.is_active:
        raise HTTPException(status_code=401, detail="Parent not found or inactive")
    return parent


def get_authenticated_parent(
    parent_id: str = Depends(get_current_parent_id),
    db: Session = Depends(get_db),
) -> Parent:
    """Returns the authenticated parent even while their invitation is still
    pending (is_active=False), so they can complete OTP activation."""
    parent = db.get(Parent, parent_id)
    if parent is None:
        raise HTTPException(status_code=401, detail="Parent not found")
    return parent


def get_current_family(
    principal: tuple[str, str] = Depends(get_principal),
    db: Session = Depends(get_db),
) -> Family:
    subject, kind = principal
    if kind == "user":
        membership = (
            db.query(FamilyMember)
            .filter(FamilyMember.user_id == subject, FamilyMember.is_active.is_(True))
            .first()
        )
    else:
        parent = db.get(Parent, subject)
        if parent is None:
            raise HTTPException(status_code=404, detail="Parent not found")
        membership = (
            db.query(FamilyMember)
            .filter(FamilyMember.family_id == parent.family_id, FamilyMember.is_active.is_(True))
            .first()
        )
    if membership is None:
        raise HTTPException(status_code=404, detail="No family found for this user")
    family = db.get(Family, membership.family_id)
    if family is None:
        raise HTTPException(status_code=404, detail="Family not found")
    return family


def get_current_user_or_parent(
    principal: tuple[str, str] = Depends(get_principal),
    db: Session = Depends(get_db),
) -> User | Parent:
    subject, kind = principal
    if kind == "user":
        user = db.get(User, subject)
        if user is None or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found or inactive")
        return user
    parent = db.get(Parent, subject)
    if parent is None or not parent.is_active:
        raise HTTPException(status_code=401, detail="Parent not found or inactive")
    return parent


def get_family_id(db: Session, principal: User | Parent) -> str | None:
    """Return the family id for a user or parent principal, if any."""
    if isinstance(principal, Parent):
        return principal.family_id
    membership = (
        db.query(FamilyMember)
        .filter(FamilyMember.user_id == principal.id, FamilyMember.is_active.is_(True))
        .first()
    )
    return membership.family_id if membership else None


def get_family_parent_ids(db: Session, principal: User | Parent) -> list[str]:
    """Return active parent ids in the principal's family."""
    family_id = get_family_id(db, principal)
    if family_id is None:
        return []
    rows = (
        db.query(Parent.id)
        .filter(Parent.family_id == family_id, Parent.is_active.is_(True))
        .all()
    )
    return [row[0] for row in rows]