# Qadam — five improvements completed

Participant testing remains deferred. This release uses source review, deterministic fixtures, simulated scenarios and browser checks. These verify engineering behavior; they do not establish demand, satisfaction or real-world walking safety.

| Improvement | Delivered in version 4 | Evidence |
|---|---|---|
| More precise intent | Compound durations, separate walking limits, museum-only exclusion, bounded double negatives, free Wi-Fi distinction and stroller context | Original targeted audit: 3/10 → 10/10; 12 additional authored paraphrases pass. Reports retain exact examples. |
| Pedestrian routing | Reproducible EXPO graph; directed shortest paths, restricted campus and barrier exclusions, step avoidance; estimated connectors clearly marked | 1,122 source ways; detour, direction, disconnected-component, entrance and collector tests. Other areas remain approximate. |
| Themed journeys | EXPO: Space and Symbols; Symbols in Sculpture; Ancient Life, Modern City | Six source-backed chapters with observation questions and visit conditions; partial stories hide the full introduction. |
| Empty-plan recovery | Checked time increases and later departures, apply and restore | Same planner recomputes alternatives before display. Other constraints remain; no unchecked fallback is offered. |
| Return deadline and buffer | Explicit date/time, forced return leg, reserved minutes and visible timeline/export | Past deadlines, overnight dates, buffer exhaustion and later departure tested. No arrival guarantee. |

## Reproduce the evidence

```sh
node scripts/build.mjs
node --test tests/*.test.mjs
python3 tests/collector_test.py
node scripts/evaluate.mjs
node scripts/audit_intent.mjs
node scripts/audit_paraphrases.mjs
python3 scripts/collect_walk_graph.py --from-source data/walking-source.json
```

75 code/API/Worker tests, 6 collector tests, 25 acceptance cases and 62 browser checks pass. The existing matrices cover 160 constraint combinations and 100 route/card combinations. These counts are not representative accuracy estimates. `intent-audit-before.json` preserves the 3/10 diagnostic baseline. Additional paraphrases were authored by the implementation agent after implementation and were not used to tune the parser; they are not independent evaluation.

## Story conditions and estimates

Tuesday 20 October 2026, 14:00 Astana; 120-minute allowance; 30-minute per-leg cap; return included. Estimates change with constraints and published hours.

| Story | Source-backed stops | Estimated total |
|---|---|---|
| EXPO: Space and Symbols | MEGA Silk Way + Uly Dala Eli | 88 minutes; mapped EXPO paths plus estimated connectors |
| Symbols in Sculpture | Baiterek + Lovers Park | 95 minutes; approximate walking outside graph coverage |
| Ancient Life, Modern City | National Museum + Presidential Park | 104 minutes; approximate walking outside graph coverage |

Museum chapters require interior entry and at least the planner's 35-minute short visit. Monday closure remains enforced. Exterior Baiterek facts do not imply entering its observation deck. Fountain operation, park reconstruction, sightlines and current access remain explicit uncertainties.

## Further work when time and evidence permit

Expand pedestrian coverage only after reviewing entrances, crossings and barriers in each area. Add date exceptions and refreshed source records; obtain native-speaker review of Kazakh. Evaluate the semantic support of generated sentences beyond citation membership. Broader natural-language phrasing remains heuristic and should be checked through the visible interpretation controls. Participant testing stays a future activity, not a claimed result or a prerequisite for this release.

Technical source references used for the graph profile: [OSM foot](https://wiki.openstreetmap.org/wiki/Key:foot), [OSM access](https://wiki.openstreetmap.org/wiki/Key:access), [OSM footways](https://wiki.openstreetmap.org/wiki/Tag:highway%3Dfootway). The app's graph and source IDs support offline inspection; map tags do not prove current on-site conditions.
