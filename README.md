# 🐺 LoboTracks

A Node.js + React app for browsing, viewing, and downloading GPX track files.  
**No config files needed** — all titles, descriptions, and metadata are read directly from the GPX files themselves.

---

## Features

- 📋 **Track list** — browse all GPX files with title, description, distance, elevation gain, and more — all sourced from each file's `<metadata>` block
- 🗺️ **Interactive map** — click any track to view it on a Leaflet/OpenStreetMap map with waypoints and a full stats bar
- ⬇️ **Download** — download the raw GPX file from the list or map view
- ➕ **Zero config** — just drop `.gpx` files into `gpx-files/` and they appear automatically

---

## Project Structure

```
gpx-viewer/
├── server/
│   └── index.js          # Express API (parses GPX metadata server-side)
├── client/               # React frontend
│   ├── public/index.html
│   └── src/
│       ├── App.js
│       └── components/
│           ├── TrackList.js   # File list with stats cards
│           └── TrackMap.js    # Leaflet map view
├── gpx-files/            # ← Drop your .gpx files here
│   └── Teter_Rock_1.gpx
└── package.json
```

---

## GPX Metadata Support

The server reads these standard GPX fields automatically:

| GPX field | Used for |
|-----------|----------|
| `<metadata><name>` | Track title |
| `<metadata><desc>` | Description shown on card |
| `<metadata><time>` | Date chip |
| `<metadata><link>` | Source link (e.g. RideWithGPS) |
| `<metadata><author>` | Author name |
| `<trkpt ele>` | Elevation gain/loss, min/max |
| `<wpt>` name/desc/sym/type | Waypoint markers on map |

If a field isn't present in your GPX file, it's simply omitted from the UI.

---

## Setup

```bash
# 1. Install all dependencies
npm install
cd client && npm install && cd ..

# 2. Add GPX files
cp your-ride.gpx gpx-files/

# 3. Start in development mode (runs both server + React)
npm run dev
```

Open **http://localhost:3000**

---

## Production

```bash
npm run build                    # Build React frontend
NODE_ENV=production npm start    # Serve app + API on one port
```

App available at **http://localhost:3001**

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tracks` | List all tracks with metadata + stats |
| GET | `/api/tracks/:filename` | Full parsed data (track points, waypoints, stats) |
| GET | `/api/tracks/:filename/download` | Download raw GPX file |

---

## Configuration

| Setting | Default | Change via |
|---------|---------|------------|
| Server port | `3001` | `PORT` env variable |
| GPX directory | `./gpx-files` | `GPX_DIR` in `server/index.js` |
