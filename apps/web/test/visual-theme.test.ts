import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function read(relativePath: string) {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf-8");
}

describe("visual theme regression", () => {
  it("keeps the global shell on the mineral dark token system", () => {
    const css = read("app/globals.css");
    expect(css).toContain("--color-bg: #090b0f");
    expect(css).toContain("--color-accent: #c89a57");
    expect(css).toContain("background: linear-gradient(180deg, rgba(25, 31, 39, 0.96), rgba(18, 22, 29, 0.96));");
    expect(css).toContain("background: linear-gradient(180deg, rgba(12, 15, 20, 0.94), rgba(16, 20, 27, 0.94));");
    expect(css).not.toContain("background: #f7f6f2;");
  });

  it("uses the shared shell and nav accent treatment instead of legacy blue active states", () => {
    const shell = read("components/ops-shell/KhalOpsShell.tsx");
    const nav = read("components/ops-shell/KhalOpsNav.tsx");
    expect(shell).toContain("var(--color-border)");
    expect(nav).toContain("var(--color-accent)");
    expect(nav).not.toContain("bg-blue-600");
  });
});
