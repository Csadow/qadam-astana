# Test scenarios, limitations and judging guide

Acceptance cases use **19 October 2026, 14:00 Astana (UTC+5)** unless stated otherwise. The family museum case uses **Tuesday 20 October**; Monday closure is a separate test. These are simulated, reproducible scenarios, not live venue-availability claims.

| Case | Example input | Expected behavior |
|---|---|---|
| Negation | “No coffee, just a park” and RU/KK equivalents | Exclude cafés even when an old coffee interest is selected. |
| Indoors | “Only indoors” near Khan Shatyr | Indoor candidates only; show the interpreted constraint. |
| Short visit | Start at Zhetysu Park; 15 minutes | Offer a labelled short park pause when its minimum visit and return fit. |
| Edit route | Keep, replace, remove, undo | Preserve the other stops; never refill a removed slot; undo restores the previous itinerary. |
| EXPO break | 60 minutes; nature/coffee; return included | Two itinerary stops; a café and public alley route estimates 53 minutes, including 33 walking and 20 visiting. Shorter stops are labelled. |
| Story walks | Three themes; Tuesday; 120 minutes; 30-minute walking cap | Exact source-backed chapters; EXPO 88, sculpture 95, museum/park 104 minutes. Partial stories do not show the full introduction. |
| Return deadline | Back by 15:00; reserve 10 minutes | Return forced, effective budget reduced to 50 minutes for a 14:00 departure; reserve ends by the deadline. |
| Recovery | Too little time or closed museum chapter | Recompute time-only alternatives; retain access, walking, weather, kept stops and deadline. |
| Compound duration | “1 hour 30 minutes, max 10 minutes walking” | 90 minutes total and a separate 10-minute walking cap. |
| Group | EXPO; 120 minutes; coffee, nature, landmarks | Three interests covered by one 93-minute route. Show each person's coverage. |
| Rain backup | Apply rain to the group plan | Indoor candidates; preserve walking/accessibility/return constraints; show unmet interests and allow restoration. |
| Less time | Preview 15 minutes less | Recompute the feasible route and show its total before applying. |
| Quiet coffee | Baiterek; “Хочу тихое кафе с розеткой” | Cafés with explicit unknown socket and quietness status. |
| Family museum | National Museum; Tuesday 20 October; 120 minutes | Ground suggestions in published paleontology exhibits; show photography and exhibit-closure restrictions. |
| Monday museum | Same area; Monday 19 October; culture | Exclude National Museum according to official weekly hours. |
| Campus access | EXPO; nature | Exclude NU Park and NU Japanese Garden from spontaneous routes. Explain the source correction. |
| Baiterek | Landmark interest; curious mood | Retrieve the actual monument, discuss Tree of Life symbolism, and keep a short visit outside. |
| Rain | Khan Shatyr; 90 minutes | Indoor categories; weather remains user-selected. |
| Too little time | Museum area; 10 minutes; culture; 1-minute walking cap | Empty result without invented matches. |
| Wheelchair | Baiterek; accessibility required | Require explicit wheelchair=yes; distinguish venue tags from unverified street access. |
| Airport at night | EXPO; 120 minutes; 23:00; flight context | Transfer/check-in and night warnings; no flight guarantee. |
| Outside coverage | Almaty coordinates | No Astana recommendation represented as nearby. |

`node scripts/evaluate.mjs` records **25/25 deterministic acceptance cases**. Browser checks cover the interactive backup cases and record **73/73** checks. **86 code/API/Worker tests** plus **6 graph-collector tests** include a **160-combination constraint matrix** plus **100 route/card agreement combinations**. These are engineering checks, not a user study. Reports: [acceptance](evaluation.json), [browser](browser-checks.json), [real Gemini outputs](live-rag-evaluation.json).

## What is implemented

- Three cited themed journeys, computed time-only recovery, and return-by deadlines with reserved buffer.
- A reproducible EXPO pedestrian graph, directional shortest paths, obstacle-aware endpoint connections and explicit uncertainty.
- Automated OSM collection, including historic monuments, with raw provenance and reproducible normalization.
- Separate primary-source evidence: 32 facts across 18 POIs, with 19 enriched records including access-only evidence, operational caveats and selected hours overrides.
- BM25 and multilingual concepts, negative preferences, indoor/outdoor constraints and restricted-access exclusions. A free-entry request stays explicitly unverified without price evidence.
- One itinerary shared by cards, map, model input and export. Kept stops cannot bypass hard constraints; failed replacements preserve the existing route.
- Mobile route-first layout, expandable preferences, and explicit Demo/Now/custom time modes.
- Routes with up to three distinct categories, shorter optional visits, full-visit hours checks and a bounded return leg.
- Group-interest coverage for 2–5 people, with visible compromises.
- Reversible weather/time alternatives and page-only discovery mission checkmarks.
- Gemini-generated explanations, focused activities and missions with source citations; separate deterministic facts and labelled fallback.
- EN/RU/KK, opt-in clearable location, mobile layout and itinerary export.

## Limitations to say out loud

- Generated prose is not automatically proven true. Place/citation membership, output bounds, exterior scopes and common unsupported claims are checked, but semantic errors can remain. Source facts are displayed separately.
- Three real Russian-language generation scenarios are retained for human review. This is not a statistically meaningful model-quality benchmark or user study. Mock responses are used for repeatable browser checks.
- OSM coverage is limited to five neighborhoods. Primary-source enrichment is manually researched and separately attributed; it is not a live source crawl on every request.
- Published schedules can be overridden by holidays or exceptional closures. Source-check dates are not on-site verification dates. Complex or seasonal hours remain unknown unless explicitly supported for the relevant scope.
- Five collected areas use connected OSM pedestrian geometry. Unknown endpoint connections and areas outside that graph remain estimated as straight-line distance × 1.3. Speeds are 75 m/min, or 55 in gentle mode. Missing connections between snapped components are rejected. Mapped entrances and exterior viewpoints are not on-site verified; sightlines, crossings, queues, closures and step-free access are not guaranteed.
- Return deadlines reserve time inside the budget; they do not guarantee punctual arrival. Recovery checks 15-minute increases up to 120 extra minutes and selected later departures, not every possible alternative. Story pairings are editorial and do not imply a shared historical origin.
- Short route pauses are planning choices, not promises about food preparation or admission. Full-meal and indoor-attraction visits may need additional time.
- Group coverage means matching selected categories, not equal enjoyment or a validated preference model.
- Weather is manual. Ratings, live events, prices, sockets and quietness have no live integration.
- Natural-language parsing recognizes a limited multilingual vocabulary, common negation patterns and durations. It is heuristic, not general language understanding. Use the structured controls for reliable constraints.
- Native-speaker review of Kazakh and real participant feedback are still needed.

## Judge walkthrough

1. Start in Demo mode near EXPO: show the 53-minute itinerary, with the same stops on cards and map.
2. Keep the alley, replace the café, inspect what changed, then undo.
3. Enter “Не хочу кофе, только парк”: show the interpretation and absence of cafés.
4. Choose the group scenario, apply rain, show unmet interests, and restore.
5. Change Monday to Tuesday near the museum; show source facts and exact visitor notes.
6. Choose the EXPO story with 120 minutes and a 30-minute walking cap. Show source-linked chapters, then reduce time and apply a checked recovery option.
7. Return to EXPO, set a 15:00 deadline and a five-minute reserve; show the timeline and mapped paths.
8. Show the mobile layout and privacy boundary. Keep the video ready if live generation is unavailable.

Lead with a useful decision the user can make, then show the evidence behind it.

## Version 5 hardening

Word durations, compact 1h30m and Kazakh clock-before-return phrases are tested. Detected unsupported or ambiguous time cues remove the old route and require a rewritten request or explicit time-control confirmation; this is a bounded grammar, not full natural-language understanding. Cards use the incoming route leg, not distance from the origin. First-party evidence is distinguished from category-only suggestions. Military museum hours remain unknown because official listings conflict. Expanded paths retain the original collection date and do not establish current entrances or closures.

Explicit ranges such as 30–60 minutes use the lower bound, with a visible explanation. Indefinite or conflicting time cues require clarification or explicit control confirmation.
