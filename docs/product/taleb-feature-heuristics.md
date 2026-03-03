# Taleb Feature Heuristics (Slice 1)

Operational mapping only. Doctrine copy stays minimal in UI.

| Ref | Concept | Product Feature | Metric / Rule | UI Surface | Test |
| --- | --- | --- | --- | --- | --- |
| `INCERTO-1` | Causal opacity | Maya flow model (`CAVE` vs `CONVEX`) | `lane = convexScore >= caveScore ? CONVEX : CAVE` | `/maya` | `maya-metrics.test.ts` |
| `INCERTO-2` | Harm as signal | Intent Mirror signal banner | Fixed `signal = Harm` + open-risk aggregation | `/maya` | `intent-mirror-metrics.test.ts` |
| `INCERTO-3` | Fragility default | Principal ladder risk bands | `critical>=75`, `watch 45..74`, else `stable`, missing=`unmapped` | `/maya` | `intent-mirror-metrics.test.ts` |
| `INCERTO-4` | No-ruin first | No-ruin state gate | `AT_RISK` if risk `>=85` or fragile-middle + cave dominance gap `>=20` | `/maya` | `intent-mirror-metrics.test.ts` |
| `INCERTO-5` | Barbell allocation | Guardrail snapshot | `fragileMiddle` when edge share in `[35,65]` | Dashboard, War Gaming, Maya | `operational-metrics.test.ts` |
| `INCERTO-6` | Skin in game / accountability | Directive priority engine | deterministic directive cascade (critical -> fragile-middle -> cave -> convex-scale) | `/maya` | `intent-mirror-metrics.test.ts` |

## Citation Corpus (Slice 1)
- `BOOK-FOOLED`: *Fooled by Randomness* (Nassim N. Taleb)
- `BOOK-BLACKSWAN`: *The Black Swan* (Nassim N. Taleb)
- `BOOK-ANTIFRAGILE`: *Antifragile* (Nassim N. Taleb)
- `BOOK-SKINGAME`: *Skin in the Game* (Nassim N. Taleb)
- `BOOK-PROCRUSTES`: *The Bed of Procrustes* (Nassim N. Taleb)
- `TECH-FATTAILS`: *Statistical Consequences of Fat Tails* (Taleb et al., arXiv:2001.10488)
- `PRACTICE-DYNHEDGE`: *Dynamic Hedging* (Nassim N. Taleb)
