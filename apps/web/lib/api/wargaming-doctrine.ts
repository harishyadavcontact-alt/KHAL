import type Database from "better-sqlite3";
import type { WarGameDoctrineChain, WarGameScenarioWithThreats, WarGameThreatWithResponses } from "../war-room/bootstrap";

type AnyRow = Record<string, unknown>;

function asString(value: unknown): string {
  return value == null ? "" : String(value);
}

export function loadWarGameDoctrineChains(db: Database.Database): WarGameDoctrineChain[] {
  const crafts = db.prepare("SELECT id, name FROM crafts ORDER BY name").all() as AnyRow[];
  const wargames = db
    .prepare("SELECT id, craft_id, name, description, objective, created_at FROM knowledge_wargames ORDER BY created_at, name")
    .all() as AnyRow[];
  const scenarios = db
    .prepare("SELECT id, wargame_id, name, description, sort_order FROM knowledge_scenarios ORDER BY sort_order, created_at")
    .all() as AnyRow[];
  const threats = db
    .prepare("SELECT id, scenario_id, name, description, severity FROM knowledge_threats ORDER BY severity DESC, created_at")
    .all() as AnyRow[];
  const responses = db
    .prepare("SELECT id, threat_id, name, description, response_type FROM knowledge_responses ORDER BY created_at")
    .all() as AnyRow[];

  const craftNameById = new Map(crafts.map((row) => [asString(row.id), asString(row.name)]));
  const responsesByThreatId = new Map<string, WarGameThreatWithResponses["responses"]>();
  for (const row of responses) {
    const threatId = asString(row.threat_id);
    const list = responsesByThreatId.get(threatId) ?? [];
    list.push({
      id: asString(row.id),
      threatId,
      name: asString(row.name),
      description: row.description ? asString(row.description) : undefined,
      responseType: row.response_type ? asString(row.response_type) : undefined
    });
    responsesByThreatId.set(threatId, list);
  }

  const threatsByScenarioId = new Map<string, WarGameScenarioWithThreats["threats"]>();
  for (const row of threats) {
    const scenarioId = asString(row.scenario_id);
    const list = threatsByScenarioId.get(scenarioId) ?? [];
    list.push({
      id: asString(row.id),
      scenarioId,
      name: asString(row.name),
      description: row.description ? asString(row.description) : undefined,
      severity: typeof row.severity === "number" ? row.severity : Number(row.severity ?? 5),
      responses: responsesByThreatId.get(asString(row.id)) ?? []
    });
    threatsByScenarioId.set(scenarioId, list);
  }

  const scenariosByWargameId = new Map<string, WarGameDoctrineChain["scenarios"]>();
  for (const row of scenarios) {
    const wargameId = asString(row.wargame_id);
    const list = scenariosByWargameId.get(wargameId) ?? [];
    list.push({
      id: asString(row.id),
      wargameId,
      name: asString(row.name),
      description: row.description ? asString(row.description) : undefined,
      sortOrder: typeof row.sort_order === "number" ? row.sort_order : Number(row.sort_order ?? 0),
      threats: threatsByScenarioId.get(asString(row.id)) ?? []
    });
    scenariosByWargameId.set(wargameId, list);
  }

  return wargames.map((row) => ({
    id: asString(row.id),
    craftId: asString(row.craft_id),
    craftName: craftNameById.get(asString(row.craft_id)) ?? "Unknown craft",
    name: asString(row.name),
    description: row.description ? asString(row.description) : undefined,
    objective: row.objective ? asString(row.objective) : undefined,
    scenarios: scenariosByWargameId.get(asString(row.id)) ?? []
  }));
}
