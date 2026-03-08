import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type {
  PortfolioDecisionGate,
  PortfolioEvidence,
  PortfolioExperiment,
  PortfolioProject,
  PortfolioRepoAdapter,
  PortfolioShipLog
} from "@khal/domain";
import { ok, withDb } from "../api";
import { loadRuntimeProjection } from "../runtime/authority";
import {
  portfolioDecisionGateSchema,
  portfolioEvidenceSchema,
  portfolioExperimentSchema,
  portfolioProjectCreateSchema,
  portfolioProjectPatchSchema,
  portfolioShipLogSchema,
  type PortfolioInterestOption,
  type PortfolioProjectCard,
  type PortfolioProjectDetailSnapshot,
  type PortfolioWarRoomSnapshot
} from "./models";
import {
  buildCemeteryEntries,
  buildExperimentBoardEntries,
  buildPortfolioSummary,
  buildShippingRadarEntries,
  movementStateForProject
} from "./view-model";

type AnyRow = Record<string, unknown>;

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function uniqueSlug(db: Database.Database, candidate: string, excludeId?: string) {
  const base = slugify(candidate) || "portfolio-project";
  let slug = base;
  let suffix = 2;
  while (true) {
    const row = db.prepare("SELECT id FROM portfolio_projects WHERE slug=?").get(slug) as AnyRow | undefined;
    if (!row?.id || String(row.id) === excludeId) break;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

function resolveProjectIdBySlug(db: Database.Database, slug: string) {
  const row = db.prepare("SELECT id FROM portfolio_projects WHERE slug=?").get(slug) as AnyRow | undefined;
  return row?.id ? String(row.id) : null;
}

function mapProject(row: AnyRow): PortfolioProject {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    tagline: normalizeOptionalString(row.tagline),
    strategicRole: String(row.strategic_role) as PortfolioProject["strategicRole"],
    stage: String(row.stage) as PortfolioProject["stage"],
    mission: normalizeOptionalString(row.mission),
    wedge: normalizeOptionalString(row.wedge),
    rightTail: normalizeOptionalString(row.right_tail),
    leftTail: normalizeOptionalString(row.left_tail),
    currentExperiment: normalizeOptionalString(row.current_experiment),
    successMetric: normalizeOptionalString(row.success_metric),
    killCriteria: normalizeOptionalString(row.kill_criteria),
    nextMilestone: normalizeOptionalString(row.next_milestone),
    currentBottleneck: normalizeOptionalString(row.current_bottleneck),
    signalBand: String(row.signal_band ?? row.confidence_band ?? "watch") as PortfolioProject["signalBand"],
    repoUrl: normalizeOptionalString(row.repo_url),
    repoName: normalizeOptionalString(row.repo_name),
    defaultBranch: normalizeOptionalString(row.default_branch),
    lastShippedAt: normalizeOptionalString(row.last_shipped_at),
    lastReviewedAt: normalizeOptionalString(row.last_reviewed_at),
    isActive: Number(row.is_active ?? 0) === 1,
    notes: normalizeOptionalString(row.notes),
    linkedInterestId: normalizeOptionalString(row.linked_interest_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapShipLog(row: AnyRow): PortfolioShipLog {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    title: String(row.title),
    type: String(row.type) as PortfolioShipLog["type"],
    summary: normalizeOptionalString(row.summary),
    sourceLabel: normalizeOptionalString(row.source_label),
    sourceUrl: normalizeOptionalString(row.source_url),
    shippedAt: String(row.shipped_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapEvidence(row: AnyRow): PortfolioEvidence {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    title: String(row.title),
    type: String(row.type) as PortfolioEvidence["type"],
    summary: String(row.summary),
    impact: normalizeOptionalString(row.impact),
    recordedAt: String(row.recorded_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapDecisionGate(row: AnyRow): PortfolioDecisionGate {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    title: String(row.title),
    gateType: String(row.gate_type) as PortfolioDecisionGate["gateType"],
    criteria: String(row.criteria),
    status: String(row.status) as PortfolioDecisionGate["status"],
    dueAt: normalizeOptionalString(row.due_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapExperiment(row: AnyRow): PortfolioExperiment {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    title: String(row.title),
    hypothesis: String(row.hypothesis),
    expectedLearning: normalizeOptionalString(row.expected_learning),
    status: String(row.status) as PortfolioExperiment["status"],
    startedAt: normalizeOptionalString(row.started_at),
    completedAt: normalizeOptionalString(row.completed_at),
    resultSummary: normalizeOptionalString(row.result_summary),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapAdapter(row: AnyRow): PortfolioRepoAdapter {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    adapterKind: String(row.adapter_kind) as PortfolioRepoAdapter["adapterKind"],
    sourcePath: normalizeOptionalString(row.source_path),
    metadata: parseJson<Record<string, unknown>>(row.metadata_json, {}),
    lastIngestedAt: normalizeOptionalString(row.last_ingested_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function listProjects(db: Database.Database) {
  return (db.prepare("SELECT * FROM portfolio_projects ORDER BY updated_at DESC, created_at DESC").all() as AnyRow[]).map(mapProject);
}

function listShipLogs(db: Database.Database, projectId?: string) {
  const rows = projectId
    ? (db.prepare("SELECT * FROM portfolio_ship_logs WHERE project_id=? ORDER BY shipped_at DESC, created_at DESC").all(projectId) as AnyRow[])
    : (db.prepare("SELECT * FROM portfolio_ship_logs ORDER BY shipped_at DESC, created_at DESC").all() as AnyRow[]);
  return rows.map(mapShipLog);
}

function listEvidence(db: Database.Database, projectId?: string) {
  const rows = projectId
    ? (db.prepare("SELECT * FROM portfolio_evidence WHERE project_id=? ORDER BY recorded_at DESC, created_at DESC").all(projectId) as AnyRow[])
    : (db.prepare("SELECT * FROM portfolio_evidence ORDER BY recorded_at DESC, created_at DESC").all() as AnyRow[]);
  return rows.map(mapEvidence);
}

function listDecisionGates(db: Database.Database, projectId?: string) {
  const rows = projectId
    ? (db.prepare("SELECT * FROM portfolio_decision_gates WHERE project_id=? ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'watch' THEN 1 WHEN 'triggered' THEN 2 ELSE 3 END, due_at, updated_at DESC").all(projectId) as AnyRow[])
    : (db.prepare("SELECT * FROM portfolio_decision_gates ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'watch' THEN 1 WHEN 'triggered' THEN 2 ELSE 3 END, due_at, updated_at DESC").all() as AnyRow[]);
  return rows.map(mapDecisionGate);
}

function listExperiments(db: Database.Database, projectId?: string) {
  const rows = projectId
    ? (db.prepare("SELECT * FROM portfolio_experiments WHERE project_id=? ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'planned' THEN 1 WHEN 'paused' THEN 2 WHEN 'complete' THEN 3 ELSE 4 END, started_at DESC, updated_at DESC").all(projectId) as AnyRow[])
    : (db.prepare("SELECT * FROM portfolio_experiments ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'planned' THEN 1 WHEN 'paused' THEN 2 WHEN 'complete' THEN 3 ELSE 4 END, started_at DESC, updated_at DESC").all() as AnyRow[]);
  return rows.map(mapExperiment);
}

function listAdapters(db: Database.Database) {
  return (db.prepare("SELECT * FROM portfolio_repo_adapters ORDER BY updated_at DESC").all() as AnyRow[]).map(mapAdapter);
}

function listInterestOptions(db: Database.Database): PortfolioInterestOption[] {
  return (db.prepare("SELECT id, title, domain_id FROM interests ORDER BY updated_at DESC, created_at DESC").all() as AnyRow[]).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    domainId: normalizeOptionalString(row.domain_id)
  }));
}

function buildProjectCards(db: Database.Database): PortfolioProjectCard[] {
  const projects = listProjects(db);
  const shipLogs = listShipLogs(db);
  const evidence = listEvidence(db);
  const decisionGates = listDecisionGates(db);
  const experiments = listExperiments(db);
  const adapters = listAdapters(db);
  const interestOptions = listInterestOptions(db);

  const latestShipByProject = new Map<string, PortfolioShipLog>();
  const latestEvidenceByProject = new Map<string, PortfolioEvidence>();
  const nextGateByProject = new Map<string, PortfolioDecisionGate>();
  const activeExperimentByProject = new Map<string, PortfolioExperiment>();
  const adapterByProject = new Map<string, PortfolioRepoAdapter>();
  const shipCountByProject = new Map<string, number>();
  const evidenceCountByProject = new Map<string, number>();
  const experimentCountByProject = new Map<string, number>();
  const interestById = new Map(interestOptions.map((interest) => [interest.id, interest]));

  for (const ship of shipLogs) {
    if (!latestShipByProject.has(ship.projectId)) latestShipByProject.set(ship.projectId, ship);
    shipCountByProject.set(ship.projectId, (shipCountByProject.get(ship.projectId) ?? 0) + 1);
  }
  for (const item of evidence) {
    if (!latestEvidenceByProject.has(item.projectId)) latestEvidenceByProject.set(item.projectId, item);
    evidenceCountByProject.set(item.projectId, (evidenceCountByProject.get(item.projectId) ?? 0) + 1);
  }
  for (const gate of decisionGates) {
    if (!nextGateByProject.has(gate.projectId)) nextGateByProject.set(gate.projectId, gate);
  }
  for (const experiment of experiments) {
    if (!activeExperimentByProject.has(experiment.projectId)) activeExperimentByProject.set(experiment.projectId, experiment);
    experimentCountByProject.set(experiment.projectId, (experimentCountByProject.get(experiment.projectId) ?? 0) + 1);
  }
  for (const adapter of adapters) {
    if (!adapterByProject.has(adapter.projectId)) adapterByProject.set(adapter.projectId, adapter);
  }

  return projects.map((project) => {
    const latestShip = latestShipByProject.get(project.id);
    const activeExperiment = activeExperimentByProject.get(project.id);
    const nextGate = nextGateByProject.get(project.id);
    const latestEvidence = latestEvidenceByProject.get(project.id);
    const adapter = adapterByProject.get(project.id);

    const movementState = movementStateForProject({
      stage: project.stage,
      latestShip,
      activeExperiment
    });

    return {
      ...project,
      linkedInterest: project.linkedInterestId ? interestById.get(project.linkedInterestId) : undefined,
      latestShip,
      activeExperiment,
      nextGate,
      latestEvidence,
      adapter,
      shipCount: shipCountByProject.get(project.id) ?? 0,
      evidenceCount: evidenceCountByProject.get(project.id) ?? 0,
      experimentCount: experimentCountByProject.get(project.id) ?? 0,
      movementState
    } satisfies PortfolioProjectCard;
  });
}

export function buildPortfolioWarRoomSnapshot(db: Database.Database, dbPath: string): PortfolioWarRoomSnapshot {
  const projects = buildProjectCards(db);
  return {
    summary: buildPortfolioSummary(projects),
    projects,
    shippingRadar: buildShippingRadarEntries(projects),
    experimentBoard: buildExperimentBoardEntries(projects),
    cemetery: buildCemeteryEntries(projects),
    interestOptions: listInterestOptions(db),
    runtimeInvariants: loadRuntimeProjection({ db, dbPath }).runtimeInvariants.summary
  };
}

export function buildPortfolioProjectDetailSnapshot(db: Database.Database, dbPath: string, slug: string): PortfolioProjectDetailSnapshot | null {
  const projects = buildProjectCards(db);
  const project = projects.find((item) => item.slug === slug);
  if (!project) return null;

  return {
    project,
    shipLogs: listShipLogs(db, project.id),
    evidence: listEvidence(db, project.id),
    experiments: listExperiments(db, project.id),
    decisionGates: listDecisionGates(db, project.id),
    interestOptions: listInterestOptions(db),
    runtimeInvariants: loadRuntimeProjection({ db, dbPath }).runtimeInvariants.summary
  };
}

function touchProject(db: Database.Database, projectId: string, extras?: { lastShippedAt?: string }) {
  db.prepare(
    `UPDATE portfolio_projects
     SET updated_at=datetime('now'),
         last_shipped_at=COALESCE(?, last_shipped_at)
     WHERE id=?`
  ).run(extras?.lastShippedAt ?? null, projectId);
}

function ensureAdapterRow(db: Database.Database, projectId: string, sourcePath?: string) {
  const existing = db.prepare("SELECT id FROM portfolio_repo_adapters WHERE project_id=?").get(projectId) as AnyRow | undefined;
  if (existing?.id) {
    if (sourcePath) {
      db.prepare(
        "UPDATE portfolio_repo_adapters SET source_path=COALESCE(?, source_path), updated_at=datetime('now') WHERE project_id=?"
      ).run(sourcePath, projectId);
    }
    return;
  }

  db.prepare(
    `INSERT INTO portfolio_repo_adapters (id, project_id, adapter_kind, source_path, metadata_json, last_ingested_at, created_at, updated_at)
     VALUES (?, ?, 'manual', ?, ?, NULL, datetime('now'), datetime('now'))`
  ).run(randomUUID(), projectId, sourcePath ?? null, JSON.stringify({ futureContract: "project.meta.json" }));
}

export async function handlePortfolioList() {
  return withDb((db, dbPath) => ok(buildPortfolioWarRoomSnapshot(db, dbPath)));
}

export async function handlePortfolioCreate(rawBody: unknown) {
  const parsed = portfolioProjectCreateSchema.parse(rawBody ?? {});
  return withDb((db, dbPath) => {
    const projectId = randomUUID();
    const slug = uniqueSlug(db, parsed.slug ?? parsed.name);
    const strategicRole = parsed.strategicRole;
    const stage = parsed.stage;
    const isActive =
      parsed.isActive ??
      !(
        strategicRole === "archive" ||
        strategicRole === "killed" ||
        stage === "archived"
      );

    db.prepare(
      `INSERT INTO portfolio_projects (
        id, slug, name, tagline, strategic_role, stage, mission, wedge, right_tail, left_tail,
        current_experiment, success_metric, kill_criteria, next_milestone, current_bottleneck,
        signal_band, confidence_band, repo_url, repo_name, default_branch, last_reviewed_at, is_active, notes, linked_interest_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(
      projectId,
      slug,
      parsed.name,
      normalizeOptionalString(parsed.tagline) ?? null,
      strategicRole,
      stage,
      normalizeOptionalString(parsed.mission) ?? null,
      normalizeOptionalString(parsed.wedge) ?? null,
      normalizeOptionalString(parsed.rightTail) ?? null,
      normalizeOptionalString(parsed.leftTail) ?? null,
      normalizeOptionalString(parsed.currentExperiment) ?? null,
      normalizeOptionalString(parsed.successMetric) ?? null,
      normalizeOptionalString(parsed.killCriteria) ?? null,
      normalizeOptionalString(parsed.nextMilestone) ?? null,
      normalizeOptionalString(parsed.currentBottleneck) ?? null,
      parsed.signalBand,
      parsed.signalBand,
      normalizeOptionalString(parsed.repoUrl) ?? null,
      normalizeOptionalString(parsed.repoName) ?? null,
      normalizeOptionalString(parsed.defaultBranch) ?? null,
      normalizeOptionalString(parsed.lastReviewedAt) ?? null,
      isActive ? 1 : 0,
      normalizeOptionalString(parsed.notes) ?? null,
      normalizeOptionalString(parsed.linkedInterestId) ?? null
    );

    ensureAdapterRow(db, projectId, normalizeOptionalString(parsed.adapterSourcePath));
    return ok(
      {
        created: buildPortfolioProjectDetailSnapshot(db, dbPath, slug),
        snapshot: buildPortfolioWarRoomSnapshot(db, dbPath)
      },
      201
    );
  });
}

export async function handlePortfolioBySlug(slug: string) {
  return withDb((db, dbPath) => {
    const detail = buildPortfolioProjectDetailSnapshot(db, dbPath, slug);
    if (!detail) return ok({ error: "Portfolio project not found" }, 404);
    return ok(detail);
  });
}

export async function handlePortfolioPatch(slug: string, rawBody: unknown) {
  const parsed = portfolioProjectPatchSchema.parse(rawBody ?? {});
  return withDb((db, dbPath) => {
    const projectId = resolveProjectIdBySlug(db, slug);
    if (!projectId) return ok({ error: "Portfolio project not found" }, 404);

    const existingRow = db.prepare("SELECT * FROM portfolio_projects WHERE id=?").get(projectId) as AnyRow;
    const existing = mapProject(existingRow);

    const nextRole = parsed.strategicRole ?? existing.strategicRole;
    const nextStage = parsed.stage ?? existing.stage;
    const nextIsActive =
      parsed.isActive ??
      !(
        nextRole === "archive" ||
        nextRole === "killed" ||
        nextStage === "archived"
      );
    const nextSlug = parsed.slug ? uniqueSlug(db, parsed.slug, projectId) : existing.slug;

    db.prepare(
      `UPDATE portfolio_projects
       SET slug=?, name=?, tagline=?, strategic_role=?, stage=?, mission=?, wedge=?, right_tail=?, left_tail=?,
           current_experiment=?, success_metric=?, kill_criteria=?, next_milestone=?, current_bottleneck=?,
           signal_band=?, confidence_band=?, repo_url=?, repo_name=?, default_branch=?, last_reviewed_at=?, is_active=?, notes=?, linked_interest_id=?,
           updated_at=datetime('now')
       WHERE id=?`
    ).run(
      nextSlug,
      parsed.name ?? existing.name,
      normalizeOptionalString(parsed.tagline) ?? existing.tagline ?? null,
      nextRole,
      nextStage,
      normalizeOptionalString(parsed.mission) ?? existing.mission ?? null,
      normalizeOptionalString(parsed.wedge) ?? existing.wedge ?? null,
      normalizeOptionalString(parsed.rightTail) ?? existing.rightTail ?? null,
      normalizeOptionalString(parsed.leftTail) ?? existing.leftTail ?? null,
      normalizeOptionalString(parsed.currentExperiment) ?? existing.currentExperiment ?? null,
      normalizeOptionalString(parsed.successMetric) ?? existing.successMetric ?? null,
      normalizeOptionalString(parsed.killCriteria) ?? existing.killCriteria ?? null,
      normalizeOptionalString(parsed.nextMilestone) ?? existing.nextMilestone ?? null,
      normalizeOptionalString(parsed.currentBottleneck) ?? existing.currentBottleneck ?? null,
      parsed.signalBand ?? existing.signalBand,
      parsed.signalBand ?? existing.signalBand,
      normalizeOptionalString(parsed.repoUrl) ?? existing.repoUrl ?? null,
      normalizeOptionalString(parsed.repoName) ?? existing.repoName ?? null,
      normalizeOptionalString(parsed.defaultBranch) ?? existing.defaultBranch ?? null,
      normalizeOptionalString(parsed.lastReviewedAt) ?? existing.lastReviewedAt ?? null,
      nextIsActive ? 1 : 0,
      normalizeOptionalString(parsed.notes) ?? existing.notes ?? null,
      normalizeOptionalString(parsed.linkedInterestId) ?? existing.linkedInterestId ?? null,
      projectId
    );

    ensureAdapterRow(db, projectId, normalizeOptionalString(parsed.adapterSourcePath));
    return ok({
      project: buildPortfolioProjectDetailSnapshot(db, dbPath, nextSlug),
      snapshot: buildPortfolioWarRoomSnapshot(db, dbPath)
    });
  });
}

export async function handlePortfolioShipLogCreate(slug: string, rawBody: unknown) {
  const parsed = portfolioShipLogSchema.parse(rawBody ?? {});
  return withDb((db, dbPath) => {
    const projectId = resolveProjectIdBySlug(db, slug);
    if (!projectId) return ok({ error: "Portfolio project not found" }, 404);

    db.prepare(
      `INSERT INTO portfolio_ship_logs (id, project_id, title, type, summary, source_label, source_url, shipped_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(
      randomUUID(),
      projectId,
      parsed.title,
      parsed.type,
      normalizeOptionalString(parsed.summary) ?? null,
      normalizeOptionalString(parsed.sourceLabel) ?? null,
      normalizeOptionalString(parsed.sourceUrl) ?? null,
      parsed.shippedAt
    );
    touchProject(db, projectId, { lastShippedAt: parsed.shippedAt });
    return ok({
      project: buildPortfolioProjectDetailSnapshot(db, dbPath, slug),
      snapshot: buildPortfolioWarRoomSnapshot(db, dbPath)
    }, 201);
  });
}

export async function handlePortfolioEvidenceCreate(slug: string, rawBody: unknown) {
  const parsed = portfolioEvidenceSchema.parse(rawBody ?? {});
  return withDb((db, dbPath) => {
    const projectId = resolveProjectIdBySlug(db, slug);
    if (!projectId) return ok({ error: "Portfolio project not found" }, 404);

    db.prepare(
      `INSERT INTO portfolio_evidence (id, project_id, title, type, summary, impact, recorded_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(randomUUID(), projectId, parsed.title, parsed.type, parsed.summary, normalizeOptionalString(parsed.impact) ?? null, parsed.recordedAt);
    touchProject(db, projectId);
    return ok({
      project: buildPortfolioProjectDetailSnapshot(db, dbPath, slug),
      snapshot: buildPortfolioWarRoomSnapshot(db, dbPath)
    }, 201);
  });
}

export async function handlePortfolioExperimentCreate(slug: string, rawBody: unknown) {
  const parsed = portfolioExperimentSchema.parse(rawBody ?? {});
  return withDb((db, dbPath) => {
    const projectId = resolveProjectIdBySlug(db, slug);
    if (!projectId) return ok({ error: "Portfolio project not found" }, 404);

    db.prepare(
      `INSERT INTO portfolio_experiments (id, project_id, title, hypothesis, expected_learning, status, started_at, completed_at, result_summary, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(
      randomUUID(),
      projectId,
      parsed.title,
      parsed.hypothesis,
      normalizeOptionalString(parsed.expectedLearning) ?? null,
      parsed.status,
      normalizeOptionalString(parsed.startedAt) ?? null,
      normalizeOptionalString(parsed.completedAt) ?? null,
      normalizeOptionalString(parsed.resultSummary) ?? null
    );
    if (parsed.status === "active" || parsed.status === "planned") {
      db.prepare(
        `UPDATE portfolio_projects
         SET current_experiment=COALESCE(NULLIF(current_experiment, ''), ?), updated_at=datetime('now')
         WHERE id=?`
      ).run(parsed.title, projectId);
    } else {
      touchProject(db, projectId);
    }

    return ok({
      project: buildPortfolioProjectDetailSnapshot(db, dbPath, slug),
      snapshot: buildPortfolioWarRoomSnapshot(db, dbPath)
    }, 201);
  });
}

export async function handlePortfolioDecisionGateCreate(slug: string, rawBody: unknown) {
  const parsed = portfolioDecisionGateSchema.parse(rawBody ?? {});
  return withDb((db, dbPath) => {
    const projectId = resolveProjectIdBySlug(db, slug);
    if (!projectId) return ok({ error: "Portfolio project not found" }, 404);

    db.prepare(
      `INSERT INTO portfolio_decision_gates (id, project_id, title, gate_type, criteria, status, due_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(randomUUID(), projectId, parsed.title, parsed.gateType, parsed.criteria, parsed.status, normalizeOptionalString(parsed.dueAt) ?? null);
    touchProject(db, projectId);
    return ok({
      project: buildPortfolioProjectDetailSnapshot(db, dbPath, slug),
      snapshot: buildPortfolioWarRoomSnapshot(db, dbPath)
    }, 201);
  });
}
