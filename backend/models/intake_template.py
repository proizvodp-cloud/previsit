from typing import TYPE_CHECKING, Any

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from models.base import TimestampMixin

if TYPE_CHECKING:
    from models.intake_session import IntakeSession


class IntakeTemplate(Base, TimestampMixin):
    __tablename__ = "intake_templates"

    id: Mapped[int] = mapped_column(primary_key=True)
    # e.g. "therapist", "cardiologist"
    specialty: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    # List of question objects: [{id, text, type, options, required}, ...]
    questions: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    sessions: Mapped[list["IntakeSession"]] = relationship(
        "IntakeSession", back_populates="template"
    )
