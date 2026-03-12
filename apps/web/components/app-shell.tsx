"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useOpenBook } from "./openbook-provider";

const NAV_ITEMS = [
  { href: "/library", label: "Library" },
  { href: "/settings", label: "Settings" }
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const {
    state: { settings }
  } = useOpenBook();

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand-badge">
          <p className="eyebrow">OpenBook</p>
        </div>

        <nav className="nav-stack" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname.startsWith(item.href) ? "nav-link nav-link-active" : "nav-link"}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="status-card">
          <p className="card-label">Capture mode</p>
          <strong>{settings.captureMode === "browser-extension" ? "Browser extension" : "In-app WebView"}</strong>
          <p>Use the extension when the book lives behind an authenticated browser session.</p>
        </div>
      </aside>

      <main className="main-panel">{children}</main>
    </div>
  );
}
