"""
Cases endpoints — doctor-facing, access by case_id.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models.case import Case
from models.intake_session import IntakeSession
from models.appointment import Appointment
from schemas.case import CaseOut

router = APIRouter()


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

    dob_str = (
        patient.date_of_birth.isoformat() if patient.date_of_birth else None
    )

    return CaseOut(
        id=case.id,
        status=case.status,
        patient_first_name=patient.first_name,
        patient_last_name=patient.last_name,
        patient_date_of_birth=dob_str,
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
