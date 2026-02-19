const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Directory where GPX files live — no metadata.json needed
const GPX_DIR = path.join(__dirname, '..', 'gpx-files');

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
}

/**
 * Parse metadata fields from a GPX XML string.
 * Reads: name, desc, author, link, time, keywords from <metadata>
 * and the track name from <trk><name>.
 */
function parseGpxMeta(xml) {
  const tag = (t, src) => {
    const m = (src || xml).match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`, 'i'));
    return m ? m[1].trim() : null;
  };

  const metaBlock = tag('metadata') || '';
  const trkBlock  = tag('trk') || '';
  const trkName   = tag('name', trkBlock);

  const creatorMatch = xml.match(/<gpx[^>]+creator="([^"]+)"/i);
  const creator = creatorMatch ? creatorMatch[1] : null;

  const linkMatch = metaBlock.match(/<link\s+href="([^"]+)"/i);
  const linkHref  = linkMatch ? linkMatch[1] : null;
  const linkText  = tag('text', metaBlock);

  const timeStr = tag('time', metaBlock);
  const date    = timeStr ? timeStr.split('T')[0] : null;

  const authorBlock = tag('author', metaBlock) || '';
  const authorName  = tag('name', authorBlock);
  const metaName    = tag('name', metaBlock);
  const metaDesc    = tag('desc', metaBlock);
  const keywords    = tag('keywords', metaBlock);

  return {
    title: metaName || trkName,
    metaDesc,
    date,
    creator,
    linkHref,
    linkText,
    authorName,
    keywords,
  };
}

/**
 * Parse full track data from a GPX XML string.
 * Returns trackPoints (lat/lon/ele), waypoints, and computed stats.
 */
function parseGpxFull(xml) {
  const trackPoints = [];
  const waypoints   = [];

  // Track points
  const trkptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/trkpt>/g;
  let match;
  while ((match = trkptRegex.exec(xml)) !== null) {
    const inner    = match[3];
    const eleMatch = inner.match(/<ele>([^<]+)<\/ele>/);
    trackPoints.push({
      lat: parseFloat(match[1]),
      lon: parseFloat(match[2]),
      ele: eleMatch ? parseFloat(eleMatch[1]) : null,
    });
  }

  // Waypoints
  const wptRegex = /<wpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/wpt>/g;
  while ((match = wptRegex.exec(xml)) !== null) {
    const inner = match[3];
    const g = t => { const m = inner.match(new RegExp(`<${t}>([^<]*)<\\/${t}>`)); return m ? m[1].trim() : ''; };
    waypoints.push({
      lat:  parseFloat(match[1]),
      lon:  parseFloat(match[2]),
      name: g('name') || 'Waypoint',
      desc: g('desc'),
      sym:  g('sym'),
      type: g('type'),
      cmt:  g('cmt'),
    });
  }

  // Compute stats
  let minEle = Infinity, maxEle = -Infinity, gainM = 0, lossM = 0, distKm = 0;
  for (let i = 0; i < trackPoints.length; i++) {
    const p = trackPoints[i];
    if (p.ele !== null) {
      if (p.ele < minEle) minEle = p.ele;
      if (p.ele > maxEle) maxEle = p.ele;
      if (i > 0 && trackPoints[i - 1].ele !== null) {
        const diff = p.ele - trackPoints[i - 1].ele;
        if (diff > 0) gainM += diff; else lossM += Math.abs(diff);
      }
    }
    if (i > 0) distKm += haversineKm(trackPoints[i - 1], p);
  }

  const hasEle = minEle !== Infinity;
  return {
    trackPoints,
    waypoints,
    stats: {
      pointCount:    trackPoints.length,
      waypointCount: waypoints.length,
      distanceKm:    parseFloat(distKm.toFixed(1)),
      minEleM:       hasEle ? Math.round(minEle) : null,
      maxEleM:       hasEle ? Math.round(maxEle) : null,
      elevGainM:     hasEle ? Math.round(gainM)  : null,
      elevLossM:     hasEle ? Math.round(lossM)  : null,
    },
  };
}

function haversineKm(a, b) {
  const R = 6371, r = d => d * Math.PI / 180;
  const dLat = r(b.lat - a.lat), dLon = r(b.lon - a.lon);
  const x = Math.sin(dLat / 2) ** 2 +
            Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(x));
}

// ── Routes ────────────────────────────────────────────────────────────────────

/** GET /api/tracks — list all GPX files with metadata parsed from each file */
app.get('/api/tracks', (req, res) => {
  try {
    const files  = fs.readdirSync(GPX_DIR).filter(f => f.endsWith('.gpx'));
    const tracks = files.map(filename => {
      const filePath = path.join(GPX_DIR, filename);
      const stat     = fs.statSync(filePath);
      const xml      = fs.readFileSync(filePath, 'utf8');
      const meta     = parseGpxMeta(xml);
      const { stats } = parseGpxFull(xml);
      return {
        filename,
        title:      meta.title || filename.replace(/\.gpx$/i, '').replace(/_/g, ' '),
        description: meta.metaDesc,
        date:        meta.date,
        creator:     meta.creator,
        linkHref:    meta.linkHref,
        linkText:    meta.linkText,
        authorName:  meta.authorName,
        keywords:    meta.keywords,
        sizeKb:      parseFloat((stat.size / 1024).toFixed(1)),
        modified:    stat.mtime.toISOString().split('T')[0],
        stats,
      };
    });
    res.json(tracks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read GPX directory' });
  }
});

/** GET /api/tracks/:filename/download — serve raw GPX file.
 *  IMPORTANT: must be registered BEFORE /:filename to avoid route conflict. */
app.get('/api/tracks/:filename/download', (req, res) => {
  const { filename } = req.params;
  if (!filename.endsWith('.gpx') || filename.includes('/') || filename.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const filePath = path.join(GPX_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/gpx+xml');
  res.sendFile(filePath);
});

/** GET /api/tracks/:filename — full parsed data for one GPX file */
app.get('/api/tracks/:filename', (req, res) => {
  const { filename } = req.params;
  if (!filename.endsWith('.gpx') || filename.includes('/') || filename.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const filePath = path.join(GPX_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

  try {
    const xml = fs.readFileSync(filePath, 'utf8');
    const meta = parseGpxMeta(xml);
    const { trackPoints, waypoints, stats } = parseGpxFull(xml);
    res.json({ filename, meta, trackPoints, waypoints, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to parse GPX file' });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) =>
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'))
  );
}

app.listen(PORT, () => {
  console.log(`\n🐺  LoboTracks running at http://localhost:${PORT}`);
  console.log(`   GPX dir: ${GPX_DIR}`);
  console.log(`   Descriptions read directly from GPX <metadata> blocks — no metadata.json needed.\n`);
});
