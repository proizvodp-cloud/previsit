"""
Patients endpoints — update patient contact info.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.patient import Patient

router = APIRouter()


class PhoneUpdate(BaseModel):
    phone: str


@router.patch("/{patient_id}/phone")
async def update_patient_phone(
    patient_id: int, body: PhoneUpdate, db: AsyncSession = Depends(get_db)
):
    """Update patient phone number."""
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if patient is None:
        raise HTTPException(status_code=404, detail="Пациент не найден")

    patient.phone = body.phone.strip() or None
    await db.commit()
    return {"id": patient_id, "phone": patient.phone}
