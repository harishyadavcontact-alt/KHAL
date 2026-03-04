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

export type WarGameModeSpec = z.infer<typeof warGameModeSchema>;
export type DecisionSpecDto = z.infer<typeof decisionSpecSchema>;
export type DecisionModeSpecDto = z.infer<typeof decisionModeSpecSchema>;
export type DecisionGuardDto = z.infer<typeof decisionGuardSchema>;
export type DecisionBlockReasonDto = z.infer<typeof decisionBlockReasonSchema>;
export type PipelineStageStatusDto = z.infer<typeof pipelineStageStatusSchema>;
export type DecisionEvaluationResultDto = z.infer<typeof decisionEvaluationResultSchema>;
