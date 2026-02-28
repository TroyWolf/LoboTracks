# LoboTracks — CLAUDE.md

GPX track browser and map viewer. Drop GPX files in `gpx-files/`, the server parses them automatically and serves them via a REST API to a React frontend.

## Tech Stack

- **Frontend**: React 18, React Router v6, Tailwind CSS 4, Leaflet maps
- **Backend**: Node.js + Express
- **Build**: Vite 7
- **Language**: JavaScript (no TypeScript)
- **Package manager**: npm with workspaces (monorepo)

## Project Structure

```
client/src/
  App.js                  # Root component, routing
  components/
    TrackList.js          # Browse tracks
    TrackMap.js           # Leaflet map view
server/
  index.js                # Express server, GPX parsing, API
gpx-files/                # Drop GPX files here
```

## Key Commands

```bash
npm run dev       # Start both client (port 3000) and server (port 3001)
npm run build     # Build client for production (output: client/dist/)
npm run server    # Start Express server only
npm run client    # Start Vite dev server only
```

## API Endpoints

- `GET /api/tracks` — list all parsed tracks
- `GET /api/tracks/:filename` — single track with full point data
- `GET /api/tracks/:filename/download` — download raw GPX file

## Code Conventions

- Functional React components with hooks
- Tailwind utility classes for all styling (dark theme: `bg-slate-900`, `text-slate-100`)
- JSX in `.js` files (Vite configured to handle this)
- No linter or formatter configured — keep existing style consistent
- Client dev server proxies `/api` requests to `localhost:3001`
