from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from models.base import TimestampMixin

if TYPE_CHECKING:
    from models.intake_session import IntakeSession


class ChatMessage(Base, TimestampMixin):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("intake_sessions.id"), nullable=False
    )
    # patient | bot
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    # question_id this message relates to (if applicable)
    question_id: Mapped[str | None] = mapped_column(String(100))

    session: Mapped["IntakeSession"] = relationship(
        "IntakeSession", back_populates="messages"
    )
