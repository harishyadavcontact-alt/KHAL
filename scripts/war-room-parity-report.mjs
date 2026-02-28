import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const componentRoot = path.join(repoRoot, "apps", "web", "components", "war-room-v2");
const reportDir = path.join(repoRoot, "docs", "reports");
const jsonOut = path.join(reportDir, "war-room-parity-report.json");
const mdOut = path.join(reportDir, "war-room-parity-report.md");

const components = [
  "HUD.tsx",
  "StrategyCircle.tsx",
  "FragilityRadar.tsx",
  "TaskKillChain.tsx",
  "LawCard.tsx",
  "DecisionChamber.tsx",
  "TaskCard.tsx",
  "SurgicalExecution.tsx",
  "DecisionModal.tsx",
  "WarGaming.tsx",
  "DomainCard.tsx",
  "MissionCommand.tsx",
  "LawDetail.tsx",
  "InterestDetail.tsx",
  "GenericAddModal.tsx",
  "CraftDetail.tsx",
  "LawsView.tsx",
  "InterestsView.tsx",
  "AffairsView.tsx",
  "CraftsView.tsx",
  "DomainModal.tsx",
  "war-room-v2-app.tsx"
];

const requiredCopy = [
  "Temporal Position",
  "Strategic Posture (8 Fronts)",
  "Fragility Mapping",
  "Surgical Kill Chain",
  "Affair Decision Chamber",
  "Surgical Execution",
  "Decision Chamber: New Scenario",
  "War Gaming Chamber",
  "Macro Domains",
  "Laws of Volatility",
  "Long-term Interests",
  "Active Affairs",
  "Crafts Library"
];

const requiredNoPatterns = [
  "Math.random(",
  "const mockData"
];

const entries = [];
for (const file of components) {
  const full = path.join(componentRoot, file);
  const exists = fs.existsSync(full);
  entries.push({
    file,
    exists,
    status: exists ? "exact" : "missing"
  });
}

const allSource = components
  .map((f) => path.join(componentRoot, f))
  .filter((f) => fs.existsSync(f))
  .map((f) => fs.readFileSync(f, "utf8"))
  .join("\n");

const copyChecks = requiredCopy.map((text) => ({
  text,
  status: allSource.includes(text) ? "exact" : "missing"
}));

const noPatternChecks = requiredNoPatterns.map((pattern) => ({
  pattern,
  status: allSource.includes(pattern) ? "drifted" : "exact"
}));

const summary = {
  generatedAt: new Date().toISOString(),
  componentCoverage: {
    total: entries.length,
    exact: entries.filter((e) => e.status === "exact").length,
    missing: entries.filter((e) => e.status === "missing").length
  },
  copyCoverage: {
    total: copyChecks.length,
    exact: copyChecks.filter((e) => e.status === "exact").length,
    missing: copyChecks.filter((e) => e.status === "missing").length
  },
  conformance: {
    forbiddenPatterns: noPatternChecks
  }
};

const report = {
  summary,
  components: entries,
  copyChecks,
  noPatternChecks
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2));

const md = [
  "# War Room Parity Report",
  "",
  `Generated: ${summary.generatedAt}`,
  "",
  "## Component Coverage",
  `- Total: ${summary.componentCoverage.total}`,
  `- Exact: ${summary.componentCoverage.exact}`,
  `- Missing: ${summary.componentCoverage.missing}`,
  "",
  "## Copy Coverage",
  `- Total: ${summary.copyCoverage.total}`,
  `- Exact: ${summary.copyCoverage.exact}`,
  `- Missing: ${summary.copyCoverage.missing}`,
  "",
  "## Forbidden Pattern Checks",
  ...noPatternChecks.map((p) => `- \`${p.pattern}\`: ${p.status}`),
  "",
  "## Missing Components",
  ...entries.filter((e) => e.status === "missing").map((e) => `- ${e.file}`),
  "",
  "## Missing Copy",
  ...copyChecks.filter((e) => e.status === "missing").map((e) => `- ${e.text}`)
].join("\n");

fs.writeFileSync(mdOut, md);
console.log(`Wrote ${jsonOut}`);
console.log(`Wrote ${mdOut}`);
