from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://previsit:previsit@db:5432/previsit"

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"

    # Storage
    upload_dir: str = "/app/uploads"
    max_upload_size_mb: int = 10

    # Email
    smtp_host: str = "mailhog"
    smtp_port: int = 1025
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = "noreply@previsit.local"

    # URLs
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"

    # Security
    secret_key: str = "dev-secret-key-change-in-production"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
