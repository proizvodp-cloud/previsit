from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from models.base import TimestampMixin


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Recipient: doctor_id or patient_id — one must be set
    doctor_id: Mapped[int | None] = mapped_column(ForeignKey("doctors.id"))
    patient_id: Mapped[int | None] = mapped_column(ForeignKey("patients.id"))
    # sms | email | push
    channel: Mapped[str] = mapped_column(String(20), nullable=False)
    # intake_reminder | case_ready | appointment_confirm
    notification_type: Mapped[str] = mapped_column(String(50), nullable=False)
    subject: Mapped[str | None] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(Text, nullable=False)
    # pending | sent | failed
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text)
