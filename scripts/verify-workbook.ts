import path from "node:path";
import { validateWorkbook } from "@khal/excel-io";

const workbookPath = process.argv[2] ?? path.resolve(process.cwd(), "Genesis.xlsx");
const result = validateWorkbook(workbookPath);

console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;