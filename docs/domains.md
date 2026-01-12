# Доменная модель

## Organization
Назначение: учебный центр (tenant).
Основные поля: id, name, timezone, status.
Связи: Subscription, User, Student, Teacher, Course, Group, Invoice и др.
Бизнес-правила: все данные принадлежат организации.

## Subscription
Назначение: подписка организации.
Основные поля: id, organization_id, plan_id, status, started_at, ends_at.
Связи: Organization, BillingPlan.
Бизнес-правила: доступ к продукту определяется статусом.

## User
Назначение: учетная запись сотрудника.
Основные поля: id, organization_id, email, role (owner/admin), status.
Связи: Organization.
Бизнес-правила: роль определяет доступные действия.

## Student
Назначение: обучающийся.
Основные поля: id, organization_id, full_name, birth_date, status.
Связи: Enrollment, Attendance, StudentGuardian, Certificate.
Бизнес-правила: может быть в нескольких группах одновременно.

## Guardian
Назначение: родитель/опекун.
Основные поля: id, organization_id, full_name, phone, email.
Связи: StudentGuardian.
Бизнес-правила: один опекун может быть связан с несколькими учениками.

## StudentGuardian
Назначение: связь ученик-опекун.
Основные поля: id, organization_id, student_id, guardian_id, relation.
Связи: Student, Guardian.
Бизнес-правила: уникальность пары student_id + guardian_id.

## Teacher
Назначение: преподаватель.
Основные поля: id, organization_id, full_name, status.
Связи: TeacherGroup, LessonSession, SalaryRule.
Бизнес-правила: может вести несколько групп.

## Course
Назначение: образовательный курс.
Основные поля: id, organization_id, title, duration, price.
Связи: Group.
Бизнес-правила: курс используется при создании групп.

## Group
Назначение: учебная группа.
Основные поля: id, organization_id, course_id, title, status.
Связи: Course, Enrollment, TeacherGroup, LessonSession.
Бизнес-правила: группа может иметь несколько преподавателей.

## Enrollment
Назначение: зачисление ученика в группу.
Основные поля: id, organization_id, student_id, group_id, status, started_at.
Связи: Student, Group.
Бизнес-правила: ученик может быть зачислен в несколько групп.

## TeacherGroup
Назначение: связь преподаватель-группа.
Основные поля: id, organization_id, teacher_id, group_id.
Связи: Teacher, Group.
Бизнес-правила: преподаватель может быть назначен в несколько групп.

## LessonSession
Назначение: конкретное занятие.
Основные поля: id, organization_id, group_id, teacher_id, starts_at, ends_at.
Связи: Group, Teacher, Attendance.
Бизнес-правила: занятие принадлежит одной группе.

## Attendance
Назначение: посещаемость ученика на занятии.
Основные поля: id, organization_id, lesson_session_id, student_id, status.
Связи: LessonSession, Student.
Бизнес-правила: один статус посещаемости на ученика и занятие.

## BillingPlan
Назначение: тарифный план продукта.
Основные поля: id, code, name, price, period.
Связи: Subscription.
Бизнес-правила: используется только в контексте подписки.

## Invoice
Назначение: счёт на оплату обучения.
Основные поля: id, organization_id, student_id, amount, status, due_date.
Связи: Student, Payment.
Бизнес-правила: допускаются частичные оплаты.

## Payment
Назначение: оплата по счёту.
Основные поля: id, organization_id, invoice_id, amount, paid_at, method.
Связи: Invoice.
Бизнес-правила: сумма не может превышать остаток по счёту.

## SalaryRule
Назначение: правило расчёта зарплаты.
Основные поля: id, organization_id, teacher_id, type (per_lesson/percent), rate.
Связи: Teacher, SalaryAccrual.
Бизнес-правила: тип определяет метод расчёта.

## SalaryAccrual
Назначение: начисление зарплаты.
Основные поля: id, organization_id, teacher_id, period, amount, source.
Связи: Teacher, Payout.
Бизнес-правила: может быть рассчитано по занятиям или % от дохода.

## Payout
Назначение: выплата преподавателю.
Основные поля: id, organization_id, teacher_id, amount, paid_at, status.
Связи: Teacher, SalaryAccrual.
Бизнес-правила: выплата закрывает одно или несколько начислений.

## Certificate
Назначение: сертификат об окончании курса.
Основные поля: id, organization_id, student_id, course_id, issued_at.
Связи: Student, Course.
Бизнес-правила: выдаётся при выполнении условий завершения.
