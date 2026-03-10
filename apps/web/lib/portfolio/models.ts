import { z } from "zod";
import type {
  PortfolioDecisionGate,
  PortfolioDecisionGateStatus,
  PortfolioDecisionGateType,
  PortfolioEvidence,
  PortfolioEvidenceType,
  PortfolioExperiment,
  PortfolioExperimentStatus,
  PortfolioProject,
  PortfolioRepoAdapter,
  PortfolioSignalBand,
  PortfolioShipLog,
  PortfolioShipType
} from "@khal/domain";

export const portfolioStrategicRoleSchema = z.enum(["core", "option", "probe", "archive", "killed"]);
export const portfolioStageSchema = z.enum(["idea", "framing", "build", "shipping", "traction", "stalled", "archived"]);
export const portfolioSignalBandSchema = z.enum(["low", "watch", "high"]);
export const portfolioShipTypeSchema = z.enum(["code", "spec", "doc", "design", "release", "research", "prompt"]);
export const portfolioEvidenceTypeSchema = z.enum(["user-signal", "metric", "observation", "decision", "market", "technical"]);
export const portfolioDecisionGateTypeSchema = z.enum(["continue", "scale", "pause", "archive", "kill"]);
export const portfolioDecisionGateStatusSchema = z.enum(["open", "watch", "cleared", "triggered"]);
export const portfolioExperimentStatusSchema = z.enum(["planned", "active", "paused", "complete", "killed"]);
export const portfolioRepoAdapterKindSchema = z.enum(["manual", "meta_json"]);

export const portfolioProjectCreateSchema = z.object({
  slug: z.string().trim().min(1).max(120).optional(),
  name: z.string().trim().min(1).max(160),
  tagline: z.string().trim().max(240).optional(),
  strategicRole: portfolioStrategicRoleSchema.default("probe"),
  stage: portfolioStageSchema.default("idea"),
  mission: z.string().trim().max(2000).optional(),
  wedge: z.string().trim().max(1200).optional(),
  rightTail: z.string().trim().max(1200).optional(),
  leftTail: z.string().trim().max(1200).optional(),
  currentExperiment: z.string().trim().max(600).optional(),
  successMetric: z.string().trim().max(600).optional(),
  killCriteria: z.string().trim().max(1200).optional(),
  nextMilestone: z.string().trim().max(600).optional(),
  currentBottleneck: z.string().trim().max(600).optional(),
  signalBand: portfolioSignalBandSchema.default("watch"),
  repoUrl: z.string().trim().url().optional().or(z.literal("")),
  repoName: z.string().trim().max(160).optional(),
  defaultBranch: z.string().trim().max(80).optional(),
  lastReviewedAt: z.string().trim().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().trim().max(2400).optional(),
  linkedInterestId: z.string().trim().optional(),
  adapterSourcePath: z.string().trim().max(400).optional()
});

export const portfolioProjectPatchSchema = portfolioProjectCreateSchema.partial();

export const portfolioShipLogSchema = z.object({
  title: z.string().trim().min(1).max(180),
  type: portfolioShipTypeSchema.default("code"),
  summary: z.string().trim().max(1200).optional(),
  sourceLabel: z.string().trim().max(160).optional(),
  sourceUrl: z.string().trim().url().optional().or(z.literal("")),
  shippedAt: z.string().trim().min(1)
});

export const portfolioEvidenceSchema = z.object({
  title: z.string().trim().min(1).max(180),
  type: portfolioEvidenceTypeSchema.default("observation"),
  summary: z.string().trim().min(1).max(1200),
  impact: z.string().trim().max(800).optional(),
  recordedAt: z.string().trim().min(1)
});

export const portfolioDecisionGateSchema = z.object({
  title: z.string().trim().min(1).max(180),
  gateType: portfolioDecisionGateTypeSchema.default("continue"),
  criteria: z.string().trim().min(1).max(1200),
  status: portfolioDecisionGateStatusSchema.default("open"),
  dueAt: z.string().trim().optional()
});

export const portfolioExperimentSchema = z.object({
  title: z.string().trim().min(1).max(180),
  hypothesis: z.string().trim().min(1).max(1200),
  expectedLearning: z.string().trim().max(800).optional(),
  status: portfolioExperimentStatusSchema.default("planned"),
  startedAt: z.string().trim().optional(),
  completedAt: z.string().trim().optional(),
  resultSummary: z.string().trim().max(1200).optional()
});

export type PortfolioProjectCreateInput = z.infer<typeof portfolioProjectCreateSchema>;
export type PortfolioProjectPatchInput = z.infer<typeof portfolioProjectPatchSchema>;
export type PortfolioShipLogInput = z.infer<typeof portfolioShipLogSchema>;
export type PortfolioEvidenceInput = z.infer<typeof portfolioEvidenceSchema>;
export type PortfolioDecisionGateInput = z.infer<typeof portfolioDecisionGateSchema>;
export type PortfolioExperimentInput = z.infer<typeof portfolioExperimentSchema>;

export type PortfolioInterestOption = {
  id: string;
  title: string;
  domainId?: string;
  domainName?: string;
  sourceName?: string;
  quadrant?: string;
  edgeText?: string;
  heuristicsText?: string;
  avoidText?: string;
  hypothesis?: string;
  downside?: string;
  protocolReady?: boolean;
};

export type PortfolioMovementState = "shipping" | "watch" | "stalled" | "quiet";

export type PortfolioProjectCard = PortfolioProject & {
  linkedInterest?: PortfolioInterestOption;
  latestShip?: PortfolioShipLog;
  activeExperiment?: PortfolioExperiment;
  nextGate?: PortfolioDecisionGate;
  latestEvidence?: PortfolioEvidence;
  adapter?: PortfolioRepoAdapter;
  shipCount: number;
  evidenceCount: number;
  experimentCount: number;
  movementState: PortfolioMovementState;
};

export type PortfolioSummaryBand = {
  label: string;
  count: number;
};

export type PortfolioWarRoomSummary = {
  totalProjects: number;
  activeProjects: number;
  shippingProjects: number;
  stalledProjects: number;
  archivedOrKilledProjects: number;
  activeCoreCount: number;
  optionLikeCount: number;
  signalBands: PortfolioSummaryBand[];
  lastShipAt?: string;
};

export type PortfolioShippingRadarEntry = PortfolioShipLog & {
  projectSlug: string;
  projectName: string;
  strategicRole: PortfolioProject["strategicRole"];
  stage: PortfolioProject["stage"];
};

export type PortfolioExperimentBoardEntry = PortfolioExperiment & {
  projectSlug: string;
  projectName: string;
  strategicRole: PortfolioProject["strategicRole"];
  signalBand: PortfolioSignalBand;
  nextGate?: Pick<PortfolioDecisionGate, "id" | "title" | "status" | "gateType" | "dueAt">;
};

export type PortfolioCemeteryEntry = {
  project: PortfolioProjectCard;
  why: string;
  lesson: string;
};

export type PortfolioWarRoomSnapshot = {
  summary: PortfolioWarRoomSummary;
  projects: PortfolioProjectCard[];
  shippingRadar: PortfolioShippingRadarEntry[];
  experimentBoard: PortfolioExperimentBoardEntry[];
  cemetery: PortfolioCemeteryEntry[];
  interestOptions: PortfolioInterestOption[];
  runtimeInvariants: {
    hardViolationCount: number;
    softViolationCount: number;
    projectionHealthy: boolean;
  };
};

export type PortfolioProjectDetailSnapshot = {
  project: PortfolioProjectCard;
  shipLogs: PortfolioShipLog[];
  evidence: PortfolioEvidence[];
  experiments: PortfolioExperiment[];
  decisionGates: PortfolioDecisionGate[];
  interestOptions: PortfolioInterestOption[];
  runtimeInvariants: {
    hardViolationCount: number;
    softViolationCount: number;
    projectionHealthy: boolean;
  };
};

export function isPortfolioSignalBand(value: string): value is PortfolioSignalBand {
  return portfolioSignalBandSchema.safeParse(value).success;
}

export function isPortfolioShipType(value: string): value is PortfolioShipType {
  return portfolioShipTypeSchema.safeParse(value).success;
}

export function isPortfolioEvidenceType(value: string): value is PortfolioEvidenceType {
  return portfolioEvidenceTypeSchema.safeParse(value).success;
}

export function isPortfolioDecisionGateType(value: string): value is PortfolioDecisionGateType {
  return portfolioDecisionGateTypeSchema.safeParse(value).success;
}

export function isPortfolioDecisionGateStatus(value: string): value is PortfolioDecisionGateStatus {
  return portfolioDecisionGateStatusSchema.safeParse(value).success;
}

export function isPortfolioExperimentStatus(value: string): value is PortfolioExperimentStatus {
  return portfolioExperimentStatusSchema.safeParse(value).success;
}
