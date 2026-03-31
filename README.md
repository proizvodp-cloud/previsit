# PreVisit — Пред-визитный сбор анамнеза

PWA-приложение для сбора анамнеза пациентов перед визитом к врачу.

## Стек

- **Backend:** Python 3.12, FastAPI, SQLAlchemy (async), PostgreSQL
- **Frontend:** Next.js 14, React, Tailwind CSS
- **AI:** OpenAI API (gpt-4o) для генерации кейса
- **PDF:** WeasyPrint
- **Deploy:** Docker Compose

## Быстрый старт

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

- **Приложение:** http://localhost:3000
- **API docs:** http://localhost:8000/docs
- **Mailhog (email):** http://localhost:8025

## Пользовательский флоу

1. Пациент получает ссылку вида `http://localhost:3000/intake/{token}`
2. Проходит верификацию (ФИО + дата рождения)
3. Отвечает на вопросы в чат-интерфейсе
4. Загружает документы (анализы, снимки)
5. Подтверждает данные → кейс уходит врачу
6. Врач видит готовый кейс на странице `http://localhost:3000/case/{id}`

## Структура проекта

```
previsit/
├── backend/          # FastAPI приложение
├── frontend/         # Next.js приложение
├── migrations/       # Alembic миграции
├── templates/        # JSON-шаблоны анкет по специальностям
├── prompts/          # Промпты для OpenAI
├── uploads/          # Загруженные файлы пациентов
└── docker-compose.yml
```

## Разработка

Seed-данные создают:
- 1 клиника
- 2 врача (терапевт и кардиолог)
- 3 пациента с записями на приём
- Токены для тестовых ссылок выводятся в консоль
