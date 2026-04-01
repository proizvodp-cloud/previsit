"""
AI service: generates a structured patient case from intake answers using OpenAI.
"""
import json
import logging

from openai import AsyncOpenAI

from config import settings

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


SYSTEM_PROMPT = """Ты — медицинский ассистент, помогающий терапевту подготовиться к приёму пациента.
На основе ответов пациента на анкету составь структурированный краткий кейс.

Верни JSON строго в следующем формате (без markdown, только чистый JSON):
{
  "chief_complaint": "краткое описание основной жалобы",
  "anamnesis_morbi": "история текущего заболевания: давность, динамика, интенсивность боли",
  "anamnesis_vitae": "хронические заболевания, операции, семейный анамнез",
  "medications": "текущие лекарства и дозировки",
  "allergies": "аллергии и реакции",
  "lifestyle": "курение, алкоголь",
  "doctor_notes": "что важно обсудить с врачом по просьбе пациента",
  "red_flags": ["список тревожных симптомов, если есть, иначе пустой массив"]
}

Пиши кратко, медицинским языком, понятным врачу. Не выдумывай информацию, которой нет в ответах."""


def _build_user_message(questions: list[dict], answers: dict) -> str:
    """Format questions and answers into a readable text for the AI."""
    lines = ["Ответы пациента на анкету предварительного осмотра:\n"]
    for q in questions:
        qid = q["id"]
        answer = answers.get(qid)
        if answer is None:
            continue
        # Skip empty or "no answer" values
        if answer == "" or answer == []:
            continue
        lines.append(f"Вопрос: {q['text']}")
        if isinstance(answer, list):
            lines.append(f"Ответ: {', '.join(str(a) for a in answer)}")
        else:
            lines.append(f"Ответ: {answer}")
        lines.append("")
    return "\n".join(lines)


async def generate_case(questions: list[dict], answers: dict) -> tuple[dict, list, str]:
    """
    Generate a structured case from intake answers.

    Returns:
        summary (dict): structured case fields
        ai_flags (list): red flags from AI
        raw_text (str): full AI response as text fallback
    """
    if not settings.openai_api_key:
        logger.warning("OpenAI API key not set — returning empty case")
        return {}, [], "AI генерация недоступна: не задан OPENAI_API_KEY"

    user_message = _build_user_message(questions, answers)

    try:
        client = _get_client()
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.2,
            max_tokens=1000,
        )

        raw_text = response.choices[0].message.content or ""

        # Parse JSON from the response
        summary = json.loads(raw_text)
        ai_flags = summary.pop("red_flags", [])

        return summary, ai_flags, raw_text

    except json.JSONDecodeError:
        logger.error("AI returned invalid JSON, storing as raw_text only")
        return {}, [], raw_text

    except Exception as e:
        logger.error(f"OpenAI call failed: {e}")
        return {}, [], f"Ошибка AI генерации: {e}"
