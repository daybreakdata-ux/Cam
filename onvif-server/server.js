const express = require('express');
const cors = require('cors');
const { OnvifManager } = require('@shtw/node-onvif'); // ONVIF client
const ffmpeg = require('fluent-ffmpeg'); // optional: for snapshot/proxy

const app = express();
app.use(cors());
app.use(express.json());

const onvifManager = new OnvifManager();
let discoveredDevices = [];

// Initialize ONVIF manager
(async () => {
  await onvifManager.init();
})();

// POST /discover { username, password, timeoutMs }
app.post('/discover', async (req, res) => {
  const { username, password, timeoutMs = 5000 } = req.body || {};

  try {
    discoveredDevices = [];
    const cams = await onvifManager.discovery.probe({ timeout: timeoutMs }); // WS-Discovery

    const results = [];
    for (const cam of cams) {
      const device = await onvifManager.add({
        xaddr: cam.xaddrs[0],
        user: username,
        pass: password,
      });

      await device.init(); // get services, profiles, etc.

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
    }

    discoveredDevices = results;
    res.json({ ok: true, devices: results });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /devices
app.get('/devices', (req, res) => {
  res.json({ devices: discoveredDevices });
});

// (Optional) snapshot proxy: GET /snapshot?id=<id>
app.get('/snapshot', async (req, res) => {
  const id = req.query.id;
  const dev = discoveredDevices.find(d => d.id === id);
  if (!dev) return res.status(404).end();

  res.set('Content-Type', 'image/jpeg');
  // RTSP → single JPEG frame using ffmpeg
  ffmpeg(dev.rtspUrl)
    .frames(1)
    .format('mjpeg')
    .on('error', (err) => {
      console.error(err);
      res.status(500).end();
    })
    .pipe(res, { end: true });
});

function deviceAddressFromXaddr(xaddr) {
  try {
    const u = new URL(xaddr);
    return u.hostname;
  } catch {
    return xaddr;
  }
}

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`ONVIF server listening on http://localhost:${PORT}`);
});
