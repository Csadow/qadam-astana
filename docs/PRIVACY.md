# Privacy, reliability and user safety

Precise geolocation is requested only after a user click and browser permission. It lives in page memory; a clear-location action removes it. The app writes no location history, cookies, account database, localStorage, sessionStorage or analytics events. Preset landmarks are available without location permission.

Recommendation ranking and route planning run locally in the browser. Map geometry is included with the app; the browser makes no external map-tile requests. The optional generation request sends only selected public POI IDs, language and three preference booleans (family, quiet, sockets). The server reconstructs trusted records and sends those public records to Gemini. It never forwards the user's precise origin or raw query. Hosting infrastructure and the model provider may still process network metadata. Opening a source link is an explicit external navigation.

POI records are untrusted input. Text is escaped before rendering; map source links are restricted to canonical OSM record URLs. The model is told not to follow source instructions, and its output must contain exactly one allowed action ID for each selected POI. Fabricated IDs, unsupported actions, duplicate records, malformed JSON, HTTP errors and timeouts all trigger the labelled fallback. Venue names, coordinates, hours and accessibility come from source records, never the model.

Unknown opening hours are not “open now.” The parser handles a limited weekly subset and treats unsupported expressions as unknown. Availability is not guaranteed even when a visit fits the published schedule. Accessibility tags are not verified step-free routes. No claims are made about sockets, quietness, child interactivity, night security or lighting without evidence. Activity suggestions are separately labelled.

Local serving is loopback-only. API responses are no-store; bodies are limited to 8 KiB; cross-origin browser writes are rejected. The hosted Site starts private. Before public operation with a paid model key, add authentication/rate limits and budget controls. Keep `.env` ignored and configure hosted secrets through the hosting provider, never client JavaScript.

Future monetization must not bypass relevance or feasibility filters. Sponsored results must be clearly labelled. Location histories are not part of the business model.
