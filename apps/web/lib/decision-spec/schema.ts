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

export const decisionEvaluationResultSchema = z.object({
  mode: warGameModeSchema,
  targetId: z.string(),
  blocked: z.boolean(),
  readinessScore: z.number().min(0).max(100),
  missingRequiredFields: z.array(z.string()),
  blockReasons: z.array(decisionBlockReasonSchema),
  stages: z.array(pipelineStageStatusSchema),
  nextStage: z.string().optional()
});

export const doctrineQuickActionKindSchema = z.enum([
  "SET_INTEREST_MAX_LOSS_DEFAULT",
  "SET_INTEREST_EXPIRY_DEFAULT_30D",
  "ADD_INTEREST_KILL_CRITERIA_TEMPLATE",
  "SET_INTEREST_BARBELL_90_10",
  "SET_AFFAIR_THRESHOLD_TEMPLATE",
  "SET_AFFAIR_PREP_TEMPLATE",
  "SET_DOMAIN_BIMODAL_POSTURE_TEMPLATE",
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
  generatedAtIso: z.string()
});

export type WarGameModeSpec = z.infer<typeof warGameModeSchema>;
export type DecisionSpecDto = z.infer<typeof decisionSpecSchema>;
export type DecisionModeSpecDto = z.infer<typeof decisionModeSpecSchema>;
export type DecisionGuardDto = z.infer<typeof decisionGuardSchema>;
export type DecisionBlockReasonDto = z.infer<typeof decisionBlockReasonSchema>;
export type PipelineStageStatusDto = z.infer<typeof pipelineStageStatusSchema>;
export type DecisionEvaluationResultDto = z.infer<typeof decisionEvaluationResultSchema>;
export type DoctrineQuickActionKindDto = z.infer<typeof doctrineQuickActionKindSchema>;
export type DoctrineQuickActionDto = z.infer<typeof doctrineQuickActionSchema>;
export type TriageSuggestionDto = z.infer<typeof triageSuggestionSchema>;
export type TriageEvaluationSnapshotDto = z.infer<typeof triageEvaluationSnapshotSchema>;
