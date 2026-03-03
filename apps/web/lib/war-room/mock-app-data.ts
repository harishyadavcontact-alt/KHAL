import type { AppData } from "../../components/war-room-v2/types";

const now = new Date();
const day = 24 * 60 * 60 * 1000;

function isoOffset(msOffset: number): string {
  return new Date(now.getTime() + msOffset).toISOString();
}

export const mockAppData: AppData = {
  user: {
    name: "Operator Vish",
    birthDate: "2002-09-30T00:00:00.000Z",
    lifeExpectancy: 80,
    location: "Bengaluru"
  },
  strategyMatrix: {
    allies: 62,
    enemies: 38,
    overt: 44,
    covert: 56,
    offense: 47,
    defense: 53,
    conventional: 41,
    unconventional: 59
  },
  laws: [
    { id: "law-universe", name: "Law of Universe", volatilitySource: "Universe", description: "Invariant physical constraints." },
    { id: "law-nature", name: "Law of Nature", volatilitySource: "Nature", description: "Ecological and biological constraints." },
    { id: "law-nurture", name: "Law of Nurture", volatilitySource: "Nurture", description: "Behavior and learned social patterns." },
    { id: "law-land", name: "Law of Land", volatilitySource: "Land", description: "Institutional and jurisdictional constraints." },
    { id: "law-time", name: "Law of Time", volatilitySource: "Time", description: "Path-dependence and temporal decay." },
    { id: "law-6", name: "Law 6", volatilitySource: "Law 6 (TBD)", description: "Reserve slot for emergent constraints." }
  ],
  domains: [
    {
      id: "domain-health",
      name: "Health Stack",
      lawId: "law-nature",
      volatilitySourceId: "source-nature",
      volatilitySourceName: "Law of Nature",
      volatilitySource: "Nature",
      stakesText: "Energy and cognition are mission multipliers.",
      risksText: "Sleep debt and metabolic drift degrade execution.",
      fragilityText: "High fragility under schedule shocks.",
      vulnerabilitiesText: "Late nights, skipped training, poor meal timing.",
      hedge: "Protect sleep and baseline mobility daily.",
      edge: "Build strength and VO2 reserve.",
      heuristics: "What degrades first under stress?",
      tactics: "Morning walk + lift schedule + evening shutdown.",
      interestsText: "Peak capacity and recovery optionality.",
      affairsText: "Current compliance and routine discipline."
    },
    {
      id: "domain-finance",
      name: "Finance & Capital",
      lawId: "law-time",
      volatilitySourceId: "source-time",
      volatilitySourceName: "Law of Time",
      volatilitySource: "Time",
      stakesText: "Runway determines strategic patience.",
      risksText: "Over-concentration and cashflow variance.",
      fragilityText: "Medium fragility with concentrated downside.",
      vulnerabilitiesText: "Single income stream and discretionary leakage.",
      hedge: "Emergency runway and downside caps.",
      edge: "Asymmetric optional bets with max-loss discipline.",
      heuristics: "No-ruin before optimization.",
      tactics: "Cash buffer, position sizing, automatic savings.",
      interestsText: "Convex upside with controlled downside.",
      affairsText: "Recurring obligations and liabilities."
    },
    {
      id: "domain-product",
      name: "Product & Build",
      lawId: "law-universe",
      volatilitySourceId: "source-universe",
      volatilitySourceName: "Law of Universe",
      volatilitySource: "Universe",
      stakesText: "Execution speed and decision quality.",
      risksText: "Complexity creep and unfinished integration.",
      fragilityText: "Medium-high fragility in handoffs.",
      vulnerabilitiesText: "Unscoped feature expansion and unclear ownership.",
      hedge: "Thin vertical slices and route smoke checks.",
      edge: "Rapid hypothesis loops and shipped leverage.",
      heuristics: "Speed > polish in uncertainty windows.",
      tactics: "Feature flags, mocks, deterministic tests.",
      interestsText: "Compounding product capability.",
      affairsText: "Current delivery queue and blockers."
    },
    {
      id: "domain-network",
      name: "Alliances & Distribution",
      lawId: "law-land",
      volatilitySourceId: "source-land",
      volatilitySourceName: "Law of Land",
      volatilitySource: "Land",
      stakesText: "Access and trust accelerate outcomes.",
      risksText: "Single-point dependency on few channels.",
      fragilityText: "Moderate fragility from weak redundancy.",
      vulnerabilitiesText: "Sparse distribution partners.",
      hedge: "Multi-channel outreach cadence.",
      edge: "High-trust nodes with asymmetric reach.",
      heuristics: "Map allies and enemies explicitly.",
      tactics: "Weekly outreach and reciprocity loop.",
      interestsText: "Optionality through network graph.",
      affairsText: "Open relationship obligations."
    }
  ],
  crafts: [],
  interests: [
    {
      id: "interest-ai-alpha",
      title: "Build AI Workflow Optionality",
      domainId: "domain-product",
      perspective: "public",
      stakes: 9,
      risk: 4,
      convexity: 9,
      status: "in_progress",
      objectives: ["Ship reusable copilots", "Increase leverage per decision loop"]
    },
    {
      id: "interest-capital-barbell",
      title: "Capital Barbell Strategy",
      domainId: "domain-finance",
      perspective: "private",
      stakes: 8,
      risk: 5,
      convexity: 8,
      status: "not_started",
      objectives: ["Protect downside runway", "Deploy measured convex bets"]
    },
    {
      id: "interest-vitality-upside",
      title: "Health Capacity Compounding",
      domainId: "domain-health",
      perspective: "personal",
      stakes: 7,
      risk: 3,
      convexity: 7,
      status: "in_progress",
      objectives: ["Sustain deep work stamina", "Lower fragility under stress"]
    },
    {
      id: "interest-distribution-loop",
      title: "Alliance Distribution Flywheel",
      domainId: "domain-network",
      perspective: "public",
      stakes: 8,
      risk: 4,
      convexity: 8,
      status: "not_started",
      objectives: ["Build partner distribution", "Increase inbound opportunity flow"]
    }
  ],
  affairs: [
    {
      id: "affair-health-baseline",
      title: "Stabilize Sleep + Recovery",
      domainId: "domain-health",
      perspective: "macro",
      interestId: "interest-vitality-upside",
      status: "in_progress",
      stakes: 9,
      risk: 8,
      context: { associatedDomains: ["domain-health"], volatilityExposure: "Energy collapse risk" },
      means: { craftId: "craft-health", selectedHeuristicIds: [] },
      plan: { objectives: ["Sleep window consistency", "Morning movement"], uncertainty: "Travel schedule shocks", timeHorizon: "WEEK" },
      strategy: {
        posture: "defense",
        positioning: "conventional",
        mapping: { allies: ["Coach", "Training Partner"], enemies: ["Late-night work", "Inconsistent meals"] }
      },
      entities: [{ id: "entity-health", name: "Operator", type: "person", fragility: "fragile" }]
    },
    {
      id: "affair-runway-discipline",
      title: "Enforce 9-Month Runway",
      domainId: "domain-finance",
      perspective: "macro",
      interestId: "interest-capital-barbell",
      status: "not_started",
      stakes: 8,
      risk: 7,
      context: { associatedDomains: ["domain-finance"], volatilityExposure: "Cashflow compression" },
      means: { craftId: "craft-capital", selectedHeuristicIds: [] },
      plan: { objectives: ["Trim discretionary burn", "Automate reserves"], uncertainty: "Income variance", timeHorizon: "MONTH" },
      strategy: {
        posture: "defense",
        positioning: "conventional",
        mapping: { allies: ["Accountability Partner"], enemies: ["Impulse spend"] }
      },
      entities: [{ id: "entity-capital", name: "Capital Base", type: "asset", fragility: "fragile" }]
    },
    {
      id: "affair-feature-sprint",
      title: "Ship Frontend-Only Feature Sprint",
      domainId: "domain-product",
      perspective: "macro",
      interestId: "interest-ai-alpha",
      status: "in_progress",
      stakes: 7,
      risk: 6,
      context: { associatedDomains: ["domain-product"], volatilityExposure: "Delivery slippage" },
      means: { craftId: "craft-build", selectedHeuristicIds: [] },
      plan: { objectives: ["Feature flag rollout", "Route smoke parity"], uncertainty: "Integration debt", timeHorizon: "WEEK" },
      strategy: {
        posture: "offense",
        positioning: "unconventional",
        mapping: { allies: ["Design Partner", "Power Users"], enemies: ["Scope drift"] }
      },
      entities: [{ id: "entity-build", name: "KHAL Web", type: "product", fragility: "robust" }]
    },
    {
      id: "affair-network-cadence",
      title: "Weekly Alliance Outreach",
      domainId: "domain-network",
      perspective: "macro",
      interestId: "interest-distribution-loop",
      status: "not_started",
      stakes: 6,
      risk: 5,
      context: { associatedDomains: ["domain-network"], volatilityExposure: "Channel concentration" },
      means: { craftId: "craft-network", selectedHeuristicIds: [] },
      plan: { objectives: ["5 outreach touches/week", "2 strategic follow-ups"], uncertainty: "Low response rates", timeHorizon: "MONTH" },
      strategy: {
        posture: "offense",
        positioning: "conventional",
        mapping: { allies: ["Mentors", "Peers"], enemies: ["Unfocused networking"] }
      },
      entities: [{ id: "entity-network", name: "Distribution Graph", type: "network", fragility: "robust" }]
    }
  ],
  tasks: [
    {
      id: "task-sleep-protocol",
      title: "Lock 23:00 sleep protocol",
      domainId: "domain-health",
      type: "affair",
      sourceType: "AFFAIR",
      sourceId: "affair-health-baseline",
      dependencyIds: [],
      horizon: "WEEK",
      dueDate: isoOffset(-2 * day),
      priority: 95,
      status: "in_progress",
      progress: 45
    },
    {
      id: "task-morning-walk",
      title: "07:00 mobility + walk streak",
      domainId: "domain-health",
      type: "affair",
      sourceType: "AFFAIR",
      sourceId: "affair-health-baseline",
      dependencyIds: [],
      horizon: "WEEK",
      dueDate: isoOffset(2 * day),
      priority: 88,
      status: "not_started",
      progress: 0
    },
    {
      id: "task-expense-audit",
      title: "Complete fixed/variable expense audit",
      domainId: "domain-finance",
      type: "affair",
      sourceType: "AFFAIR",
      sourceId: "affair-runway-discipline",
      dependencyIds: [],
      horizon: "MONTH",
      dueDate: isoOffset(5 * day),
      priority: 84,
      status: "not_started",
      progress: 0
    },
    {
      id: "task-cash-buffer",
      title: "Set automatic runway transfer rule",
      domainId: "domain-finance",
      type: "affair",
      sourceType: "AFFAIR",
      sourceId: "affair-runway-discipline",
      dependencyIds: ["task-expense-audit"],
      horizon: "MONTH",
      priority: 79,
      status: "not_started",
      progress: 0
    },
    {
      id: "task-maya-ui-flag",
      title: "Ship NEXT_PUBLIC_MAYA_UI toggle",
      domainId: "domain-product",
      type: "affair",
      sourceType: "AFFAIR",
      sourceId: "affair-feature-sprint",
      dependencyIds: [],
      horizon: "WEEK",
      dueDate: isoOffset(1 * day),
      priority: 90,
      status: "done",
      progress: 100
    },
    {
      id: "task-dashboard-core",
      title: "Integrate Do-Now + triad + barbell panels",
      domainId: "domain-product",
      type: "affair",
      sourceType: "AFFAIR",
      sourceId: "affair-feature-sprint",
      dependencyIds: ["task-maya-ui-flag"],
      horizon: "WEEK",
      dueDate: isoOffset(3 * day),
      priority: 92,
      status: "in_progress",
      progress: 65
    },
    {
      id: "task-wargame-header",
      title: "Add barbell/asymmetry chips to War Gaming",
      domainId: "domain-product",
      type: "affair",
      sourceType: "AFFAIR",
      sourceId: "affair-feature-sprint",
      dependencyIds: ["task-dashboard-core"],
      horizon: "WEEK",
      dueDate: isoOffset(4 * day),
      priority: 86,
      status: "not_started",
      progress: 0
    },
    {
      id: "task-outreach-batch",
      title: "Send 5 alliance outreach messages",
      domainId: "domain-network",
      type: "affair",
      sourceType: "AFFAIR",
      sourceId: "affair-network-cadence",
      dependencyIds: [],
      horizon: "MONTH",
      dueDate: isoOffset(6 * day),
      priority: 72,
      status: "not_started",
      progress: 0
    }
  ],
  sources: [
    {
      id: "source-universe",
      code: "SOV-UNIVERSE",
      name: "Law of Universe",
      sortOrder: 1,
      domainCount: 1,
      domains: [{ id: "link-u-1", sourceId: "source-universe", domainId: "domain-product", dependencyKind: "PRIMARY", pathWeight: 1 }]
    },
    {
      id: "source-nature",
      code: "SOV-NATURE",
      name: "Law of Nature",
      sortOrder: 2,
      domainCount: 1,
      domains: [{ id: "link-n-1", sourceId: "source-nature", domainId: "domain-health", dependencyKind: "PRIMARY", pathWeight: 1 }]
    },
    {
      id: "source-nurture",
      code: "SOV-NURTURE",
      name: "Law of Nurture",
      sortOrder: 3,
      domainCount: 0,
      domains: []
    },
    {
      id: "source-land",
      code: "SOV-LAND",
      name: "Law of Land",
      sortOrder: 4,
      domainCount: 1,
      domains: [{ id: "link-l-1", sourceId: "source-land", domainId: "domain-network", dependencyKind: "PRIMARY", pathWeight: 1 }]
    },
    {
      id: "source-time",
      code: "SOV-TIME",
      name: "Law of Time",
      sortOrder: 5,
      domainCount: 1,
      domains: [{ id: "link-t-1", sourceId: "source-time", domainId: "domain-finance", dependencyKind: "PRIMARY", pathWeight: 1 }]
    },
    {
      id: "source-law6",
      code: "SOV-LAW6",
      name: "Law 6 (TBD)",
      sortOrder: 6,
      domainCount: 0,
      domains: []
    }
  ],
  missionGraph: {
    nodes: [
      { id: "mission-node-source-time", missionId: "mission-global", refType: "SOURCE", refId: "source-time", sortOrder: 10 },
      {
        id: "mission-node-domain-finance",
        missionId: "mission-global",
        refType: "DOMAIN",
        refId: "domain-finance",
        parentNodeId: "mission-node-source-time",
        sortOrder: 20
      },
      {
        id: "mission-node-affair-runway",
        missionId: "mission-global",
        refType: "AFFAIR",
        refId: "affair-runway-discipline",
        parentNodeId: "mission-node-domain-finance",
        sortOrder: 30
      }
    ],
    dependencies: [{ missionNodeId: "mission-node-affair-runway", dependsOnNodeId: "mission-node-domain-finance" }]
  },
  lineages: {
    nodes: [
      { id: "lineage-self", level: "SELF", name: "Self", sortOrder: 1 },
      { id: "lineage-family", level: "FAMILY", name: "Family", parentId: "lineage-self", sortOrder: 2 },
      { id: "lineage-state", level: "STATE", name: "State", sortOrder: 3 }
    ],
    entities: [
      { id: "entity-self", lineageNodeId: "lineage-self", actorType: "personal", label: "Operator", description: "Primary decision actor" },
      { id: "entity-family", lineageNodeId: "lineage-family", actorType: "private", label: "Family Unit", description: "Immediate dependents" }
    ]
  },
  lineageRisks: [
    {
      id: "risk-1",
      sourceId: "source-nature",
      domainId: "domain-health",
      lineageNodeId: "lineage-self",
      actorType: "personal",
      title: "Chronic sleep compression",
      exposure: 8,
      dependency: 7,
      irreversibility: 6,
      optionality: 3,
      responseTime: 4,
      fragilityScore: 78,
      status: "OPEN",
      notes: "Impacts cognition and recovery."
    },
    {
      id: "risk-2",
      sourceId: "source-time",
      domainId: "domain-finance",
      lineageNodeId: "lineage-family",
      actorType: "private",
      title: "Runway erosion under income shock",
      exposure: 7,
      dependency: 8,
      irreversibility: 7,
      optionality: 4,
      responseTime: 5,
      fragilityScore: 72,
      status: "MITIGATING",
      notes: "Needs reserve automation."
    },
    {
      id: "risk-3",
      sourceId: "source-land",
      domainId: "domain-network",
      lineageNodeId: "lineage-state",
      actorType: "public",
      title: "Platform policy dependency",
      exposure: 6,
      dependency: 7,
      irreversibility: 5,
      optionality: 5,
      responseTime: 6,
      fragilityScore: 61,
      status: "INCOMPLETE",
      notes: "Diversify channels."
    }
  ],
  doctrine: {
    rulebooks: [
      { id: "rulebook-global", scopeType: "GLOBAL", scopeRef: "all", name: "Global Doctrine", active: true },
      { id: "rulebook-affair", scopeType: "MODE", scopeRef: "affair", name: "Affair Doctrine", active: true }
    ],
    rules: [
      {
        id: "rule-no-ruin",
        rulebookId: "rulebook-global",
        kind: "RULE",
        code: "NO_RUIN",
        statement: "No-ruin gate before optimization.",
        severity: "HARD_GATE",
        sortOrder: 1,
        active: true
      },
      {
        id: "rule-skin-game",
        rulebookId: "rulebook-affair",
        kind: "POLICY",
        code: "SKIN_IN_GAME",
        statement: "Tie decisions to consequence-bearing accountability.",
        severity: "SOFT",
        sortOrder: 2,
        active: true
      }
    ],
    domainPnLLadders: [
      {
        id: "pnl-health-l1",
        domainId: "domain-health",
        level: 1,
        levelName: "Stabilize",
        threshold: { adherence: "70%" },
        status: "ACTIVE",
        evidence: { streakDays: 9 }
      }
    ]
  }
};
