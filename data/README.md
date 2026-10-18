# Data provenance and collection

© OpenStreetMap contributors. Database derived from OpenStreetMap, licensed under the [Open Database License (ODbL) 1.0](https://www.openstreetmap.org/copyright). Attribution is also visible on the app's map and every venue card. No organizer-provided private dataset is included.

The checked-in snapshot was collected on **18 October 2026** from the official OSM map API. The collector attempted Overpass first; those endpoints returned service errors in this environment. The alternate automated collection downloaded five small bounding boxes sequentially: EXPO / MEGA Silk Way, Baiterek, National Museum, Ishim riverfront, and Khan Shatyr. It extracted supported categories, calculated approximate way centroids, excluded explicit private/disused features, required names, and deduplicated nearby aliases. Relations are supported through Overpass; the map-API fallback extracts nodes and ways only.

The result is **300 POIs** from **517 candidate source objects**. **102** have opening hours, **26** have a wheelchair tag, **53** have a website, and **56** have a phone. Zero have original description tags in the selected categories. Therefore all 300 short descriptions are explicitly labelled deterministic summaries of source category, cuisine and street tags, not independently verified editorial descriptions. These are useful retrieval documents, and the separate first-party layer enriches selected places.

The initial broad bounding box in metadata identifies the intended city area; `areas` lists the five boxes actually collected. This is not complete city coverage. The geometry is an offline street context map, not a pedestrian routing graph. POI centers are approximate and may not be entrances.

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

`evidence.json` holds 21 concise attributed facts across 11 existing POIs, source-check dates, scope restrictions and selected official-hours overrides. It does not mutate the raw snapshot. See `docs/EVIDENCE.md` for mapping and conflict decisions. Automated collection includes historic monuments, which recovers Baiterek from its actual OSM feature rather than matching a transport stop with the same name.
