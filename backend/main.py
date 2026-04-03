from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routes import intake, cases, appointments, templates, patients, auth

app = FastAPI(
    title="PreVisit API",
    description="Pre-visit patient intake API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(intake.router, prefix="/api/intake", tags=["intake"])
app.include_router(cases.router, prefix="/api/cases", tags=["cases"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["appointments"])
app.include_router(templates.router, prefix="/api/templates", tags=["templates"])
app.include_router(patients.router, prefix="/api/patients", tags=["patients"])
