import { createHash, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { SecondBrainProvider } from "../../components/war-room-v2/types";

export type SecondBrainSyncPayload = {
  provider: SecondBrainProvider;
  operationType: "READ" | "WRITE";
  dryRun?: boolean;
  confirm?: boolean;
  artifacts?: Array<{
    externalId: string;
    artifactType: "HEAP" | "MODEL" | "FRAMEWORK" | "BARBELL" | "HEURISTIC";
    title: string;
    uri?: string;
    metadata?: Record<string, unknown>;
    linkedEntityType?: "craft" | "domain" | "affair" | "interest" | "mission" | "lineage";
    linkedEntityId?: string;
  }>;
};

export function listIntegrationProviders(db: Database.Database) {
  const rows = db.prepare("SELECT * FROM integration_accounts ORDER BY created_at DESC").all() as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: String(row.id),
    provider: String(row.provider),
    label: String(row.label),
    config: JSON.parse(String(row.config_json ?? "{}")),
    active: Number(row.active ?? 1) === 1,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  }));
}

export function upsertIntegrationProvider(
  db: Database.Database,
  payload: { provider: SecondBrainProvider; label: string; config?: Record<string, unknown>; active?: boolean }
) {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO integration_accounts (id, provider, label, config_json, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).run(id, payload.provider, payload.label, JSON.stringify(payload.config ?? {}), payload.active === false ? 0 : 1);
  return { id, ...payload, active: payload.active !== false };
}

export function syncSecondBrain(db: Database.Database, payload: SecondBrainSyncPayload) {
  const dryRun = payload.dryRun !== false;
  const artifacts = payload.artifacts ?? [];
  const diffHash = createHash("sha256").update(JSON.stringify({ provider: payload.provider, operationType: payload.operationType, artifacts })).digest("hex");

  const opId = randomUUID();
  const responseArtifacts: Array<Record<string, unknown>> = [];

  if (payload.operationType === "WRITE" && !payload.confirm) {
    db.prepare(
      `INSERT INTO sync_operations (id, provider, operation_type, dry_run, diff_hash, request_json, response_json, status, created_at)
       VALUES (?, ?, ?, 1, ?, ?, ?, 'PREVIEW', datetime('now'))`
    ).run(opId, payload.provider, payload.operationType, diffHash, JSON.stringify(payload), JSON.stringify({ preview: true, artifacts: artifacts.length }));
    return {
      operationId: opId,
      preview: true,
      committed: false,
      diffHash,
      message: "Preview generated. Set confirm=true for write commit."
    };
  }

  if (!dryRun && payload.operationType === "WRITE") {
    for (const artifact of artifacts) {
      const rowId = randomUUID();
      db.prepare(
        `INSERT INTO external_artifacts
         (id, provider, external_id, artifact_type, title, uri, metadata_json, linked_entity_type, linked_entity_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
         ON CONFLICT(provider, external_id) DO UPDATE SET
           artifact_type=excluded.artifact_type,
           title=excluded.title,
           uri=excluded.uri,
           metadata_json=excluded.metadata_json,
           linked_entity_type=excluded.linked_entity_type,
           linked_entity_id=excluded.linked_entity_id,
           updated_at=datetime('now')`
      ).run(
        rowId,
        payload.provider,
        artifact.externalId,
        artifact.artifactType,
        artifact.title,
        artifact.uri ?? null,
        JSON.stringify(artifact.metadata ?? {}),
        artifact.linkedEntityType ?? null,
        artifact.linkedEntityId ?? null
      );
      responseArtifacts.push({ externalId: artifact.externalId, upserted: true });
    }
  } else {
    const existing = db.prepare("SELECT provider, external_id, artifact_type, title, uri FROM external_artifacts WHERE provider=? ORDER BY updated_at DESC LIMIT 100").all(payload.provider) as Array<Record<string, unknown>>;
    existing.forEach((row) => responseArtifacts.push({
      provider: String(row.provider),
      externalId: String(row.external_id),
      artifactType: String(row.artifact_type),
      title: String(row.title),
      uri: row.uri ? String(row.uri) : undefined
    }));
  }

  const status = dryRun ? "SIMULATED" : "COMMITTED";
  db.prepare(
    `INSERT INTO sync_operations (id, provider, operation_type, dry_run, diff_hash, request_json, response_json, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(opId, payload.provider, payload.operationType, dryRun ? 1 : 0, diffHash, JSON.stringify(payload), JSON.stringify(responseArtifacts), status);

  return {
    operationId: opId,
    preview: dryRun,
    committed: !dryRun,
    diffHash,
    artifacts: responseArtifacts
  };
}
