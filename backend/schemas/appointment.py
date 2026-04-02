from datetime import datetime

from pydantic import BaseModel


class AppointmentListItem(BaseModel):
    """Appointment info for dashboard list."""
    id: int
    invite_token: str
    patient_id: int
    status: str  # pending | in_progress | completed | cancelled
    patient_first_name: str
    patient_last_name: str
    patient_email: str | None
    patient_phone: str | None
    doctor_first_name: str
    doctor_last_name: str
    scheduled_at: datetime
    intake_status: str | None  # not_started | in_progress | completed | None
    case_id: int | None
