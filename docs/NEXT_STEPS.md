# Qadam — next improvements without participant recruitment

User testing is deferred at the participant's request. Development can continue through source audits, independently specified examples, simulated constraints and browser checks. These methods establish engineering behavior; they do not establish demand, satisfaction or real-world walking safety.

## Recommended order

| Priority | Improvement | Concrete benefit | Completion check |
|---|---|---|---|
| 1 | More precise request interpretation | “1 hour 30 minutes” means 90 minutes; excluding museums does not exclude every artwork | Fix the seven recorded edge cases, add paraphrases in EN/RU/KK, and keep a separate set of examples out of implementation work until final evaluation |
| 2 | Pedestrian paths in one demo area, then expand | The map follows mapped paths and crossings, and route selection uses their distance | Respect foot/access restrictions and barriers; test disconnected paths and detours; identify uncertain endpoint connections and leave unsupported routes explicitly approximate |
| 3 | Source-backed themed journeys | Stops form one connected local story, with a short observation at each stop | Every factual story segment links to its source; selected stops still satisfy the same time, hours and access constraints; missing facts never become invented history |
| 4 | A clear explanation when nothing fits | Show the binding constraint and the smallest useful change, such as 15 more minutes | Recompute proposed alternatives before showing them; apply only the selected change; preserve kept stops, accessibility and return requirements |
| 5 | A return deadline and visible buffer | “Back by 15:00” produces an estimated timeline with time held in reserve | Visits, walking, return and buffer fit the deadline; later departure reduces the available budget; no guarantee about traffic, queues or flights |

Priorities 1 and 2 address correctness. Priority 3 supplies a memorable demo moment. Priorities 4 and 5 make the product easier to use when a perfect plan is unavailable. Avoid adding accounts, a social feed or a broad chat interface before these gaps are addressed.

## Findings from the current implementation

Run `node scripts/audit_intent.mjs` to reproduce the targeted diagnostic baseline in `intent-audit.json`. Three of ten deliberately selected examples meet the specified expectations; seven expose gaps. This is not the app's overall accuracy. The existing 57 tests and 17 acceptance scenarios cover their stated supported behavior; this audit expands the scope.

- English and Russian compound durations currently lose the hour component.
- “Max 10 minutes walking” is not recognized as a walking cap.
- “No museums, architecture please” excludes the whole culture category, including artworks.
- Double negation can reverse the intended coffee preference.
- “Free wifi” is mistaken for a free-entry request.
- An English stroller request does not activate family context. Stroller suitability must remain separate from a claim of wheelchair accessibility.

The structured controls remain available, but the interpreted summary should make ambiguity visible and allow correction. Model-assisted interpretation is an option only behind a bounded schema and the same deterministic constraints; adding a model does not by itself resolve these cases.

## Pedestrian-routing feasibility

Inspection of the five existing cached OSM extracts found 4,966 unique ways tagged `highway=footway`, 109 paths, 19 pedestrian streets and 117 steps. Node references for the inspected routing-relevant way classes were present. These are raw mapped objects, not verified usable routes. The current `map.json` is display geometry and does not preserve the complete graph or access information.

A bounded next step is to export a reproducible graph for EXPO and route locally in the browser. Preserve source IDs and foot/access/barrier tags, use an explicitly documented access profile, and avoid attaching a venue centroid across a fence or river. Only expand to the other areas after endpoint connections and disconnected components are reviewed.

OSM documents pedestrian permission using [`foot`](https://wiki.openstreetmap.org/wiki/Key:foot), with general restrictions under [`access`](https://wiki.openstreetmap.org/wiki/Key:access). A mapped [`footway`](https://wiki.openstreetmap.org/wiki/Tag:highway%3Dfootway) supplies geometry, not an on-site guarantee of conditions or a step-free route. References reviewed 18 October 2026.

## Story candidates already supported by the evidence pack

These are proposed themes, not implemented product features. The current approximate planner was checked with two required stops, a 120-minute budget, a 30-minute per-leg cap, return included, and Tuesday 20 October 2026 at 14:00.

| Proposed theme | Existing source-backed stops | Current approximate total |
|---|---|---|
| Symbols and sculpture | Baiterek + Lovers Park | 95 minutes |
| EXPO: architecture and independence | MEGA Silk Way + Uly Dala Eli monument | 82 minutes |
| Ancient life and modern Astana | National Museum + Presidential Park | 104 minutes |

Do not market these as 60-minute walks or confirmed pedestrian routes. A routing upgrade can change the totals. Story text should explain the connection between the selected facts without inventing historical relationships between the places.

## Validation without recruiting users

Use fixed examples with expected outcomes, paraphrase checks, source-to-claim review and explicit failure injection. Retain provider errors and fallbacks in live-generation reports. Compare a targeted baseline before and after each fix, keeping facts, date, origin and other constraints fixed. Exercise the phone layout with a keyboard, a narrow screen, a slow connection and failed generation.

For the pitch, show one difficult request working, a real path around an obstacle, and one cited local story after those features are implemented. Report observed behavior and remaining limitations. Participant testing stays a future activity and is not a submission prerequisite in this development plan.
