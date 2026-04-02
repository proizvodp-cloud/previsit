# PreVisit — Пред-визитный сбор анамнеза

PWA-приложение для сбора анамнеза пациентов перед визитом к врачу.

## Стек

- **Backend:** Python 3.12, FastAPI, SQLAlchemy (async), PostgreSQL
- **Frontend:** Next.js 14, React, Tailwind CSS
- **AI:** OpenAI API (gpt-4o-mini) — генерация структурированного кейса
- **Email:** aiosmtplib + Mailhog (локально) / SMTP (production)
- **Deploy:** Docker Compose + Nginx

## Быстрый старт (локальная разработка)

### 1. Настройка окружения

```bash
cp .env.example .env
# Вставь свой OPENAI_API_KEY в .env
```

### 2. Запуск

```bash
docker compose up --build
```

### 3. Применение миграций и seed-данных

```bash
# В отдельном терминале (после запуска контейнеров):
docker compose exec backend alembic -c migrations/alembic.ini upgrade head
docker compose exec backend python seed.py
```

### 4. Открыть приложение

| Адрес | Что это |
|---|---|
| http://localhost:3000 | Главная страница |
| http://localhost:3000/cases | Дашборд врача |
| http://localhost:8000/docs | Swagger API |
| http://localhost:8025 | Mailhog — входящие письма |

## Флоу

1. Врач создаёт запись → нажимает «Отправить ссылку» → пациент получает email
2. Пациент открывает ссылку `http://localhost:3000/intake/{token}`
3. Заполняет анкету (вопросы зависят от специальности врача)
4. После заполнения — AI генерирует структурированный кейс
5. Врач видит кейс на дашборде, открывает его, добавляет заметки и отмечает «Просмотрен»

## Структура проекта

```
previsit/
├── backend/          # FastAPI приложение
│   ├── routes/       # API endpoints
│   ├── models/       # SQLAlchemy модели
│   ├── schemas/      # Pydantic схемы
│   ├── services/     # AI, Email
│   └── templates/    # JSON-шаблоны анкет (therapist, cardio, ortho)
├── frontend/         # Next.js приложение
│   └── src/app/
│       ├── cases/    # Дашборд + страница кейса
│       └── intake/   # Анкета пациента
├── migrations/       # Alembic миграции
├── nginx/            # Nginx конфиг для production
├── templates/        # JSON-шаблоны анкет (therapist, cardio, ortho)
└── docker-compose.yml
```

## Seed-данные

Seed создаёт:
- 1 клиника
- 3 врача: терапевт, кардиолог, хирург-ортопед
- 3 пациента с записями на приём
- 3 шаблона анкет по специальностям
- Токены для тестовых ссылок выводятся в консоль

```bash
docker compose exec backend python seed.py
```

## Деплой на VPS

### 1. Подготовка сервера

```bash
# На VPS (Ubuntu 22.04+)
apt update && apt install -y docker.io docker-compose-plugin
```

### 2. Клонирование и настройка

```bash
git clone https://github.com/proizvodp-cloud/previsit.git
cd previsit

cp .env.production.example .env.production
# Заполни все переменные в .env.production:
# - POSTGRES_PASSWORD — сильный пароль БД
# - OPENAI_API_KEY — ключ OpenAI
# - SMTP_* — настройки реального SMTP
# - FRONTEND_URL, NEXT_PUBLIC_API_URL — твой домен или IP
# - SECRET_KEY — случайная строка 64 символа
```

### 3. Запуск

```bash
# Первый запуск
docker compose -f docker-compose.prod.yml up --build -d

# Применить миграции
docker compose -f docker-compose.prod.yml exec backend alembic -c migrations/alembic.ini upgrade head

# Загрузить seed-данные
docker compose -f docker-compose.prod.yml exec backend python seed.py
```

### 4. Проверка

```bash
docker compose -f docker-compose.prod.yml ps
curl http://localhost/api/health
```

После запуска приложение доступно на порту **80**. Для HTTPS добавь Certbot + SSL-сертификат.

### Обновление

```bash
git pull
docker compose -f docker-compose.prod.yml up --build -d
```
