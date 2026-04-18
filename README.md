# Signal Hire OS

AI-native ATS MVP для recruiting teams, который сейчас работает полностью локально без Prisma и Postgres.

## Что уже есть

- Next.js app с основными ATS-модулями
- recruiter command center на главной
- jobs, candidates, pipeline, conversations, playbooks, imports
- локальное файловое хранилище в `state/ats-store.json`
- server actions для создания вакансий, playbooks и движения кандидатов по pipeline

## Быстрый старт

```bash
npm install
npm run dev
```

Открой приложение и работай сразу. Начальные данные создаются автоматически в локальном JSON store.

## Где лежат данные

- runtime store: `state/ats-store.json`
- логика store: `lib/store.ts`

## Следующие шаги

- добавить CRUD для кандидатов и imports
- сделать approvals и recruiter actions в conversations
- при необходимости позже подключить Supabase/Auth/background jobs поверх локального ядра
