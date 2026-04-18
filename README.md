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

## Запуск через GitHub Codespaces

Если нужен доступ без Vercel, можно поднять ATS прямо на GitHub:

1. Открой репозиторий в GitHub.
2. Нажми `Code` → `Codespaces` → `Create codespace on main`.
3. Дождись `npm install`.
4. В терминале запусти:

```bash
npm run dev
```

5. Открой вкладку `Ports`, найди порт `3000` и сделай его `Public`.
6. GitHub даст публичную ссылку вида `https://<random>-3000.app.github.dev`.

Это не GitHub Pages, а живой dev instance, поэтому Next.js app и server actions работают нормально.

## Где лежат данные

- runtime store: `state/ats-store.json`
- логика store: `lib/store.ts`

## Следующие шаги

- добавить CRUD для кандидатов и imports
- сделать approvals и recruiter actions в conversations
- при необходимости позже подключить Supabase/Auth/background jobs поверх локального ядра
