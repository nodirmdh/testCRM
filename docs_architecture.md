# Архитектура системы (Architecture)

Документ описывает целевую архитектуру MVP (B2B SaaS для оффлайн учебных центров), ключевые компоненты, потоки данных и технические решения.

Связанные документы:
- Требования: `docs/requirements.md`
- Доменная модель: `docs/domains.md`

---

## 1. Цели архитектуры

### 1.1 MVP-first
- Быстрый запуск, минимальная сложность.
- Монолитное backend-приложение на старте.
- Чёткая доменная модель, чтобы избежать переделок.

### 1.2 Multi-tenant безопасность
- Полная изоляция данных между организациями.
- Любые запросы к данным ограничены `organization_id`.

### 1.3 Расширяемость
- Возможность в будущем добавить: филиалы, роли преподавателей/учеников, уведомления, интеграции с платёжками.

---

## 2. Высокоуровневые компоненты

### 2.1 Frontend (Web)
- Веб-приложение для Owner/Admin.
- Основные модули UI:
  - Dashboard
  - Students + Guardians
  - Teachers
  - Courses
  - Groups (enrollments, teachers)
  - Lessons & Attendance
  - Finance: invoices, payments, debtors
  - Salary: rules, accruals, payouts
  - Certificates
  - Settings

### 2.2 Backend (API)
- Единый API-сервис (монолит).
- Отвечает за:
  - аутентификацию и авторизацию
  - бизнес-логику домена
  - расчёты (инвойсы, доходы, зарплаты)
  - генерацию PDF сертификатов

### 2.3 Database
- PostgreSQL (рекомендуется).
- Миграции обязательны.
- Индексация по `organization_id`, `period`, ключевым foreign keys.

### 2.4 File Storage
- S3-совместимое хранилище (или локально для dev).
- Хранение:
  - логотипов
  - PDF сертификатов
  - фоновых изображений шаблонов сертификата (опционально)

### 2.5 Background Jobs (опционально для MVP)
- На старте можно обойтись без очереди.
- Если появится потребность:
  - генерация сертификатов в фоне
  - массовое формирование инвойсов
  - ночные расчёты зарплат

---

## 3. Структура backend по модулям (DDD-lite)

Рекомендуемая структура модулей:

1) **Auth**
- Login/Logout
- Password hashing
- Session/JWT

2) **Tenancy**
- Organization context resolution
- Guard/filters по `organization_id`

3) **Academics**
- Students, Guardians
- Teachers
- Courses
- Groups
- Enrollment
- TeacherGroup

4) **Attendance**
- LessonSession
- Attendance

5) **Finance**
- BillingPlan
- Invoice
- Payment
- отчёты доходов/долгов

6) **Payroll**
- SalaryRule
- SalaryAccrual
- Payout

7) **Certificates**
- Certificate
- Template (опционально)
- PDF generation

8) **Reporting**
- Dashboard metrics
- grouped reports

---

## 4. Multi-tenancy модель

### 4.1 Tenant scope
- Каждая бизнес-сущность содержит `organization_id`.
- Запросы всегда фильтруются по текущему `organization_id` пользователя.

### 4.2 Контроль доступа
- У пользователя есть `role` (owner/admin).
- В MVP права одинаковые, но архитектура должна поддерживать различия.

### 4.3 Защита от утечек
- Запрещены запросы без фильтра `organization_id`.
- Рекомендация: слой репозиториев/ORM, который автоматически добавляет фильтр.
- Логи аудита на критические изменения (опционально для MVP).

---

## 5. Данные и миграции

### 5.1 Таблицы
Основные таблицы перечислены в `docs/domains.md`.

### 5.2 Ограничения
- Уникальность:
  - Invoice: (student_id, group_id, period)
  - Attendance: (lesson_session_id, student_id)
  - Enrollment: уникальность активной связи (student_id, group_id, left_at is null)
  - Certificate: certificate_no unique per organization

### 5.3 Индексы
- Всегда индексировать:
  - `organization_id`
  - `period` в Invoice/SalaryAccrual
  - `paid_at` в Payment
  - foreign keys (student_id, group_id, teacher_id)

---

## 6. Ключевые бизнес-процессы и потоки

### 6.1 Формирование инвойсов за период
**Цель:** создать начисления для всех активных учеников группы.

Алгоритм (MVP):
1) Пользователь выбирает период (YYYY-MM).
2) Система находит все активные Enrollment (left_at is null).
3) Для каждой пары (student, group) создаёт Invoice:
   - amount_due = price из BillingPlan группы
   - status = pending
4) Если Invoice уже существует — пропуск/обновление (правило уточняется).

Рекомендация:
- В MVP делать по кнопке "Сформировать начисления".
- Позже — автоматически в начале месяца.

### 6.2 Приём оплаты
1) Пользователь открывает Invoice.
2) Вносит Payment (сумма, дата, метод).
3) Система пересчитывает статус Invoice:
   - pending / partial / paid

### 6.3 Отчёт доходов
- Доход за период = сумма Payment.amount, где paid_at внутри периода.
- Доход по группе = сумма Payment.amount по Invoice данной группы.

### 6.4 Проведение занятия и посещаемость
1) Пользователь создаёт LessonSession (группа, преподаватель, дата).
2) Система показывает список активных учеников группы.
3) Пользователь отмечает Attendance для каждого.

### 6.5 Расчёт зарплаты
В MVP расчёт выполняется вручную "Рассчитать зарплату".

Алгоритм:
- Для каждого teacher+group с SalaryRule:
  - per_lesson: count LessonSession.held в периоде * ставка
  - percent_income: доход группы в периоде * процент
- Суммировать по teacher → SalaryAccrual
- Сохранить details расчёта

### 6.6 Выплата зарплаты
- Пользователь вносит Payout.
- Система показывает долг: accruals − payouts.

### 6.7 Сертификаты
- Пользователь выбирает ученика и курс.
- Система создаёт Certificate с уникальным номером.
- Генерирует PDF и сохраняет в File Storage.

---

## 7. API (контуры)

> Ниже примерные контуры API. Конкретный формат (REST/GraphQL) выбирается при выборе стека.

### 7.1 Auth
- POST /auth/login
- POST /auth/logout
- GET /auth/me

### 7.2 Students/Guardians
- GET/POST /students
- GET/PATCH/DELETE /students/{id}
- POST /students/{id}/guardians

### 7.3 Teachers
- GET/POST /teachers
- GET/PATCH /teachers/{id}

### 7.4 Courses
- GET/POST /courses
- GET/PATCH /courses/{id}

### 7.5 Groups
- GET/POST /groups
- GET/PATCH /groups/{id}
- POST /groups/{id}/enroll (student_id)
- POST /groups/{id}/teachers (teacher_id)

### 7.6 Lessons/Attendance
- GET/POST /lessons
- GET /lessons/{id}
- POST /lessons/{id}/attendance

### 7.7 Finance
- GET/POST /billing-plans
- POST /invoices/generate (period)
- GET /invoices?period=
- POST /invoices/{id}/payments
- GET /reports/income?period=
- GET /reports/debts?period=

### 7.8 Payroll
- GET/POST /salary-rules
- POST /salary-accruals/calculate (period)
- GET /salary-accruals?period=
- POST /payouts

### 7.9 Certificates
- POST /certificates (student_id, course_id)
- GET /certificates/{id}/pdf

---

## 8. Безопасность

- Пароли: только `password_hash` (bcrypt/argon2).
- HTTPS обязательно на проде.
- CSRF защита (если cookie-based sessions).
- Rate limit на login.
- Аудит-лог (опционально): изменения финансов/зарплат.

---

## 9. Наблюдаемость и логирование

- Логи запросов и ошибок.
- Корреляционный ID на запрос.
- Метрики (опционально): время ответов, количество ошибок.

---

## 10. Рекомендации по стеку (не финальное решение)

Варианты (MVP-friendly):
- Backend: Node.js (NestJS) или Python (Django/DRF) или Go
- Frontend: React + TypeScript
- DB: PostgreSQL
- Storage: S3-compatible

Выбор стека фиксируется в `docs/PLANS.md`.

---

## 11. Эволюция после MVP

- Branch (филиалы)
- Роли Teacher/Student/Guardian с доступом в систему
- Нотификации (SMS/Telegram)
- Автоматические периодические задачи (invoices, payroll)
- Интеграции с платёжными системами/кассами
- Расширенная бухгалтерия (расходы, прибыль)

