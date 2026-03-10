"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KHAL_APP_SHELL_SECTIONS, KHAL_OPS_BYPASS_PREFIXES } from "../lib/navigation/sections";
import { ThemeToggle } from "./theme/ThemeToggle";

const primaryTabs: Array<{ href: string; label: string }> = [
  ...KHAL_APP_SHELL_SECTIONS.map((section) => ({ href: section.href, label: section.label })),
  { href: "/brand", label: "Brand" }
];
const sideLinks = primaryTabs;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function statusForPath(pathname: string): string {
  if (pathname.startsWith("/war-room")) return "ONTOLOGY";
  if (pathname.startsWith("/war-gaming")) return "PLANNING";
  if (pathname.startsWith("/missionCommand") || pathname.startsWith("/mission-command")) return "MISSION";
  if (pathname.startsWith("/dashboard")) return "OPS";
  return "KHAL";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (KHAL_OPS_BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <nav className="mc2-topbar app-topbar">
        <div className="mc2-brand-wrap">
          <Link href="/home" className="mc2-brand khal-title">
            KHAL
          </Link>
          <div className="mc2-tabs">
            {primaryTabs.map((tab) => (
              <Link key={tab.href} href={tab.href} className={isActive(pathname, tab.href) ? "active" : ""}>
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="mc2-status">{statusForPath(pathname)}</div>
        </div>
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
