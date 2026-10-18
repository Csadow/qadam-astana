# Qadam — Astana, one good walk at a time

## Brief and product

Team: **ArcSolo**. Deadline supplied by participant: **19 October 2026 inclusive**. Project documentation in English; pitch in Russian.

Build with AI, Track 1 / Smart City: a location-aware, context-sensitive POI retrieval and generation assistant for Astana. The source brief is `FINAL Задачи_хакатона.docx.pdf`, pages 1–3. Track 2's MCP and GCP requirements do not apply.

Target users: residents with a short break, parents planning an outing, and visitors exploring an unfamiliar neighborhood. The first release concentrates on EXPO walks, family activities, and coffee stops. No claim of verified sockets, quietness, accessibility, or opening status without source evidence.

## Delivery sequence

1. Record the concept, requirements, architecture and acceptance criteria here.
2. Create `Csadow/qadam-astana` on GitHub (private until the participant chooses to share it).
3. Automate collection from OpenStreetMap Overpass; preserve source IDs, timestamps, original tags, and ODbL attribution. Collect a real snapshot and measure coverage.
4. Implement a multilingual, concept-aware lexical retriever with geographic filtering, walking/visit budgets, conservative opening-hours handling, and explicit missing-data behavior.
5. Build an accessible responsive interface with an offline street map, preset scenarios, evidence cards, adjustable context, and a feasible mini-route.
6. Add server-side Gemini generation grounded in retrieved POIs. Never expose keys or send precise origin coordinates to the model. Provide a clearly identified deterministic fallback when the model is unavailable.
7. Test ranking, constraints, missing evidence, injection attempts, routing, privacy, APIs and the UI. Publish a demo if hosting is available.
8. Produce a Russian 5–7 minute pitch, editable slides, PDF, demo recording/script, and submission checklist. Report any account-dependent submission steps honestly.

## Architecture

- Dependency-free JavaScript modules, Node 22+ local server, browser client, Cloudflare-compatible Worker deployment.
- Automated Python standard-library data collector → raw OSM snapshot + normalized POIs + static street geometry.
- RAG: parse context → hard constraints → lexical/concept retrieval → distance and time scoring → 1–3 source-backed POIs → optional constrained Gemini generation → validated rendering.
- Template fallback works without credentials. It is not presented as live LLM output.
- Privacy: no user database, no analytics, no location persistence; precise coordinates used transiently. Static map avoids third-party tile calls. Provider and hosting infrastructure may process requests.
- Sources and generated activity suggestions are visibly separated. Walking estimates use a disclosed detour factor and are not navigation instructions.

## Judging priorities and acceptance

| Brief priority | Implementation | Acceptance evidence |
|---|---|---|
| Relevance | Nearby candidates with category/concept matching | Scenario tests and visible reasons |
| Context | Available time, walking limit, weather, family and accessibility preferences | Constraint tests; infeasible results rejected |
| Explanation | Why, visit duration, activity idea, per-place source | Evidence shown on every result |
| UX | One-click scenarios, adjustable form, street map, responsive layout | Browser walkthrough |
| Creativity | Budgeted multi-stop route; EN/RU/KK interface | Route total and language checks |
| Ethics | Honest unknowns, consent for location, no stored history | Privacy and adversarial tests |
| Completeness | Automated collector, repository, demo, docs, slides | Deliverable inventory |

## Boundaries and risks

OSM coverage is uneven; collection timestamps do not imply venue verification. Complex opening hours remain unknown. Walking estimates do not establish safe or step-free paths. Weather is user-selected context, not a live forecast. Airport trips need a separate travel buffer. Model output is limited to source-linked activity suggestions and never sets factual venue fields. API integration requires a user-supplied server secret. Business and impact numbers will be labelled hypotheses, not measured outcomes.

## Business hypothesis

Free consumer discovery; paid municipal, hotel, and event integrations after a pilot. Any future sponsored placements must be labelled and must not bypass feasibility constraints. Pilot metrics: useful recommendation rate, planning time, constraint violations, and source coverage. No invented traction or guaranteed winning claims.
