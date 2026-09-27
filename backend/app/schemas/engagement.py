from pydantic import BaseModel, Field


class QuizAnswerCreate(BaseModel):
    quiz_question_id: str
    family_member_id: str
    answer_text: str = Field(min_length=1)


class LegacyAnswerCreate(BaseModel):
    parent_id: str
    question_text: str = Field(min_length=1)
    answer_text: str = Field(min_length=1)
