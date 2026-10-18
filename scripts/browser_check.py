"""Deterministic browser checks. Narrative UI uses fixtures; real provider checks are separate."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts';OUT.mkdir(exist_ok=True)
checks=[]
def check(name,value):
 checks.append({'name':name,'pass':bool(value)})
 if not value: raise AssertionError(name)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1040},accept_downloads=True,reduced_motion='reduce')
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
 page.goto('http://127.0.0.1:8787',wait_until='networkidle');ready()
 marker_positions=page.locator('.map-marker').evaluate_all('(els)=>els.map(e=>{const m=e.transform.baseVal.consolidate().matrix;return [m.e,m.f]})')
 separated=all(abs(a[0]-b[0])>=175 or abs(a[1]-b[1])>=65 for i,a in enumerate(marker_positions) for b in marker_positions[i+1:])
 check('Initial scenario shows 1–3 sourced recommendations with separate map labels',1<=page.locator('.place-card').count()<=3 and separated)
 check('Narrative explanation, action and discovery mission render',page.locator('.model-why').count()>0 and page.locator('.micro-mission').count()>0)
 page.locator('.mission-toggle').first.click();check('Discovery mission can be marked and undone',page.locator('.mission-toggle').first.get_attribute('aria-pressed')=='true');page.locator('.mission-toggle').first.click()
 check('Official facts and citations are visible separately',page.locator('.source-facts a').count()>0)
 check('Controlled campus access affects recommendations','NU Park' not in page.locator('#result-cards').inner_text() and page.locator('#source-updates').is_visible())
 page.screenshot(path=str(OUT/'desktop.png'),full_page=True)
 scenario('coffee');check('Socket and quietness uncertainty remains visible','Sockets are not verified' in page.locator('#result-cards').inner_text() and 'Quietness is not verified' in page.locator('#result-cards').inner_text())
 check('Coffee-only route avoids repeated cafe stops',page.locator('.route-timeline li').count()==1)
 page.select_option('#language','ru');ready();check('Russian controls and warnings work','Розетки не подтверждены' in page.locator('#result-cards').inner_text())
 scenario('group');check('Group controls show three people',page.locator('[data-member]').count()==3 and page.locator('#group-fields').is_visible())
 check('Shared route covers all three selected interests','3 / 3' in page.locator('#group-summary').inner_text())
 prior_budget=page.locator('#budget').input_value();prior_walk=page.locator('#max-walk').input_value()
 page.locator('[data-backup=rain]').click();ready();check('Rain backup applies without changing walking limit or group','rain'==page.locator('#weather').input_value() and prior_walk==page.locator('#max-walk').input_value() and page.locator('#group-enabled').is_checked())
 check('Unmet group interests are shown after a compromise',page.locator('.coverage-chip:not(.yes)').count()>0)
 page.locator('#restore-plan').click();ready();check('Original plan can be restored',page.locator('#weather').input_value()=='fair' and page.locator('#budget').input_value()==prior_budget)
 page.locator('[data-backup=shorter]').click();ready();check('Shorter backup reduces the budget by 15 minutes',int(page.locator('#budget').input_value())==int(prior_budget)-15)
 scenario('family');page.locator('.more-options').evaluate('(e)=>e.open=true');page.locator('#departure').fill('2026-10-19T14:00');page.locator('#find-button').click();ready()
 check('Monday excludes the officially closed National Museum',page.locator('#card-osm-node-4894937300').count()==0)
 page.locator('#departure').fill('2026-10-20T14:00');page.locator('#find-button').click();ready()
 check('Tuesday museum exposes official exhibits and visitor restrictions',page.locator('#card-osm-node-4894937300 .source-facts').count()==1 and 'разрешения' in page.locator('#card-osm-node-4894937300').inner_text())
 with page.expect_download() as info:page.locator('#export-walk').click()
 info.value.save_as(str(OUT/'sample-itinerary.txt'));text=(OUT/'sample-itinerary.txt').read_text();check('Export carries timing and first-party source links','UTC+5' in text and 'nmrk.kz' in text)
 page.locator('#about-button').click();check('Privacy explanation is available',page.locator('#about-dialog').is_visible());page.keyboard.press('Escape')
 page.select_option('#language','kk');ready();check('Kazakh upgrade controls are translated','Қандай жаңалық' in page.locator('body').inner_text())
 scenario('expo');page.locator('#budget').fill('15');page.locator('#find-button').click();ready();check('Impossible request retains an honest empty state',page.locator('.empty-state').count()==1)
 scenario('group');page.set_viewport_size({'width':390,'height':844});check('Mobile has no horizontal overflow',page.evaluate('document.documentElement.scrollWidth <= innerWidth'));page.screenshot(path=str(OUT/'mobile.png'),full_page=True)
 context.grant_permissions(['geolocation']);context.set_geolocation({'latitude':51.128234,'longitude':71.430456});page.locator('#locate').click();expect(page.locator('#location')).to_have_value('custom');ready()
 check('Geolocation is opt-in and clearable',page.locator('#location').input_value()=='custom');page.locator('#locate').click();ready();check('Clearing location removes it',page.locator('#location option[value=custom]').count()==0)
 payload=json.dumps(bodies);check('Exact location and raw query never enter generation payloads','51.128234' not in payload and '71.430456' not in payload and '"query"' not in payload)
 check('No third-party browser requests',not external);check('No persistent location or mission storage',page.evaluate('localStorage.length===0 && sessionStorage.length===0'));check('No uncaught browser errors',not errors)
 browser.close()
report={'checks':checks,'passed':sum(c['pass'] for c in checks),'total':len(checks),'browser':'Installed Chromium via Playwright','generation':'Controlled fixtures for UI checks; real provider checks in live-rag-evaluation.json','externalRequests':external,'pageErrors':errors}
(ROOT/'docs/browser-checks.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
