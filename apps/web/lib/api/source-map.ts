import { z } from "zod";
import { randomUUID } from "node:crypto";
import { writeAffair, writeInterest } from "@khal/sync-engine";
import type { Status } from "@khal/domain";
import type Database from "better-sqlite3";
import { ok, withDb, type AnyRow } from "./shared";
import { loadWarGameDoctrineChains } from "./wargaming-doctrine";
import { doctrineWarningsForProfile } from "../doctrine/gaps";
import { deriveQuadrant, methodPostureForQuadrant } from "../war-room/source-map";
import type { SourceMapProfileDto } from "../../components/war-room-v2/types";

const sourceMapProfileSchema = z.object({
  domainId: z.string().min(1),
  decisionType: z.enum(["simple", "complex"]).optional(),
  tailClass: z.enum(["thin", "fat", "unknown"]).optional(),
  notes: z.string().optional(),
  stakesText: z.string().optional(),
  risksText: z.string().optional(),
  oddsText: z.string().optional(),
  oddsBand: z.enum(["low", "unclear", "elevated", "high", "intolerable"]).optional(),
  repeatRateText: z.string().optional(),
  baseRateText: z.string().optional(),
  triggerConditionText: z.string().optional(),
  survivalImpact: z.enum(["recoverable", "damaging", "existential"]).optional(),
  playersText: z.string().optional(),
  lineageThreatText: z.string().optional(),
  fragilityPosture: z.string().optional(),
  vulnerabilitiesText: z.string().optional(),
  hedgeText: z.string().optional(),
  edgeText: z.string().optional(),
  primaryCraftId: z.string().optional(),
  heuristicsText: z.string().optional(),
  avoidText: z.string().optional()
});

const sourceMapStateOfAffairsSchema = z.object({
  domainId: z.string().min(1),
  kind: z.enum(["affair", "interest"])
});

function mapSourceMapProfile(row: AnyRow): SourceMapProfileDto {
  return {
    id: String(row.id),
    sourceId: String(row.source_id),
    domainId: String(row.domain_id),
    decisionType: row.decision_type as SourceMapProfileDto["decisionType"],
    tailClass: row.tail_class as SourceMapProfileDto["tailClass"],
    quadrant: row.quadrant as SourceMapProfileDto["quadrant"],
    methodPosture: String(row.method_posture),
    notes: row.notes ? String(row.notes) : undefined,
    stakesText: row.stakes_text ? String(row.stakes_text) : undefined,
    risksText: row.risks_text ? String(row.risks_text) : undefined,
    oddsText: row.odds_text ? String(row.odds_text) : undefined,
    oddsBand: row.odds_band ? row.odds_band as SourceMapProfileDto["oddsBand"] : undefined,
    repeatRateText: row.repeat_rate_text ? String(row.repeat_rate_text) : undefined,
    baseRateText: row.base_rate_text ? String(row.base_rate_text) : undefined,
    triggerConditionText: row.trigger_condition_text ? String(row.trigger_condition_text) : undefined,
    survivalImpact: row.survival_impact ? row.survival_impact as SourceMapProfileDto["survivalImpact"] : undefined,
    playersText: row.players_text ? String(row.players_text) : undefined,
    lineageThreatText: row.lineage_threat_text ? String(row.lineage_threat_text) : undefined,
    fragilityPosture: row.fragility_posture ? String(row.fragility_posture) : undefined,
    vulnerabilitiesText: row.vulnerabilities_text ? String(row.vulnerabilities_text) : undefined,
    hedgeText: row.hedge_text ? String(row.hedge_text) : undefined,
    edgeText: row.edge_text ? String(row.edge_text) : undefined,
    primaryCraftId: row.primary_craft_id ? String(row.primary_craft_id) : undefined,
    heuristicsText: row.heuristics_text ? String(row.heuristics_text) : undefined,
    avoidText: row.avoid_text ? String(row.avoid_text) : undefined,
    affairId: row.affair_id ? String(row.affair_id) : undefined,
    interestId: row.interest_id ? String(row.interest_id) : undefined
  };
}

function seedAffairScores(profile: AnyRow) {
  const oddsBand = String(profile.odds_band ?? "").toLowerCase();
  const survivalImpact = String(profile.survival_impact ?? "").toLowerCase();
  const repeatRate = String(profile.repeat_rate_text ?? "").toLowerCase();
  const repeatedExposure = ["continuous", "daily", "weekly", "repeated", "rollover", "mark-to-market"].some((token) => repeatRate.includes(token));
  if (repeatedExposure && (oddsBand === "intolerable" || survivalImpact === "existential")) return { stakes: 10, risk: 10 };
  if (oddsBand === "high" || survivalImpact === "damaging") return { stakes: 9, risk: 8 };
  if (String(profile.fragility_posture ?? "") === "fragile") return { stakes: 8, risk: 8 };
  if (String(profile.fragility_posture ?? "") === "antifragile") return { stakes: 5, risk: 3 };
  return { stakes: 6, risk: 5 };
}

function seedInterestScores(profile: AnyRow) {
  const oddsBand = String(profile.odds_band ?? "").toLowerCase();
  const survivalImpact = String(profile.survival_impact ?? "").toLowerCase();
  if (oddsBand === "intolerable" || survivalImpact === "existential") return { stakes: 3, risk: 6, convexity: 4 };
  if (oddsBand === "high" || survivalImpact === "damaging") return { stakes: 4, risk: 5, convexity: 5 };
  if (String(profile.fragility_posture ?? "") === "antifragile") return { stakes: 6, risk: 3, convexity: 8 };
  if (String(profile.fragility_posture ?? "") === "robust") return { stakes: 5, risk: 4, convexity: 6 };
  return { stakes: 4, risk: 4, convexity: 5 };
}

function isErgodicAffairBias(profile: AnyRow): boolean {
  const oddsBand = String(profile.odds_band ?? "").toLowerCase();
  const survivalImpact = String(profile.survival_impact ?? "").toLowerCase();
  const repeatRate = String(profile.repeat_rate_text ?? "").toLowerCase();
  const repeatedExposure = ["continuous", "daily", "weekly", "repeated", "rollover", "mark-to-market"].some((token) => repeatRate.includes(token));
  return repeatedExposure && (oddsBand === "high" || oddsBand === "intolerable" || survivalImpact === "damaging" || survivalImpact === "existential");
}

function buildProfileBiasNotes(profile: AnyRow): string[] {
  const notes: string[] = [];
  if (String(profile.odds_band ?? "").trim()) notes.push(`Odds band: ${String(profile.odds_band)}`);
  if (String(profile.survival_impact ?? "").trim()) notes.push(`Survival impact: ${String(profile.survival_impact)}`);
  if (String(profile.repeat_rate_text ?? "").trim()) notes.push(`Repeat rate: ${String(profile.repeat_rate_text)}`);
  if (String(profile.trigger_condition_text ?? "").trim()) notes.push(`Trigger: ${String(profile.trigger_condition_text)}`);
  return notes;
}

function collectDoctrineWarnings(db: Database.Database, profile: AnyRow): string[] {
  return doctrineWarningsForProfile(
    { primaryCraftId: profile.primary_craft_id ? String(profile.primary_craft_id) : undefined },
    loadWarGameDoctrineChains(db)
  );
}

export function loadSourceMapProfiles(db: Database.Database): SourceMapProfileDto[] {
  const rows = db
    .prepare(
      `SELECT id, source_id, domain_id, decision_type, tail_class, quadrant, method_posture, notes
             , stakes_text, risks_text, odds_text, odds_band, repeat_rate_text, base_rate_text, trigger_condition_text, survival_impact, players_text, lineage_threat_text, fragility_posture, vulnerabilities_text
             , hedge_text, edge_text, primary_craft_id, heuristics_text, avoid_text, affair_id, interest_id
       FROM source_map_profiles
       ORDER BY source_id, domain_id, updated_at DESC`
    )
    .all() as AnyRow[];
  return rows.map(mapSourceMapProfile);
}

export async function handleSourceMapGet(sourceId: string) {
  return withDb((db) => {
    const source = db.prepare("SELECT id FROM volatility_sources WHERE id=?").get(sourceId) as AnyRow | undefined;
    if (!source) return ok({ error: "Source not found" }, 404);
    const rows = db
      .prepare(
        `SELECT id, source_id, domain_id, decision_type, tail_class, quadrant, method_posture, notes
               , stakes_text, risks_text, odds_text, odds_band, repeat_rate_text, base_rate_text, trigger_condition_text, survival_impact, players_text, lineage_threat_text, fragility_posture, vulnerabilities_text
               , hedge_text, edge_text, primary_craft_id, heuristics_text, avoid_text, affair_id, interest_id
         FROM source_map_profiles
         WHERE source_id=?
         ORDER BY domain_id`
      )
      .all(sourceId) as AnyRow[];
    return ok(rows.map(mapSourceMapProfile));
  });
}

export async function handleSourceMapPut(sourceId: string, rawBody: unknown) {
  const parsed = sourceMapProfileSchema.parse(rawBody);
  return withDb((db) => {
    const source = db.prepare("SELECT id FROM volatility_sources WHERE id=?").get(sourceId) as AnyRow | undefined;
    if (!source) return ok({ error: "Source not found" }, 404);
    const domain = db.prepare("SELECT id FROM domains WHERE id=?").get(parsed.domainId) as AnyRow | undefined;
    if (!domain) return ok({ error: "Domain not found" }, 404);

    const priorProfile = db
      .prepare(
        `SELECT id, decision_type, tail_class, notes, stakes_text, risks_text, odds_text, odds_band, repeat_rate_text, base_rate_text, trigger_condition_text, survival_impact, players_text, lineage_threat_text,
                fragility_posture, vulnerabilities_text, hedge_text, edge_text, primary_craft_id, heuristics_text, avoid_text, affair_id, interest_id
         FROM source_map_profiles
         WHERE source_id=? AND domain_id=?`
      )
      .get(sourceId, parsed.domainId) as AnyRow | undefined;
    const decisionType = parsed.decisionType ?? (priorProfile?.decision_type as SourceMapProfileDto["decisionType"] | undefined) ?? "complex";
    const tailClass = parsed.tailClass ?? (priorProfile?.tail_class as SourceMapProfileDto["tailClass"] | undefined) ?? "unknown";
    const quadrant = deriveQuadrant(decisionType, tailClass);
    const methodPosture = methodPostureForQuadrant(quadrant);
    const id = priorProfile?.id ? String(priorProfile.id) : randomUUID();

    if (priorProfile) {
      db.prepare(
        `UPDATE source_map_profiles
         SET decision_type=?, tail_class=?, quadrant=?, method_posture=?, notes=?, stakes_text=?, risks_text=?, odds_text=?, odds_band=?, repeat_rate_text=?, base_rate_text=?, trigger_condition_text=?, survival_impact=?, players_text=?,
             lineage_threat_text=?, fragility_posture=?, vulnerabilities_text=?, hedge_text=?, edge_text=?, primary_craft_id=?,
             heuristics_text=?, avoid_text=?, updated_at=datetime('now')
         WHERE id=?`
      ).run(
        decisionType,
        tailClass,
        quadrant,
        methodPosture,
        parsed.notes ?? priorProfile.notes ?? null,
        parsed.stakesText ?? priorProfile.stakes_text ?? null,
        parsed.risksText ?? priorProfile.risks_text ?? null,
        parsed.oddsText ?? priorProfile.odds_text ?? null,
        parsed.oddsBand ?? priorProfile.odds_band ?? null,
        parsed.repeatRateText ?? priorProfile.repeat_rate_text ?? null,
        parsed.baseRateText ?? priorProfile.base_rate_text ?? null,
        parsed.triggerConditionText ?? priorProfile.trigger_condition_text ?? null,
        parsed.survivalImpact ?? priorProfile.survival_impact ?? null,
        parsed.playersText ?? priorProfile.players_text ?? null,
        parsed.lineageThreatText ?? priorProfile.lineage_threat_text ?? null,
        parsed.fragilityPosture ?? priorProfile.fragility_posture ?? null,
        parsed.vulnerabilitiesText ?? priorProfile.vulnerabilities_text ?? null,
        parsed.hedgeText ?? priorProfile.hedge_text ?? null,
        parsed.edgeText ?? priorProfile.edge_text ?? null,
        parsed.primaryCraftId ?? priorProfile.primary_craft_id ?? null,
        parsed.heuristicsText ?? priorProfile.heuristics_text ?? null,
        parsed.avoidText ?? priorProfile.avoid_text ?? null,
        id
      );
    } else {
      db.prepare(
        `INSERT INTO source_map_profiles
         (id, source_id, domain_id, decision_type, tail_class, quadrant, method_posture, notes, stakes_text, risks_text, odds_text, odds_band,
          repeat_rate_text, base_rate_text, trigger_condition_text, survival_impact, players_text, lineage_threat_text, fragility_posture, vulnerabilities_text, hedge_text, edge_text, primary_craft_id,
          heuristics_text, avoid_text)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        sourceId,
        parsed.domainId,
        decisionType,
        tailClass,
        quadrant,
        methodPosture,
        parsed.notes ?? null,
        parsed.stakesText ?? null,
        parsed.risksText ?? null,
        parsed.oddsText ?? null,
        parsed.oddsBand ?? null,
        parsed.repeatRateText ?? null,
        parsed.baseRateText ?? null,
        parsed.triggerConditionText ?? null,
        parsed.survivalImpact ?? null,
        parsed.playersText ?? null,
        parsed.lineageThreatText ?? null,
        parsed.fragilityPosture ?? null,
        parsed.vulnerabilitiesText ?? null,
        parsed.hedgeText ?? null,
        parsed.edgeText ?? null,
        parsed.primaryCraftId ?? null,
        parsed.heuristicsText ?? null,
        parsed.avoidText ?? null
      );
    }

    return ok({
      id,
      sourceId,
      domainId: parsed.domainId,
      decisionType,
      tailClass,
      quadrant,
      methodPosture,
      notes: parsed.notes ?? priorProfile?.notes ?? undefined,
      stakesText: parsed.stakesText ?? priorProfile?.stakes_text ?? undefined,
      risksText: parsed.risksText ?? priorProfile?.risks_text ?? undefined,
      oddsText: parsed.oddsText ?? priorProfile?.odds_text ?? undefined,
      oddsBand: parsed.oddsBand ?? priorProfile?.odds_band ?? undefined,
      repeatRateText: parsed.repeatRateText ?? priorProfile?.repeat_rate_text ?? undefined,
      baseRateText: parsed.baseRateText ?? priorProfile?.base_rate_text ?? undefined,
      triggerConditionText: parsed.triggerConditionText ?? priorProfile?.trigger_condition_text ?? undefined,
      survivalImpact: parsed.survivalImpact ?? priorProfile?.survival_impact ?? undefined,
      playersText: parsed.playersText ?? priorProfile?.players_text ?? undefined,
      lineageThreatText: parsed.lineageThreatText ?? priorProfile?.lineage_threat_text ?? undefined,
      fragilityPosture: parsed.fragilityPosture ?? priorProfile?.fragility_posture ?? undefined,
      vulnerabilitiesText: parsed.vulnerabilitiesText ?? priorProfile?.vulnerabilities_text ?? undefined,
      hedgeText: parsed.hedgeText ?? priorProfile?.hedge_text ?? undefined,
      edgeText: parsed.edgeText ?? priorProfile?.edge_text ?? undefined,
      primaryCraftId: parsed.primaryCraftId ?? priorProfile?.primary_craft_id ?? undefined,
      heuristicsText: parsed.heuristicsText ?? priorProfile?.heuristics_text ?? undefined,
      avoidText: parsed.avoidText ?? priorProfile?.avoid_text ?? undefined,
      affairId: priorProfile?.affair_id ? String(priorProfile.affair_id) : undefined,
      interestId: priorProfile?.interest_id ? String(priorProfile.interest_id) : undefined
    });
  });
}

export async function handleSourceMapStateOfAffairs(sourceId: string, rawBody: unknown) {
  const parsed = sourceMapStateOfAffairsSchema.parse(rawBody);
  return withDb((db, dbPath) => {
    const source = db.prepare("SELECT id, name FROM volatility_sources WHERE id=?").get(sourceId) as AnyRow | undefined;
    if (!source) return ok({ error: "Source not found" }, 404);
    const domain = db.prepare("SELECT id, name FROM domains WHERE id=?").get(parsed.domainId) as AnyRow | undefined;
    if (!domain) return ok({ error: "Domain not found" }, 404);

    const profile = db
      .prepare(
        `SELECT *
         FROM source_map_profiles
         WHERE source_id=? AND domain_id=?`
      )
      .get(sourceId, parsed.domainId) as AnyRow | undefined;
    if (!profile) return ok({ error: "Source-domain map profile not found" }, 404);

    if (parsed.kind === "affair" && !String(profile.hedge_text ?? "").trim()) {
      return ok({ error: "Define hedge before creating an affair." }, 400);
    }
    if (parsed.kind === "interest" && !String(profile.edge_text ?? "").trim()) {
      return ok({ error: "Define edge before creating an interest." }, 400);
    }

    const doctrineWarnings = collectDoctrineWarnings(db, profile);
    const biasNotes = buildProfileBiasNotes(profile);

    if (parsed.kind === "affair") {
      const linkedAffairId = profile.affair_id ? String(profile.affair_id) : randomUUID();
      const existingAffair = db.prepare("SELECT * FROM affairs WHERE id=?").get(linkedAffairId) as AnyRow | undefined;
      const affairScores = seedAffairScores(profile);
      writeAffair(
        dbPath,
        {
          id: linkedAffairId,
          domainId: parsed.domainId,
          title: existingAffair?.title ? String(existingAffair.title) : `Hedge: ${String(domain.name)} - ${String(source.name)}`,
          description: existingAffair?.description
            ? String(existingAffair.description)
            : [...biasNotes, doctrineWarnings.length ? `Doctrine warnings: ${doctrineWarnings.join(" ")}` : ""].filter(Boolean).join(" | "),
          timeline: existingAffair?.timeline
            ? String(existingAffair.timeline)
            : isErgodicAffairBias(profile)
              ? "Immediate no-ruin obligation seeded from repeated high-odds exposure."
              : doctrineWarnings.length
                ? "Immediate obligation seeded from State of the Art. Penalized due to unresolved doctrine gaps."
                : "Immediate obligation seeded from State of the Art",
          stakes: existingAffair?.stakes ? Number(existingAffair.stakes) : affairScores.stakes,
          risk: existingAffair?.risk ? Number(existingAffair.risk) : affairScores.risk,
          status: (existingAffair?.status ? String(existingAffair.status) : "NOT_STARTED") as Status
        },
        undefined
      );

      const planExists = db.prepare("SELECT affair_id FROM affair_plan_details WHERE affair_id=?").get(linkedAffairId) as AnyRow | undefined;
      const objectives = [String(profile.hedge_text ?? "").trim(), String(profile.stakes_text ?? "").trim()].filter(Boolean);
      if (planExists) {
        db.prepare(
          `UPDATE affair_plan_details
           SET objectives_json=?, uncertainty=?, time_horizon=?, updated_at=datetime('now')
           WHERE affair_id=?`
        ).run(
          JSON.stringify(objectives),
          [String(profile.risks_text ?? profile.vulnerabilities_text ?? ""), ...biasNotes, doctrineWarnings.length ? `Doctrine warnings: ${doctrineWarnings.join(" ")}` : ""]
            .filter(Boolean)
            .join(" | "),
          "WEEK",
          linkedAffairId
        );
      } else {
        db.prepare(
          `INSERT INTO affair_plan_details (affair_id, objectives_json, uncertainty, time_horizon, updated_at)
           VALUES (?, ?, ?, ?, datetime('now'))`
        ).run(
          linkedAffairId,
          JSON.stringify(objectives),
          [String(profile.risks_text ?? profile.vulnerabilities_text ?? ""), ...biasNotes, doctrineWarnings.length ? `Doctrine warnings: ${doctrineWarnings.join(" ")}` : ""]
            .filter(Boolean)
            .join(" | "),
          "WEEK"
        );
      }

      if (String(profile.primary_craft_id ?? "").trim()) {
        const craftExists = db.prepare("SELECT id FROM crafts WHERE id=?").get(String(profile.primary_craft_id)) as AnyRow | undefined;
        if (!craftExists) {
          db.prepare("INSERT INTO crafts (id, name, description) VALUES (?, ?, ?)").run(
            String(profile.primary_craft_id),
            String(profile.primary_craft_id),
            "Auto-created from source map means"
          );
        }
        const meansExists = db.prepare("SELECT affair_id FROM affair_means WHERE affair_id=?").get(linkedAffairId) as AnyRow | undefined;
        if (meansExists) {
          db.prepare(
            `UPDATE affair_means
             SET craft_id=?, methodology=?, technology=?, techniques=?, updated_at=datetime('now')
             WHERE affair_id=?`
          ).run(
            String(profile.primary_craft_id),
            String(profile.heuristics_text ?? ""),
            String(profile.method_posture ?? ""),
            String(profile.avoid_text ?? ""),
            linkedAffairId
          );
        } else {
          db.prepare(
            `INSERT INTO affair_means (affair_id, craft_id, methodology, technology, techniques)
             VALUES (?, ?, ?, ?, ?)`
          ).run(
            linkedAffairId,
            String(profile.primary_craft_id),
            String(profile.heuristics_text ?? ""),
            String(profile.method_posture ?? ""),
            String(profile.avoid_text ?? "")
          );
        }
      }

      db.prepare("UPDATE source_map_profiles SET affair_id=?, updated_at=datetime('now') WHERE id=?").run(linkedAffairId, String(profile.id));
      return ok({
        kind: "affair",
        id: linkedAffairId,
        route: `/war-gaming/affair?target=${encodeURIComponent(linkedAffairId)}`,
        title: existingAffair?.title ? String(existingAffair.title) : `Hedge: ${String(domain.name)} - ${String(source.name)}`,
        doctrineWarnings
      });
    }

    const linkedInterestId = profile.interest_id ? String(profile.interest_id) : randomUUID();
    const existingInterest = db.prepare("SELECT * FROM interests WHERE id=?").get(linkedInterestId) as AnyRow | undefined;
    const interestScores = seedInterestScores(profile);
    writeInterest(
      dbPath,
      {
        id: linkedInterestId,
        domainId: parsed.domainId,
        title: existingInterest?.title ? String(existingInterest.title) : `Edge: ${String(domain.name)} - ${String(source.name)}`,
        stakes: existingInterest?.stakes ? Number(existingInterest.stakes) : interestScores.stakes,
        risk: existingInterest?.risk ? Number(existingInterest.risk) : interestScores.risk,
        convexity: existingInterest?.convexity ? Number(existingInterest.convexity) : interestScores.convexity,
        status: (existingInterest?.status ? String(existingInterest.status) : "NOT_STARTED") as Status,
        labStage: (existingInterest?.lab_stage ? String(existingInterest.lab_stage) : "FORGE") as "FORGE" | "WIELD" | "TINKER",
        hypothesis: existingInterest?.hypothesis ? String(existingInterest.hypothesis) : String(profile.edge_text ?? ""),
        maxLossPct: existingInterest?.max_loss_pct ? Number(existingInterest.max_loss_pct) : 10,
        hedgePct: existingInterest?.hedge_pct ? Number(existingInterest.hedge_pct) : 90,
        edgePct: existingInterest?.edge_pct ? Number(existingInterest.edge_pct) : 10,
        asymmetry: existingInterest?.asymmetry ? String(existingInterest.asymmetry) : String(profile.edge_text ?? ""),
        upside: existingInterest?.upside ? String(existingInterest.upside) : String(profile.edge_text ?? ""),
        downside: existingInterest?.downside ? String(existingInterest.downside) : String(profile.avoid_text ?? profile.risks_text ?? ""),
        evidenceNote: existingInterest?.evidence_note ? String(existingInterest.evidence_note) : String(profile.heuristics_text ?? ""),
        notes: existingInterest?.notes
          ? String(existingInterest.notes)
          : [
              `Generated from source ${String(source.name)} in domain ${String(domain.name)}.`,
              ...biasNotes,
              doctrineWarnings.length ? `Doctrine warnings: ${doctrineWarnings.join(" ")}` : ""
            ]
              .filter(Boolean)
              .join(" ")
      },
      undefined
    );
    db.prepare("UPDATE source_map_profiles SET interest_id=?, updated_at=datetime('now') WHERE id=?").run(linkedInterestId, String(profile.id));
    return ok({
      kind: "interest",
      id: linkedInterestId,
      route: `/war-gaming/interest?target=${encodeURIComponent(linkedInterestId)}`,
      title: existingInterest?.title ? String(existingInterest.title) : `Edge: ${String(domain.name)} - ${String(source.name)}`,
      doctrineWarnings
    });
  });
}
