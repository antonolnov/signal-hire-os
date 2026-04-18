import { PageShell } from "../../components/page-shell";
import {
  getConversationSessions,
  getConversationSummaryMetrics,
} from "../../lib/queries/conversations";
import { ensureConversationDemoData, ensureSeedData } from "../../lib/seed";
import { uiLabel } from "../../lib/ui";

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
        <article className="card highlight">
          <div className="card-inner">
            <div className="kicker">Инбокс диалогов</div>
            <h2 className="section-title">Держи согласования с человеком и ИИ-треды в одной рабочей поверхности</h2>
            <p className="muted">
              Эта страница должна работать как входящий центр для команды рекрутинга. Видно, где ИИ продолжает
              автономно, а где нужно решение человека или эскалация.
            </p>
            <div className="hero-grid">
              <div className="stat">
                <strong>{metrics.totalSessions}</strong>
                <div>Всего сессий</div>
              </div>
              <div className="stat">
                <strong>{metrics.activeSessions}</strong>
                <div>Активные</div>
              </div>
              <div className="stat">
                <strong>{metrics.approvalQueue}</strong>
                <div>Очередь согласований</div>
              </div>
              <div className="stat">
                <strong>{metrics.escalations}</strong>
                <div>Эскалации</div>
              </div>
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-inner">
            <div className="kicker">Операционная модель</div>
            <ul className="list">
              <li>Ответы ИИ живут рядом с контекстом кандидата и вакансии.</li>
              <li>Запросы на согласование видны до того, как станут тихими блокерами.</li>
              <li>Эскалации остаются привязаны к треду, а не прячутся в отдельном административном слое.</li>
            </ul>
          </div>
        </article>
      </section>

      <section className="grid-3 dashboard-section">
        {sessions.map((session) => {
          const card = session as any;
          const lastMessage = card.messages?.[0];
          const previousMessage = card.messages?.[1];

          return (
            <article className="card" key={card.id}>
              <div className="card-inner">
                <div className="kicker">{card.playbook?.name ?? "Без плейбука"}</div>
                <h3 className="section-title">{card.candidate?.fullName ?? "Неизвестный кандидат"}</h3>
                <p className="muted">
                  {[
                    card.application?.job?.title,
                    card.candidate?.headline,
                    card.candidate?.location,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Пока без связанного контекста"}
                </p>
                <div className="badge-row">
                  <span className="badge">{uiLabel(card.status)}</span>
                  {card.application?.fitLevel ? <span className="badge">{uiLabel(card.application.fitLevel)}</span> : null}
                  {card.playbook?.channelType ? <span className="badge">{uiLabel(card.playbook.channelType)}</span> : null}
                </div>
                <ul className="list">
                  <li>{lastMessage?.content ?? "Здесь появится превью последнего сообщения."}</li>
                  <li>
                    {lastMessage?.requiresApproval
                      ? "Ждёт согласования рекрутера"
                      : card.application?.recommendedNextStep ?? "Здесь появится следующий шаг."}
                  </li>
                  <li>{previousMessage?.content ?? "Здесь появится предыдущий контекст треда."}</li>
                </ul>
              </div>
            </article>
          );
        })}
      </section>
    </PageShell>
  );
}
