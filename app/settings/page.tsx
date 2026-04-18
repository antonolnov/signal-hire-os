import { PageShell } from "../../components/page-shell";

export default function SettingsPage() {
  return (
    <PageShell>
      <section className="grid-2">
        <article className="card">
          <div className="card-inner">
            <div className="kicker">Workspace settings</div>
            <h2 className="section-title">Настройки команды, источников и automation policy</h2>
            <ul className="list">
              <li>Пользователи и роли</li>
              <li>Подключенные источники кандидатов</li>
              <li>AI autonomy modes</li>
              <li>Audit policy и approval rules</li>
            </ul>
          </div>
        </article>
        <article className="card highlight">
          <div className="card-inner">
            <div className="kicker">Infra next</div>
            <p className="muted">
              Следующий технический шаг, дожать локальный store до полного CRUD, а потом при необходимости подключить Supabase Auth/Storage и background jobs для ingestion + AI tasks.
            </p>
          </div>
        </article>
      </section>
    </PageShell>
  );
}
