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
| Local knowledge | 298 normalized OSM records and tag summaries | 300 automatically collected records; separate 21-fact official-source layer across 11 places | Reproducible raw-data rebuild; source entity and scope decisions in `EVIDENCE.md` |
| Operational accuracy | Original OSM hours and access tags | Three official weekly-hours overrides and two controlled-campus exclusions | Monday museum and campus scenarios; original raw records preserved |
| Route fit | Fixed visit estimates | Short-visit options and a checked return-leg walking limit | Budget, opening-hours and route regression tests |
| Shared outings | One combined set of interests | 2–5 anonymous preferences with per-person coverage and explicit compromises | Mixed group and impossible-compromise tests; browser rain/restore flow |
| Changing plans | Manually edit inputs | Preview rain or 15-minutes-less alternatives, apply and restore | Other walking, accessibility and return constraints remain enforced |
| Discovery | General category activity | Curious/calm/playful context and optional observation missions | Browser completion/undo checks; state stays in memory |

The remaining differentiator to validate is usefulness with real people. No user study has been run. The proposed next step is a small pilot with residents, parents and visitors: measure time to choose a plan, accepted recommendations, source misunderstandings and constraint errors. Walking estimates still need a pedestrian graph; model citation membership still does not prove the meaning of every generated sentence.
