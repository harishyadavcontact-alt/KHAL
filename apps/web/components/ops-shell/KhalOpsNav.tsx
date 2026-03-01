"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KHAL_OPS_NAV_ITEMS } from "./nav-config";
import { KhalFinalMark } from "../branding/KhalFinalMark";
import { KhalWordmark } from "../branding/KhalWordmark";

function isActive(pathname: string, href: string, matchPrefixes?: string[]) {
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  return (matchPrefixes ?? []).some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function KhalOpsNav() {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r border-white/10 bg-zinc-900/50 backdrop-blur-xl p-3 flex-shrink-0">
      <div className="flex items-center gap-3 px-1 py-2 mb-2">
        <div className="w-8 h-8 text-[#ff8c00]">
          <KhalFinalMark size={32} />
        </div>
        <KhalWordmark size={24} variant="muted" />
      </div>

      <nav className="space-y-1">
        {KHAL_OPS_NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href, item.matchPrefixes);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
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

