import { NextResponse } from "next/server";
import { z } from "zod";
import { readSettings, writeSettings } from "../../../../lib/settings";
import { validateWorkbook } from "@khal/excel-io";

export const runtime = "nodejs";

const schema = z.object({
  workbookPath: z.string().min(1)
});

export async function GET() {
  try {
    const settings = await readSettings();
    const validation = validateWorkbook(settings.workbookPath);
    return NextResponse.json({ workbookPath: settings.workbookPath, validation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to validate workbook";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    await writeSettings({ workbookPath: parsed.workbookPath });
    const validation = validateWorkbook(parsed.workbookPath);
    return NextResponse.json({ workbookPath: parsed.workbookPath, validation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save workbook settings";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
