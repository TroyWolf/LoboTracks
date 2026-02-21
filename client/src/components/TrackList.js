import React from "react"
import { Link } from 'react-router-dom'

function DownloadButton({ filename }) {
  const url = `/api/tracks/${encodeURIComponent(filename)}/download`
  const handleClick = (e) => {
    e.stopPropagation()
    // Programmatically create an anchor to trigger download so nested anchors are avoided
    const a = document.createElement("a")
    a.href = url
    a.download = ""
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      className="bg-sky-500/15 border border-sky-500/35 text-sky-200 rounded-lg px-3 py-1.5 text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap flex-shrink-0 transition hover:bg-sky-500/30 hover:text-sky-100 cursor-pointer"
    >
      ⬇ Download GPX
    </button>
  )
}

function Chip({ icon, label, mono, href }) {
  const base = `bg-transparent border border-slate-800 rounded-md px-3 py-1 text-sm text-slate-400 inline-flex items-center gap-2 ${mono ? 'font-mono' : ''}`;
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={`${base} text-sky-400`} onClick={(e) => e.stopPropagation()}>
        {icon} {label} ↗
      </a>
    )
  }
  return (
    <span className={base}>
      {icon} {label}
    </span>
  )
}

const mToFt = (m) => Math.round(m * 3.28084).toLocaleString()
const kmToMi = (km) => (km * 0.621371).toFixed(1)

function TrackCard({ track }) {
  const { stats } = track

  return (
    <Link
      to={`/track/${encodeURIComponent(track.filename)}`}
      className="group bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-sky-500 rounded-[14px] p-5 cursor-pointer transition transform hover:-translate-y-1 shadow-md hover:shadow-lg flex flex-col gap-4 text-inherit no-underline"
    >
      {/* Title row */}
      <div
        className="flex items-start justify-between gap-4"
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="flex items-center gap-2 mb-1"
          >
            <span style={{ fontSize: "1.2rem" }}>🗺️</span>
            <h2
              className="m-0 text-base font-bold text-slate-100 leading-tight"
            >
              {track.title}
            </h2>
          </div>
          {track.description ? (
            <p
              className="m-0 text-sm text-slate-400 leading-relaxed"
            >
              {track.description}
            </p>
          ) : (
            <p
              className="m-0 text-sm text-slate-500 italic"
            >
              No description in GPX file
            </p>
          )}
        </div>
        <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
          <DownloadButton filename={track.filename} />
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
        >
          <StatBox
            icon="📏"
            label="Distance"
            value={`${kmToMi(stats.distanceKm)} mi`}
          />
          <StatBox
            icon="📈"
            label="Elevation gain"
            value={
              stats.elevGainM !== null ? `${mToFt(stats.elevGainM)} ft` : "—"
            }
          />
          <StatBox
            icon="⛰️"
            label="Max elevation"
            value={stats.maxEleM !== null ? `${mToFt(stats.maxEleM)} ft` : "—"}
          />
          <StatBox
            icon="📍"
            label="Track points"
            value={stats.pointCount.toLocaleString()}
          />
          {stats.waypointCount > 0 && (
            <StatBox icon="🚩" label="Waypoints" value={stats.waypointCount} />
          )}
        </div>
      )}

      {/* Meta chips */}
      <div className="flex flex-wrap gap-2 items-center">
        <Chip icon="📄" label={track.filename} mono />
        <Chip icon="💾" label={`${track.sizeKb} KB`} />
        {track.date && <Chip icon="📅" label={track.date} />}
        {track.linkHref && (
          <Chip icon="🔗" label={track.linkText || "View source"} href={track.linkHref} />
        )}
        {track.creator && (
          <Chip icon="✏️" label={track.creator.replace(/^https?:\/\//, "").split("/")[0]} />
        )}
        <span className="ml-auto text-sm text-slate-500">Click to view map →</span>
      </div>
    </Link>
  )
}

function StatBox({ icon, label, value }) {
  return (
    <div className="bg-transparent border border-slate-800 rounded-md px-3 py-2">
      <div className="text-xs text-slate-500 mb-0.5">
        {icon} {label}
      </div>
      <div className="text-sm font-bold text-slate-200">{value}</div>
    </div>
  )
}

export default function TrackList({ tracks }) {
  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: 'calc(100vh - 56px)' }}>
        <div className="text-4xl">📂</div>
        <div className="text-slate-400 text-base">No GPX files found</div>
        <div className="text-slate-500 text-sm">
          Add <code className="bg-slate-800 px-1 rounded">.gpx</code> files to the <code className="bg-slate-800 px-1 rounded">gpx-files/</code> directory
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="mb-7">
        <h1 className="m-0 text-xl font-bold text-slate-100">Available Tracks</h1>
        <p className="mt-1 text-sm text-slate-400">Click a track to view on an interactive map, or download the raw GPX file.</p>
      </div>
      <div className="flex flex-col gap-4">
        {tracks.map((track) => (
          <TrackCard key={track.filename} track={track} />
        ))}
      </div>
    </div>
  )
}
