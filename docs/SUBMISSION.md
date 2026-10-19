# ArcSolo · submission status

Deadline: **19 October 2026 inclusive**, as supplied by the participant. Confirm the organizer's exact cutoff and submission form separately; the brief did not include them.

| Required deliverable | Prepared artifact | Status |
|---|---|---|
| Product concept | `docs/PLAN.md`, pitch slides | Ready |
| Interactive prototype | Local Node app; public judge preview | Local tested; public deployment succeeded |
| Automated POI collection | `scripts/collect_pois.py`, source snapshot, metadata | Collected and reproducible |
| RAG explanation | README, slide 6, `live-generation-check.json` | Live Gemini verified locally; public hosted planner verified |
| Test cases and limitations | `docs/SCENARIOS.md`, evaluation reports | Ready |
| Privacy and ethics | `docs/PRIVACY.md`, slide 8 | Ready |
| Repository or prototype archive | GitHub plus prepared ZIP | Public repository; ZIP also available |
| Presentation, 5–7 minutes | PDF, PPTX, Russian speaker notes | Ready; rehearsal target 6:15 |
| YouTube demo link | MP4, SRT, upload copy | Video ready; upload still required |

Public repository: https://github.com/Csadow/qadam-astana

Hosted demo: https://qadam-arcsolo-astana.candy-ball-8297.chatgpt.site

Version 5 public judge preview is deployed. Its planner, maps and sources work without a Gemini key; paid generation stays in the local app and recorded demo. Hosted integration checks confirmed 300 POIs, 32 cited facts, 22,868 graph nodes, 25,831 edges and the protected retrieval/template mode. The API key is excluded from the repository and submission archive.

Submission ZIP: `Qadam_ArcSolo_submission.zip` in the participant's Downloads directory, generated from the final Git commit. It contains the source snapshot, app, tests, English documents, Russian slides and demo video. Secrets, local caches, development environments and Git metadata are excluded.

YouTube watch URL: **not uploaded**.

## Final actions before submitting

1. Live Gemini is configured and verified. Before presenting, open the local app and confirm the Gemini badge appears after planning. A fresh local installation needs its own server-side key; use `node --env-file=.env scripts/check_gemini.mjs` to check it. If the provider is unavailable, explain the labelled template fallback.
2. Upload `presentation/Qadam_demo_RU.mp4` to YouTube and insert the actual watch URL. Use the supplied Russian title/description and optional SRT. The video has captions and no voiceover; you may replace it with your own narrated recording.
3. Submit the public repository link or source ZIP. Public visibility and anonymous GitHub API access were verified on 18 October 2026. The public judge preview runs planning and sources without paid generation; use the local app/video to demonstrate Gemini.
4. Rehearse the 6:15 Russian pitch. Keep the MP4 and PDF locally as backups. Check the exact deadline, AI-assistance rules and submission form with the organizers; those details are absent from the provided brief.
5. Participant testing is deferred. All five planned engineering improvements are implemented; see `docs/NEXT_STEPS.md` and the before/after intent audit; no user-study results are claimed.
6. Submit the actual links/files. This project has not been submitted to an organizer automatically.

## Claims supported by evidence

300 collected POIs; 32 first-party facts across 18 places (19 enriched records including access-only evidence), 102 opening-hour records, 26 accessibility tags; 103 code/API/Worker tests and 6 graph-collector tests, 160 constraint combinations, 100 route/card agreement combinations, 25 acceptance scenarios, and 98 browser checks (73 planner + 25 companion). These are deterministic engineering checks, not traction, user satisfaction, or live-model quality measurements.

Deployment and final source verification are recorded below. The evidence commit may follow the deployed application commit.

## Version 5 publication

Published source: `6e076479463c8e720f819ffcafc1f819cbdb4f02`. Deployment: `appgdep_6ad5e30b8574819182ca5f60ce82a6df`; environment revision 2; public access revision 2. Application source verification passed on [GitHub Actions](https://github.com/Csadow/qadam-astana/actions/runs/39230586227). Anonymous access was verified in a fresh browser with no authentication headers and no page errors. See `live-generation-check.json` for hosted integration, `public-preview-check.json` for anonymous access, and `narrative-review-v5.json` for model review findings and retained failed attempts. The earlier version 5 recording contained 17 live model responses and one labelled fallback. The current version 6 recording is 265 seconds and contains 20 live model responses and one labelled fallback; the companion demonstration begins at 3:18.
