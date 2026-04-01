from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from models.base import TimestampMixin

if TYPE_CHECKING:
    from models.appointment import Appointment
    from models.intake_template import IntakeTemplate
    from models.case import Case
    from models.chat_message import ChatMessage


class IntakeSession(Base, TimestampMixin):
    __tablename__ = "intake_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    appointment_id: Mapped[int] = mapped_column(
        ForeignKey("appointments.id"), nullable=False, unique=True
    )
    template_id: Mapped[int] = mapped_column(
        ForeignKey("intake_templates.id"), nullable=False
    )
    # not_started | in_progress | completed
    status: Mapped[str] = mapped_column(
        String(20), default="not_started", nullable=False
    )
    # Collected answers: {question_id: answer_value}
    answers: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    appointment: Mapped["Appointment"] = relationship(
        "Appointment", back_populates="intake_session"
    )
    template: Mapped["IntakeTemplate"] = relationship(
        "IntakeTemplate", back_populates="sessions"
    )
    case: Mapped["Case | None"] = relationship(
        "Case", back_populates="intake_session", uselist=False
    )
    messages: Mapped[list["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="session", order_by="ChatMessage.created_at"
    )
