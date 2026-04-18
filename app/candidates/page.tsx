import { PageShell } from "../../components/page-shell";
import {
  createCandidate,
  deleteCandidate,
  updateCandidate,
} from "../../lib/actions/candidates";
import { getCandidates, getCandidateSummaryMetrics } from "../../lib/queries/candidates";
import { getImportSources } from "../../lib/queries/imports";
import { getJobs } from "../../lib/queries/jobs";
import { ensureSeedData } from "../../lib/seed";
import { uiLabel, uiStageName } from "../../lib/ui";

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
        <article className="card highlight">
          <div className="card-inner">
            <div className="kicker">Рабочая зона кандидатов</div>
            <h2 className="section-title">Профили должны быть готовы к решению, а не просто храниться</h2>
            <p className="muted">
              Кандидат теперь выглядит как рабочая единица. Здесь рядом сводка, оценка совпадения,
              этап, источник, следующий шаг и быстрый CRUD профиля без отдельной внешней базы.
            </p>
            <div className="hero-grid">
              <div className="stat">
                <strong>{metrics.totalCandidates}</strong>
                <div>Всего кандидатов</div>
              </div>
              <div className="stat">
                <strong>{metrics.screeningCandidates}</strong>
                <div>На скрининге</div>
              </div>
              <div className="stat">
                <strong>{metrics.strongFitCandidates}</strong>
                <div>Сильное совпадение</div>
              </div>
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-inner">
            <div className="kicker">Создать кандидата</div>
            <form action={createCandidate} className="stack">
              <input type="hidden" name="workspaceSlug" value="signal-hire-demo" />
              <div className="grid-2">
                <label>
                  <div>Полное имя</div>
                  <input name="fullName" required placeholder="Анна Иванова" />
                </label>
                <label>
                  <div>Электронная почта</div>
                  <input name="email" type="email" placeholder="anna@example.com" />
                </label>
              </div>
              <div className="grid-2">
                <label>
                  <div>Роль / заголовок</div>
                  <input name="headline" placeholder="Старший рекрутер" />
                </label>
                <label>
                  <div>Локация</div>
                  <input name="location" placeholder="Берлин / Удалённо" />
                </label>
              </div>
              <div className="grid-2">
                <label>
                  <div>Текущая компания</div>
                  <input name="currentCompany" placeholder="Текущий работодатель" />
                </label>
                <label>
                  <div>Лет опыта</div>
                  <input name="yearsExperience" type="number" min="0" placeholder="6" />
                </label>
              </div>
              <label>
                <div>Навыки</div>
                <input name="skills" placeholder="поиск кандидатов, операционный найм, управление стейкхолдерами" />
              </label>
              <div className="grid-2">
                <label>
                  <div>Вакансия</div>
                  <select name="jobId" defaultValue="">
                    <option value="">Без связанной заявки</option>
                    {jobs.map((job: any) => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                </label>
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
              </div>
              <label>
                <div>Принудительный этап</div>
                <select name="currentStageId" defaultValue="">
                  <option value="">Определить этап автоматически</option>
                  {jobs.flatMap((job: any) =>
                    (job.pipelineStages ?? []).map((stage: any) => (
                      <option key={stage.id} value={stage.id}>
                        {job.title} · {uiStageName(stage.name)}
                      </option>
                    )),
                  )}
                </select>
              </label>
              <label>
                <div>Сводка</div>
                <textarea name="summary" rows={4} placeholder="Короткая сводка для рекрутера" />
              </label>
              <button className="cta" type="submit">
                Создать кандидата
              </button>
            </form>
          </div>
        </article>
      </section>

      <section className="grid-3 dashboard-section">
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
                <div className="kicker">{primaryApplication?.job?.title ?? "Без назначения"}</div>
                <h3 className="section-title">{card.fullName}</h3>
                <p className="muted">
                  {[
                    card.headline,
                    card.location,
                    card.currentCompany,
                    card.yearsExperience ? `${card.yearsExperience} лет опыта` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Пока без метаданных профиля"}
                </p>

                <div className="badge-row">
                  {primaryApplication?.fitLevel ? <span className="badge">{uiLabel(primaryApplication.fitLevel)}</span> : null}
                  {primaryApplication?.currentStage?.name ? (
                    <span className="badge">{uiStageName(primaryApplication.currentStage.name)}</span>
                  ) : null}
                </div>

                <ul className="list">
                  <li>{latestInsight?.content ?? card.summary ?? "Здесь появится сводка кандидата."}</li>
                  <li>
                    {latestRecommendation?.why ?? primaryApplication?.recommendedNextStep ?? "Здесь появится следующий шаг."}
                  </li>
                  <li>{skills || "Навыки появятся после структурированного извлечения профиля."}</li>
                </ul>

                <form action={updateCandidate} className="grid-2" style={{ marginTop: 20 }}>
                  <input type="hidden" name="candidateId" value={card.id} />
                  <label>
                    <div>Полное имя</div>
                    <input name="fullName" defaultValue={card.fullName ?? ""} required />
                  </label>
                  <label>
                    <div>Электронная почта</div>
                    <input name="email" type="email" defaultValue={card.email ?? ""} />
                  </label>
                  <label>
                    <div>Роль / заголовок</div>
                    <input name="headline" defaultValue={card.headline ?? ""} />
                  </label>
                  <label>
                    <div>Локация</div>
                    <input name="location" defaultValue={card.location ?? ""} />
                  </label>
                  <label>
                    <div>Текущая компания</div>
                    <input name="currentCompany" defaultValue={card.currentCompany ?? ""} />
                  </label>
                  <label>
                    <div>Лет опыта</div>
                    <input
                      name="yearsExperience"
                      type="number"
                      min="0"
                      defaultValue={card.yearsExperience ?? ""}
                    />
                  </label>
                  <label>
                    <div>Навыки</div>
                    <input name="skills" defaultValue={skills} />
                  </label>
                  <label>
                    <div>Предпочтение по формату работы</div>
                    <input name="workPreference" defaultValue={card.profile?.workPreference ?? ""} />
                  </label>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label>
                      <div>Сводка</div>
                      <textarea name="summary" rows={4} defaultValue={card.summary ?? ""} />
                    </label>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <button className="cta secondary" type="submit">
                      Сохранить профиль кандидата
                    </button>
                  </div>
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
