# Статус проекта

## Current state
- Документы: requirements, domains, architecture готовы.
- Стек и формат авторизации утверждены.
- Backend scaffold на NestJS создан.
- Prisma schema и миграции для Organization/User/Subscription/Student готовы.
- Auth endpoints и CRUD Students реализованы с tenant isolation.

## Next actions
- Этап 4: Groups + Enrollment.
- Этап 5: Lessons & Attendance.

## Open questions
- Хранилище сертификатов: S3 или локально.
- Инструмент HTML -> PDF для шаблона.
- Тарифы и условия подписки.

## Risks
- Отсутствие подтвержденных пользователей на старте.
- Задержки в выборе PDF-инструмента.

## Milestones
- Готовность базового каркаса проекта.
- Работающий контур Auth + Tenancy.
- Базовые справочники и группы.
- Финансовый и зарплатный контуры.
- MVP: сертификаты и дашборд.
