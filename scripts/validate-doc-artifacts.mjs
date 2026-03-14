import { readFileSync, existsSync, readdirSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const docsRoot = path.join(repoRoot, "docs");

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function validateFileReference(refPath, origin, errors) {
  if (typeof refPath !== "string" || !refPath.trim()) return;
  const fullPath = path.join(repoRoot, refPath);
  if (!existsSync(fullPath)) {
    errors.push(`${origin} references missing file: ${refPath}`);
  } else if (!statSync(fullPath).isFile()) {
    errors.push(`${origin} references non-file path: ${refPath}`);
  }
}

function validateJsonArtifact(filePath, data, errors) {
  const origin = rel(filePath);

  if (origin.endsWith(".canvas")) {
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      errors.push(`${origin} must contain nodes[] and edges[]`);
      return;
    }
    for (const node of data.nodes) {
      if (node?.type === "file" && typeof node.file === "string") {
        validateFileReference(node.file, origin, errors);
      }
    }
    return;
  }

  if (origin === "docs/knowledge/documentation-manifest.json") {
    if (!Array.isArray(data.items)) {
      errors.push(`${origin} must contain items[]`);
      return;
    }
    for (const item of data.items) {
      validateFileReference(item?.file, origin, errors);
      if (Array.isArray(item?.source_files)) {
        for (const sourceFile of item.source_files) {
          validateFileReference(sourceFile, `${origin} source_files`, errors);
        }
      }
    }
    return;
  }

  if (origin === "docs/knowledge/decision-framework.json") {
    if (!Array.isArray(data.layers) || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      errors.push(`${origin} must contain layers[], nodes[], and edges[]`);
      return;
    }
    const layerIds = new Set();
    for (const layer of data.layers) {
      if (!layer?.id) {
        errors.push(`${origin} has a layer without id`);
        continue;
      }
      if (layerIds.has(layer.id)) {
        errors.push(`${origin} has duplicate layer id: ${layer.id}`);
      }
      layerIds.add(layer.id);
    }

    const nodeIds = new Set();
    for (const node of data.nodes) {
      if (!node?.id) {
        errors.push(`${origin} has a node without id`);
        continue;
      }
      if (nodeIds.has(node.id)) {
        errors.push(`${origin} has duplicate node id: ${node.id}`);
      }
      nodeIds.add(node.id);
      if (!layerIds.has(node.layer)) {
        errors.push(`${origin} node ${node.id} references unknown layer: ${node.layer}`);
      }
      if (Array.isArray(node.source_files)) {
        for (const sourceFile of node.source_files) {
          validateFileReference(sourceFile, `${origin} node ${node.id} source_files`, errors);
        }
      }
    }

    for (const edge of data.edges) {
      if (!nodeIds.has(edge?.from)) {
        errors.push(`${origin} edge references unknown from node: ${edge?.from}`);
      }
      if (!nodeIds.has(edge?.to)) {
        errors.push(`${origin} edge references unknown to node: ${edge?.to}`);
      }
    }

    if (Array.isArray(data._meta?.source_files)) {
      for (const sourceFile of data._meta.source_files) {
        validateFileReference(sourceFile, `${origin} _meta.source_files`, errors);
      }
    }
    return;
  }

  if (origin.startsWith("docs/ui/")) {
    validateFileReference(data.state_link, origin, errors);
    if (Array.isArray(data.sequence_links)) {
      for (const sequenceLink of data.sequence_links) {
        validateFileReference(sequenceLink, origin, errors);
      }
    }
    if (Array.isArray(data.data_links)) {
      for (const dataLink of data.data_links) {
        validateFileReference(dataLink, origin, errors);
      }
    }
    if (typeof data.schema_link === "string") {
      validateFileReference(data.schema_link, origin, errors);
    }
    if (data._meta?.source_files && Array.isArray(data._meta.source_files)) {
      for (const sourceFile of data._meta.source_files) {
        validateFileReference(sourceFile, `${origin} _meta.source_files`, errors);
      }
    }
  }
}

const errors = [];

if (!existsSync(docsRoot)) {
  console.error("docs directory not found");
  process.exit(1);
}

for (const filePath of walk(docsRoot)) {
  if (!/\.(json|canvas)$/.test(filePath)) continue;
  try {
    const data = readJson(filePath);
    validateJsonArtifact(filePath, data, errors);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`${rel(filePath)} failed to parse: ${message}`);
  }
}

const reportDir = path.join(repoRoot, "artifacts", "quality");
mkdirSync(reportDir, { recursive: true });
writeFileSync(
  path.join(reportDir, "docs-validate.json"),
  JSON.stringify(
    {
      suite: "docs-validate",
      status: errors.length > 0 ? "failed" : "passed",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      failures: errors.map((message) => ({ message })),
      metrics: {
        docsFilesScanned: walk(docsRoot).length
      }
    },
    null,
    2
  )
);

if (errors.length > 0) {
  console.error("Documentation validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Documentation artifacts validated.");
