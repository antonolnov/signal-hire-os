const labelMap: Record<string, string> = {
  active: "Активно",
  draft: "Черновик",
  archived: "Архив",
  paused: "На паузе",
  escalated: "Эскалация",
  closed: "Закрыто",
  new: "Новый",
  screening: "Скрининг",
  interview: "Интервью",
  rejected: "Отказ",
  hired: "Нанят",
  strong: "Сильное совпадение",
  medium: "Среднее совпадение",
  weak: "Слабое совпадение",
  manual: "Ручной",
  resume_upload: "Загрузка резюме",
  linkedin_capture: "Захват из LinkedIn",
  api: "API",
  linked: "Связано",
  pending: "Ожидает",
  duplicate_review: "Проверка на дубль",
  manual_form: "Ручная форма",
  file: "Файл",
  url: "Ссылка",
  guardrailed: "С ограничениями",
  email: "Email",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  full_time: "Полная занятость",
  "full-time": "Полная занятость",
  part_time: "Частичная занятость",
  "part-time": "Частичная занятость",
  contract: "Контракт",
  remote: "Удалённо",
  hybrid: "Гибрид",
};

const stageNameMap: Record<string, string> = {
  "AI pre-screen": "ИИ-прескрин",
  "Recruiter review": "Проверка рекрутером",
  Interview: "Интервью",
  Rejected: "Отказ",
  Hired: "Нанят",
  "Новые": "Новые",
};

export function uiLabel(value?: string | null) {
  if (!value) return "";
  return labelMap[value] ?? value;
}

export function uiStageName(value?: string | null) {
  if (!value) return "";
  return stageNameMap[value] ?? value;
}
