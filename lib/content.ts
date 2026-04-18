export const dashboardMetrics = [
  { label: "Активных вакансий", value: "12", note: "+3 за неделю" },
  { label: "Кандидатов в AI-скрининге", value: "248", note: "68% без ручного касания" },
  { label: "Среднее время до shortlist", value: "19 ч", note: "вместо 3.2 дней" },
  { label: "Диалогов по playbook", value: "83", note: "12 ждут эскалации" },
];

export const sourceCards = [
  {
    title: "Мульти-источники кандидатов",
    text: "Ручное добавление, загрузка резюме, bulk import, LinkedIn capture и будущие job board интеграции входят в единый ingestion layer.",
  },
  {
    title: "AI-разбор и нормализация",
    text: "Система превращает сырой файл, текст или URL в кандидатский профиль, application и evidence-based fit summary.",
  },
  {
    title: "Сценарные диалоги",
    text: "Рекрутеры создают playbook, а ИИ общается с кандидатом только в рамках разрешенного сценария и фиксирует structured facts.",
  },
];

export const workflowSteps = [
  "Создать вакансию и получить AI scorecard",
  "Подать кандидата через любой источник",
  "Автоматически разобрать и привязать к вакансии",
  "Запустить AI pre-screen по playbook",
  "Получить recruiter brief и следующее действие",
  "Передать hiring manager только decision-ready shortlists",
];

export const workspaceModules = [
  ["Вакансии и scorecards", "Jobs, stages, hiring criteria, screening logic"],
  ["Candidate ingestion", "Manual input, files, bulk import, LinkedIn capture"],
  ["Candidate workspace", "Profile, evidence, notes, AI insight, activity"],
  ["Playbook engine", "Scenario rules, guardrails, escalations, autonomy mode"],
  ["Conversation inbox", "AI sessions, approvals, transcript, extracted facts"],
  ["Hiring briefs", "Shortlist summary, concerns, interview focus"],
];

export const milestones = [
  {
    title: "Фаза 1. Foundation",
    bullets: ["workspace + auth", "jobs + scorecards", "pipeline skeleton"],
  },
  {
    title: "Фаза 2. Ingestion",
    bullets: ["resume upload", "bulk import", "dedupe + linking"],
  },
  {
    title: "Фаза 3. Intelligence",
    bullets: ["fit analysis", "candidate insights", "recommendations"],
  },
  {
    title: "Фаза 4. Conversations",
    bullets: ["playbooks", "AI sessions", "transcript + extracted facts"],
  },
];
