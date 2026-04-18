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
      meta: `${conversationMetrics.escalations} эскалаций`,
    },
    {
      value: playbookMetrics.liveSessions,
      label: "Активные ИИ-сессии",
      meta: `${playbookMetrics.activePlaybooks} плейбуков`,
    },
  ];

  const decisionQueue = [
    {
      tone: "danger",
      value: conversationMetrics.approvalQueue,
      title: "Снять блокировки в диалогах",
      description: "Есть ветки, где рекрутеру нужно дать решение или скорректировать ответ кандидату.",
      href: "/conversations",
      action: "Открыть инбокс",
    },
    {
      tone: "warning",
      value: pipelineMetrics.screeningLoad,
      title: "Разобрать очередь скрининга",
      description: "Кандидаты уже дошли до следующего шага, но зависли перед интервью и движением по пайплайну.",
      href: "/pipeline",
      action: "Открыть пайплайн",
    },
    {
      tone: "info",
      value: importMetrics.pendingReview,
      title: "Проверить свежий импорт",
      description: "Новые записи загружены, но ещё не полностью связаны с вакансиями и карточками кандидатов.",
      href: "/imports",
      action: "Открыть импорт",
    },
  ];

  const modules = [
    {
      href: "/jobs",
      value: jobMetrics.activeJobs,
      label: "Вакансии",
      meta: "Роли, критерии, этапы",
    },
    {
      href: "/pipeline",
      value: pipelineMetrics.openJobs,
      label: "Пайплайны",
      meta: "Загрузка и узкие места",
    },
    {
      href: "/imports",
      value: importMetrics.sourceCount,
      label: "Источники",
      meta: "Импорт и разбор потока",
    },
    {
      href: "/playbooks",
      value: playbookMetrics.activePlaybooks,
      label: "Плейбуки",
      meta: "Автоматизация касаний",
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

      <section className="ops-grid dashboard-section">
        <article className="card card-primary">
          <div className="card-inner card-inner-tight">
            <div className="section-head section-head-tight">
              <div>
                <div className="kicker">Очередь решений</div>
                <h3 className="section-title">Что требует внимания прямо сейчас</h3>
              </div>
            </div>

            <div className="decision-queue">
              {decisionQueue.map((item, index) => (
                <div className={`decision-row tone-${item.tone}`} key={item.title}>
                  <div className="decision-rank">0{index + 1}</div>
                  <div className="decision-body">
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                  <div className="decision-metric">{item.value}</div>
                  <Link className="decision-link" href={item.href}>
                    {item.action}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </article>

        <div className="ops-aside">
          <article className="card card-secondary">
            <div className="card-inner card-inner-tight">
              <div className="section-head section-head-tight">
                <div>
                  <div className="kicker">Операционный срез</div>
                  <h3 className="section-title">Нагрузка по системе</h3>
                </div>
              </div>

              <div className="mini-stats mini-stats-dense">
                <div className="mini-stat">
                  <span>Очередь скрининга</span>
                  <strong>{candidateMetrics.screeningCandidates}</strong>
                </div>
                <div className="mini-stat">
                  <span>Связанные заявки</span>
                  <strong>{importMetrics.linkedApplications}</strong>
                </div>
                <div className="mini-stat">
                  <span>Источники импорта</span>
                  <strong>{importMetrics.sourceCount}</strong>
                </div>
                <div className="mini-stat">
                  <span>Live-сессии</span>
                  <strong>{playbookMetrics.liveSessions}</strong>
                </div>
              </div>

              <div className="subsection-note muted compact-copy">
                Сейчас основной риск в ручных решениях и в задержках между скринингом, интервью и подтверждением следующих шагов.
              </div>
            </div>
          </article>

          <article className="card card-secondary">
            <div className="card-inner card-inner-tight">
              <div className="section-head section-head-tight">
                <div>
                  <div className="kicker">Контуры</div>
                  <h3 className="section-title">Быстрый переход</h3>
                </div>
              </div>

              <div className="module-list">
                {modules.map((module) => (
                  <Link className="module-row" href={module.href} key={module.href}>
                    <div>
                      <strong>{module.label}</strong>
                      <span>{module.meta}</span>
                    </div>
                    <b>{module.value}</b>
                  </Link>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="grid-2 dashboard-section">
        <article className="card">
          <div className="card-inner card-inner-tight">
            <div className="section-head section-head-tight">
              <div>
                <div className="kicker">Ручной разбор</div>
                <h3 className="section-title">Инбокс, где нужен ответ рекрутера</h3>
              </div>
              <Link className="inline-link" href="/conversations">
                Все диалоги
              </Link>
            </div>

            <div className="compact-table">
              {prioritySessions.length > 0 ? (
                prioritySessions.map((session) => {
                  const lastMessage = session.messages?.[0];
                  const approvalPending = session.messages.some((message) => message.requiresApproval);

                  return (
                    <div className="compact-row" key={session.id}>
                      <div className="compact-main">
                        <div className="compact-title-row">
                          <strong>{session.candidate?.fullName ?? "Неизвестный кандидат"}</strong>
                          <span className="badge">{uiLabel(session.status)}</span>
                        </div>
                        <div className="compact-meta">
                          {[session.application?.job?.title, session.playbook?.name]
                            .filter(Boolean)
                            .join(" · ") || "Пока без связанного контекста"}
                        </div>
                        <p>{lastMessage?.content ?? "Здесь появится превью сообщения."}</p>
                      </div>
                      <div className="compact-side">
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
          <div className="card-inner card-inner-tight">
            <div className="section-head section-head-tight">
              <div>
                <div className="kicker">Следующий шаг</div>
                <h3 className="section-title">Кандидаты, которых нужно двигать дальше</h3>
              </div>
              <Link className="inline-link" href="/candidates">
                Открыть базу
              </Link>
            </div>

            <div className="compact-table">
              {candidateQueue.length > 0 ? (
                candidateQueue.map(({ candidate, application, recommendation, insight }) => (
                  <div className="compact-row" key={candidate.id}>
                    <div className="compact-main">
                      <div className="compact-title-row">
                        <strong>{candidate.fullName}</strong>
                        {application?.fitLevel ? <span className="badge">{uiLabel(application.fitLevel)}</span> : null}
                      </div>
                      <div className="compact-meta">
                        {[application?.job?.title, candidate.headline, candidate.location]
                          .filter(Boolean)
                          .join(" · ") || "Пока без метаданных"}
                      </div>
                      <p>{recommendation?.why ?? application?.recommendedNextStep ?? "Здесь появится следующий шаг."}</p>
                      <div className="muted compact-copy">{insight?.content ?? candidate.summary ?? "Здесь появится сводка."}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">Очередь пуста, можно загружать новых кандидатов.</div>
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="grid-2 dashboard-section">
        <article className="card">
          <div className="card-inner card-inner-tight">
            <div className="section-head section-head-tight">
              <div>
                <div className="kicker">Автоматизация и поток</div>
                <h3 className="section-title">Плейбуки и свежий импорт</h3>
              </div>
            </div>

            <div className="subsection-block">
              <div className="subsection-headline">
                <strong>Активные плейбуки</strong>
                <Link className="inline-link" href="/playbooks">
                  Все плейбуки
                </Link>
              </div>
              <div className="compact-table compact-table-soft">
                {latestPlaybooks.map((playbook) => (
                  <div className="compact-row compact-row-soft" key={playbook.id}>
                    <div className="compact-main">
                      <div className="compact-title-row">
                        <strong>{playbook.name}</strong>
                        <span className="badge">{uiLabel(playbook.status)}</span>
                      </div>
                      <div className="compact-meta">
                        {[playbook.job?.title, uiStageName(playbook.targetStage?.name), uiLabel(playbook.channelType)]
                          .filter(Boolean)
                          .join(" · ") || "Пока без связанного контекста"}
                      </div>
                      <p>{playbook.objective ?? "Здесь появится цель плейбука."}</p>
                    </div>
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
              <div className="compact-table compact-table-soft">
                {sourceHighlights.map((source) => (
                  <div className="compact-row compact-row-soft" key={source.id}>
                    <div className="compact-main">
                      <div className="compact-title-row">
                        <strong>{source.label}</strong>
                        <span className="badge">{uiLabel(source.type)}</span>
                      </div>
                      <div className="compact-meta">{source.applications.length} связанных заявок</div>
                      <p>
                        {source.ingestions?.[0]
                          ? `${uiLabel(source.ingestions[0].status)} · ${uiLabel(source.ingestions[0].payloadType)}`
                          : "Пока нет новых записей импорта"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-inner card-inner-tight">
            <div className="section-head section-head-tight">
              <div>
                <div className="kicker">Пайплайн</div>
                <h3 className="section-title">Где сейчас сосредоточена нагрузка</h3>
              </div>
              <Link className="inline-link" href="/pipeline">
                Весь пайплайн
              </Link>
            </div>

            <div className="stack compact-stack">
              {pipelineHighlights.map(({ job, activeStages }) => (
                <div className="pipeline-spotlight" key={job.id}>
                  <div className="compact-title-row">
                    <strong>{job.title}</strong>
                    <span className="badge">{activeStages.length} активных этапов</span>
                  </div>
                  <div className="compact-meta">
                    {[job.department, job.location, job.employmentType].filter(Boolean).join(" · ") || "Пока без метаданных вакансии"}
                  </div>
                  <div className="board-strip board-strip-tight">
                    {job.pipelineStages.map((stage) => (
                      <div className="board-cell board-cell-tight" key={stage.id}>
                        <div className="kicker">{uiLabel(stage.kind)}</div>
                        <strong>{uiStageName(stage.name)}</strong>
                        <div className="muted">{stage.applications.length} кандидатов</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>
    </PageShell>
  );
}
