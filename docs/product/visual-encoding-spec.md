# Visual Encoding Spec - Slice A

## Goal
Replace high-friction raw data/text blocks with compact visual encodings that improve decision clarity in under one second.

## Mapping Table
| Raw Block | New Encoding | Metric Rule | UI Surface | Verification |
| --- | --- | --- | --- | --- |
| Mission tier text lists | HeatGrid (`fragility`, `serial`, `parallel`, `conviction`) | `serial=min(100,activeAffairs*20)`, `parallel=min(100,linkedInterests*20)`, `conviction=abs(serial-parallel)` | Mission Command | `visual-encodings.test.ts` mission determinism |
| Mission lane text cards | FlowLanes (tier -> serial/parallel) | `flowWeight=round(0.6*fragility+0.4*max(serial,parallel))` | Mission Command | mission flow weight assertion |
| Hedge/edge text ratio | StackedBalanceBar | hedge/edge from live active counts | Mission Command, War Gaming, Domain Modal | snapshot rendering with non-empty and empty states |
| Portfolio narrative sprawl | Portfolio tiles (`role`, `stage`, `signal`, `bottleneck`, `last ship`, `next milestone`) | live SQLite project card + latest child signal rows | Portfolio War Room | `portfolio-view-model.test.ts` summary + filter assertions |
| Cross-project motion text list | Shipping Radar + Experiment Board strips | latest `portfolio_ship_logs` and active/planned `portfolio_experiments` | Portfolio War Room | route/runtime tests + build smoke |
| Doctrine slabs (quadrants) | Quadrant HeatGrid | open-risk classification by randomness/impact proxies | War Gaming | quadrant matrix has 4 deterministic cells |
| Source register reasoning | Source FlowLanes (`CAVE`/`CONVEX`) | derived from `maya-metrics` lane assignment and input volatility | War Gaming | lane presence assertions |
| Domain text summary (stakes/risk/fragility) | Posture bar set | parse text number fallback to domain-linked live proxies | Domain Modal | sparse-data fallback assertions |
| Domain risk rows | Lineage Risk HeatGrid + MiniTrend | `urgency=clamp(round(((14-min(responseTime,14))/14)*100),0,100)` + E/D/I/O/F cells | Domain Modal | manual UI check + deterministic cell creation |

## Color Semantics
- `--viz-risk`: high danger / cave pressure / critical risk.
- `--viz-watch`: caution / unresolved middle zone.
- `--viz-safe`: controlled / convex health.
- `--viz-hedge`: obligations and defense mass.
- `--viz-edge`: options and convex mass.

## Thresholds
- Risk band:
  - `critical >= 85`
  - `watch 60..84`
  - `stable < 60`
- Mission load tension:
  - `critical >= 75`
  - `watch 40..74`
  - `stable < 40`

## Why This Improves Speed
- Heatmaps compress multi-variable risk into one scan.
- Flow lanes preserve causal direction and lane commitment.
- Stacked bars convert ratio math into immediate posture recognition.
- Mini trend gives short historical context without adding dashboard bulk.
