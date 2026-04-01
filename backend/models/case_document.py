from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from models.base import TimestampMixin

if TYPE_CHECKING:
    from models.case import Case


class CaseDocument(Base, TimestampMixin):
    __tablename__ = "case_documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), nullable=False)
    # Original filename
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    # Path on disk (relative to upload_dir)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    # MIME type
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    # photo | lab_result | prescription | other
    document_type: Mapped[str] = mapped_column(
        String(50), default="other", nullable=False
    )

    case: Mapped["Case"] = relationship("Case", back_populates="documents")
