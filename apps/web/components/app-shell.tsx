"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/dashboard", "Dashboard"],
  ["/war-room", "War Room"],
  ["/war-gaming", "War Gaming"],
  ["/surgical-execution", "Surgical Execution"],
  ["/mission-command", "Mission Command"],
  ["/affairs", "Affairs"],
  ["/interests", "Interests"],
  ["/settings", "Settings"]
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>Khal v0.1</h1>
        <nav>
          {links.map(([href, label]) => (
            <Link key={href} href={href} style={{ outline: pathname === href ? "1px solid #64748b" : "none" }}>
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main">
        <div className="toolbar">
          <div>Mode: Missionary / Visionary</div>
          <Link href="/settings">Workbook Settings</Link>
        </div>
        {children}
      </main>
    </div>
  );
}