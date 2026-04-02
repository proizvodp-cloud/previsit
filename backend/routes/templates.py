"""
Templates endpoint — list available intake questionnaire templates.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.intake_template import IntakeTemplate

router = APIRouter()


class TemplateListItem(BaseModel):
    id: int
    specialty: str
    name: str
    description: str | None
    questions_count: int


@router.get("", response_model=list[TemplateListItem])
async def list_templates(db: AsyncSession = Depends(get_db)):
    """List all available intake templates."""
    result = await db.execute(
        select(IntakeTemplate).order_by(IntakeTemplate.specialty)
    )
    templates = result.scalars().all()

    return [
        TemplateListItem(
            id=t.id,
            specialty=t.specialty,
            name=t.name,
            description=t.description,
            questions_count=len(t.questions) if t.questions else 0,
        )
        for t in templates
    ]
