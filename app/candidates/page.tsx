import { PageShell } from "../../components/page-shell";
import {
  createCandidate,
  deleteCandidate,
  updateCandidate,
} from "../../lib/actions/candidates";
import { getImportSources } from "../../lib/queries/imports";
import { getJobs } from "../../lib/queries/jobs";
import { getCandidates, getCandidateSummaryMetrics } from "../../lib/queries/candidates";
import { ensureSeedData } from "../../lib/seed";

export const dynamic = "force-dynamic";

export default async function CandidatesPage() {
  await ensureSeedData();
  const [candidates, metrics, jobs, sources] = await Promise.all([
    getCandidates(),
    getCandidateSummaryMetrics(),
    getJobs(),
    getImportSources(),
  ]);

  return (
    <PageShell>
      <section className="grid-2">
        <article className="card">
          <div className="card-inner">
            <div className="kicker">Candidate workspace</div>
            <h2 className="section-title">Кандидаты уже собираются в decision-ready профили</h2>
            <p className="muted">
              Теперь здесь уже не только read view, но и локальный CRUD для профилей и первичного
              прикрепления к вакансии.
            </p>
            <div className="hero-grid">
              <div className="stat">
                <strong>{metrics.totalCandidates}</strong>
                <div>Кандидатов</div>
              </div>
              <div className="stat">
                <strong>{metrics.screeningCandidates}</strong>
                <div>В screening</div>
              </div>
              <div className="stat">
                <strong>{metrics.strongFitCandidates}</strong>
                <div>Strong fit</div>
              </div>
            </div>
          </div>
        </article>
        <article className="card highlight">
          <div className="card-inner">
            <div className="kicker">Create candidate</div>
            <form action={createCandidate} className="stack">
              <input type="hidden" name="workspaceSlug" value="signal-hire-demo" />
              <label>
                <div>Полное имя</div>
                <input name="fullName" required placeholder="Например, Jane Doe" />
              </label>
              <label>
                <div>Email</div>
                <input name="email" type="email" placeholder="jane@example.com" />
              </label>
              <label>
                <div>Headline</div>
                <input name="headline" placeholder="Senior Recruiter" />
              </label>
              <label>
                <div>Location</div>
                <input name="location" placeholder="Berlin / Remote" />
              </label>
              <label>
                <div>Current company</div>
                <input name="currentCompany" placeholder="Current employer" />
              </label>
              <label>
                <div>Years of experience</div>
                <input name="yearsExperience" type="number" min="0" placeholder="6" />
              </label>
              <label>
                <div>Skills</div>
                <input name="skills" placeholder="Python, Queues, Postgres" />
              </label>
              <label>
                <div>Job</div>
                <select name="jobId" defaultValue="">
                  <option value="">Без application</option>
                  {jobs.map((job: any) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </label>
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
                <div>Stage override</div>
                <select name="currentStageId" defaultValue="">
                  <option value="">Авто stage</option>
                  {jobs.flatMap((job: any) =>
                    (job.pipelineStages ?? []).map((stage: any) => (
                      <option key={stage.id} value={stage.id}>
                        {job.title} · {stage.name}
                      </option>
                    )),
                  )}
                </select>
              </label>
              <label>
                <div>Summary</div>
                <textarea name="summary" rows={4} placeholder="Короткий summary по кандидату" />
              </label>
              <button className="cta" type="submit">
                Создать кандидата
              </button>
            </form>
          </div>
        </article>
      </section>

      <section className="grid-3">
        {candidates.map((candidate) => {
          const card = candidate as any;
          const primaryApplication = card.applications?.[0];
          const latestInsight = primaryApplication?.insights?.[0];
          const latestRecommendation = primaryApplication?.recommendations?.[0];
          const rawSkills = card.profile?.skills as string[] | null | undefined;
          const skills = Array.isArray(rawSkills) ? rawSkills.join(", ") : "";

          return (
            <article className="card" key={card.id}>
              <div className="card-inner">
                <div className="kicker">{primaryApplication?.job.title ?? "Unassigned"}</div>
                <h3 className="section-title">{card.fullName}</h3>
                <p className="muted">
                  {[
                    card.headline,
                    card.location,
                    card.currentCompany,
                    card.yearsExperience ? `${card.yearsExperience} years exp.` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Без деталей"}
                </p>
                <div className="badge-row">
                  {primaryApplication?.fitLevel ? <span className="badge">{primaryApplication.fitLevel}</span> : null}
                  {primaryApplication?.currentStage?.name ? (
                    <span className="badge">{primaryApplication.currentStage.name}</span>
                  ) : null}
                </div>
                <ul className="list">
                  <li>{latestInsight?.content ?? card.summary ?? "Summary появится здесь"}</li>
                  <li>
                    {latestRecommendation?.why ?? primaryApplication?.recommendedNextStep ?? "Next step появится здесь"}
                  </li>
                  <li>{skills || "Skills появятся после structured profile extraction"}</li>
                </ul>

                <form action={updateCandidate} className="stack" style={{ marginTop: 20 }}>
                  <input type="hidden" name="candidateId" value={card.id} />
                  <label>
                    <div>Имя</div>
                    <input name="fullName" defaultValue={card.fullName ?? ""} required />
                  </label>
                  <label>
                    <div>Email</div>
                    <input name="email" type="email" defaultValue={card.email ?? ""} />
                  </label>
                  <label>
                    <div>Headline</div>
                    <input name="headline" defaultValue={card.headline ?? ""} />
                  </label>
                  <label>
                    <div>Location</div>
                    <input name="location" defaultValue={card.location ?? ""} />
                  </label>
                  <label>
                    <div>Current company</div>
                    <input name="currentCompany" defaultValue={card.currentCompany ?? ""} />
                  </label>
                  <label>
                    <div>Years of experience</div>
                    <input
                      name="yearsExperience"
                      type="number"
                      min="0"
                      defaultValue={card.yearsExperience ?? ""}
                    />
                  </label>
                  <label>
                    <div>Skills</div>
                    <input name="skills" defaultValue={skills} />
                  </label>
                  <label>
                    <div>Work preference</div>
                    <input name="workPreference" defaultValue={card.profile?.workPreference ?? ""} />
                  </label>
                  <label>
                    <div>Summary</div>
                    <textarea name="summary" rows={4} defaultValue={card.summary ?? ""} />
                  </label>
                  <button className="cta secondary" type="submit">
                    Сохранить профиль
                  </button>
                </form>

                <form action={deleteCandidate} style={{ marginTop: 12 }}>
                  <input type="hidden" name="candidateId" value={card.id} />
                  <button className="cta secondary" type="submit">
                    Удалить кандидата
                  </button>
                </form>
              </div>
            </article>
          );
        })}
      </section>
    </PageShell>
  );
}
