import { PageShell } from "../../components/page-shell";
import {
  getConversationSessions,
  getConversationSummaryMetrics,
} from "../../lib/queries/conversations";
import { ensureConversationDemoData, ensureSeedData } from "../../lib/seed";

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  await ensureSeedData();
  await ensureConversationDemoData();

  const [sessions, metrics] = await Promise.all([
    getConversationSessions(),
    getConversationSummaryMetrics(),
  ]);

  return (
    <PageShell>
      <section className="grid-2">
        <article className="card">
          <div className="card-inner">
            <div className="kicker">Conversation inbox</div>
            <h2 className="section-title">AI-сессии общения теперь тоже из реальных данных</h2>
            <p className="muted">
              Здесь уже видно активные диалоги, approval queue, escalations и последний контекст по кандидату.
            </p>
            <div className="hero-grid">
              <div className="stat">
                <strong>{metrics.totalSessions}</strong>
                <div>Всего сессий</div>
              </div>
              <div className="stat">
                <strong>{metrics.activeSessions}</strong>
                <div>Активных</div>
              </div>
              <div className="stat">
                <strong>{metrics.approvalQueue}</strong>
                <div>Approval queue</div>
              </div>
              <div className="stat">
                <strong>{metrics.escalations}</strong>
                <div>Escalations</div>
              </div>
            </div>
          </div>
        </article>
        <article className="card highlight">
          <div className="card-inner">
            <div className="kicker">What happens here</div>
            <ul className="list">
              <li>AI пишет в рамках playbook.</li>
              <li>Ответ кандидата остаётся рядом с application context.</li>
              <li>Approval и escalation видны прямо в inbox.</li>
            </ul>
          </div>
        </article>
      </section>
      <section className="grid-3">
        {sessions.map((session) => {
          const card = session as any;
          const lastMessage = card.messages?.[0];
          const previousMessage = card.messages?.[1];

          return (
            <article className="card" key={card.id}>
              <div className="card-inner">
                <div className="kicker">{card.playbook?.name ?? "No playbook"}</div>
                <h3 className="section-title">{card.candidate?.fullName ?? "Unknown candidate"}</h3>
                <p className="muted">
                  {[
                    card.application?.job?.title,
                    card.candidate?.headline,
                    card.candidate?.location,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Без деталей"}
                </p>
                <div className="badge-row">
                  <span className="badge">{card.status}</span>
                  {card.application?.fitLevel ? <span className="badge">{card.application.fitLevel}</span> : null}
                  {card.playbook?.channelType ? <span className="badge">{card.playbook.channelType}</span> : null}
                </div>
                <ul className="list">
                  <li>{lastMessage?.content ?? "Сообщения появятся здесь"}</li>
                  <li>
                    {lastMessage?.requiresApproval
                      ? "Ждёт approval recruiter"
                      : card.application?.recommendedNextStep ?? "Next step появится здесь"}
                  </li>
                  <li>{previousMessage?.content ?? "Предыдущий контекст появится здесь"}</li>
                </ul>
              </div>
            </article>
          );
        })}
      </section>
    </PageShell>
  );
}
