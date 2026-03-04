#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";

const routes = [
  "/brand",
  "/khal/logo",
  "/khal/wordmark",
  "/home",
  "/dashboard",
  "/war-room",
  "/missionCommand",
  "/source-of-volatility",
  "/maya",
  "/lab",
  "/interests",
  "/affairs",
  "/war-gaming/affair",
  "/war-gaming/source",
  "/war-gaming/domain",
  "/war-gaming/interest",
  "/war-gaming/craft",
  "/war-gaming/mission",
  "/war-gaming/lineage",
  "/surgical-execution",
  "/crafts-library",
  "/time-horizon",
  "/lineage-map"
];

const args = process.argv.slice(2);
const baseArg = args.find((arg) => arg.startsWith("--baseUrl="));
const spacedBaseIndex = args.findIndex((arg) => arg === "--baseUrl");
const baseUrl =
  baseArg ? baseArg.split("=")[1] :
  spacedBaseIndex >= 0 && args[spacedBaseIndex + 1] ? args[spacedBaseIndex + 1] :
  "http://localhost:3010";
const startedAt = new Date();

const failures = [];
for (const route of routes) {
  const url = `${baseUrl}${route}`;
  const t0 = Date.now();
  try {
    const res = await fetch(url);
    const durationMs = Date.now() - t0;
    if (res.status !== 200) {
      failures.push({ route, status: res.status, durationMs });
      console.error(`FAIL ${route} (${res.status})`);
    } else {
      console.log(`OK   ${route} (200) ${durationMs}ms`);
    }
  } catch (error) {
    const durationMs = Date.now() - t0;
    failures.push({ route, status: 0, durationMs, error: String(error) });
    console.error(`FAIL ${route} (network)`);
  }
}

mkdirSync("artifacts/quality", { recursive: true });
const finishedAt = new Date();
writeFileSync(
  "artifacts/quality/smoke-routes.json",
  JSON.stringify(
    {
      suite: "route-smoke",
      status: failures.length ? "failed" : "passed",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      failures,
      metrics: {
        totalRoutes: routes.length,
        passedRoutes: routes.length - failures.length,
        failedRoutes: failures.length
      }
    },
    null,
    2
  )
);

if (failures.length) {
  process.exit(1);
}
