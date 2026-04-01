from datetime import datetime
from typing import Any

from pydantic import BaseModel


class CaseOut(BaseModel):
    """Response for GET /api/cases/{case_id}"""
    id: int
    status: str  # draft | ready | reviewed
    patient_first_name: str
    patient_last_name: str
    patient_date_of_birth: str | None
    doctor_first_name: str
    doctor_last_name: str
    scheduled_at: datetime
    summary: dict[str, Any]
    ai_flags: list[Any]
    raw_text: str | None
    doctor_notes: str | None
    reviewed_at: datetime | None
    created_at: datetime
