from pydantic import BaseModel, Field

from app.schemas.common import ChatMessageOut


class AskPayload(BaseModel):
    role: str = Field(pattern="offspring|parent")
    parent_id: str
    message: str = Field(min_length=1)
    history: list[dict] = []


class ChatReply(BaseModel):
    reply: ChatMessageOut
