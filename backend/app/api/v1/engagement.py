from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user_or_parent, get_family_parent_ids
from app.models import FamilyMember, LegacyAnswer, LegacyQuestion, Parent, QuizAnswer, QuizQuestion, User
from app.schemas import (
    LegacyAnswerCreate,
    LegacyAnswerOut,
    LegacyQuestionOut,
    QuizAnswerCreate,
    QuizAnswerOut,
    QuizQuestionOut,
    SuccessResponse,
)

router = APIRouter(prefix="/quiz", tags=["engagement"])


@router.get("/questions", response_model=list[QuizQuestionOut])
def get_quiz_questions(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=500, ge=1, le=1000),
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    return db.query(QuizQuestion).order_by(QuizQuestion.id).offset(skip).limit(limit).all()


@router.get("/answers", response_model=list[QuizAnswerOut])
def get_quiz_answers(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=500, ge=1, le=1000),
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    return db.query(QuizAnswer).order_by(QuizAnswer.answered_at.desc()).offset(skip).limit(limit).all()


@router.post("/answers", response_model=QuizAnswerOut)
def submit_quiz_answer(
    payload: QuizAnswerCreate,
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    question = db.get(QuizQuestion, payload.quiz_question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    member = db.get(FamilyMember, payload.family_member_id)
    if member is None or not member.is_active:
        raise HTTPException(status_code=404, detail="Family member not found")
    if isinstance(principal, User):
        user_membership = (
            db.query(FamilyMember)
            .filter(FamilyMember.user_id == principal.id, FamilyMember.is_active.is_(True))
            .first()
        )
        principal_family_id = user_membership.family_id if user_membership else None
    else:
        principal_family_id = principal.family_id
    if principal_family_id is None or member.family_id != principal_family_id:
        raise HTTPException(status_code=404, detail="Family member not found")
    answer = QuizAnswer(
        quiz_question_id=payload.quiz_question_id,
        family_member_id=payload.family_member_id,
        answer_text=payload.answer_text,
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)
    return answer


legacy_router = APIRouter(prefix="/legacy", tags=["legacy"])


@legacy_router.get("/questions/today", response_model=LegacyQuestionOut | None)
def get_today_legacy_question(
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    return db.query(LegacyQuestion).order_by(LegacyQuestion.created_at.desc()).first()


@legacy_router.get("/questions", response_model=list[LegacyQuestionOut])
def get_legacy_questions(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=500, ge=1, le=1000),
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    return db.query(LegacyQuestion).order_by(LegacyQuestion.created_at.desc()).offset(skip).limit(limit).all()


@legacy_router.get("/answers", response_model=list[LegacyAnswerOut])
def get_legacy_answers(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=500, ge=1, le=1000),
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    parent_ids = get_family_parent_ids(db, principal)
    return (
        db.query(LegacyAnswer)
        .filter(LegacyAnswer.parent_id.in_(parent_ids))
        .order_by(LegacyAnswer.answered_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@legacy_router.post("/answers", response_model=LegacyAnswerOut)
def submit_legacy_answer(
    payload: LegacyAnswerCreate,
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    if payload.parent_id not in get_family_parent_ids(db, principal):
        raise HTTPException(status_code=404, detail="Parent not found")
    question = db.query(LegacyQuestion).filter(
        LegacyQuestion.question_text == payload.question_text
    ).first()
    if question is None:
        question = LegacyQuestion(question_text=payload.question_text)
        db.add(question)
        db.commit()
        db.refresh(question)
    answer = LegacyAnswer(
        legacy_question_id=question.id,
        parent_id=payload.parent_id,
        answer_text=payload.answer_text,
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)
    return answer
