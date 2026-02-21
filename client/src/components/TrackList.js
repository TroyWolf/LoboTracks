import { useNavigate } from 'react-router-dom'

function Chip({ icon, label, mono, href }) {
  const base = `bg-transparent border border-slate-700 rounded-md px-3 py-1 text-sm text-slate-400 inline-flex items-center gap-2 ${mono ? 'font-mono' : ''}`;
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

function StatChip({ icon, value }) {
  return (
    <span className="border border-slate-700 rounded-md px-2.5 py-1 text-sm text-slate-300 inline-flex items-center gap-1.5 whitespace-nowrap">
      <span>{icon}</span>
      <span className="font-semibold">{value}</span>
    </span>
  )
}

const mToFt = (m) => Math.round(m * 3.28084).toLocaleString()
const kmToMi = (km) => (km * 0.621371).toFixed(1)

function TrackCard({ track }) {
  const navigate = useNavigate()
  const { stats } = track

  return (
    <div
      onClick={() => navigate(`/track/${encodeURIComponent(track.filename)}`)}
      className="group bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-sky-500 rounded-[14px] p-4 cursor-pointer transition transform hover:-translate-y-1 shadow-md hover:shadow-lg flex flex-col gap-2.5"
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontSize: "1.2rem" }}>🗺️</span>
            <h2 className="m-0 text-base font-bold text-slate-100 leading-tight">
              {track.title}
            </h2>
          </div>
          {track.description && (
            <p className="m-0 text-sm text-slate-400 leading-snug">
              {track.description}
            </p>
          )}
        </div>
        <a
          href={`/api/tracks/${encodeURIComponent(track.filename)}/download`}
          download
          onClick={(e) => e.stopPropagation()}
          className="bg-sky-500/15 border border-sky-500/35 text-sky-200 rounded-lg px-3 py-1.5 text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition hover:bg-sky-500/30 hover:text-sky-100 mt-0.5"
        >
          ⬇ Download GPX
        </a>
      </div>

      {/* Stats row — compact inline */}
      {stats && (
        <div className="flex flex-wrap gap-1.5">
          <StatChip icon="📏" value={`${kmToMi(stats.distanceKm)} mi`} />
          {stats.elevGainM !== null && <StatChip icon="📈" value={`+${mToFt(stats.elevGainM)} ft`} />}
          {stats.maxEleM   !== null && <StatChip icon="⛰️"  value={`${mToFt(stats.maxEleM)} ft`} />}
          <StatChip icon="📍" value={stats.pointCount.toLocaleString()} />
          {stats.waypointCount > 0 && <StatChip icon="🚩" value={stats.waypointCount} />}
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
      </div>
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
