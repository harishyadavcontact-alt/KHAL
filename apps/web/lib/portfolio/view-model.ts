import type {
  PortfolioCemeteryEntry,
  PortfolioExperimentBoardEntry,
  PortfolioMovementState,
  PortfolioProjectCard,
  PortfolioShippingRadarEntry,
  PortfolioWarRoomSummary
} from "./models";

export type PortfolioSortKey = "attention" | "signal" | "ship" | "name";

export function movementStateForProject(project: Pick<PortfolioProjectCard, "stage" | "latestShip" | "activeExperiment">): PortfolioMovementState {
  if (project.stage === "stalled") return "stalled";
  if (project.stage === "shipping" || project.latestShip) return "shipping";
  if (project.activeExperiment) return "watch";
  return "quiet";
}

export function buildPortfolioSummary(projects: PortfolioProjectCard[]): PortfolioWarRoomSummary {
  const totalProjects = projects.length;
  const activeProjects = projects.filter((project) => project.isActive).length;
  const shippingProjects = projects.filter((project) => project.stage === "shipping" || project.movementState === "shipping").length;
  const stalledProjects = projects.filter((project) => project.stage === "stalled").length;
  const archivedOrKilledProjects = projects.filter((project) => project.strategicRole === "archive" || project.strategicRole === "killed" || project.stage === "archived").length;
  const activeCoreCount = projects.filter((project) => project.isActive && project.strategicRole === "core").length;
  const optionLikeCount = projects.filter((project) => project.isActive && (project.strategicRole === "option" || project.strategicRole === "probe")).length;
  const signalBands = ["high", "watch", "low"].map((band) => ({
    label: band,
    count: projects.filter((project) => project.signalBand === band).length
  }));
  const latestShip = projects
    .map((project) => project.latestShip?.shippedAt)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.localeCompare(left))[0];

  return {
    totalProjects,
    activeProjects,
    shippingProjects,
    stalledProjects,
    archivedOrKilledProjects,
    activeCoreCount,
    optionLikeCount,
    signalBands,
    lastShipAt: latestShip
  };
}

export function filterPortfolioProjects(args: {
  projects: PortfolioProjectCard[];
  role: string;
  stage: string;
  activeOnly: boolean;
  cemeteryMode?: boolean;
}) {
  return args.projects.filter((project) => {
    if (args.activeOnly && !project.isActive) return false;
    if (args.role !== "all" && project.strategicRole !== args.role) return false;
    if (args.stage !== "all" && project.stage !== args.stage) return false;
    if (args.cemeteryMode) {
      return project.strategicRole === "archive" || project.strategicRole === "killed" || project.stage === "archived";
    }
    return true;
  });
}

export function sortPortfolioProjects(projects: PortfolioProjectCard[], sortKey: PortfolioSortKey) {
  const copy = [...projects];
  copy.sort((left, right) => {
    if (sortKey === "name") return left.name.localeCompare(right.name);
    if (sortKey === "signal") {
      const rank = (value: PortfolioProjectCard["signalBand"]) => (value === "high" ? 2 : value === "watch" ? 1 : 0);
      return rank(right.signalBand) - rank(left.signalBand) || right.updatedAt.localeCompare(left.updatedAt);
    }
    if (sortKey === "ship") {
      return String(right.latestShip?.shippedAt ?? "").localeCompare(String(left.latestShip?.shippedAt ?? ""));
    }

    const attentionScore = (project: PortfolioProjectCard) => {
      let score = 0;
      if (project.strategicRole === "core") score += 40;
      if (project.strategicRole === "option") score += 24;
      if (project.strategicRole === "probe") score += 18;
      if (project.stage === "stalled") score += 16;
      if (project.stage === "shipping") score += 14;
      if (project.movementState === "shipping") score += 10;
      if (project.currentBottleneck) score += 8;
      if (project.nextGate?.status === "open" || project.nextGate?.status === "watch") score += 6;
      if (project.signalBand === "high") score += 5;
      if (!project.isActive) score -= 25;
      return score;
    };

    return attentionScore(right) - attentionScore(left) || right.updatedAt.localeCompare(left.updatedAt);
  });
  return copy;
}

export function buildShippingRadarEntries(projects: PortfolioProjectCard[]): PortfolioShippingRadarEntry[] {
  return projects
    .filter((project) => project.latestShip)
    .map((project) => ({
      ...project.latestShip!,
      projectSlug: project.slug,
      projectName: project.name,
      strategicRole: project.strategicRole,
      stage: project.stage
    }))
    .sort((left, right) => right.shippedAt.localeCompare(left.shippedAt));
}

export function buildExperimentBoardEntries(projects: PortfolioProjectCard[]): PortfolioExperimentBoardEntry[] {
  return projects
    .filter((project) => project.activeExperiment)
    .map((project) => ({
      ...project.activeExperiment!,
      projectSlug: project.slug,
      projectName: project.name,
      strategicRole: project.strategicRole,
      signalBand: project.signalBand,
      nextGate: project.nextGate
        ? {
            id: project.nextGate.id,
            title: project.nextGate.title,
            status: project.nextGate.status,
            gateType: project.nextGate.gateType,
            dueAt: project.nextGate.dueAt
          }
        : undefined
    }))
    .sort((left, right) => {
      const leftRank = left.status === "active" ? 2 : left.status === "planned" ? 1 : 0;
      const rightRank = right.status === "active" ? 2 : right.status === "planned" ? 1 : 0;
      return rightRank - leftRank || String(right.startedAt ?? "").localeCompare(String(left.startedAt ?? ""));
    });
}

export function buildCemeteryEntries(projects: PortfolioProjectCard[]): PortfolioCemeteryEntry[] {
  return projects
    .filter((project) => project.strategicRole === "archive" || project.strategicRole === "killed" || project.stage === "archived")
    .map((project) => ({
      project,
      why: project.notes?.trim() || project.killCriteria?.trim() || "No explicit archive rationale recorded yet.",
      lesson: project.latestEvidence?.impact?.trim() || project.latestEvidence?.summary?.trim() || "No explicit lesson recorded yet."
    }))
    .sort((left, right) => right.project.updatedAt.localeCompare(left.project.updatedAt));
}
