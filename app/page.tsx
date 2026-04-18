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
        <article className="card highlight">
          <div className="card-inner">
            <div className="kicker">Операционная панель</div>
            <h2 className="hero-title">Вся воронка найма под рукой.</h2>
            <p className="muted">
              Здесь видно, где тормозит поток кандидатов, кому нужен следующий шаг и в каких местах
              автоматизации требуется решение рекрутера.
            </p>

            <div className="hero-grid">
              <div className="stat">
                <strong>{jobMetrics.activeJobs}</strong>
                <div>Активные вакансии</div>
                <div className="muted">{jobMetrics.totalApplications} заявок в движении</div>
              </div>
              <div className="stat">
                <strong>{candidateMetrics.screeningCandidates}</strong>
                <div>Очередь скрининга</div>
                <div className="muted">{candidateMetrics.strongFitCandidates} сильных кандидатов</div>
              </div>
              <div className="stat">
                <strong>{conversationMetrics.approvalQueue}</strong>
                <div>Очередь согласований</div>
                <div className="muted">{conversationMetrics.escalations} эскалаций требуют участия</div>
              </div>
              <div className="stat">
                <strong>{playbookMetrics.liveSessions}</strong>
                <div>Активные ИИ-сессии</div>
                <div className="muted">{playbookMetrics.activePlaybooks} активных плейбуков</div>
              </div>
            </div>

            <div className="cta-row">
              <Link className="cta" href="/pipeline">
                Открыть пайплайн
              </Link>
              <Link className="cta secondary" href="/conversations">
                Разобрать инбокс
              </Link>
              <Link className="cta secondary" href="/candidates">
                Проверить кандидатов
              </Link>
            </div>
          </div>
        </article>

        <aside className="stack">
          <div className="card">
            <div className="card-inner">
              <div className="section-head">
                <div>
                  <div className="kicker">Фокус дня</div>
                  <h3 className="section-title">Ключевые задачи на сегодня</h3>
                </div>
              </div>
              <div className="alert-list">
                <div className="alert-item">
                  <strong>{conversationMetrics.approvalQueue} диалогов заблокированы</strong>
                  <div className="muted">
                    В этих ветках бот дошёл до границы правил и ждёт решения человека.
                  </div>
                </div>
                <div className="alert-item">
                  <strong>{pipelineMetrics.screeningLoad} заявок стоят на скрининге</strong>
                  <div className="muted">
                    Если разобрать эту очередь, пайплайн быстрее дойдёт до интервью и офферов.
                  </div>
                </div>
                <div className="alert-item">
                  <strong>{importMetrics.pendingReview} импортов требуют проверки</strong>
                  <div className="muted">
                    Новые записи загружены, но ещё не до конца разобраны и связаны с вакансиями.
                  </div>
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
                    <th>Открытые вакансии в пайплайне</th>
                    <td>{pipelineMetrics.openJobs}</td>
                  </tr>
                  <tr>
                    <th>Всего кандидатов</th>
                    <td>{candidateMetrics.totalCandidates}</td>
                  </tr>
                  <tr>
                    <th>Типы источников</th>
                    <td>{importMetrics.sourceCount}</td>
                  </tr>
                  <tr>
                    <th>Связанные заявки</th>
                    <td>{importMetrics.linkedApplications}</td>
                  </tr>
                </tbody>
              </table>
              <div className="badge-row">
                <span className="badge">Локальная среда</span>
                <span className="badge">Самодостаточная демо-сборка</span>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid-3 dashboard-section">
        <article className="card">
          <div className="card-inner">
            <div className="section-head">
              <div>
                <div className="kicker">Приоритетный инбокс</div>
                <h3 className="section-title">Диалоги на ручной разбор</h3>
              </div>
              <Link className="inline-link" href="/conversations">
                Смотреть все
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
                        {approvalPending ? <span className="badge">Нужно согласование рекрутера</span> : null}
                        {session.playbook?.channelType ? (
                          <span className="badge">{uiLabel(session.playbook.channelType)}</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">Инбокс чист. Ничего срочного для человека сейчас нет.</div>
              )}
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-inner">
            <div className="section-head">
              <div>
                <div className="kicker">Очередь решений</div>
                <h3 className="section-title">Кандидаты к следующему шагу</h3>
              </div>
              <Link className="inline-link" href="/candidates">
                Открыть кандидатов
              </Link>
            </div>
            <div className="stack compact-stack">
              {candidateQueue.map(({ candidate, application, recommendation, insight }) => (
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
              ))}
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-inner">
            <div className="section-head">
              <div>
                <div className="kicker">Автоматизация</div>
                <h3 className="section-title">Плейбуки и входящий поток</h3>
              </div>
              <Link className="inline-link" href="/playbooks">
                Открыть автоматизацию
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
      </section>

      <section className="grid-2 dashboard-section">
        {pipelineHighlights.map(({ job, activeStages }) => (
          <article className="card" key={job.id}>
            <div className="card-inner">
              <div className="section-head">
                <div>
                  <div className="kicker">Фокус на пайплайне</div>
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

      <section className="card dashboard-section">
        <div className="card-inner">
          <div className="section-head">
            <div>
              <div className="kicker">Рабочие модули</div>
              <h3 className="section-title">Переход в ключевые контуры управления</h3>
            </div>
          </div>
          <div className="quick-links">
            <Link className="quick-link" href="/jobs">
              <strong>{jobs.length} вакансий</strong>
              <span>Планирование ролей, структура этапов и база критериев оценки</span>
            </Link>
            <Link className="quick-link" href="/candidates">
              <strong>{candidates.length} кандидатов</strong>
              <span>Профили, готовые к решению, со связанными заявками</span>
            </Link>
            <Link className="quick-link" href="/imports">
              <strong>{sources.length} источников импорта</strong>
              <span>Операции импорта, связка сущностей и обзор очереди</span>
            </Link>
            <Link className="quick-link" href="/conversations">
              <strong>{sessions.length} ИИ-сессий</strong>
              <span>Инбокс для согласований, эскалаций и передачи контекста</span>
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
