# ArcSolo · submission status

Deadline: **19 October 2026 inclusive**, as supplied by the participant. Confirm the organizer's exact cutoff and submission form separately; the brief did not include them.

| Required deliverable | Prepared artifact | Status |
|---|---|---|
| Product concept | `docs/PLAN.md`, pitch slides | Ready |
| Interactive prototype | Local Node app; private hosted Site | Local tested; private deployment succeeded |
| Automated POI collection | `scripts/collect_pois.py`, source snapshot, metadata | Collected and reproducible |
| RAG explanation | README, slide 6, `live-generation-check.json` | Live Gemini verified locally and on the hosted site |
| Test cases and limitations | `docs/SCENARIOS.md`, evaluation reports | Ready |
| Privacy and ethics | `docs/PRIVACY.md`, slide 8 | Ready |
| Repository or prototype archive | GitHub plus prepared ZIP | Repository private; give judges access or submit ZIP |
| Presentation, 5–7 minutes | PDF, PPTX, Russian speaker notes | Ready; rehearsal target 6:15 |
| YouTube demo link | MP4, SRT, upload copy | Video ready; upload still required |

Repository: https://github.com/Csadow/qadam-astana

Hosted demo: https://qadam-arcsolo-astana.candy-ball-8297.chatgpt.site

Private publication succeeded on 18 October 2026. This Site is owner-private and must not be treated as anonymously accessible to judges. The hosting platform confirmed successful deployment; a live hosted Gemini response was validated, and browser QA was performed on the same local application build. The API key is stored as a runtime secret and is excluded from the repository and submission archive.

Submission ZIP: `Qadam_ArcSolo_submission.zip` in the participant's Downloads directory, generated from the final Git commit. It contains the source snapshot, app, tests, English documents, Russian slides and demo video. Secrets, local caches, development environments and Git metadata are excluded.

YouTube watch URL: **not uploaded**.

## Final actions before submitting

1. Live Gemini is configured and verified. Before presenting, open the demo and confirm the Gemini badge appears after planning. A fresh local installation needs its own server-side key; use `node --env-file=.env scripts/check_gemini.mjs` to check it. If the provider is unavailable, explain the labelled template fallback.
2. Upload `presentation/Qadam_demo_RU.mp4` to YouTube and insert the actual watch URL. Use the supplied Russian title/description and optional SRT. The video has captions and no voiceover; you may replace it with your own narrated recording.
3. Give judges access to the private repository, explicitly choose to make it public, or submit the source ZIP. The brief allows an archive. The hosted demo is private too; use the local app/video unless audience settings are changed.
4. Rehearse the 6:15 Russian pitch. Keep the MP4 and PDF locally as backups. Check the exact deadline, AI-assistance rules and submission form with the organizers; those details are absent from the provided brief.
5. If possible, run the 3–5-person sessions in `docs/USABILITY.md`. Record actual observations; the pitch currently states that participant testing is pending.
6. Submit the actual links/files. This project has not been submitted to an organizer automatically.

## Claims supported by evidence

300 collected POIs; 25 first-party facts across 13 places (14 enriched records including access-only evidence), 102 opening-hour records, 26 accessibility tags; 57 code/API/Worker tests, 160 constraint combinations, 100 route/card agreement combinations, 17 acceptance scenarios, and 48 browser checks. These are deterministic engineering checks, not traction, user satisfaction, or live-model quality measurements.
