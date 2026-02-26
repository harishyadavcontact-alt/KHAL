import { promises as fs } from "node:fs";
import path from "node:path";

const SETTINGS_PATH = path.resolve(process.cwd(), "..", "..", ".khal.local.json");

export interface KhalSettings {
  workbookPath: string;
}

export async function readSettings(): Promise<KhalSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf-8");
    return JSON.parse(raw) as KhalSettings;
  } catch {
    return { workbookPath: path.resolve(process.cwd(), "..", "..", "Genesis.xlsx") };
  }
}

export async function writeSettings(next: KhalSettings): Promise<void> {
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(next, null, 2), "utf-8");
}