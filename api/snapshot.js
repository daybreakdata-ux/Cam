const { OnvifManager } = require('@shtw/node-onvif');

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

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
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
    const snapshotUri = await device.services.media.getSnapshotUri({
      ProfileToken: device.getCurrentProfile().token
    });
    
    const snapshotUrl = snapshotUri.data.GetSnapshotUriResponse.MediaUri.Uri;
    
    // Fetch the snapshot image and proxy it
    const fetch = require('node-fetch');
    const response = await fetch(snapshotUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch snapshot: ${response.statusText}`);
    }
    
    const buffer = await response.buffer();
    
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(buffer);
    
  } catch (e) {
    console.error('Snapshot error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
};
