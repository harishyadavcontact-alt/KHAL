#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const startedAt = new Date();
const files = [
  "artifacts/quality/docs-validate.json",
  "artifacts/quality/smoke-routes.json",
  "artifacts/quality/perf-smoke.json"
];

const failures = [];
const metrics = {};
for (const file of files) {
  if (!existsSync(file)) {
    failures.push({ file, message: "missing quality report" });
    continue;
  }
  try {
    const data = JSON.parse(readFileSync(file, "utf8"));
    metrics[file] = data.metrics ?? {};
    if (data.status !== "passed") {
      failures.push({ file, message: `status=${data.status}` });
    }
  } catch (error) {
    failures.push({ file, message: String(error) });
  }
}

mkdirSync("artifacts/quality", { recursive: true });
writeFileSync(
  "artifacts/quality/qa-summary.json",
  JSON.stringify(
    {
      suite: "qa-summary",
      status: failures.length ? "failed" : "passed",
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      failures,
      metrics
    },
    null,
    2
  )
);

if (failures.length) {
  process.exit(1);
}
