import { promises as fs } from "node:fs";
import path from "node:path";
import { existsSync } from "node:fs";

const SETTINGS_PATH = path.resolve(process.cwd(), "..", "..", ".khal.local.json");

export interface KhalSettings {
  dbPath: string;
}

export async function readSettings(): Promise<KhalSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<KhalSettings>;
    if (parsed.dbPath) return { dbPath: parsed.dbPath };
  } catch {
    // ignore and use fallback
  }

  const candidates = [
    path.resolve(process.cwd(), "data", "KHAL.sqlite"),
    path.resolve(process.cwd(), "..", "data", "KHAL.sqlite"),
    path.resolve(process.cwd(), "..", "..", "data", "KHAL.sqlite")
  ];

  return { dbPath: candidates.find((candidate) => existsSync(candidate)) ?? candidates[0] };
}

export async function writeSettings(next: KhalSettings): Promise<void> {
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(next, null, 2), "utf-8");
}