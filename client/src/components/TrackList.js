import React from "react"

function DownloadButton({ filename }) {
  const url = `/api/tracks/${encodeURIComponent(filename)}/download`
  console.log({filename, url})
  return (
    <a
      href={`/api/tracks/${encodeURIComponent(filename)}/download`}
      download
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "rgba(59,130,246,0.15)",
        border: "1px solid rgba(59,130,246,0.35)",
        color: "#93c5fd",
        borderRadius: 8,
        padding: "7px 14px",
        fontSize: 13,
        fontWeight: 600,
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
        flexShrink: 0,
        transition: "all 0.15s",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = "rgba(59,130,246,0.28)"
        e.currentTarget.style.color = "#bfdbfe"
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = "rgba(59,130,246,0.15)"
        e.currentTarget.style.color = "#93c5fd"
      }}
    >
      ⬇ Download GPX
    </a>
  )
}

function Chip({ icon, label, mono, href }) {
  const style = {
    background: "#0f172a",
    border: "1px solid #1e3a5f",
    borderRadius: 6,
    padding: "3px 10px",
    fontSize: 12,
    color: "#64748b",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontFamily: mono ? "monospace" : "inherit",
    textDecoration: "none",
  }
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        style={{ ...style, color: "#60a5fa" }}
        onClick={(e) => e.stopPropagation()}
      >
        {icon} {label} ↗
      </a>
    )
  }
  return (
    <span style={style}>
      {icon} {label}
    </span>
  )
}

const mToFt = (m) => Math.round(m * 3.28084).toLocaleString()
const kmToMi = (km) => (km * 0.621371).toFixed(1)

function TrackCard({ track, onSelect }) {
  const [hovered, setHovered] = React.useState(false)
  const { stats } = track

  return (
    <div
      onClick={() => onSelect(track.filename)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#1e293b" : "#172033",
        border: `1px solid ${hovered ? "#3b82f6" : "#1e3a5f"}`,
        borderRadius: 14,
        padding: "20px 24px",
        cursor: "pointer",
        transition: "all 0.18s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered
          ? "0 8px 24px rgba(59,130,246,0.15)"
          : "0 2px 8px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Title row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>🗺️</span>
            <h2
              style={{
                margin: 0,
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#f1f5f9",
                lineHeight: 1.3,
              }}
            >
              {track.title}
            </h2>
          </div>
          {track.description ? (
            <p
              style={{
                margin: 0,
                fontSize: 13.5,
                color: "#94a3b8",
                lineHeight: 1.6,
              }}
            >
              {track.description}
            </p>
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "#475569",
                fontStyle: "italic",
              }}
            >
              No description in GPX file
            </p>
          )}
        </div>
        <div onClick={(e) => e.stopPropagation()} style={{ paddingTop: 2 }}>
          <DownloadButton filename={track.filename} />
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
            gap: 8,
          }}
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
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        <Chip icon="📄" label={track.filename} mono />
        <Chip icon="💾" label={`${track.sizeKb} KB`} />
        {track.date && <Chip icon="📅" label={track.date} />}
        {track.linkHref && (
          <Chip
            icon="🔗"
            label={track.linkText || "View source"}
            href={track.linkHref}
          />
        )}
        {track.creator && (
          <Chip
            icon="✏️"
            label={track.creator.replace(/^https?:\/\//, "").split("/")[0]}
          />
        )}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#334155" }}>
          Click to view map →
        </span>
      </div>
    </div>
  )
}

function StatBox({ icon, label, value }) {
  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #1e3a5f",
        borderRadius: 8,
        padding: "8px 12px",
      }}
    >
      <div style={{ fontSize: 11, color: "#475569", marginBottom: 2 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#cbd5e1" }}>
        {value}
      </div>
    </div>
  )
}

export default function TrackList({ tracks, onSelect }) {
  if (tracks.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "calc(100vh - 56px)",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ fontSize: "3rem" }}>📂</div>
        <div style={{ color: "#94a3b8", fontSize: "1rem" }}>
          No GPX files found
        </div>
        <div style={{ color: "#475569", fontSize: 13 }}>
          Add{" "}
          <code
            style={{
              background: "#1e293b",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            .gpx
          </code>{" "}
          files to the{" "}
          <code
            style={{
              background: "#1e293b",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            gpx-files/
          </code>{" "}
          directory
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            margin: 0,
            fontSize: "1.4rem",
            fontWeight: 700,
            color: "#f1f5f9",
          }}
        >
          Available Tracks
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "#64748b" }}>
          Click a track to view on an interactive map, or download the raw GPX
          file.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {tracks.map((track) => (
          <TrackCard key={track.filename} track={track} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}
