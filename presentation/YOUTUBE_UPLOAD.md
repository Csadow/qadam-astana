# YouTube submission preparation

The required video has been recorded from the actual app. `Qadam_demo_RU.mp4` is an approximately 114-second silent walkthrough with burned-in Russian chapter captions. `Qadam_demo_RU.srt` is a separate subtitle track. The recording uses live Gemini responses; `docs/demo-generation-check.json` records seven successful generation responses and no browser errors.

An upload-capable YouTube connection was not available in this workspace. The video has **not** been uploaded. Upload it to your channel, choose an audience/visibility appropriate to the organizers (usually unlisted), and put the resulting watch URL into `docs/SUBMISSION.md` and the submission form. Verify that it plays from a browser that is not signed into your account. Do not claim a submitted YouTube link until this is done.

## Suggested title

Qadam — ИИ-помощник по прогулкам в Астане | ArcSolo | Build with AI

## Suggested description

Qadam — прототип команды ArcSolo для трека 1 Smart City хакатона Build with AI.

Помогаем выбрать 1–3 места рядом и составить короткую прогулку с учётом времени, интересов и контекста. У каждой рекомендации есть источник и объяснение. Недостающие сведения о розетках, тишине, часах и доступности не придумываются.

В демо: прогулка возле EXPO, маленькая миссия открытия, маршрут для компании с разными интересами, план Б на случай дождя и нехватки времени, проверка расписания музея, источники и приватность.

300 POI автоматически собраны из OpenStreetMap в пяти районах Астаны. Отдельно добавлен 21 факт об 11 местах из официальных источников. Снимок от 18.10.2026. © OpenStreetMap contributors, ODbL.

Режим записи: поиск по реальным POI + живой Gemini, который предлагает объяснение, занятие и маленькую миссию по найденным фактам. Код проверяет ID мест, цитаты и типичные неподтверждённые обещания; это не доказательство истинности каждой фразы. Исходные факты показаны отдельно. Интеграция проверена локально и на размещённом демо 18.10.2026. При ошибке провайдера включается явно обозначенный шаблонный режим. Время прогулок приблизительное, это не пошаговая навигация. Демо использует смоделированное дневное время.

Код: https://github.com/Csadow/qadam-astana

Перед сдачей обеспечьте жюри доступ к репозиторию или приложите подготовленный архив.
