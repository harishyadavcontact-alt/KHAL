"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { KHAL_OPS_NAV_ITEMS } from "./nav-config";
import { KhalFinalMark } from "../branding/KhalFinalMark";
import { KhalWordmark } from "../branding/KhalWordmark";

const DESKTOP_NAV_COLLAPSED_KEY = "khal:ops-nav:collapsed";

function isActive(pathname: string, href: string, matchPrefixes?: string[]) {
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  return (matchPrefixes ?? []).some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function KhalOpsNav() {
  const pathname = usePathname();
  const router = useRouter();
  const navRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [desktopReady, setDesktopReady] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(DESKTOP_NAV_COLLAPSED_KEY);
    setDesktopCollapsed(stored === "true");
    setDesktopReady(true);
  }, []);

  useEffect(() => {
    if (!desktopReady || typeof window === "undefined") return;
    window.localStorage.setItem(DESKTOP_NAV_COLLAPSED_KEY, desktopCollapsed ? "true" : "false");
  }, [desktopCollapsed, desktopReady]);

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;
      const tag = target.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select" || tag === "button";
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
        return;
      }
      if (event.ctrlKey && event.key.toLowerCase() === "tab") {
        event.preventDefault();
        router.push("/missionCommand");
        return;
      }
      if (event.key !== "Tab" || event.metaKey || event.altKey || event.ctrlKey) return;
      if (isEditableTarget(event.target)) return;
      if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches && !mobileOpen) return;
      if (pathname.startsWith("/missionCommand")) {
        const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const insideNav = Boolean(activeElement?.closest("[data-khal-nav='true']"));
        if (!insideNav) return;
      }

      const items = navRefs.current.filter(Boolean) as HTMLAnchorElement[];
      if (!items.length) return;

      event.preventDefault();
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const index = items.findIndex((item) => item === active);
      const direction = event.shiftKey ? -1 : 1;
      const nextIndex = index === -1 ? (direction > 0 ? 0 : items.length - 1) : (index + direction + items.length) % items.length;
      items[nextIndex]?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, pathname, router]);

  return (
    <>
      <button
        type="button"
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        onClick={() => setMobileOpen((value) => !value)}
        className="fixed left-3 top-3 z-50 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-soft)] p-2 text-[var(--color-text)] md:hidden"
      >
        {mobileOpen ? <X size={16} /> : <Menu size={16} />}
      </button>
      {mobileOpen && <button type="button" aria-label="Close navigation overlay" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/60 md:hidden" />}

      <aside
        data-khal-nav="true"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--color-border)] bg-[var(--leftnav-bg)] p-3 backdrop-blur-xl transition-[transform,width] duration-200 md:static md:translate-x-0 md:flex-shrink-0 ${
          desktopCollapsed ? "md:w-[4.75rem]" : "md:w-60"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className={`mb-2 flex items-center px-1 py-2 ${desktopCollapsed ? "justify-center md:px-0" : "gap-3"}`}>
          <div className="h-8 w-8 text-[#ff8c00]">
            <KhalFinalMark size={32} />
          </div>
          <div className={desktopCollapsed ? "md:hidden" : ""}>
            <KhalWordmark size={24} variant="muted" />
          </div>
        </div>

        <nav className="space-y-1">
          {KHAL_OPS_NAV_ITEMS.map((item, index) => {
            const active = isActive(pathname, item.href, item.matchPrefixes);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onMouseEnter={() => router.prefetch(item.href)}
                onClick={() => setMobileOpen(false)}
                ref={(el) => {
                  navRefs.current[index] = el;
                }}
                data-khal-nav-item="true"
                className={
                  active
                    ? `flex items-center rounded-lg border border-[var(--color-border-strong)] bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] py-2 text-sm font-medium text-[#111318] shadow-[0_12px_28px_rgba(200,154,87,0.22)] ${
                        desktopCollapsed ? "justify-center px-2 md:px-0" : "gap-2 px-2.5"
                      }`
                    : `flex items-center rounded-lg border border-transparent py-2 text-sm font-medium text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:bg-white/5 hover:text-[var(--color-text)] ${
                        desktopCollapsed ? "justify-center px-2 md:px-0" : "gap-2 px-2.5"
                      }`
                }
                title={desktopCollapsed ? item.label : undefined}
              >
                <Icon size={16} />
                <span className={desktopCollapsed ? "md:hidden" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden pt-3 md:block">
          <button
            type="button"
            aria-label={desktopCollapsed ? "Expand navigation" : "Collapse navigation"}
            onClick={() => setDesktopCollapsed((value) => !value)}
            className={`flex w-full items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-soft)] py-2 text-sm font-medium text-[var(--color-text-muted)] transition hover:text-[var(--color-text)] ${
              desktopCollapsed ? "justify-center px-0" : "gap-2 px-2.5"
            }`}
          >
            {desktopCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            <span className={desktopCollapsed ? "hidden" : ""}>{desktopCollapsed ? "Expand" : "Collapse"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
