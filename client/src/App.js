import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useMatch, useNavigate } from 'react-router-dom';
import TrackList from './components/TrackList';
import TrackMap from './components/TrackMap';

export default function App() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/tracks')
      .then(r => r.json())
      .then(data => { setTracks(data); setLoading(false); })
      .catch(() => { setError('Failed to load tracks from server.'); setLoading(false); });
  }, []);

  const navigate = useNavigate();
  const match = useMatch('/track/:filename');
  const selectedTrack = match?.params?.filename ? decodeURIComponent(match.params.filename) : null;
  const handleBack = useCallback(() => {
    if (window.history.length > 2) navigate(-1); else navigate('/');
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0f3460 100%)',
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {selectedTrack && (
            <button
              onClick={handleBack}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: 'none',
                color: '#fff',
                borderRadius: 8,
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background 0.15s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            >
              ← Back
            </button>
          )}
          <a href="/" onClick={(e) => {
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            navigate('/');
          }}
          style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: 0.3, display: 'flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none' }}>
            <img src="/logo-paw-pin.svg" alt="LoboTracks" style={{ height: 20, width: 20 }} />
            LoboTracks
          </a>
          {selectedTrack && (
            <span style={{ fontSize: 13, opacity: 0.6, marginLeft: 4 }}>
              / {tracks.find(t => t.filename === selectedTrack)?.title || selectedTrack}
            </span>
          )}
        </div>
        {!selectedTrack && (
          <span style={{ fontSize: 12, opacity: 0.55 }}>
            {tracks.length} track{tracks.length !== 1 ? 's' : ''} available
          </span>
        )}
      </header>

      {/* Content */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 56px)', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 40, height: 40, border: '3px solid #334155', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ opacity: 0.5 }}>Loading tracks…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 56px)' }}>
          <div style={{ background: '#450a0a', border: '1px solid #dc2626', borderRadius: 12, padding: '24px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>⚠️</div>
            <div style={{ color: '#fca5a5' }}>{error}</div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>Is the server running on port 3001?</div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <Routes>
          <Route path="/" element={<TrackList tracks={tracks} />} />
          <Route path="/track/:filename" element={<TrackMap onBack={handleBack} />} />
          <Route path="*" element={<TrackList tracks={tracks} />} />
        </Routes>
      )}
    </div>
  );
}
