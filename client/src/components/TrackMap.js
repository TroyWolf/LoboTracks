import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet's broken default marker icon paths when bundled with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const mToFt = m => Math.round(m * 3.28084);
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

function StatBadge({ icon, value, label }) {
  return (
    <span style={{ fontSize: 12.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
      {icon} <span style={{ color: '#94a3b8', fontWeight: 600 }}>{value}</span>
      <span style={{ color: '#475569' }}>{label}</span>
    </span>
  );
}

export default function TrackMap({ onBack }) {
  const mapRef  = useRef(null);
  const mapInst = useRef(null);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const params = useParams();
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

    // Destroy previous instance
    if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }

    const map = L.map(mapRef.current);
    mapInst.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

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

  const { stats, meta } = data || {};

  return (
    <div style={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>
      {/* Stats bar */}
      {stats && !loading && (
        <div style={{
          background: '#0a1120',
          borderBottom: '1px solid #1e3a5f',
          padding: '8px 20px',
          display: 'flex',
          gap: 20,
          alignItems: 'center',
          flexWrap: 'wrap',
          minHeight: 42,
        }}>
          <StatBadge icon="📏" value={`${kmToMi(stats.distanceKm)} mi`} label=" distance" />
          {stats.elevGainM !== null && <StatBadge icon="📈" value={`${mToFt(stats.elevGainM).toLocaleString()} ft`} label=" gain" />}
          {stats.elevLossM !== null && <StatBadge icon="📉" value={`${mToFt(stats.elevLossM).toLocaleString()} ft`} label=" loss" />}
          {stats.maxEleM  !== null && <StatBadge icon="⛰️"  value={`${mToFt(stats.maxEleM).toLocaleString()} ft`} label=" max elev" />}
          {stats.minEleM  !== null && <StatBadge icon="🏔️"  value={`${mToFt(stats.minEleM).toLocaleString()} ft`} label=" min elev" />}
          <StatBadge icon="📍" value={stats.pointCount.toLocaleString()} label=" pts" />
          {meta?.linkHref && (
            <a href={meta.linkHref} target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              🔗 {meta.linkText || 'Source'} ↗
            </a>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <a href={`/api/tracks/${encodeURIComponent(filename)}/download`} download
              style={{
                background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.35)',
                color: '#93c5fd', borderRadius: 8, padding: '5px 14px',
                fontSize: 12.5, fontWeight: 600, textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
              ⬇ Download GPX
            </a>
          </div>
        </div>
      )}

      {/* Map area */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Back button (in-map) */}
        <button
          onClick={() => {
            if (typeof onBack === 'function') return onBack();
            if (window.history.length > 1) return navigate(-1);
            navigate('/');
          }}
          style={{
            position: 'absolute',
            left: 12,
            top: 12,
            zIndex: 20,
            background: 'rgba(10,17,32,0.9)',
            color: '#e2e8f0',
            border: '1px solid #1e3a5f',
            borderRadius: 8,
            padding: '6px 10px',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          ← Back
        </button>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 10 }}>
            <div style={{ width: 40, height: 40, border: '3px solid #334155', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: '#64748b' }}>Loading track…</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        {error && (
          <div style={{ position: 'absolute', inset: 0, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <div style={{ background: '#450a0a', border: '1px solid #dc2626', borderRadius: 12, padding: '24px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>⚠️</div>
              <div style={{ color: '#fca5a5' }}>{error}</div>
            </div>
          </div>
        )}
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
