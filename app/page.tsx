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
    .slice(0, 3);

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
    .slice(0, 3);

  const pipelineHighlights = pipeline.slice(0, 2).map((job) => ({
    job,
    activeStages: job.pipelineStages.filter((stage) => stage.applications.length > 0),
  }));

  const sourceHighlights = (sources as any[]).slice(0, 2);
  const latestPlaybooks = (playbooks as any[]).slice(0, 2);

  const summaryCards = [
    {
      value: jobMetrics.activeJobs,
      label: "Активные вакансии",
      meta: `${jobMetrics.totalApplications} заявок в работе`,
    },
    {
      value: candidateMetrics.totalCandidates,
      label: "Кандидаты в базе",
      meta: `${candidateMetrics.strongFitCandidates} сильных профилей`,
    },
    {
      value: conversationMetrics.approvalQueue,
      label: "Нужно согласование",
      meta: `${conversationMetrics.escalations} эскалаций в очереди`,
    },
    {
      value: playbookMetrics.liveSessions,
      label: "Активные ИИ-сессии",
      meta: `${playbookMetrics.activePlaybooks} плейбуков работают`,
    },
  ];

  const actionSignals = [
    {
      tone: "danger",
      value: conversationMetrics.approvalQueue,
      label: "Диалоги ждут решения",
      meta: "Оператору нужно снять блокировки и дать ответ по спорным веткам.",
      href: "/conversations",
      action: "Открыть инбокс",
    },
    {
      tone: "warning",
      value: pipelineMetrics.screeningLoad,
      label: "Кандидаты стоят на скрининге",
      meta: "Если разобрать этот контур, пайплайн быстрее дойдёт до интервью и офферов.",
      href: "/pipeline",
      action: "Открыть пайплайн",
    },
    {
      tone: "info",
      value: importMetrics.pendingReview,
      label: "Импорт требует проверки",
      meta: "Новые записи загружены, но ещё не до конца связаны с вакансиями и кандидатами.",
      href: "/imports",
      action: "Проверить импорт",
    },
  ];

  return (
    <PageShell chrome="dashboard">
      <section className="card summary-strip">
        <div className="summary-strip-inner">
          {summaryCards.map((card) => (
            <div className="summary-cell" key={card.label}>
              <div className="metric-label">{card.label}</div>
              <strong>{card.value}</strong>
              <div className="metric-meta">{card.meta}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="focus-grid dashboard-section">
        <article className="card card-primary">
          <div className="card-inner">
            <div className="section-head">
              <div>
                <div className="kicker">Главный контур</div>
                <h3 className="section-title">Что сейчас реально тормозит найм</h3>
              </div>
            </div>

            <div className="signal-list">
              {actionSignals.map((signal) => (
                <div className={`signal-card tone-${signal.tone}`} key={signal.label}>
                  <div className="signal-top">
                    <div>
                      <div className="signal-label">{signal.label}</div>
                      <p>{signal.meta}</p>
                    </div>
                    <strong>{signal.value}</strong>
                  </div>
                  <Link className="inline-link" href={signal.href}>
                    {signal.action}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="card card-secondary">
          <div className="card-inner">
            <div className="section-head">
              <div>
                <div className="kicker">Состояние системы</div>
                <h3 className="section-title">Нагрузка по контуру</h3>
              </div>
            </div>

            <div className="mini-stats mini-stats-tall">
              <div className="mini-stat">
                <span>Открытые вакансии</span>
                <strong>{pipelineMetrics.openJobs}</strong>
              </div>
              <div className="mini-stat">
                <span>Очередь скрининга</span>
                <strong>{candidateMetrics.screeningCandidates}</strong>
              </div>
              <div className="mini-stat">
                <span>Источники импорта</span>
                <strong>{importMetrics.sourceCount}</strong>
              </div>
              <div className="mini-stat">
                <span>Связанные заявки</span>
                <strong>{importMetrics.linkedApplications}</strong>
              </div>
            </div>

            <div className="subsection-note muted">
              Сейчас акцент смещён в ручные решения и разбор очереди, а не в расширение входящего потока.
            </div>
          </div>
        </article>
      </section>

      <section className="grid-2 dashboard-section">
        <article className="card">
          <div className="card-inner">
            <div className="section-head">
              <div>
                <div className="kicker">Ручные решения</div>
                <h3 className="section-title">Инбокс и кандидаты, где нужен следующий шаг</h3>
              </div>
            </div>

            <div className="subsection-block">
              <div className="subsection-headline">
                <strong>Приоритетный инбокс</strong>
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
                      <div className="list-card list-card-soft" key={session.id}>
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

            <div className="subsection-block">
              <div className="subsection-headline">
                <strong>Кандидаты к следующему шагу</strong>
                <Link className="inline-link" href="/candidates">
                  Открыть базу
                </Link>
              </div>
              <div className="stack compact-stack">
                {candidateQueue.length > 0 ? (
                  candidateQueue.map(({ candidate, application, recommendation, insight }) => (
                    <div className="list-card list-card-soft" key={candidate.id}>
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
          </div>
        </article>

        <article className="card">
          <div className="card-inner">
            <div className="section-head">
              <div>
                <div className="kicker">Автоматизация и поток</div>
                <h3 className="section-title">Плейбуки, импорт и точки контроля</h3>
              </div>
            </div>

            <div className="subsection-block">
              <div className="subsection-headline">
                <strong>Активные плейбуки</strong>
                <Link className="inline-link" href="/playbooks">
                  Все плейбуки
                </Link>
              </div>
              <div className="stack compact-stack">
                {latestPlaybooks.map((playbook) => (
                  <div className="list-card list-card-soft" key={playbook.id}>
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
              </div>
            </div>

            <div className="subsection-block">
              <div className="subsection-headline">
                <strong>Свежий импорт</strong>
                <Link className="inline-link" href="/imports">
                  Центр импорта
                </Link>
              </div>
              <div className="stack compact-stack">
                {sourceHighlights.map((source) => (
                  <div className="list-card list-card-soft" key={source.id}>
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

            <div className="quick-links quick-links-compact">
              <Link className="quick-link" href="/jobs">
                <strong>{jobMetrics.activeJobs} вакансий</strong>
                <span>План ролей, критерии и этапы.</span>
              </Link>
              <Link className="quick-link" href="/pipeline">
                <strong>{pipelineMetrics.openJobs} пайплайнов</strong>
                <span>Загрузка, переходы и узкие места.</span>
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
                    <div className="list-card list-card-soft" key={stage.id}>
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
