# YouTube submission preparation

The prepared demo is recorded from the actual app. `Qadam_demo_RU.mp4` is 5:53 with burned-in Russian chapter captions and no voiceover; `Qadam_demo_RU.srt` is the separate subtitle track. The companion begins at 0:14. The 353-second video comes from a recording session with 19 successful live Gemini responses, 3 labelled template fallbacks and no browser errors. Exact response modes and timings are in `docs/demo-generation-check.json`.

**Prepared only. The participant requested no actual submission: the video has not been uploaded to YouTube and the organizer form has not been submitted.** If the participant later chooses to upload it, the title and description below are ready to copy. The organizer brief requires a YouTube link; the GitHub MP4 link is not a substitute.

## Suggested title

Qadam — ИИ-помощник по прогулкам в Астане | ArcSolo | Build with AI

## Suggested description

Qadam — прототип команды ArcSolo для трека 1 Smart City хакатона Build with AI.

Помогаем выбрать 1–3 места рядом и составить короткую прогулку с учётом времени, интересов и контекста. У каждой рекомендации есть источник и объяснение. Недостающие сведения о розетках, тишине, часах и доступности не придумываются.

В демо: «Идём вместе» — адаптация после недоступного кафе, потери 15 минут и дождя с сохранением исходного срока и точки возвращения; пешеходные пути в пяти районах, истории по первоисточникам, варианты при нехватке времени, возвращение к 15:00 с запасом, составная и словесная длительность запроса, уточнение неясного времени, закрепление и замена остановок, удаление и отмена, запрос «не хочу кофе, только парк», маленькая миссия открытия, маршрут для компании с разными интересами, план Б на случай дождя и нехватки времени, проверка расписания музея, источники и приватность.

300 POI автоматически собраны из OpenStreetMap в пяти районах Астаны. Отдельно добавлено 32 факта о 18 местах (19 записей с обогащением) из официальных источников. Снимок от 18.10.2026. © OpenStreetMap contributors, ODbL.

Режим записи: поиск по реальным POI + живой Gemini, который предлагает объяснение, занятие и маленькую миссию по найденным фактам. Код проверяет ID мест, цитаты и типичные неподтверждённые обещания; это не доказательство истинности каждой фразы. Исходные факты показаны отдельно. Запись сделана с локальным приложением 19.10.2026 (Астана). При ошибке провайдера включается явно обозначенный шаблонный режим. Время прогулок приблизительное, это не пошаговая навигация. Демо использует смоделированное дневное время.

Код: https://github.com/Csadow/qadam-astana

Репозиторий открыт. Публичное демо показывает планировщик, карты и источники без платной генерации: https://qadam-arcsolo-astana.candy-ball-8297.chatgpt.site . Живой Gemini показан в видео и доступен при локальном запуске с ключом по инструкции README. Подготовленный архив также доступен для сдачи.
