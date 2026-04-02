"""
Appointments endpoints — list appointments + send invite email.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models.appointment import Appointment
from models.intake_session import IntakeSession
from schemas.appointment import AppointmentListItem
from services import email_service

router = APIRouter()


@router.get("", response_model=list[AppointmentListItem])
async def list_appointments(db: AsyncSession = Depends(get_db)):
    """List all appointments with their intake status."""
    result = await db.execute(
        select(Appointment)
        .options(
            selectinload(Appointment.patient),
            selectinload(Appointment.doctor),
            selectinload(Appointment.intake_session).selectinload(IntakeSession.case),
        )
        .order_by(Appointment.scheduled_at.desc())
    )
    appointments = result.scalars().all()

    items = []
    for appt in appointments:
        session = appt.intake_session
        intake_status = session.status if session else None
        case_id = session.case.id if (session and session.case) else None

        items.append(AppointmentListItem(
            id=appt.id,
            invite_token=appt.invite_token,
            patient_id=appt.patient_id,
            status=appt.status,
            patient_first_name=appt.patient.first_name,
            patient_last_name=appt.patient.last_name,
            patient_email=appt.patient.email,
            patient_phone=appt.patient.phone,
            doctor_first_name=appt.doctor.first_name,
            doctor_last_name=appt.doctor.last_name,
            scheduled_at=appt.scheduled_at,
            intake_status=intake_status,
            case_id=case_id,
        ))
    return items


@router.post("/{appointment_id}/send-invite")
async def send_invite(appointment_id: int, db: AsyncSession = Depends(get_db)):
    """Send intake invite link to patient email."""
    result = await db.execute(
        select(Appointment)
        .options(
            selectinload(Appointment.patient),
            selectinload(Appointment.doctor),
        )
        .where(Appointment.id == appointment_id)
    )
    appt = result.scalar_one_or_none()
    if appt is None:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    if not appt.patient.email:
        raise HTTPException(status_code=400, detail="У пациента не указан email")

    await email_service.send_invite(
        to_email=appt.patient.email,
        patient_name=appt.patient.first_name,
        doctor_name=f"{appt.doctor.first_name} {appt.doctor.last_name}",
        scheduled_at=appt.scheduled_at,
        invite_token=appt.invite_token,
    )
    return {"status": "sent", "to": appt.patient.email}
