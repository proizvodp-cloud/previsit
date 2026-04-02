# PreVisit — Production Deployment Guide

## Продакшн сервер

| Параметр | Значение |
|---|---|
| IP | `89.108.113.69` |
| Провайдер | Reg.ru (аккаунт `stalnye-resheniya@yandex.ru`) |
| ОС | Ubuntu 24.04 LTS |
| Имя сервера | Amaranth Promethium |
| RAM / Диск | 2 GB / 20 GB |

### Доступ по SSH

```bash
ssh root@89.108.113.69
```

Пароль: в письме от Reg.ru на `stalnye-resheniya@yandex.ru` (тема: «Сброшен пароль Amaranth Promethium»), или сбросить в панели Reg.ru → Облачные серверы → Amaranth Promethium → Сбросить пароль.

---

## Приложение на сервере

Путь: `/opt/previsit`  
Конфиг: `/opt/previsit/.env.production`  
Docker Compose: `docker-compose.prod.yml`

### Основные команды (выполнять на сервере)

```bash
# Перейти в папку проекта
cd /opt/previsit

# Статус контейнеров
docker compose -f docker-compose.prod.yml ps

# Логи сервисов
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs nginx

# Перезапуск (без пересборки)
docker compose -f docker-compose.prod.yml restart

# Полная пересборка и перезапуск (после изменений кода)
git pull
docker compose -f docker-compose.prod.yml up --build -d

# Остановить всё
docker compose -f docker-compose.prod.yml down
```

### Применение миграций после изменений схемы БД

```bash
cd /opt/previsit
docker cp migrations/. previsit-backend-1:/app/migrations/
docker exec previsit-backend-1 sh -c "cd /app && alembic -c migrations/alembic.ini upgrade head"
```

---

## Содержимое .env.production на сервере

```
# Database
DATABASE_URL=postgresql+asyncpg://previsit:previsit@db:5432/previsit
POSTGRES_DB=previsit
POSTGRES_USER=previsit
POSTGRES_PASSWORD=previsit

# OpenAI — ключ взять из OpenAI Dashboard
OPENAI_API_KEY=<ВАШ_OPENAI_API_KEY>
OPENAI_MODEL=gpt-4o-mini

# Storage
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE_MB=10

# Email (отключено — SMTP не настроен)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@previsit.local

# URLs (IP сервера)
FRONTEND_URL=http://89.108.113.69
BACKEND_URL=http://backend:8000
NEXT_PUBLIC_API_URL=http://89.108.113.69
NEXT_PUBLIC_SHARE_URL=http://89.108.113.69

# Security
SECRET_KEY=prod-previsit-xK9mN3pQ7rL2026secure
```

**Важно:** `.env.production` не хранится в git (добавлен в `.gitignore`). При деплое с нуля создать файл вручную по шаблону выше.

Также нужен файл `/opt/previsit/.env` для подстановки переменных Docker Compose:

```
POSTGRES_DB=previsit
POSTGRES_USER=previsit
POSTGRES_PASSWORD=previsit
NEXT_PUBLIC_API_URL=http://89.108.113.69
```

---

## Деплой с нуля на новый сервер

```bash
# 1. Установить Docker
curl -fsSL https://get.docker.com | sh

# 2. Клонировать репо
cd /opt
git clone https://github.com/proizvodp-cloud/previsit.git
cd previsit

# 3. Создать .env и .env.production (по шаблонам выше)
nano .env
nano .env.production

# 4. Собрать и запустить
docker compose -f docker-compose.prod.yml up --build -d

# 5. Применить миграции
docker cp migrations/. previsit-backend-1:/app/migrations/
docker exec previsit-backend-1 sh -c "cd /app && alembic -c migrations/alembic.ini upgrade head"

# 6. Загрузить тестовые данные (опционально)
docker exec previsit-backend-1 python seed.py
```

---

## Локальная разработка

### Требования
- Docker Desktop
- Git

### Запуск

```bash
git clone https://github.com/proizvodp-cloud/previsit.git
cd previsit

# Создать .env и заполнить OPENAI_API_KEY (остальное оставить как в .env.example)
docker compose up --build -d

# Применить миграции
docker cp migrations/. previsit-backend-1:/app/migrations/
docker exec previsit-backend-1 sh -c "cd /app && alembic -c migrations/alembic.ini upgrade head"

# Загрузить тестовые данные
docker exec previsit-backend-1 python seed.py

# Приложение: http://localhost:3000
# Дашборд: http://localhost:3000/cases
# Backend API: http://localhost:8000
```

---

## Стек

- **Backend:** Python 3.12, FastAPI, SQLAlchemy async, PostgreSQL 16
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **AI:** OpenAI API (gpt-4o-mini)
- **Инфраструктура:** Docker Compose, Nginx

## Репозиторий

GitHub: https://github.com/proizvodp-cloud/previsit  
Ветка: `main`
