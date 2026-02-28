"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const primaryTabs = [
  { href: "/mission-command", label: "Mission Command" },
  { href: "/war-gaming", label: "War Gaming" },
  { href: "/surgical-execution", label: "Surgical Execution" }
] as const;

const sideLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/war-room", label: "War Room" },
  { href: "/mission-command", label: "Mission Command" },
  { href: "/war-gaming", label: "War Gaming" },
  { href: "/surgical-execution", label: "Surgical Execution" },
  { href: "/affairs", label: "Affairs" },
  { href: "/interests", label: "Interests" },
  { href: "/settings", label: "Settings" }
] as const;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function statusForPath(pathname: string): string {
  if (pathname.startsWith("/war-gaming")) return "PLANNING LAYER";
  if (pathname.startsWith("/surgical-execution")) return "EXECUTION LAYER";
  if (pathname.startsWith("/mission-command")) return "COMMAND LAYER";
  if (pathname.startsWith("/war-room")) return "ONTOLOGY LAYER";
  return "ANTIFRAGILE";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/war-room")) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <nav className="mc2-topbar app-topbar">
        <div className="mc2-brand-wrap">
          <Link href="/war-room" className="mc2-brand">
            WAR ROOM
          </Link>
          <div className="mc2-tabs">
            {primaryTabs.map((tab) => (
              <Link key={tab.href} href={tab.href} className={isActive(pathname, tab.href) ? "active" : ""}>
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mc2-status">{statusForPath(pathname)}</div>
      </nav>
      <div className="app-body">
        <aside className="app-leftnav">
          {sideLinks.map((link) => (
            <Link key={link.href} href={link.href} className={isActive(pathname, link.href) ? "active" : ""}>
              {link.label}
            </Link>
          ))}
        </aside>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
