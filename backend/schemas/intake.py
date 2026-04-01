from datetime import datetime
from typing import Any

from pydantic import BaseModel


class QuestionOut(BaseModel):
    id: str
    text: str
    type: str  # text | choice | multi_choice | number | boolean
    options: list[str] | None
    required: bool


class IntakeInfoOut(BaseModel):
    """Response for GET /api/intake/{token}"""
    session_id: int
    status: str  # not_started | in_progress | completed
    patient_first_name: str
    patient_last_name: str
    doctor_first_name: str
    doctor_last_name: str
    doctor_specialty: str | None
    scheduled_at: datetime
    questions: list[QuestionOut]
    answers: dict[str, Any]
    started_at: datetime | None
    completed_at: datetime | None


class StartOut(BaseModel):
    """Response for POST /api/intake/{token}/start"""
    session_id: int
    status: str


class AnswerIn(BaseModel):
    """Request for POST /api/intake/{token}/answer"""
    question_id: str
    answer: Any


class AnswerOut(BaseModel):
    """Response for POST /api/intake/{token}/answer"""
    session_id: int
    question_id: str
    saved: bool


class CompleteOut(BaseModel):
    """Response for POST /api/intake/{token}/complete"""
    case_id: int
    status: str
