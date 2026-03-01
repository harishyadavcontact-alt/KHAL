"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KHAL_OPS_BYPASS_PREFIXES } from "./ops-shell/nav-config";

const primaryTabs = [
  { href: "/home", label: "Home" },
  { href: "/war-room", label: "War Room" },
  { href: "/war-gaming", label: "War Gaming" },
  { href: "/missionCommand", label: "Mission Command" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/brand", label: "Brand" }
] as const;

const sideLinks = [
  { href: "/home", label: "Home" },
  { href: "/war-room", label: "War Room" },
  { href: "/war-gaming", label: "War Gaming" },
  { href: "/missionCommand", label: "Mission Command" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/brand", label: "Brand" }
] as const;

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
          <Link href="/home" className="mc2-brand">
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
