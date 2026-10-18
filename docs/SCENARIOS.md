# Test scenarios, limitations and judging guide

All example times below are simulated **19 October 2026 at 14:00 Astana (UTC+5)**, except the night case. They are reproducible scenarios, not live claims about venue availability. A collection timestamp is not a verification timestamp.

| Case | Example input | Expected behavior |
|---|---|---|
| EXPO break | MEGA Silk Way; 60 minutes; discover/nature/coffee; return included | 1–3 feasible options. In the current snapshot, café, park and garden candidates. A two-stop route totals an estimated 60 minutes, including return. |
| Quiet coffee | Baiterek; “Хочу тихое кафе с розеткой”; 60 minutes | Cafés with source links. Explicitly label quietness and sockets as unverified. Ask before ordering. |
| With a child | National Museum; “Прогулка с ребёнком”; 120 minutes | Museum/park/playground/mall candidates. Do not invent interactive exhibits or family facilities. |
| Rain | Khan Shatyr; 90 minutes; rain | Indoor categories. Explain weather is user-selected, not a live forecast. |
| Too little time | Museum area; 10 minutes; culture; 1-minute walking cap | Empty state; no invented nearby match. |
| Wheelchair | Baiterek; 60 minutes; accessibility required | Only wheelchair=yes source tags. Explicitly distinguish venue tag from unverified step-free route. |
| Airport at night | EXPO; 120 minutes; 23:00; flight context | Add transfer/check-in and night-safety warnings. Do not claim the user will catch a flight. |
| Outside coverage | Almaty coordinates | No Astana recommendation presented as nearby. |

Run `node scripts/evaluate.mjs` to generate [evaluation.json](evaluation.json). The recorded run passes **8/8** scenarios. This is a deterministic acceptance check, not a user satisfaction study. The engine tests also evaluate **160** combinations of start, budget, interest and weather. Browser checks are recorded in [browser-checks.json](browser-checks.json).

## What is implemented

- Automated real POI collection, provenance, deduplication, offline map geometry.
- Sparse BM25 retrieval plus multilingual intent concepts. No vector embeddings.
- Hard walking/total-time filters; return trip; category diversity; up to three route stops.
- Conservative weekly opening-hours parser that checks arrival and the full visit.
- EN/RU/KK interface, consent-based location, responsive layout, itinerary export.
- Optional Gemini structured generation with action allowlists, validation and fallback.

## Limitations to say out loud

- Live Gemini structured generation was verified locally and on the private hosted site on 18 October 2026; see `live-generation-check.json`. This verifies connectivity and valid output, not broad model quality. The adapter also has mock tests for invalid responses and falls back to explicitly labelled templates when unavailable.
- Generation is deliberately narrow: Gemini chooses an approved activity ID for each retrieved POI. It does not write unrestricted factual prose or extract arbitrary constraints. The app renders localized suggestions. This is constrained retrieval-augmented generation, not a general city chatbot.
- OSM data is incomplete and can be stale. Descriptions are transparent tag summaries. Complex hours (holidays, seasonal rules, appointments) are unknown.
- Walking estimates use a 1.3 detour factor on straight-line distance at 75 m/min, or 55 m/min in gentle mode. No crossings, barriers, entrances, crowds, weather delays, queues or ticket availability are modeled.
- Weather is manual; events, ratings, prices, crowd levels and sockets have no live integration. Unknown opening hours are allowed with a warning unless the user enables the stricter filter.
- The interface's structured fields are the reliable constraints. Natural-language parsing recognizes a limited multilingual vocabulary and durations; it is not comprehensive language understanding.
- Way centroids can be inaccurate for entrances; the map is context, not navigation.
- English, Russian and Kazakh UI copy is implemented; native-speaker review is still desirable.

## Judge walkthrough (about 90 seconds)

1. Select EXPO; show the total route and the included return walk.
2. Select coffee; show the explicit socket/quietness uncertainty and source record.
3. Switch to Russian; select the family scenario; show a source and unknown-hours warning.
4. Reduce time to 15 minutes; show the honest empty state.
5. Open “Behind these suggestions”; explain the real data, retriever and generator boundary.

The strongest claim is **transparent feasibility from real data**, not “our AI knows everything about Astana.”
