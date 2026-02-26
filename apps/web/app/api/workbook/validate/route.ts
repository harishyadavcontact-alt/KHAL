import { NextResponse } from "next/server";
import { z } from "zod";
import { readSettings, writeSettings } from "../../../../lib/settings";
import { validateWorkbook } from "@khal/excel-io";

const schema = z.object({
  workbookPath: z.string().min(1)
});

export async function GET() {
  const settings = await readSettings();
  const validation = validateWorkbook(settings.workbookPath);
  return NextResponse.json({ workbookPath: settings.workbookPath, validation });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.parse(body);
  await writeSettings({ workbookPath: parsed.workbookPath });
  const validation = validateWorkbook(parsed.workbookPath);
  return NextResponse.json({ workbookPath: parsed.workbookPath, validation });
}