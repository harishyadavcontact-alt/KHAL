export type CandidateEntityType =
  | "affair"
  | "interest"
  | "craft"
  | "stack"
  | "protocol"
  | "rule"
  | "heuristic"
  | "wargame"
  | "scenario"
  | "threat"
  | "response"
  | "power_law";

export type AnchorType = "entity" | "grouping" | "directive" | "judgment" | "dependency" | "weak_link" | "lineage";

export type DraftBlock = {
  id: string;
  rawText: string;
  startLine: number;
  endLine: number;
  blockKind: "paragraph" | "list";
};

export type DraftBlockLens = {
  blockId: string;
  title: string;
  summary: string;
  dominantSignal: "entity" | "grouping" | "rule" | "scenario" | "open";
  anchorIds: string[];
};

export type StructuralAnchor = {
  id: string;
  blockId: string;
  anchorType: AnchorType;
  candidateEntityType: CandidateEntityType;
  confidence: number;
  status: "open" | "accepted" | "dismissed";
  sourceSpan: { startLine: number; endLine: number };
  title: string;
  notes: string;
  value: string;
  sourcePreview: string;
  relatedValues?: string[];
  linkedParentCandidate?: string;
};

export type InferredStructure = {
  affairs: string[];
  interests: string[];
  crafts: string[];
  stacks: Array<{ name: string; items: string[] }>;
  protocols: string[];
  rules: string[];
  heuristics: string[];
  wargames: string[];
  scenarios: string[];
  threats: string[];
  responses: string[];
  powerLaws: string[];
};

export type WeakLink = {
  code: string;
  message: string;
  related?: string;
};

export type DraftInference = {
  blocks: DraftBlock[];
  blockLenses: DraftBlockLens[];
  inferred: InferredStructure;
  anchors: StructuralAnchor[];
  openQuestions: string[];
  weakLinks: WeakLink[];
};

export type PromotionEvent = {
  id: string;
  anchorId: string;
  createdEntityType: CandidateEntityType;
  createdEntityId: string;
  sourceText: string;
  timestamp: string;
};

export type DraftLinkEntityType = CandidateEntityType | "domain" | "law" | "lineage_node" | "lineage_entity";

export type DraftEntityLink = {
  id: string;
  anchorId: string;
  entityType: DraftLinkEntityType;
  entityId: string;
  entityLabel?: string;
  entityRoute?: string;
  linkStatus: "linked" | "draft_only" | "suggested";
  sourceText: string;
  matchReason?: string;
};

export type CompileReadableDraft = {
  draft: {
    id: string;
    raw_text: string;
    inferred_structure: InferredStructure;
    updated_at: string;
  };
  draft_blocks: Array<{
    id: string;
    raw_text: string;
    block_kind: DraftBlock["blockKind"];
    start_position: number;
    end_position: number;
  }>;
  structural_anchors: Array<{
    id: string;
    block_id: string;
    anchor_type: AnchorType;
    candidate_entity_type: CandidateEntityType;
    confidence: number;
    status: StructuralAnchor["status"];
    source_span: StructuralAnchor["sourceSpan"];
    title: string;
    notes: string;
    related_values?: string[];
  }>;
};

type MutableStructure = {
  affairs: string[];
  interests: string[];
  crafts: string[];
  stacks: Array<{ name: string; items: string[] }>;
  protocols: string[];
  rules: string[];
  heuristics: string[];
  wargames: string[];
  scenarios: string[];
  threats: string[];
  responses: string[];
  powerLaws: string[];
};

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "item";
}

function cleanValue(value: string): string {
  return value.trim().replace(/^["'`]+|["'`]+$/g, "").replace(/[.;:]+$/g, "").trim();
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.map(cleanValue).filter(Boolean))];
}

function splitBlocks(input: string): DraftBlock[] {
  const lines = input.split(/\r?\n/);
  const blocks: DraftBlock[] = [];
  let start = -1;
  let current: string[] = [];

  const flush = (endLine: number) => {
    if (!current.length || start < 0) return;
    const rawText = current.join("\n").trim();
    if (!rawText) return;
    const nonEmpty = current.filter((line) => line.trim());
    const isList = nonEmpty.every((line) => /^[-*]|^\d+[.)]/.test(line.trim()));
    blocks.push({
      id: `block_${blocks.length + 1}`,
      rawText,
      startLine: start + 1,
      endLine,
      blockKind: isList ? "list" : "paragraph"
    });
  };

  lines.forEach((line, index) => {
    if (!line.trim()) {
      flush(index);
      start = -1;
      current = [];
      return;
    }
    if (start === -1) start = index;
    current.push(line);
  });
  flush(lines.length);
  return blocks;
}

function splitSentences(text: string): string[] {
  return text
    .split(/\r?\n/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((sentence) => cleanValue(sentence.replace(/^[-*\d.)\s]+/, "")))
    .filter(Boolean);
}

function extractListItems(clause: string): string[] {
  return dedupe(
    clause
      .split(/,|\band\b|\bor\b/gi)
      .map((item) => item.replace(/^[-*\d.)\s]+/, ""))
      .filter(Boolean)
  );
}

function titleFromBlock(text: string): string {
  const firstLine = cleanValue(text.split(/\r?\n/)[0] ?? "");
  if (!firstLine) return "Untitled block";
  return firstLine.length > 72 ? `${firstLine.slice(0, 69)}...` : firstLine;
}

function inferDominantSignal(text: string): DraftBlockLens["dominantSignal"] {
  const lower = text.toLowerCase();
  if (/^(never|always|avoid|do not|don't|must|should)\b/m.test(lower)) return "rule";
  if (/\b(stack|bundle|cluster|group)\b/.test(lower)) return "grouping";
  if (/\b(if .* then|scenario|wargame|war-game|simulate|threat|response)\b/.test(lower)) return "scenario";
  if (/\b(affair|interest|craft|protocol|heuristic|mostly comes down to|things that matter for)\b/.test(lower)) return "entity";
  return "open";
}

function parseBlock(block: DraftBlock, inferred: MutableStructure) {
  const text = block.rawText.trim();
  const lower = text.toLowerCase();
  const lines = text.split(/\r?\n/);
  const sentences = splitSentences(text);

  for (const sentence of sentences) {
    const sentenceLower = sentence.toLowerCase();

    const affairMatch = sentence.match(/^(?:affair|obligation|domain)\s*:\s*(.+)$/i);
    if (affairMatch) inferred.affairs.push(affairMatch[1]);

    const interestMatch = sentence.match(/^(?:interest|focus|goal)\s*:\s*(.+)$/i);
    if (interestMatch) inferred.interests.push(interestMatch[1]);

    const craftMatch = sentence.match(/^(?:craft|playbook|method|system)\s*:\s*(.+)$/i);
    if (craftMatch) inferred.crafts.push(craftMatch[1]);

    const mostlyComesDownTo = sentence.match(/^(.+?)\s+mostly comes down to\s+(.+)$/i);
    if (mostlyComesDownTo) {
      inferred.interests.push(mostlyComesDownTo[1]);
      inferred.powerLaws.push(...extractListItems(mostlyComesDownTo[2]));
    }

    const mattersFor = sentence.match(/^(?:things that matter for|for)\s+(.+)$/i);
    if (mattersFor) inferred.interests.push(mattersFor[1]);

    const dependsOn = sentence.match(/^(.+?)\s+(?:depends on|relies on|is driven by)\s+(.+)$/i);
    if (dependsOn) {
      inferred.interests.push(dependsOn[1]);
      inferred.powerLaws.push(...extractListItems(dependsOn[2]));
    }

    if (/^(never|always|avoid|do not|don't|must|should)\b/.test(sentenceLower)) {
      inferred.rules.push(sentence);
      inferred.protocols.push(sentence);
    }

    if (/\b(usually|mostly|often|tends to|likely|generally|rarely)\b/.test(sentenceLower)) {
      inferred.heuristics.push(sentence);
    }

    if (/\b(if .* then|scenario|wargame|war-game|simulate)\b/.test(sentenceLower)) {
      inferred.scenarios.push(sentence);
      inferred.wargames.push(sentence);
    }

    if (/\b(threat|risk|fragile|downside|failure|ruin)\b/.test(sentenceLower)) {
      inferred.threats.push(sentence);
    }

    if (/\b(response|mitigate|hedge|counter|fallback|protect|reduce intensity)\b/.test(sentenceLower)) {
      inferred.responses.push(sentence);
    }
  }

  const stackMatch = text.match(/^(.+?)\s+stack\s*:\s*(.+)$/im);
  if (stackMatch) {
    inferred.stacks.push({
      name: cleanValue(stackMatch[1]),
      items: extractListItems(stackMatch[2])
    });
  }

  const headingWithList = lines[0]?.match(/^(.+?):\s*$/);
  if (headingWithList && lines.slice(1).some((line) => /^[-*]|\d+[.)]/.test(line.trim()))) {
    inferred.stacks.push({
      name: cleanValue(headingWithList[1]),
      items: dedupe(lines.slice(1).map((line) => line.replace(/^[-*\d.)\s]+/, "")))
    });
  }

  if (block.blockKind === "list") {
    inferred.powerLaws.push(...dedupe(lines.map((line) => line.replace(/^[-*\d.)\s]+/, ""))));
  }

  if (/\b(craft|protocol|heuristic|rulebook)\b/.test(lower) && !/^(?:craft|playbook|method|system)\s*:/i.test(text)) {
    const craftSignals = sentences.filter((sentence) => /\b(craft|protocol|heuristic|rulebook)\b/i.test(sentence));
    if (craftSignals.length > 0) inferred.crafts.push(titleFromBlock(craftSignals[0]));
  }
}

function normalizeInferred(inferred: MutableStructure): InferredStructure {
  const normalizedStacks = inferred.stacks
    .map((stack) => ({
      name: cleanValue(stack.name),
      items: dedupe(stack.items)
    }))
    .filter((stack) => stack.name && stack.items.length > 0);

  return {
    affairs: dedupe(inferred.affairs),
    interests: dedupe(inferred.interests),
    crafts: dedupe(inferred.crafts),
    stacks: normalizedStacks,
    protocols: dedupe(inferred.protocols),
    rules: dedupe(inferred.rules),
    heuristics: dedupe(inferred.heuristics),
    wargames: dedupe(inferred.wargames),
    scenarios: dedupe(inferred.scenarios),
    threats: dedupe(inferred.threats),
    responses: dedupe(inferred.responses),
    powerLaws: dedupe(inferred.powerLaws)
  };
}

function makeAnchor(base: Omit<StructuralAnchor, "id" | "status">): StructuralAnchor {
  return {
    ...base,
    id: `${base.blockId}_${base.anchorType}_${base.candidateEntityType}_${slug(base.title)}_${slug(base.value)}`,
    status: "open"
  };
}

function inferAnchors(blocks: DraftBlock[], inferred: InferredStructure): StructuralAnchor[] {
  const anchors: StructuralAnchor[] = [];

  for (const block of blocks) {
    const text = block.rawText.trim();
    const lower = text.toLowerCase();
    const sourcePreview = titleFromBlock(text);
    const sourceSpan = { startLine: block.startLine, endLine: block.endLine };

    const interestName =
      text.match(/^(.+?)\s+mostly comes down to\b/i)?.[1] ??
      text.match(/^(?:things that matter for|interest|focus|goal)\s*:?(.+)$/i)?.[1];
    if (interestName) {
      anchors.push(
        makeAnchor({
          blockId: block.id,
          anchorType: "entity",
          candidateEntityType: "interest",
          confidence: 0.84,
          sourceSpan,
          title: cleanValue(interestName),
          notes: "Likely interest or desired outcome.",
          value: text,
          sourcePreview
        })
      );
    }

    const stackMatch = text.match(/^(.+?)\s+stack\s*:\s*(.+)$/im);
    if (stackMatch) {
      anchors.push(
        makeAnchor({
          blockId: block.id,
          anchorType: "grouping",
          candidateEntityType: "stack",
          confidence: 0.88,
          sourceSpan,
          title: cleanValue(stackMatch[1]),
          notes: "Grouped reinforcing items detected.",
          value: text,
          sourcePreview,
          relatedValues: extractListItems(stackMatch[2])
        })
      );
    }

    const imperative = splitSentences(text).find((sentence) => /^(never|always|avoid|do not|don't|must|should)\b/i.test(sentence));
    if (imperative) {
      anchors.push(
        makeAnchor({
          blockId: block.id,
          anchorType: "directive",
          candidateEntityType: "rule",
          confidence: 0.9,
          sourceSpan,
          title: imperative,
          notes: "Directive language suggests a governing rule or protocol.",
          value: imperative,
          sourcePreview
        })
      );
    }

    const heuristic = splitSentences(text).find((sentence) => /\b(usually|mostly|often|tends to|likely|generally|rarely)\b/i.test(sentence));
    if (heuristic) {
      anchors.push(
        makeAnchor({
          blockId: block.id,
          anchorType: "judgment",
          candidateEntityType: "heuristic",
          confidence: 0.74,
          sourceSpan,
          title: heuristic,
          notes: "Judgment language suggests a heuristic.",
          value: heuristic,
          sourcePreview
        })
      );
    }

    const threat = splitSentences(text).find((sentence) => /\b(threat|risk|fragile|downside|failure|ruin)\b/i.test(sentence));
    if (threat) {
      anchors.push(
        makeAnchor({
          blockId: block.id,
          anchorType: "entity",
          candidateEntityType: "threat",
          confidence: 0.72,
          sourceSpan,
          title: threat,
          notes: "Threat language detected.",
          value: threat,
          sourcePreview
        })
      );
    }

    const response = splitSentences(text).find((sentence) => /\b(response|mitigate|hedge|counter|fallback|protect|reduce intensity)\b/i.test(sentence));
    if (response) {
      anchors.push(
        makeAnchor({
          blockId: block.id,
          anchorType: "dependency",
          candidateEntityType: "response",
          confidence: 0.69,
          sourceSpan,
          title: response,
          notes: "Looks like a response or hedge path.",
          value: response,
          sourcePreview
        })
      );
    }

    if (/\b(if .* then|scenario|wargame|war-game|simulate)\b/.test(lower)) {
      anchors.push(
        makeAnchor({
          blockId: block.id,
          anchorType: "dependency",
          candidateEntityType: "scenario",
          confidence: 0.7,
          sourceSpan,
          title: sourcePreview,
          notes: "Scenario-style language detected.",
          value: text,
          sourcePreview
        })
      );
    }
  }

  if (inferred.interests.length > 0 && inferred.affairs.length === 0) {
    anchors.push(
      makeAnchor({
        blockId: blocks[0]?.id ?? "block_1",
        anchorType: "lineage",
        candidateEntityType: "affair",
        confidence: 0.62,
        sourceSpan: { startLine: blocks[0]?.startLine ?? 1, endLine: blocks[0]?.endLine ?? 1 },
        title: "Parent affair missing",
        notes: "This interest needs an obligation lane or parent affair.",
        value: inferred.interests[0] ?? "Parent affair missing",
        sourcePreview: blocks[0] ? titleFromBlock(blocks[0].rawText) : "Opening block",
        linkedParentCandidate: "health / wealth / reputation / operations"
      })
    );
  }

  return dedupeAnchors(anchors);
}

function dedupeAnchors(anchors: StructuralAnchor[]): StructuralAnchor[] {
  const seen = new Set<string>();
  const result: StructuralAnchor[] = [];
  for (const anchor of anchors) {
    if (seen.has(anchor.id)) continue;
    seen.add(anchor.id);
    result.push(anchor);
  }
  return result;
}

function inferOpenQuestions(inferred: InferredStructure): string[] {
  const questions: string[] = [];

  if (inferred.interests.length > 0 && inferred.affairs.length === 0) {
    questions.push("Which affair should own this interest so it sits inside the obligations -> options hierarchy?");
  }
  if (inferred.stacks.length > 0 && inferred.crafts.length === 0) {
    questions.push("Does this stack belong to an existing craft, or is it the start of a new one?");
  }
  if (inferred.threats.length > 0 && inferred.responses.length === 0) {
    questions.push("Threat language is present. What is the explicit response, hedge, or fallback path?");
  }
  if (inferred.powerLaws.length > 0 && inferred.rules.length === 0) {
    questions.push("Which guardrail should govern the detected leverage points?");
  }

  return questions;
}

function inferWeakLinks(inferred: InferredStructure): WeakLink[] {
  const weakLinks: WeakLink[] = [];

  if (inferred.interests.length > 0 && inferred.affairs.length === 0) {
    weakLinks.push({
      code: "INTEREST_NO_PARENT",
      message: "Detected interest has no parent affair or obligation lane."
    });
  }
  if (inferred.powerLaws.length > 0 && inferred.protocols.length === 0) {
    weakLinks.push({
      code: "POWERLAW_NO_PROTOCOL",
      message: "High-leverage factors are named, but no protocol or guardrail is attached.",
      related: inferred.powerLaws[0]
    });
  }
  if (inferred.stacks.length > 0 && inferred.rules.length === 0) {
    weakLinks.push({
      code: "STACK_NO_RULE",
      message: "Important stack detected, but no governing rule is present.",
      related: inferred.stacks[0]?.name
    });
  }
  if (inferred.crafts.length > 0 && inferred.heuristics.length > 0 && inferred.protocols.length === 0) {
    weakLinks.push({
      code: "CRAFT_NO_PROTOCOL",
      message: "Craft-level thinking is present, but no protocol operationalizes it.",
      related: inferred.crafts[0]
    });
  }
  if (inferred.scenarios.length > 0 && inferred.threats.length === 0) {
    weakLinks.push({
      code: "SCENARIO_NO_THREAT",
      message: "Scenario language is present without an explicit threat surface."
    });
  }
  if (inferred.threats.length > 0 && inferred.responses.length === 0) {
    weakLinks.push({
      code: "THREAT_NO_RESPONSE",
      message: "Detected threat has no response path."
    });
  }

  return weakLinks;
}

function buildBlockLenses(blocks: DraftBlock[], anchors: StructuralAnchor[]): DraftBlockLens[] {
  return blocks.map((block) => {
    const blockAnchors = anchors.filter((anchor) => anchor.blockId === block.id);
    const dominantSignal = inferDominantSignal(block.rawText);
    const summary =
      blockAnchors[0]?.notes ??
      (dominantSignal === "open" ? "Freeform note. Keep shaping it." : `This block reads like ${dominantSignal} structure.`);

    return {
      blockId: block.id,
      title: titleFromBlock(block.rawText),
      summary,
      dominantSignal,
      anchorIds: blockAnchors.map((anchor) => anchor.id)
    };
  });
}

export function inferDraftStructure(input: string): DraftInference {
  const blocks = splitBlocks(input);
  const inferred: MutableStructure = {
    affairs: [],
    interests: [],
    crafts: [],
    stacks: [],
    protocols: [],
    rules: [],
    heuristics: [],
    wargames: [],
    scenarios: [],
    threats: [],
    responses: [],
    powerLaws: []
  };

  for (const block of blocks) {
    parseBlock(block, inferred);
  }

  const normalized = normalizeInferred(inferred);
  const anchors = inferAnchors(blocks, normalized);

  return {
    blocks,
    blockLenses: buildBlockLenses(blocks, anchors),
    inferred: normalized,
    anchors,
    openQuestions: inferOpenQuestions(normalized),
    weakLinks: inferWeakLinks(normalized)
  };
}

export function compileDraft(input: string): CompileReadableDraft {
  const inference = inferDraftStructure(input);
  return {
    draft: {
      id: `draft_${slug(input.slice(0, 32))}`,
      raw_text: input,
      inferred_structure: inference.inferred,
      updated_at: new Date().toISOString()
    },
    draft_blocks: inference.blocks.map((block) => ({
      id: block.id,
      raw_text: block.rawText,
      block_kind: block.blockKind,
      start_position: block.startLine,
      end_position: block.endLine
    })),
    structural_anchors: inference.anchors.map((anchor) => ({
      id: anchor.id,
      block_id: anchor.blockId,
      anchor_type: anchor.anchorType,
      candidate_entity_type: anchor.candidateEntityType,
      confidence: anchor.confidence,
      status: anchor.status,
      source_span: anchor.sourceSpan,
      title: anchor.title,
      notes: anchor.notes,
      related_values: anchor.relatedValues
    }))
  };
}

export function buildPromotion(anchor: StructuralAnchor): PromotionEvent {
  return {
    id: `promotion_${anchor.id}_${Date.now()}`,
    anchorId: anchor.id,
    createdEntityType: anchor.candidateEntityType,
    createdEntityId: `${anchor.candidateEntityType}_${slug(anchor.title || anchor.value)}`,
    sourceText: anchor.value,
    timestamp: new Date().toISOString()
  };
}

export function buildEntityLink(anchor: StructuralAnchor, linked = false): DraftEntityLink {
  return {
    id: `link_${anchor.id}`,
    anchorId: anchor.id,
    entityType: anchor.candidateEntityType,
    entityId: `${anchor.candidateEntityType}_${slug(anchor.title || anchor.value)}`,
    linkStatus: linked ? "linked" : "draft_only",
    sourceText: anchor.value
  };
}



