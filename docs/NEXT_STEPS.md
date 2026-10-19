# Qadam — improvements delivered

Participant testing remains deferred. This release uses source review, deterministic fixtures, simulated scenarios and browser checks. These verify engineering behavior; they do not establish demand, satisfaction or real-world walking safety.

| Improvement | Delivered in versions 4–5 | Evidence |
|---|---|---|
| More precise intent | Word and shorthand durations, Kazakh return clocks, explicit confirmation for ambiguous time, separate walking limits, museum-only exclusion, bounded double negatives, free Wi-Fi distinction and stroller context | Original targeted audit: 3/10 → 10/10; 12 additional authored paraphrases pass. Reports retain exact examples. |
| Pedestrian routing | Reproducible five-area graph; directed shortest paths, restricted campus and barrier exclusions, step avoidance; estimated connectors clearly marked | 5,188 source ways; detour, direction, disconnected-component, entrance and collector tests. Gaps and unverified endpoints remain approximate. |
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

At the version 5 baseline, 86 code/API/Worker tests, 6 collector tests, 25 acceptance cases and 73 browser checks passed. The existing matrices cover 160 constraint combinations and 100 route/card combinations. These counts are not representative accuracy estimates. `intent-audit-before.json` preserves the 3/10 diagnostic baseline. Additional paraphrases were authored by the implementation agent after implementation and were not used to tune the parser; they are not independent evaluation.

## Story conditions and estimates

Tuesday 20 October 2026, 14:00 Astana; 120-minute allowance; 30-minute per-leg cap; return included. Estimates change with constraints and published hours.

| Story | Source-backed stops | Estimated total |
|---|---|---|
| EXPO: Space and Symbols | MEGA Silk Way + Uly Dala Eli | 88 minutes; mapped EXPO paths plus estimated connectors |
| Symbols in Sculpture | Baiterek + Lovers Park | 96 minutes; mapped paths plus estimated connections |
| Ancient Life, Modern City | National Museum + Presidential Park | 104 minutes; mapped paths plus estimated connections |

Museum chapters require interior entry and at least the planner's 35-minute short visit. Monday closure remains enforced. Exterior Baiterek facts do not imply entering its observation deck. Fountain operation, park reconstruction, sightlines and current access remain explicit uncertainties.

## Further work when time and evidence permit

Verify entrances, crossings and barriers in the five collected areas; mapped coverage is not on-site verification. Add date exceptions and refreshed source records; obtain native-speaker review of Kazakh. Evaluate the semantic support of generated sentences beyond citation membership. Broader natural-language phrasing remains heuristic and should be checked through the visible interpretation controls. Participant testing stays a future activity, not a claimed result or a prerequisite for this release.

Technical source references used for the graph profile: [OSM foot](https://wiki.openstreetmap.org/wiki/Key:foot), [OSM access](https://wiki.openstreetmap.org/wiki/Key:access), [OSM footways](https://wiki.openstreetmap.org/wiki/Tag:highway%3Dfootway). The app's graph and source IDs support offline inspection; map tags do not prove current on-site conditions.

Version 5 also fixes incoming-leg times on recommendation cards, adds seven facts for five more POIs (32 facts across 18 places; 19 enriched records), suppresses a conflicting museum schedule, and labels category-only recommendations. The public judge preview runs the planner without paid generation. Live local narrative checks cover six cases in EN/RU/KK; reviewed defects and prior outputs are retained in the narrative review files.

Explicit ranges such as 30–60 minutes use the lower bound, with a visible explanation. Indefinite or conflicting time cues require clarification or explicit control confirmation.

## Version 6: adaptive companion completed

The participant selected “Walk with me” as the signature feature. Current and return origins are separate; the absolute return deadline and reserve remain fixed across unavailable stops, finished visits, delays and weather reports. Completed/unavailable places are excluded. Return-only, overdue, reserve-shortfall, walking-cap and disconnected states are explicit. Rehearsal has simulated time and undo; actual mode reads the device clock on each action. Preferences remain fixed while the session is active. Session progress is local and clears on reload.

17 added code tests and 25 added browser checks pass, for 103 code/API/Worker tests and 98 browser checks total. Existing 25 acceptance scenarios also pass. These checks do not establish real walking accuracy or user demand. The distinguishing demo is adapting a short city walk around the same return commitment; no claim of worldwide product novelty is made.

## Version 6.1: make the signature feature easy to try

The first screen now offers a named companion rehearsal and a direct link to the recorded Gemini demonstration. The rehearsal works even when the visitor's current plan is one-way or waiting for clarification, and restores that plan on exit. Selecting the opening action during an active session resumes it without resetting elapsed time. Keyboard focus survives generation updates. All three languages fit on the mobile opening screen.

Eight additional browser checks cover these entry, restoration, localization and focus behaviors: 33 companion + 73 planner checks, 106 total. The 103 code/API/Worker tests and 25 acceptance scenarios also pass. The demo recording now opens with the companion; the Russian pitch introduces its concrete deadline scenario. Submission copy is prepared from the supplied brief. The organizer form requires Google sign-in, and neither it nor YouTube has received a submission, as requested by the participant.
