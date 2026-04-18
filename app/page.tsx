import Link from "next/link";
import { PageShell } from "../components/page-shell";
import { getCandidates, getCandidateSummaryMetrics } from "../lib/queries/candidates";
import {
  getConversationSessions,
  getConversationSummaryMetrics,
} from "../lib/queries/conversations";
import { getImportSources, getImportSummaryMetrics } from "../lib/queries/imports";
import { getJobSummaryMetrics } from "../lib/queries/jobs";
import { getPipelineBoard, getPipelineSummaryMetrics } from "../lib/queries/pipeline";
import { getPlaybooks, getPlaybookSummaryMetrics } from "../lib/queries/playbooks";
import { ensureConversationDemoData, ensureSeedData } from "../lib/seed";
import { uiLabel, uiStageName } from "../lib/ui";

export const dynamic = "force-dynamic";

const fitOrder: Record<string, number> = {
  strong: 0,
  medium: 1,
  weak: 2,
};

export default async function HomePage() {
  await ensureSeedData();
  await ensureConversationDemoData();

  const [jobMetrics, candidates, candidateMetrics, sessions, conversationMetrics, pipeline, pipelineMetrics, playbooks, playbookMetrics, sources, importMetrics] =
    await Promise.all([
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

  const summaryCards = [
    {
      value: jobMetrics.activeJobs,
      label: "Активные вакансии",
      meta: `${jobMetrics.totalApplications} заявок в работе`,
    },
    {
      value: candidateMetrics.screeningCandidates,
      label: "Очередь скрининга",
      meta: `${candidateMetrics.strongFitCandidates} сильных кандидатов`,
    },
    {
      value: conversationMetrics.approvalQueue,
      label: "Нужно согласование",
      meta: `${conversationMetrics.escalations} эскалаций у рекрутера`,
    },
    {
      value: playbookMetrics.liveSessions,
      label: "Активные ИИ-сессии",
      meta: `${playbookMetrics.activePlaybooks} плейбуков в работе`,
    },
  ];

  return (
    <PageShell chrome="dashboard">
      <section className="dashboard-metrics">
        {summaryCards.map((card) => (
          <article className="metric-card" key={card.label}>
            <div className="metric-label">{card.label}</div>
            <strong>{card.value}</strong>
            <div className="metric-meta">{card.meta}</div>
          </article>
        ))}
      </section>

      <section className="grid-3 dashboard-section">
        <article className="card">
          <div className="card-inner">
            <div className="section-head">
              <div>
                <div className="kicker">Приоритетный инбокс</div>
                <h3 className="section-title">Что требует ручного разбора</h3>
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
                        <strong>{session.candidate?.fullName ?? "Неизвестный кандидат"}</strong>
                        <span className="badge">{uiLabel(session.status)}</span>
                      </div>
                      <div className="muted">
                        {[session.application?.job?.title, session.playbook?.name]
                          .filter(Boolean)
                          .join(" · ") || "Пока без связанного контекста"}
                      </div>
                      <p>{lastMessage?.content ?? "Здесь появится превью сообщения."}</p>
                      <div className="badge-row badge-row-tight">
                        {approvalPending ? <span className="badge">Нужно согласование</span> : null}
                        {session.playbook?.channelType ? (
                          <span className="badge">{uiLabel(session.playbook.channelType)}</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">Сейчас нет диалогов, которые блокируют поток найма.</div>
              )}
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-inner">
            <div className="section-head">
              <div>
                <div className="kicker">Очередь кандидатов</div>
                <h3 className="section-title">Кого двигать дальше</h3>
              </div>
              <Link className="inline-link" href="/candidates">
                Открыть базу
              </Link>
            </div>
            <div className="stack compact-stack">
              {candidateQueue.length > 0 ? (
                candidateQueue.map(({ candidate, application, recommendation, insight }) => (
                  <div className="list-card" key={candidate.id}>
                    <div className="list-card-top">
                      <strong>{candidate.fullName}</strong>
                      {application?.fitLevel ? <span className="badge">{uiLabel(application.fitLevel)}</span> : null}
                    </div>
                    <div className="muted">
                      {[application?.job?.title, candidate.headline, candidate.location]
                        .filter(Boolean)
                        .join(" · ") || "Пока без метаданных"}
                    </div>
                    <p>{recommendation?.why ?? application?.recommendedNextStep ?? "Здесь появится следующий шаг."}</p>
                    <div className="muted">{insight?.content ?? candidate.summary ?? "Здесь появится сводка."}</div>
                  </div>
                ))
              ) : (
                <div className="empty-state">Очередь пуста, можно загружать новых кандидатов.</div>
              )}
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-inner">
            <div className="section-head">
              <div>
                <div className="kicker">Срез системы</div>
                <h3 className="section-title">Текущее состояние контура</h3>
              </div>
            </div>

            <div className="mini-stats">
              <div className="mini-stat">
                <span>Открытые вакансии</span>
                <strong>{pipelineMetrics.openJobs}</strong>
              </div>
              <div className="mini-stat">
                <span>Всего кандидатов</span>
                <strong>{candidateMetrics.totalCandidates}</strong>
              </div>
              <div className="mini-stat">
                <span>Источники импорта</span>
                <strong>{importMetrics.sourceCount}</strong>
              </div>
              <div className="mini-stat">
                <span>Связанные заявки</span>
                <strong>{importMetrics.linkedApplications}</strong>
              </div>
              <div className="mini-stat">
                <span>Скрининг в очереди</span>
                <strong>{pipelineMetrics.screeningLoad}</strong>
              </div>
              <div className="mini-stat">
                <span>Импорт на проверке</span>
                <strong>{importMetrics.pendingReview}</strong>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="grid-2 dashboard-section">
        <article className="card">
          <div className="card-inner">
            <div className="section-head">
              <div>
                <div className="kicker">Автоматизация</div>
                <h3 className="section-title">Плейбуки и входящий поток</h3>
              </div>
              <Link className="inline-link" href="/playbooks">
                Открыть плейбуки
              </Link>
            </div>
            <div className="stack compact-stack">
              {latestPlaybooks.map((playbook) => (
                <div className="list-card" key={playbook.id}>
                  <div className="list-card-top">
                    <strong>{playbook.name}</strong>
                    <span className="badge">{uiLabel(playbook.status)}</span>
                  </div>
                  <div className="muted">
                    {[playbook.job?.title, uiStageName(playbook.targetStage?.name), uiLabel(playbook.channelType)]
                      .filter(Boolean)
                      .join(" · ") || "Пока без связанного контекста"}
                  </div>
                  <p>{playbook.objective ?? "Здесь появится цель плейбука."}</p>
                </div>
              ))}

              {sourceHighlights.map((source) => (
                <div className="list-card" key={source.id}>
                  <div className="list-card-top">
                    <strong>{source.label}</strong>
                    <span className="badge">{uiLabel(source.type)}</span>
                  </div>
                  <div className="muted">{source.applications.length} связанных заявок</div>
                  <p>
                    {source.ingestions?.[0]
                      ? `${uiLabel(source.ingestions[0].status)} · ${uiLabel(source.ingestions[0].payloadType)}`
                      : "Пока нет новых записей импорта"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-inner">
            <div className="section-head">
              <div>
                <div className="kicker">Доступ к модулям</div>
                <h3 className="section-title">Быстрые переходы по рабочим контурам</h3>
              </div>
            </div>
            <div className="quick-links">
              <Link className="quick-link" href="/jobs">
                <strong>{jobMetrics.activeJobs} вакансий</strong>
                <span>Структура ролей, критерии и этапы найма.</span>
              </Link>
              <Link className="quick-link" href="/pipeline">
                <strong>{pipelineMetrics.openJobs} активных пайплайна</strong>
                <span>Узкие места, переходы между этапами и загрузка.</span>
              </Link>
              <Link className="quick-link" href="/imports">
                <strong>{importMetrics.sourceCount} источников</strong>
                <span>Импорт, разбор входящего потока и связка сущностей.</span>
              </Link>
              <Link className="quick-link" href="/conversations">
                <strong>{sessions.length} диалогов</strong>
                <span>Ручные согласования, эскалации и контроль ответов.</span>
              </Link>
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
                  <div className="kicker">Пайплайн вакансии</div>
                  <h3 className="section-title">{job.title}</h3>
                </div>
                <Link className="inline-link" href="/pipeline">
                  Весь пайплайн
                </Link>
              </div>
              <p className="muted">
                {[job.department, job.location, job.employmentType].filter(Boolean).join(" · ") || "Пока без метаданных вакансии"}
              </p>
              <div className="board-strip">
                {job.pipelineStages.map((stage) => (
                  <div className="board-cell" key={stage.id}>
                    <div className="kicker">{uiLabel(stage.kind)}</div>
                    <strong>{uiStageName(stage.name)}</strong>
                    <div className="muted">{stage.applications.length} кандидатов</div>
                  </div>
                ))}
              </div>
              <div className="stack compact-stack" style={{ marginTop: 18 }}>
                {activeStages.length > 0 ? (
                  activeStages.map((stage) => (
                    <div className="list-card" key={stage.id}>
                      <div className="list-card-top">
                        <strong>{uiStageName(stage.name)}</strong>
                        <span className="badge">{stage.applications.length}</span>
                      </div>
                      <div className="muted">
                        {stage.applications
                          .slice(0, 3)
                          .map((application) => application.candidate?.fullName)
                          .filter(Boolean)
                          .join(", ") || "Пока нет кандидатов"}
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
    </PageShell>
  );
}
