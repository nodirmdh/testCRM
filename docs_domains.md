# Доменная модель (Domains)

Документ описывает основные сущности системы, их поля, связи и ключевые бизнес-правила для LMS (оффлайн учебные центры, B2B SaaS).

> Термины ниже используются как единый «словарь» для требований, архитектуры, базы данных и кода.

---

## 1. Общие принципы домена

### 1.1 Мульти-тенантность (изоляция клиентов)
- **Organization** — основной «тенант» (учебный центр).
- Все данные (кроме служебных) принадлежат конкретной `organization_id`.
- Пользователь (Owner/Admin) работает только в рамках своей организации.

### 1.2 Периоды
- Финансовые отчёты и начисления считаются по **периодам**.
- В MVP период = **календарный месяц** (формат `YYYY-MM`).

### 1.3 Статусы
- Во многих сущностях используется `is_active` или `status` для мягкого отключения без удаления.

---

## 2. Сущности и связи

Ниже перечислены сущности MVP. Для каждой указаны:
- Назначение
- Основные поля
- Связи
- Инварианты (бизнес-правила)


## 2.1 Organization (Учебный центр)
**Назначение:** клиент SaaS, владелец данных.

**Поля (минимум):**
- `id`
- `name`
- `phone` (опционально)
- `address` (опционально)
- `logo_url` (опционально)
- `timezone` (опционально, по умолчанию локальная)
- `created_at`

**Связи:**
- Organization 1 — N Users
- Organization 1 — N Students
- Organization 1 — N Teachers
- Organization 1 — N Courses
- Organization 1 — N Groups


## 2.2 Subscription (Подписка организации)
**Назначение:** определяет активность доступа к сервису и ограничения по тарифу.

**Поля (минимум):**
- `id`
- `organization_id`
- `plan_code` (например: `basic`, `pro`, `enterprise`)
- `status`: `active | past_due | canceled | expired`
- `starts_at`
- `ends_at`
- `max_students` (опционально)
- `max_groups` (опционально)

**Инварианты:**
- При `status != active` система может работать в режиме «только просмотр» либо блокировать доступ (решение задаётся в требованиях/архитектуре).


## 2.3 User (Пользователь системы)
**Назначение:** вход в систему и выполнение действий.

**Поля (минимум):**
- `id`
- `organization_id`
- `full_name` (опционально)
- `login` (email или телефон)
- `password_hash`
- `role`: `owner | admin`
- `is_active`
- `last_login_at` (опционально)
- `created_at`

**Инварианты:**
- В одной организации должен быть минимум 1 пользователь с ролью `owner`.


## 2.4 Student (Ученик)
**Назначение:** учёт учащихся, их групп, посещаемости и оплат.

**Поля (минимум):**
- `id`
- `organization_id`
- `full_name`
- `phone` (опционально)
- `address` (строка)
- `status`: `active | inactive`
- `note` (опционально)
- `created_at`

**Связи:**
- Student N — N Groups через Enrollment
- Student 1 — N Invoices
- Student 1 — N Attendance
- Student N — N Guardians через StudentGuardian


## 2.5 Guardian (Родитель/Опекун)
**Назначение:** контактные данные родителей/опекунов.

**Поля (минимум):**
- `id`
- `organization_id`
- `full_name`
- `phone`
- `relation`: `mother | father | other`
- `created_at`

**Связи:**
- Guardian N — N Students через StudentGuardian


## 2.6 StudentGuardian (Связь ученик—родитель)
**Назначение:** поддержать несколько родителей у ученика и несколько детей у родителя.

**Поля (минимум):**
- `id`
- `organization_id`
- `student_id`
- `guardian_id`
- `is_primary` (основной контакт)

**Инварианты:**
- Для ученика может быть максимум 1 `is_primary = true` (рекомендация, не жёстко обязательно в MVP).


## 2.7 Teacher (Преподаватель)
**Назначение:** учёт преподавателей, их привязка к группам и расчёт зарплат.

**Поля (минимум):**
- `id`
- `organization_id`
- `full_name`
- `phone`
- `specialization` (опционально)
- `is_active`
- `note` (опционально)
- `created_at`

**Связи:**
- Teacher N — N Groups через TeacherGroup
- Teacher 1 — N LessonSessions
- Teacher 1 — N SalaryRules
- Teacher 1 — N SalaryAccruals
- Teacher 1 — N Payouts


## 2.8 Course (Курс)
**Назначение:** направление обучения (например: «Английский A1»).

**Поля (минимум):**
- `id`
- `organization_id`
- `name`
- `description` (опционально)
- `duration_months` (опционально)
- `is_active`
- `created_at`

**Связи:**
- Course 1 — N Groups


## 2.9 Group (Группа)
**Назначение:** учебная группа в рамках курса с расписанием и учениками.

**Поля (минимум):**
- `id`
- `organization_id`
- `course_id`
- `name`
- `schedule_text` (пример: "Пн/Ср/Пт 14:00")
- `start_date` (опционально)
- `end_date` (опционально)
- `status`: `active | closed`
- `created_at`

**Связи:**
- Group N — N Students через Enrollment
- Group N — N Teachers через TeacherGroup
- Group 1 — N LessonSessions
- Group 1 — 1 BillingPlan (в MVP)
- Group 1 — N Invoices

**Инварианты:**
- У группы должен быть курс (`course_id`).
- Преподаватель может быть в нескольких группах.


## 2.10 Enrollment (Ученик в группе)
**Назначение:** фиксирует факт обучения ученика в группе и историю.

**Поля (минимум):**
- `id`
- `organization_id`
- `student_id`
- `group_id`
- `joined_at`
- `left_at` (nullable)
- `status`: `active | left` (опционально)

**Инварианты:**
- Ученик не должен иметь два активных Enrollment в одной и той же группе.


## 2.11 TeacherGroup (Преподаватель в группе)
**Назначение:** связь преподавателя и группы (многие-ко-многим).

**Поля (минимум):**
- `id`
- `organization_id`
- `teacher_id`
- `group_id`
- `role`: `main | assistant` (в MVP можно хранить `main` по умолчанию)

**Инварианты:**
- В группе может быть несколько преподавателей.


## 2.12 LessonSession (Занятие / сессия занятия)
**Назначение:** факт проведённого занятия в определённую дату (основа для посещаемости и зарплаты за занятие).

**Поля (минимум):**
- `id`
- `organization_id`
- `group_id`
- `teacher_id`
- `date` (дата/время начала)
- `topic` (опционально)
- `notes` (опционально)
- `status`: `held | canceled` (в MVP можно только `held`)
- `created_at`

**Инварианты:**
- `teacher_id` должен быть связан с группой через TeacherGroup (рекомендация, но в MVP можно не блокировать).


## 2.13 Attendance (Посещаемость)
**Назначение:** отметка присутствия ученика на конкретном LessonSession.

**Поля (минимум):**
- `id`
- `organization_id`
- `lesson_session_id`
- `student_id`
- `status`: `present | absent | late`
- `comment` (опционально)

**Инварианты:**
- У одного ученика не должно быть двух Attendance на один и тот же LessonSession.

---

# 3. Финансовый домен

Финансы делятся на две части:
1) Оплаты учеников и доход центра
2) Зарплаты преподавателей


## 3.1 BillingPlan (Стоимость обучения в группе)
**Назначение:** задаёт правила начислений для учеников группы.

**Поля (минимум):**
- `id`
- `organization_id`
- `group_id`
- `period_type`: `monthly` (в MVP только monthly)
- `price` (число)
- `currency` (например: `UZS`)
- `effective_from` (опционально)
- `effective_to` (опционально)

**Инварианты:**
- В MVP допускается 1 активный BillingPlan на группу.
- Изменение цены желательно делать через новый BillingPlan с `effective_from`.


## 3.2 Invoice (Начисление ученику)
**Назначение:** сколько ученик должен оплатить за период по конкретной группе.

**Поля (минимум):**
- `id`
- `organization_id`
- `student_id`
- `group_id`
- `period` (формат `YYYY-MM`)
- `amount_due`
- `amount_paid` (в MVP можно вычислять суммой платежей)
- `status`: `pending | partial | paid | canceled`
- `created_at`

**Инварианты:**
- Для пары `(student_id, group_id, period)` должен быть максимум 1 активный Invoice.


## 3.3 Payment (Платёж)
**Назначение:** факт оплаты (может быть частичный).

**Поля (минимум):**
- `id`
- `organization_id`
- `invoice_id`
- `amount`
- `paid_at`
- `method`: `cash | card | transfer`
- `comment` (опционально)

**Правила статуса Invoice:**
- `paid` если сумма платежей >= `amount_due`
- `partial` если 0 < сумма платежей < `amount_due`
- `pending` если платежей нет


## 3.4 Доходы (расчёты)
**Определения:**
- **Доход организации за период** = сумма `Payment.amount` за период (по `paid_at`) в рамках `organization_id`.
- **Доход группы за период** = сумма `Payment.amount` по Invoice данной группы.

> В дальнейшем можно добавить «кассовый метод» и «метод начисления», но в MVP — кассовый (по фактическим платежам).

---

# 4. Зарплаты преподавателей


## 4.1 SalaryRule (Правило расчёта зарплаты)
**Назначение:** определяет как считать зарплату преподавателю в конкретной группе.

**Поля (минимум):**
- `id`
- `organization_id`
- `teacher_id`
- `group_id`
- `type`: `per_lesson | percent_income`
- `value`:
  - для `per_lesson` — сумма за одно проведённое занятие
  - для `percent_income` — процент (например 30)
- `currency` (для per_lesson)
- `is_active`
- `effective_from` (опционально)
- `effective_to` (опционально)

**Инварианты:**
- На одну пару `(teacher_id, group_id)` может быть несколько правил по времени, но одновременно активно — не более одного (в MVP можно упростить до одного правила).


## 4.2 SalaryAccrual (Начисление зарплаты)
**Назначение:** фиксирует сумму начисленной зарплаты за период, чтобы было прозрачно, что и как было рассчитано.

**Поля (минимум):**
- `id`
- `organization_id`
- `teacher_id`
- `period` (YYYY-MM)
- `amount`
- `currency`
- `calculated_at`
- `details` (JSON/текст: сколько занятий, какой процент, какой доход)

**Правило расчёта (MVP):**
- Если `per_lesson`: количество `LessonSession` (status=held) в периоде * `value`.
- Если `percent_income`: доход группы за период * (`value` / 100).

> В MVP лучше считать начисления **по кнопке** "Рассчитать зарплату за месяц" и сохранять результат.


## 4.3 Payout (Выплата зарплаты)
**Назначение:** факт выплаты преподавателю (может быть частями).

**Поля (минимум):**
- `id`
- `organization_id`
- `teacher_id`
- `period` (опционально, для привязки к месяцу)
- `amount`
- `paid_at`
- `method`: `cash | card | transfer`
- `comment` (опционально)

**Определения:**
- **Долг по зарплате** за период = сумма `SalaryAccrual.amount` − сумма `Payout.amount`.

---

# 5. Сертификаты


## 5.1 Certificate (Сертификат)
**Назначение:** выдача документа об окончании курса/обучения.

**Поля (минимум):**
- `id`
- `organization_id`
- `student_id`
- `course_id` (или group_id — решение зависит от бизнес-логики; в MVP можно хранить `course_id`)
- `issued_at`
- `certificate_no` (уникальный номер внутри организации)
- `template_id` (опционально)
- `pdf_url` (опционально)

**Инварианты:**
- `certificate_no` должен быть уникален в рамках организации.


## 5.2 CertificateTemplate (Шаблон сертификата) — опционально для MVP
**Поля (минимум):**
- `id`
- `organization_id`
- `name`
- `background_image_url` (опционально)
- `layout_config` (JSON: позиции текста)

---

# 6. Справочники (Enums)

Рекомендуемые перечисления:

- `UserRole`: `owner`, `admin`
- `StudentStatus`: `active`, `inactive`
- `GroupStatus`: `active`, `closed`
- `AttendanceStatus`: `present`, `absent`, `late`
- `InvoiceStatus`: `pending`, `partial`, `paid`, `canceled`
- `SubscriptionStatus`: `active`, `past_due`, `canceled`, `expired`
- `PaymentMethod`: `cash`, `card`, `transfer`
- `SalaryRuleType`: `per_lesson`, `percent_income`

---

# 7. Ключевые пользовательские сценарии (MVP)

1) **Онбординг центра**
- Создать Organization
- Создать Owner
- Подключить подписку

2) **Учёт обучения**
- Создать Course
- Создать Group и расписание
- Добавить Teacher
- Добавить Students + Guardians
- Записать Students в Group (Enrollment)

3) **Проведение занятия**
- Создать LessonSession
- Отметить Attendance по всем ученикам группы

4) **Начисление и оплата**
- Установить BillingPlan группе
- Сформировать Invoices за месяц (по активным Enrollment)
- Внести Payment (частично/полностью)
- Посмотреть долги и доходы

5) **Зарплата преподавателя**
- Назначить SalaryRule преподавателю в группе
- Рассчитать SalaryAccrual за месяц
- Внести Payout
- Посмотреть остаток долга

6) **Сертификат**
- Выдать Certificate ученику (на основе курса)
- Скачать PDF

---

# 8. Пограничные случаи (важно учесть)

- Ученик может состоять в нескольких группах одновременно.
- Преподаватель может преподавать в нескольких группах.
- Оплата может быть частичной.
- Ученик может уйти из группы (`left_at`), но история посещаемости и оплат сохраняется.
- Цена группы может измениться: рекомендуется создавать новый BillingPlan с `effective_from`.

---

# 9. Что может быть добавлено позже (не MVP)

- Филиалы (Branch)
- Расписание структурированное (а не `schedule_text`)
- Уведомления родителям/ученикам
- Роли преподавателя и ученика с входом в систему
- Учёт расходов учебного центра (аренда, реклама и т.д.)
- Геймификация/баллы
- Интеграции с кассами/платёжными провайдерами
- Мультивалюта и расширенная бухгалтерия

