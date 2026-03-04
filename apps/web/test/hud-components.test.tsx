import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { AppData } from "../components/war-room-v2/types";
import { HudStatusStrip } from "../components/war-room-v2/hud/HudStatusStrip";
import { LifeClockCard } from "../components/war-room-v2/hud/LifeClockCard";
import { AlertQueuePanel } from "../components/war-room-v2/hud/AlertQueuePanel";
import { SystemAnatomyMiniMap } from "../components/war-room-v2/hud/SystemAnatomyMiniMap";
import { BlackSwanReadinessPanel, ExecutionDistributionPanel, ViaNegativaPanel } from "../components/war-room-v2/panels/RobustnessPanels";
import { NextActionStrip } from "../components/war-room-v2/panels/NextActionStrip";
import { computeBlackSwanReadiness, computeExecutionDistribution, computeViaNegativaQueue } from "../lib/war-room/operational-metrics";

function makeData(): AppData {
  return {
    user: { birthDate: "2000-01-01T00:00:00.000Z", lifeExpectancy: 80, name: "Operator", location: "Local" },
    strategyMatrix: { allies: 0, enemies: 0, overt: 0, covert: 0, offense: 0, defense: 0, conventional: 0, unconventional: 0 },
    laws: [],
    domains: [{ id: "domain-1", name: "Domain 1", fragilityText: "critical fragility" }],
    crafts: [],
    interests: [{ id: "interest-1", title: "Interest 1", domainId: "domain-1", stakes: 5, risk: 5, convexity: 8, status: "in_progress", objectives: [] }],
    affairs: [],
    tasks: [{ id: "task-1", title: "Task 1", domainId: "domain-1", sourceType: "PLAN", sourceId: "mission-global", priority: 50, status: "not_started", horizon: "WEEK" }],
    sources: [{ id: "source-1", code: "S1", name: "Source 1", sortOrder: 1, domainCount: 1, domains: [] }],
    missionGraph: { nodes: [], dependencies: [] },
    lineages: { nodes: [], entities: [] },
    lineageRisks: [
      {
        id: "risk-1",
        sourceId: "source-1",
        domainId: "domain-1",
        lineageNodeId: "self",
        actorType: "public",
        title: "Risk 1",
        exposure: 8,
        dependency: 7,
        irreversibility: 6,
        optionality: 3,
        responseTime: 20,
        fragilityScore: 82,
        status: "OPEN"
      }
    ],
    doctrine: { rulebooks: [], rules: [], domainPnLLadders: [] },
    decisionAccelerationMeta: {
      computedAtIso: "2026-01-01T00:00:00.000Z",
      dataQuality: "MEDIUM",
      invariantViolations: [],
      fallbackUsed: false,
      protocolState: "WATCH"
    }
  };
}

describe("hud components", () => {
  it("renders dashboard HUD components with full data", () => {
    const data = makeData();
    const html = renderToStaticMarkup(
      <>
        <HudStatusStrip data={data} />
        <LifeClockCard data={data} />
        <AlertQueuePanel data={data} />
        <SystemAnatomyMiniMap data={data} />
      </>
    );
    expect(html).toContain("Life Clock");
    expect(html).toContain("Prioritized Alerts");
    expect(html).toContain("System Anatomy");
  });

  it("renders safe fallback with sparse data", () => {
    const data: AppData = {
      user: { birthDate: "2000-01-01T00:00:00.000Z", lifeExpectancy: 80, name: "Operator", location: "Local" },
      strategyMatrix: { allies: 0, enemies: 0, overt: 0, covert: 0, offense: 0, defense: 0, conventional: 0, unconventional: 0 },
      laws: [],
      domains: [],
      crafts: [],
      interests: [],
      affairs: [],
      tasks: []
    };
    const html = renderToStaticMarkup(
      <>
        <HudStatusStrip data={data} compact />
        <AlertQueuePanel data={data} compact />
        <SystemAnatomyMiniMap data={data} />
      </>
    );
    expect(html).toContain("No active alerts in current scope");
    expect(html).toContain("Protocol");
  });

  it("renders curated robustness lift panels", () => {
    const data = makeData();
    const html = renderToStaticMarkup(
      <>
        <ViaNegativaPanel items={computeViaNegativaQueue(data, 3)} />
        <BlackSwanReadinessPanel snapshot={computeBlackSwanReadiness(data)} />
        <ExecutionDistributionPanel snapshot={computeExecutionDistribution(data)} />
      </>
    );
    expect(html).toContain("Via Negativa Queue");
    expect(html).toContain("Black Swan Readiness");
    expect(html).toContain("Execution Distribution");
  });

  it("renders dashboard next-action strip", () => {
    const html = renderToStaticMarkup(
      <NextActionStrip
        triage={{
          mode: "interest",
          targetId: "interest-1",
          blocked: true,
          readinessScore: 52,
          nextAction: "Set max-loss default (10%)",
          generatedAtIso: "2026-01-01T00:00:00.000Z",
          suggestions: [
            {
              id: "s1",
              mode: "interest",
              targetId: "interest-1",
              title: "Set max-loss default (10%)",
              reason: "Interests require convex setup.",
              priority: 80,
              missingItems: ["maxLossPct"],
              actionKind: "SET_INTEREST_MAX_LOSS_DEFAULT",
              actionPayload: { maxLossPct: 10 },
              expectedReadinessDelta: 10
            }
          ]
        }}
        onOpen={() => {}}
        onApplyAction={() => {}}
      />
    );
    expect(html).toContain("Next Actions");
    expect(html).toContain("Set max-loss default");
  });
});
