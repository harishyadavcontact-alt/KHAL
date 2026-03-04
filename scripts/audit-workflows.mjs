import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const workflowDir = path.resolve(".github", "workflows");
const expected = new Set(["ci.yml", "release.yml", "security.yml"]);
const findings = [];

if (!existsSync(workflowDir)) {
  findings.push("Missing .github/workflows directory.");
} else {
  const files = readdirSync(workflowDir).filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"));
  for (const file of files) {
    if (!expected.has(file)) {
      findings.push(`Unexpected workflow file detected: ${file}`);
    }
  }
  for (const name of expected) {
    if (!files.includes(name)) findings.push(`Expected workflow missing: ${name}`);
  }

  const ciPath = path.join(workflowDir, "ci.yml");
  if (existsSync(ciPath)) {
    const ci = readFileSync(ciPath, "utf-8");
    if (ci.includes("pnpm")) findings.push("Deprecated pnpm usage found in ci.yml. Expected npm-only pipeline.");
    if (!ci.includes("npm ci")) findings.push("ci.yml does not contain npm ci.");
  }
}

if (findings.length > 0) {
  for (const finding of findings) console.error(`[workflow-audit] ${finding}`);
  process.exit(1);
}

console.log("[workflow-audit] pass");
