# Pitch and demo materials

- `Qadam_ArcSolo_pitch_RU.pdf`: presentation-ready PDF, 12 slides.
- `Qadam_ArcSolo_pitch_RU.pptx`: editable deck with Russian speaker notes in each slide.
- `SPEAKER_NOTES_RU.md`: rehearsal script, target 6:15 including a short live demo.
- `Qadam_demo_RU.mp4`: actual browser walkthrough, Russian captions, no voiceover.
- `Qadam_demo_RU.srt`: optional subtitle track.
- `YOUTUBE_UPLOAD.md`: title, description and remaining upload step.
- `assets/`: actual screenshots used in the presentation.

The PDF uses embedded Cyrillic-capable fonts. The PPTX uses Noto Sans and Noto Serif; use the PDF if fonts differ on the presentation computer. It was rendered through LibreOffice for compatibility inspection.

Regenerate the deck with `.venv/bin/python scripts/make_presentation.py`. To replace the video, run the local server, install Playwright's encoder (`.venv/bin/python -m playwright install ffmpeg`), run `scripts/record_demo.py`, and transcode `artifacts/video/qadam-demo-raw.webm` with ffmpeg. The app uses simulated afternoon scenario times, explicitly labelled on screen.

The 265-second video records 20 successful live Gemini responses, 1 labelled fallback and no browser errors. From 3:18 it demonstrates the companion rehearsal: an unavailable café, lost time, rain and the unchanged original return deadline. It also demonstrates mapped EXPO paths, three source-backed story choices, partial-story recovery, return deadlines and buffers, precise duration parsing, itinerary editing, group coverage, museum hours and source uncertainty. Source facts remain separate from generated advice: citation validation does not prove every sentence.

Before the pitch, recheck live model connectivity. The GitHub repository is public. The public judge preview provides the planner, maps and sources; live Gemini is demonstrated locally and in this video. The YouTube upload is still required. Participant testing is deferred; the pitch presents it as future work.
