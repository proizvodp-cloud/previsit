# PreVisit — Текущий статус проекта

> Последнее обновление: 03.04.2026

---

## Продакшн-сервер

| Параметр | Значение |
|---|---|
| IP | `89.108.113.69` |
| URL | `http://89.108.113.69` |
| SSH | `ssh root@89.108.113.69` |
| Путь | `/opt/previsit` |
| Docker compose | `docker-compose.prod.yml` |

> SSH пароль хранится отдельно (не в репозитории).

---

## Тестовые аккаунты врачей

| Email | Пароль | Специальность |
|---|---|---|
| `ivanov@clinic1.ru` | `doctor123` | Терапевт |
| `smirnova@clinic1.ru` | `doctor123` | Кардиолог |
| `petrov@clinic1.ru` | `doctor123` | Хирург-ортопед |

---

## Что сделано (хронология)

### Сессия 2 (03.04.2026) — Авторизация и деплой

**Backend:**
- Добавлено поле `hashed_password` в модель `Doctor`
- Создана миграция `0002_add_doctor_password`
- Добавлен endpoint `POST /api/auth/login` → возвращает JWT токен
- Создан `deps.py` с dependency `get_current_doctor`
- Все endpoints `/api/cases`, `/api/appointments`, `/api/patients` защищены авторизацией
- Фильтрация данных по текущему врачу (`doctor_id = current_doctor.id`)
- Пароль хешируется через `bcrypt` напрямую (без passlib)

**Frontend:**
- Новая страница `/login` — форма email + пароль
- JWT токен хранится в `localStorage`
- Автоматический редирект на `/login` при 401
- Кнопка "Выйти" на дашборде
- Главная страница `/` — кнопка "Войти как врач"
- `Authorization: Bearer {token}` во всех запросах к API

**Деплой:**
- `git pull` на сервере (коммит `739ad63`)
- Пересборка docker образов
- Миграция применена
- Seed запущен (врачи получили хешированные пароли)

### Сессия 1 — MVP (дата ранее)

- Базовый flow: пациент → анкета → AI кейс → дашборд врача
- 3 специальности: терапевт, кардиолог, ортопед
- Email-приглашения пациентам
- Редактирование данных пациента
- Кнопки шаринга (WhatsApp, Telegram, SMS, копирование ссылки)
- Деплой на VPS, nginx, Docker Compose

---

## Что нужно сделать дальше

### Критично
- [ ] Баги (описать отдельно при следующей сессии)
- [ ] Проверить работу на реальных устройствах через `http://89.108.113.69`

### Улучшения MVP
- [ ] Страница `/appointments` — создание новой записи к врачу (сейчас только через seed)
- [ ] HTTPS (Let's Encrypt / Certbot)
- [ ] Реальный SMTP вместо заглушки (настроить в `.env.production`)
- [ ] Смена пароля для врача
- [ ] Пагинация в списке кейсов и записей

### Технический долг
- [ ] Перенести JWT токен из `localStorage` в `httpOnly cookie`
- [ ] Добавить refresh token
- [ ] Тесты авторизации

---

## Команды для работы на новом ПК

### Клонировать и запустить локально

```bash
git clone https://github.com/proizvodp-cloud/previsit.git
cd previsit

cp .env.example .env
# Вставить OPENAI_API_KEY в .env

docker compose up --build

# В другом терминале:
docker compose exec backend alembic -c migrations/alembic.ini upgrade head
docker compose exec backend python seed.py
```

### Подключиться к серверу

```bash
ssh root@89.108.113.69
cd /opt/previsit
```

### Задеплоить изменения на сервер

```bash
# Локально — запушить
git add . && git commit -m "..." && git push

# На сервере
ssh root@89.108.113.69
cd /opt/previsit
git pull
docker compose -f docker-compose.prod.yml up --build -d

# Если были миграции:
docker cp migrations/. previsit-backend-1:/app/migrations/
docker exec previsit-backend-1 sh -c "cd /app && alembic -c /app/migrations/alembic.ini upgrade head"
```

### Проверить статус сервера

```bash
docker ps
docker logs previsit-backend-1 --tail 50
docker logs previsit-frontend-1 --tail 20
```

---

## Ключевые файлы

| Файл | Описание |
|---|---|
| `backend/routes/auth.py` | JWT авторизация |
| `backend/deps.py` | Dependency `get_current_doctor` |
| `backend/routes/cases.py` | Кейсы — защищены авторизацией |
| `backend/routes/appointments.py` | Записи — защищены авторизацией |
| `frontend/src/app/login/page.tsx` | Страница логина |
| `frontend/src/lib/api.ts` | API клиент с auth headers |
| `migrations/versions/0002_add_doctor_password.py` | Миграция пароля |
| `docker-compose.prod.yml` | Продакшн конфиг |
| `DEPLOY.md` | Полная инструкция по деплою |
