import { NextResponse } from "next/server";
import { existsSync, openSync, closeSync } from "node:fs";
import * as XLSX from "xlsx";
import { readSettings } from "../../../../lib/settings";

export const runtime = "nodejs";

export async function GET() {
  const settings = await readSettings();
  const workbookPath = settings.workbookPath;

  const result: Record<string, unknown> = {
    workbookPath,
    cwd: process.cwd(),
    exists: existsSync(workbookPath)
  };

  let fsOpenOk = false;
  let fsOpenError: string | undefined;
  try {
    const fd = openSync(workbookPath, "r");
    closeSync(fd);
    fsOpenOk = true;
  } catch (error) {
    fsOpenError = error instanceof Error ? error.message : "Unknown fs open error";
  }

  let xlsxReadOk = false;
  let xlsxReadError: string | undefined;
  let sheets: string[] = [];
  try {
    const workbook = XLSX.readFile(workbookPath, { cellDates: true });
    sheets = workbook.SheetNames;
    xlsxReadOk = true;
  } catch (error) {
    xlsxReadError = error instanceof Error ? error.message : "Unknown xlsx read error";
  }

  result.fsOpenOk = fsOpenOk;
  result.fsOpenError = fsOpenError;
  result.xlsxReadOk = xlsxReadOk;
  result.xlsxReadError = xlsxReadError;
  result.sheets = sheets;

  const status = fsOpenOk && xlsxReadOk ? 200 : 500;
  return NextResponse.json(result, { status });
}

