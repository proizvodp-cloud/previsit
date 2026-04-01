"""
Intake flow endpoints — patient-facing, no auth, access by invite_token.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models.appointment import Appointment
from models.case import Case
from models.intake_session import IntakeSession
from models.intake_template import IntakeTemplate
from schemas.intake import AnswerIn, AnswerOut, CompleteOut, IntakeInfoOut, StartOut
from services.ai_service import generate_case

router = APIRouter()


async def _load_by_token(
    token: str, db: AsyncSession
) -> tuple[Appointment, IntakeSession]:
    """
    Load appointment + intake session by invite_token.
    Creates the session lazily if it doesn't exist yet.
    Returns (appointment, session) — both fully loaded, no lazy access needed.
    """
    result = await db.execute(
        select(Appointment)
        .options(
            selectinload(Appointment.intake_session).options(
                selectinload(IntakeSession.template),
                selectinload(IntakeSession.case),
            ),
            selectinload(Appointment.doctor),
            selectinload(Appointment.patient),
        )
        .where(Appointment.invite_token == token)
    )
    appointment = result.scalar_one_or_none()

    if appointment is None:
        raise HTTPException(status_code=404, detail="Ссылка недействительна")

    if appointment.status == "cancelled":
        raise HTTPException(status_code=410, detail="Запись отменена")

    # Lazy session creation: if session doesn't exist, create it now
    if appointment.intake_session is None:
        template_result = await db.execute(
            select(IntakeTemplate)
            .where(IntakeTemplate.specialty == "therapist")
            .where(IntakeTemplate.is_active == True)
        )
        template = template_result.scalar_one_or_none()

        if template is None:
            raise HTTPException(
                status_code=500,
                detail="Шаблон анкеты не найден. Обратитесь в клинику.",
            )

        intake_session = IntakeSession(
            appointment_id=appointment.id,
            template_id=template.id,
            status="not_started",
            answers={},
        )
        db.add(intake_session)
        await db.flush()
        await db.refresh(intake_session, ["template"])
        appointment.intake_session = intake_session

    return appointment, appointment.intake_session


@router.get("/{token}", response_model=IntakeInfoOut)
async def get_intake(token: str, db: AsyncSession = Depends(get_db)):
    """Get intake session info and questions by invite token."""
    appointment, session = await _load_by_token(token, db)

    return IntakeInfoOut(
        session_id=session.id,
        status=session.status,
        patient_first_name=appointment.patient.first_name,
        patient_last_name=appointment.patient.last_name,
        doctor_first_name=appointment.doctor.first_name,
        doctor_last_name=appointment.doctor.last_name,
        doctor_specialty=appointment.doctor.specialty,
        scheduled_at=appointment.scheduled_at,
        questions=session.template.questions,
        answers=session.answers,
        started_at=session.started_at,
        completed_at=session.completed_at,
    )


@router.post("/{token}/start", response_model=StartOut)
async def start_intake(token: str, db: AsyncSession = Depends(get_db)):
    """Mark intake session as started."""
    _appointment, session = await _load_by_token(token, db)

    if session.status == "completed":
        raise HTTPException(status_code=409, detail="Анкета уже заполнена")

    if session.status == "not_started":
        session.status = "in_progress"
        session.started_at = datetime.now(timezone.utc)

    return StartOut(session_id=session.id, status=session.status)


@router.post("/{token}/answer", response_model=AnswerOut)
async def save_answer(
    token: str, body: AnswerIn, db: AsyncSession = Depends(get_db)
):
    """Save a single answer to the intake session."""
    _appointment, session = await _load_by_token(token, db)

    if session.status == "completed":
        raise HTTPException(status_code=409, detail="Анкета уже завершена")

    if session.status == "not_started":
        raise HTTPException(
            status_code=400, detail="Сначала начните анкету (/start)"
        )

    # Validate that question_id exists in the template
    question_ids = {q["id"] for q in session.template.questions}
    if body.question_id not in question_ids:
        raise HTTPException(
            status_code=400, detail=f"Вопрос '{body.question_id}' не найден в анкете"
        )

    # JSONB field requires explicit reassignment to trigger SQLAlchemy change detection
    updated_answers = dict(session.answers)
    updated_answers[body.question_id] = body.answer
    session.answers = updated_answers

    return AnswerOut(
        session_id=session.id,
        question_id=body.question_id,
        saved=True,
    )


@router.post("/{token}/complete", response_model=CompleteOut)
async def complete_intake(token: str, db: AsyncSession = Depends(get_db)):
    """Complete intake session and trigger AI case generation."""
    appointment, session = await _load_by_token(token, db)

    if session.status == "completed":
        if session.case is not None:
            return CompleteOut(case_id=session.case.id, status=session.case.status)
        raise HTTPException(status_code=409, detail="Анкета уже завершена")

    if session.status == "not_started":
        raise HTTPException(
            status_code=400, detail="Сначала начните анкету (/start)"
        )

    # Mark session as completed
    session.status = "completed"
    session.completed_at = datetime.now(timezone.utc)
    appointment.status = "completed"

    # Generate AI case (may take a few seconds)
    summary, ai_flags, raw_text = await generate_case(
        questions=session.template.questions,
        answers=session.answers,
    )

    case = Case(
        intake_session_id=session.id,
        doctor_id=appointment.doctor_id,
        summary=summary,
        ai_flags=ai_flags,
        raw_text=raw_text,
        status="ready" if summary else "draft",
    )
    db.add(case)
    await db.flush()

    return CompleteOut(case_id=case.id, status=case.status)
