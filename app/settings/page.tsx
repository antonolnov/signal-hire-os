import { PageShell } from "../../components/page-shell";

export default function SettingsPage() {
  return (
    <PageShell>
      <section className="grid-2">
        <article className="card highlight">
          <div className="card-inner">
            <div className="kicker">Настройки рабочей области</div>
            <h2 className="section-title">Политики, роли и системный контроль должны жить в одном слое управления</h2>
            <p className="muted">
              Пока это ещё обзорный экран, но он уже должен задавать ощущение центра управления для
              команды, источников и политики автоматизации.
            </p>
            <div className="quick-links" style={{ marginTop: 20 }}>
              <div className="quick-link">
                <strong>Пользователи и роли</strong>
                <span>Модель доступа для рекрутеров, нанимающих менеджеров и операторов.</span>
              </div>
              <div className="quick-link">
                <strong>Подключения источников</strong>
                <span>Каналы поступления кандидатов и будущие интеграции.</span>
              </div>
              <div className="quick-link">
                <strong>Режимы автономности ИИ</strong>
                <span>Сколько свободы получают плейбуки до проверки рекрутера.</span>
              </div>
              <div className="quick-link">
                <strong>Политика аудита</strong>
                <span>Правила согласования, прослеживаемость и журнал решений.</span>
              </div>
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-inner">
            <div className="kicker">Что дальше по инфраструктуре</div>
            <ul className="list">
              <li>Дожать полное покрытие CRUD на всех ATS-экранах.</li>
              <li>Добавить авторизацию и командные роли, когда появится реальная коллаборация.</li>
              <li>Ввести фоновые задачи для импорта и ИИ-процессов.</li>
              <li>Подключать постоянное хранилище только когда продуктовая модель стабилизируется.</li>
            </ul>
          </div>
        </article>
      </section>
    </PageShell>
  );
}
