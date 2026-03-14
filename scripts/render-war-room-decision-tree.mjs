import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const specPath = path.join(repoRoot, "docs", "knowledge", "genesis.json");
const canvasPath = path.join(repoRoot, "docs", "knowledge", "genesis.canvas");
const dotPath = path.join(repoRoot, "docs", "architecture", "genesis.dot");
const mermaidPath = path.join(repoRoot, "docs", "decision-tree", "genesis.mmd");
const mermaidMarkdownPath = path.join(repoRoot, "docs", "decision-tree", "genesis.md");

const spec = JSON.parse(readFileSync(specPath, "utf8"));
const implementationStatus = spec.implementation?.statuses ?? {};

const primaryTreeRelations = new Set([
  "contains",
  "splits_into",
  "materializes_as",
  "decomposes_into",
  "branches_into"
]);

const positions = {
  war_room: { x: 0, y: 1040 },

  state_of_the_art: { x: 520, y: 140 },
  state_of_affairs: { x: 520, y: 1120 },
  lineages: { x: 520, y: 1780 },
  mission: { x: 520, y: 2380 },
  war_gaming: { x: 520, y: 740 },
  operator_dashboard: { x: 520, y: 3380 },

  map_navigation: { x: 1040, y: 0 },
  source_of_volatility: { x: 1560, y: 0 },
  source_map_profiles: { x: 2080, y: -180 },
  state_of_art_projection: { x: 2600, y: -180 },
  state_of_art_protocol: { x: 3120, y: -180 },
  drift_parity_checks: { x: 3640, y: -180 },
  context_narrative: { x: 2600, y: -360 },
  fragility_narrative: { x: 3120, y: -360 },
  risk_reward_summary: { x: 3640, y: -360 },
  concavity_profile: { x: 4160, y: -360 },
  short_vol_exposure: { x: 4680, y: -440 },
  long_vol_exposure: { x: 4680, y: -280 },
  barrier_rules: { x: 3640, y: -20 },
  checklist_rules: { x: 4160, y: -20 },
  policy_acknowledgements: { x: 4680, y: -20 },
  domain: { x: 2080, y: 20 },
  decision_type: { x: 2600, y: -20 },
  tail_class: { x: 2600, y: 140 },
  quadrant: { x: 3120, y: 60 },
  method_posture: { x: 3640, y: 60 },

  philosophers_stone: { x: 1040, y: 420 },
  asymmetry: { x: 1560, y: 300 },
  skin_in_the_game: { x: 2080, y: 120 },
  stakes: { x: 2600, y: 40 },
  skin_capital: { x: 3120, y: -80 },
  skin_time: { x: 3120, y: 60 },
  skin_reputation: { x: 3120, y: 200 },
  skin_breach_penalty: { x: 3640, y: 200 },
  risks: { x: 2600, y: 200 },
  players_fragilistas: { x: 2600, y: 360 },
  lineage_exposure: { x: 2600, y: 520 },
  non_linearity: { x: 1560, y: 720 },
  fragility: { x: 2080, y: 660 },
  short_volatility: { x: 2600, y: 660 },
  vulnerabilities: { x: 2080, y: 840 },
  propagation: { x: 2600, y: 840 },
  irreversibility: { x: 3120, y: 840 },
  ends: { x: 1560, y: 1080 },
  hedge: { x: 2080, y: 1000 },
  edge: { x: 2080, y: 1160 },
  means: { x: 1560, y: 1400 },
  heuristics: { x: 2080, y: 1320 },
  crafts: { x: 2080, y: 1480 },
  avoid_methods: { x: 2080, y: 1640 },
  knowledge_stacks: { x: 2600, y: 1160 },
  knowledge_protocols: { x: 3120, y: 1160 },
  knowledge_rules: { x: 3640, y: 1160 },
  heaps: { x: 2600, y: 1320 },
  models: { x: 3120, y: 1320 },
  frameworks: { x: 3640, y: 1320 },
  barbell_strategies: { x: 4160, y: 1320 },
  wargames: { x: 2600, y: 1540 },
  scenarios: { x: 3120, y: 1540 },
  threats: { x: 3640, y: 1540 },
  responses: { x: 4160, y: 1540 },
  active_threat_list: { x: 4680, y: 1540 },

  affairs: { x: 1040, y: 1080 },
  interests: { x: 1040, y: 1300 },
  domain_pnl_signal: { x: 1560, y: 900 },
  thresholds: { x: 1560, y: 1020 },
  kpis: { x: 1560, y: 1160 },
  bets: { x: 1560, y: 1320 },
  lab: { x: 1560, y: 1600 },
  strategy_posture: { x: 1560, y: 1460 },
  strategy_positioning: { x: 2080, y: 1460 },
  allies: { x: 2600, y: 1400 },
  enemies: { x: 2600, y: 1520 },
  forge: { x: 2080, y: 1660 },
  wield: { x: 2600, y: 1660 },
  tinker: { x: 3120, y: 1660 },
  plans: { x: 1560, y: 1180 },
  inherited_preparation_context: { x: 2080, y: 920 },
  preparation_notes: { x: 2080, y: 1080 },
  tasks: { x: 2080, y: 1240 },
  omission_cadence: { x: 2600, y: 1180 },
  execution_readiness: { x: 2600, y: 1240 },
  fragility_entities: { x: 2080, y: 900 },

  lineage_nodes: { x: 1040, y: 1740 },
  lineage_risks: { x: 1560, y: 1740 },
  blast_radius: { x: 2080, y: 1740 },
  lineage_self: { x: 1040, y: 1920 },
  lineage_family: { x: 1560, y: 1920 },
  lineage_state: { x: 2080, y: 1920 },
  lineage_nation: { x: 2600, y: 1920 },
  lineage_humanity: { x: 3120, y: 1920 },
  lineage_nature: { x: 3640, y: 1920 },

  mission_hierarchy: { x: 1040, y: 2340 },
  mission_serial_refs: { x: 1560, y: 2240 },
  mission_parallel_refs: { x: 1560, y: 2400 },
  mission_dependency_notes: { x: 2080, y: 2240 },
  dependency_chain: { x: 1560, y: 2340 },
  readiness: { x: 2080, y: 2340 },
  no_ruin: { x: 2600, y: 2340 },

  drafts: { x: 520, y: 2740 },
  structural_anchors: { x: 1040, y: 2740 },
  promotion_events: { x: 1560, y: 2740 },
  portfolio_war_room: { x: 520, y: 3140 },
  portfolio_projects: { x: 1040, y: 3140 },
  portfolio_experiments: { x: 1560, y: 3040 },
  portfolio_decision_gates: { x: 1560, y: 3200 },
  portfolio_evidence: { x: 2080, y: 3040 },
  portfolio_ship_logs: { x: 2080, y: 3200 },
  protocol_status: { x: 1040, y: 3260 },
  life_clock: { x: 1560, y: 3260 },
  alert_queue: { x: 2080, y: 3260 },
  fog_of_maya: { x: 1040, y: 3420 },
  operational_do_now: { x: 1560, y: 3420 },
  stakes_triad: { x: 2080, y: 3420 },
  asymmetry_curve: { x: 2600, y: 3420 },
  virtue_spiral: { x: 3120, y: 3420 },
  strategic_posture_filter: { x: 3640, y: 3420 },
  do_now_copilot: { x: 1040, y: 3580 },
  no_ruin_tripwire_panel: { x: 1560, y: 3580 },
  ruin_ledger_panel: { x: 2080, y: 3580 },
  via_negativa_panel: { x: 2600, y: 3580 },
  black_swan_readiness: { x: 3120, y: 3580 },
  execution_distribution: { x: 3640, y: 3580 },
  fragility_hierarchy: { x: 4160, y: 3580 }
  ,
  decision_surface: { x: 1040, y: 720 },
  operational_filters: { x: 1560, y: 720 },
  confidence_evidence: { x: 1040, y: 560 },
  triage_actions: { x: 1040, y: 880 },
  doctrine_fixes: { x: 1560, y: 880 },
  fractal_flow_rail: { x: 2080, y: 720 },
  dependency_warnings: { x: 2600, y: 720 },
  dual_path_comparator: { x: 3120, y: 560 },
  fragilista_watchlist: { x: 3640, y: 560 },
  quadrant_heatgrid: { x: 3120, y: 720 },
  source_volatility_flow: { x: 3640, y: 720 },
  readiness_penalty_profile: { x: 4160, y: 720 },
  fragility_radar: { x: 3120, y: 880 },
  task_kill_chain: { x: 3640, y: 880 },
  risk_logic_continuum: { x: 4160, y: 880 },
  optionality_budget: { x: 4680, y: 880 },
  source_register: { x: 4680, y: 720 },
  dependency_blast_radius: { x: 3120, y: 1040 },
  hedge_coverage_matrix: { x: 3640, y: 1040 },
  doctrine_violation_feed: { x: 4160, y: 1040 },
  correlation_risk: { x: 4680, y: 1040 },
  campaign_snapshots: { x: 5200, y: 1040 },
  hud_status: { x: 1040, y: 3100 },
  system_anatomy: { x: 3640, y: 3260 },
  barbell_guardrail: { x: 4680, y: 1160 },
  asymmetry_snapshot: { x: 5200, y: 1160 },
  domain_posture: { x: 3120, y: 1400 },
  barbell_means_coverage: { x: 3640, y: 1400 },
  lineage_risk_heatgrid: { x: 4160, y: 1400 },
  active_domain_affairs: { x: 4680, y: 1400 },
  lineage_risk_register: { x: 5200, y: 1400 }
};

const groups = [
  { id: "group-root", label: "War Room", x: -120, y: 970, width: 440, height: 180, color: "6" },
  { id: "group-wargame", label: "War Gaming", x: 420, y: 440, width: 5000, height: 820, color: "3" },
  { id: "group-soa", label: "State of the Art", x: 420, y: -520, width: 4780, height: 2220, color: "4" },
  { id: "group-sof", label: "State of Affairs", x: 420, y: 820, width: 2920, height: 1060, color: "2" },
  { id: "group-lineage", label: "Lineages", x: 420, y: 1660, width: 3500, height: 420, color: "5" },
  { id: "group-mission", label: "Mission", x: 420, y: 2240, width: 2440, height: 320, color: "1" },
  { id: "group-drafts", label: "Drafts", x: 420, y: 2660, width: 1740, height: 220, color: "3" },
  { id: "group-portfolio", label: "Portfolio War Room", x: 420, y: 2960, width: 1920, height: 360, color: "6" },
  { id: "group-dashboard", label: "Operator Dashboard", x: 420, y: 3180, width: 4000, height: 540, color: "5" }
];

const dot = [];
dot.push("digraph war_room_decision_tree {");
dot.push("  rankdir=LR");
dot.push('  graph [fontname="monospace"]');
dot.push('  node [shape=box fontname="monospace" fontsize=10 style="rounded"]');
dot.push('  edge [fontname="monospace" fontsize=9]');
for (const node of spec.nodes) {
  dot.push(`  ${node.id} [label="${node.label}\\n(${node.kind})"]`);
}
for (const edge of spec.edges) {
  dot.push(`  ${edge.from} -> ${edge.to} [label="${edge.relation}"]`);
}
dot.push("}");

const mermaid = [];
mermaid.push("flowchart LR");
mermaid.push('  WR(("War Room"))');
mermaid.push("");
mermaid.push('  SOA["State of the Art"]');
mermaid.push('  SOF["State of Affairs"]');
mermaid.push('  LIN["Lineages"]');
mermaid.push('  MIS["Mission"]');
mermaid.push('  WGG["War Gaming"]');
mermaid.push('  DFT["Drafts"]');
mermaid.push('  POR["Portfolio War Room"]');
mermaid.push('  LEG_OK["Implemented"]');
mermaid.push('  LEG_PART["Partial"]');
mermaid.push('  LEG_DOC["Doctrine Only"]');
mermaid.push("");
mermaid.push("  WR --> SOA");
mermaid.push("  WR --> SOF");
mermaid.push("  WR --> WGG");
mermaid.push("  SOA -. prepares .-> SOF");
mermaid.push("  WR -. prefigures .-> DFT");
mermaid.push("");
mermaid.push('  subgraph MAP_BRANCH["Map Navigation Framework"]');
mermaid.push("    direction LR");
mermaid.push('    SRC(["Source of Volatility"])');
mermaid.push('    SMP["Source Map Profiles"]');
mermaid.push('    SAP["State of the Art Projection"]');
mermaid.push('    SAT["State of the Art Protocol"]');
mermaid.push('    DPC["Drift / Parity Checks"]');
mermaid.push('    DOM["Semantic Domain"]');
mermaid.push('    DTP{"Decision Type"}');
mermaid.push('    TAL{"Domain Tail Class"}');
mermaid.push('    QDR{"Quadrant"}');
mermaid.push('    MPS["Method Posture"]');
mermaid.push("");
mermaid.push("    SRC --> SMP --> SAP --> SAT --> DPC");
mermaid.push("    SRC --> DOM");
mermaid.push("    DOM --> DTP");
mermaid.push("    DOM --> TAL");
mermaid.push("    DTP --> QDR");
mermaid.push("    TAL --> QDR");
mermaid.push("    QDR --> MPS");
mermaid.push("  end");
mermaid.push("");
mermaid.push('  subgraph PROTOCOL_BRANCH["State of the Art Protocol"]');
mermaid.push("    direction LR");
mermaid.push('    CTX["Context Narrative"]');
mermaid.push('    FRN["Fragility Narrative"]');
mermaid.push('    RRS["Risk / Reward Summary"]');
mermaid.push('    CCP["Concavity Profile"]');
mermaid.push('    SVE["Short Vol Exposure"]');
mermaid.push('    LVE["Long Vol Exposure"]');
mermaid.push('    BRR["Barrier Rules"]');
mermaid.push('    CLR["Checklist Rules"]');
mermaid.push('    PAC["Policy Acknowledgements"]');
mermaid.push("");
mermaid.push("    SAT --> BRR --> CLR --> PAC");
mermaid.push("    SAP --> CTX");
mermaid.push("    SAP --> FRN");
mermaid.push("    SAP --> RRS");
mermaid.push("    SAP --> CCP");
mermaid.push("    CCP --> SVE");
mermaid.push("    CCP --> LVE");
mermaid.push("  end");
mermaid.push("");
mermaid.push('  subgraph STONE_BRANCH["Philosopher\'s Stone"]');
mermaid.push("    direction TB");
mermaid.push('    ASY["Asymmetry"]');
mermaid.push('    SITG["Skin in the Game"]');
mermaid.push('    STK["Stakes"]');
mermaid.push('    SCA["Capital at Risk"]');
mermaid.push('    STI["Time at Risk"]');
mermaid.push('    SRP["Reputation at Risk"]');
mermaid.push('    SBP["Breach Penalty"]');
mermaid.push('    RSK["Risks"]');
mermaid.push('    PLR["Players / Fragilistas"]');
mermaid.push('    LEX["Lineage"]');
mermaid.push('    NLR["Non-Linearity"]');
mermaid.push('    FRG["Fragility"]');
mermaid.push('    SVO["Short Volatility"]');
mermaid.push('    VUL["Vulnerabilities"]');
mermaid.push('    PRP["Propagation"]');
mermaid.push('    IRV["Irreversibility"]');
mermaid.push("");
mermaid.push("    ASY --> SITG");
mermaid.push("    SITG --> STK");
mermaid.push("    SITG --> SCA");
mermaid.push("    SITG --> STI");
mermaid.push("    SITG --> SRP");
mermaid.push("    SITG --> SBP");
mermaid.push("    SITG --> RSK");
mermaid.push("    SITG --> LEX");
mermaid.push("    ASY --> PLR");
mermaid.push("    NLR --> FRG");
mermaid.push("    FRG --> SVO");
mermaid.push("    NLR --> VUL");
mermaid.push("    NLR --> PRP");
mermaid.push("    NLR --> IRV");
mermaid.push("  end");
mermaid.push("");
mermaid.push('  subgraph ENDS_BRANCH["Ends / Barbell Posture"]');
mermaid.push("    direction TB");
mermaid.push('    END["Ends"]');
mermaid.push('    HED["Hedge"]');
mermaid.push('    EDG["Edge"]');
mermaid.push("");
mermaid.push("    END --> HED");
mermaid.push("    END --> EDG");
mermaid.push("  end");
mermaid.push("");
mermaid.push('  subgraph MEANS_BRANCH["Means"]');
mermaid.push("    direction TB");
mermaid.push('    MEN["Means"]');
mermaid.push('    HEU["Heuristics"]');
mermaid.push('    CRF["Crafts"]');
mermaid.push('    AVD["Avoid / Disallowed Methods"]');
mermaid.push('    KST["Knowledge Stacks"]');
mermaid.push('    KPR["Protocols"]');
mermaid.push('    KRL["Rules"]');
mermaid.push('    HPS["Heaps"]');
mermaid.push('    MOD["Models"]');
mermaid.push('    FRM["Frameworks"]');
mermaid.push('    BAR["Craft Barbells"]');
mermaid.push('    WGM["Wargames"]');
mermaid.push('    SCN["Scenarios"]');
mermaid.push('    THR["Threats"]');
mermaid.push('    RSP["Responses"]');
mermaid.push('    ATL["Active Threat List"]');
mermaid.push("");
mermaid.push("    MEN --> HEU");
mermaid.push("    MEN --> CRF");
mermaid.push("    MEN --> AVD");
mermaid.push("    CRF --> KST --> KPR --> KRL --> HEU");
mermaid.push("    CRF --> HPS --> MOD --> FRM --> BAR --> HEU");
mermaid.push("    HEU --> WGM --> SCN --> THR --> RSP");
mermaid.push("    THR --> ATL");
mermaid.push("  end");
mermaid.push("");
mermaid.push('  subgraph SOF_BRANCH["State of Affairs"]');
mermaid.push("    direction TB");
mermaid.push('    DPS["Domain P&L Signal"]');
mermaid.push('    AFF["Affairs"]');
mermaid.push('    INT["Interests"]');
mermaid.push('    THS["Thresholds"]');
mermaid.push('    KPI["KPIs"]');
mermaid.push('    BET["Bets"]');
mermaid.push('    IPC["Inherited Preparation Context"]');
mermaid.push('    PLN["Plans"]');
mermaid.push('    PRN["Preparation Notes"]');
mermaid.push('    TSK["Tasks"]');
mermaid.push('    OMC["Omission Cadence"]');
mermaid.push('    EDR["Execution Readiness"]');
mermaid.push('    SPT["Strategy Posture"]');
mermaid.push('    SPG["Strategy Positioning"]');
mermaid.push('    ALL["Allies"]');
mermaid.push('    ENM["Enemies"]');
mermaid.push('    FEN["Fragility Entities"]');
mermaid.push("");
mermaid.push("    SOF --> DPS");
mermaid.push("    AFF --> PLN");
mermaid.push("    INT --> PLN");
mermaid.push("    AFF --> THS");
mermaid.push("    AFF --> KPI");
mermaid.push("    INT --> BET");
mermaid.push("    SAP --> IPC");
mermaid.push("    IPC --> PLN");
mermaid.push("    PLN --> PRN");
mermaid.push("    PLN --> TSK");
mermaid.push("    PLN -. reviewed by .-> OMC");
mermaid.push("    TSK --> EDR");
mermaid.push("    AFF --> SPT");
mermaid.push("    AFF --> SPG");
mermaid.push("    SPG --> ALL");
mermaid.push("    SPG --> ENM");
mermaid.push("    AFF --> FEN");
mermaid.push("  end");
mermaid.push("");
mermaid.push('  subgraph LAB_BRANCH["Lab"]');
mermaid.push("    direction LR");
mermaid.push('    LAB["Lab"]');
mermaid.push('    FOR["Forge"]');
mermaid.push('    WIE["Wield"]');
mermaid.push('    TIN["Tinker"]');
mermaid.push("");
mermaid.push("    LAB --> FOR --> WIE --> TIN");
mermaid.push("  end");
mermaid.push("");
mermaid.push('  subgraph LIN_BRANCH["Lineages"]');
mermaid.push("    direction TB");
mermaid.push('    LNO["Lineage Nodes"]');
mermaid.push('    LSELF["Self"]');
mermaid.push('    LFAM["Family"]');
mermaid.push('    LSTA["State"]');
mermaid.push('    LNATN["Nation"]');
mermaid.push('    LHUM["Humanity"]');
mermaid.push('    LNAT["Nature"]');
mermaid.push('    LRK["Lineage Risks"]');
mermaid.push('    BRS["Blast Radius"]');
mermaid.push("");
mermaid.push("    LNO --> LSELF --> LFAM --> LSTA --> LNATN --> LHUM --> LNAT");
mermaid.push("    LNO --> LRK --> BRS");
mermaid.push("  end");
mermaid.push("");
mermaid.push('  subgraph MIS_BRANCH["Mission"]');
mermaid.push("    direction TB");
mermaid.push('    MHI["Mission Hierarchy"]');
mermaid.push('    MSR["Mission Serial Refs"]');
mermaid.push('    MPR["Mission Parallel Refs"]');
mermaid.push('    MDN["Mission Dependency Notes"]');
mermaid.push('    DEP["Dependency Chain"]');
mermaid.push('    RDY["Readiness"]');
mermaid.push('    NRN["No-Ruin Constraint"]');
mermaid.push("");
mermaid.push("    MHI --> MSR");
mermaid.push("    MHI --> MPR");
mermaid.push("    MHI --> MDN");
mermaid.push("    MHI --> DEP --> RDY --> NRN");
mermaid.push("  end");
mermaid.push("");
mermaid.push('  subgraph DRAFT_BRANCH["Draft Promotion"]');
mermaid.push("    direction LR");
mermaid.push('    ANK["Structural Anchors"]');
mermaid.push('    PRM["Promotion Events"]');
mermaid.push("");
mermaid.push("    DFT --> ANK --> PRM");
mermaid.push("  end");
mermaid.push("");
mermaid.push('  subgraph PORT_BRANCH["Portfolio War Room"]');
mermaid.push("    direction LR");
mermaid.push('    PPR["Portfolio Projects"]');
mermaid.push('    PEX["Portfolio Experiments"]');
mermaid.push('    PGT["Decision Gates"]');
mermaid.push('    PEV["Evidence"]');
mermaid.push('    PSL["Ship Logs"]');
mermaid.push("");
mermaid.push("    POR --> PPR");
mermaid.push("    PPR --> PEX");
mermaid.push("    PPR --> PGT");
mermaid.push("    PPR --> PEV");
mermaid.push("    PPR --> PSL");
mermaid.push("  end");
mermaid.push("");
mermaid.push('  subgraph WARGAME_BRANCH["War Gaming"]');
mermaid.push("    direction TB");
mermaid.push('    DSV["Decision Surface"]');
mermaid.push('    OPF["Operational Filters"]');
mermaid.push('    CEV["Confidence Evidence"]');
mermaid.push('    TRA["Triage Actions"]');
mermaid.push('    DOF["Doctrine Fixes"]');
mermaid.push('    FFR["Fractal Flow Rail"]');
mermaid.push('    DPW["Dependency Warnings"]');
mermaid.push('    DPCX["Dual Path Comparator"]');
mermaid.push('    FWL["Fragilista Watchlist"]');
mermaid.push('    QHG["Quadrant HeatGrid"]');
mermaid.push('    SVF["Source Volatility Flow"]');
mermaid.push('    RPP["Readiness Penalty Profile"]');
mermaid.push('    FRA["Fragility Radar"]');
mermaid.push('    TKC["Task Kill Chain"]');
mermaid.push('    BRG["Barbell Guardrail"]');
mermaid.push('    ASP["Asymmetry Snapshot"]');
mermaid.push('    RLC["Risk Logic Continuum"]');
mermaid.push('    OBG["Optionality Budget"]');
mermaid.push('    SRG["Source Register"]');
mermaid.push('    DBR["Dependency Blast Radius"]');
mermaid.push('    HCM["Hedge Coverage Matrix"]');
mermaid.push('    DVF["Doctrine Violation Feed"]');
mermaid.push('    CRR["Correlation Risk"]');
mermaid.push('    CPS["Campaign Snapshots"]');
mermaid.push("");
mermaid.push("    WGG --> DSV --> OPF");
mermaid.push("    WGG --> CEV");
mermaid.push("    WGG --> TRA --> DOF");
mermaid.push("    WGG --> FFR");
mermaid.push("    WGG --> DPW");
mermaid.push("    WGG --> DPCX");
mermaid.push("    WGG --> FWL");
mermaid.push("    WGG --> QHG");
mermaid.push("    WGG --> SVF");
mermaid.push("    WGG --> RPP");
mermaid.push("    WGG --> FRA");
mermaid.push("    WGG --> TKC");
mermaid.push("    WGG --> BRG");
mermaid.push("    WGG --> ASP");
mermaid.push("    WGG --> RLC");
mermaid.push("    WGG --> OBG");
mermaid.push("    WGG --> SRG");
mermaid.push("    WGG --> DBR");
mermaid.push("    WGG --> HCM");
mermaid.push("    WGG --> DVF");
mermaid.push("    WGG --> CRR");
mermaid.push("    WGG --> CPS");
mermaid.push("  end");
mermaid.push("");
mermaid.push('  subgraph DOMAIN_BRANCH["Domain Chamber"]');
mermaid.push("    direction TB");
mermaid.push('    DPO["Domain Posture"]');
mermaid.push('    BMC["Barbell + Means Coverage"]');
mermaid.push('    LRH["Lineage Risk HeatGrid"]');
mermaid.push('    ADA["Active Domain Affairs"]');
mermaid.push('    LRR["Lineage Risk Register"]');
mermaid.push("");
mermaid.push("    DPO --> BMC");
mermaid.push("    DPO --> LRH");
mermaid.push("    DPO --> ADA");
mermaid.push("    DPO --> LRR");
mermaid.push("  end");
mermaid.push("");
mermaid.push('  subgraph DASH_BRANCH["Operator Dashboard"]');
mermaid.push("    direction LR");
mermaid.push('    ODB["Operator Dashboard"]');
mermaid.push('    PST["Protocol Status"]');
mermaid.push('    HUD["HUD Status"]');
mermaid.push('    LCK["Life Clock"]');
mermaid.push('    ALQ["Alert Queue"]');
mermaid.push('    FOM["Fog of Maya"]');
mermaid.push('    ODN["Operational Do Now"]');
mermaid.push('    STR["Stakes Triad"]');
mermaid.push('    ACR["Asymmetry Curve"]');
mermaid.push('    VSP["Virtue Spiral"]');
mermaid.push('    DNC["Do Now Copilot"]');
mermaid.push('    NRT["No-Ruin Tripwire"]');
mermaid.push('    RLP["Ruin Ledger"]');
mermaid.push('    VNP["Via Negativa"]');
mermaid.push('    BSR["Black Swan Readiness"]');
mermaid.push('    EXD["Execution Distribution"]');
mermaid.push('    FRH["Fragility Hierarchy"]');
mermaid.push('    SPF["Strategic Posture Filter"]');
mermaid.push('    SAM["System Anatomy"]');
mermaid.push("");
mermaid.push("    ODB --> PST");
mermaid.push("    ODB --> HUD");
mermaid.push("    ODB --> LCK");
mermaid.push("    ODB --> ALQ");
mermaid.push("    ODB --> FOM");
mermaid.push("    ODB --> ODN");
mermaid.push("    ODB --> STR");
mermaid.push("    ODB --> ACR");
mermaid.push("    ODB --> VSP");
mermaid.push("    ODB --> DNC");
mermaid.push("    ODB --> NRT");
mermaid.push("    ODB --> RLP");
mermaid.push("    ODB --> VNP");
mermaid.push("    ODB --> BSR");
mermaid.push("    ODB --> EXD");
mermaid.push("    ODB --> FRH");
mermaid.push("    ODB --> SPF");
mermaid.push("    ODB --> SAM");
mermaid.push("  end");
mermaid.push("");
mermaid.push("  SOA --> SRC");
mermaid.push("  SOA --> CTX");
mermaid.push("  MPS --> ASY");
mermaid.push("  MPS --> NLR");
mermaid.push("  RRS -. describes .-> ASY");
mermaid.push("  FRN -. describes .-> NLR");
mermaid.push("  BRR -. gates .-> RDY");
mermaid.push("  ASY --> END");
mermaid.push("  NLR --> END");
mermaid.push("  END --> MEN");
mermaid.push("  SOF --> AFF");
mermaid.push("  SOF --> INT");
mermaid.push("  DOM --> AFF");
mermaid.push("  DOM --> INT");
mermaid.push("  SAP --> AFF");
mermaid.push("  SAP --> INT");
mermaid.push("  SAT --> AFF");
mermaid.push("  SAT --> INT");
mermaid.push("  DPC -. verifies .-> AFF");
mermaid.push("  DPC -. verifies .-> INT");
mermaid.push("  HED --> AFF");
mermaid.push("  EDG --> INT");
mermaid.push("  CRF --> AFF");
mermaid.push("  CRF --> INT");
mermaid.push("  HEU --> AFF");
mermaid.push("  HEU --> INT");
mermaid.push("  INT --> LAB");
mermaid.push("  WIE --> TSK");
mermaid.push("  AFF --> LIN");
mermaid.push("  INT --> LIN");
mermaid.push("  STK -. weighted by .-> LEX");
mermaid.push("  RSK -. weighted by .-> LEX");
mermaid.push("  LEX --> LRK");
mermaid.push("  TSK --> MIS");
mermaid.push("  AFF --> MHI");
mermaid.push("  INT --> MHI");
mermaid.push("  LRK --> NRN");
mermaid.push("  WR --> ODB");
mermaid.push("  STK -. surfaces .-> STR");
mermaid.push("  ASY -. surfaces .-> ACR");
mermaid.push("  FRG -. surfaces .-> VNP");
mermaid.push("  RDY -. surfaces .-> BSR");
mermaid.push("  TSK -. surfaces .-> EXD");
mermaid.push("  LIN -. surfaces .-> FRH");
mermaid.push("  SOF -. filters .-> SPF");
mermaid.push("  MIS -. surfaces .-> DNC");
mermaid.push("  NRN -. surfaces .-> NRT");
mermaid.push("  LRK -. feeds .-> RLP");
mermaid.push("  SOA -. surfaces .-> DPO");
mermaid.push("  SOA -. surfaces .-> BMC");
mermaid.push("  SOA -. surfaces .-> QHG");
mermaid.push("  SOA -. surfaces .-> SVF");
mermaid.push("  SOF -. surfaces .-> CPS");
mermaid.push("  SOF -. surfaces .-> ADA");
mermaid.push("  LIN -. surfaces .-> LRH");
mermaid.push("  LIN -. surfaces .-> LRR");
mermaid.push("  FRG -. surfaces .-> FRA");
mermaid.push("  TSK -. surfaces .-> TKC");
mermaid.push("  RDY -. surfaces .-> RPP");
mermaid.push("  BAR -. measured by .-> RLC");
mermaid.push("  ASY -. measured by .-> RLC");
mermaid.push("  BRG -. surfaces into .-> RLC");
mermaid.push("  ASP -. surfaces into .-> RLC");
mermaid.push("  INT -. budgeted by .-> OBG");
mermaid.push("  LRK -. informs .-> FWL");
mermaid.push("  LRK -. informs .-> DBR");
mermaid.push("  LRK -. registered in .-> LRR");
mermaid.push("  DVF -. prompts .-> DOF");
mermaid.push("  SAP -. indexes .-> SRG");
mermaid.push("  MIS -. surfaces .-> CPS");
mermaid.push("  MIS -. feeds .-> DSV");
mermaid.push("  DSV -. reports to .-> PST");
mermaid.push("  DEP -. maps into .-> SAM");
mermaid.push("  CRR -. constrains .-> OBG");
mermaid.push("  SRC -. surfaces .-> SVF");
mermaid.push("  STK -. surfaces .-> DPO");
mermaid.push("  RSK -. surfaces .-> DPO");
mermaid.push("  FRG -. surfaces .-> DPO");
mermaid.push("  HED -. surfaces .-> BMC");
mermaid.push("  EDG -. surfaces .-> BMC");
mermaid.push("  MEN -. surfaces .-> BMC");
mermaid.push("  PRM -. creates .-> AFF");
mermaid.push("  PRM -. creates .-> INT");
mermaid.push("  PRM -. creates .-> CRF");
mermaid.push("  PRM -. creates .-> KST");
mermaid.push("  PRM -. creates .-> KPR");
mermaid.push("  PRM -. creates .-> KRL");
mermaid.push("  MIS --> POR");
mermaid.push("  INT -. links .-> PPR");
mermaid.push("  LEG_OK -.-> LEG_PART");
mermaid.push("  LEG_PART -.-> LEG_DOC");
mermaid.push("");
mermaid.push("  classDef root fill:#3b2f63,stroke:#8b7ae6,color:#ffffff;");
mermaid.push("  classDef macro fill:#1f3d2d,stroke:#4ade80,color:#ffffff;");
mermaid.push("  classDef implemented fill:#10281c,stroke:#22c55e,color:#ffffff;");
mermaid.push("  classDef partial fill:#3a2a10,stroke:#f59e0b,color:#ffffff;");
mermaid.push("  classDef doctrine fill:#1d3b53,stroke:#7dd3fc,color:#ffffff;");
mermaid.push("  classDef gate fill:#1f2937,stroke:#facc15,color:#ffffff;");
mermaid.push("  classDef precommit fill:#1d3b53,stroke:#7dd3fc,color:#ffffff;");
mermaid.push("  classDef critical fill:#3f1d1d,stroke:#f87171,color:#ffffff;");
mermaid.push("");
mermaid.push("  class WR root;");
mermaid.push("  class SOA,SOF,LIN,MIS,WGG,POR,ODB macro;");
mermaid.push("  class DTP,TAL,QDR gate;");
mermaid.push("  class DFT,ANK,PRM precommit;");
mermaid.push("  class NRN critical;");

const mermaidNodeIds = {
  war_room: "WR",
  state_of_the_art: "SOA",
  state_of_affairs: "SOF",
  lineages: "LIN",
  mission: "MIS",
  war_gaming: "WGG",
  drafts: "DFT",
  portfolio_war_room: "POR",
  map_navigation: "MAP_BRANCH",
  source_of_volatility: "SRC",
  source_map_profiles: "SMP",
  state_of_art_projection: "SAP",
  state_of_art_protocol: "SAT",
  drift_parity_checks: "DPC",
  context_narrative: "CTX",
  fragility_narrative: "FRN",
  risk_reward_summary: "RRS",
  concavity_profile: "CCP",
  short_vol_exposure: "SVE",
  long_vol_exposure: "LVE",
  barrier_rules: "BRR",
  checklist_rules: "CLR",
  policy_acknowledgements: "PAC",
  domain: "DOM",
  decision_type: "DTP",
  tail_class: "TAL",
  quadrant: "QDR",
  method_posture: "MPS",
  philosophers_stone: "STONE_BRANCH",
  asymmetry: "ASY",
  skin_in_the_game: "SITG",
  stakes: "STK",
  skin_capital: "SCA",
  skin_time: "STI",
  skin_reputation: "SRP",
  skin_breach_penalty: "SBP",
  risks: "RSK",
  players_fragilistas: "PLR",
  lineage_exposure: "LEX",
  non_linearity: "NLR",
  fragility: "FRG",
  short_volatility: "SVO",
  vulnerabilities: "VUL",
  propagation: "PRP",
  irreversibility: "IRV",
  ends: "END",
  hedge: "HED",
  edge: "EDG",
  means: "MEN",
  avoid_methods: "AVD",
  crafts: "CRF",
  knowledge_stacks: "KST",
  knowledge_protocols: "KPR",
  knowledge_rules: "KRL",
  heaps: "HPS",
  models: "MOD",
  frameworks: "FRM",
  barbell_strategies: "BAR",
  heuristics: "HEU",
  wargames: "WGM",
  scenarios: "SCN",
  threats: "THR",
  responses: "RSP",
  active_threat_list: "ATL",
  domain_pnl_signal: "DPS",
  affairs: "AFF",
  interests: "INT",
  thresholds: "THS",
  kpis: "KPI",
  bets: "BET",
  inherited_preparation_context: "IPC",
  lab: "LAB",
  strategy_posture: "SPT",
  strategy_positioning: "SPG",
  allies: "ALL",
  enemies: "ENM",
  forge: "FOR",
  wield: "WIE",
  tinker: "TIN",
  plans: "PLN",
  preparation_notes: "PRN",
  tasks: "TSK",
  omission_cadence: "OMC",
  execution_readiness: "EDR",
  fragility_entities: "FEN",
  mission_hierarchy: "MHI",
  mission_serial_refs: "MSR",
  mission_parallel_refs: "MPR",
  mission_dependency_notes: "MDN",
  dependency_chain: "DEP",
  readiness: "RDY",
  no_ruin: "NRN",
  lineage_nodes: "LNO",
  lineage_risks: "LRK",
  blast_radius: "BRS",
  lineage_self: "LSELF",
  lineage_family: "LFAM",
  lineage_state: "LSTA",
  lineage_nation: "LNATN",
  lineage_humanity: "LHUM",
  lineage_nature: "LNAT",
  structural_anchors: "ANK",
  promotion_events: "PRM",
  portfolio_projects: "PPR",
  portfolio_experiments: "PEX",
  portfolio_decision_gates: "PGT",
  portfolio_evidence: "PEV",
  portfolio_ship_logs: "PSL",
  operator_dashboard: "ODB",
  protocol_status: "PST",
  hud_status: "HUD",
  life_clock: "LCK",
  alert_queue: "ALQ",
  fog_of_maya: "FOM",
  operational_do_now: "ODN",
  stakes_triad: "STR",
  asymmetry_curve: "ACR",
  virtue_spiral: "VSP",
  do_now_copilot: "DNC",
  no_ruin_tripwire_panel: "NRT",
  ruin_ledger_panel: "RLP",
  via_negativa_panel: "VNP",
  black_swan_readiness: "BSR",
  execution_distribution: "EXD",
  fragility_hierarchy: "FRH",
  strategic_posture_filter: "SPF",
  decision_surface: "DSV",
  operational_filters: "OPF",
  quadrant_heatgrid: "QHG",
  source_volatility_flow: "SVF",
  readiness_penalty_profile: "RPP",
  fragility_radar: "FRA",
  task_kill_chain: "TKC",
  risk_logic_continuum: "RLC",
  optionality_budget: "OBG",
  source_register: "SRG",
  dual_path_comparator: "DPCX",
  fragilista_watchlist: "FWL",
  doctrine_violation_feed: "DVF",
  hedge_coverage_matrix: "HCM",
  dependency_blast_radius: "DBR",
  correlation_risk: "CRR",
  confidence_evidence: "CEV",
  fractal_flow_rail: "FFR",
  triage_actions: "TRA",
  doctrine_fixes: "DOF",
  dependency_warnings: "DPW",
  system_anatomy: "SAM",
  campaign_snapshots: "CPS",
  barbell_guardrail: "BRG",
  asymmetry_snapshot: "ASP",
  domain_posture: "DPO",
  barbell_means_coverage: "BMC",
  lineage_risk_heatgrid: "LRH",
  active_domain_affairs: "ADA",
  lineage_risk_register: "LRR"
};

const nodesByStatus = {
  implemented: [],
  partial: [],
  doctrine_only: []
};

const unresolvedNodes = spec.nodes.filter((node) => !positions[node.id]);
for (const [index, node] of unresolvedNodes.entries()) {
  positions[node.id] = {
    x: 4680 + (index % 3) * 320,
    y: 3880 + Math.floor(index / 3) * 140
  };
}

for (const [specId, mermaidId] of Object.entries(mermaidNodeIds)) {
  const status = implementationStatus[specId];
  if (status && nodesByStatus[status]) nodesByStatus[status].push(mermaidId);
}

if (nodesByStatus.implemented.length) {
  mermaid.push(`  class ${nodesByStatus.implemented.join(",")} implemented;`);
}
if (nodesByStatus.partial.length) {
  mermaid.push(`  class ${nodesByStatus.partial.join(",")} partial;`);
}
if (nodesByStatus.doctrine_only.length) {
  mermaid.push(`  class ${nodesByStatus.doctrine_only.join(",")} doctrine;`);
}
mermaid.push("  class LEG_OK implemented;");
mermaid.push("  class LEG_PART partial;");
mermaid.push("  class LEG_DOC doctrine;");

const treeEdges = spec.edges.filter((edge) => primaryTreeRelations.has(edge.relation));

function edgeSides(fromNodeId, toNodeId) {
  const from = positions[fromNodeId];
  const to = positions[toNodeId];
  if (Math.abs((to.x ?? 0) - (from.x ?? 0)) >= Math.abs((to.y ?? 0) - (from.y ?? 0))) {
    return {
      fromSide: (to.x ?? 0) >= (from.x ?? 0) ? "right" : "left",
      toSide: (to.x ?? 0) >= (from.x ?? 0) ? "left" : "right"
    };
  }
  return {
    fromSide: (to.y ?? 0) >= (from.y ?? 0) ? "bottom" : "top",
    toSide: (to.y ?? 0) >= (from.y ?? 0) ? "top" : "bottom"
  };
}

const canvas = {
  nodes: [
    ...groups.map((group) => ({
      id: group.id,
      type: "group",
      label: group.label,
      x: group.x,
      y: group.y,
      width: group.width,
      height: group.height,
      color: group.color
    })),
    {
      id: "branch-wargame-label",
      type: "text",
      text: "War Gaming\nOperator synthesis -> filters -> diagnostics -> triage",
      x: 660,
      y: 520,
      width: 360,
      height: 80
    },
    {
      id: "branch-soa-label",
      type: "text",
      text: "State of the Art\nFraming -> posture -> ends -> means",
      x: 660,
      y: 40,
      width: 320,
      height: 80
    },
    {
      id: "branch-sof-label",
      type: "text",
      text: "State of Affairs\nObligations + options -> plans -> tasks",
      x: 660,
      y: 1120,
      width: 320,
      height: 80
    },
    {
      id: "branch-lineage-label",
      type: "text",
      text: "Lineages\nScale -> exposure -> blast radius",
      x: 660,
      y: 1700,
      width: 320,
      height: 80
    },
    {
      id: "branch-mission-label",
      type: "text",
      text: "Mission\nHierarchy -> dependency -> readiness -> no ruin",
      x: 660,
      y: 2280,
      width: 320,
      height: 80
    },
    {
      id: "branch-dashboard-label",
      type: "text",
      text: "Operator Dashboard\nProtocol -> tripwires -> operator command surface",
      x: 660,
      y: 3240,
      width: 360,
      height: 80
    },
    ...spec.nodes.map((node) => ({
      id: node.id,
      type: "text",
      text: node.label,
      x: positions[node.id].x,
      y: positions[node.id].y,
      width: node.id === "war_room" ? 360 : 220,
      height: node.id === "war_room" ? 110 : 72,
      color:
        node.id === "war_room" ? "6" :
        node.id === "war_gaming" ? "3" :
        node.id === "state_of_the_art" ? "4" :
        node.id === "state_of_affairs" ? "2" :
        node.id === "lineages" ? "5" :
        node.id === "mission" ? "1" :
        undefined
    }))
  ],
  edges: treeEdges.map((edge, index) => {
    const sides = edgeSides(edge.from, edge.to);
    return {
      id: `e${index + 1}`,
      fromNode: edge.from,
      fromSide: sides.fromSide,
      fromEnd: "none",
      toNode: edge.to,
      toSide: sides.toSide,
      toEnd: "arrow",
      label: edge.relation
    };
  })
};

mkdirSync(path.dirname(canvasPath), { recursive: true });
mkdirSync(path.dirname(dotPath), { recursive: true });
mkdirSync(path.dirname(mermaidPath), { recursive: true });
writeFileSync(canvasPath, `${JSON.stringify(canvas, null, 2)}\n`);
writeFileSync(dotPath, `${dot.join("\n")}\n`);
writeFileSync(mermaidPath, `${mermaid.join("\n")}\n`);
writeFileSync(
  mermaidMarkdownPath,
  `# Genesis\n\nThis file is generated from \`docs/knowledge/genesis.json\`.\n\n\`\`\`mermaid\n${mermaid.join("\n")}\n\`\`\`\n`
);

console.log("Genesis artifacts rendered.");
