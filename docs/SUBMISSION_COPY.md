# ArcSolo · prepared submission text

**Prepared only. Do not submit the form or upload the video without the participant's instruction.** No submission has been made.

Organizer form supplied by the participant: https://docs.google.com/forms/d/e/1FAIpQLSdvw89V9GtN8Uq7a6yNevZVlIprqroiGcMTEszepADXY_IMbQ/viewform

On 19 October 2026, an anonymous read redirected to Google sign-in. The actual questions, upload rules, character limits and cutoff could not be inspected. The following copy is based on the Track 1 brief; it is not a transcription of the form. Contact details must be supplied by the participant.

## Basic information

- Team: **ArcSolo**
- Project: **Qadam**
- Track: **1 — НИЦ Smart City: ИИ-помощник по прогулкам в городе Астана**
- Deadline supplied by the participant: **19 October 2026 inclusive**; exact organizer cutoff unverified.
- Repository: https://github.com/Csadow/qadam-astana
- Public interactive preview: https://qadam-arcsolo-astana.candy-ball-8297.chatgpt.site
- Presentation PDF: https://github.com/Csadow/qadam-astana/blob/main/presentation/Qadam_ArcSolo_pitch_RU.pdf
- Editable presentation: https://github.com/Csadow/qadam-astana/blob/main/presentation/Qadam_ArcSolo_pitch_RU.pptx
- Scenarios and limitations PDF: https://github.com/Csadow/qadam-astana/blob/main/docs/Qadam_Test_Scenarios_EN.pdf
- Recorded demo MP4: https://github.com/Csadow/qadam-astana/blob/main/presentation/Qadam_demo_RU.mp4
- YouTube watch URL: **not uploaded — still required by the brief**. The repository MP4 does not replace that requirement.
- Local source archive: `~/Downloads/Qadam_ArcSolo_submission.zip`.

## Short description (English)

Qadam turns a short break in Astana into an editable walk with 1–3 places, estimated visit times and a return plan. It retrieves real POI records and source facts, applies time and access constraints, and uses Gemini to suggest explanations, activities and discovery missions. Its adaptive companion recalculates the remaining walk after an unavailable café, a delay or a weather change while preserving the original return destination and deadline. The public preview includes a labelled rehearsal; live Gemini is demonstrated in the recording.

## Short description (Russian, if requested)

Qadam превращает свободные 30–120 минут в Астане в понятную прогулку: 1–3 места, конкретное занятие, оценка времени и возвращение. Система ищет по реальным POI, проверяет ограничения и использует Gemini для объяснений и идей по найденным фактам. Функция «Идём вместе» перестраивает оставшийся путь после недоступного кафе, задержки или изменения погоды, сохраняя исходную точку и срок возвращения. В публичном демо доступна явно обозначенная репетиция; живой Gemini показан в видеозаписи.

## RAG and data

An automated OpenStreetMap collector produced 300 named POIs across five Astana areas. Separate official-source enrichment adds 32 cited facts across 18 places, with 19 enriched records including access-only evidence. Retrieval combines BM25 and multilingual concepts. Deterministic checks select a feasible itinerary; Gemini receives selected POIs, facts and limited context. Output validation checks place/citation IDs, structure and common unsupported claims. Invalid responses fall back to visibly labelled templates. Source facts remain separate from generated text.

## Distinctive demonstration

Open the public preview and select **Try Walk with me**. Report **Unavailable on arrival**, then **Lose 15 minutes**, then **Rain started**. The route changes while the original **15:00** deadline and five-minute reserve remain fixed. **Return now** shows the remaining trip to the original start. Ending the rehearsal restores the visitor's previous plan. The interface also supports English, Russian and Kazakh, shared interests, source-backed story walks and route editing.

## Limitations and privacy

This is a prototype using an 18 October 2026 snapshot, with limited enrichment and no participant study. Walking times and entrance connections are estimates; it is not verified navigation. Weather and arrival at a stop are manually confirmed. Actual mode reads the device clock on each action; there is no background tracking. Exact origin coordinates and the raw request are not sent to Gemini. No account, stored walk history or analytics are required. Public hosted mode does not call paid generation; the local app and recorded demo demonstrate live Gemini.

## Materials ready for the participant

The repository/ZIP, Russian 12-slide PDF/PPTX and 6:15 speaker script, English scenario report, captioned Russian MP4/SRT and YouTube title/description are prepared. Organizer submission and YouTube upload remain unperformed at the participant's explicit request.
