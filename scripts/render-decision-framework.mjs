import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const specPath = path.join(repoRoot, "docs", "knowledge", "decision-framework.json");
const dotPath = path.join(repoRoot, "docs", "architecture", "decision-framework.dot");
const canvasPath = path.join(repoRoot, "docs", "knowledge", "decision-framework.canvas");

const spec = JSON.parse(readFileSync(specPath, "utf8"));

const nodesByLayer = new Map();
for (const layer of spec.layers) {
  nodesByLayer.set(layer.id, spec.nodes.filter((node) => node.layer === layer.id));
}

const dotLines = [];
dotLines.push("digraph decision_framework {");
dotLines.push("  rankdir=LR");
dotLines.push('  graph [fontname="monospace"]');
dotLines.push('  node [shape=box fontname="monospace" fontsize=10 style="rounded"]');
dotLines.push('  edge [fontname="monospace" fontsize=9]');
dotLines.push("");

for (const layer of spec.layers) {
  dotLines.push(`  subgraph cluster_${layer.id} {`);
  dotLines.push(`    label="${layer.label}"`);
  dotLines.push('    color="#334155"');
  dotLines.push('    style="rounded"');
  for (const node of nodesByLayer.get(layer.id) ?? []) {
    const label = `${node.label}\\n(${node.kind})`;
    dotLines.push(`    ${node.id} [label="${label}"]`);
  }
  dotLines.push("  }");
  dotLines.push("");
}

for (const edge of spec.edges) {
  dotLines.push(`  ${edge.from} -> ${edge.to} [label="${edge.relation}"]`);
}
dotLines.push("}");

const canvas = {
  nodes: [],
  edges: []
};

const layerLayout = {
  orientation: { x: 0, y: 0 },
  decision_modes: { x: 620, y: 0 },
  decision_objects: { x: 1300, y: 0 },
  craft_ladder: { x: 1980, y: 0 },
  governance: { x: 2660, y: 0 },
  planning_execution: { x: 3340, y: 0 },
  scaling: { x: 4020, y: 0 }
};

const manualNodePositions = {
  war_room_matrix: { x: 0, y: 180 },
  volatility_source: { x: 0, y: 340 },
  law: { x: 0, y: 500 },

  source_mode: { x: 620, y: 120 },
  domain_mode: { x: 620, y: 300 },
  affair_mode: { x: 620, y: 480 },
  interest_mode: { x: 620, y: 660 },
  craft_mode: { x: 620, y: 840 },
  lineage_mode: { x: 620, y: 1020 },
  mission_mode: { x: 620, y: 1200 },

  domain: { x: 1300, y: 300 },
  affair: { x: 1300, y: 540 },
  interest: { x: 1300, y: 780 },
  craft: { x: 1300, y: 1020 },

  heap: { x: 1980, y: 160 },
  model: { x: 1980, y: 340 },
  framework: { x: 1980, y: 520 },
  barbell: { x: 1980, y: 700 },
  heuristic: { x: 1980, y: 880 },
  wargame: { x: 1980, y: 1140 },
  scenario: { x: 1980, y: 1320 },
  threat: { x: 1980, y: 1500 },
  response: { x: 1980, y: 1680 },

  doctrine_rulebook: { x: 2660, y: 360 },
  doctrine_rule: { x: 2660, y: 580 },

  plan: { x: 3340, y: 720 },
  task: { x: 3340, y: 980 },
  mission_graph: { x: 3340, y: 1240 },

  lineage_node: { x: 4020, y: 760 },
  lineage_risk: { x: 4020, y: 1040 }
};

spec.layers.forEach((layer) => {
  const layerPosition = layerLayout[layer.id];
  canvas.nodes.push({
    id: `layer-${layer.id}`,
    type: "text",
    text: `${layer.label}\n${layer.description}`,
    x: layerPosition.x,
    y: layerPosition.y,
    width: 360,
    height: 100
  });
});

for (const node of spec.nodes) {
  const position = manualNodePositions[node.id];
  canvas.nodes.push({
    id: node.id,
    type: "text",
    text: `${node.label}\n${node.kind}`,
    x: position.x,
    y: position.y,
    width: 340,
    height: 96
  });
}

spec.edges.forEach((edge, index) => {
  canvas.edges.push({
    id: `edge-${index + 1}`,
    fromNode: edge.from,
    toNode: edge.to,
    label: edge.relation
  });
});

mkdirSync(path.dirname(dotPath), { recursive: true });
mkdirSync(path.dirname(canvasPath), { recursive: true });
writeFileSync(dotPath, `${dotLines.join("\n")}\n`);
writeFileSync(canvasPath, `${JSON.stringify(canvas, null, 2)}\n`);

console.log("Decision framework artifacts rendered.");
