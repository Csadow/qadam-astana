# Pitch and demo materials

- `Qadam_ArcSolo_pitch_RU.pdf`: presentation-ready PDF, 12 slides.
- `Qadam_ArcSolo_pitch_RU.pptx`: editable deck with Russian speaker notes in each slide.
- `SPEAKER_NOTES_RU.md`: rehearsal script, target 6:15 including a short live demo.
- `Qadam_demo_RU.mp4`: actual browser walkthrough, Russian captions, no voiceover.
- `Qadam_demo_RU.srt`: optional subtitle track.
- `YOUTUBE_UPLOAD.md`: title, description and remaining upload step.
- `assets/`: actual screenshots used in the presentation.

The PDF uses embedded Cyrillic-capable fonts. The PPTX uses Noto Sans and Noto Serif; use the PDF if fonts differ on the presentation computer. It was rendered through LibreOffice for compatibility inspection.

Regenerate the deck with `.venv/bin/python scripts/make_presentation.py`. To replace the video, run the local server, install Playwright's encoder (`.venv/bin/python -m playwright install ffmpeg`), run `.venv/bin/python scripts/record_demo.py`, then `python3 scripts/encode_demo.py`. The encoder trims the initial setup wait using the recording metadata and exports the MP4 and README GIF. It does not upload anything. The app uses simulated afternoon scenario times, explicitly labelled on screen.

The 353-second video comes from a recording session with 19 successful live Gemini responses, 3 labelled template fallbacks and no browser errors. The companion rehearsal begins at 0:14, directly after the opening caption: an unavailable café, lost time, rain and the unchanged original return deadline. The video then demonstrates itinerary editing, sources, groups, stories and time constraints. Citation validation does not prove support for every generated sentence.

Before the pitch, recheck live model connectivity. The GitHub repository is public. The public judge preview provides the planner, maps and sources; live Gemini is demonstrated locally and in this video. YouTube upload is required by the brief but has not been performed, at the participant’s request. Participant testing is deferred; the pitch presents it as future work.
