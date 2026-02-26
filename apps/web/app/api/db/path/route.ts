import { NextResponse } from "next/server";
import { z } from "zod";
import { readSettings, writeSettings } from "../../../../lib/settings";

export const runtime = "nodejs";

const schema = z.object({
  dbPath: z.string().min(1)
});

export async function GET() {
  const settings = await readSettings();
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.parse(body);
  await writeSettings({ dbPath: parsed.dbPath });
  return NextResponse.json({ ok: true, dbPath: parsed.dbPath });
}