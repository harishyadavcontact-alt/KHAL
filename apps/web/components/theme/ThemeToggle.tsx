"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "./ThemeProvider";

const OPTIONS: Array<{ id: ThemePreference; label: string; icon: typeof Sun }> = [
  { id: "system", label: "System", icon: Monitor },
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon }
];

export function ThemeToggle() {
  const { preference, resolvedTheme, setPreference } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-panel-soft)] p-1 text-[var(--color-text-muted)]">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = preference === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            aria-label={`Switch theme to ${option.label}`}
            onClick={() => setPreference(option.id)}
            className={
              active
                ? "inline-flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-accent-contrast)]"
                : "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] hover:bg-white/5 hover:text-[var(--color-text)]"
            }
          >
            <Icon size={12} />
            <span>{option.label}</span>
          </button>
        );
      })}
      <span className="hidden px-1 text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)] md:inline">
        {resolvedTheme}
      </span>
    </div>
  );
}
