# Pitch and demo materials

- `Qadam_ArcSolo_pitch_RU.pdf`: presentation-ready PDF, 11 slides.
- `Qadam_ArcSolo_pitch_RU.pptx`: editable deck with Russian speaker notes in each slide.
- `SPEAKER_NOTES_RU.md`: rehearsal script, target 6:20 including a short live demo.
- `Qadam_demo_RU.mp4`: actual browser walkthrough, Russian captions, no voiceover.
- `Qadam_demo_RU.srt`: optional subtitle track.
- `YOUTUBE_UPLOAD.md`: title, description and remaining upload step.
- `assets/`: actual screenshots used in the presentation.

The PDF uses embedded Cyrillic-capable fonts. The PPTX uses Noto Sans and Noto Serif; use the PDF if fonts differ on the presentation computer. It was rendered through LibreOffice for compatibility inspection.

Regenerate the deck with `.venv/bin/python scripts/make_presentation.py`. To replace the video, run the local server, install Playwright's encoder (`.venv/bin/python -m playwright install ffmpeg`), run `scripts/record_demo.py`, and transcode `artifacts/video/qadam-demo-raw.webm` with ffmpeg. The app uses simulated afternoon scenario times, explicitly labelled on screen.

Before the pitch, ensure all claims about model connectivity, sharing and test counts still match your final build. Current deck and video honestly show retrieval/template mode, with optional Gemini integration awaiting a live key.
