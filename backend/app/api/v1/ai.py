from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user_or_parent
from app.models import AIConversation, Parent, User
from app.schemas import AskPayload, ChatReply
from app.schemas.common import AIConversationOut, ChatMessageOut
from app.services.ai_service import send_chat_message

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/conversations/{conversation_type}", response_model=AIConversationOut | None)
def get_conversation(
    conversation_type: str,
    db: Session = Depends(get_db),
    principal: User | Parent = Depends(get_current_user_or_parent),
):
    if conversation_type not in ("parent_chatbot", "offspring_chatbot"):
        raise HTTPException(status_code=400, detail="Invalid conversation type")
    query = db.query(AIConversation).filter(
        AIConversation.conversation_type == conversation_type
    )
    if isinstance(principal, Parent):
        query = query.filter(
            AIConversation.parent_id == principal.id,
            AIConversation.user_id.is_(None),
        )
    else:
        query = query.filter(AIConversation.user_id == principal.id)
    return query.order_by(AIConversation.updated_at.desc()).first()


@router.post("/chat", response_model=ChatReply)
def chat(
    payload: AskPayload,
    db: Session = Depends(get_db),
    principal: User | Parent = Depends(get_current_user_or_parent),
):
    if isinstance(principal, User) and payload.role != "offspring":
        raise HTTPException(status_code=403, detail="Offspring can only chat as an offspring")
    if isinstance(principal, Parent) and payload.role != "parent":
        raise HTTPException(status_code=403, detail="Parent can only chat as a parent")

    parent = db.get(Parent, payload.parent_id)
    if parent is None:
        raise HTTPException(status_code=404, detail="Parent not found")
    if isinstance(principal, Parent) and principal.id != payload.parent_id:
        raise HTTPException(status_code=403, detail="Not authorized for this parent")

    user_id = principal.id if isinstance(principal, User) else None
    conversation = send_chat_message(
        db,
        role=payload.role,
        parent_id=payload.parent_id,
        message=payload.message,
        history=payload.history,
        user_id=user_id,
    )
    last = conversation.message_history[-1] if conversation.message_history else None
    reply = ChatMessageOut(
        id=last["id"] if last else "",
        role=last["role"] if last else "assistant",
        content=last["content"] if last else "",
        timestamp=last["timestamp"] if last else datetime.now(timezone.utc).isoformat(),
        insight=last.get("insight") if last else None,
    )
    return ChatReply(reply=reply)
