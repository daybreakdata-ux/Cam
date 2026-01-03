// Use relative API paths for Vercel deployment
const API_BASE = window.location.origin;

const userInput = document.getElementById('user');
const passInput = document.getElementById('pass');
const discoverBtn = document.getElementById('discoverBtn');
const statusEl = document.getElementById('status');
const gridEl = document.getElementById('grid');
const actionsEl = document.getElementById('actions');
const permissionBanner = document.getElementById('permissionBanner');
const cameraModal = document.getElementById('cameraModal');
const closeModal = document.getElementById('closeModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');

// Show permission banner on load
window.addEventListener('load', () => {
  permissionBanner.style.display = 'block';
  setTimeout(() => {
    permissionBanner.style.display = 'none';
  }, 5000);
});

// Modal handlers
closeModal.addEventListener('click', () => {
  cameraModal.classList.remove('active');
});

cameraModal.addEventListener('click', (e) => {
  if (e.target === cameraModal) {
    cameraModal.classList.remove('active');
  }
});

discoverBtn.addEventListener('click', async () => {
  const username = userInput.value;
  const password = passInput.value;

  if (!username || !password) {
    statusEl.textContent = "Please enter username and password";
    return;
  }

  // Show network access notification
  permissionBanner.style.display = 'block';
  permissionBanner.textContent = '🔍 Requesting network access to discover cameras...';
  
  statusEl.textContent = "Discovering...";
  gridEl.innerHTML = "";
  actionsEl.style.display = 'none';

  try {
    const resp = await fetch(`${API_BASE}/api/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, timeoutMs: 5000 })
    });
    const data = await resp.json();
    
    permissionBanner.style.display = 'none';
    
    if (!data.ok) throw new Error(data.error || "discover failed");

    statusEl.textContent = `Found ${data.devices.length} cameras`;
    renderDevices(data.devices);
    if (data.devices.length > 0) {
      actionsEl.style.display = 'flex';
      startSnapshotRefresh();
    }
  } catch (e) {
    console.error(e);
    permissionBanner.style.display = 'none';
    statusEl.textContent = "Error: " + e.message;
  }
});

let devices = [];
let refreshInterval = null;

function renderDevices(devs) {
  devices = devs;
  gridEl.innerHTML = "";
  
  if (devs.length === 0) {
    gridEl.innerHTML = '<div style="padding:2rem; text-align:center; color:#888;">No cameras found. Check your credentials and network connection.</div>';
    return;
  }

  for (const d of devs) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div><strong>${d.name || d.address}</strong></div>
      <img id="snap-${d.id}" alt="snapshot" src="" onerror="this.style.display='none'" onclick="showCameraDetails('${d.id}')" title="Click for details" />
      <div class="meta">
        IP: ${d.address}<br>
        RTSP: <span style="font-size:0.7rem; word-break:break-all;">${d.rtspUrl}</span>
      </div>
      <div class="card-actions">
        <button onclick="showCameraDetails('${d.id}')">📋 Info</button>
        <button onclick="copyRTSP('${d.id}')">📋 Copy RTSP</button>
        <button onclick="downloadCameraConfig('${d.id}')">💾 Config</button>
      </div>
    `;
    gridEl.appendChild(card);
  }
}

function startSnapshotRefresh() {
  // Clear any existing interval
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  // Update snapshots immediately
  updateSnapshots();

  // Then refresh every 3 seconds
  refreshInterval = setInterval(updateSnapshots, 3000);
}

function updateSnapshots() {
  for (const d of devices) {
    const img = document.getElementById(`snap-${d.id}`);
    if (!img) continue;
    // Pass rtspUrl as query parameter since we don't have persistent state in serverless
    img.src = `${API_BASE}/api/snapshot?rtspUrl=${encodeURIComponent(d.rtspUrl)}&t=${Date.now()}`;
  }
}

// Show camera details in modal
window.showCameraDetails = (deviceId) => {
  const device = devices.find(d => d.id === deviceId);
  if (!device) return;

  modalTitle.textContent = device.name || device.address;
  modalBody.innerHTML = `
    <div class="info-section">
      <h3>📹 Camera Information</h3>
      <div class="info-line">
        <span class="info-label">Name:</span>
        <span class="info-value">${device.name || 'Unknown'}</span>
      </div>
      <div class="info-line">
        <span class="info-label">IP Address:</span>
        <span class="info-value">${device.address}</span>
      </div>
      <div class="info-line">
        <span class="info-label">ONVIF URL:</span>
        <span class="info-value">${device.xaddr}</span>
      </div>
    </div>

    <div class="info-section">
      <h3>📡 RTSP Stream</h3>
      <div class="info-line">
        <span class="info-label">URL:</span>
        <span class="info-value">${device.rtspUrl}</span>
      </div>
      <button onclick="copyToClipboard('${device.rtspUrl.replace(/'/g, "\\'")}', 'RTSP URL')" style="margin-top:0.5rem;">
        📋 Copy RTSP URL
      </button>
    </div>

    <div class="info-section">
      <h3>💾 Export Options</h3>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.5rem;">
        <button onclick="downloadCameraConfig('${deviceId}')">📄 Simple Config</button>
        <button onclick="downloadBlueIrisConfig('${deviceId}')">Blue Iris</button>
        <button onclick="downloadFrigateConfig('${deviceId}')">Frigate</button>
        <button onclick="downloadHomeAssistantConfig('${deviceId}')">Home Assistant</button>
      </div>
    </div>
  `;
  
  cameraModal.classList.add('active');
};

// Copy RTSP URL to clipboard
window.copyRTSP = (deviceId) => {
  const device = devices.find(d => d.id === deviceId);
  if (!device) return;
  copyToClipboard(device.rtspUrl, 'RTSP URL');
};

// Copy to clipboard helper
window.copyToClipboard = async (text, label = 'Text') => {
  try {
    await navigator.clipboard.writeText(text);
    statusEl.textContent = `✓ ${label} copied to clipboard`;
    setTimeout(() => statusEl.textContent = '', 3000);
  } catch (e) {
    console.error('Copy failed:', e);
    statusEl.textContent = '✗ Copy failed';
  }
};

// Download configuration file
window.downloadCameraConfig = (deviceId) => {
  const device = devices.find(d => d.id === deviceId);
  if (!device) return;

  const config = `# Camera Configuration
# Generated: ${new Date().toISOString()}

Name: ${device.name || 'Unknown'}
IP Address: ${device.address}
ONVIF URL: ${device.xaddr}
RTSP URL: ${device.rtspUrl}

# Use this RTSP URL in your camera software:
${device.rtspUrl}
`;

  downloadFile(`camera_${device.address}_config.txt`, config);
};

// Export all cameras RTSP URLs
document.getElementById('exportAllBtn').addEventListener('click', () => {
  if (devices.length === 0) return;

  let content = `# All Camera RTSP URLs\n# Generated: ${new Date().toISOString()}\n# Total Cameras: ${devices.length}\n\n`;
  
  devices.forEach((d, i) => {
    content += `# Camera ${i + 1}: ${d.name || d.address}\n`;
    content += `${d.rtspUrl}\n\n`;
  });

  downloadFile('all_cameras_rtsp.txt', content);
});

// Export Blue Iris configuration
document.getElementById('exportBlueIrisBtn').addEventListener('click', () => {
  exportBlueIrisConfig();
});

window.downloadBlueIrisConfig = (deviceId) => {
  exportBlueIrisConfig(deviceId);
};

function exportBlueIrisConfig(deviceId = null) {
  const cams = deviceId ? [devices.find(d => d.id === deviceId)].filter(Boolean) : devices;
  if (cams.length === 0) return;

  let content = `# Blue Iris Camera Configuration\n# Generated: ${new Date().toISOString()}\n\n`;
  
  cams.forEach((d, i) => {
    const camNum = deviceId ? '' : `${i + 1}_`;
    content += `[camera_${camNum}${d.address.replace(/\./g, '_')}]\n`;
    content += `name=${d.name || d.address}\n`;
    content += `ip=${d.address}\n`;
    content += `rtsp=${d.rtspUrl}\n`;
    content += `# Add this camera manually in Blue Iris:\n`;
    content += `# 1. Right-click camera list > Add new camera\n`;
    content += `# 2. Enter short name: ${d.name || d.address}\n`;
    content += `# 3. Network IP: ${d.address}\n`;
    content += `# 4. Main stream: ${d.rtspUrl}\n\n`;
  });

  const filename = deviceId ? `blueiris_${cams[0].address}_config.txt` : 'blueiris_all_cameras.txt';
  downloadFile(filename, content);
}

// Export Frigate configuration
document.getElementById('exportFrigateBtn').addEventListener('click', () => {
  exportFrigateConfig();
});

window.downloadFrigateConfig = (deviceId) => {
  exportFrigateConfig(deviceId);
};

function exportFrigateConfig(deviceId = null) {
  const cams = deviceId ? [devices.find(d => d.id === deviceId)].filter(Boolean) : devices;
  if (cams.length === 0) return;

  let content = `# Frigate Configuration (frigate.yml)\n# Generated: ${new Date().toISOString()}\n\ncameras:\n`;
  
  cams.forEach((d) => {
    const camName = (d.name || d.address).toLowerCase().replace(/[^a-z0-9]/g, '_');
    content += `  ${camName}:\n`;
    content += `    ffmpeg:\n`;
    content += `      inputs:\n`;
    content += `        - path: ${d.rtspUrl}\n`;
    content += `          roles:\n`;
    content += `            - detect\n`;
    content += `            - record\n`;
    content += `    detect:\n`;
    content += `      width: 1920\n`;
    content += `      height: 1080\n`;
    content += `      fps: 5\n\n`;
  });

  const filename = deviceId ? `frigate_${cams[0].address}_config.yml` : 'frigate_all_cameras.yml';
  downloadFile(filename, content);
}

// Export Home Assistant configuration
document.getElementById('exportHomeAssistantBtn').addEventListener('click', () => {
  exportHomeAssistantConfig();
});

window.downloadHomeAssistantConfig = (deviceId) => {
  exportHomeAssistantConfig(deviceId);
};

function exportHomeAssistantConfig(deviceId = null) {
  const cams = deviceId ? [devices.find(d => d.id === deviceId)].filter(Boolean) : devices;
  if (cams.length === 0) return;

  let content = `# Home Assistant Configuration (configuration.yaml)\n# Generated: ${new Date().toISOString()}\n\ncamera:\n`;
  
  cams.forEach((d) => {
    const camName = (d.name || d.address).toLowerCase().replace(/[^a-z0-9]/g, '_');
    content += `  - platform: generic\n`;
    content += `    name: ${d.name || d.address}\n`;
    content += `    stream_source: ${d.rtspUrl}\n`;
    content += `    still_image_url: http://YOUR_SERVER/api/snapshot?rtspUrl=${encodeURIComponent(d.rtspUrl)}\n`;
    content += `    verify_ssl: false\n\n`;
  });

  const filename = deviceId ? `homeassistant_${cams[0].address}_config.yaml` : 'homeassistant_all_cameras.yaml';
  downloadFile(filename, content);
}

// Download file helper
function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  statusEl.textContent = `✓ Downloaded: ${filename}`;
  setTimeout(() => statusEl.textContent = '', 3000);
}
