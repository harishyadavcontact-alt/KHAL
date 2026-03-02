"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { KHAL_OPS_NAV_ITEMS } from "./nav-config";
import { KhalFinalMark } from "../branding/KhalFinalMark";
import { KhalWordmark } from "../branding/KhalWordmark";

function isActive(pathname: string, href: string, matchPrefixes?: string[]) {
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  return (matchPrefixes ?? []).some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function KhalOpsNav() {
  const pathname = usePathname();
  const router = useRouter();
  const navRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
        className="fixed left-3 top-3 z-50 rounded-md border border-white/20 bg-zinc-900/90 p-2 text-zinc-100 md:hidden"
      >
        {mobileOpen ? <X size={16} /> : <Menu size={16} />}
      </button>
      {mobileOpen && <button type="button" aria-label="Close navigation overlay" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/60 md:hidden" />}

      <aside
        data-khal-nav="true"
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-white/10 bg-zinc-900/95 p-3 backdrop-blur-xl transition-transform duration-200 md:static md:w-60 md:translate-x-0 md:flex-shrink-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-2 flex items-center gap-3 px-1 py-2">
          <div className="h-8 w-8 text-[#ff8c00]">
            <KhalFinalMark size={32} />
          </div>
          <KhalWordmark size={24} variant="muted" />
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
                    ? "flex items-center gap-2 rounded-lg bg-blue-600 px-2.5 py-2 text-sm font-medium text-white"
                    : "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white"
                }
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
