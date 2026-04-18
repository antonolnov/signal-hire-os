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

export function PageShell({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <div className="page">
      <div className="shell shell-frame">
        <aside className="sidebar">
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
        </aside>

        <section className="workspace">
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

          <main className="stack">{children}</main>

          <footer className="workspace-footer muted">
            Самодостаточный ATS MVP, собранный как локальная рабочая среда без внешней базы данных.
          </footer>
        </section>
      </div>
    </div>
  );
}
