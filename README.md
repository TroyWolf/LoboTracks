# 🐺 LoboTracks

A Node.js + React app for browsing, viewing, and downloading GPX track files.  
**No config files needed** — all titles, descriptions, and metadata are read directly from the GPX files themselves.

---

For now it's only useful for the owner.
Check it out at https://LoboTracks.com

---


## Features

- 📋 **Track list** — browse all GPX files with title, description, distance, elevation gain, and more — all sourced from each file's `<metadata>` block
- 🗺️ **Interactive map** — click any track to view it on a Leaflet/OpenStreetMap map with waypoints and a full stats bar
- ⬇️ **Download** — download the raw GPX file from the list or map view
- ➕ **Zero config** — just drop `.gpx` files into `gpx-files/` and they appear automatically

---

## Project Structure

This repo now uses npm workspaces with separate `client` and `server` packages.

```
gpx-viewer/
├── server/               # Express API (parses GPX metadata server-side)
│   ├── index.js
│   └── package.json      # server workspace
├── client/               # React + Vite frontend
│   ├── index.html        # Vite entry HTML
│   ├── package.json      # client workspace
│   └── src/
│       ├── App.js
│       └── components/
│           ├── TrackList.js
│           └── TrackMap.js
├── gpx-files/            # ← Drop your .gpx files here
│   └── Teter_Rock_1.gpx
└── package.json          # root workspace (scripts + workspaces)
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

Install dependencies for all workspaces from the repo root and start both the server and client in development:

```bash
# Install dependencies for root + workspaces
npm install

# Add GPX files
cp your-ride.gpx gpx-files/

# Start both server + client (runs concurrently)
npm run dev
```

Open **http://localhost:3000** (Vite dev server). The client proxies `/api` requests to the server on port `3001`.

---

## Production

Build the client and serve the static output from the server:

```bash
# Build the frontend (client workspace)
npm run build

# Serve the built assets with the server
NODE_ENV=production npm start
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
