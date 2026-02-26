import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import * as XLSX from "xlsx";
import { computeFragilityScore, normalizeStatus, type Affair, type Interest, type KhalState, type Task } from "@khal/domain";

const META_SHEET = "_khal_meta";
const REQUIRED_SOURCE_SHEETS = ["War Room", "Affairs", "Interests"] as const;

function normalizeSheetName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function resolveSheetName(workbook: XLSX.WorkBook, logicalName: (typeof REQUIRED_SOURCE_SHEETS)[number]): string | undefined {
  const normalizedToActual = new Map<string, string>();
  for (const sheetName of workbook.SheetNames) {
    normalizedToActual.set(normalizeSheetName(sheetName), sheetName);
  }

  if (logicalName === "War Room") {
    return normalizedToActual.get("war room");
  }

  if (logicalName === "Affairs") {
    return normalizedToActual.get("affairs");
  }

  if (logicalName === "Interests") {
    return normalizedToActual.get("interests") ?? normalizedToActual.get("intrests");
  }

  return undefined;
}

export interface WorkbookValidation {
  ok: boolean;
  issues: string[];
  sheets: string[];
}

export interface WorkbookMeta {
  workbookVersion: string;
  lastAppWriteTimestamp: string;
  lastLoadedTimestamp: string;
  schemaHash: string;
  idMap: Record<string, string>;
}

export function getSheetNames(filePath: string): string[] {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  return workbook.SheetNames;
}

export function validateWorkbook(filePath: string): WorkbookValidation {
  if (!existsSync(filePath)) {
    return { ok: false, issues: ["Workbook file not found"], sheets: [] };
  }

  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheets = workbook.SheetNames;
  const issues: string[] = [];

  for (const logicalSheet of REQUIRED_SOURCE_SHEETS) {
    if (!resolveSheetName(workbook, logicalSheet)) {
      const label = logicalSheet === "Interests" ? "Interests (or Intrests)" : logicalSheet;
      issues.push(`Missing required sheet: ${label}`);
    }
  }

  return { ok: issues.length === 0, issues, sheets };
}

function normalizeText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function parseAffairsRows(rows: unknown[][], idMap: Record<string, string>): Affair[] {
  const result: Affair[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    const layer = normalizeText(row[0]);
    const title = normalizeText(row[1]);
    const stakesRaw = Number(row[3] ?? 0);
    const riskRaw = Number(row[4] ?? 0);
    const statusRaw = normalizeText(row[6]);
    const completionRaw = Number(row[7] ?? 0);

    if (!layer || !title || i < 2 || layer.toUpperCase().includes("TASK TRACKING")) {
      continue;
    }

    const key = `Affairs!${i + 1}`;
    const id = idMap[key] ?? randomUUID();
    idMap[key] = id;

    result.push({
      id,
      domainId: layer.toLowerCase().replace(/\s+/g, "-"),
      title,
      timeline: normalizeText(row[2]),
      stakes: Number.isFinite(stakesRaw) ? stakesRaw : 0,
      risk: Number.isFinite(riskRaw) ? riskRaw : 0,
      fragilityScore: computeFragilityScore(stakesRaw, riskRaw),
      status: normalizeStatus(statusRaw),
      completionPct: completionRaw <= 1 ? completionRaw * 100 : completionRaw
    });
  }
  return result;
}

function parseInterestsRows(rows: unknown[][], idMap: Record<string, string>): Interest[] {
  const result: Interest[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    const domain = normalizeText(row[0]);
    const title = normalizeText(row[1]);
    const stakes = Number(row[2] ?? 0);
    const risk = Number(row[3] ?? 0);
    const convexity = Number(row[7] ?? 0);

    if (!domain || !title || i < 2 || domain.toUpperCase().includes("TASK TRACKING")) {
      continue;
    }

    const key = `Intrests!${i + 1}`;
    const id = idMap[key] ?? randomUUID();
    idMap[key] = id;

    result.push({
      id,
      domainId: domain.toLowerCase().replace(/\s+/g, "-"),
      title,
      stakes,
      risk,
      asymmetry: normalizeText(row[4]),
      upside: normalizeText(row[5]),
      downside: normalizeText(row[6]),
      convexity,
      status: normalizeStatus(normalizeText(row[8])),
      notes: normalizeText(row[9])
    });
  }
  return result;
}

function parseTaskRows(rows: unknown[][], sourceSheet: "Affairs" | "Intrests", idMap: Record<string, string>): Task[] {
  const result: Task[] = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    const parentTitle = normalizeText(row[0]);
    const title = normalizeText(row[1]);

    if (!parentTitle || !title || i < 11) continue;

    const key = `${sourceSheet}!task-${i + 1}`;
    const id = idMap[key] ?? randomUUID();
    idMap[key] = id;

    result.push({
      id,
      sourceType: sourceSheet === "Affairs" ? "AFFAIR" : "INTEREST",
      sourceId: parentTitle.toLowerCase().replace(/\s+/g, "-"),
      dependencyIds: [],
      title,
      horizon: "WEEK",
      dueDate: normalizeText(row[3]),
      status: normalizeStatus(normalizeText(row[4])),
      effortEstimate: Number(row[2] ?? 0)
    });
  }

  return result;
}

export function parseWarRoomNarrative(lines: string[]): Record<string, unknown> {
  const blocks: Array<{ heading: string; kv: Record<string, string>; bullets: string[] }> = [];
  let current = { heading: "ROOT", kv: {} as Record<string, string>, bullets: [] as string[] };

  for (const line of lines.map((value) => value.trim()).filter(Boolean)) {
    if (line.startsWith("## ")) {
      if (current.heading !== "ROOT" || current.bullets.length || Object.keys(current.kv).length) {
        blocks.push(current);
      }
      current = { heading: line.slice(3), kv: {}, bullets: [] };
      continue;
    }

    if (line.startsWith("- ")) {
      current.bullets.push(line.slice(2));
      continue;
    }

    const splitIndex = line.indexOf(":");
    if (splitIndex > 0) {
      const key = line.slice(0, splitIndex).trim();
      const value = line.slice(splitIndex + 1).trim();
      current.kv[key] = value;
      continue;
    }

    current.bullets.push(line);
  }

  if (current.heading !== "ROOT" || current.bullets.length || Object.keys(current.kv).length) {
    blocks.push(current);
  }

  return { blocks };
}

function readMeta(workbook: XLSX.WorkBook): WorkbookMeta {
  const sheet = workbook.Sheets[META_SHEET];
  if (!sheet) {
    return {
      workbookVersion: "0.1",
      lastAppWriteTimestamp: "",
      lastLoadedTimestamp: "",
      schemaHash: "",
      idMap: {}
    };
  }

  const rows = XLSX.utils.sheet_to_json<(string | undefined)[]>(sheet, { header: 1 });
  const map = Object.fromEntries(rows.filter((r) => r[0] && r[1]).map((r) => [String(r[0]), String(r[1] ?? "")]));

  let idMap: Record<string, string> = {};
  try {
    idMap = JSON.parse(map.id_map ?? "{}");
  } catch {
    idMap = {};
  }

  return {
    workbookVersion: map.workbook_version ?? "0.1",
    lastAppWriteTimestamp: map.last_app_write_timestamp ?? "",
    lastLoadedTimestamp: map.last_loaded_timestamp ?? "",
    schemaHash: map.schema_hash ?? "",
    idMap
  };
}

function writeMeta(workbook: XLSX.WorkBook, meta: WorkbookMeta): void {
  const rows = [
    ["workbook_version", meta.workbookVersion],
    ["last_app_write_timestamp", meta.lastAppWriteTimestamp],
    ["last_loaded_timestamp", meta.lastLoadedTimestamp],
    ["schema_hash", meta.schemaHash],
    ["id_map", JSON.stringify(meta.idMap)]
  ];
  workbook.Sheets[META_SHEET] = XLSX.utils.aoa_to_sheet(rows);
  if (!workbook.SheetNames.includes(META_SHEET)) {
    workbook.SheetNames.push(META_SHEET);
  }
}

export function normalizeWorkbook(filePath: string): WorkbookValidation {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const meta = readMeta(workbook);

  const companionSheets = [
    "_khal_domains",
    "_khal_ends",
    "_khal_affairs",
    "_khal_interests",
    "_khal_tasks",
    "_khal_plans",
    "_khal_metrics",
    "_khal_mission_nodes"
  ];

  for (const sheetName of companionSheets) {
    if (!workbook.Sheets[sheetName]) {
      workbook.Sheets[sheetName] = XLSX.utils.aoa_to_sheet([["id"]]);
      workbook.SheetNames.push(sheetName);
    }
  }

  meta.lastAppWriteTimestamp = new Date().toISOString();
  meta.schemaHash = "khal-v0.1";
  writeMeta(workbook, meta);
  XLSX.writeFile(workbook, filePath, { bookType: "xlsx" });

  return validateWorkbook(filePath);
}

export function loadWorkbookState(filePath: string): KhalState & { meta: WorkbookMeta } {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const meta = readMeta(workbook);

  const affairsSheetName = resolveSheetName(workbook, "Affairs");
  const interestsSheetName = resolveSheetName(workbook, "Interests");
  if (!affairsSheetName || !interestsSheetName) {
    throw new Error("Workbook does not contain required Affairs/Interests sheets.");
  }

  const affairRows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[affairsSheetName], { header: 1, raw: true });
  const interestRows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[interestsSheetName], { header: 1, raw: true });

  const affairs = parseAffairsRows(affairRows, meta.idMap);
  const interests = parseInterestsRows(interestRows, meta.idMap);
  const tasks = [...parseTaskRows(affairRows, "Affairs", meta.idMap), ...parseTaskRows(interestRows, "Intrests", meta.idMap)];

  const warRoomSheet = workbook.Sheets["War Room"];
  const warRoomRows = XLSX.utils.sheet_to_json<unknown[]>(warRoomSheet, { header: 1, raw: false });
  const warRoomLines = warRoomRows.flat().map((v) => normalizeText(v)).filter(Boolean);

  const now = new Date().toISOString();
  meta.lastLoadedTimestamp = now;
  writeMeta(workbook, meta);
  XLSX.writeFile(workbook, filePath, { bookType: "xlsx" });

  const domains = Array.from(new Set([...affairs.map((a) => a.domainId), ...interests.map((i) => i.domainId)])).map((domainId) => ({
    id: domainId,
    name: domainId.replace(/-/g, " "),
    createdAt: now,
    updatedAt: now
  }));

  return {
    domains,
    ends: [],
    fragilities: [],
    affairs,
    interests,
    tasks,
    missionNodes: [],
    warRoomNarrative: parseWarRoomNarrative(warRoomLines),
    meta
  };
}

function updateSheetCell(sheet: XLSX.WorkSheet, cellRef: string, value: string | number): void {
  XLSX.utils.sheet_add_aoa(sheet, [[value]], { origin: cellRef });
}

export function upsertAffair(filePath: string, affair: Partial<Affair> & Pick<Affair, "id" | "title">): Affair {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const affairsSheetName = resolveSheetName(workbook, "Affairs");
  if (!affairsSheetName) throw new Error("Affairs sheet not found.");
  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[affairsSheetName], { header: 1, raw: true });
  const meta = readMeta(workbook);

  let targetRowIndex = -1;
  for (const [rowRef, id] of Object.entries(meta.idMap)) {
    if (id === affair.id && rowRef.startsWith("Affairs!")) {
      targetRowIndex = Number(rowRef.split("!")[1]) - 1;
      break;
    }
  }

  if (targetRowIndex === -1) {
    targetRowIndex = Math.max(rows.length, 3);
    meta.idMap[`Affairs!${targetRowIndex + 1}`] = affair.id;
  }

  const sheet = workbook.Sheets[affairsSheetName];
  updateSheetCell(sheet, `A${targetRowIndex + 1}`, affair.domainId ?? "General");
  updateSheetCell(sheet, `B${targetRowIndex + 1}`, affair.title);
  updateSheetCell(sheet, `C${targetRowIndex + 1}`, affair.timeline ?? "");
  updateSheetCell(sheet, `D${targetRowIndex + 1}`, affair.stakes ?? 0);
  updateSheetCell(sheet, `E${targetRowIndex + 1}`, affair.risk ?? 0);
  updateSheetCell(sheet, `F${targetRowIndex + 1}`, computeFragilityScore(affair.stakes ?? 0, affair.risk ?? 0));
  updateSheetCell(sheet, `G${targetRowIndex + 1}`, affair.status ?? "NOT STARTED");
  updateSheetCell(sheet, `H${targetRowIndex + 1}`, (affair.completionPct ?? 0) / 100);

  const newAffair: Affair = {
    id: affair.id,
    domainId: affair.domainId ?? "general",
    title: affair.title,
    timeline: affair.timeline ?? "",
    stakes: affair.stakes ?? 0,
    risk: affair.risk ?? 0,
    fragilityScore: computeFragilityScore(affair.stakes ?? 0, affair.risk ?? 0),
    status: affair.status ?? "NOT_STARTED",
    completionPct: affair.completionPct ?? 0
  };

  const recordMeta = readMeta(workbook);
  recordMeta.lastAppWriteTimestamp = new Date().toISOString();
  recordMeta.idMap = meta.idMap;
  writeMeta(workbook, recordMeta);
  XLSX.writeFile(workbook, filePath, { bookType: "xlsx" });

  return newAffair;
}

export function upsertInterest(filePath: string, interest: Partial<Interest> & Pick<Interest, "id" | "title">): Interest {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const interestsSheetName = resolveSheetName(workbook, "Interests");
  if (!interestsSheetName) throw new Error("Interests sheet not found.");
  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[interestsSheetName], { header: 1, raw: true });
  const meta = readMeta(workbook);

  let targetRowIndex = -1;
  for (const [rowRef, id] of Object.entries(meta.idMap)) {
    if (id === interest.id && rowRef.startsWith("Intrests!")) {
      targetRowIndex = Number(rowRef.split("!")[1]) - 1;
      break;
    }
  }

  if (targetRowIndex === -1) {
    targetRowIndex = Math.max(rows.length, 3);
    meta.idMap[`Intrests!${targetRowIndex + 1}`] = interest.id;
  }

  const sheet = workbook.Sheets[interestsSheetName];
  updateSheetCell(sheet, `A${targetRowIndex + 1}`, interest.domainId ?? "General");
  updateSheetCell(sheet, `B${targetRowIndex + 1}`, interest.title);
  updateSheetCell(sheet, `C${targetRowIndex + 1}`, interest.stakes ?? 0);
  updateSheetCell(sheet, `D${targetRowIndex + 1}`, interest.risk ?? 0);
  updateSheetCell(sheet, `E${targetRowIndex + 1}`, interest.asymmetry ?? "");
  updateSheetCell(sheet, `F${targetRowIndex + 1}`, interest.upside ?? "");
  updateSheetCell(sheet, `G${targetRowIndex + 1}`, interest.downside ?? "");
  updateSheetCell(sheet, `H${targetRowIndex + 1}`, interest.convexity ?? 0);
  updateSheetCell(sheet, `I${targetRowIndex + 1}`, interest.status ?? "NOT STARTED");
  updateSheetCell(sheet, `J${targetRowIndex + 1}`, interest.notes ?? "");

  const updated: Interest = {
    id: interest.id,
    domainId: interest.domainId ?? "general",
    title: interest.title,
    stakes: interest.stakes ?? 0,
    risk: interest.risk ?? 0,
    convexity: interest.convexity ?? 0,
    asymmetry: interest.asymmetry,
    upside: interest.upside,
    downside: interest.downside,
    status: interest.status ?? "NOT_STARTED",
    notes: interest.notes
  };

  const recordMeta = readMeta(workbook);
  recordMeta.lastAppWriteTimestamp = new Date().toISOString();
  recordMeta.idMap = meta.idMap;
  writeMeta(workbook, recordMeta);
  XLSX.writeFile(workbook, filePath, { bookType: "xlsx" });

  return updated;
}

export function upsertTask(filePath: string, task: Partial<Task> & Pick<Task, "id" | "title" | "sourceType" | "sourceId">): Task {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const meta = readMeta(workbook);
  const baseLogicalSheetName = task.sourceType === "AFFAIR" ? "Affairs" : "Interests";
  const baseSheetName = resolveSheetName(workbook, baseLogicalSheetName);
  if (!baseSheetName) throw new Error(`${baseLogicalSheetName} sheet not found.`);
  const sheet = workbook.Sheets[baseSheetName];

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true });
  let targetRowIndex = -1;
  for (const [rowRef, id] of Object.entries(meta.idMap)) {
    if (id === task.id && rowRef.startsWith(`${baseSheetName}!task-`)) {
      targetRowIndex = Number(rowRef.split("-")[1]) - 1;
      break;
    }
  }

  if (targetRowIndex === -1) {
    targetRowIndex = Math.max(rows.length, 14);
    meta.idMap[`${baseSheetName}!task-${targetRowIndex + 1}`] = task.id;
  }

  updateSheetCell(sheet, `A${targetRowIndex + 1}`, task.sourceId);
  updateSheetCell(sheet, `B${targetRowIndex + 1}`, task.title);
  updateSheetCell(sheet, `C${targetRowIndex + 1}`, task.effortEstimate ?? 1);
  updateSheetCell(sheet, `D${targetRowIndex + 1}`, task.dueDate ?? "");
  updateSheetCell(sheet, `E${targetRowIndex + 1}`, task.status ?? "NOT STARTED");
  updateSheetCell(sheet, `F${targetRowIndex + 1}`, "Self");

  const output: Task = {
    id: task.id,
    sourceType: task.sourceType,
    sourceId: task.sourceId,
    dependencyIds: task.dependencyIds ?? [],
    title: task.title,
    horizon: task.horizon ?? "WEEK",
    dueDate: task.dueDate,
    status: task.status ?? "NOT_STARTED",
    effortEstimate: task.effortEstimate
  };

  const recordMeta = readMeta(workbook);
  recordMeta.lastAppWriteTimestamp = new Date().toISOString();
  recordMeta.idMap = meta.idMap;
  writeMeta(workbook, recordMeta);
  XLSX.writeFile(workbook, filePath, { bookType: "xlsx" });

  return output;
}

export * from "@khal/domain";
