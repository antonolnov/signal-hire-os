# ARCHITECTURE - Signal Hire OS MVP

## Текущий стек

- Next.js
- TypeScript
- local file store (`state/ats-store.json`)
- server actions for mutations
- Supabase/Auth/Storage as optional future layer
- OpenAI as primary AI provider
- Vercel for web deploy

## Основные модули

- auth and workspace
- jobs and scorecards
- candidates and applications
- ingestion
- playbooks
- conversations
- insights and recommendations
- activity audit

## Главные принципы модели

- Candidate отдельно от Application
- IngestionRecord отдельно от Candidate
- ConversationSession привязана к Application
- AI никогда не скрывает evidence behind recommendation

## Следующие шаги

1. Расширить локальный store до полного CRUD по кандидатам и imports
2. Добавить recruiter approvals и actions в conversations
3. Подключить Supabase Auth/Storage, если понадобится shared backend
4. Добавить ingestion queue
5. Реализовать первые AI flows
