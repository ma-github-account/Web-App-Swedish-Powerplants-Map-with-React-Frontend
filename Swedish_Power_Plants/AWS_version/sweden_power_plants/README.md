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
| Shares `geospatial_database` with three other projects | Its own dedicated RDS database |
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
        upload_media_to_s3.py    pushes local media into the S3 bucket
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

- **Python 3.10–3.12** (built on 3.11).
- **Node 18+** — only if you intend to change the frontend. The compiled bundle
  is committed, so a plain deployment needs no Node.
- An **AWS account** with:
  - an **RDS PostgreSQL** instance (stock — no PostGIS extension needed),
  - an **S3 bucket** for media, public-read, ACLs disabled
    (Object Ownership = *BucketOwnerEnforced*),
  - an **IAM user** with read/write on that bucket.
- **EB CLI** (`pip install awsebcli`) and **AWS CLI** configured (`aws configure`).

No native libraries are required, which is what allows this to run on the stock
Elastic Beanstalk Python platform. See *Why not GeoDjango* above.

---

## Configuration

**Nothing secret is committed.** Every credential is read from the environment
and defaults to empty, so the app fails loudly rather than starting with a key
that is public in this repository.

| Variable | Purpose |
| --- | --- |
| `IS_PRODUCTION` | `true` on EB: DEBUG off, CORS restricted, hashed static files |
| `SECRET_KEY` | **required** — startup aborts if unset |
| `ALLOWED_HOSTS` | comma-separated; blank means `*` |
| `NAME`, `DB_USER`, `PASSWORD`, `HOST`, `DB_PORT` | RDS connection |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | IAM user for S3 |
| `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_REGION_NAME` | the media bucket |

`DB_USER`, not `USER`: on Linux `USER` already holds the OS account name, so a
setting read from it would silently pick up the wrong value on a server.

See `.env.example`. On Elastic Beanstalk set them with `eb setenv`; locally,
copy the template to `.env` (gitignored).

---

## Deploying

```powershell
# 1. Python environment
py -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt

# 2. Frontend - only if you changed anything under frontend/src
cd frontend ; npm install ; npm run build ; cd ..

# 3. Elastic Beanstalk
eb init -p python-3.11 <your-app-name> --region <your-region>
eb create <your-env-name> --elb-type application --instance-type t3.micro

# 4. Configuration
eb setenv IS_PRODUCTION=true SECRET_KEY=... NAME=... DB_USER=... PASSWORD=... ^
          HOST=... AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... ^
          AWS_STORAGE_BUCKET_NAME=...

# 5. Let the EB instances reach RDS
#    Add an inbound rule on the RDS security group: TCP 5432, source = the
#    environment's EC2 security group (awseb-e-...-AWSEBSecurityGroup-...).

# 6. Deploy
eb deploy
```

`.ebextensions/01_python.config` runs `migrate` and `collectstatic --clear` on
the leader instance during every deployment, so neither is a manual step.

### Seeding data and media

Run these once, from a machine that can reach RDS and S3 (they use the same
environment variables):

```powershell
.venv\Scripts\python.exe manage.py import_data           # 7 types, 21 power plants
.venv\Scripts\python.exe manage.py upload_media_to_s3    # 30 photos and icons
.venv\Scripts\python.exe manage.py createsuperuser       # your own admin account
```

`upload_media_to_s3` writes through Django's storage backend rather than
copying by hand, so each object lands on exactly the key the application later
requests. `import_data` loads `data_export.json`, which is committed; no user
account ships with it.

### HTTPS and a custom domain

Elastic Beanstalk serves plain HTTP by default. To match the setup used here:

1. Request an **ACM certificate** for your domain (and `www.`) in the same
   region as the environment, and validate it via DNS.
2. On the environment's load balancer, add an **HTTPS :443 listener** using that
   certificate, forwarding to the existing target group.
3. Change the **:80 listener** to a `301` redirect to HTTPS.
4. Open **443** inbound on the load balancer's security group.
5. In **Route 53**, add `A` alias records for the apex and `www` pointing at the
   load balancer.

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
