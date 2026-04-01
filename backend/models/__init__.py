# Import all models so Alembic autogenerate can detect them
from models.clinic import Clinic
from models.doctor import Doctor
from models.patient import Patient
from models.appointment import Appointment
from models.intake_template import IntakeTemplate
from models.intake_session import IntakeSession
from models.case import Case
from models.case_document import CaseDocument
from models.chat_message import ChatMessage
from models.notification import Notification

__all__ = [
    "Clinic",
    "Doctor",
    "Patient",
    "Appointment",
    "IntakeTemplate",
    "IntakeSession",
    "Case",
    "CaseDocument",
    "ChatMessage",
    "Notification",
]
