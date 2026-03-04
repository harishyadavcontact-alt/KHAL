#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const baseArg = args.find((arg) => arg.startsWith("--baseUrl="));
const spacedBaseIndex = args.findIndex((arg) => arg === "--baseUrl");
const baseUrl =
  baseArg ? baseArg.split("=")[1] :
  spacedBaseIndex >= 0 && args[spacedBaseIndex + 1] ? args[spacedBaseIndex + 1] :
  "http://localhost:3010";

const targets = [
  "/dashboard",
  "/war-gaming/domain",
  "/api/war-room-data",
  "/api/decision-spec"
];

const budgets = {
  "/dashboard": 1500,
  "/war-gaming/domain": 1500,
  "/api/war-room-data": 2500,
  "/api/decision-spec": 900
};

const startedAt = new Date();
const failures = [];
const metrics = [];

for (const route of targets) {
  const method = "GET";
  const body = undefined;
  const headers = undefined;

  const t0 = Date.now();
  let status = 0;
  try {
    const res = await fetch(`${baseUrl}${route}`, { method, body, headers });
    status = res.status;
  } catch {
    status = 0;
  }
  const durationMs = Date.now() - t0;
  const budgetMs = budgets[route];
  metrics.push({ route, status, durationMs, budgetMs });

  const isHardFailure = status < 200 || status >= 400 || durationMs > budgetMs * 2;
  if (isHardFailure) {
    failures.push({ route, status, durationMs, budgetMs, severity: "high" });
  } else if (durationMs > budgetMs) {
    console.warn(`WARN ${route} ${durationMs}ms over budget ${budgetMs}ms`);
  }
}

mkdirSync("artifacts/quality", { recursive: true });
const finishedAt = new Date();
writeFileSync(
  "artifacts/quality/perf-smoke.json",
  JSON.stringify(
    {
      suite: "perf-smoke",
      status: failures.length ? "failed" : "passed",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
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
