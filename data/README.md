# Data provenance and collection

© OpenStreetMap contributors. Database derived from OpenStreetMap, licensed under the [Open Database License (ODbL) 1.0](https://www.openstreetmap.org/copyright). Attribution is also visible on the app's map and every venue card. No organizer-provided private dataset is included.

The checked-in snapshot was collected on **18 October 2026** from the official OSM map API. The collector attempted Overpass first; those endpoints returned service errors in this environment. The alternate automated collection downloaded five small bounding boxes sequentially: EXPO / MEGA Silk Way, Baiterek, National Museum, Ishim riverfront, and Khan Shatyr. It extracted supported categories, calculated approximate way centroids, excluded explicit private/disused features, required names, and deduplicated nearby aliases. Relations are supported through Overpass; the map-API fallback extracts nodes and ways only.

The result is **300 POIs** from **517 candidate source objects**. **102** have opening hours, **26** have a wheelchair tag, **53** have a website, and **56** have a phone. Zero have original description tags in the selected categories. Therefore all 300 short descriptions are explicitly labelled deterministic summaries of source category, cuisine and street tags, not independently verified editorial descriptions. These are useful retrieval documents, and the separate first-party layer enriches selected places.

The initial broad bounding box in metadata identifies the intended city area; `areas` lists the five boxes actually collected. This is not complete city coverage. The original `map.json` is an offline street context map. The separate EXPO `walking-graph.json` now provides pedestrian routing. POI centers are approximate and may not be entrances.

## Reproduce

```sh
# Live Overpass collection (requires network):
python3 scripts/collect_pois.py --map

# Alternate official API collection of the five demo areas:
python3 scripts/collect_pois.py --osm-api --map

# Rebuild normalized data from the exact checked-in snapshot, offline:
python3 scripts/collect_pois.py --from-raw data/raw-osm.json
```

The map-API collector reuses ignored `cache-*.osm` downloads. To refresh them, move those files out of `data/` before running it again. Preserve collection provenance if using a cached extract. `metadata.json` records the collection time, endpoint, bounding boxes, record counts, data coverage and SHA-256. `raw-osm.json` preserves relevant source objects and `pois.json` holds the normalized schema. `map.json` contains simplified coordinate arrays and road/area classes from the same collection. No ratings, quietness, sockets or live events are invented.

References: [OSM map API](https://wiki.openstreetmap.org/wiki/API_v0.6#Retrieving_map_data_by_bounding_box:_GET_/api/0.6/map), [Overpass tag queries](https://dev.overpass-api.de/overpass-doc/en/criteria/per_tag.html).

## Separate first-party enrichment

`evidence.json` holds 25 concise attributed facts across 13 existing POIs, with 14 enriched records including access-only evidence, source-check dates, scope restrictions and selected official-hours overrides. It does not mutate the raw snapshot. See `docs/EVIDENCE.md` for mapping and conflict decisions. Automated collection includes historic monuments, which recovers Baiterek from its actual OSM feature rather than matching a transport stop with the same name.

## EXPO pedestrian graph and stories

`walking-source.json` preserves the relevant nodes, way references and access/barrier tags from the same EXPO map-API snapshot. Reproduce `walking-graph.json` offline with:

```sh
python3 scripts/collect_walk_graph.py --from-source data/walking-source.json
python3 tests/collector_test.py
```

The export contains **5,747 nodes, 6,421 directed-or-bidirectional edges, 1,122 source ways and 457 obstacle geometries**. Each edge retains its source way ID, length, step flag and `oneway:foot` direction. CI rebuilds and compares the graph. The canonical source SHA-256 is stored in graph metadata.

The conservative profile includes footways, paths, pedestrian streets and steps. Shared roads and cycleways require explicit pedestrian permission. Specific `foot` permission overrides general access; unhandled access values and conditional access are excluded. Unknown gates, private or restricted paths, indoor/area ways, and school/university grounds are excluded. The NU campus polygon prevents using untagged campus paths as public shortcuts. Linear fences and closed buildings/water/restricted grounds also constrain endpoint connectors. This is a subset of OSM semantics; relations, live closures, crossing signals, gradients and surface quality are not comprehensively modeled.

The browser uses directional Dijkstra paths. Wheelchair/stroller context excludes mapped steps, but does not establish step-free access. Endpoints are joined only within 80 metres of a graph node and 250 metres total estimated connector length; interior venues require a mapped entrance. Their interior connector remains estimated. Exterior monuments can end at a nearby graph viewpoint; sightlines are unverified. Different disconnected graph components return no route. Unsupported endpoints or areas use visibly estimated straight-line walking instead, never a claim of mapped coverage.

`journeys.json` defines three editorial stories, six chapter questions and exact fact IDs in `evidence.json`, in EN/RU/KK. Chapter facts are resolved through the same scope filters as recommendation cards. Only selected chapters appear; a partial story hides the full introduction. The pairing does not imply shared historical origins or guaranteed visibility. Published museum restrictions and reported park reconstruction remain visible.
