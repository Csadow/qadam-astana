"""Record an actual Russian browser walkthrough with readable chapter captions."""
from pathlib import Path
import time,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'presentation';TEMP=ROOT/'artifacts/video';TEMP.mkdir(parents=True,exist_ok=True)
chapters=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':1440,'height':900},record_video_dir=str(TEMP),record_video_size={'width':1440,'height':900},reduced_motion='reduce')
    page=context.new_page();start=time.monotonic()
    page.goto('http://127.0.0.1:8787',wait_until='networkidle');page.select_option('#language','ru')
    page.evaluate('''() => {const el=document.createElement('div');el.id='demo-caption';Object.assign(el.style,{position:'fixed',bottom:'18px',left:'5%',width:'90%',padding:'17px 24px',background:'#203e36f5',color:'#fffefa',borderRadius:'12px',zIndex:'9999',font:'18px/1.6 Arial,sans-serif',boxShadow:'0 4px 30px #203e3640',pointerEvents:'none'});document.body.append(el);}''')
    def caption(title,body,seconds=8):
        chapters.append({'start':round(time.monotonic()-start,2),'title':title,'text':body})
        page.evaluate('''([title,body])=>{const e=document.getElementById('demo-caption');e.replaceChildren();const b=document.createElement('strong');b.textContent=title;b.style.color='#d6ed92';e.append(b,document.createElement('br'),document.createTextNode(body));}''',[title,body])
        page.wait_for_timeout(seconds*1000)
    caption('QADAM / ARCSOLO · Build with AI, Track 1','Астана за один свободный час. Рабочее демо на реальных данных OpenStreetMap.',7)
    page.locator('#planner').scroll_into_view_if_needed()
    caption('01 / КОНТЕКСТ','Выбираем старт возле EXPO, 60 минут и интересы. Демо использует смоделированное дневное время.',8)
    page.locator('#result-cards').scroll_into_view_if_needed()
    caption('02 / РЕАЛЬНЫЕ ВАРИАНТЫ','До трёх мест: почему подходят, сколько идти, что сделать. У каждого — ссылка на источник.',8)
    page.locator('#route-panel').scroll_into_view_if_needed()
    caption('03 / МАРШРУТ ВПИСЫВАЕТСЯ ВО ВРЕМЯ','60 минут: 25 на ходьбу и 35 на остановки. Возвращение к старту уже учтено.',8)
    page.locator('[data-scenario=coffee]').click();page.wait_for_timeout(500);page.locator('#result-cards').scroll_into_view_if_needed()
    caption('04 / ЧЕСТНЫЕ НЕИЗВЕСТНЫЕ','«Тихое кафе с розеткой»: кафе найдены, но розетки и тишина не подтверждены. Это видно в ответе.',9)
    page.locator('.source-details').first.locator('summary').click();page.locator('.place-card').first.scroll_into_view_if_needed()
    caption('05 / ДАННЫЕ МОЖНО ПРОВЕРИТЬ','Расписание, источник и дата сбора доступны в карточке. Дата сбора не означает проверку заведения.',8)
    page.locator('[data-scenario=family]').click();page.wait_for_timeout(500);page.locator('#result-cards').scroll_into_view_if_needed()
    caption('06 / ДРУГОЙ КОНТЕКСТ — ДРУГОЙ ПЛАН','С ребёнком: музей и парк. Неизвестные часы и неподтверждённые интерактивы отмечены явно.',8)
    page.locator('[data-scenario=expo]').click();page.locator('#budget').fill('15');page.locator('#find-button').click();page.wait_for_timeout(500);page.locator('.empty-state').scroll_into_view_if_needed()
    caption('07 / НЕТ ПОДХОДЯЩИХ МЕСТ — НЕТ ВЫДУМКИ','При 15 минутах система показывает пустой результат и предлагает изменить ограничения.',8)
    page.locator('[data-scenario=expo]').click();page.wait_for_timeout(500);page.locator('.evidence-panel summary').click();page.locator('.evidence-panel').scroll_into_view_if_needed()
    caption('08 / ПОНЯТНЫЙ RAG','298 POI → поиск BM25 и понятия → ограничения → идеи. Без ключа Gemini режим честно помечен как поисковое демо.',9)
    page.locator('#about-button').click()
    caption('09 / ПРИВАТНОСТЬ','Планирование в браузере. Точные координаты и исходный запрос не уходят в Gemini. Истории геолокации нет.',8)
    page.keyboard.press('Escape');page.evaluate('window.scrollTo(0,0)')
    caption('QADAM / ARCSOLO','Код, автоматизированный сбор, тесты и презентация: github.com/Csadow/qadam-astana',7)
    video=page.video;context.close();video.save_as(str(TEMP/'qadam-demo-raw.webm'));browser.close()
end=time.monotonic()-start
def stamp(seconds):
    ms=int(seconds*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
srt=[]
for i,c in enumerate(chapters):
    finish=chapters[i+1]['start'] if i+1<len(chapters) else end
    srt.extend([str(i+1),f'{stamp(c["start"])} --> {stamp(finish)}',c['title'],c['text'],''])
(OUT/'Qadam_demo_RU.srt').write_text('\n'.join(srt),encoding='utf-8')
(TEMP/'chapters.json').write_text(json.dumps(chapters,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Recorded {end:.1f} seconds. Raw video: {TEMP / "qadam-demo-raw.webm"}')
