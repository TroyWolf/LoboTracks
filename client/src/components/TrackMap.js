import React, { useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png"
import iconUrl from "leaflet/dist/images/marker-icon.png"
import shadowUrl from "leaflet/dist/images/marker-shadow.png"

// Fix Leaflet's broken default marker icon paths when bundled with webpack
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
})

const mToFt = (m) => Math.round(m * 3.28084)
const kmToMi = (km) => (km * 0.621371).toFixed(1)

function getWaypointEmoji(name = "", sym = "", type = "") {
  const n = (name + sym + type).toLowerCase()
  if (n.includes("bridge") || n.includes("danger") || n.includes("caution"))
    return "⚠️"
  if (
    n.includes("rock") ||
    n.includes("summit") ||
    n.includes("peak") ||
    n.includes("overlook") ||
    n.includes("viewpoint")
  )
    return "🏔️"
  if (n.includes("private")) return "🚫"
  if (n.includes("camp")) return "⛺"
  if (n.includes("water") || n.includes("creek") || n.includes("spring"))
    return "💧"
  if (n.includes("parking")) return "🅿️"
  if (n.includes("food") || n.includes("restau")) return "🍽️"
  return "📍"
}

function StatBadge({ icon, value, label }) {
  return (
    <span
      style={{
        fontSize: 12.5,
        color: "#64748b",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {icon} <span style={{ color: "#94a3b8", fontWeight: 600 }}>{value}</span>
      <span style={{ color: "#475569" }}>{label}</span>
    </span>
  )
}

export default function TrackMap({ onBack }) {
  const mapRef = useRef(null)
  const mapInst = useRef(null)
  const streetLayerRef = useRef(null)
  const satelliteLayerRef = useRef(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSatellite, setIsSatellite] = useState(false)
  const [showDesc, setShowDesc] = useState(false)
  const params = useParams()
  const navigate = useNavigate()
  const filename = params?.filename ? decodeURIComponent(params.filename) : null

  useEffect(() => {
    if (!filename) return
    setLoading(true)
    setError(null)
    fetch(`/api/tracks/${encodeURIComponent(filename)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setData(d)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message || "Failed to load track")
        setLoading(false)
      })
  }, [filename])

  useEffect(() => {
    if (!data || !mapRef.current) return

    // Destroy previous instance
    if (mapInst.current) {
      mapInst.current.remove()
      mapInst.current = null
    }

    const map = L.map(mapRef.current)
    mapInst.current = map

    const street = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
        maxZoom: 19,
      },
    )

    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        maxZoom: 19,
      },
    )

    streetLayerRef.current = street
    satelliteLayerRef.current = satellite
    street.addTo(map)

    const { trackPoints, waypoints } = data

    if (trackPoints.length > 0) {
      const latlngs = trackPoints.map((p) => [p.lat, p.lon])
      const poly = L.polyline(latlngs, {
        color: "#3b82f6",
        weight: 3.5,
        opacity: 0.9,
      }).addTo(map)
      map.fitBounds(poly.getBounds(), { padding: [30, 30] })

      const mkIcon = (html) =>
        L.divIcon({
          html,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
          className: "",
        })
      L.marker(latlngs[0], {
        icon: mkIcon(
          '<div style="font-size:1.35rem;filter:drop-shadow(1px 1px 2px rgba(0,0,0,0.6))">🟢</div>',
        ),
      })
        .addTo(map)
        .bindPopup("<strong>Start</strong>")
      L.marker(latlngs[latlngs.length - 1], {
        icon: mkIcon(
          '<div style="font-size:1.35rem;filter:drop-shadow(1px 1px 2px rgba(0,0,0,0.6))">🔵</div>',
        ),
      })
        .addTo(map)
        .bindPopup("<strong>End</strong>")
    }

    waypoints.forEach((w) => {
      const emoji = getWaypointEmoji(w.name, w.sym, w.type)
      const icon = L.divIcon({
        html: `<div style="font-size:1.45rem;filter:drop-shadow(1px 1px 2px rgba(0,0,0,0.65))">${emoji}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        className: "",
      })
      const popup = [
        `<strong>${emoji} ${w.name}</strong>`,
        w.desc
          ? `<span style="font-size:12px;color:#555;display:block;margin-top:4px">${w.desc}</span>`
          : "",
        w.cmt
          ? `<span style="font-size:11px;color:#888;display:block;margin-top:2px;text-transform:capitalize">${w.cmt}</span>`
          : "",
      ].join("")
      L.marker([w.lat, w.lon], { icon }).addTo(map).bindPopup(popup)
    })

    // Legend
    const legend = L.control({ position: "bottomright" })
    legend.onAdd = () => {
      const div = document.createElement("div")
      div.style.cssText =
        "background:rgba(15,23,42,0.92);color:#e2e8f0;padding:12px 16px;border-radius:10px;font-size:12.5px;line-height:2;border:1px solid #1e3a5f;"
      div.innerHTML = `
        <strong style="display:block;margin-bottom:2px">Legend</strong>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="display:inline-block;width:22px;height:4px;background:#3b82f6;border-radius:2px"></span> Track
        </div>
        <div>🟢 Start &nbsp; 🔵 End</div>
        ${waypoints.length ? `<div>📍 Waypoints (${waypoints.length})</div>` : ""}
      `
      return div
    }
    legend.addTo(map)

    return () => {
      if (mapInst.current) {
        mapInst.current.remove()
        mapInst.current = null
      }
    }
  }, [data])

  useEffect(() => {
    const map = mapInst.current
    const street = streetLayerRef.current
    const sat = satelliteLayerRef.current
    if (!map || !street || !sat) return
    if (isSatellite) {
      if (map.hasLayer(street)) map.removeLayer(street)
      if (!map.hasLayer(sat)) sat.addTo(map)
    } else {
      if (map.hasLayer(sat)) map.removeLayer(sat)
      if (!map.hasLayer(street)) street.addTo(map)
    }
  }, [isSatellite, data])

  const { stats, meta } = data || {}

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Stats bar */}
      {stats && !loading && (
        <div className="bg-slate-900 border-b border-slate-700 px-5 py-2 flex gap-5 items-center flex-wrap min-h-[42px]">
          <StatBadge
            icon="📏"
            value={`${kmToMi(stats.distanceKm)} mi`}
            label=" distance"
          />
          {stats.elevGainM !== null && (
            <StatBadge
              icon="📈"
              value={`${mToFt(stats.elevGainM).toLocaleString()} ft`}
              label=" gain"
            />
          )}
          {stats.elevLossM !== null && (
            <StatBadge
              icon="📉"
              value={`${mToFt(stats.elevLossM).toLocaleString()} ft`}
              label=" loss"
            />
          )}
          {stats.maxEleM !== null && (
            <StatBadge
              icon="⛰️"
              value={`${mToFt(stats.maxEleM).toLocaleString()} ft`}
              label=" max elev"
            />
          )}
          {stats.minEleM !== null && (
            <StatBadge
              icon="🏔️"
              value={`${mToFt(stats.minEleM).toLocaleString()} ft`}
              label=" min elev"
            />
          )}
          <StatBadge
            icon="📍"
            value={stats.pointCount.toLocaleString()}
            label=" pts"
          />
          {meta?.linkHref && (
            <a
              href={meta.linkHref}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-sky-400 no-underline flex items-center gap-1"
            >
              🔗 {meta.linkText || "Source"} ↗
            </a>
          )}
          {meta?.metaDesc && (
            <button
              onClick={() => setShowDesc((s) => !s)}
              className={`text-sm px-2.5 py-1 rounded-md border cursor-pointer transition-colors ${showDesc ? "bg-sky-500/20 border-sky-500/50 text-sky-300" : "border-slate-700 text-slate-400 hover:text-slate-200"}`}
            >
              {showDesc ? "▲" : "ℹ"} About
            </button>
          )}
          <div className="ml-auto">
            <a
              href={`/api/tracks/${encodeURIComponent(filename)}/download`}
              download
              className="bg-sky-500/15 border border-sky-500/35 text-sky-200 rounded-md px-3 py-1.5 text-sm font-semibold inline-flex items-center gap-2"
            >
              ⬇ Download GPX
            </a>
          </div>
        </div>
      )}

      {/* Description panel */}
      <div
        className="overflow-hidden transition-all duration-200 bg-slate-900 border-b border-slate-700"
        style={{ maxHeight: showDesc && meta?.metaDesc ? "12rem" : "0" }}
      >
        <p className="px-5 py-3 m-0 text-sm text-slate-300 leading-relaxed">
          {meta?.metaDesc}
        </p>
      </div>

      {/* Map area */}
      <div className="flex-1 relative">
        <button
          onClick={() => setIsSatellite((s) => !s)}
          title={isSatellite ? "Switch to Street" : "Switch to Satellite"}
          className={`absolute right-3 top-3 z-20 w-11 h-11 flex items-center justify-center rounded-lg border cursor-pointer text-2xl transition-colors ${isSatellite ? "bg-sky-500/30 border-sky-400" : "bg-slate-900/90 border-slate-700"}`}
        >
          🛰️
        </button>
        {loading && (
          <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-4 z-10">
            <div className="spin" />
            <span className="text-slate-400">Loading track…</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-10">
            <div className="bg-red-900 border border-red-600 rounded-xl p-6 text-center">
              <div className="text-2xl mb-2">⚠️</div>
              <div className="text-red-200">{error}</div>
            </div>
          </div>
        )}
        <div
          ref={mapRef}
          style={{ width: "100%", height: "100%", isolation: "isolate" }}
        />
      </div>
    </div>
  )
}
