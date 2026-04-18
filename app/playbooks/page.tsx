import { PageShell } from "../../components/page-shell";
import { createPlaybook } from "../../lib/actions/playbooks";
import { getJobs } from "../../lib/queries/jobs";
import { getPlaybooks, getPlaybookSummaryMetrics } from "../../lib/queries/playbooks";
import { ensureConversationDemoData, ensureSeedData } from "../../lib/seed";
import { uiLabel, uiStageName } from "../../lib/ui";

export const dynamic = "force-dynamic";

export default async function PlaybooksPage() {
  await ensureSeedData();
  await ensureConversationDemoData();

  const [playbooks, metrics, jobs] = await Promise.all([
    getPlaybooks(),
    getPlaybookSummaryMetrics(),
    getJobs(),
  ]);

  return (
    <PageShell>
      <section className="grid-2">
        <article className="card highlight">
          <div className="card-inner">
            <div className="kicker">Движок плейбуков</div>
            <h2 className="section-title">Проектируй автоматизацию как систему, а не как набор промптов</h2>
            <p className="muted">
              Плейбук должен быть понятен оператору. Что он делает, где включён, сколько держит
              живых сессий и где возникают сигналы на согласование, всё видно на одном экране.
            </p>
            <div className="hero-grid">
              <div className="stat">
                <strong>{metrics.totalPlaybooks}</strong>
                <div>Всего плейбуков</div>
              </div>
              <div className="stat">
                <strong>{metrics.activePlaybooks}</strong>
                <div>Активные</div>
              </div>
              <div className="stat">
                <strong>{metrics.liveSessions}</strong>
                <div>Живые сессии</div>
              </div>
              <div className="stat">
                <strong>{metrics.approvals}</strong>
                <div>Сигналы согласования</div>
              </div>
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-inner">
            <div className="kicker">Создать плейбук</div>
            <form action={createPlaybook} className="stack">
              <input type="hidden" name="workspaceSlug" value="signal-hire-demo" />
              <label>
                <div>Название</div>
                <input name="name" required placeholder="Прескрин backend-разработчиков" />
              </label>
              <label>
                <div>Этап</div>
                <select name="targetStageId" defaultValue="">
                  <option value="">Без привязки к этапу</option>
                  {jobs.map((job) => {
                    const card = job as any;

                    return card.pipelineStages?.map((stage: any) => (
                      <option key={stage.id} value={stage.id}>
                        {card.title} · {uiStageName(stage.name)}
                      </option>
                    ));
                  })}
                </select>
              </label>
              <div className="grid-2">
                <label>
                  <div>Канал</div>
                  <input name="channelType" placeholder="email / telegram / whatsapp" />
                </label>
                <label>
                  <div>Режим автономности</div>
                  <input name="autonomyMode" defaultValue="guardrailed" placeholder="С ограничениями (guardrailed)" />
                </label>
              </div>
              <label>
                <div>Цель</div>
                <textarea name="objective" rows={3} placeholder="Что этот сценарий должен собрать или проверить" />
              </label>
              <label>
                <div>Инструкции</div>
                <textarea name="instructions" rows={4} placeholder="Как ИИ должен вести себя в этом сценарии" />
              </label>
              <button className="cta" type="submit">
                Создать плейбук
              </button>
            </form>
          </div>
        </article>
      </section>

      <section className="grid-3 dashboard-section">
        {playbooks.map((playbook) => {
          const card = playbook as any;
          const approvalCount = card.sessions.reduce(
            (sum: number, session: any) =>
              sum + session.messages.filter((message: any) => message.requiresApproval).length,
            0,
          );

          return (
            <article className="card" key={card.id}>
              <div className="card-inner">
                <div className="kicker">{uiLabel(card.status)}</div>
                <h3 className="section-title">{card.name}</h3>
                <div className="badge-row">
                  {card.autonomyMode ? <span className="badge">{uiLabel(card.autonomyMode)}</span> : null}
                  {card.targetStage?.name ? <span className="badge">{uiStageName(card.targetStage.name)}</span> : null}
                  {card.job?.title ? <span className="badge">{card.job.title}</span> : null}
                </div>
                <ul className="list">
                  <li>{card.objective ?? "Здесь появится цель плейбука."}</li>
                  <li>{card.instructions ?? "Здесь появятся инструкции."}</li>
                  <li>
                    {card.sessions.length} сессий, {approvalCount} согласований
                  </li>
                </ul>
              </div>
            </article>
          );
        })}
      </section>

      <section className="card dashboard-section">
        <div className="card-inner">
          <div className="kicker">Ограничения и правила</div>
          <div className="quick-links">
            <div className="quick-link">
              <strong>Ограниченная автономность</strong>
              <span>ИИ не должен импровизировать вне рамки плейбука.</span>
            </div>
            <div className="quick-link">
              <strong>Согласование на переходах</strong>
              <span>Чувствительные действия должны уходить в решение рекрутера.</span>
            </div>
            <div className="quick-link">
              <strong>Журнал аудита</strong>
              <span>Каждый автоматизированный тред должен оставаться объяснимым для команды.</span>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
