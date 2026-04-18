import { PageShell } from "../../components/page-shell";

export const dynamic = "force-dynamic";
import { createJob } from "../../lib/actions/jobs";
import { getJobs, getJobSummaryMetrics } from "../../lib/queries/jobs";
import { ensureSeedData } from "../../lib/seed";

export default async function JobsPage() {
  await ensureSeedData();
  const [jobs, metrics] = await Promise.all([getJobs(), getJobSummaryMetrics()]);

  return (
    <PageShell>
      <section className="grid-2">
        <article className="card">
          <div className="card-inner">
            <div className="kicker">Jobs</div>
            <h2 className="section-title">Вакансии и scorecards уже из реальных данных</h2>
            <p className="muted">
              Это первая data-backed страница, дальше такой же подход пойдет в candidates, pipeline и ingestion.
            </p>
            <div className="hero-grid">
              <div className="stat">
                <strong>{metrics.activeJobs}</strong>
                <div>Активных вакансий</div>
              </div>
              <div className="stat">
                <strong>{metrics.totalApplications}</strong>
                <div>Всего applications</div>
              </div>
              <div className="stat">
                <strong>{metrics.screeningApplications}</strong>
                <div>В AI screening</div>
              </div>
            </div>
          </div>
        </article>
        <article className="card highlight">
          <div className="card-inner">
            <div className="kicker">Create job</div>
            <form action={createJob} className="stack">
              <input type="hidden" name="workspaceSlug" value="signal-hire-demo" />
              <label>
                <div>Название вакансии</div>
                <input name="title" required placeholder="Например, Senior Recruiter" />
              </label>
              <label>
                <div>Отдел</div>
                <input name="department" placeholder="Hiring / Product / Engineering" />
              </label>
              <label>
                <div>Локация</div>
                <input name="location" placeholder="Remote / Berlin / Hybrid" />
              </label>
              <label>
                <div>Тип занятости</div>
                <input name="employmentType" placeholder="Full-time" />
              </label>
              <label>
                <div>Сырое описание</div>
                <textarea name="descriptionRaw" rows={5} placeholder="Опиши роль свободным языком. Дальше сюда подключим AI scorecard generation." />
              </label>
              <button className="cta" type="submit">
                Создать вакансию
              </button>
            </form>
          </div>
        </article>
      </section>

      <section className="grid-3">
        {jobs.map((job) => {
          const card = job as any;
          const latestScorecard = card.scorecards?.[0];

          return (
            <article className="card" key={card.id}>
              <div className="card-inner">
                <div className="kicker">{card.status}</div>
                <h3 className="section-title">{card.title}</h3>
                <p className="muted">
                  {[card.department, card.location, card.employmentType].filter(Boolean).join(" · ") || "Без деталей"}
                </p>
                <ul className="list">
                  <li>{card.applications?.length ?? 0} applications</li>
                  <li>{card.pipelineStages?.length ?? 0} pipeline stages</li>
                  <li>{latestScorecard?.summary ?? "Черновой scorecard появится здесь"}</li>
                </ul>
              </div>
            </article>
          );
        })}
      </section>
    </PageShell>
  );
}
