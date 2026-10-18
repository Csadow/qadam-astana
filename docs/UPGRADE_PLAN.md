# Qadam — recommendation and discovery upgrade

Improve the two highest-priority judging criteria: useful recommendations and adaptation to context. Preserve the source snapshot, local location handling and explicit uncertainty.

1. Add a separate, cited first-party evidence layer, including operational restrictions. Keep the automated OSM collection reproducible.
2. Generate short personalized explanations, activity suggestions and optional discovery missions from retrieved evidence. Validate IDs, citation membership, output shape and obvious unsupported operational claims. Keep source facts separate: these checks do not prove every generated sentence true.
3. Balance a route across 2–5 people's interests, showing whose preferences are covered and where a compromise remains.
4. Offer a weather/time backup plan with a visible comparison and reversible application. Never silently relax accessibility, walking or return constraints.
5. Test difficult cases, compare the upgrade with the original approach, verify real model responses and refresh the demo, pitch, deployment and submission archive.

No invented user study, ratings, opening status or venue access. Research and engineering checks are reported separately from user evidence.

## Implemented comparison

| Area | Original prototype | Upgrade | Verification |
|---|---|---|---|
| Recommendations | Model selected a predefined activity ID | Gemini writes a contextual explanation, activity and discovery mission using retrieved facts | Three real scenario responses retained in `live-rag-evaluation.json`; invalid IDs, citations and operational claims tested |
| Local knowledge | 298 normalized OSM records and tag summaries | 300 automatically collected records; separate 25-fact official-source layer across 13 places (14 enriched records) | Reproducible raw-data rebuild; source entity and scope decisions in `EVIDENCE.md` |
| Operational accuracy | Original OSM hours and access tags | Three official weekly-hours overrides and two controlled-campus exclusions | Monday museum and campus scenarios; original raw records preserved |
| Route fit | Fixed visit estimates | Short-visit options and a checked return-leg walking limit | Budget, opening-hours and route regression tests |
| Shared outings | One combined set of interests | 2–5 anonymous preferences with per-person coverage and explicit compromises | Mixed group and impossible-compromise tests; browser rain/restore flow |
| Changing plans | Manually edit inputs | Preview rain or 15-minutes-less alternatives, apply and restore | Other walking, accessibility and return constraints remain enforced |
| Discovery | General category activity | Curious/calm/playful context and optional observation missions | Browser completion/undo checks; state stays in memory |

The remaining differentiator to validate is usefulness with real people. No user study has been run. The proposed next step is a small pilot with residents, parents and visitors: measure time to choose a plan, accepted recommendations, source misunderstandings and constraint errors. Walking estimates still need a pedestrian graph; model citation membership still does not prove the meaning of every generated sentence.


## Final refinement pass — implemented

| Finding | Change | Evidence |
|---|---|---|
| Negative requests could retain cafés | Parse common EN/RU/KK negation; show the interpretation and exclusions | Three acceptance cases plus regression tests |
| Short visits were rejected before route planning | Apply minimum visit length during retrieval and hours checks | 10/15-minute boundary regressions and real Zhetysu case |
| Cards and route could disagree | Publish one final itinerary everywhere | 100 real-data combinations and all 17 acceptance cases |
| Mobile route appeared far down the page | Compact editor, route first, expandable map/facts/missions | At 390×844: route top moved from about 3,603px in the review to 627px in the revised browser check; layout measurement, not a user-speed study |
| Users could not refine one stop | Keep, replace, remove and bounded undo; transactional failures | Engine and browser checks, including impossible kept stops and context changes |
| Scenario time looked current | Explicit Demo / Now / custom mode | Fixed demo and actual-clock browser checks |
| Source and generated restrictions could blur | Source visitor rules stay separate; reject common route-access and photography paraphrases | Regression checks; no claim of complete semantic validation |

The museum live smoke check initially fell back and passed a follow-up request; the report retains both outcomes. No user satisfaction, latency distribution, or independent factuality benchmark is claimed. A 3–5-person usability protocol is ready in `USABILITY.md`; observations still need to be collected.
