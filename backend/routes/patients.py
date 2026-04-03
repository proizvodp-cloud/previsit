"""
Patients endpoints — update patient info.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from deps import get_current_doctor
from models.doctor import Doctor
from models.patient import Patient

router = APIRouter()


class PatientUpdate(BaseModel):
    first_name: str
    last_name: str
    phone: str | None = None
    email: str | None = None


@router.patch("/{patient_id}")
async def update_patient(
    patient_id: int,
    body: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    _: Doctor = Depends(get_current_doctor),
):
    """Update patient contact info."""
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if patient is None:
        raise HTTPException(status_code=404, detail="Пациент не найден")

    patient.first_name = body.first_name.strip()
    patient.last_name = body.last_name.strip()
    patient.phone = body.phone.strip() if body.phone and body.phone.strip() else None
    patient.email = body.email.strip() if body.email and body.email.strip() else None
    await db.commit()
    return {
        "id": patient_id,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "phone": patient.phone,
        "email": patient.email,
    }
