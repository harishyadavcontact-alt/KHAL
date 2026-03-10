import { copyFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { initDatabase, resolveDbPath } from "@khal/sqlite-core";

function cwdCandidates() {
  return [
    process.cwd(),
    path.resolve(process.cwd(), ".."),
    path.resolve(process.cwd(), "..", "..")
  ];
}

export function resolveDataRoot(): string {
  for (const cwd of cwdCandidates()) {
    const candidate = path.resolve(cwd, "data");
    if (existsSync(candidate)) return candidate;
  }
  return path.resolve(process.cwd(), "..", "..", "data");
}

export function resolveTemplateDbPath(): string {
  return path.resolve(resolveDataRoot(), "KHAL.sqlite");
}

export function slugifyOperatorName(name: string): string {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return normalized || "operator";
}

export function resolveOperatorDbPath(nameOrSlug: string): string {
  return path.resolve(resolveDataRoot(), "operators", `${slugifyOperatorName(nameOrSlug)}.sqlite`);
}

export async function listOperatorDbPaths(): Promise<string[]> {
  const operatorDir = path.resolve(resolveDataRoot(), "operators");
  try {
    const files = await readdir(operatorDir, { withFileTypes: true });
    return files
      .filter((entry) => entry.isFile() && entry.name.endsWith(".sqlite"))
      .map((entry) => path.resolve(operatorDir, entry.name))
      .sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
}

export async function resolveDefaultDbPath(): Promise<string> {
  const operators = await listOperatorDbPaths();
  if (operators.length === 1) return operators[0];
  return resolveTemplateDbPath();
}

export async function ensureOperatorDb(args: { name: string; sourceDbPath?: string }): Promise<string> {
  const dbPath = resolveOperatorDbPath(args.name);
  if (existsSync(dbPath)) return dbPath;

  await mkdir(path.dirname(dbPath), { recursive: true });
  const sourceDbPath = args.sourceDbPath ? resolveDbPath(args.sourceDbPath) : resolveTemplateDbPath();
  if (existsSync(sourceDbPath)) {
    await copyFile(sourceDbPath, dbPath);
  } else {
    initDatabase(dbPath);
  }

  initDatabase(dbPath);
  return dbPath;
}
