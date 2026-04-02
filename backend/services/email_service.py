"""
Email service — sends transactional emails via SMTP (Mailhog locally, real SMTP in prod).
"""
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from config import settings


async def send_invite(
    to_email: str,
    patient_name: str,
    doctor_name: str,
    scheduled_at: datetime,
    invite_token: str,
) -> None:
    """Send intake invite link to patient."""
    intake_url = f"{settings.frontend_url}/intake/{invite_token}"
    date_str = scheduled_at.strftime("%d.%m.%Y в %H:%M")

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1e40af;">Добрый день, {patient_name}!</h2>
      <p>Вы записаны к врачу <strong>{doctor_name}</strong> на <strong>{date_str}</strong>.</p>
      <p>Пожалуйста, заполните анкету предварительного опроса до визита — это займёт 5–10 минут
         и поможет врачу лучше подготовиться к приёму.</p>
      <div style="margin: 32px 0;">
        <a href="{intake_url}"
           style="background:#2563eb;color:white;padding:14px 28px;border-radius:8px;
                  text-decoration:none;display:inline-block;font-size:16px;">
          Заполнить анкету
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px;">
        Если кнопка не работает, перейдите по ссылке:<br>
        <a href="{intake_url}" style="color:#2563eb;">{intake_url}</a>
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin-top:32px;">
      <p style="color:#9ca3af;font-size:12px;">Это письмо отправлено автоматически, не отвечайте на него.</p>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Анкета перед визитом к врачу — {date_str}"
    msg["From"] = settings.email_from
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html", "utf-8"))

    smtp_kwargs: dict = {
        "hostname": settings.smtp_host,
        "port": settings.smtp_port,
        "start_tls": False,
        "use_tls": False,
    }
    if settings.smtp_user:
        smtp_kwargs["username"] = settings.smtp_user
    if settings.smtp_password:
        smtp_kwargs["password"] = settings.smtp_password

    await aiosmtplib.send(msg, **smtp_kwargs)
