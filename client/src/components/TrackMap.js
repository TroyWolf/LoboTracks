import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet's broken default marker icon paths when bundled with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const mToFt = m => Math.round(m * 3.28084).toLocaleString();
const kmToMi = km => (km * 0.621371).toFixed(1);

function getWaypointEmoji(name = '', sym = '', type = '') {
  const n = (name + sym + type).toLowerCase();
  if (n.includes('bridge') || n.includes('danger') || n.includes('caution')) return '⚠️';
  if (n.includes('rock') || n.includes('summit') || n.includes('peak') || n.includes('overlook') || n.includes('viewpoint')) return '🏔️';
  if (n.includes('private')) return '🚫';
  if (n.includes('camp')) return '⛺';
  if (n.includes('water') || n.includes('creek') || n.includes('spring')) return '💧';
  if (n.includes('parking')) return '🅿️';
  if (n.includes('food') || n.includes('restau')) return '🍽️';
  return '📍';
}

export default function TrackMap() {
  const mapRef            = useRef(null);
  const mapInst           = useRef(null);
  const streetLayerRef    = useRef(null);
  const satelliteLayerRef = useRef(null);
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const params   = useParams();
  const navigate = useNavigate();
  const filename = params?.filename ? decodeURIComponent(params.filename) : null;

  useEffect(() => {
    if (!filename) return;
    setLoading(true);
    setError(null);
    fetch(`/api/tracks/${encodeURIComponent(filename)}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d); setLoading(false); })
      .catch(e => { setError(e.message || 'Failed to load track'); setLoading(false); });
  }, [filename]);

  useEffect(() => {
    if (!data || !mapRef.current) return;
    if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }

    const map = L.map(mapRef.current);
    mapInst.current = map;

    const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      maxZoom: 19,
    });
    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19,
      }
    );
    streetLayerRef.current = street;
    satelliteLayerRef.current = satellite;
    street.addTo(map);

    const { trackPoints, waypoints } = data;

    if (trackPoints.length > 0) {
      const latlngs = trackPoints.map(p => [p.lat, p.lon]);
      const poly = L.polyline(latlngs, { color: '#3b82f6', weight: 3.5, opacity: 0.9 }).addTo(map);
      map.fitBounds(poly.getBounds(), { padding: [30, 30] });

      const mkIcon = html => L.divIcon({ html, iconSize: [26, 26], iconAnchor: [13, 13], className: '' });
      L.marker(latlngs[0], { icon: mkIcon('<div style="font-size:1.35rem;filter:drop-shadow(1px 1px 2px rgba(0,0,0,0.6))">🟢</div>') })
        .addTo(map).bindPopup('<strong>Start</strong>');
      L.marker(latlngs[latlngs.length - 1], { icon: mkIcon('<div style="font-size:1.35rem;filter:drop-shadow(1px 1px 2px rgba(0,0,0,0.6))">🔵</div>') })
        .addTo(map).bindPopup('<strong>End</strong>');
    }

    waypoints.forEach(w => {
      const emoji = getWaypointEmoji(w.name, w.sym, w.type);
      const icon  = L.divIcon({
        html: `<div style="font-size:1.45rem;filter:drop-shadow(1px 1px 2px rgba(0,0,0,0.65))">${emoji}</div>`,
        iconSize: [28, 28], iconAnchor: [14, 14], className: '',
      });
      const popup = [
        `<strong>${emoji} ${w.name}</strong>`,
        w.desc ? `<span style="font-size:12px;color:#555;display:block;margin-top:4px">${w.desc}</span>` : '',
        w.cmt  ? `<span style="font-size:11px;color:#888;display:block;margin-top:2px;text-transform:capitalize">${w.cmt}</span>` : '',
      ].join('');
      L.marker([w.lat, w.lon], { icon }).addTo(map).bindPopup(popup);
    });

    // Legend
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = document.createElement('div');
      div.style.cssText = 'background:rgba(15,23,42,0.92);color:#e2e8f0;padding:12px 16px;border-radius:10px;font-size:12.5px;line-height:2;border:1px solid #1e3a5f;';
      div.innerHTML = `
        <strong style="display:block;margin-bottom:2px">Legend</strong>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="display:inline-block;width:22px;height:4px;background:#3b82f6;border-radius:2px"></span> Track
        </div>
        <div>🟢 Start &nbsp; 🔵 End</div>
        ${waypoints.length ? `<div>📍 Waypoints (${waypoints.length})</div>` : ''}
      `;
      return div;
    };
    legend.addTo(map);

    return () => { if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } };
  }, [data]);

  useEffect(() => {
    const map   = mapInst.current;
    const street = streetLayerRef.current;
    const sat   = satelliteLayerRef.current;
    if (!map || !street || !sat) return;
    if (isSatellite) {
      if (map.hasLayer(street)) map.removeLayer(street);
      if (!map.hasLayer(sat)) sat.addTo(map);
    } else {
      if (map.hasLayer(sat)) map.removeLayer(sat);
      if (!map.hasLayer(street)) street.addTo(map);
    }
  }, [isSatellite, data]);

  const { stats, meta } = data || {};

  const goBack = () => {
    if (window.history.length > 1) navigate(-1); else navigate('/');
  };

  return (
    <div className="h-dvh flex flex-col">

      {/* Compact top bar */}
      <div className="bg-slate-900 border-b border-slate-700 px-3 h-12 flex items-center gap-2 shrink-0">
        <button
          onClick={goBack}
          className="bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 py-1.5 text-sm cursor-pointer transition shrink-0 flex items-center gap-1"
        >
          ← Back
        </button>

        <span className="font-semibold text-slate-100 truncate flex-1 text-sm px-1">
          {meta?.title || filename || '…'}
        </span>

        {stats && (
          <span className="text-sm text-slate-400 whitespace-nowrap shrink-0">
            {kmToMi(stats.distanceKm)} mi
          </span>
        )}

        {(stats || meta?.metaDesc) && (
          <button
            onClick={() => setShowDetails(s => !s)}
            className={`text-sm px-2.5 py-1 rounded-md border cursor-pointer transition-colors shrink-0 ${
              showDetails
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                : 'border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showDetails ? '▲' : '▼'} Details
          </button>
        )}

        <a
          href={filename ? `/api/tracks/${encodeURIComponent(filename)}/download` : '#'}
          download
          className="bg-sky-500/15 border border-sky-500/35 text-sky-200 rounded-md px-3 py-1.5 text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:bg-sky-500/30 transition"
        >
          ⬇ Download
        </a>
      </div>

      {/* Animated details panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: showDetails ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.25s ease',
        }}
        className="bg-slate-900 shrink-0"
      >
        <div className="overflow-hidden">
          <div className="border-b border-slate-700 px-5 py-3 flex flex-wrap gap-x-5 gap-y-2 items-start">
            {stats && <>
              <Stat icon="📏" value={`${kmToMi(stats.distanceKm)} mi`}    label="distance" />
              {stats.elevGainM !== null && <Stat icon="📈" value={`+${mToFt(stats.elevGainM)} ft`} label="gain" />}
              {stats.elevLossM !== null && <Stat icon="📉" value={`-${mToFt(stats.elevLossM)} ft`} label="loss" />}
              {stats.maxEleM   !== null && <Stat icon="⛰️"  value={`${mToFt(stats.maxEleM)} ft`}   label="max elev" />}
              {stats.minEleM   !== null && <Stat icon="🏔️"  value={`${mToFt(stats.minEleM)} ft`}   label="min elev" />}
              <Stat icon="📍" value={stats.pointCount.toLocaleString()} label="pts" />
              {stats.waypointCount > 0 && <Stat icon="🚩" value={stats.waypointCount} label="waypoints" />}
            </>}
            {meta?.linkHref && (
              <a href={meta.linkHref} target="_blank" rel="noreferrer"
                className="text-sm text-sky-400 no-underline flex items-center gap-1 self-center">
                🔗 {meta.linkText || 'Source'} ↗
              </a>
            )}
            {meta?.metaDesc && (
              <p className="w-full m-0 pt-1 text-sm text-slate-300 leading-relaxed border-t border-slate-800">
                {meta.metaDesc}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative">
        {/* Satellite toggle */}
        <button
          onClick={() => setIsSatellite(s => !s)}
          title={isSatellite ? 'Switch to Street' : 'Switch to Satellite'}
          className={`absolute right-3 top-3 z-20 w-11 h-11 flex items-center justify-center rounded-lg border cursor-pointer text-2xl transition-colors ${
            isSatellite ? 'bg-sky-500/30 border-sky-400' : 'bg-slate-900/90 border-slate-700'
          }`}
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
        <div ref={mapRef} style={{ width: '100%', height: '100%', isolation: 'isolate' }} />
      </div>
    </div>
  );
}

function Stat({ icon, value, label }) {
  return (
    <span style={{ fontSize: 12.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
      {icon} <span style={{ color: '#94a3b8', fontWeight: 600 }}>{value}</span>
      <span style={{ color: '#475569' }}>{label}</span>
    </span>
  );
}
