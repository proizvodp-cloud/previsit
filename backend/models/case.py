from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from models.base import TimestampMixin

if TYPE_CHECKING:
    from models.doctor import Doctor
    from models.intake_session import IntakeSession
    from models.case_document import CaseDocument


class Case(Base, TimestampMixin):
    __tablename__ = "cases"

    id: Mapped[int] = mapped_column(primary_key=True)
    intake_session_id: Mapped[int] = mapped_column(
        ForeignKey("intake_sessions.id"), nullable=False, unique=True
    )
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id"), nullable=False)
    # AI-generated structured summary (complaint, history, etc.)
    summary: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict
    )
    # AI flags for doctor attention: [{flag, severity, reason}, ...]
    ai_flags: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    # plain text fallback
    raw_text: Mapped[str | None] = mapped_column(Text)
    # draft | ready | reviewed
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    doctor_notes: Mapped[str | None] = mapped_column(Text)

    intake_session: Mapped["IntakeSession"] = relationship(
        "IntakeSession", back_populates="case"
    )
    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="cases")
    documents: Mapped[list["CaseDocument"]] = relationship(
        "CaseDocument", back_populates="case"
    )
