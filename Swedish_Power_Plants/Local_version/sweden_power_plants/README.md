# Swedish Powerplants Map — Django + React

A Django + React port of the GeoDjango
[Web-App-Swedish-Power-Plants-Map](https://github.com/ma-github-account/Web-App-Swedish-Power-Plants-Map).

Django is API-only: it serves one template — the compiled React `index.html` —
and everything else over REST with JWT bearer tokens. Same architecture as the
employees project.

---

## What changed from the GeoDjango original

| Original | This port |
| --- | --- |
| Django template + `main.js` build the map | React SPA (`react-leaflet`), Django serves only the built shell |
| Four endpoints `/api/v1/placescat1..4/` | One `/api/places/` plus `/api/places/geojson/?category=…` |
| Marker icons hardcoded per category **id** in JS — README demanded the four types be created in an exact order | `Category.icon` is a field on the row, so types can be added, renamed and reordered freely |
| Read-only; editing only through Django admin | Public map, plus login and full create/edit/delete screens in React |
| One hardcoded OpenStreetMap layer, no other map controls | Five base layers, marker clustering, place search and a print button (see below) |
| Plain page heading | komoot-style top bar with brand mark and a **Display Settings** dropdown |
| Shares `geospatial_database` with three other projects | A self-contained SQLite file |
| GeoDjango + PostGIS `PointField` | **Plain Django** - two `FloatField`s (see below) |

### Why not GeoDjango

The project started on GeoDjango: `django.contrib.gis`, a PostGIS `PointField`
and `rest_framework_gis`. It was dropped, because it earned nothing and cost a
lot:

- **No spatial queries existed.** Not one `distance`, `within` or `intersects`
  anywhere. PostGIS was storing a point and handing it straight back.
- **The REST API never exposed geometry.** `/api/places/` has always returned
  flat `latitude` / `longitude` numbers, so the React app was already agnostic.
- **It blocked deployment.** GEOS, GDAL and PROJ are native shared libraries
  that `requirements.txt` cannot install, and they are absent from Amazon Linux
  2023's repositories — so Elastic Beanstalk's stock Python platform could not
  run the app at all without a custom Docker image or hand-compiled binaries.

`Place.point_geom` is now `latitude` and `longitude` `FloatField`s. Because the
API contract was already lat/lng, **the React frontend needed no changes** —
`/api/places/`, `/api/categories/` and `/api/places/geojson/` were all verified
byte-for-byte identical before and after, and all 21 coordinate pairs carried
across exactly (max delta 0.0).

`/api/places/geojson/` still returns a GeoJSON `FeatureCollection`; it is built
by hand in `serializers.py` (about fifteen lines) instead of by
`GeoFeatureModelSerializer`, keeping the same wire format for QGIS and other
GeoJSON clients.

The only real loss is the Django admin's draggable map widget — `GISModelAdmin`
became a plain `ModelAdmin` with two number inputs. The React create/edit form
keeps its click-to-place map, so ordinary editing is unaffected. Should genuine
spatial queries ever be needed, PostGIS would have to come back.

### Map features carried over from the Ethiopian Infrastructure Map

These exist in the Ethiopia project but not in the Swedish one, and were kept:

- **Base layer switcher** — OpenStreetMap, Carto Light, Carto Dark, OpenTopoMap,
  Esri Satellite. Ethiopia's two Stamen layers were dropped: Stamen retired
  those tile URLs in 2023 and they now return **503**. Every provider above was
  verified to return live tiles.
- **Marker clustering** (`leaflet.markercluster`).
- **Place search** (`leaflet-control-geocoder`).
- **Print button** (`leaflet.browser.print`).

All three map controls sit in the **top-right corner** and are forced to an
identical 36×36 box. Each plugin ships its own dimensions — layers 36px, print
26px via `.leaflet-bar a`, geocoder 26px, and all three grow again under
`.leaflet-touch` — so `index.css` overrides them to one shared size.
`leaflet.browser.print` ships no stylesheet at all, so its printer icon is an
inline SVG defined in `index.css`.

### Top bar and Display Settings

The header is modelled on komoot's: brand mark and wordmark hard left,
navigation and controls right, a single hairline bottom border. The brand mark
is an inline SVG (`components/BrandLogo.js`) — a lightning bolt over cooling
towers — so it needs no extra network request.

**Display Settings** mirrors komoot's *Zawartość mapy* dropdown: a labelled
group (*Power Plant Types*) with one checkbox per type, each showing that
type's marker icon and its plant count, plus a Show all / Hide all shortcut.
Every type is ticked by default. The state lives in Redux (`reducers/mapReducers.js`)
because the dropdown is in the always-mounted top bar while the markers are on
the map screen. The reducer stores the **hidden** set rather than the visible
one, so a newly added type shows up without the reducer knowing the type list
in advance.

---

## Layout

```
SPP1/
  venv/                        Python 3.11 virtual environment
  sweden_power_plants/
    manage.py
    requirements.txt
    backend/                   Django project package (settings, urls, wsgi)
    base/                      the one Django app
      models.py                Category (power plant type), Place (lat/lng floats)
      serializers.py           flat + GeoJSON serializers, JWT user serializers
      views/                   place_views, category_views, user_views
      urls/                    place_urls, category_urls, user_urls
      management/commands/
        import_data.py           loads data_export.json into a fresh database
        seed_extra_plants.py     adds 3 further types and 8 more plants
        seed_type_descriptions.py writes the prose shown for each type
        fetch_plant_photos.py    pulls Wikipedia lead photos for plants with none
    frontend/                  Create React App
      src/
        actions/ constants/ reducers/ store.js
        components/            TopBar, BrandLogo, DisplaySettings, Footer,
                               Loader, Message, FormContainer, MapView,
                               ClusterLayer, GeocoderControl, PrintControl,
                               LocationPicker, PlaceForm, PlaceInfoPanel
        screens/               Map, PlaceList, PlaceCreate, PlaceEdit,
                               CategoryList, Login, Register, Profile
      build/                   production bundle (Django serves this)
    static/images/             MEDIA_ROOT — plant photos and type icons
    staticfiles/               collectstatic output
```

---

## API

| Method | Endpoint | Auth |
| --- | --- | --- |
| GET | `/api/places/` | public |
| GET | `/api/places/geojson/` `?category=Nuclear Power Plant` | public |
| GET | `/api/places/<id>/` | public |
| POST | `/api/places/create/` | JWT |
| PUT | `/api/places/update/<id>/` | JWT |
| DELETE | `/api/places/delete/<id>/` | JWT |
| GET | `/api/categories/` | public |
| POST/PUT/DELETE | `/api/categories/create|update|delete/` | JWT |
| POST | `/api/users/login/`, `/api/users/register/` | — |
| GET/PUT | `/api/users/profile/`, `/api/users/profile/update/` | JWT |

---

## Prerequisites

**Python 3.10–3.12.** That is the entire list.

- No database server — SQLite is part of Python.
- No Node — the compiled React bundle is committed in `frontend/build/`.
- No AWS account, no credentials, no `.env`.
- No native libraries. This was a GeoDjango project until the move described in
  *Why not GeoDjango* above, which needed GEOS, GDAL and PROJ shared libraries
  and a PostGIS database. All of that is gone.

Six Python packages, all pure wheels: Django, DRF, SimpleJWT, CORS headers,
WhiteNoise, Pillow.

---

## Setup

Four commands, from the folder containing `manage.py`:

```powershell
py -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe manage.py migrate        # creates db.sqlite3
.venv\Scripts\python.exe manage.py import_data    # 7 types + 21 power plants
.venv\Scripts\python.exe manage.py runserver 8020
```

Then open <http://127.0.0.1:8020/>.

To use the Add/Edit/Delete screens, create yourself an account — no user ships
with this repository:

```powershell
.venv\Scripts\python.exe manage.py createsuperuser
```

`import_data` loads `data_export.json`, which is committed. If you would rather
rebuild the dataset step by step, these still work:

```
manage.py seed_extra_plants        +3 types, +8 plants
manage.py seed_type_descriptions   the prose shown for each type
manage.py fetch_plant_photos       Wikipedia photos for plants with none
```

### Working on the React code

Only needed if you want to change the frontend — otherwise the committed bundle
is all you need.

```powershell
cd frontend
npm install
npm start          # hot reload on :3000, proxies /api to Django
npm run build      # rebuild the committed bundle
```

The plant photos and the four original type icons come from the upstream
project's media folder and are committed under `static/images/`.

`seed_extra_plants` adds three types the original did not cover — **Biomass
CHP**, **Waste-to-Energy** and **Solar** — with new inline-SVG marker icons, plus
eight more plants: Harsprånget, Messaure and Krångede (hydro), Lillgrund and
Markbygden (wind), Värtaverket (biomass CHP), Högdalenverket (waste-to-energy)
and Skurup Solar PV Park. Every coordinate comes from that plant's own Wikipedia
article rather than being estimated.

`fetch_plant_photos` then downloads a lead photo from Wikipedia for any plant
that has none, resizes it to 1200 px and appends the author and licence Commons
reports as a credit line in the plant's info text. It only touches rows with an
empty `image`, so it never overwrites a photo from the original project or one
uploaded through the UI. Wikimedia rate-limits aggressively, so requests are
throttled and retried with backoff, and thumbnails are requested rather than
full-resolution originals — which is what Wikimedia's own 429 response asks for.
All 21 plants currently have a real photo; none fall back to *no image available*.

`seed_type_descriptions` writes the paragraph shown when a type is unfolded on
the Types screen, describing the technology and its place in the Swedish grid.

---

## Notes

`collectstatic` is only needed for a deployment. With `DEBUG=True` Django's
staticfiles handler serves `/static/` straight from `frontend/build/static`, so
a rebuild plus a browser reload is the whole local loop.

Routing uses `HashRouter`, so every screen lives under `/#/…` and Django needs
only the single `''` route — no catch-all URL pattern.

### Configuration

There is nothing you have to configure. For anyone who wants to harden it,
three settings still read the environment:

| Variable | Default | Effect |
| --- | --- | --- |
| `SECRET_KEY` | insecure dev key | **Startup fails if left at the default while `IS_PRODUCTION=true`** |
| `IS_PRODUCTION` | `false` | `true` turns off DEBUG, restricts hosts and CORS, enables hashed static files |
| `ALLOWED_HOSTS` | `*` in dev | Comma-separated |

The database is not configurable: this edition is SQLite by design. The AWS
edition of the same application uses PostgreSQL on RDS and S3 for media.

---

## Photo attribution

The photographs in `static/images/place_images/` come from two sources: the
original upstream project, and Wikimedia Commons for the plants added later.
The seven Wikimedia images are **CC BY-SA / CC BY** — the photographer and
licence are recorded in each plant's `info` text, visible in the app and stored
in `data_export.json`.

---

## Notes

- Routing uses `HashRouter`, so every screen lives under `/#/…` and Django only
  needs the single `''` route.
- `ajv@^8` is pinned in `frontend/package.json` on purpose: without it npm
  hoists `ajv@6` next to `ajv-keywords@5` and `react-scripts build` dies with
  `Cannot find module 'ajv/dist/compile/codegen'`.
- `leaflet.browser.print` has an **empty `main`** in its `package.json`, so
  `PrintControl.js` requires `leaflet.browser.print/dist/leaflet.browser.print.min.js`
  by path and sets `window.L` first — it is a classic plugin that assigns onto a
  global rather than exporting anything.
- The print control is configured with a single print mode on purpose. With more
  than one the plugin renders a hover-out menu and the button changes width,
  which would break the equal sizing of the three controls.
- Clustering uses `leaflet.markercluster` driven imperatively from
  `ClusterLayer.js` rather than a React wrapper package, so it stays compatible
  with whatever react-leaflet version is installed.
- `Pillow` is 10.4.0 rather than the 7.0.0 the original README asked for — 7.0.0
  has no wheels for modern Python and will not build.
