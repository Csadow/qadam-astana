# Test scenarios, limitations and judging guide

Acceptance cases use **19 October 2026, 14:00 Astana (UTC+5)** unless stated otherwise. The family museum case uses **Tuesday 20 October**; Monday closure is a separate test. These are simulated, reproducible scenarios, not live venue-availability claims.

| Case | Example input | Expected behavior |
|---|---|---|
| EXPO break | 60 minutes; discover/nature/coffee; return included | Three nearby options; a café and public alley route estimates 51 minutes, including 31 walking and 20 visiting. Shorter stops are labelled. |
| Group | EXPO; 120 minutes; coffee, nature, landmarks | Three interests covered by one 92-minute route. Show each person's coverage. |
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

`node scripts/evaluate.mjs` records **12/12 deterministic acceptance cases**. Browser checks cover the interactive backup cases and record **27/27** checks. **47 code/API/Worker tests** include a **160-combination constraint matrix**. These are engineering checks, not a user study. Reports: [acceptance](evaluation.json), [browser](browser-checks.json), [real Gemini outputs](live-rag-evaluation.json).

## What is implemented

- Automated OSM collection, including historic monuments, with raw provenance and reproducible normalization.
- Separate primary-source evidence: 21 facts across 11 POIs, operational caveats and selected hours overrides.
- BM25 and multilingual concepts, hard constraints and restricted-access exclusions.
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
- Walking is estimated as straight-line distance × 1.3 at 75 m/min, or 55 in gentle mode. Entrances, crossings, queues, ticket availability, crowds, weather delays and safe/step-free streets are not modeled.
- Short route pauses are planning choices, not promises about food preparation or admission. Full-meal and indoor-attraction visits may need additional time.
- Group coverage means matching selected categories, not equal enjoyment or a validated preference model.
- Weather is manual. Ratings, live events, prices, sockets and quietness have no live integration.
- Natural-language parsing recognizes a limited multilingual vocabulary and durations. Use the structured controls for reliable constraints.
- Native-speaker review of Kazakh and real participant feedback are still needed.

## Judge walkthrough

1. Show a cited museum detail and a personalized discovery mission.
2. Change Monday to Tuesday: the museum appears only when its published schedule permits it.
3. Choose the group scenario: show three interests and the shared route.
4. Apply rain: show the changed route and honest missing-interest coverage; restore it.
5. Show the source corrections that excluded campus gardens and the privacy boundary.

Lead with a useful decision the user can make, then show the evidence behind it.
