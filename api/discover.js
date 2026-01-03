const { OnvifManager } = require('@shtw/node-onvif');

// Shared ONVIF manager instance
let onvifManager = null;
let discoveredDevices = [];

async function getOnvifManager() {
  if (!onvifManager) {
    onvifManager = new OnvifManager();
    await onvifManager.init();
  }
  return onvifManager;
}

function deviceAddressFromXaddr(xaddr) {
  try {
    const u = new URL(xaddr);
    return u.hostname;
  } catch {
    return xaddr;
  }
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { username, password, timeoutMs = 5000 } = req.body || {};

  try {
    const manager = await getOnvifManager();
    discoveredDevices = [];
    const cams = await manager.discovery.probe({ timeout: timeoutMs });

    const results = [];
    for (const cam of cams) {
      try {
        const device = await manager.add({
          xaddr: cam.xaddrs[0],
          user: username,
          pass: password,
        });

        await device.init();

        const profiles = await device.services.media.getProfiles();
        const profileToken = profiles[0].token;
        const streamUriResp = await device.services.media.getStreamUri({
          ProfileToken: profileToken,
          Protocol: 'RTSP',
        });

        const rtspUrl = streamUriResp.data.GetStreamUriResponse.MediaUri.Uri;

        results.push({
          id: device.id,
          name: cam.name || deviceAddressFromXaddr(cam.xaddrs[0]),
          xaddr: cam.xaddrs[0],
          address: deviceAddressFromXaddr(cam.xaddrs[0]),
          rtspUrl,
        });
      } catch (deviceError) {
        console.error('Error processing device:', deviceError);
        // Continue with other devices
      }
    }

    discoveredDevices = results;
    res.status(200).json({ ok: true, devices: results });
  } catch (e) {
    console.error('Discovery error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
};

// Export for access from other functions
module.exports.getDiscoveredDevices = () => discoveredDevices;