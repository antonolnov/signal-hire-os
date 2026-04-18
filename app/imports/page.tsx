import { PageShell } from "../../components/page-shell";
import {
  createImportRecord,
  createImportSource,
  deleteImportRecord,
  deleteImportSource,
  updateImportRecord,
  updateImportSource,
} from "../../lib/actions/imports";
import { getCandidates } from "../../lib/queries/candidates";
import { getImportSources, getImportSummaryMetrics } from "../../lib/queries/imports";
import { getJobs } from "../../lib/queries/jobs";
import { ensureSeedData } from "../../lib/seed";
import { uiLabel } from "../../lib/ui";

export const dynamic = "force-dynamic";

export default async function ImportsPage() {
  await ensureSeedData();
  const [sources, metrics, jobs, candidates] = await Promise.all([
    getImportSources(),
    getImportSummaryMetrics(),
    getJobs(),
    getCandidates(),
  ]);

  return (
    <PageShell>
      <section className="grid-2">
        <article className="card highlight">
          <div className="card-inner">
            <div className="kicker">Центр импорта</div>
            <h2 className="section-title">Относись к источникам и импорту как к части операций, а не к служебным настройкам</h2>
            <p className="muted">
              Импорт теперь выглядит как часть рекрутингового контура. Видно, откуда приходит поток,
              что уже связано с заявкой и где нужна ручная проверка.
            </p>
            <div className="hero-grid">
              <div className="stat">
                <strong>{metrics.sourceCount}</strong>
                <div>Источники</div>
              </div>
              <div className="stat">
                <strong>{metrics.linkedApplications}</strong>
                <div>Связанные заявки</div>
              </div>
              <div className="stat">
                <strong>{metrics.totalIngestions}</strong>
                <div>Записи импорта</div>
              </div>
              <div className="stat">
                <strong>{metrics.pendingReview}</strong>
                <div>Требуют проверки</div>
              </div>
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-inner">
            <div className="kicker">Создать источник</div>
            <form action={createImportSource} className="stack">
              <input type="hidden" name="workspaceSlug" value="signal-hire-demo" />
              <label>
                <div>Название источника</div>
                <input name="label" required placeholder="Почта рекомендаций" />
              </label>
              <label>
                <div>Тип</div>
                <input name="type" required placeholder="manual / resume_upload / api (служебные коды)" />
              </label>
              <button className="cta" type="submit">
                Создать источник
              </button>
            </form>
          </div>
        </article>
      </section>

      <section className="grid-2 dashboard-section">
        <article className="card">
          <div className="card-inner">
            <div className="kicker">Создать запись импорта</div>
            <form action={createImportRecord} className="stack">
              <input type="hidden" name="workspaceSlug" value="signal-hire-demo" />
              <div className="grid-2">
                <label>
                  <div>Источник</div>
                  <select name="sourceId" defaultValue="">
                    <option value="">Без источника</option>
                    {sources.map((source: any) => (
                      <option key={source.id} value={source.id}>
                        {source.label} · {uiLabel(source.type)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <div>Кандидат</div>
                  <select name="candidateId" defaultValue="">
                    <option value="">Без кандидата</option>
                    {candidates.map((candidate: any) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.fullName}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                <div>Вакансия</div>
                <select name="jobId" defaultValue="">
                  <option value="">Без вакансии</option>
                  {jobs.map((job: any) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid-2">
                <label>
                  <div>Статус</div>
                  <input name="status" required defaultValue="pending" />
                </label>
                <label>
                  <div>Тип данных</div>
                  <input name="payloadType" required defaultValue="manual_form" />
                </label>
              </div>
              <button className="cta" type="submit">
                Добавить запись импорта
              </button>
            </form>
          </div>
        </article>

        <article className="card">
          <div className="card-inner">
            <div className="kicker">Типы источников</div>
            <div className="quick-links">
              <div className="quick-link">
                <strong>Ручной ввод</strong>
                <span>Быстрый ручной входящий поток со стороны рекрутера</span>
              </div>
              <div className="quick-link">
                <strong>Загрузка резюме</strong>
                <span>Резюме кандидата и структурированное извлечение данных</span>
              </div>
              <div className="quick-link">
                <strong>Массовый импорт</strong>
                <span>Загрузка исторических кандидатов и лидов</span>
              </div>
              <div className="quick-link">
                <strong>Захват из LinkedIn</strong>
                <span>Проспектинг и вход во внешний пайплайн поиска</span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="stack dashboard-section">
        {sources.map((source) => {
          const item = source as any;

          return (
            <article className="card" key={item.id}>
              <div className="card-inner">
                <div className="section-head">
                  <div>
                    <div className="kicker">{uiLabel(item.type)}</div>
                    <h3 className="section-title">{item.label}</h3>
                  </div>
                  <div className="badge-row badge-row-tight">
                    <span className="badge">{item.applications?.length ?? 0} связанных заявок</span>
                    <span className="badge">{item.ingestions?.length ?? 0} импортов</span>
                  </div>
                </div>

                <form action={updateImportSource} className="grid-2" style={{ marginTop: 16 }}>
                  <input type="hidden" name="sourceId" value={item.id} />
                  <label>
                    <div>Название</div>
                    <input name="label" defaultValue={item.label ?? ""} required />
                  </label>
                  <label>
                    <div>Тип</div>
                    <input name="type" defaultValue={item.type ?? ""} required />
                  </label>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <button className="cta secondary" type="submit">
                      Сохранить источник
                    </button>
                  </div>
                </form>

                <form action={deleteImportSource} style={{ marginTop: 12 }}>
                  <input type="hidden" name="sourceId" value={item.id} />
                  <button className="cta secondary" type="submit">
                    Удалить источник
                  </button>
                </form>

                <div className="stack compact-stack" style={{ marginTop: 20 }}>
                  {item.ingestions?.length > 0 ? (
                    item.ingestions.map((ingestion: any) => (
                      <div className="list-card" key={ingestion.id}>
                        <div className="list-card-top">
                          <strong>{uiLabel(ingestion.status)}</strong>
                          <span className="badge">{uiLabel(ingestion.payloadType)}</span>
                        </div>
                        <div className="muted">
                          {[ingestion.candidateId, ingestion.jobId].filter(Boolean).join(" · ") || "Пока без связей"}
                        </div>

                        <form action={updateImportRecord} className="grid-2" style={{ marginTop: 12 }}>
                          <input type="hidden" name="ingestionId" value={ingestion.id} />
                          <label>
                            <div>Статус</div>
                            <input name="status" defaultValue={ingestion.status ?? ""} required />
                          </label>
                          <label>
                            <div>Тип данных</div>
                            <input name="payloadType" defaultValue={ingestion.payloadType ?? ""} required />
                          </label>
                          <div style={{ gridColumn: "1 / -1" }}>
                            <button className="cta secondary" type="submit">
                              Обновить запись импорта
                            </button>
                          </div>
                        </form>

                        <form action={deleteImportRecord} style={{ marginTop: 10 }}>
                          <input type="hidden" name="ingestionId" value={ingestion.id} />
                          <button className="cta secondary" type="submit">
                            Удалить запись импорта
                          </button>
                        </form>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">Для этого источника пока нет записей импорта.</div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </PageShell>
  );
}
