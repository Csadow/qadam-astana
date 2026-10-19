"""Browser integration for the manual companion; no paid generation required."""
from pathlib import Path
import json,os
from datetime import datetime,timezone
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts';OUT.mkdir(exist_ok=True)
checks=[]
def check(name,ok):
 checks.append({'name':name,'pass':bool(ok)})
 if not ok:raise AssertionError(name)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce')
 page=context.new_page();errors=[];bodies=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:bodies.append(r.post_data_json) if r.url.endswith('/api/generate') else None)
 url=os.environ.get('QADAM_TEST_URL','http://127.0.0.1:8787')
 mocked=url.startswith('http://127.0.0.1:')
 if mocked:page.route('**/api/generate',lambda route:route.fulfill(status=200,content_type='application/json',body=json.dumps({'mode':'retrieval-template','reason':'test_fixture','suggestions':[]})))
 page.goto(url,wait_until='networkidle')
 def ready():expect(page.locator('#find-button')).to_be_enabled(timeout=25000)
 def action(a):page.locator('[data-companion='+a+']').click();ready()
 def ids():return page.locator('.route-timeline li strong').all_text_contents()
 ready();old=ids();check('Companion is available on a feasible return plan',page.locator('[data-companion=rehearsal]').is_enabled())
 check('Actual walk requires Now mode',page.locator('[data-companion=live]').is_disabled())
 # Reserve is fixed before starting.
 page.locator('.deadline-options').evaluate('(e)=>e.open=true');page.select_option('#buffer','5');page.locator('#find-button').click();ready();old=ids()
 action('rehearsal');deadline=page.locator('#companion-deadline').inner_text()
 check('Rehearsal is visibly labelled','REHEARSAL' in page.locator('.companion-mode').inner_text())
 check('Ordinary planning cannot reset an active walk',page.locator('#plan-form').evaluate('(e)=>e.inert') and page.locator('[data-scenario=expo]').is_disabled())
 action('unavailable');check('Reported unavailable stop is retained as a local report','Unavailable for this walk only' in page.locator('#companion-update').inner_text())
 check('Moved route retains a separate return marker',page.locator('.return-marker').count()==1)
 action('delay');check('Delay keeps the initial deadline',page.locator('#companion-deadline').inner_text()==deadline)
 check('Reserve stays visible','5 min' in page.locator('.companion-metrics').inner_text())
 check('Elapsed delay is visible','Elapsed:' in page.locator('.companion-clock').inner_text() and int(page.locator('#companion-remaining').inner_text().split()[0])<45)
 action('rain');check('Rain report explains remaining outdoor walking','walking may still be outdoors' in page.locator('#companion-panel').inner_text())
 page.select_option('#language','ru');ready();check('Language switch preserves the active walk','РЕПЕТИЦИЯ' in page.locator('.companion-mode').inner_text() and page.locator('#companion-deadline').inner_text()==deadline)
 page.locator('#companion-panel').screenshot(path=str(OUT/'companion-ru.png'))
 page.select_option('#language','kk');ready();check('Kazakh companion is localized','СЫНАҚ' in page.locator('.companion-mode').inner_text())
 page.select_option('#language','en');ready();action('return')
 check('Return-only state removes obsolete place cards',not page.locator('#result-cards').is_visible() and page.locator('.route-timeline').count()==0)
 action('delay');action('delay');action('delay');check('Deadline overrun is explicit','Deadline exceeded' in page.locator('#companion-update').inner_text())
 action('undo');check('Rehearsal supports undo',page.locator('[data-companion=undo]').is_enabled())
 action('exit');check('Ending the walk restores planner and prior itinerary',not page.locator('#plan-form').evaluate('(e)=>e.inert') and ids()==old)
 check('Ordinary alternatives return after exit',page.locator('#backup-panel').is_visible())
 page.select_option('#time-mode','now');ready();action('live');check('Actual mode uses clock with no simulated delay','ACTUAL WALK' in page.locator('.companion-mode').inner_text() and page.locator('[data-companion=delay]').count()==0)
 action('refresh');check('Actual mode has no time-rewinding undo',page.locator('[data-companion=undo]').count()==0)
 page.reload(wait_until='networkidle');ready();check('Reload clears session state',page.locator('.companion-mode').count()==0)
 check('No session or coordinates sent for generation',all(not any(k in json.dumps(b) for k in ['latitude','longitude','returnOrigin','completed','unavailable','deadline','origin','query']) for b in bodies))
 check('No persistent walk storage',page.evaluate('localStorage.length===0 && sessionStorage.length===0'))
 page.set_viewport_size({'width':390,'height':844});action('rehearsal');page.locator('#companion-panel').scroll_into_view_if_needed()
 check('Mobile layout does not overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
 page.locator('[data-companion=delay]').focus();page.keyboard.press('Enter');ready();check('Keyboard can operate a delay',page.locator('#companion-remaining').inner_text()=='45 min')
 page.screenshot(path=str(OUT/'companion-mobile.png'))
 check('No browser errors',not errors)
 context.close();browser.close()
report={'url':url,'generationMocked':mocked,'checkedAt':datetime.now(timezone.utc).isoformat(),'checks':checks,'total':len(checks),'passed':sum(c['pass'] for c in checks)}
(ROOT/('docs/companion-browser-checks.json' if mocked else 'docs/companion-hosted-checks.json')).write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'checks':len(checks),'passed':report['passed']}))
