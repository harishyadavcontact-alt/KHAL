import { describe, expect, it } from "vitest";
import type { PortfolioProjectCard } from "../lib/portfolio/models";
import {
  buildCemeteryEntries,
  buildExperimentBoardEntries,
  buildPortfolioSummary,
  buildShippingRadarEntries,
  filterPortfolioProjects,
  sortPortfolioProjects
} from "../lib/portfolio/view-model";

function project(partial: Partial<PortfolioProjectCard>): PortfolioProjectCard {
  return {
    id: partial.id ?? "project-1",
    slug: partial.slug ?? "project-1",
    name: partial.name ?? "Project 1",
    strategicRole: partial.strategicRole ?? "probe",
    stage: partial.stage ?? "idea",
    signalBand: partial.signalBand ?? "watch",
    isActive: partial.isActive ?? true,
    createdAt: partial.createdAt ?? "2026-03-09T00:00:00.000Z",
    updatedAt: partial.updatedAt ?? "2026-03-09T00:00:00.000Z",
    shipCount: partial.shipCount ?? 0,
    evidenceCount: partial.evidenceCount ?? 0,
    experimentCount: partial.experimentCount ?? 0,
    movementState: partial.movementState ?? "quiet",
    ...partial
  };
}

describe("portfolio view model", () => {
  it("builds summary, radar, and cemetery from project cards", () => {
    const projects = [
      project({
        id: "core-1",
        slug: "core-1",
        name: "Core One",
        strategicRole: "core",
        stage: "shipping",
        signalBand: "high",
        movementState: "shipping",
        latestShip: {
          id: "ship-1",
          projectId: "core-1",
          title: "Core ship",
          type: "code",
          shippedAt: "2026-03-09",
          createdAt: "2026-03-09",
          updatedAt: "2026-03-09"
        },
        activeExperiment: {
          id: "exp-1",
          projectId: "core-1",
          title: "Core experiment",
          hypothesis: "Core hypothesis",
          status: "active",
          createdAt: "2026-03-09",
          updatedAt: "2026-03-09"
        },
        nextGate: {
          id: "gate-1",
          projectId: "core-1",
          title: "Core gate",
          gateType: "continue",
          criteria: "Continue",
          status: "open",
          createdAt: "2026-03-09",
          updatedAt: "2026-03-09"
        }
      }),
      project({
        id: "stalled-1",
        slug: "stalled-1",
        name: "Stalled One",
        strategicRole: "option",
        stage: "stalled",
        signalBand: "watch",
        movementState: "stalled"
      }),
      project({
        id: "archive-1",
        slug: "archive-1",
        name: "Archive One",
        strategicRole: "archive",
        stage: "archived",
        signalBand: "low",
        isActive: false,
        notes: "Archived after weak signal.",
        latestEvidence: {
          id: "evidence-1",
          projectId: "archive-1",
          title: "Lesson",
          type: "decision",
          summary: "Market wedge was too weak.",
          impact: "Kill weak wedges early.",
          recordedAt: "2026-03-01",
          createdAt: "2026-03-01",
          updatedAt: "2026-03-01"
        }
      })
    ];

    const summary = buildPortfolioSummary(projects);
    expect(summary.totalProjects).toBe(3);
    expect(summary.activeProjects).toBe(2);
    expect(summary.shippingProjects).toBe(1);
    expect(summary.stalledProjects).toBe(1);
    expect(summary.archivedOrKilledProjects).toBe(1);

    const filtered = filterPortfolioProjects({ projects, role: "all", stage: "all", activeOnly: true });
    expect(filtered).toHaveLength(2);
    expect(sortPortfolioProjects(filtered, "attention")[0].id).toBe("core-1");
    expect(buildShippingRadarEntries(projects)).toHaveLength(1);
    expect(buildExperimentBoardEntries(projects)).toHaveLength(1);
    expect(buildCemeteryEntries(projects)[0].lesson).toBe("Kill weak wedges early.");
  });
});
