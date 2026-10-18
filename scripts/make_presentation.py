"""Create matching, editable PPTX + vector PDF and timed Russian speaker notes."""
from pathlib import Path
import json, textwrap
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'presentation'; OUT.mkdir(exist_ok=True)
pdfmetrics.registerFont(TTFont('Sans','/usr/share/fonts/noto/NotoSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Bold','/usr/share/fonts/noto/NotoSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('Serif','/usr/share/fonts/noto/NotoSerif-Regular.ttf'))
INK='#203e36'; PAPER='#f6f5ef'; LIME='#d6ed92'; MUTED='#687768'; SOFT='#e8eddd'; WHITE='#fffefa'; AMBER='#91652d'
S=.6; W=1600; H=900
prs=Presentation();prs.slide_width=Inches(13.333333);prs.slide_height=Inches(7.5)
pdf=canvas.Canvas(str(OUT/'Qadam_ArcSolo_pitch_RU.pdf'),pagesize=(W*S,H*S))
pdf.setTitle('Qadam — ArcSolo | Build with AI, Track 1');pdf.setAuthor('ArcSolo')
notes=[]; slide=None; page=0

def rgb(color):return RGBColor.from_string(color.lstrip('#'))
def rect(x,y,w,h,fill,line=None,radius=False):
    shape=slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE,Pt(x*S),Pt(y*S),Pt(w*S),Pt(h*S))
    shape.fill.solid();shape.fill.fore_color.rgb=rgb(fill)
    if radius: shape.adjustments[0]=.04
    for effect in shape._element.xpath('.//a:effectRef'): effect.set('idx','0')
    shape.line.fill.background() if not line else None
    if line:shape.line.color.rgb=rgb(line)
    pdf.setFillColor(fill);pdf.setStrokeColor(line or fill)
    if radius:pdf.roundRect(x*S,(H-y-h)*S,w*S,h*S,10*S,fill=1,stroke=bool(line))
    else:pdf.rect(x*S,(H-y-h)*S,w*S,h*S,fill=1,stroke=bool(line))
    return shape

def text(value,x,y,w,size=30,color=INK,font='Sans',lineheight=1.28):
    lines=[]
    for paragraph in str(value).split('\n'):
        if not paragraph:lines.append('');continue
        line=''
        for word in paragraph.split(' '):
            test=(line+' '+word).strip()
            if pdfmetrics.stringWidth(test,font,size*S)>w*S and line:lines.append(line);line=word
            else:line=test
        lines.append(line)
    box=slide.shapes.add_textbox(Pt(x*S),Pt(y*S),Pt(w*S),Pt((len(lines)*size*lineheight+12)*S))
    tf=box.text_frame;tf.clear();tf.word_wrap=False;tf.margin_left=tf.margin_right=tf.margin_top=tf.margin_bottom=0
    for i,line in enumerate(lines):
        p=tf.paragraphs[0] if i==0 else tf.add_paragraph();p.text=line;p.font.name='Noto Serif' if font=='Serif' else 'Noto Sans';p.font.size=Pt(size*S);p.font.bold=font=='Bold';p.font.color.rgb=rgb(color);p.space_after=Pt(0);p.space_before=Pt(0);p.line_spacing=Pt(size*lineheight*S)
        pdf.setFillColor(color);pdf.setFont(font,size*S);pdf.drawString(x*S,(H-y-size*.98-i*size*lineheight)*S,line)
    return y+len(lines)*size*lineheight

def image(path,x,y,w,h):
    iw,ih=Image.open(path).size;scale=min(w/iw,h/ih);nw,nh=iw*scale,ih*scale
    slide.shapes.add_picture(str(path),Pt(x*S),Pt(y*S),width=Pt(nw*S),height=Pt(nh*S))
    pdf.drawImage(str(path),x*S,(H-y-nh)*S,nw*S,nh*S,mask='auto')

def line(x1,y1,x2,y2,color=INK,width=6):
    shape=slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT,Pt(x1*S),Pt(y1*S),Pt(x2*S),Pt(y2*S))
    shape.line.color.rgb=rgb(color);shape.line.width=Pt(width*S)
    pdf.setStrokeColor(color);pdf.setLineWidth(width*S);pdf.line(x1*S,(H-y1)*S,x2*S,(H-y2)*S)

def new(title,kicker,dark=False):
    global slide,page
    if page:pdf.showPage()
    page+=1;slide=prs.slides.add_slide(prs.slide_layouts[6]);rect(0,0,W,H,INK if dark else PAPER)
    color=LIME if dark else MUTED
    text('QADAM  /  ARCSOLO',70,42,600,18,color,'Bold')
    text(kicker.upper(),1040,42,490,17,color)
    text(title,70,115,1450,55,LIME if dark else INK,'Serif',1.15)
    text('BUILD WITH AI  ·  SMART CITY  ·  TRACK 1',70,846,1100,16,color)
    text(f'{page:02d}',1460,842,65,21,color,'Bold')

def note(title,seconds,script):
    notes.append({'slide':page,'title':title,'seconds':seconds,'script':script})
    slide.notes_slide.notes_text_frame.text=f'{seconds} секунд\n\n{script}'

new('Астана — за один свободный час.','01 / Идея',True)
text('qadam.',75,285,950,150,LIME,'Serif')
text('Маленькая прогулка.\nРеальные места. Честные ограничения.',85,495,1150,49,WHITE,'Serif')
text('ИИ-помощник по городским прогулкам',85,683,1000,27,'#b6c6b7')
rect(1210,298,220,220,LIME,radius=True)
line(1262,465,1375,352);line(1290,352,1375,352);line(1375,352,1375,437)
note('Знакомство',25,'Здравствуйте! Мы — ArcSolo, и это Qadam: помощник по коротким прогулкам в Астане. Представьте, что вы стоите возле MEGA Silk Way и у вас свободен один час. Хочется успеть что-то приятное, а не потратить половину времени на поиск. Qadam предлагает конкретные места, объясняет выбор и считает прогулку вместе с возвращением. Наш принцип: полезная рекомендация начинается с реальных данных и честных ограничений.')

new('Свободное время есть. Готового плана — нет.','02 / Проблема')
for x,n,title,body in [(70,'01','Что рядом?','Список мест ещё не учитывает вашу точку старта и интересы.'),(565,'02','Успею ли я?','На дорогу, посещение и возвращение нужен общий бюджет.'),(1060,'03','Можно ли доверять?','Розетки, часы работы и доступность часто неизвестны.')]:
    rect(x,300,465,340,WHITE,radius=True);text(n,x+28,330,390,28,MUTED,'Serif');text(title,x+28,401,390,35,INK,'Serif');text(body,x+28,474,390,27,MUTED)
text('Для жителей, родителей и гостей города — когда есть 30–120 минут.',76,715,1400,30,INK)
note('Проблема',30,'В этой задаче недостаточно назвать популярный парк или музей. Пользователь спрашивает: что подходит именно сейчас, рядом со мной и под мой запас времени? Родителю важен формат прогулки, туристу — расстояние, человеку с ноутбуком — розетка. Но данных о розетке может вообще не быть. Мы решили соединить поиск, проверку ограничений и короткое объяснение, а отсутствие данных сделать видимым.')

new('Один экран: от желания к маленькой прогулке.','03 / Продукт')
image(OUT/'assets/map.png',70,270,940,380)
image(OUT/'assets/route.png',70,655,940,145)
for y,a,b in [(285,'Контекст','Старт, время, интересы, погода и доступность.'),(450,'1–3 варианта','Почему подходит, сколько идти и что сделать.'),(615,'План с источниками','Короткий маршрут и ссылка на запись каждого POI.')]:
    text(a,1060,y,465,32,INK,'Serif');text(b,1060,y+53,445,26,MUTED)
note('Продукт',35,'Так выглядит рабочий прототип. Слева задаём старт, свободное время и интересы. Справа видим карту, до трёх рекомендаций и компактный маршрут. У каждого места есть причина выбора, оценка прогулки и посещения, отдельная идея действия и ссылка на источник. Есть английский, русский и казахский интерфейс. Геолокация необязательна: можно выбрать знакомый ориентир, ничего не разрешая браузеру.')

new('Демо: 60 минут возле EXPO.','04 / Показать продукт')
rect(70,275,1460,120,INK,radius=True);text('60 минут = 25 минут пешком + 35 минут на месте',105,307,1370,39,LIME,'Serif')
image(OUT/'assets/map.png',70,435,850,340)
text('Лепим и варим → Japanese garden → старт',975,450,540,37,INK,'Serif')
text('Реальные записи OSM.\nВозвращение уже включено.\nЧасы сада неизвестны — это видно.',975,575,525,27,MUTED)
text('Сценарий смоделирован. Время — оценка; линии на карте не являются навигацией.',77,798,1430,21,MUTED)
note('Демонстрация',55,'Переключимся на демо и нажмём «Час рядом с EXPO». Система находит три разных варианта и предлагает маршрут с кофе и садом: примерно двадцать пять минут на ходьбу и тридцать пять на остановки. Вместе — шестьдесят минут, включая возвращение. Обратите внимание: для сада часы работы неизвестны, и приложение не говорит, что он открыт. Теперь выберем тихое кафе с розеткой. Мы увидим кафе, но также предупреждение: розетки и тишина не подтверждены. И наконец уменьшим время: если ничего не подходит, система честно покажет пустой результат. Вернёмся к слайдам.')

new('Данные собраны автоматически. Пробелы измерены.','05 / Данные')
for x,num,label in [(70,'298','именованных POI'),(565,'5','районов Астаны'),(1060,'102','записи с часами работы')]:
    rect(x,290,465,245,WHITE,radius=True);text(num,x+28,315,400,90,INK,'Serif');text(label,x+30,460,400,26,MUTED)
text('OpenStreetMap → сбор → фильтрация → дедупликация → снимок',76,592,1450,35,INK,'Serif')
text('26 записей с тегом доступности. Описания — прозрачные краткие сводки тегов.\nСохранены идентификаторы, источники, дата сбора и контрольная сумма.',76,666,1430,27,MUTED)
text('Снимок: 18.10.2026 · © OpenStreetMap contributors / ODbL · Дата сбора ≠ проверка заведения.',76,783,1450,21,MUTED)
note('Данные',35,'Важное требование трека — собрать данные автоматически. Наш скрипт получает открытые данные OpenStreetMap, фильтрует категории и удаляет дубликаты. В снимке двести девяносто восемь именованных мест в пяти районах. У ста двух есть часы работы, у двадцати шести — тег доступности. Исходных описаний в этих записях не было: короткие описания честно собраны из тегов. Мы сохраняем происхождение каждой записи и можем воспроизвести обработку без интернета. Дата скачивания не выдаётся за дату проверки заведения.')

new('RAG: сначала найти и проверить, потом предложить.','06 / Подход')
items=[('01','POI','Реальный снимок\nи источники'),('02','Поиск','BM25 + понятия\nна трёх языках'),('03','Ограничения','Дорога, время,\nчасы и доступность'),('04','Gemini*','Выбор идеи\nпо найденным POI'),('05','Проверка','Только разрешённые\nID и действия')]
for i,(n,title,body) in enumerate(items):
    x=70+i*295;rect(x,300,270,270,INK if i==3 else WHITE,radius=True);color=LIME if i==3 else INK;text(n,x+23,327,220,24,color);text(title,x+23,389,230,31,color,'Serif');text(body,x+23,462,230,22,'#c4d1c0' if i==3 else MUTED)
text('* Без ключа работает явно обозначенный поиск с шаблонными идеями.',75,625,1440,29,INK)
text('Gemini генерирует структурированный выбор действий, а не свободные факты о местах.\nАдаптер проверен на mock-ответах; живой вызов требует серверного ключа.',75,697,1440,26,MUTED)
note('RAG',40,'Наш RAG начинается с реальных документов POI. Поиск сочетает BM25 и небольшой многоязычный словарь намерений. Затем строгие проверки исключают слишком далёкие места, неподходящие категории и визиты, которые не укладываются в известное расписание. Только после этого Gemini может выбрать идеи действий для найденных мест. Ответ ограничен разрешёнными идентификаторами и проверяется кодом. Это намеренно узкая генерация: модель не придумывает часы, адреса или новые заведения. Сейчас без ключа работает честно обозначенный шаблонный режим; живой вызов модели мы не выдаём за уже проверенный.')

new('Доверие — это видимое «не знаем».','07 / Этика и приватность')
image(OUT/'assets/coffee.png',70,280,840,440)
text('Факты ≠ идеи',975,285,520,38,INK,'Serif');text('Источник POI отделён от предложения, что сделать.',975,348,510,27,MUTED)
text('Локация без истории',975,465,520,38,INK,'Serif');text('Расчёт в браузере. Точные координаты и исходный запрос не отправляются в Gemini.',975,530,510,27,MUTED)
text('Никаких обещаний о тишине, розетках, ночной безопасности или маршруте без ступеней без данных.',75,762,1440,26,AMBER)
note('Доверие',35,'На этом экране видно нашу главную продуктовую особенность: отсутствие сведений не превращается в уверенное обещание. Мы разделяем факты из POI и предложенные действия. Тег доступности заведения не означает проверенный маршрут без ступеней. Точные координаты остаются в памяти браузера, история местоположения не сохраняется. Для карты не нужны сторонние тайлы. В опциональный запрос Gemini уходят только публичные места и несколько флагов предпочтений. При этом мы честно отмечаем, что инфраструктура провайдеров может обрабатывать сетевые метаданные.')

new('Проверили поведение, а не только красивый экран.','08 / Проверка')
for x,y,num,label in [(70,275,'32','теста движка, API и Worker'),(815,275,'160','комбинаций ограничений'),(70,520,'8 / 8','приёмочных сценариев'),(815,520,'17 / 17','проверок в браузере')]:
    rect(x,y,715,215,WHITE,radius=True);text(num,x+30,y+20,640,79,INK,'Serif');text(label,x+34,y+142,640,27,MUTED)
text('Включая пустую выдачу, закрытие во время визита, приватность, мобильный экран и неверный ответ модели.',76,778,1440,23,MUTED)
note('Проверка',30,'Мы проверили не только удачный сценарий. Есть тридцать два теста движка, API и собранного Worker, сто шестьдесят комбинаций контекста, восемь приёмочных сценариев и семнадцать проверок браузера. Среди них — закрытие заведения во время визита, слишком короткий бюджет, отсутствие данных, неверные ответы модели, мобильная вёрстка и отсутствие отправки координат. Это инженерные проверки прототипа. Они не означают, что мы уже измерили удовлетворённость реальных пользователей или качество живой модели.')

new('Сначала польза человеку. Затем городской сервис.','09 / Бизнес-гипотеза')
rect(70,280,710,450,INK,radius=True);text('Бесплатно для прогулки',105,320,635,43,LIME,'Serif');text('Жители, родители, туристы.\nКороткий план без регистрации.',105,423,625,31,WHITE);text('Ценность: меньше времени на выбор,\nбольше понятных действий рядом.',105,570,625,27,'#c1cebc')
rect(815,280,715,450,WHITE,radius=True);text('B2B после пилота',850,320,640,43,INK,'Serif');text('Отели, городские порталы,\nорганизаторы мероприятий.',850,423,625,31,MUTED);text('Гипотеза: платный виджет и интеграция.\nРеклама маркируется и не отменяет ограничения.',850,565,625,27,MUTED)
text('План пилота: 20 пользователей · 3 сценария · 2 недели. Это цель, не уже достигнутый результат.',76,779,1440,23,MUTED)
note('Бизнес',35,'Мы видим бесплатный пользовательский сценарий и потенциальную B2B-модель: виджет для отелей, городских порталов и организаторов мероприятий. Но это гипотеза, а не заявка на уже существующую выручку. Следующий шаг — двухнедельный пилот с двадцатью пользователями на трёх сценариях. Будем измерять полезность рекомендации, время до выбора и ошибки ограничений. Если появятся партнёрские размещения, они будут маркироваться и не смогут обойти фильтры времени или доступности.')

new('Честные ограничения превращаем в план развития.','10 / Следующий шаг')
rows=[('Данные неполные','Проверенные описания и расписания от партнёров.'),('Дорога приблизительная','Пешеходный граф: входы, переходы, барьеры.'),('Генерация ограничена','Живой Gemini, оценка полезности и устойчивости.'),('Пока нет пользовательского пилота','Наблюдения, обратная связь и проверка спроса.')]
for i,(a,b) in enumerate(rows):
    y=285+i*117;rect(70,y,1460,93,WHITE,radius=True);text(a,100,y+23,590,29,INK,'Serif');text('→',708,y+20,70,34,MUTED);text(b,795,y+26,700,26,MUTED)
text('Дальше: события, групповое планирование, независимая проверка доступности.',76,787,1430,24,MUTED)
note('Развитие',35,'Мы не пытаемся скрыть границы прототипа. Сейчас данные покрывают пять районов, а пешее время оценивается по расстоянию с коэффициентом обхода. Следующий технический шаг — пешеходный граф с реальными входами и переходами. Следующий шаг по данным — проверенные описания и расписания от партнёров. Затем подключаем живую модель и оцениваем её на сценариях с пользователями. После этого имеет смысл добавлять события и групповое планирование, не размывая базовую полезность.')

new('Один район. Один час. Один хороший Qadam.','11 / Финал',True)
text('Не просто «куда сходить».\nПлан, которому понятны границы.',80,290,1400,69,LIME,'Serif',1.2)
text('Готовы показать демо и начать пилот\nс локальными данными и реальными пользователями.',85,535,1320,35,WHITE)
text('ArcSolo  ·  github.com/Csadow/qadam-astana',85,717,1400,29,'#c1cebc')
text('Репозиторий и hosted-демо пока приватные: для жюри нужен доступ или архив.',85,779,1400,21,'#c1cebc')
note('Финал',25,'Qadam превращает свободный час в понятный небольшой план. Его сила — в сочетании реальных мест, выполнимого бюджета времени и честного объяснения того, что известно, а что нет. У нас готов рабочий интерфейс, автоматизированный сбор, тесты и воспроизводимое демо. Мы хотим проверить эту пользу на одном районе вместе с реальными пользователями и локальными партнёрами. Спасибо! Готовы показать любой из сценариев и ответить на вопросы.')

prs.save(OUT/'Qadam_ArcSolo_pitch_RU.pptx');pdf.save()
elapsed=0;lines=['# Qadam · ArcSolo — Russian pitch notes','',f'Target rehearsal duration: {sum(n["seconds"] for n in notes)//60}:{sum(n["seconds"] for n in notes)%60:02d}. Includes a short live demo. Adjust to your speaking speed.','', 'Do not claim live Gemini or public sharing is ready unless you enable and verify it before presenting.','']
for n in notes:
    end=elapsed+n['seconds'];lines.extend([f'## {n["slide"]:02d}. {n["title"]} · {elapsed//60}:{elapsed%60:02d}–{end//60}:{end%60:02d}','',n['script'],'']);elapsed=end
(OUT/'SPEAKER_NOTES_RU.md').write_text('\n'.join(lines),encoding='utf-8')
(OUT/'slides.json').write_text(json.dumps(notes,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Created {page} editable slides + PDF; target {elapsed} seconds.')
