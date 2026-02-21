import { useState, useEffect } from 'react';
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

  return (
    <div className={`bg-slate-900 text-slate-100 ${selectedTrack ? 'h-dvh overflow-hidden' : 'min-h-screen'}`}>
      {/* Header — hidden on track pages; TrackMap renders its own top bar */}
      {!selectedTrack && (
        <header className="bg-linear-to-br from-sky-900 via-slate-900 to-slate-800 px-6 h-14 flex items-center justify-between shadow-md sticky top-0 z-50">
          <a href="/" onClick={(e) => {
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            navigate('/');
          }}
          className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-inherit no-underline">
            <img src="/logo-paw-pin.svg" alt="LoboTracks" style={{ height: 20, width: 20 }} />
            LoboTracks
          </a>
          <span className="text-sm opacity-60">
            {tracks.length} track{tracks.length !== 1 ? 's' : ''} available
          </span>
        </header>
      )}

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
          <Route path="/track/:filename" element={<TrackMap />} />
          <Route path="*" element={<TrackList tracks={tracks} />} />
        </Routes>
      )}
    </div>
  );
}
