"""
Seed script: creates test clinic, doctor, patient, appointment and therapist template.
Run from within the backend container:
  docker compose exec backend python seed.py
"""
import asyncio
import json
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

from sqlalchemy import select

from database import async_session
from models.clinic import Clinic
from models.doctor import Doctor
from models.patient import Patient
from models.appointment import Appointment
from models.intake_template import IntakeTemplate


async def seed():
    async with async_session() as db:
        # --- Clinic ---
        clinic_result = await db.execute(
            select(Clinic).where(Clinic.name == "Городская клиника №1")
        )
        clinic = clinic_result.scalar_one_or_none()
        if clinic is None:
            clinic = Clinic(
                name="Городская клиника №1",
                address="ул. Ленина, д. 10, Москва",
                phone="+7 (495) 123-45-67",
                email="info@clinic1.ru",
            )
            db.add(clinic)
            await db.flush()
            print(f"[+] Clinic created: id={clinic.id}")
        else:
            print(f"[=] Clinic already exists: id={clinic.id}")

        # --- Doctor ---
        doctor_result = await db.execute(
            select(Doctor).where(Doctor.email == "ivanov@clinic1.ru")
        )
        doctor = doctor_result.scalar_one_or_none()
        if doctor is None:
            doctor = Doctor(
                clinic_id=clinic.id,
                first_name="Иван",
                last_name="Иванов",
                specialty="therapist",
                email="ivanov@clinic1.ru",
                phone="+7 (495) 123-45-68",
            )
            db.add(doctor)
            await db.flush()
            print(f"[+] Doctor created: id={doctor.id}")
        else:
            print(f"[=] Doctor already exists: id={doctor.id}")

        # --- Patient ---
        patient_result = await db.execute(
            select(Patient).where(Patient.email == "petrov@example.com")
        )
        patient = patient_result.scalar_one_or_none()
        if patient is None:
            from datetime import date
            patient = Patient(
                first_name="Пётр",
                last_name="Петров",
                date_of_birth=date(1985, 6, 15),
                phone="+7 (916) 987-65-43",
                email="petrov@example.com",
            )
            db.add(patient)
            await db.flush()
            print(f"[+] Patient created: id={patient.id}")
        else:
            print(f"[=] Patient already exists: id={patient.id}")

        # --- Intake Template ---
        template_result = await db.execute(
            select(IntakeTemplate).where(IntakeTemplate.specialty == "therapist")
        )
        template = template_result.scalar_one_or_none()
        if template is None:
            questions_path = Path(__file__).parent / "templates" / "therapist.json"
            questions = json.loads(questions_path.read_text(encoding="utf-8"))
            template = IntakeTemplate(
                specialty="therapist",
                name="Анкета первичного приёма терапевта",
                description="Стандартный сбор анамнеза для первичного визита к терапевту",
                questions=questions,
            )
            db.add(template)
            await db.flush()
            print(f"[+] IntakeTemplate created: id={template.id}")
        else:
            print(f"[=] IntakeTemplate already exists: id={template.id}")

        # --- Appointment ---
        appointment_result = await db.execute(
            select(Appointment).where(
                Appointment.doctor_id == doctor.id,
                Appointment.patient_id == patient.id,
            )
        )
        appointment = appointment_result.scalar_one_or_none()
        if appointment is None:
            token = uuid.uuid4().hex
            appointment = Appointment(
                doctor_id=doctor.id,
                patient_id=patient.id,
                scheduled_at=datetime.now(timezone.utc) + timedelta(days=1),
                invite_token=token,
                status="pending",
                notes="Первичный приём",
            )
            db.add(appointment)
            await db.flush()
            print(f"[+] Appointment created: id={appointment.id}")
            print(f"\n{'='*60}")
            print(f"  Invite token: {token}")
            print(f"  Patient URL:  http://localhost:3000/intake/{token}")
            print(f"{'='*60}\n")
        else:
            print(f"[=] Appointment already exists: id={appointment.id}")
            print(f"    Invite token: {appointment.invite_token}")
            print(f"    Patient URL:  http://localhost:3000/intake/{appointment.invite_token}")

        await db.commit()
        print("\n[OK] Seed completed.")


if __name__ == "__main__":
    asyncio.run(seed())
