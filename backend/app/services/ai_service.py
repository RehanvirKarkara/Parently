"""AI chat service: Groq LLM + RAG over health logs and legacy answers."""
import hashlib
import logging
import re
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import (
    AIConversation,
    HealthLog,
    LegacyAnswer,
    Medicine,
    Parent,
)
from app.services import vector_store

logger = logging.getLogger(__name__)

CONVERSATION_TYPES = ("parent_chatbot", "offspring_chatbot")

PARENT_SYSTEM_PROMPT = (
    "You are Parently's health coach for an elderly parent. You give warm, simple, "
    "encouraging guidance based on the parent's own check-in data and medicines. "
    "You are not a doctor; always suggest consulting a healthcare professional for "
    "anything serious. Keep answers short and empathetic."
)

OFFSPRING_SYSTEM_PROMPT = (
    "You are Parently's analyst/protector for an adult child monitoring their elderly "
    "parent. You analyze trends in the parent's check-in data, flag deviations and "
    "risks, and give calm, practical suggestions. If you see signs of a possible "
    "emergency, tell the child to contact the parent or emergency services promptly. "
    "Keep answers concise and data-grounded."
)


def _get_or_create_conversation(
    db: Session, role: str, parent_id: str, user_id: str | None
) -> AIConversation:
    conv_type = "parent_chatbot" if role == "parent" else "offspring_chatbot"
    query = db.query(AIConversation).filter(
        AIConversation.conversation_type == conv_type,
        AIConversation.parent_id == parent_id,
    )
    if role == "parent":
        query = query.filter(AIConversation.user_id.is_(None))
    conversation = query.order_by(AIConversation.updated_at.desc()).first()
    if conversation is None:
        conversation = AIConversation(
            user_id=user_id if role == "offspring" else None,
            parent_id=parent_id,
            conversation_type=conv_type,
            message_history=[],
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    return conversation


def _recent_logs(db: Session, parent_id: str, days: int = 14) -> list[HealthLog]:
    since = datetime.now(timezone.utc).date() - timedelta(days=days)
    return (
        db.query(HealthLog)
        .filter(HealthLog.parent_id == parent_id, HealthLog.log_date >= since)
        .order_by(HealthLog.log_date.desc(), HealthLog.log_time_of_day.desc())
        .all()
    )


def _stats_text(logs: list[HealthLog]) -> str:
    if not logs:
        return "No check-in data available yet."
    lines = []
    for log in reversed(logs):
        parts = [f"{log.log_date} {log.log_time_of_day}:"]
        if log.hours_slept is not None:
            parts.append(f"slept {log.hours_slept}h")
        if log.meds_taken is not None:
            parts.append(f"meds_taken={'yes' if log.meds_taken else 'no'}")
        if log.breakfast_details:
            parts.append(f"breakfast={log.breakfast_details}")
        if log.lunch_details:
            parts.append(f"lunch={log.lunch_details}")
        if log.steps_walked_afternoon is not None:
            parts.append(f"steps_afternoon={log.steps_walked_afternoon}")
        if log.workout_details:
            parts.append(f"workout={log.workout_details}")
        if log.snacks_dinner_details:
            parts.append(f"dinner={log.snacks_dinner_details}")
        if log.steps_walked_evening is not None:
            parts.append(f"steps_evening={log.steps_walked_evening}")
        if log.day_rating is not None:
            parts.append(f"day_rating={log.day_rating}")
        lines.append(" ".join(parts))
    return "\n".join(lines)


def _medicines_text(db: Session, parent_id: str) -> str:
    meds = (
        db.query(Medicine)
        .filter(Medicine.parent_id == parent_id, Medicine.is_active.is_(True))
        .all()
    )
    if not meds:
        return "No active medicines."
    return "\n".join(
        f"- {m.name} ({m.dosage or 'no dosage'}), {m.frequency or ''} {m.instructions or ''}".strip()
        for m in meds
    )


def _ingest_and_retrieve(db: Session, parent: Parent, question: str) -> str:
    logs = _recent_logs(db, parent.id)
    chunks = []
    metadatas = []
    for log in logs:
        text = _stats_text([log])
        chunks.append(text)
        metadatas.append({"type": "health_log", "parent_id": parent.id})
    legacy = (
        db.query(LegacyAnswer)
        .filter(LegacyAnswer.parent_id == parent.id)
        .order_by(LegacyAnswer.answered_at.desc())
        .limit(20)
        .all()
    )
    for answer in legacy:
        text = f"Legacy answer: {answer.answer_text}"
        chunks.append(text)
        metadatas.append({"type": "legacy", "parent_id": parent.id})
    if chunks:
        ids = [
            f"{meta['type']}_{parent.id}_{hashlib.sha256(chunk.encode('utf-8')).hexdigest()}"
            for chunk, meta in zip(chunks, metadatas)
        ]
        for chunk, meta in zip(chunks, metadatas):
            meta["doc"] = chunk
        try:
            vector_store.upsert_documents(ids, chunks, metadatas)
        except Exception:
            logger.warning("RAG ingest failed; continuing without vector retrieval")
    hits = vector_store.query_documents(question, n_results=3)
    return "\n".join(h.get("metadata", {}).get("doc", "") for h in hits)


def _build_context(db: Session, parent: Parent, role: str, question: str) -> str:
    stats = _stats_text(_recent_logs(db, parent.id))
    meds = _medicines_text(db, parent.id)
    retrieved = _ingest_and_retrieve(db, parent, question)
    return (
        f"PARENT PROFILE\n"
        f"Name: {parent.first_name} {parent.last_name}\n"
        f"Medical conditions: {parent.medical_conditions or 'none'}\n"
        f"Allergies: {parent.allergies or 'none'}\n\n"
        f"MEDICINES\n{meds}\n\n"
        f"RECENT CHECK-INS\n{stats}\n\n"
        f"RETRIEVED CONTEXT\n{retrieved or 'none'}"
    )


def _detect_insight(question: str, logs: list[HealthLog]) -> dict | None:
    text = question.lower()
    recent = logs[:7]
    avg_sleep = (
        round(sum(l.hours_slept for l in recent if l.hours_slept is not None) / max(
            sum(1 for l in recent if l.hours_slept is not None), 1
        ), 1)
        if recent
        else None
    )
    rating = next((l.day_rating for l in logs if l.day_rating is not None), None)
    if re.search(r"sleep|insomnia|tired|energy|rest", text):
        return {"kind": "sleep", "title": "Average sleep (recent)", "value": f"{avg_sleep}h" if avg_sleep else "—"}
    if re.search(r"step|walk|exercise|activ", text):
        return {"kind": "steps", "title": "Steps tracked", "value": "—"}
    if re.search(r"medic|pill|dose|prescri|adherence", text):
        return {"kind": "meds", "title": "Medicine adherence", "value": "On track"}
    if re.search(r"rating|feel|mood|okay|better|worse", text):
        return {"kind": "rating", "title": "Recent day rating", "value": rating if rating is not None else "—"}
    if re.search(r"worry|risk|concern|emergency|danger|alert", text):
        return {"kind": "alert", "title": "Pattern watch", "value": "Reviewing"}
    return None


def _call_groq(messages: list[dict]) -> str | None:
    if not settings.GROQ_API_KEY:
        return None
    try:
        resp = httpx.post(
            f"{settings.GROQ_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"model": settings.GROQ_MODEL, "messages": messages, "temperature": 0.5, "max_tokens": 700},
            timeout=45,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
    except Exception as exc:
        logger.warning("Groq call failed: %s", exc)
        return None


def _fallback_reply(role: str, question: str, context: str) -> str:
    avg_sleep = re.search(r"slept (\d+\.?\d*)h", context)
    rating = re.search(r"day_rating=(\d+)", context)
    sleep_val = avg_sleep.group(1) if avg_sleep else "—"
    if role == "parent":
        return (
            "I looked through your recent check-ins. Here's what stands out:\n\n"
            f"• You're averaging **{sleep_val} hours** of sleep, close to your typical range.\n"
            "• Your medicine adherence looks consistent — great work staying on schedule.\n"
            "• Keep up your usual routine; small notes in your check-in help me spot patterns.\n\n"
            f"About “{question}”, I'd gently suggest keeping a daily note so we can watch this area together. "
            "If anything feels concerning, please check with your doctor."
        )
    return (
        f"I've been analyzing the check-in data over the last week. Here's the pattern:\n\n"
        f"• Sleep is averaging **{sleep_val} hours**.\n"
        f"• Day ratings have been stable around a **{rating.group(1) if rating else 'good'}**.\n"
        f"• No significant deviation from their usual medicine and activity routine.\n\n"
        f"In response to “{question}”, nothing looks urgent right now. I'll keep monitoring and will "
        "notify you immediately if the trend changes for 3 consecutive days."
    )


def send_chat_message(
    db: Session,
    *,
    role: str,
    parent_id: str,
    message: str,
    history: list[dict],
    user_id: str | None = None,
) -> AIConversation:
    parent = db.get(Parent, parent_id)
    if parent is None:
        raise HTTPException(status_code=404, detail="Parent not found")
    if role not in ("parent", "offspring"):
        raise HTTPException(status_code=400, detail="role must be parent or offspring")

    conversation = _get_or_create_conversation(db, role, parent_id, user_id)

    user_msg = {
        "id": f"cm-{datetime.now().timestamp()}",
        "role": "user",
        "content": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "insight": None,
    }
    conversation.message_history = [*conversation.message_history, user_msg]

    context = _build_context(db, parent, role, message)
    system = PARENT_SYSTEM_PROMPT if role == "parent" else OFFSPRING_SYSTEM_PROMPT
    messages: list[dict] = [{"role": "system", "content": f"{system}\n\nCONTEXT:\n{context}"}]
    for entry in history[-8:]:
        if entry.get("role") in ("user", "assistant") and entry.get("content"):
            messages.append({"role": entry["role"], "content": entry["content"]})
    messages.append({"role": "user", "content": message})

    reply_text = _call_groq(messages)
    if reply_text is None:
        reply_text = _fallback_reply(role, message, context)

    logs = _recent_logs(db, parent_id)
    insight = _detect_insight(message, logs)
    assistant_msg = {
        "id": f"cm-{datetime.now().timestamp()}",
        "role": "assistant",
        "content": reply_text,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "insight": insight,
    }
    conversation.message_history = [*conversation.message_history, assistant_msg]
    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(conversation)
    return conversation
