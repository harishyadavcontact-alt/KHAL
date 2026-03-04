# War Room Fractal Decision Tree (v0.4.2)

This artifact defines macro hierarchy, path dependency, and interdependence overlay for War Gaming.

## 1) Macro Hierarchy

```mermaid
graph TD
  WR[War Room]
  SOA[State of the Art]
  SOF[State of Affairs]
  LIN[Lineages]
  MIS[Mission]

  WR --> SOA
  WR --> SOF
  WR --> LIN
  WR --> MIS

  SOA --> SRC[Source of Volatility]
  SOA --> DOM[Domains]
  SOA --> PST[Philosopher's Stone]
  SOA --> END[Ends: Barbell Strategy]
  SOA --> MEA[Means: Heuristics + Methods]
  SOA --> CRF[Crafts]

  SOF --> AFF[Affairs]
  SOF --> INT[Interests]
  INT --> LAB[Lab Aggregator]
```

## 2) Path Dependency (War Gaming Modes)

```mermaid
graph LR
  S[source] --> D[domain]
  D --> A[affair]
  D --> I[interest]
  I --> C[craft]
  S --> L[lineage]
  D --> L
  A --> M[mission]
  I --> M
  L --> M
```

## 3) Interdependence Overlay

```mermaid
graph TD
  SRC[Source volatility shifts] --> DOM[Domain risk posture]
  DOM --> AFF[Affair obligations]
  DOM --> INT[Interest options]
  CRF[Craft means chain] --> AFF
  CRF --> INT
  AFF --> LIN[Lineage exposure]
  INT --> LIN
  LIN --> MIS[Mission command]
  AFF --> MIS
  INT --> MIS
```

## 4) Mode-Specific Grammar Registry

1. `source`
- profile, linked domains, propagation path, uncertainty band.
2. `domain`
- class, stakes, risk map, fragility/vulnerability, ends/means posture.
3. `affair`
- obligation objective, ORK/KPI, preparation, thresholds, execution chain.
4. `interest`
- forge/wield/tinker, hypothesis, max-loss + expiry, kill criteria, barbell split, evidence.
5. `craft`
- heap set, model extraction, framework assembly, barbell output, heuristic output.
6. `lineage`
- exposure map, stake scaling, blast radius, intergenerational risk.
7. `mission`
- hierarchy, dependency chain, readiness, no-ruin constraints.

## 5) Hybrid Role Policy

1. `Missionary`
- dependency-first posture.
- risky actions blocked when predecessor modes or required grammar fields are incomplete.
2. `Visionary`
- mode jumping allowed.
- dependency misses shown as warnings; grammar misses still block risky execution actions.

