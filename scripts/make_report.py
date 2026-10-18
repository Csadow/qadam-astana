"""Export the English scenario/limitation document as a submission-friendly PDF."""
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import json
ROOT=Path(__file__).resolve().parents[1]
pdfmetrics.registerFont(TTFont('QadamSans','/usr/share/fonts/noto/NotoSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('QadamBold','/usr/share/fonts/noto/NotoSans-Bold.ttf'))
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='QTitle',fontName='QadamBold',fontSize=24,leading=31,textColor=colors.HexColor('#203e36'),spaceAfter=18))
styles.add(ParagraphStyle(name='QHeading',fontName='QadamBold',fontSize=14,leading=20,textColor=colors.HexColor('#203e36'),spaceBefore=14,spaceAfter=7))
styles.add(ParagraphStyle(name='QBody',fontName='QadamSans',fontSize=10,leading=15,textColor=colors.HexColor('#324b40'),spaceAfter=8))
story=[]
def para(text,style='QBody'):story.append(Paragraph(escape(text),styles[style]))
para('Qadam / ArcSolo','QTitle');para('Test scenarios, limitations and privacy — Build with AI, Track 1','QHeading')
para('Prepared 18 October 2026. Project documentation: English. Pitch: Russian. This report accompanies the working prototype, automated OSM collector, source repository and presentation.')
report=json.loads((ROOT/'docs/evaluation.json').read_text())
para('Verification summary','QHeading');para('47 engine/API/Worker tests; 160 combinations of location, time, interests and weather; 12/12 acceptance scenarios; 27/27 browser checks. These are deterministic engineering checks, not a user study or a live-model quality benchmark.')
para('Data provenance','QHeading');para('300 named POIs across five Astana neighborhoods, automatically collected from OpenStreetMap on 18 October 2026. 102 have opening hours; 26 have wheelchair tags. Descriptions are explicitly labelled summaries of source category, cuisine and street tags. A separate enrichment layer adds 21 first-party facts across 11 places, three supported weekly-hours overrides and two campus-access exclusions. Source IDs, original tags, collection date and metadata checksum are preserved. OSM-derived data is licensed ODbL 1.0, © OpenStreetMap contributors.')
para('RAG approach','QHeading');para('Automated source collection → BM25 and multilingual concept retrieval → hard geographic/time/context checks → recommendations and a short route → optional Gemini structured generation → validation of POI and citation IDs, output bounds and common unsupported claims. Gemini writes personalized explanations, activities and discovery missions from retrieved facts and normalized context. Three live scenarios are retained in docs/live-rag-evaluation.json; deployment verification is in docs/live-generation-check.json. Citation checks do not prove semantic support for every generated sentence. These smoke checks establish connectivity and validated output, not general model quality. Mock tests cover malformed and unsupported responses; provider failures fall back to explicitly labelled templates.')
story.append(PageBreak());para('Acceptance scenarios','QTitle')
for case in report['scenarios']:
    para(case['id']+' — '+('PASS' if case['pass'] else 'FAIL'),'QHeading')
    para('Expected: '+case['expect'])
    para(f"Observed: {case['resultCount']} recommendations; route estimate {case['routeMinutes']} / {case['budget']} minutes. "+('Places: '+', '.join(case['names'])+'.' if case['names'] else 'No places returned.'))
para('Scenarios simulate 19 October 2026, 14:00 Astana (UTC+5), except the night case and the family museum case on Tuesday 20 October. Results are snapshot-based, not claims of verified current availability.')
story.append(PageBreak());para('Limits and ethics','QTitle')
for file in ['docs/SCENARIOS.md','docs/PRIVACY.md']:
    text=(ROOT/file).read_text()
    if file.endswith('SCENARIOS.md'):text=text.split('## Limitations to say out loud')[1].split('## Judge walkthrough')[0]
    else:text=text.split('\n',1)[1]
    for block in text.strip().split('\n\n'):
        if block.startswith('- '):
            for line in block.split('\n'):para(line.lstrip('- '))
        elif block.strip():para(block.strip())
para('Submission status','QHeading');para('Repository: https://github.com/Csadow/qadam-astana (private). Hosted demo: https://qadam-arcsolo-astana.candy-ball-8297.chatgpt.site (owner-private). A source archive is prepared as an alternative. The captioned MP4 is ready, but it has not been uploaded to YouTube. Judge access, YouTube upload and final form submission remain participant actions.')
def footer(c,doc):
    c.setFont('QadamSans',8);c.setFillColor(colors.HexColor('#687768'));c.drawString(42,25,'QADAM / ARCSOLO · Build with AI · Track 1');c.drawRightString(553,25,str(doc.page))
doc=SimpleDocTemplate(str(ROOT/'docs/Qadam_Test_Scenarios_EN.pdf'),pagesize=(595,842),rightMargin=42,leftMargin=42,topMargin=44,bottomMargin=46,title='Qadam — test scenarios, limitations and privacy',author='ArcSolo')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print('Created docs/Qadam_Test_Scenarios_EN.pdf')
