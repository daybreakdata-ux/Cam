const ffmpeg = require('fluent-ffmpeg');

// Note: This requires ffmpeg to be available in the Vercel environment
// Vercel doesn't include ffmpeg by default, so this may need alternative solutions
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { id, rtspUrl } = req.query;
  
  if (!rtspUrl) {
    return res.status(400).json({ ok: false, error: 'rtspUrl query parameter required' });
  }

  try {
    res.setHeader('Content-Type', 'image/jpeg');
    
    ffmpeg(rtspUrl)
      .frames(1)
      .format('mjpeg')
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        if (!res.headersSent) {
          res.status(500).json({ ok: false, error: err.message });
        }
      })
      .pipe(res, { end: true });
  } catch (e) {
    console.error('Snapshot error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
};
