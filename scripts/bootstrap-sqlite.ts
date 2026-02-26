import { initDatabase } from "@khal/sqlite-core";

const output = initDatabase(process.argv[2]);
console.log(JSON.stringify(output, null, 2));