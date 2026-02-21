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
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-br from-sky-900 via-slate-900 to-slate-800 px-6 h-14 flex items-center justify-between shadow-md sticky top-0 z-50">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {selectedTrack && (
            <button
              onClick={handleBack}
              className="bg-white/12 hover:bg-white/20 text-white rounded-lg px-3 py-1.5 cursor-pointer text-sm flex items-center gap-2 transition"
            >
              ← Back
            </button>
          )}
          <a href="/" onClick={(e) => {
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            navigate('/');
          }}
          className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-inherit no-underline">
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
          <span className="text-sm opacity-60">
            {tracks.length} track{tracks.length !== 1 ? 's' : ''} available
          </span>
        )}
      </header>

      {/* Content */}
      {loading && (
        <div className="flex justify-center items-center" style={{ height: 'calc(100vh - 56px)' }}>
          <div className="flex flex-col items-center gap-4">
            <div className="spin" />
            <span className="opacity-50">Loading tracks…</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex justify-center items-center" style={{ height: 'calc(100vh - 56px)' }}>
          <div className="bg-red-900 border border-red-600 rounded-xl p-6 text-center">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-red-200">{error}</div>
            <div className="text-sm opacity-60 mt-2">Is the server running on port 3001?</div>
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
