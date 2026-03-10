import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function read(relativePath: string) {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf-8");
}

describe("visual theme regression", () => {
  it("keeps the shared token system and adds a light-theme override", () => {
    const css = read("app/globals.css");
    expect(css).toContain("--color-bg: #090b0f");
    expect(css).toContain("--color-accent: #c89a57");
    expect(css).toContain(':root[data-theme="light"]');
    expect(css).toContain("--color-bg: #f2ede3;");
    expect(css).toContain("--shell-bg:");
  });

  it("uses the shared shell/nav accent treatment and exposes a theme toggle", () => {
    const shell = read("components/ops-shell/KhalOpsShell.tsx");
    const nav = read("components/ops-shell/KhalOpsNav.tsx");
    const appShell = read("components/app-shell.tsx");
    const toggle = read("components/theme/ThemeToggle.tsx");
    const provider = read("components/theme/ThemeProvider.tsx");
    expect(shell).toContain("var(--color-line)");
    expect(nav).toContain("var(--color-accent)");
    expect(toggle).toContain("Switch theme to");
    expect(provider).toContain("khal.theme.preference");
    expect(appShell).toContain("ThemeToggle");
  });
});
