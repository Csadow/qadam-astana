# First-party evidence and source decisions

The automated OSM snapshot supplies 300 named POIs. A separate, manually researched layer adds 25 concise attributed facts across 13 existing places; 14 places are enriched when the access-only record is included. `src/evidence.js` merges it at runtime without changing the raw snapshot. Primary sources were researched on 18 October 2026, using indexed results where direct retrieval failed; this is not an on-site or real-time verification.

## Mapping and scope

- Match the named entity and location, not just a similar name. The EXPO restaurant additionally matches the first-party branch address and OSM phone.
- The collector now includes `historic=monument`, recovering the real Baiterek feature instead of a transport stop or building fragment.
- National Museum weekly hours exclude Mondays; published interactive exhibits do not guarantee that every screen works today. Astana Hall and photo-permission caveats remain visible.
- Campus-level access procedures exclude NU Park and Japanese Garden from spontaneous walks.
- Baiterek is an exterior stop. Interior facts are retained in the evidence file but excluded from generation for that scope.
- Botanical greenhouse hours are not assigned to the whole outdoor garden.
- The operator says the old Nur Alem Energy Museum closed in 2024; it was not added as an operating museum.
- An official tourism page describing a bridge in another city was rejected despite the reputable domain.

## Sources by place

### Қазақстан Республикасының Ұлттық Мұражайы

OSM ID: `osm-node-4894937300`. Facts: 3.

- [National Museum — exhibition halls](https://nmrk.kz/en/structure/exhibition-activities/)
- [National Museum — Accessible Museum](https://nmrk.kz/en/press/accessible-museum/)
- [National Museum — official opening hours](https://nmrk.kz/ru/)
- [National Museum — visitor rules](https://nmrk.kz/en/press/museum-rules/)

### Ботаникалық бақ

OSM ID: `osm-way-1196402246`. Facts: 2.

- [Astana Botanical Garden — greenhouse schedule](https://www.astanabotsad.kz/ru/oranzherei)

### Хан Шатыр

OSM ID: `osm-way-460703779`. Facts: 3.

- [Khan Shatyr — about the centre](https://khanshatyr.com/en/about)
- [Khan Shatyr — entertainment directory](https://www.khanshatyr.com/index.php/en)
- [Khan Shatyr — visitor contacts and hours](https://www.khanshatyr.com/contacts)

### Korean Garden of Friendship

OSM ID: `osm-way-1296051287`. Facts: 2.

- [Visit Astana — Korean Garden of Friendship](https://visitastana.kz/en/about-city/what-to-see/korean-garden-of-friendship-/)

### Mega Silk Way

OSM ID: `osm-way-499328514`. Facts: 2.

- [MEGA — MEGA Silk Way centre profile](https://mega.kz/Tenant/MEGA-Silk-Way)

### NU Japanese Garden

OSM ID: `osm-way-1470723968`. Facts: 2. Excluded from automatic routes: controlled access.

- [NU — Japanese Garden of Stones](https://nu.edu.kz/news-en/place-oriental-philosophy-nu-campus/)
- [NU — campus access procedures](https://campussecurity.nu.edu.kz/campusaccessprocedures)

### NU Park

OSM ID: `osm-way-1467797207`. Facts: 0. Excluded from automatic routes: controlled access.

- [NU — campus access procedures](https://campussecurity.nu.edu.kz/campusaccessprocedures)

### Президент саябағы

OSM ID: `osm-way-112177946`. Facts: 1.

- [Palace of Peace and Reconciliation — official description](https://astana-piramida.kz/)
- [Astana Akimat — Sarayshyk district development](https://www.gov.kz/org/astana/press/news/details/1251104)

### Baiterek Monument

OSM ID: `osm-way-230401645`. Facts: 2.

- [Visit Astana — Baiterek Monument](https://visitastana.kz/en/about-city/what-to-see/monument-astana-bayterek/)
- [Astana Venue Management — Baiterek visitor information](https://a-vm.kz/objects/bayterek/)

### Lepim i Varim — MEGA Silk Way

OSM ID: `osm-node-12520559591`. Facts: 2.

- [Lepim i Varim — MEGA Silk Way branch](https://lepimivarim.ru/pelmennye/pelmennaya-velikoj-stepi/)

### Uly Dala Eli — 25 Years of Independence

OSM ID: `osm-way-1460763574`. Facts: 2.

- [Visit Astana — Uly Dala Eli Monument](https://visitastana.kz/ru/about-city/what-to-see/monument-uly-dala-eli/)

### Zhetysu Park

OSM ID: `osm-way-69232075`. Facts: 1. The city tourism page supports its 2018 redesign and renaming, not present-day facilities or access.

- [Visit Astana — Zhetysu Park](https://visitastana.kz/ru/about-city/what-to-see/park-zhetysu/)

### Lovers Park

OSM ID: `osm-way-37884583`. Facts: 2. Historical sculpture/fountain descriptions from the legacy city tourism site; no claim that the fountain runs today.

- [Official city tourism — Lovers Park](https://visitnursultan.kz/about-city/what-to-see/park-vlyublennykh/)

### CrêpeCafé — Kunaeva 12/1

OSM ID: `osm-node-6408271985`. Facts: 1. The operator describes a French crêperie brand concept. Its branch selector and vacancies identify Kunaeva 12/1; the OSM website and phone support the entity match. Direct retrieval was unreliable, so indexed primary-source results were used. The concept result indicated an approximately 1.4-year-old crawl. The research date does not mean the page or branch is current. No present opening, menu stock, socket or quietness claim is made.

- [CrêpeCafé — franchise concept](https://fr.crepecafe.kz/)
- [CrêpeCafé — branch selector](https://crepecafe.kz/franshiza/)
- [CrêpeCafé — vacancies and branch address](https://crepecafe.kz/rus/vacancies)

## Rights and reliability

Facts are short paraphrases, with EN/RU/KK translations and provenance. Original source content retains its owners’ rights. OSM-derived records remain ODbL. No full web articles are redistributed.

Citations constrain what the model may reference; they do not certify the truth of every generated sentence. This limitation is also stated in the app and pitch.
