"""Record a real, live-Gemini Russian walkthrough and capture matching pitch assets."""
from pathlib import Path
import time,json,subprocess
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
 def ready(live=False):
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
 page.locator('#map-details').evaluate('(e)=>e.open=true')
 capture('.map-card','map.png');capture('.planner-panel','planner.png')
 page.locator('#result-cards').scroll_into_view_if_needed()
 page.locator('.source-facts').first.evaluate('(e)=>e.open=true')
 caption('01 / ИДЕИ ПО МЕСТНЫМ ДАННЫМ','Gemini объясняет выбор и предлагает занятие. Факты выбранных мест показаны отдельно, со ссылками.',9)
 page.locator('.micro-mission').first.evaluate('(e)=>e.open=true');page.locator('.micro-mission').first.scroll_into_view_if_needed();page.locator('.mission-toggle').first.click()
 caption('02 / МАЛЕНЬКАЯ МИССИЯ','Небольшое наблюдение или вопрос делает прогулку личной. Отметка остаётся только в памяти этой страницы.',7)
 page.locator('#route-panel').scroll_into_view_if_needed();capture('#route-panel','route.png')
 caption('03 / ЧАС ВОЗЛЕ EXPO','Около 53 минут: 33 на ходьбу и 20 на короткие остановки. Возвращение включено; время приблизительное.',8)
 park='osm-way-1456208624';before=page.locator('[data-edit=keep]').evaluate_all('(es)=>es.map(e=>e.dataset.stop)');other=next(x for x in before if x!=park)
 page.locator('[data-edit=keep][data-stop="'+park+'"]').click();page.locator('[data-edit=replace][data-stop="'+other+'"]').click();ready();page.locator('#route-panel').scroll_into_view_if_needed();capture('#route-panel','editing.png')
 caption('04 / ОСТАВИТЬ МЕСТО, ЗАМЕНИТЬ СОСЕДНЮЮ ОСТАНОВКУ','Закрепили аллею, заменили кафе. Видны добавленное место и новое время. Удаление и отмена возвращают контроль пользователю.',9)
 page.locator('#undo-edit').click();assert page.locator('[data-edit=keep]').evaluate_all('(es)=>es.map(e=>e.dataset.stop)')==before
 page.locator('[data-edit=remove][data-stop="'+other+'"]').click();ready();page.locator('#route-panel').scroll_into_view_if_needed()
 caption('05 / УДАЛИТЬ И ОТМЕНИТЬ','Удалённая остановка не заполняется автоматически. Отмена возвращает точный предыдущий маршрут.',6)
 page.locator('#undo-edit').click()
 page.locator('#source-updates').evaluate('(e)=>e.open=true');page.locator('#source-updates').scroll_into_view_if_needed()
 caption('06 / ИСТОЧНИК МЕНЯЕТ РЕШЕНИЕ','Сады кампуса NU исключены: для входа нужно согласовать доступ. Запись на карте ещё не означает свободный вход.',7)
 scenario('group');page.locator('#group-summary').scroll_into_view_if_needed();capture('#group-summary','group.png');capture('#backup-panel','backup.png')
 caption('07 / ТРОЕ ДРУЗЕЙ — ТРИ ИНТЕРЕСА','Кофе, природа и достопримечательности. Один маршрут на 93 минуты учитывает все три выбранных интереса.',8)
 page.locator('[data-backup=rain]').click();ready();page.locator('#group-summary').scroll_into_view_if_needed()
 caption('08 / ПОШЁЛ ДОЖДЬ — ЕСТЬ ПЛАН Б','Пересчитываем маршрут для помещений. Видно, чьи интересы не удалось учесть. Остальные ограничения сохранены.',8)
 page.locator('#restore-plan').click();ready();page.locator('#backup-panel').scroll_into_view_if_needed()
 caption('09 / СРАВНИТЬ И ВЕРНУТЬ','Можно заранее посмотреть вариант на 15 минут короче и одним нажатием вернуть исходный план.',6)
 scenario('family');page.locator('#preferences').evaluate('(e)=>e.open=true');page.select_option('#time-mode','custom');page.locator('#departure').fill('2026-10-19T14:00');page.locator('#find-button').click();ready();page.locator('#source-updates').evaluate('(e)=>e.open=true');page.locator('#source-updates').scroll_into_view_if_needed()
 caption('10 / ПОНЕДЕЛЬНИК: МУЗЕЙ ЗАКРЫТ','Явно выбранное время: 19 октября. Официальное расписание исключает Национальный музей из рекомендаций.',7)
 page.locator('#departure').fill('2026-10-20T14:00');page.locator('#find-button').click();ready();page.locator('#card-osm-node-4894937300').scroll_into_view_if_needed();capture('#card-osm-node-4894937300','museum.png')
 caption('11 / ВТОРНИК: КОНКРЕТНОЕ СЕМЕЙНОЕ ЗАНЯТИЕ','Выбрали 20 октября. Идея опирается на реальные экспозиции; правила музея показаны отдельно от сгенерированного текста.',9)
 scenario('coffee');page.locator('#result-cards').scroll_into_view_if_needed();capture('.place-card','coffee.png')
 caption('12 / НЕИЗВЕСТНОЕ НЕ СТАНОВИТСЯ ОБЕЩАНИЕМ','Запрос о розетке и тишине сохраняет предупреждения. Точные координаты и исходный запрос не отправляются в Gemini.',8)
 scenario('expo');page.locator('#query').fill('Не хочу кофе, только парк');page.locator('#find-button').click();ready();page.locator('#intent-summary').scroll_into_view_if_needed()
 caption('13 / УЧИТЫВАЕМ ОТРИЦАНИЕ','«Не хочу кофе, только парк»: интерпретация запроса видна, кафе исключены. Карточки и карта показывают тот же маршрут.',8)
 page.locator('#query').fill('1 час 30 минут, пешком до 10 минут');page.locator('#budget').fill('120');page.locator('#find-button').click();ready();page.locator('#intent-summary').scroll_into_view_if_needed()
 caption('14 / ТОЧНЕЕ ПОНИМАЕМ ВРЕМЯ','«1 час 30 минут» — это 90 минут. Ограничение «пешком до 10 минут» применяется отдельно к каждому переходу.',7)
 page.locator('#query').fill('У меня полчаса');page.locator('#find-button').click();ready();page.locator('#intent-summary').scroll_into_view_if_needed()
 caption('14А / ПОЛЧАСА — ЗНАЧИТ 30 МИНУТ','Словесная длительность применяется к всему плану. Карточки показывают время от предыдущей остановки, как и маршрут.',6)
 page.locator('#query').fill('Пару часов');page.locator('#find-button').click();ready();page.locator('#recovery-panel').scroll_into_view_if_needed()
 caption('14Б / НЕ ГАДАЕМ О НЕЯСНОМ ВРЕМЕНИ','Если время не удалось распознать, старый маршрут убирается. Можно уточнить запрос или явно подтвердить настройки времени.',7)
 page.locator('#query').fill('');page.locator('#find-button').click();ready()
 page.locator('#preferences').evaluate('(e)=>e.open=true');page.select_option('#max-walk','30');page.select_option('#journey','expo-space-and-symbols');ready();page.locator('#story-panel').scroll_into_view_if_needed();page.locator('.story-chapters details').first.evaluate('(e)=>e.open=true');capture('#story-panel','story.png')
 caption('15 / ИСТОРИЯ МЕЖДУ ОСТАНОВКАМИ','Три истории по первоисточникам. Здесь — атриумы MEGA и грани монумента. У каждой главы есть вопрос, источник и условия посещения.',9)
 page.locator('#budget').fill('30');page.locator('#find-button').click();ready();page.locator('#recovery-panel').scroll_into_view_if_needed();capture('#recovery-panel','recovery.png')
 caption('16 / ЕСЛИ ПЛАН НЕ ПОМЕЩАЕТСЯ','Неполная история обозначена. Предложение увеличить время уже проверено планировщиком. Погода, доступ и предел ходьбы сохраняются.',8)
 page.locator('[data-recovery]').first.click();ready();page.locator('#story-panel').scroll_into_view_if_needed()
 caption('17 / ВЫБРАТЬ ВАРИАНТ ИЛИ ВЕРНУТЬСЯ','Применили предложенное время — обе главы вписались. Можно восстановить прежние условия одной кнопкой.',6)
 page.locator('#leave-story').click();ready();scenario('expo');page.locator('.deadline-options').evaluate('(e)=>e.open=true');page.select_option('#buffer','5');page.locator('#deadline-enabled').check();page.locator('#return-by').fill('2026-10-20T15:00');page.locator('#find-button').click();ready();page.locator('.timing-details').evaluate('(e)=>e.open=true');page.locator('#timing-panel').scroll_into_view_if_needed();capture('#timing-panel','timing.png')
 caption('18 / ВЕРНУТЬСЯ К 15:00 С ЗАПАСОМ','Возвращение включено. Пять минут оставлены на задержки. Расписание показывает оценку окончания и остаток времени; точное прибытие не гарантируется.',8)
 page.locator('#map-details').evaluate('(e)=>e.open=true');page.locator('.map-card').scroll_into_view_if_needed()
 caption('19 / КАРТА ПОКАЗЫВАЕТ ТОЧНОСТЬ','В пяти районах собраны пути OSM с пробелами. Сплошная линия идёт по карте, пунктир обозначает примерные соединения. Входы и текущие перекрытия требуют проверки.',8)
 page.evaluate('window.scrollTo(0,0)')
 caption('QADAM / ARCSOLO','300 POI · 32 дополнительных факта · 86 тестов · 25 сценариев · 73 проверки браузера. При ошибке модели — явно обозначенный шаблон.',7)
 assert any(c['mode']=='gemini-grounded' for c in checks);assert not errors
 video=page.video;context.close();video.save_as(str(TEMP/'qadam-demo-raw.webm'));browser.close()
wall_end=time.monotonic()-start
end=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(TEMP/'qadam-demo-raw.webm')]).decode())
def stamp(s):
 ms=int(s*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
srt=[]
for i,c in enumerate(chapters):
 finish=chapters[i+1]['start'] if i+1<len(chapters) else end;srt.extend([str(i+1),f'{stamp(c["start"])} --> {stamp(finish)}',c['title'],c['text'],''])
(OUT/'Qadam_demo_RU.srt').write_text('\n'.join(srt),encoding='utf-8');(TEMP/'chapters.json').write_text(json.dumps(chapters,ensure_ascii=False,indent=2))
(ROOT/'docs/demo-generation-check.json').write_text(json.dumps({'checkedAt':datetime.now(timezone.utc).isoformat(),'generationResponses':checks,'pageErrors':errors,'durationSeconds':round(end,2),'recordingWallSeconds':round(wall_end,2)},indent=2)+'\n')
print(f'Recorded {end:.1f} seconds with {len(checks)} real generation responses.')
