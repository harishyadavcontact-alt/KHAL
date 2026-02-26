import path from "node:path";
import { normalizeWorkbook } from "@khal/excel-io";

const workbookPath = process.argv[2] ?? path.resolve(process.cwd(), "Genesis.xlsx");
const result = normalizeWorkbook(workbookPath);

if (!result.ok) {
  console.error("Normalization warnings:", result.issues.join(", "));
  process.exitCode = 1;
} else {
  console.log("Workbook normalized:", workbookPath);
}