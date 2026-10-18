"""End-to-end browser checks against a running local server, plus review screenshots."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts'
OUT.mkdir(exist_ok=True)
checks=[]
def check(name,value):
    checks.append({'name':name,'pass':bool(value)})
    if not value: raise AssertionError(name)

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':1440,'height':1040},device_scale_factor=1,accept_downloads=True)
    page=context.new_page()
    errors=[]; external=[]; generation_bodies=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda r:external.append(r.url) if not r.url.startswith('http://127.0.0.1:8787') else None)
    page.on('request',lambda r:generation_bodies.append(r.post_data) if '/api/generate' in r.url else None)
    page.goto('http://127.0.0.1:8787',wait_until='networkidle')
    check('Initial scenario shows 1–3 sourced recommendations',1<=page.locator('.place-card').count()<=3 and page.locator('.source-link').count()==page.locator('.place-card').count())
    check('Initial two-stop route fits 60 minutes','60 / 60' in page.locator('#route-panel').inner_text())
    page.screenshot(path=str(OUT/'desktop.png'),full_page=True)
    page.locator('#planner').screenshot(path=str(OUT/'planner.png'))
    page.locator('[data-scenario=coffee]').click();page.wait_for_timeout(250)
    check('Socket and quietness warnings visible','Sockets are not verified' in page.locator('#result-cards').inner_text() and 'Quietness is not verified' in page.locator('#result-cards').inner_text())
    check('Coffee itinerary avoids repetitive café hopping',page.locator('.route-timeline li').count()==1)
    page.select_option('#language','ru')
    check('Russian interface and evidence labels work','Чего хочется' in page.locator('body').inner_text() and 'Розетки не подтверждены' in page.locator('#result-cards').inner_text())
    page.screenshot(path=str(OUT/'coffee-ru.png'),full_page=True)
    page.locator('[data-scenario=family]').click();page.wait_for_timeout(250)
    check('Family scenario returns source-backed places',page.locator('.place-card').count()>0)
    with page.expect_download() as info:page.locator('#export-walk').click()
    download=info.value;download.save_as(str(OUT/'sample-itinerary.txt'))
    text=(OUT/'sample-itinerary.txt').read_text()
    check('Export includes source citations and timing','openstreetmap.org/' in text and 'UTC+5' in text)
    page.locator('#about-button').click()
    check('Privacy explanation is accessible in dialog',page.locator('#about-dialog').is_visible() and 'Gemini' in page.locator('#about-content').inner_text())
    page.keyboard.press('Escape')
    page.select_option('#language','kk')
    check('Kazakh interface works','Бос уақыт' in page.locator('body').inner_text())
    page.select_option('#language','en')
    page.locator('[data-scenario=expo]').click();page.wait_for_timeout(250)
    page.locator('#budget').fill('15');page.locator('#find-button').click();page.wait_for_timeout(250)
    check('Impossible request has a clear empty state',page.locator('.empty-state').count()==1)
    page.locator('[data-scenario=expo]').click();page.wait_for_timeout(250)
    page.set_viewport_size({'width':390,'height':844})
    check('Mobile page has no horizontal overflow',page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'))
    page.screenshot(path=str(OUT/'mobile.png'),full_page=True)
    context.grant_permissions(['geolocation']);context.set_geolocation({'latitude':51.128234,'longitude':71.430456})
    page.locator('#locate').click();page.wait_for_timeout(400)
    check('Geolocation is opt-in and clearable',page.locator('#location').input_value()=='custom')
    page.locator('#locate').click();page.wait_for_timeout(200)
    check('Clearing location removes it from the selector',page.locator('#location option[value=custom]').count()==0)
    check('No exact coordinates or raw query are sent to generation',all('51.128234' not in (b or '') and '71.430456' not in (b or '') and '"query"' not in (b or '') for b in generation_bodies))
    check('No third-party requests during normal use',not external)
    check('No persistent browser storage',page.evaluate('localStorage.length===0 && sessionStorage.length===0'))
    check('No uncaught browser errors',not errors)
    browser.close()

report={'checks':checks,'passed':sum(c['pass'] for c in checks),'total':len(checks),'browser':'Installed Chromium via Playwright','externalRequests':external,'pageErrors':errors}
(ROOT/'docs/browser-checks.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
