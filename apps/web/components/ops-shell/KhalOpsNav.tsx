"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
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

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;
      const tag = target.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select" || tag === "button";
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === "tab") {
        event.preventDefault();
        router.push("/missionCommand");
        return;
      }
      if (event.key !== "Tab" || event.metaKey || event.altKey || event.ctrlKey) return;
      if (isEditableTarget(event.target)) return;
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
  }, [pathname, router]);

  return (
    <aside data-khal-nav="true" className="w-60 border-r border-white/10 bg-zinc-900/50 backdrop-blur-xl p-3 flex-shrink-0">
      <div className="flex items-center gap-3 px-1 py-2 mb-2">
        <div className="w-8 h-8 text-[#ff8c00]">
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
              ref={(el) => {
                navRefs.current[index] = el;
              }}
              data-khal-nav-item="true"
              className={
                active
                  ? "flex items-center gap-2 px-2.5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
                  : "flex items-center gap-2 px-2.5 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 text-sm font-medium"
              }
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
