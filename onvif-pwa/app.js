const API_BASE = "http://localhost:8080"; // or LAN IP of your Node server

const userInput = document.getElementById('user');
const passInput = document.getElementById('pass');
const discoverBtn = document.getElementById('discoverBtn');
const statusEl = document.getElementById('status');
const gridEl = document.getElementById('grid');

discoverBtn.addEventListener('click', async () => {
  const username = userInput.value;
  const password = passInput.value;

  statusEl.textContent = "Discovering...";
  gridEl.innerHTML = "";

  try {
    const resp = await fetch(`${API_BASE}/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, timeoutMs: 5000 })
    });
    const data = await resp.json();
    if (!data.ok) throw new Error(data.error || "discover failed");

    statusEl.textContent = `Found ${data.devices.length} cameras`;
    renderDevices(data.devices);
    startSnapshotRefresh();
  } catch (e) {
    console.error(e);
    statusEl.textContent = "Error: " + e.message;
  }
});

let devices = [];

function renderDevices(devs) {
  devices = devs;
  gridEl.innerHTML = "";
  for (const d of devs) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div><strong>${d.name || d.address}</strong></div>
      <img id="snap-${d.id}" alt="snapshot" />
      <div class="meta">
        IP: ${d.address}<br>
        RTSP: ${d.rtspUrl}
      </div>
    `;
    gridEl.appendChild(card);
  }
}

function startSnapshotRefresh() {
  // refresh every 3 seconds
  setInterval(() => {
    for (const d of devices) {
      const img = document.getElementById(`snap-${d.id}`);
      if (!img) continue;
      img.src = `${API_BASE}/snapshot?id=${encodeURIComponent(d.id)}&t=${Date.now()}`;
    }
  }, 3000);
}
