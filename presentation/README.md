# Pitch and demo materials

- `Qadam_ArcSolo_pitch_RU.pdf`: presentation-ready PDF, 12 slides.
- `Qadam_ArcSolo_pitch_RU.pptx`: editable deck with Russian speaker notes in each slide.
- `SPEAKER_NOTES_RU.md`: rehearsal script, target 6:50 including a short live demo.
- `Qadam_demo_RU.mp4`: actual browser walkthrough, Russian captions, no voiceover.
- `Qadam_demo_RU.srt`: optional subtitle track.
- `YOUTUBE_UPLOAD.md`: title, description and remaining upload step.
- `assets/`: actual screenshots used in the presentation.

The PDF uses embedded Cyrillic-capable fonts. The PPTX uses Noto Sans and Noto Serif; use the PDF if fonts differ on the presentation computer. It was rendered through LibreOffice for compatibility inspection.

Regenerate the deck with `.venv/bin/python scripts/make_presentation.py`. To replace the video, run the local server, install Playwright's encoder (`.venv/bin/python -m playwright install ffmpeg`), run `scripts/record_demo.py`, and transcode `artifacts/video/qadam-demo-raw.webm` with ffmpeg. The app uses simulated afternoon scenario times, explicitly labelled on screen.

The 114-second video records seven successful live Gemini responses and no browser errors. It demonstrates source-backed ideas, group coverage, reversible rain/time backups, museum schedule checks and small discovery missions. Source facts remain separate from generated advice: citation validation does not prove every sentence.

Before the pitch, recheck live model connectivity and judge access. The hosted demo and GitHub repository remain private; the YouTube upload is still required.
