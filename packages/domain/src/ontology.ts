export type OntologyNodeType =
  | "law"
  | "domain"
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
  | "lineage_node"
  | "lineage_entity"
  | "draft";

export type OntologyRelationType =
  | "CONTAINS"
  | "BELONGS_TO"
  | "GOVERNS"
  | "GUIDES"
  | "RESPONDS_TO"
  | "TRACKS"
  | "SUGGESTS"
  | "LOCATED_IN";

export type InvariantSeverity = "hard" | "soft";

export interface InvariantEntityRef {
  type: OntologyNodeType;
  id: string;
  parentType?: OntologyNodeType;
  parentId?: string;
}

export interface InvariantFinding {
  severity: InvariantSeverity;
  code: string;
  message: string;
  entityRef: InvariantEntityRef;
  repairHint: string;
}

export interface OntologyRelationRule {
  childType: OntologyNodeType;
  allowedParentTypes: OntologyNodeType[];
  relation: OntologyRelationType;
  severity: InvariantSeverity;
}

export const ONTOLOGY_BACKBONE: readonly OntologyRelationRule[] = [
  { childType: "domain", allowedParentTypes: ["law"], relation: "BELONGS_TO", severity: "hard" },
  { childType: "affair", allowedParentTypes: ["domain"], relation: "BELONGS_TO", severity: "hard" },
  { childType: "interest", allowedParentTypes: ["domain"], relation: "BELONGS_TO", severity: "hard" },
  { childType: "stack", allowedParentTypes: ["craft"], relation: "CONTAINS", severity: "hard" },
  { childType: "protocol", allowedParentTypes: ["craft", "stack"], relation: "CONTAINS", severity: "soft" },
  { childType: "rule", allowedParentTypes: ["craft", "protocol"], relation: "GOVERNS", severity: "soft" },
  { childType: "heuristic", allowedParentTypes: ["craft", "protocol", "rule"], relation: "GUIDES", severity: "soft" },
  { childType: "wargame", allowedParentTypes: ["craft"], relation: "CONTAINS", severity: "hard" },
  { childType: "scenario", allowedParentTypes: ["wargame"], relation: "CONTAINS", severity: "hard" },
  { childType: "threat", allowedParentTypes: ["scenario"], relation: "CONTAINS", severity: "hard" },
  { childType: "response", allowedParentTypes: ["threat"], relation: "RESPONDS_TO", severity: "hard" },
  { childType: "lineage_entity", allowedParentTypes: ["lineage_node"], relation: "LOCATED_IN", severity: "hard" }
] as const;

