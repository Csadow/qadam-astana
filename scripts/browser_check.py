"""Deterministic UI integration checks. Live Gemini checks are separate."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts';OUT.mkdir(exist_ok=True)
checks=[];metrics={}
def check(name,value):
 checks.append({'name':name,'pass':bool(value)})
 if not value:raise AssertionError(name)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True,reduced_motion='reduce')
 page=context.new_page();errors=[];external=[];bodies=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:external.append(r.url) if not r.url.startswith('http://127.0.0.1:8787') else None)
 def mock(route):
  body=route.request.post_data_json;bodies.append(body)
  suggestions=[{'id':i,'why':'A short discovery matched to your chosen interests.','activity':'Choose one detail to explore at your own pace.','mission':'Describe one detail you would normally overlook.','evidenceIds':[i+':category']} for i in body['ids']]
  route.fulfill(status=200,content_type='application/json',body=json.dumps({'mode':'gemini-grounded','suggestions':suggestions}))
 page.route('**/api/generate',mock)
 def ready():expect(page.locator('#find-button')).to_be_enabled(timeout=25000)
 def scenario(name):page.locator('[data-scenario='+name+']').click();ready()
 def preferences():
  page.locator('#planner').evaluate('(e)=>e.classList.remove("compact")');page.locator('#preferences').evaluate('(e)=>e.open=true')
 def run_query(q):page.locator('#query').fill(q);page.locator('#find-button').click();ready()
 def ids():return page.locator('.place-card').evaluate_all('(es)=>es.map(e=>e.id.slice(5))')
 page.goto('http://127.0.0.1:8787',wait_until='networkidle');ready()
 check('Initial itinerary contains 1–3 recommendations',1<=len(ids())<=3)
 check('Cards, route controls and generation refer to the same stops',ids()==page.locator('[data-edit=keep]').evaluate_all('(es)=>es.map(e=>e.dataset.stop)')==bodies[-1]['ids'])
 check('Narrative explanation and action render',page.locator('.model-why').count()>0 and page.locator('.action-idea').count()>0)
 page.locator('.micro-mission').first.evaluate('(e)=>e.open=true');page.locator('.mission-toggle').first.click();check('Discovery mission can be marked and undone',page.locator('.mission-toggle').first.get_attribute('aria-pressed')=='true');page.locator('.mission-toggle').first.click()
 page.locator('.source-facts').first.evaluate('(e)=>e.open=true');check('Source facts stay separate and can be expanded',page.locator('.source-facts a').first.is_visible())
 check('Campus restrictions are explained','NU Park' not in page.locator('#result-cards').inner_text() and page.locator('#source-updates').is_visible())
 check('Demo time is fixed and visibly labelled',page.locator('#departure').input_value()=='2026-10-20T14:00' and 'Demo time' in page.locator('#status').inner_text())
 page.screenshot(path=str(OUT/'desktop.png'),full_page=True)
 # The route keeps a chosen park while replacing the cafe.
 start_ids=ids();park=start_ids[1];cafe=start_ids[0]
 page.locator('[data-edit=keep][data-stop="'+park+'"]').click();check('A kept stop is marked and its remove action is disabled',page.locator('[data-edit=keep][data-stop="'+park+'"]').get_attribute('aria-pressed')=='true' and page.locator('[data-edit=remove][data-stop="'+park+'"]').is_disabled())
 page.locator('[data-edit=replace][data-stop="'+cafe+'"]').click();ready();check('Replace changes one stop and preserves the other',park in ids() and cafe not in ids() and len(ids())==len(start_ids))
 check('Replacement explains the removed and added stops','Added' in page.locator('#edit-feedback').inner_text() and 'Removed' in page.locator('#edit-feedback').inner_text())
 page.locator('#undo-edit').click();check('Undo restores the exact itinerary and keep state',ids()==start_ids and page.locator('[data-edit=keep][data-stop="'+park+'"]').get_attribute('aria-pressed')=='true')
 page.locator('[data-edit=remove][data-stop="'+cafe+'"]').click();ready();check('Remove leaves the slot empty',ids()==[park]);page.locator('#undo-edit').click()
 preferences();page.select_option('#weather','rain');page.locator('#find-button').click();ready();check('Kept outdoor stop cannot bypass rain constraints',len(ids())==0 and 'kept stop no longer fits' in page.locator('#status').inner_text())
 page.locator('[data-release]').click();ready();check('Conflicting kept stop can be released',len(ids())>0)
 scenario('coffee');check('Socket and quietness remain unverified','Sockets are not verified' in page.locator('#result-cards').inner_text() and 'Quietness is not verified' in page.locator('#result-cards').inner_text())
 check('Coffee route has one cafe stop',page.locator('.route-timeline li').count()==1)
 for query in ['No coffee, just a park','Не хочу кофе, только парк','Кофе керек емес, тек саябақ']:
  run_query(query);check('Negation respected: '+query,len(ids())>0 and 'café stop' not in page.locator('#result-cards').inner_text())
 run_query('Only coffee indoors');check('Indoor constraint is shown in interpretation','Indoors' in page.locator('#intent-summary').inner_text())
 page.select_option('#language','ru');ready();scenario('coffee');check('Russian source uncertainty stays visible','Розетки не подтверждены' in page.locator('#result-cards').inner_text())
 scenario('group');check('Three group preferences remain editable',page.locator('[data-member]').count()==3 and page.locator('#group-fields').is_visible())
 check('Shared route covers all three interests','3 / 3' in page.locator('#group-summary').inner_text())
 budget=page.locator('#budget').input_value();walk=page.locator('#max-walk').input_value()
 page.locator('[data-edit=keep]').first.click();page.locator('[data-edit=keep]').first.click()
 page.locator('[data-backup=rain]').click();ready();check('Rain backup retains group and walking limit',page.locator('#weather').input_value()=='rain' and page.locator('#max-walk').input_value()==walk and page.locator('#group-enabled').is_checked())
 check('Changing context clears undo entries from the previous plan',page.locator('#undo-edit').count()==0)
 check('Group compromise is visible',page.locator('.coverage-chip:not(.yes)').count()>0)
 page.locator('#restore-plan').click();ready();check('Original weather and budget can be restored',page.locator('#weather').input_value()=='fair' and page.locator('#budget').input_value()==budget)
 page.locator('[data-backup=shorter]').click();ready();check('Shorter preview reduces the budget by 15 minutes',int(page.locator('#budget').input_value())==int(budget)-15)
 scenario('family');preferences();page.select_option('#time-mode','custom');page.locator('#departure').fill('2026-10-19T14:00');page.locator('#find-button').click();ready()
 check('Monday museum closure remains enforced',page.locator('#card-osm-node-4894937300').count()==0)
 page.locator('#departure').fill('2026-10-20T14:00');page.locator('#find-button').click();ready()
 check('Tuesday museum has source details and exact visitor restrictions',page.locator('#card-osm-node-4894937300 .source-facts').count()==1 and 'разрешения' in page.locator('#card-osm-node-4894937300').inner_text())
 scenario('family');check('Scenario selection preserves a custom departure time',page.locator('#time-mode').input_value()=='custom' and page.locator('#departure').input_value()=='2026-10-20T14:00')
 with page.expect_download() as info:page.locator('#export-walk').click()
 info.value.save_as(str(OUT/'sample-itinerary.txt'));export=(OUT/'sample-itinerary.txt').read_text();check('Export includes itinerary time and cited facts','UTC+5' in export and 'nmrk.kz' in export)
 page.select_option('#time-mode','now');ready();check('Now mode uses the actual Astana time',page.evaluate('Math.abs(Date.now()-new Date(document.querySelector("#departure").value+":00+05:00").getTime())<90000'))
 page.select_option('#time-mode','demo');ready();check('Returning to Demo restores its fixed date',page.locator('#departure').input_value()=='2026-10-20T14:00')
 page.locator('#about-button').click();check('Privacy information remains available',page.locator('#about-dialog').is_visible());page.keyboard.press('Escape')
 page.select_option('#language','kk');ready();preferences();check('Kazakh controls and itinerary editing are translated','Қандай жаңалық' in page.locator('body').inner_text() and 'Бекіту' in page.locator('#route-panel').inner_text())
 # A mobile reload starts with the compact editor and the itinerary near the top.
 page.set_viewport_size({'width':390,'height':844});page.reload(wait_until='networkidle');ready()
 metrics['mobileRouteTop']=round(page.locator('#route-panel').bounding_box()['y']);metrics['mobileViewport']={'width':390,'height':844}
 check('Mobile route starts within the first viewport',metrics['mobileRouteTop']<844)
 check('Mobile has no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
 page.screenshot(path=str(OUT/'mobile.png'),full_page=True)
 page.locator('#map-details').evaluate('(e)=>e.open=true')
 check('Mobile map labels fit their container',page.locator('.map-marker').evaluate_all('(es)=>{const m=document.querySelector("#map").getBoundingClientRect();return es.every(e=>{const r=e.getBoundingClientRect();return r.left>=m.left&&r.right<=m.right&&r.top>=m.top&&r.bottom<=m.bottom})}'))
 page.locator('#planner-toggle').click();check('Mobile preferences expand accessibly',page.locator('#plan-form').is_visible() and page.locator('#planner-toggle').get_attribute('aria-expanded')=='true')
 page.locator('#query').fill('No coffee, just a park');page.locator('#find-button').click();ready();check('Mobile submit collapses preferences and focuses the result',not page.locator('#plan-form').is_visible() and page.locator('#results-title').evaluate('(e)=>e===document.activeElement'))
 page.locator('#edit-request').click();check('Interpreted request can be edited',page.locator('#query').is_visible() and page.locator('#query').evaluate('(e)=>e===document.activeElement'))
 context.grant_permissions(['geolocation']);context.set_geolocation({'latitude':51.128234,'longitude':71.430456});page.locator('#locate').click();expect(page.locator('#location')).to_have_value('custom');ready()
 check('Location is opt-in',page.locator('#location').input_value()=='custom');page.locator('#locate').click();ready();check('Location can be cleared',page.locator('#location option[value=custom]').count()==0)
 payload=json.dumps(bodies);check('Coordinates and raw query never enter generation payloads','51.128234' not in payload and '71.430456' not in payload and '"query"' not in payload)
 check('No third-party browser requests',not external);check('No persistent location or editing history',page.evaluate('localStorage.length===0&&sessionStorage.length===0'));check('No uncaught browser errors',not errors)
 browser.close()
report={'checks':checks,'passed':sum(c['pass'] for c in checks),'total':len(checks),'metrics':metrics,'browser':'Installed Chromium via Playwright','generation':'Controlled fixtures for UI checks; real provider checks in live-rag-evaluation.json','externalRequests':external,'pageErrors':errors}
(ROOT/'docs/browser-checks.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
