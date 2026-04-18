import { PageShell } from "../../components/page-shell";
import { createJob } from "../../lib/actions/jobs";
import { getJobs, getJobSummaryMetrics } from "../../lib/queries/jobs";
import { ensureSeedData } from "../../lib/seed";
import { uiLabel, uiStageName } from "../../lib/ui";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  await ensureSeedData();
  const [jobs, metrics] = await Promise.all([getJobs(), getJobSummaryMetrics()]);

  return (
    <PageShell>
      <section className="grid-2">
        <article className="card highlight">
          <div className="card-inner">
            <div className="kicker">План найма</div>
            <h2 className="section-title">Роли, критерии оценки и структура этапов в одном месте</h2>
            <p className="muted">
              Здесь начинается операционная модель найма. Вакансия задаёт карту этапов, базу
              критериев оценки и дальше становится контейнером для пайплайна, диалогов и ИИ-сценариев.
            </p>
            <div className="hero-grid">
              <div className="stat">
                <strong>{metrics.activeJobs}</strong>
                <div>Активные вакансии</div>
              </div>
              <div className="stat">
                <strong>{metrics.totalApplications}</strong>
                <div>Всего заявок</div>
              </div>
              <div className="stat">
                <strong>{metrics.screeningApplications}</strong>
                <div>На скрининге</div>
              </div>
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-inner">
            <div className="kicker">Создать вакансию</div>
            <form action={createJob} className="stack">
              <input type="hidden" name="workspaceSlug" value="signal-hire-demo" />
              <label>
                <div>Название вакансии</div>
                <input name="title" required placeholder="Старший рекрутер" />
              </label>
              <div className="grid-2">
                <label>
                  <div>Отдел</div>
                  <input name="department" placeholder="Рекрутинг / Продукт / Разработка" />
                </label>
                <label>
                  <div>Локация</div>
                  <input name="location" placeholder="Удалённо / Берлин / Гибрид" />
                </label>
              </div>
              <label>
                <div>Тип занятости</div>
                <input name="employmentType" placeholder="Полная занятость" />
              </label>
              <label>
                <div>Черновой бриф вакансии</div>
                <textarea
                  name="descriptionRaw"
                  rows={5}
                  placeholder="Опиши роль свободным языком. Позже сюда можно подключить генерацию критериев оценки с помощью ИИ."
                />
              </label>
              <button className="cta" type="submit">
                Создать вакансию
              </button>
            </form>
          </div>
        </article>
      </section>

      <section className="grid-3 dashboard-section">
        {jobs.map((job) => {
          const card = job as any;
          const latestScorecard = card.scorecards?.[0];

          return (
            <article className="card" key={card.id}>
              <div className="card-inner">
                <div className="kicker">{uiLabel(card.status)}</div>
                <h3 className="section-title">{card.title}</h3>
                <p className="muted">
                  {[card.department, card.location, card.employmentType].filter(Boolean).join(" · ") || "Пока без метаданных"}
                </p>

                <div className="badge-row">
                  <span className="badge">{card.applications?.length ?? 0} заявок</span>
                  <span className="badge">{card.pipelineStages?.length ?? 0} этапов</span>
                </div>

                <div className="board-strip">
                  {(card.pipelineStages ?? []).slice(0, 4).map((stage: any) => (
                    <div className="board-cell" key={stage.id}>
                      <div className="kicker">{uiLabel(stage.kind)}</div>
                      <strong>{uiStageName(stage.name)}</strong>
                      <div className="muted">{stage.applications?.length ?? 0} кандидатов</div>
                    </div>
                  ))}
                </div>

                <ul className="list" style={{ marginTop: 18 }}>
                  <li>{latestScorecard?.summary ?? "Здесь появится черновая сводка по критериям оценки."}</li>
                  <li>
                    {card.descriptionRaw ?? "Бриф вакансии пуст, добавь контекст для более сильной автоматизации."}
                  </li>
                </ul>
              </div>
            </article>
          );
        })}
      </section>
    </PageShell>
  );
}
