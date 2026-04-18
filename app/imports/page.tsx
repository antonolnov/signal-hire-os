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
        <article className="card">
          <div className="card-inner">
            <div className="kicker">Ingestion center</div>
            <h2 className="section-title">Источники и импорт уже живут в локальном CRUD</h2>
            <p className="muted">
              Здесь теперь можно не только смотреть на source types и queue, но и создавать,
              редактировать и удалять их без внешней базы.
            </p>
            <div className="hero-grid">
              <div className="stat">
                <strong>{metrics.sourceCount}</strong>
                <div>Источников</div>
              </div>
              <div className="stat">
                <strong>{metrics.linkedApplications}</strong>
                <div>Linked applications</div>
              </div>
              <div className="stat">
                <strong>{metrics.totalIngestions}</strong>
                <div>Ingestion records</div>
              </div>
              <div className="stat">
                <strong>{metrics.pendingReview}</strong>
                <div>Pending review</div>
              </div>
            </div>
          </div>
        </article>
        <article className="card highlight">
          <div className="card-inner">
            <div className="kicker">Create source</div>
            <form action={createImportSource} className="stack">
              <input type="hidden" name="workspaceSlug" value="signal-hire-demo" />
              <label>
                <div>Label</div>
                <input name="label" required placeholder="Referral inbox" />
              </label>
              <label>
                <div>Type</div>
                <input name="type" required placeholder="manual / resume_upload / api" />
              </label>
              <button className="cta" type="submit">
                Создать source
              </button>
            </form>
          </div>
        </article>
      </section>

      <section className="grid-2" style={{ marginTop: 20 }}>
        <article className="card">
          <div className="card-inner">
            <div className="kicker">Create ingestion</div>
            <form action={createImportRecord} className="stack">
              <input type="hidden" name="workspaceSlug" value="signal-hire-demo" />
              <label>
                <div>Source</div>
                <select name="sourceId" defaultValue="">
                  <option value="">Без source</option>
                  {sources.map((source: any) => (
                    <option key={source.id} value={source.id}>
                      {source.label} · {source.type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <div>Candidate</div>
                <select name="candidateId" defaultValue="">
                  <option value="">Без candidate</option>
                  {candidates.map((candidate: any) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <div>Job</div>
                <select name="jobId" defaultValue="">
                  <option value="">Без job</option>
                  {jobs.map((job: any) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <div>Status</div>
                <input name="status" required defaultValue="pending" />
              </label>
              <label>
                <div>Payload type</div>
                <input name="payloadType" required defaultValue="manual_form" />
              </label>
              <button className="cta" type="submit">
                Добавить ingestion record
              </button>
            </form>
          </div>
        </article>
        <article className="card highlight">
          <div className="card-inner">
            <div className="kicker">First-class sources</div>
            <ul className="list">
              <li>manual entry</li>
              <li>resume upload</li>
              <li>bulk file import</li>
              <li>LinkedIn capture</li>
            </ul>
          </div>
        </article>
      </section>

      <section className="stack" style={{ marginTop: 20 }}>
        {sources.map((source) => {
          const item = source as any;

          return (
            <article className="card" key={item.id}>
              <div className="card-inner">
                <div className="section-head">
                  <div>
                    <div className="kicker">{item.type}</div>
                    <h3 className="section-title">{item.label}</h3>
                  </div>
                  <div className="badge-row">
                    <span className="badge">{item.applications?.length ?? 0} linked apps</span>
                    <span className="badge">{item.ingestions?.length ?? 0} ingestions</span>
                  </div>
                </div>

                <form action={updateImportSource} className="grid-2" style={{ marginTop: 16 }}>
                  <input type="hidden" name="sourceId" value={item.id} />
                  <label>
                    <div>Label</div>
                    <input name="label" defaultValue={item.label ?? ""} required />
                  </label>
                  <label>
                    <div>Type</div>
                    <input name="type" defaultValue={item.type ?? ""} required />
                  </label>
                  <div>
                    <button className="cta secondary" type="submit">
                      Сохранить source
                    </button>
                  </div>
                </form>

                <form action={deleteImportSource} style={{ marginTop: 12 }}>
                  <input type="hidden" name="sourceId" value={item.id} />
                  <button className="cta secondary" type="submit">
                    Удалить source
                  </button>
                </form>

                <div className="stack compact-stack" style={{ marginTop: 20 }}>
                  {item.ingestions?.length > 0 ? (
                    item.ingestions.map((ingestion: any) => (
                      <div className="list-card" key={ingestion.id}>
                        <div className="list-card-top">
                          <strong>{ingestion.status}</strong>
                          <span className="badge">{ingestion.payloadType}</span>
                        </div>
                        <div className="muted">
                          {[ingestion.candidateId, ingestion.jobId].filter(Boolean).join(" · ") || "Без связок"}
                        </div>

                        <form action={updateImportRecord} className="grid-2" style={{ marginTop: 12 }}>
                          <input type="hidden" name="ingestionId" value={ingestion.id} />
                          <label>
                            <div>Status</div>
                            <input name="status" defaultValue={ingestion.status ?? ""} required />
                          </label>
                          <label>
                            <div>Payload type</div>
                            <input name="payloadType" defaultValue={ingestion.payloadType ?? ""} required />
                          </label>
                          <div>
                            <button className="cta secondary" type="submit">
                              Обновить ingestion
                            </button>
                          </div>
                        </form>

                        <form action={deleteImportRecord} style={{ marginTop: 10 }}>
                          <input type="hidden" name="ingestionId" value={ingestion.id} />
                          <button className="cta secondary" type="submit">
                            Удалить ingestion
                          </button>
                        </form>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">Пока без ingestion records.</div>
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
