import { z } from "zod";

export const knowledgeEntityTypeSchema = z.enum([
  "craft",
  "stack",
  "protocol",
  "rule",
  "heuristic",
  "wargame",
  "scenario",
  "threat",
  "response",
  "link"
]);

export const craftKnowledgeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional()
});

export const stackSchema = z.object({
  id: z.string().uuid().optional(),
  craftId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().int().optional()
});

export const protocolSchema = z.object({
  id: z.string().uuid().optional(),
  craftId: z.string().min(1),
  stackId: z.string().optional().nullable(),
  name: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().int().optional()
});

export const ruleSchema = z.object({
  id: z.string().uuid().optional(),
  craftId: z.string().min(1),
  protocolId: z.string().optional().nullable(),
  statement: z.string().min(1),
  rationale: z.string().optional(),
  sortOrder: z.number().int().optional()
});

export const heuristicSchema = z.object({
  id: z.string().uuid().optional(),
  craftId: z.string().min(1),
  protocolId: z.string().optional().nullable(),
  ruleId: z.string().optional().nullable(),
  statement: z.string().min(1),
  explanation: z.string().optional(),
  sortOrder: z.number().int().optional()
});

export const wargameSchema = z.object({
  id: z.string().uuid().optional(),
  craftId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  objective: z.string().optional()
});

export const scenarioSchema = z.object({
  id: z.string().uuid().optional(),
  wargameId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().int().optional()
});

export const threatSchema = z.object({
  id: z.string().uuid().optional(),
  scenarioId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  severity: z.number().min(1).max(10).optional()
});

export const responseSchema = z.object({
  id: z.string().uuid().optional(),
  threatId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  responseType: z.string().optional()
});

export const entityLinkSchema = z.object({
  id: z.string().uuid().optional(),
  sourceType: knowledgeEntityTypeSchema.exclude(["craft", "link"]),
  sourceId: z.string().min(1),
  targetType: knowledgeEntityTypeSchema.exclude(["craft", "link"]),
  targetId: z.string().min(1),
  linkType: z.string().min(1).optional(),
  notes: z.string().optional(),
  sortOrder: z.number().int().optional()
});
