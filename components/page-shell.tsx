"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";

const navItems = [
  ["/", "Обзор"],
  ["/jobs", "Вакансии"],
  ["/candidates", "Кандидаты"],
  ["/pipeline", "Пайплайн"],
  ["/imports", "Импорт"],
  ["/playbooks", "Плейбуки"],
  ["/conversations", "Инбокс"],
  ["/settings", "Настройки"],
] as const;

type PageShellProps = PropsWithChildren<{
  chrome?: "default" | "dashboard";
}>;

export function PageShell({ children, chrome = "default" }: PageShellProps) {
  const pathname = usePathname();
  const isDashboard = chrome === "dashboard";

  return (
    <div className="page">
      <div className={`shell shell-frame${isDashboard ? " shell-dashboard" : ""}`}>
        <aside className={`sidebar${isDashboard ? " sidebar-compact" : ""}`}>
          {!isDashboard ? (
            <>
              <header className="topbar">
                <div className="brand">
                  <div className="brand-mark">SH</div>
                  <div className="brand-copy">
                    <h1>Signal Hire OS</h1>
                    <p>ATS для операционной команды найма</p>
                  </div>
                </div>

                <div className="badge-row badge-row-tight">
                  <span className="badge">Локальная среда</span>
                  <span className="badge">JSON-хранилище</span>
                </div>
              </header>

              <nav className="nav nav-vertical" aria-label="Основная навигация">
                {navItems.map(([href, label]) => (
                  <Link aria-current={pathname === href ? "page" : undefined} href={href} key={href}>
                    {label}
                  </Link>
                ))}
              </nav>

              <div className="sidebar-note muted">
                Рабочая область для вакансий, кандидатов, пайплайна, импорта и операторского инбокса.
              </div>
            </>
          ) : (
            <nav className="nav nav-vertical" aria-label="Основная навигация">
              {navItems.map(([href, label]) => (
                <Link aria-current={pathname === href ? "page" : undefined} href={href} key={href}>
                  {label}
                </Link>
              ))}
            </nav>
          )}
        </aside>

        <section className={`workspace${isDashboard ? " workspace-dashboard" : ""}`}>
          {!isDashboard ? (
            <header className="workspace-header">
              <div>
                <div className="kicker">Операторская рабочая область</div>
                <h2>Командный центр найма</h2>
                <p className="muted">
                  Один интерфейс для приоритизации нагрузки, решений по кандидатам и контроля автоматизации.
                </p>
              </div>

              <div className="badge-row badge-row-tight">
                <span className="badge">Демо-данные</span>
                <span className="badge">Локальная логика</span>
              </div>
            </header>
          ) : null}

          <main className="stack">{children}</main>

          {!isDashboard ? (
            <footer className="workspace-footer muted">
              Самодостаточный ATS MVP, собранный как локальная рабочая среда без внешней базы данных.
            </footer>
          ) : null}
        </section>
      </div>
    </div>
  );
}
