import Link from "next/link";
import type { PropsWithChildren } from "react";

const navItems = [
  ["/", "Обзор"],
  ["/jobs", "Вакансии"],
  ["/candidates", "Кандидаты"],
  ["/pipeline", "Pipeline"],
  ["/imports", "Импорт"],
  ["/playbooks", "Playbooks"],
  ["/conversations", "Диалоги"],
  ["/settings", "Настройки"],
] as const;

export function PageShell({ children }: PropsWithChildren) {
  return (
    <div className="page">
      <div className="shell">
        <div className="topbar">
          <div className="brand">
            <div className="brand-mark">AI</div>
            <div className="brand-copy">
              <h1>Signal Hire OS</h1>
              <p>ATS MVP для AI-native recruiting team workflow</p>
            </div>
          </div>
          <nav className="nav" aria-label="Основная навигация">
            {navItems.map(([href, label]) => (
              <Link href={href} key={href}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
        {children}
        <footer>
          Базовый каркас MVP. Следующий шаг, подключить данные, auth, ingestion и AI workflows.
        </footer>
      </div>
    </div>
  );
}
