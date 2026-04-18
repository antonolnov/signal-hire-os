import { PageShell } from "../../components/page-shell";
import { createPlaybook } from "../../lib/actions/playbooks";
import { getJobs } from "../../lib/queries/jobs";
import { getPlaybooks, getPlaybookSummaryMetrics } from "../../lib/queries/playbooks";
import { ensureConversationDemoData, ensureSeedData } from "../../lib/seed";

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
        <article className="card">
          <div className="card-inner">
            <div className="kicker">Playbook engine</div>
            <h2 className="section-title">Сценарии общения тоже уже из реальных данных</h2>
            <p className="muted">
              Видно, какие playbook-ы активны, на какие вакансии завязаны и сколько живых сессий они сейчас держат.
            </p>
            <form action={createPlaybook} className="stack" style={{ marginTop: 20 }}>
              <input type="hidden" name="workspaceSlug" value="signal-hire-demo" />
              <label>
                <div>Название сценария</div>
                <input name="name" required placeholder="Например, Backend pre-screen" />
              </label>
              <label>
                <div>Stage</div>
                <select name="targetStageId" defaultValue="">
                  <option value="">Без привязки к stage</option>
                  {jobs.map((job) => {
                    const card = job as any;

                    return card.pipelineStages?.map((stage: any) => (
                      <option key={stage.id} value={stage.id}>
                        {card.title} · {stage.name}
                      </option>
                    ));
                  })}
                </select>
              </label>
              <label>
                <div>Канал</div>
                <input name="channelType" placeholder="email / telegram / whatsapp" />
              </label>
              <label>
                <div>Autonomy mode</div>
                <input name="autonomyMode" defaultValue="guardrailed" placeholder="guardrailed" />
              </label>
              <label>
                <div>Цель</div>
                <textarea name="objective" rows={3} placeholder="Что именно нужно собрать или проверить" />
              </label>
              <label>
                <div>Инструкции</div>
                <textarea name="instructions" rows={4} placeholder="Как ИИ должен вести диалог" />
              </label>
              <button className="cta" type="submit">Создать playbook</button>
            </form>
            <div className="hero-grid">
              <div className="stat">
                <strong>{metrics.totalPlaybooks}</strong>
                <div>Всего playbooks</div>
              </div>
              <div className="stat">
                <strong>{metrics.activePlaybooks}</strong>
                <div>Активных</div>
              </div>
              <div className="stat">
                <strong>{metrics.liveSessions}</strong>
                <div>Live sessions</div>
              </div>
              <div className="stat">
                <strong>{metrics.approvals}</strong>
                <div>Approval signals</div>
              </div>
            </div>
          </div>
        </article>
        <article className="card highlight">
          <div className="card-inner">
            <div className="kicker">Guardrails</div>
            <ul className="list">
              <li>ИИ не импровизирует вне сценария.</li>
              <li>Чувствительные переходы идут через approval.</li>
              <li>Каждое сообщение оставляет audit trail.</li>
            </ul>
          </div>
        </article>
      </section>
      <section className="grid-3">
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
                <div className="kicker">{card.status}</div>
                <h3 className="section-title">{card.name}</h3>
                <div className="badge-row">
                  {card.autonomyMode ? <span className="badge">{card.autonomyMode}</span> : null}
                  {card.targetStage?.name ? <span className="badge">{card.targetStage.name}</span> : null}
                  {card.job?.title ? <span className="badge">{card.job.title}</span> : null}
                </div>
                <ul className="list">
                  <li>{card.objective ?? "Objective появится здесь"}</li>
                  <li>{card.instructions ?? "Instructions появятся здесь"}</li>
                  <li>
                    {card.sessions.length} sessions, {approvalCount} approvals
                  </li>
                </ul>
              </div>
            </article>
          );
        })}
      </section>
    </PageShell>
  );
}
