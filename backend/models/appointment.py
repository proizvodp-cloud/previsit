import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from models.base import TimestampMixin

if TYPE_CHECKING:
    from models.doctor import Doctor
    from models.patient import Patient
    from models.intake_session import IntakeSession


class Appointment(Base, TimestampMixin):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id"), nullable=False)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    # Token in URL for passwordless patient access
    invite_token: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False,
        default=lambda: uuid.uuid4().hex,
    )
    # pending | in_progress | completed | cancelled
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="appointments")
    patient: Mapped["Patient"] = relationship("Patient", back_populates="appointments")
    intake_session: Mapped["IntakeSession | None"] = relationship(
        "IntakeSession", back_populates="appointment", uselist=False
    )
