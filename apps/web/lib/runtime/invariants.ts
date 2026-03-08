import Database from "better-sqlite3";
import type { KhalState, InvariantFinding } from "@khal/domain";
import {
  listAffairs,
  listDomains,
  listDraftLinkedPromotions,
  listInterests,
  listKnowledgeCrafts,
  listKnowledgeHeuristics,
  listKnowledgeProtocols,
  listKnowledgeResponses,
  listKnowledgeRules,
  listKnowledgeScenarios,
  listKnowledgeStacks,
  listKnowledgeThreats,
  listKnowledgeWargames,
  listLineageEntities,
  listLineageNodes,
  listTasks
} from "./queries";

type InvariantEntityType = InvariantFinding["entityRef"]["type"];

export interface RuntimeInvariantReport {
  generatedAt: string;
  hardViolations: InvariantFinding[];
  softViolations: InvariantFinding[];
  summary: {
    hardViolationCount: number;
    softViolationCount: number;
    projectionHealthy: boolean;
  };
}

function finding(args: {
  severity: InvariantFinding["severity"];
  code: string;
  message: string;
  entityType: InvariantEntityType;
  entityId: string;
  repairHint: string;
  parentType?: InvariantEntityType;
  parentId?: string;
}): InvariantFinding {
  return {
    severity: args.severity,
    code: args.code,
    message: args.message,
    entityRef: {
      type: args.entityType,
      id: args.entityId,
      parentType: args.parentType,
      parentId: args.parentId
    },
    repairHint: args.repairHint
  };
}

export function evaluateRuntimeInvariants(args: { dbPath?: string; db?: Database.Database; state?: KhalState }): RuntimeInvariantReport {
  const ownsDb = !args.db;
  const db = args.db ?? new Database(String(args.dbPath));

  try {
    const domains = listDomains(db);
    const affairs = listAffairs(db);
    const interests = listInterests(db);
    const tasks = listTasks(db);
    const lineageNodes = listLineageNodes(db);
    const lineageEntities = listLineageEntities(db);
    const crafts = listKnowledgeCrafts(db);
    const stacks = listKnowledgeStacks(db);
    const protocols = listKnowledgeProtocols(db);
    const rules = listKnowledgeRules(db);
    const heuristics = listKnowledgeHeuristics(db);
    const wargames = listKnowledgeWargames(db);
    const scenarios = listKnowledgeScenarios(db);
    const threats = listKnowledgeThreats(db);
    const responses = listKnowledgeResponses(db);
    const draftPromotionsWithoutLanding = listDraftLinkedPromotions(db);

    const hardViolations: InvariantFinding[] = [];
    const softViolations: InvariantFinding[] = [];

    const domainIds = new Set(domains.map((row) => String(row.id)));
    const lineageNodeIds = new Set(lineageNodes.map((row) => String(row.id)));
    const craftIds = new Set(crafts.map((row) => String(row.id)));
    const stackIds = new Set(stacks.map((row) => String(row.id)));
    const protocolIds = new Set(protocols.map((row) => String(row.id)));
    const ruleIds = new Set(rules.map((row) => String(row.id)));
    const wargameIds = new Set(wargames.map((row) => String(row.id)));
    const scenarioIds = new Set(scenarios.map((row) => String(row.id)));
    const threatIds = new Set(threats.map((row) => String(row.id)));

    for (const affair of affairs) {
      const domainId = String(affair.domain_id ?? "");
      if (!domainIds.has(domainId)) {
        hardViolations.push(
          finding({
            severity: "hard",
            code: "AFFAIR_MISSING_DOMAIN",
            message: "Affair does not point to a valid domain.",
            entityType: "affair",
            entityId: String(affair.id),
            parentType: "domain",
            parentId: domainId || undefined,
            repairHint: "Reconnect the affair to a canonical domain before execution."
          })
        );
      }
    }

    for (const interest of interests) {
      const domainId = String(interest.domain_id ?? "");
      if (!domainIds.has(domainId)) {
        hardViolations.push(
          finding({
            severity: "hard",
            code: "INTEREST_MISSING_DOMAIN",
            message: "Interest does not point to a valid domain.",
            entityType: "interest",
            entityId: String(interest.id),
            parentType: "domain",
            parentId: domainId || undefined,
            repairHint: "Reconnect the interest to a canonical domain before treating it as optionality."
          })
        );
      }
    }

    for (const entity of lineageEntities) {
      const parentId = String(entity.lineage_node_id ?? "");
      if (!lineageNodeIds.has(parentId)) {
        hardViolations.push(
          finding({
            severity: "hard",
            code: "LINEAGE_ENTITY_MISSING_NODE",
            message: "Lineage entity is not attached to a valid lineage node.",
            entityType: "lineage_entity",
            entityId: String(entity.id),
            parentType: "lineage_node",
            parentId: parentId || undefined,
            repairHint: "Attach the lineage entity to a lineage node before using it in lineage risk logic."
          })
        );
      }
    }

    for (const stack of stacks) {
      const craftId = String(stack.craft_id ?? "");
      if (!craftIds.has(craftId)) {
        hardViolations.push(
          finding({
            severity: "hard",
            code: "STACK_MISSING_CRAFT",
            message: "Knowledge stack has no valid parent craft.",
            entityType: "stack",
            entityId: String(stack.id),
            parentType: "craft",
            parentId: craftId || undefined,
            repairHint: "Attach the stack to a canonical craft."
          })
        );
      }
    }

    for (const wargame of wargames) {
      const craftId = String(wargame.craft_id ?? "");
      if (!craftIds.has(craftId)) {
        hardViolations.push(
          finding({
            severity: "hard",
            code: "WARGAME_MISSING_CRAFT",
            message: "Wargame has no valid parent craft.",
            entityType: "wargame",
            entityId: String(wargame.id),
            parentType: "craft",
            parentId: craftId || undefined,
            repairHint: "Attach the wargame to a craft before using it in planning flows."
          })
        );
      }
    }

    for (const scenario of scenarios) {
      const parentId = String(scenario.wargame_id ?? "");
      if (!wargameIds.has(parentId)) {
        hardViolations.push(
          finding({
            severity: "hard",
            code: "SCENARIO_MISSING_WARGAME",
            message: "Scenario has no valid parent wargame.",
            entityType: "scenario",
            entityId: String(scenario.id),
            parentType: "wargame",
            parentId: parentId || undefined,
            repairHint: "Attach the scenario to a wargame before using it in War Gaming."
          })
        );
      }
    }

    for (const threat of threats) {
      const parentId = String(threat.scenario_id ?? "");
      if (!scenarioIds.has(parentId)) {
        hardViolations.push(
          finding({
            severity: "hard",
            code: "THREAT_MISSING_SCENARIO",
            message: "Threat has no valid parent scenario.",
            entityType: "threat",
            entityId: String(threat.id),
            parentType: "scenario",
            parentId: parentId || undefined,
            repairHint: "Attach the threat to a scenario before using it in response logic."
          })
        );
      }
    }

    for (const response of responses) {
      const parentId = String(response.threat_id ?? "");
      if (!threatIds.has(parentId)) {
        hardViolations.push(
          finding({
            severity: "hard",
            code: "RESPONSE_MISSING_THREAT",
            message: "Response has no valid parent threat.",
            entityType: "response",
            entityId: String(response.id),
            parentType: "threat",
            parentId: parentId || undefined,
            repairHint: "Attach the response to a threat before using it as a canonical mitigation."
          })
        );
      }
    }

    for (const protocol of protocols) {
      const craftId = String(protocol.craft_id ?? "");
      const stackId = protocol.stack_id ? String(protocol.stack_id) : undefined;
      if (!craftIds.has(craftId)) {
        hardViolations.push(
          finding({
            severity: "hard",
            code: "PROTOCOL_MISSING_CRAFT",
            message: "Protocol has no valid craft.",
            entityType: "protocol",
            entityId: String(protocol.id),
            parentType: "craft",
            parentId: craftId || undefined,
            repairHint: "Attach the protocol to a craft."
          })
        );
      } else if (stackId && !stackIds.has(stackId)) {
        softViolations.push(
          finding({
            severity: "soft",
            code: "PROTOCOL_STACK_HINT_MISSING",
            message: "Protocol references a stack that no longer exists.",
            entityType: "protocol",
            entityId: String(protocol.id),
            parentType: "stack",
            parentId: stackId,
            repairHint: "Reconnect the protocol to a live stack or clear the stale stack hint."
          })
        );
      }
    }

    for (const rule of rules) {
      const craftId = String(rule.craft_id ?? "");
      if (!craftIds.has(craftId)) {
        hardViolations.push(
          finding({
            severity: "hard",
            code: "RULE_MISSING_CRAFT",
            message: "Rule has no valid craft.",
            entityType: "rule",
            entityId: String(rule.id),
            parentType: "craft",
            parentId: craftId || undefined,
            repairHint: "Attach the rule to a craft."
          })
        );
      } else if (rule.protocol_id && !protocolIds.has(String(rule.protocol_id))) {
        softViolations.push(
          finding({
            severity: "soft",
            code: "RULE_PROTOCOL_HINT_MISSING",
            message: "Rule points to a protocol that no longer exists.",
            entityType: "rule",
            entityId: String(rule.id),
            parentType: "protocol",
            parentId: String(rule.protocol_id),
            repairHint: "Reconnect the rule to a valid protocol or leave it craft-level only."
          })
        );
      }
    }

    for (const heuristic of heuristics) {
      const craftId = String(heuristic.craft_id ?? "");
      if (!craftIds.has(craftId)) {
        hardViolations.push(
          finding({
            severity: "hard",
            code: "HEURISTIC_MISSING_CRAFT",
            message: "Heuristic has no valid craft.",
            entityType: "heuristic",
            entityId: String(heuristic.id),
            parentType: "craft",
            parentId: craftId || undefined,
            repairHint: "Attach the heuristic to a craft."
          })
        );
      }
      if (heuristic.protocol_id && !protocolIds.has(String(heuristic.protocol_id))) {
        softViolations.push(
          finding({
            severity: "soft",
            code: "HEURISTIC_PROTOCOL_HINT_MISSING",
            message: "Heuristic points to a missing protocol.",
            entityType: "heuristic",
            entityId: String(heuristic.id),
            parentType: "protocol",
            parentId: String(heuristic.protocol_id),
            repairHint: "Reconnect the heuristic to a protocol or rule that still exists."
          })
        );
      }
      if (heuristic.rule_id && !ruleIds.has(String(heuristic.rule_id))) {
        softViolations.push(
          finding({
            severity: "soft",
            code: "HEURISTIC_RULE_HINT_MISSING",
            message: "Heuristic points to a missing rule.",
            entityType: "heuristic",
            entityId: String(heuristic.id),
            parentType: "rule",
            parentId: String(heuristic.rule_id),
            repairHint: "Reconnect the heuristic to a rule or clear the stale rule hint."
          })
        );
      }
    }

    const protocolCraftIds = new Set(protocols.map((row) => String(row.craft_id)));
    const responseThreatIds = new Set(responses.map((row) => String(row.threat_id)));
    const taskSourceKeys = new Set(tasks.map((row) => `${String(row.source_type)}:${String(row.source_id)}`));

    for (const craft of crafts) {
      const craftId = String(craft.id);
      const heuristicCount = heuristics.filter((row) => String(row.craft_id) === craftId).length;
      if (heuristicCount > 0 && !protocolCraftIds.has(craftId)) {
        softViolations.push(
          finding({
            severity: "soft",
            code: "CRAFT_HEURISTICS_WITHOUT_PROTOCOL",
            message: "Craft has heuristics but no governing protocol.",
            entityType: "craft",
            entityId: craftId,
            repairHint: "Add at least one protocol so the craft has an explicit governing layer."
          })
        );
      }
    }

    for (const threat of threats) {
      const threatId = String(threat.id);
      if (!responseThreatIds.has(threatId)) {
        softViolations.push(
          finding({
            severity: "soft",
            code: "THREAT_WITHOUT_RESPONSE",
            message: "Threat has no linked response.",
            entityType: "threat",
            entityId: threatId,
            repairHint: "Add a response so the threat has a canonical mitigation path."
          })
        );
      }
    }

    for (const interest of interests) {
      const interestId = String(interest.id);
      if (!taskSourceKeys.has(`INTEREST:${interestId}`)) {
        softViolations.push(
          finding({
            severity: "soft",
            code: "INTEREST_WITHOUT_ACTIONABLE_COVERAGE",
            message: "Interest has no actionable execution or protocol bridge.",
            entityType: "interest",
            entityId: interestId,
            repairHint: "Add a task, plan, or protocol bridge before treating the interest as execution-ready."
          })
        );
      }
    }

    for (const promotion of draftPromotionsWithoutLanding) {
      softViolations.push(
        finding({
          severity: "soft",
          code: "PROMOTION_WITHOUT_MAP_LANDING",
          message: "Promoted draft entity has no visible linked landing in the graph.",
          entityType: "draft",
          entityId: String(promotion.id),
          repairHint: "Persist a linked draft entity landing so the promotion is navigable."
        })
      );
    }

    return {
      generatedAt: new Date().toISOString(),
      hardViolations,
      softViolations,
      summary: {
        hardViolationCount: hardViolations.length,
        softViolationCount: softViolations.length,
        projectionHealthy: hardViolations.length === 0
      }
    };
  } finally {
    if (ownsDb) db.close();
  }
}
