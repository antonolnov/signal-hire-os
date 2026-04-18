import { PageShell } from "../../components/page-shell";
import { advanceApplicationStage } from "../../lib/actions/pipeline";
import { getPipelineBoard, getPipelineSummaryMetrics } from "../../lib/queries/pipeline";
import { ensureSeedData } from "../../lib/seed";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  await ensureSeedData();
  const [jobs, metrics] = await Promise.all([getPipelineBoard(), getPipelineSummaryMetrics()]);

  return (
    <PageShell>
      <section className="grid-2">
        <article className="card">
          <div className="card-inner">
            <div className="kicker">Pipeline board</div>
            <h2 className="section-title">Kanban по applications уже из реальных stage-ов</h2>
            <p className="muted">
              Тут теперь видно живую воронку по вакансиям, а не просто статический скелет.
            </p>
            <div className="hero-grid">
              <div className="stat">
                <strong>{metrics.openJobs}</strong>
                <div>Jobs в воронке</div>
              </div>
              <div className="stat">
                <strong>{metrics.totalApplications}</strong>
                <div>Applications</div>
              </div>
              <div className="stat">
                <strong>{metrics.screeningLoad}</strong>
                <div>В screening</div>
              </div>
              <div className="stat">
                <strong>{metrics.strongFits}</strong>
                <div>Strong fit</div>
              </div>
            </div>
          </div>
        </article>

        <article className="card highlight">
          <div className="card-inner">
            <div className="kicker">Operator view</div>
            <ul className="list">
              <li>Stage остаётся источником правды по движению кандидата.</li>
              <li>Fit и recommendation подтягиваются рядом, а не живут отдельно.</li>
              <li>Следующий шаг, где застряли кандидаты, видно прямо в колонках.</li>
            </ul>
          </div>
        </article>
      </section>

      <section className="stack" style={{ marginTop: 20 }}>
        {jobs.map((job) => {
          const board = job as any;

          return (
            <article className="card" key={board.id}>
              <div className="card-inner">
                <div className="kicker">{board.status}</div>
                <h3 className="section-title">{board.title}</h3>
                <p className="muted">
                  {[board.department, board.location, board.employmentType]
                    .filter(Boolean)
                    .join(" · ") || "Без деталей"}
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 16,
                    marginTop: 20,
                  }}
                >
                  {board.pipelineStages.map((stage: any, stageIndex: number) => {
                    const nextStage = board.pipelineStages[stageIndex + 1];

                    return (
                    <div className="stat" key={stage.id}>
                      <div className="kicker">{stage.kind}</div>
                      <h4 style={{ margin: "8px 0 12px" }}>{stage.name}</h4>
                      <ul className="list">
                        {stage.applications.length > 0 ? (
                          stage.applications.map((application: any) => {
                            const recommendation = application.recommendations?.[0];

                            return (
                              <li key={application.id}>
                                <form action={advanceApplicationStage}>
                                  <input type="hidden" name="applicationId" value={application.id} />
                                  <input type="hidden" name="nextStageId" value={nextStage?.id ?? ""} />
                                <strong>{application.candidate?.fullName ?? "Unknown candidate"}</strong>
                                <div className="muted" style={{ marginTop: 6 }}>
                                  {[
                                    application.candidate?.headline,
                                    application.candidate?.currentCompany,
                                    application.candidate?.location,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ") || "Без деталей"}
                                </div>
                                <div className="badge-row" style={{ marginTop: 10 }}>
                                  {application.fitLevel ? (
                                    <span className="badge">{application.fitLevel}</span>
                                  ) : null}
                                  <span className="badge">{application.status}</span>
                                </div>
                                <div className="muted" style={{ marginTop: 10 }}>
                                  {recommendation?.why ?? application.recommendedNextStep ?? "Next step появится здесь"}
                                </div>
                                {nextStage ? (
                                  <button className="cta secondary" style={{ marginTop: 10 }} type="submit">
                                    Перевести в {nextStage.name}
                                  </button>
                                ) : null}
                                </form>
                              </li>
                            );
                          })
                        ) : (
                          <li>Пока пусто</li>
                        )}
                      </ul>
                    </div>
                  );})}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </PageShell>
  );
}
