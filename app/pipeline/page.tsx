import { PageShell } from "../../components/page-shell";
import { advanceApplicationStage } from "../../lib/actions/pipeline";
import { getPipelineBoard, getPipelineSummaryMetrics } from "../../lib/queries/pipeline";
import { ensureSeedData } from "../../lib/seed";
import { uiLabel, uiStageName } from "../../lib/ui";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  await ensureSeedData();
  const [jobs, metrics] = await Promise.all([getPipelineBoard(), getPipelineSummaryMetrics()]);

  return (
    <PageShell>
      <section className="grid-2">
        <article className="card highlight">
          <div className="card-inner">
            <div className="kicker">Доска пайплайна</div>
            <h2 className="section-title">Отслеживай движение, находи узкие места и снимай блокировку с этапов</h2>
            <p className="muted">
              Здесь пайплайн должен ощущаться как рабочий инструмент оператора. Видно нагрузку,
              узкие места и можно сразу двигать кандидата на следующий этап.
            </p>
            <div className="hero-grid">
              <div className="stat">
                <strong>{metrics.openJobs}</strong>
                <div>Вакансий на доске</div>
              </div>
              <div className="stat">
                <strong>{metrics.totalApplications}</strong>
                <div>Всего заявок</div>
              </div>
              <div className="stat">
                <strong>{metrics.screeningLoad}</strong>
                <div>Нагрузка скрининга</div>
              </div>
              <div className="stat">
                <strong>{metrics.strongFits}</strong>
                <div>Сильные кандидаты</div>
              </div>
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-inner">
            <div className="kicker">Операторский режим</div>
            <ul className="list">
              <li>Этап остаётся источником правды для движения кандидата.</li>
              <li>Оценка совпадения, рекомендация и контекст кандидата живут рядом, а не в другой вкладке.</li>
              <li>Каждая колонка должна сразу отвечать на вопрос, где процесс застрял.</li>
            </ul>
          </div>
        </article>
      </section>

      <section className="stack dashboard-section">
        {jobs.map((job) => {
          const board = job as any;

          return (
            <article className="card" key={board.id}>
              <div className="card-inner">
                <div className="section-head">
                  <div>
                    <div className="kicker">{uiLabel(board.status)}</div>
                    <h3 className="section-title">{board.title}</h3>
                  </div>
                  <div className="badge-row badge-row-tight">
                    <span className="badge">{board.pipelineStages.length} этапов</span>
                    <span className="badge">
                      {board.pipelineStages.reduce(
                        (sum: number, stage: any) => sum + stage.applications.length,
                        0,
                      )} заявок
                    </span>
                  </div>
                </div>

                <p className="muted">
                  {[board.department, board.location, board.employmentType].filter(Boolean).join(" · ") || "Пока без метаданных вакансии"}
                </p>

                <div className="board-strip">
                  {board.pipelineStages.map((stage: any) => (
                    <div className="board-cell" key={stage.id}>
                      <div className="kicker">{uiLabel(stage.kind)}</div>
                      <strong>{uiStageName(stage.name)}</strong>
                      <div className="muted">{stage.applications.length} кандидатов</div>
                    </div>
                  ))}
                </div>

                <div
                  className="grid-3"
                  style={{
                    marginTop: 18,
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  }}
                >
                  {board.pipelineStages.map((stage: any, stageIndex: number) => {
                    const nextStage = board.pipelineStages[stageIndex + 1];

                    return (
                      <div className="card" key={stage.id}>
                        <div className="card-inner">
                          <div className="list-card-top">
                            <div>
                              <div className="kicker">{uiLabel(stage.kind)}</div>
                              <strong>{uiStageName(stage.name)}</strong>
                            </div>
                            <span className="badge">{stage.applications.length}</span>
                          </div>

                          <div className="stack compact-stack" style={{ marginTop: 12 }}>
                            {stage.applications.length > 0 ? (
                              stage.applications.map((application: any) => {
                                const recommendation = application.recommendations?.[0];

                                return (
                                  <div className="list-card" key={application.id}>
                                    <strong>{application.candidate?.fullName ?? "Неизвестный кандидат"}</strong>
                                    <div className="muted" style={{ marginTop: 6 }}>
                                      {[
                                        application.candidate?.headline,
                                        application.candidate?.currentCompany,
                                        application.candidate?.location,
                                      ]
                                        .filter(Boolean)
                                        .join(" · ") || "Пока без метаданных профиля"}
                                    </div>

                                    <div className="badge-row badge-row-tight">
                                      {application.fitLevel ? <span className="badge">{uiLabel(application.fitLevel)}</span> : null}
                                      <span className="badge">{uiLabel(application.status)}</span>
                                    </div>

                                    <div className="muted" style={{ marginTop: 12 }}>
                                      {recommendation?.why ?? application.recommendedNextStep ?? "Здесь появится следующий шаг."}
                                    </div>

                                    {nextStage ? (
                                      <form action={advanceApplicationStage} style={{ marginTop: 12 }}>
                                        <input type="hidden" name="applicationId" value={application.id} />
                                        <input type="hidden" name="nextStageId" value={nextStage.id} />
                                        <button className="cta secondary" type="submit">
                                          Перевести в {uiStageName(nextStage.name)}
                                        </button>
                                      </form>
                                    ) : null}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="empty-state">В этом этапе пока нет кандидатов.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </PageShell>
  );
}
