"""
Cases endpoints — doctor-facing, access by case_id.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models.case import Case
from models.intake_session import IntakeSession
from models.appointment import Appointment
from schemas.case import CaseOut, CaseListItem, ReviewRequest

router = APIRouter()


@router.get("/", response_model=list[CaseListItem])
async def list_cases(db: AsyncSession = Depends(get_db)):
    """List all cases for doctor dashboard."""
    result = await db.execute(
        select(Case)
        .options(
            selectinload(Case.intake_session)
            .selectinload(IntakeSession.appointment)
            .selectinload(Appointment.patient),
            selectinload(Case.doctor),
        )
        .order_by(Case.created_at.desc())
    )
    cases = result.scalars().all()

    return [
        CaseListItem(
            id=case.id,
            status=case.status,
            patient_first_name=case.intake_session.appointment.patient.first_name,
            patient_last_name=case.intake_session.appointment.patient.last_name,
            doctor_first_name=case.doctor.first_name,
            doctor_last_name=case.doctor.last_name,
            scheduled_at=case.intake_session.appointment.scheduled_at,
            ai_flags_count=len(case.ai_flags),
            created_at=case.created_at,
        )
        for case in cases
    ]


@router.patch("/{case_id}/review")
async def review_case(
    case_id: int,
    body: ReviewRequest,
    db: AsyncSession = Depends(get_db),
):
    """Mark case as reviewed and optionally save doctor notes."""
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    if case is None:
        raise HTTPException(status_code=404, detail="Кейс не найден")

    case.status = "reviewed"
    case.reviewed_at = datetime.now(timezone.utc)
    if body.doctor_notes is not None:
        case.doctor_notes = body.doctor_notes

    await db.commit()
    return {"id": case_id, "status": "reviewed"}


@router.get("/{case_id}", response_model=CaseOut)
async def get_case(case_id: int, db: AsyncSession = Depends(get_db)):
    """Get case details for doctor view."""
    result = await db.execute(
        select(Case)
        .options(
            selectinload(Case.intake_session)
            .selectinload(IntakeSession.appointment)
            .selectinload(Appointment.patient),
            selectinload(Case.doctor),
        )
        .where(Case.id == case_id)
    )
    case = result.scalar_one_or_none()

    if case is None:
        raise HTTPException(status_code=404, detail="Кейс не найден")

    appointment = case.intake_session.appointment
    patient = appointment.patient

    return CaseOut(
        id=case.id,
        status=case.status,
        patient_first_name=patient.first_name,
        patient_last_name=patient.last_name,
        patient_date_of_birth=(
            patient.date_of_birth.isoformat() if patient.date_of_birth else None
        ),
        doctor_first_name=case.doctor.first_name,
        doctor_last_name=case.doctor.last_name,
        scheduled_at=appointment.scheduled_at,
        summary=case.summary,
        ai_flags=case.ai_flags,
        raw_text=case.raw_text,
        doctor_notes=case.doctor_notes,
        reviewed_at=case.reviewed_at,
        created_at=case.created_at,
    )
