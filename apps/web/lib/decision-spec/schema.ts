import { z } from "zod";

export const secondBrainProviderSchema = z.enum(["OBSIDIAN", "NOTION"]);

export const decisionGuardSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  hard: z.boolean().default(true)
});

export const warGameModeSchema = z.enum(["source", "domain", "affair", "interest", "craft", "lineage", "mission"]);

export const decisionModeSpecSchema = z.object({
  mode: warGameModeSchema,
  title: z.string(),
  narrative: z.string(),
  requiredFields: z.array(z.string()),
  predecessors: z.array(warGameModeSchema)
});

export const decisionSpecSchema = z.object({
  version: z.string(),
  pipelineStages: z.array(z.string()),
  guards: z.array(decisionGuardSchema),
  modes: z.array(decisionModeSpecSchema)
});

export const decisionBlockReasonSchema = z.object({
  code: z.string(),
  message: z.string(),
  guardId: z.string().optional(),
  missingItems: z.array(z.string()).default([]),
  overridable: z.boolean().default(false)
});

export const pipelineStageStatusSchema = z.object({
  id: z.string(),
  passed: z.boolean(),
  message: z.string(),
  missingItems: z.array(z.string()).default([])
});

export const lineagePolicyBandSchema = z.enum(["LOCAL", "ELEVATED", "SYSTEMIC", "CIVILIZATIONAL", "EXISTENTIAL"]);

export const lineageRequiredPostureSchema = z.enum(["OBSERVE", "CAP_DOWNSIDE", "HEDGE", "NO_RUIN"]);

export const stateOfArtStepSchema = z.enum(["map", "stone", "ends", "means"]);

export const stateOfArtStageStatusSchema = z.object({
  id: stateOfArtStepSchema,
  complete: z.boolean(),
  message: z.string()
});

export const stateOfArtAssessmentSchema = z.object({
  dominantQuadrant: z.string().optional(),
  recommendedPosture: z.string(),
  lineageAtThreat: z.string().optional(),
  requiredEnds: z.array(z.string()).default([]),
  admissibleMeans: z.array(z.string()).default([]),
  stages: z.array(stateOfArtStageStatusSchema)
});

export const lineagePressureSummarySchema = z.object({
  maxLevel: z.string(),
  maxLevelWeight: z.number().min(0),
  openRiskCount: z.number().int().min(0),
  stakeSignal: z.number().min(0),
  riskSignal: z.number().min(0),
  dependencyWeight: z.number().min(0),
  irreversibilityWeight: z.number().min(0),
  policyBand: lineagePolicyBandSchema,
  requiredPosture: lineageRequiredPostureSchema,
  weightedExposure: z.number().min(0),
  weightedFragility: z.number().min(0),
  highestRiskTitle: z.string().optional(),
  hedgeRequired: z.boolean().default(false)
});

export const decisionEvaluationResultSchema = z.object({
  mode: warGameModeSchema,
  targetId: z.string(),
  blocked: z.boolean(),
  readinessScore: z.number().min(0).max(100),
  missingRequiredFields: z.array(z.string()),
  blockReasons: z.array(decisionBlockReasonSchema),
  stages: z.array(pipelineStageStatusSchema),
  nextStage: z.string().optional(),
  lineagePressure: lineagePressureSummarySchema.optional(),
  stateOfArt: stateOfArtAssessmentSchema.optional()
});

export const doctrineQuickActionKindSchema = z.enum([
  "SET_INTEREST_MAX_LOSS_DEFAULT",
  "SET_INTEREST_EXPIRY_DEFAULT_30D",
  "ADD_INTEREST_KILL_CRITERIA_TEMPLATE",
  "SET_INTEREST_BARBELL_90_10",
  "SET_AFFAIR_THRESHOLD_TEMPLATE",
  "SET_AFFAIR_PREP_TEMPLATE",
  "SET_DOMAIN_BIMODAL_POSTURE_TEMPLATE",
  "OPEN_SOURCE_DOCTRINE_CHAIN_PLAYBOOK",
  "OPEN_SOURCE_SCENARIO_PLAYBOOK",
  "OPEN_SOURCE_THREAT_PLAYBOOK",
  "OPEN_SOURCE_RESPONSE_PLAYBOOK",
  "TRIPWIRE_RECOVERY_PATH"
]);

export const doctrineQuickActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: doctrineQuickActionKindSchema,
  targetRef: z.object({
    mode: warGameModeSchema,
    targetId: z.string()
  }),
  payload: z.record(z.unknown()).default({}),
  guardIds: z.array(z.string()).default([])
});

export const triageSuggestionSchema = z.object({
  id: z.string(),
  mode: warGameModeSchema,
  targetId: z.string(),
  title: z.string(),
  reason: z.string(),
  priority: z.number().int().min(0).max(100),
  missingItems: z.array(z.string()).default([]),
  actionKind: doctrineQuickActionKindSchema.optional(),
  actionPayload: z.record(z.unknown()).optional(),
  expectedReadinessDelta: z.number().int().min(-100).max(100).default(0)
});

export const triageEvaluationSnapshotSchema = z.object({
  mode: warGameModeSchema,
  targetId: z.string(),
  blocked: z.boolean(),
  readinessScore: z.number().min(0).max(100),
  nextAction: z.string(),
  suggestions: z.array(triageSuggestionSchema),
  generatedAtIso: z.string(),
  lineagePressure: lineagePressureSummarySchema.optional(),
  stateOfArt: stateOfArtAssessmentSchema.optional()
});

export type WarGameModeSpec = z.infer<typeof warGameModeSchema>;
export type DecisionSpecDto = z.infer<typeof decisionSpecSchema>;
export type DecisionModeSpecDto = z.infer<typeof decisionModeSpecSchema>;
export type DecisionGuardDto = z.infer<typeof decisionGuardSchema>;
export type DecisionBlockReasonDto = z.infer<typeof decisionBlockReasonSchema>;
export type PipelineStageStatusDto = z.infer<typeof pipelineStageStatusSchema>;
export type LineagePressureSummaryDto = z.infer<typeof lineagePressureSummarySchema>;
export type StateOfArtStageStatusDto = z.infer<typeof stateOfArtStageStatusSchema>;
export type StateOfArtAssessmentDto = z.infer<typeof stateOfArtAssessmentSchema>;
export type DecisionEvaluationResultDto = z.infer<typeof decisionEvaluationResultSchema>;
export type DoctrineQuickActionKindDto = z.infer<typeof doctrineQuickActionKindSchema>;
export type DoctrineQuickActionDto = z.infer<typeof doctrineQuickActionSchema>;
export type TriageSuggestionDto = z.infer<typeof triageSuggestionSchema>;
export type TriageEvaluationSnapshotDto = z.infer<typeof triageEvaluationSnapshotSchema>;
