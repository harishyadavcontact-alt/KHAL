import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function read(relativePath: string) {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf-8");
}

describe("portfolio route contract", () => {
  it("keeps Portfolio War Room discoverable from Mission Command with a compatibility alias", () => {
    const missionPage = read("app/missionCommand/page.tsx");
    const sectionRegistry = read("lib/navigation/sections.ts");
    expect(missionPage).toContain("/missionCommand/portfolio");
    expect(sectionRegistry).toContain('"/portfolio"');
    expect(sectionRegistry).toContain('"/missionCommand"');
  });
});
