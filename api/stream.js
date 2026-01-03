const { OnvifManager } = require('@shtw/node-onvif');
const fetch = require('node-fetch');

// Shared ONVIF manager instance
let onvifManager = null;

async function getOnvifManager() {
  if (!onvifManager) {
    onvifManager = new OnvifManager();
    await onvifManager.init();
  }
  return onvifManager;
}

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

  const { xaddr, username, password } = req.query;

  if (!xaddr || !username || !password) {
    return res.status(400).json({ 
      ok: false, 
      error: 'xaddr, username, and password query parameters required' 
    });
  }

  try {
    const manager = await getOnvifManager();
    
    // Add device to manager
    const device = await manager.add({
      xaddr: xaddr,
      user: username,
      pass: password,
    });

    await device.init();

    // Get snapshot URI from ONVIF
    const snapshotUriResp = await device.services.media.getSnapshotUri({
      ProfileToken: device.getCurrentProfile().token
    });
    
    const snapshotUrl = snapshotUriResp.data.GetSnapshotUriResponse.MediaUri.Uri;
    
    // Set MJPEG headers
    const boundary = 'myboundary';
    res.writeHead(200, {
      'Content-Type': `multipart/x-mixed-replace; boundary=${boundary}`,
      'Cache-Control': 'no-cache',
      'Connection': 'close',
      'Pragma': 'no-cache'
    });

    // Stream loop
    // Vercel functions have a timeout (default 10s for Hobby, 60s for Pro).
    // We will stream until the platform kills the execution.
    while (true) {
      try {
        const response = await fetch(snapshotUrl);
        if (!response.ok) throw new Error('Failed to fetch snapshot');
        
        const buffer = await response.buffer();

        res.write(`--${boundary}\r\n`);
        res.write('Content-Type: image/jpeg\r\n');
        res.write(`Content-Length: ${buffer.length}\r\n`);
        res.write('\r\n');
        res.write(buffer);
        res.write('\r\n');

        // Aim for ~5-10 FPS depending on camera speed
        await new Promise(resolve => setTimeout(resolve, 200)); 
      } catch (frameError) {
        console.error('Frame error:', frameError);
        // Wait a bit longer on error before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

  } catch (e) {
    console.error('Stream setup error:', e);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: e.message });
    } else {
      res.end();
    }
  }
};
