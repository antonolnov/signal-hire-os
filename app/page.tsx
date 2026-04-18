import Link from "next/link";
import { PageShell } from "../components/page-shell";
import { getCandidates, getCandidateSummaryMetrics } from "../lib/queries/candidates";
import {
  getConversationSessions,
  getConversationSummaryMetrics,
} from "../lib/queries/conversations";
import { getImportSources, getImportSummaryMetrics } from "../lib/queries/imports";
import { getJobs, getJobSummaryMetrics } from "../lib/queries/jobs";
import { getPipelineBoard, getPipelineSummaryMetrics } from "../lib/queries/pipeline";
import { getPlaybooks, getPlaybookSummaryMetrics } from "../lib/queries/playbooks";
import { ensureConversationDemoData, ensureSeedData } from "../lib/seed";

export const dynamic = "force-dynamic";

const fitOrder: Record<string, number> = {
  strong: 0,
  medium: 1,
  weak: 2,
};

export default async function HomePage() {
  await ensureSeedData();
  await ensureConversationDemoData();

  const [jobs, jobMetrics, candidates, candidateMetrics, sessions, conversationMetrics, pipeline, pipelineMetrics, playbooks, playbookMetrics, sources, importMetrics] =
    await Promise.all([
      getJobs(),
      getJobSummaryMetrics(),
      getCandidates(),
      getCandidateSummaryMetrics(),
      getConversationSessions(),
      getConversationSummaryMetrics(),
      getPipelineBoard(),
      getPipelineSummaryMetrics(),
      getPlaybooks(),
      getPlaybookSummaryMetrics(),
      getImportSources(),
      getImportSummaryMetrics(),
    ]);

  const prioritySessions = sessions
    .filter(
      (session) =>
        session.status === "escalated" || session.messages.some((message) => message.requiresApproval),
    )
    .slice(0, 4);

  const candidateQueue = candidates
    .map((candidate) => {
      const application = candidate.applications?.[0];
      const recommendation = application?.recommendations?.[0];
      const insight = application?.insights?.[0];

      return {
        candidate,
        application,
        recommendation,
        insight,
      };
    })
    .sort((left, right) => {
      const leftFit = fitOrder[left.application?.fitLevel ?? "weak"] ?? 99;
      const rightFit = fitOrder[right.application?.fitLevel ?? "weak"] ?? 99;
      return leftFit - rightFit;
    })
    .slice(0, 4);

  const pipelineHighlights = pipeline.slice(0, 2).map((job) => ({
    job,
    activeStages: job.pipelineStages.filter((stage) => stage.applications.length > 0),
  }));

  const sourceHighlights = (sources as any[]).slice(0, 3);
  const latestPlaybooks = (playbooks as any[]).slice(0, 3);

  return (
    <PageShell>
      <section className="hero">
        <article className="card">
          <div className="card-inner">
            <div className="kicker">Recruiter command center</div>
            <h2 className="hero-title">Уже можно смотреть на ATS как на рабочий интерфейс, а не только на концепт.</h2>
            <p className="muted">
              Главная теперь собирает живую картину по вакансиям, pipeline, AI-диалогам, approval queue и candidate decisions в одном месте.
            </p>

            <div className="hero-grid">
              <div className="stat">
                <strong>{jobMetrics.activeJobs}</strong>
                <div>Активных вакансий</div>
                <div className="muted">{jobMetrics.totalApplications} applications в работе</div>
              </div>
              <div className="stat">
                <strong>{candidateMetrics.screeningCandidates}</strong>
                <div>Кандидатов в screening</div>
                <div className="muted">{candidateMetrics.strongFitCandidates} strong fit</div>
              </div>
              <div className="stat">
                <strong>{conversationMetrics.approvalQueue}</strong>
                <div>Approval queue</div>
                <div className="muted">{conversationMetrics.escalations} escalations</div>
              </div>
              <div className="stat">
                <strong>{playbookMetrics.liveSessions}</strong>
                <div>Live AI sessions</div>
                <div className="muted">{playbookMetrics.activePlaybooks} active playbooks</div>
              </div>
            </div>

            <div className="quick-links" style={{ marginTop: 24 }}>
              <Link className="quick-link" href="/pipeline">
                <strong>Открыть pipeline</strong>
                <span>Сразу двигать кандидатов по stage-ам</span>
              </Link>
              <Link className="quick-link" href="/conversations">
                <strong>Разобрать inbox</strong>
                <span>Approval queue и escalation рядом с контекстом</span>
              </Link>
              <Link className="quick-link" href="/playbooks">
                <strong>Настроить playbooks</strong>
                <span>Управление сценариями AI-коммуникации</span>
              </Link>
            </div>
          </div>
        </article>

        <aside className="stack">
          <div className="card highlight">
            <div className="card-inner">
              <div className="kicker">Нужно внимание сейчас</div>
              <div className="alert-list">
                <div className="alert-item">
                  <strong>{conversationMetrics.approvalQueue} сообщений ждут approval</strong>
                  <div className="muted">Кандидат ушёл в salary / policy discussion и просит recruiter input.</div>
                </div>
                <div className="alert-item">
                  <strong>{pipelineMetrics.screeningLoad} applications висят в screening</strong>
                  <div className="muted">Тут самая быстрая возможность сократить time-to-shortlist.</div>
                </div>
                <div className="alert-item">
                  <strong>{importMetrics.pendingReview} источников требуют review</strong>
                  <div className="muted">Ingestion и linking тоже уже видны на той же панели.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-inner">
              <div className="kicker">Срез по системе</div>
              <table className="panel-table">
                <tbody>
                  <tr>
                    <th>Pipeline jobs</th>
                    <td>{pipelineMetrics.openJobs}</td>
                  </tr>
                  <tr>
                    <th>Всего кандидатов</th>
                    <td>{candidateMetrics.totalCandidates}</td>
                  </tr>
                  <tr>
                    <th>Source types</th>
                    <td>{importMetrics.sourceCount}</td>
                  </tr>
                  <tr>
                    <th>Linked applications</th>
                    <td>{importMetrics.linkedApplications}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid-3">
        <article className="card">
          <div className="card-inner">
            <div className="section-head">
              <div>
                <div className="kicker">Priority inbox</div>
                <h3 className="section-title">Диалоги, которые надо разрулить</h3>
              </div>
              <Link className="inline-link" href="/conversations">
                Все диалоги
              </Link>
            </div>
            <div className="stack compact-stack">
              {prioritySessions.length > 0 ? (
                prioritySessions.map((session) => {
                  const lastMessage = session.messages?.[0];
                  const approvalPending = session.messages.some((message) => message.requiresApproval);

                  return (
                    <div className="list-card" key={session.id}>
                      <div className="list-card-top">
                        <strong>{session.candidate?.fullName ?? "Unknown candidate"}</strong>
                        <span className="badge">{session.status}</span>
                      </div>
                      <div className="muted">
                        {[session.application?.job?.title, session.playbook?.name]
                          .filter(Boolean)
                          .join(" · ") || "Без контекста"}
                      </div>
                      <p>{lastMessage?.content ?? "Сообщение появится здесь"}</p>
                      <div className="badge-row badge-row-tight">
                        {approvalPending ? <span className="badge">needs approval</span> : null}
                        {session.playbook?.channelType ? (
                          <span className="badge">{session.playbook.channelType}</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">Пока нет диалогов, которые требуют ручного внимания.</div>
              )}
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-inner">
            <div className="section-head">
              <div>
                <div className="kicker">Decision queue</div>
                <h3 className="section-title">Кого двигать дальше</h3>
              </div>
              <Link className="inline-link" href="/candidates">
                Все кандидаты
              </Link>
            </div>
            <div className="stack compact-stack">
              {candidateQueue.map(({ candidate, application, recommendation, insight }) => (
                <div className="list-card" key={candidate.id}>
                  <div className="list-card-top">
                    <strong>{candidate.fullName}</strong>
                    {application?.fitLevel ? <span className="badge">{application.fitLevel}</span> : null}
                  </div>
                  <div className="muted">
                    {[application?.job?.title, candidate.headline, candidate.location]
                      .filter(Boolean)
                      .join(" · ") || "Без деталей"}
                  </div>
                  <p>{recommendation?.why ?? application?.recommendedNextStep ?? "Next step появится здесь"}</p>
                  <div className="muted">{insight?.content ?? candidate.summary ?? "Summary появится здесь"}</div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-inner">
            <div className="section-head">
              <div>
                <div className="kicker">AI operations</div>
                <h3 className="section-title">Playbooks и источники</h3>
              </div>
              <Link className="inline-link" href="/playbooks">
                Открыть playbooks
              </Link>
            </div>
            <div className="stack compact-stack">
              {latestPlaybooks.map((playbook) => (
                <div className="list-card" key={playbook.id}>
                  <div className="list-card-top">
                    <strong>{playbook.name}</strong>
                    <span className="badge">{playbook.status}</span>
                  </div>
                  <div className="muted">
                    {[playbook.job?.title, playbook.targetStage?.name, playbook.channelType]
                      .filter(Boolean)
                      .join(" · ") || "Без деталей"}
                  </div>
                  <p>{playbook.objective ?? "Objective появится здесь"}</p>
                </div>
              ))}

              {sourceHighlights.map((source) => (
                <div className="list-card" key={source.id}>
                  <div className="list-card-top">
                    <strong>{source.label}</strong>
                    <span className="badge">{source.type}</span>
                  </div>
                  <div className="muted">
                    {source.applications.length} linked applications
                  </div>
                  <p>
                    {source.ingestions?.[0]
                      ? `${source.ingestions[0].status} · ${source.ingestions[0].payloadType}`
                      : "Пока без новых ingestion records"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="grid-2 dashboard-section">
        {pipelineHighlights.map(({ job, activeStages }) => (
          <article className="card" key={job.id}>
            <div className="card-inner">
              <div className="section-head">
                <div>
                  <div className="kicker">Pipeline spotlight</div>
                  <h3 className="section-title">{job.title}</h3>
                </div>
                <Link className="inline-link" href="/pipeline">
                  Весь pipeline
                </Link>
              </div>
              <p className="muted">
                {[job.department, job.location, job.employmentType].filter(Boolean).join(" · ") || "Без деталей"}
              </p>
              <div className="board-strip">
                {job.pipelineStages.map((stage) => (
                  <div className="board-cell" key={stage.id}>
                    <div className="kicker">{stage.kind}</div>
                    <strong>{stage.name}</strong>
                    <div className="muted">{stage.applications.length} candidates</div>
                  </div>
                ))}
              </div>
              <div className="stack compact-stack" style={{ marginTop: 18 }}>
                {activeStages.length > 0 ? (
                  activeStages.map((stage) => (
                    <div className="list-card" key={stage.id}>
                      <div className="list-card-top">
                        <strong>{stage.name}</strong>
                        <span className="badge">{stage.applications.length}</span>
                      </div>
                      <div className="muted">
                        {stage.applications
                          .slice(0, 2)
                          .map((application) => application.candidate?.fullName)
                          .filter(Boolean)
                          .join(", ") || "Пока пусто"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">В этой вакансии пока нет активных кандидатов.</div>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="card dashboard-section">
        <div className="card-inner">
          <div className="section-head">
            <div>
              <div className="kicker">Workspace modules</div>
              <h3 className="section-title">Что уже можно покликать прямо сейчас</h3>
            </div>
          </div>
          <div className="quick-links">
            <Link className="quick-link" href="/jobs">
              <strong>{jobs.length} jobs</strong>
              <span>Создание вакансий и scorecard basis</span>
            </Link>
            <Link className="quick-link" href="/candidates">
              <strong>{candidates.length} candidate profiles</strong>
              <span>Decision-ready карточки кандидатов</span>
            </Link>
            <Link className="quick-link" href="/imports">
              <strong>{sources.length} import sources</strong>
              <span>Ingestion layer и linked applications</span>
            </Link>
            <Link className="quick-link" href="/conversations">
              <strong>{sessions.length} AI sessions</strong>
              <span>Inbox для playbook communication</span>
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
