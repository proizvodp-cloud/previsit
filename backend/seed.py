"""
Seed script: creates test clinic, doctors, patients, appointments and intake templates.
Run from within the backend container:
  docker compose exec backend python seed.py
"""
import asyncio
import json
import uuid
from datetime import datetime, timezone, timedelta, date
from pathlib import Path

import bcrypt as _bcrypt
from sqlalchemy import select

DEFAULT_PASSWORD = "doctor123"


def _hash_password(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode(), _bcrypt.gensalt()).decode()

from database import async_session
from models.clinic import Clinic
from models.doctor import Doctor
from models.patient import Patient
from models.appointment import Appointment
from models.intake_template import IntakeTemplate


TEMPLATES = [
    {
        "specialty": "therapist",
        "name": "Анкета первичного приёма терапевта",
        "description": "Стандартный сбор анамнеза для первичного визита к терапевту",
        "file": "therapist.json",
    },
    {
        "specialty": "cardiologist",
        "name": "Анкета первичного приёма кардиолога",
        "description": "Сбор жалоб и анамнеза для кардиологического приёма",
        "file": "cardio.json",
    },
    {
        "specialty": "orthopedist",
        "name": "Анкета первичного приёма хирурга-ортопеда",
        "description": "Сбор жалоб и анамнеза для ортопедического приёма",
        "file": "ortho.json",
    },
]

DOCTORS = [
    {
        "first_name": "Иван",
        "last_name": "Иванов",
        "specialty": "therapist",
        "email": "ivanov@clinic1.ru",
        "phone": "+7 (495) 123-45-68",
    },
    {
        "first_name": "Елена",
        "last_name": "Смирнова",
        "specialty": "cardiologist",
        "email": "smirnova@clinic1.ru",
        "phone": "+7 (495) 123-45-69",
    },
    {
        "first_name": "Дмитрий",
        "last_name": "Козлов",
        "specialty": "orthopedist",
        "email": "kozlov@clinic1.ru",
        "phone": "+7 (495) 123-45-70",
    },
]

PATIENTS = [
    {
        "first_name": "Пётр",
        "last_name": "Петров",
        "date_of_birth": date(1985, 6, 15),
        "phone": "+7 (916) 987-65-43",
        "email": "petrov@example.com",
        "doctor_email": "ivanov@clinic1.ru",
        "specialty": "therapist",
        "days_ahead": 1,
    },
    {
        "first_name": "Анна",
        "last_name": "Сидорова",
        "date_of_birth": date(1972, 3, 22),
        "phone": "+7 (926) 111-22-33",
        "email": "sidorova@example.com",
        "doctor_email": "smirnova@clinic1.ru",
        "specialty": "cardiologist",
        "days_ahead": 2,
    },
    {
        "first_name": "Михаил",
        "last_name": "Фёдоров",
        "date_of_birth": date(1990, 11, 8),
        "phone": "+7 (936) 444-55-66",
        "email": "fedorov@example.com",
        "doctor_email": "kozlov@clinic1.ru",
        "specialty": "orthopedist",
        "days_ahead": 3,
    },
]


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

        # --- Doctors ---
        doctor_map: dict[str, Doctor] = {}
        for d in DOCTORS:
            result = await db.execute(
                select(Doctor).where(Doctor.email == d["email"])
            )
            doctor = result.scalar_one_or_none()
            if doctor is None:
                doctor = Doctor(
                    clinic_id=clinic.id,
                    first_name=d["first_name"],
                    last_name=d["last_name"],
                    specialty=d["specialty"],
                    email=d["email"],
                    phone=d["phone"],
                    hashed_password=_hash_password(DEFAULT_PASSWORD),
                )
                db.add(doctor)
                await db.flush()
                print(f"[+] Doctor created: {d['first_name']} {d['last_name']} ({d['specialty']})")
            else:
                # Обновляем пароль, если он не задан
                if not doctor.hashed_password:
                    doctor.hashed_password = _hash_password(DEFAULT_PASSWORD)
                    print(f"[~] Password set for: {d['first_name']} {d['last_name']}")
                else:
                    print(f"[=] Doctor already exists: {d['first_name']} {d['last_name']}")
            doctor_map[d["email"]] = doctor

        # --- Intake Templates ---
        template_map: dict[str, IntakeTemplate] = {}
        templates_dir = Path(__file__).parent / "templates"
        for t in TEMPLATES:
            result = await db.execute(
                select(IntakeTemplate).where(IntakeTemplate.specialty == t["specialty"])
            )
            template = result.scalar_one_or_none()
            if template is None:
                questions_path = templates_dir / t["file"]
                questions = json.loads(questions_path.read_text(encoding="utf-8"))
                template = IntakeTemplate(
                    specialty=t["specialty"],
                    name=t["name"],
                    description=t["description"],
                    questions=questions,
                )
                db.add(template)
                await db.flush()
                print(f"[+] Template created: {t['name']}")
            else:
                print(f"[=] Template already exists: {t['specialty']}")
            template_map[t["specialty"]] = template

        # --- Patients + Appointments ---
        print()
        for p in PATIENTS:
            patient_result = await db.execute(
                select(Patient).where(Patient.email == p["email"])
            )
            patient = patient_result.scalar_one_or_none()
            if patient is None:
                patient = Patient(
                    first_name=p["first_name"],
                    last_name=p["last_name"],
                    date_of_birth=p["date_of_birth"],
                    phone=p["phone"],
                    email=p["email"],
                )
                db.add(patient)
                await db.flush()
                print(f"[+] Patient created: {p['first_name']} {p['last_name']}")
            else:
                print(f"[=] Patient already exists: {p['first_name']} {p['last_name']}")

            doctor = doctor_map[p["doctor_email"]]
            appt_result = await db.execute(
                select(Appointment).where(
                    Appointment.doctor_id == doctor.id,
                    Appointment.patient_id == patient.id,
                )
            )
            appt = appt_result.scalars().first()
            if appt is None:
                token = uuid.uuid4().hex
                appt = Appointment(
                    doctor_id=doctor.id,
                    patient_id=patient.id,
                    scheduled_at=datetime.now(timezone.utc) + timedelta(days=p["days_ahead"]),
                    invite_token=token,
                    status="pending",
                    notes="Первичный приём",
                )
                db.add(appt)
                await db.flush()
                print(f"[+] Appointment created for {p['first_name']} → {doctor.last_name}")
                print(f"    Token: {token}")
                print(f"    URL:   http://localhost:3000/intake/{token}")
            else:
                print(f"[=] Appointment exists: {p['first_name']} → {doctor.last_name}")
                print(f"    URL:   http://localhost:3000/intake/{appt.invite_token}")

        await db.commit()
        print("\n[OK] Seed completed.")


if __name__ == "__main__":
    asyncio.run(seed())
