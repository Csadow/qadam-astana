"""Record a real, live-Gemini Russian walkthrough and capture matching pitch assets."""
from pathlib import Path
import time,json
from datetime import datetime,timezone
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'presentation';TEMP=ROOT/'artifacts/video';TEMP.mkdir(parents=True,exist_ok=True)
chapters=[];checks=[];errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':900},record_video_dir=str(TEMP),record_video_size={'width':1440,'height':900},reduced_motion='reduce')
 page=context.new_page();start=time.monotonic();page.on('pageerror',lambda e:errors.append(str(e)))
 def inspect(response):
  if response.url.endswith('/api/generate'):
   data=response.json();checks.append({'mode':data.get('mode'),'validSuggestionCount':len(data.get('suggestions',[]))})
 page.on('response',inspect)
 def ready(live=True):
  expect(page.locator('#find-button')).to_be_enabled(timeout=25000)
  if live:assert 'Gemini' in page.locator('#mode-badge').inner_text()
 def scenario(name):page.locator('[data-scenario='+name+']').click();ready()
 page.goto('http://127.0.0.1:8787',wait_until='networkidle');ready();page.select_option('#language','ru');ready();scenario('expo')
 page.evaluate('''() => {const e=document.createElement('div');e.id='demo-caption';Object.assign(e.style,{position:'fixed',bottom:'18px',left:'5%',width:'90%',padding:'17px 24px',background:'#203e36f5',color:'#fffefa',borderRadius:'12px',zIndex:'9999',font:'18px/1.6 Arial,sans-serif',boxShadow:'0 4px 30px #203e3640',pointerEvents:'none'});document.body.append(e);}''')
 def caption(title,body,seconds=8):
  chapters.append({'start':round(time.monotonic()-start,2),'title':title,'text':body})
  page.evaluate('''([title,body])=>{const e=document.getElementById('demo-caption');e.replaceChildren();const b=document.createElement('strong');b.textContent=title;b.style.color='#d6ed92';e.append(b,document.createElement('br'),document.createTextNode(body));}''',[title,body]);page.wait_for_timeout(seconds*1000)
 def capture(selector,name):
  page.locator('#demo-caption').evaluate('(e)=>e.style.visibility="hidden"')
  page.locator(selector).first.screenshot(path=str(OUT/'assets'/name))
  page.locator('#demo-caption').evaluate('(e)=>e.style.visibility="visible"')
 caption('QADAM / ARCSOLO · Build with AI, Track 1','Городской план, который учитывает время, компанию и проверяемые источники.',6)
 capture('.map-card','map.png');capture('.planner-panel','planner.png')
 page.locator('#result-cards').scroll_into_view_if_needed()
 caption('01 / ИДЕИ ПО МЕСТНЫМ ДАННЫМ','Gemini объясняет выбор и предлагает занятие. Факты о филиале и монументе показаны отдельно, со ссылками.',9)
 page.locator('.micro-mission').first.scroll_into_view_if_needed();page.locator('.mission-toggle').first.click()
 caption('02 / МАЛЕНЬКАЯ МИССИЯ','Небольшое наблюдение или вопрос делает прогулку личной. Отметка остаётся только в памяти этой страницы.',7)
 page.locator('#route-panel').scroll_into_view_if_needed();capture('#route-panel','route.png')
 caption('03 / ЧАС ВОЗЛЕ EXPO','Около 51 минуты: 31 на ходьбу и 20 на короткие остановки. Возвращение включено; время приблизительное.',8)
 page.locator('#source-updates').evaluate('(e)=>e.open=true');page.locator('#source-updates').scroll_into_view_if_needed()
 caption('04 / ИСТОЧНИК МЕНЯЕТ РЕШЕНИЕ','Сады кампуса NU исключены: для входа нужно согласовать доступ. Запись на карте ещё не означает свободный вход.',8)
 scenario('group');page.locator('#group-summary').scroll_into_view_if_needed();capture('#group-summary','group.png');capture('#backup-panel','backup.png')
 caption('05 / ТРОЕ ДРУЗЕЙ — ТРИ ИНТЕРЕСА','Кофе, природа и достопримечательности. Один маршрут на 92 минуты учитывает все три выбранных интереса.',9)
 page.locator('[data-backup=rain]').click();ready();page.locator('#group-summary').scroll_into_view_if_needed()
 caption('06 / ПОШЁЛ ДОЖДЬ — ЕСТЬ ПЛАН Б','Пересчитываем маршрут для помещений. Видно, чьи интересы не удалось учесть. Остальные ограничения сохранены.',8)
 page.locator('#restore-plan').click();ready();page.locator('#backup-panel').scroll_into_view_if_needed()
 caption('07 / СРАВНИТЬ И ВЕРНУТЬ','Можно заранее посмотреть вариант на 15 минут короче и одним нажатием вернуть исходный план.',7)
 scenario('family');page.locator('.more-options').evaluate('(e)=>e.open=true');page.locator('#departure').fill('2026-10-19T14:00');page.locator('#find-button').click();ready();page.locator('#source-updates').evaluate('(e)=>e.open=true');page.locator('#source-updates').scroll_into_view_if_needed()
 caption('08 / ПОНЕДЕЛЬНИК: МУЗЕЙ ЗАКРЫТ','Смоделировали 19 октября. Официальное расписание исключает Национальный музей из рекомендаций.',8)
 page.locator('#departure').fill('2026-10-20T14:00');page.locator('#find-button').click();ready();page.locator('#card-osm-node-4894937300').scroll_into_view_if_needed();capture('#card-osm-node-4894937300','museum.png')
 caption('09 / ВТОРНИК: КОНКРЕТНОЕ СЕМЕЙНОЕ ЗАНЯТИЕ','Смоделировали 20 октября. Идея опирается на реальные экспозиции; ограничения на съёмку и закрытый зал остаются видимыми.',10)
 scenario('coffee');page.locator('#result-cards').scroll_into_view_if_needed();capture('.place-card','coffee.png')
 caption('10 / НЕИЗВЕСТНОЕ НЕ СТАНОВИТСЯ ОБЕЩАНИЕМ','Запрос о розетке и тишине сохраняет предупреждения. Точные координаты и исходный запрос не отправляются в Gemini.',8)
 page.evaluate('window.scrollTo(0,0)')
 caption('QADAM / ARCSOLO','300 POI · 21 дополнительный факт · 47 тестов · 12 сценариев · 27 проверок браузера. Код и презентация готовы.',7)
 assert checks and all(c['mode']=='gemini-grounded' for c in checks);assert not errors
 video=page.video;context.close();video.save_as(str(TEMP/'qadam-demo-raw.webm'));browser.close()
end=time.monotonic()-start
def stamp(s):
 ms=int(s*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
srt=[]
for i,c in enumerate(chapters):
 finish=chapters[i+1]['start'] if i+1<len(chapters) else end;srt.extend([str(i+1),f'{stamp(c["start"])} --> {stamp(finish)}',c['title'],c['text'],''])
(OUT/'Qadam_demo_RU.srt').write_text('\n'.join(srt),encoding='utf-8');(TEMP/'chapters.json').write_text(json.dumps(chapters,ensure_ascii=False,indent=2))
(ROOT/'docs/demo-generation-check.json').write_text(json.dumps({'checkedAt':datetime.now(timezone.utc).isoformat(),'generationResponses':checks,'pageErrors':errors,'durationSeconds':round(end,2)},indent=2)+'\n')
print(f'Recorded {end:.1f} seconds with {len(checks)} real generation responses.')
