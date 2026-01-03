# ONVIF Camera Discovery System

A complete ONVIF camera discovery and monitoring system with serverless backend and PWA frontend, deployable to Vercel.

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/daybreakdata-ux/Cam)

1. Click the deploy button above or run:
```bash
npm install
vercel --prod
```

2. Your app will be live at `https://your-project.vercel.app`

## Project Structure

```
/workspaces/Cam/
├── api/                   # Vercel Serverless Functions
│   ├── discover.js       # POST /api/discover - Camera discovery
│   ├── devices.js        # GET /api/devices - List devices
│   └── snapshot.js       # GET /api/snapshot - Camera snapshots
├── public/               # Frontend PWA
│   ├── index.html
│   ├── manifest.json
│   └── app.js
├── onvif-server/         # Legacy standalone backend (for local development)
├── onvif-pwa/            # Legacy standalone frontend (for local development)
├── package.json          # Root dependencies for Vercel
├── vercel.json           # Vercel configuration
└── README.md
```

## Features

- **WS-Discovery**: Discovers ONVIF cameras on the LAN via UDP multicast
- **RTSP URL Retrieval**: Gets RTSP stream URLs from discovered cameras
- **Snapshot View**: Displays camera snapshots with auto-refresh
- **Serverless Architecture**: Runs on Vercel with zero-config deployment
- **PWA Support**: Installable web app with offline manifest

## API Endpoints

### POST /api/discover
Discover ONVIF cameras on the network.

**Body:**
```json
{
  "username": "admin",
  "password": "password",
  "timeoutMs": 5000
}
```

**Response:**
```json
{
  "ok": true,
  "devices": [
    {
      "id": "device-id",
      "name": "Camera Name",
      "address": "192.168.1.100",
      "xaddr": "http://192.168.1.100:80/onvif/device_service",
      "rtspUrl": "rtsp://192.168.1.100:554/stream1"
    }
  ]
}
```

### GET /api/devices
Get list of previously discovered devices.

### GET /api/snapshot?rtspUrl=<url>
Get a JPEG snapshot from an RTSP stream.

## Local Development

### Option 1: Vercel Dev Server (Recommended)

```bash
npm install
vercel dev
```

Open http://localhost:3000

### Option 2: Standalone Mode

**Backend:**
```bash
cd onvif-server
npm install
node server.js
```

**Frontend:**
```bash
cd onvif-pwa
npx serve .
```

## Usage

1. Open the app (deployed or local)
2. Enter your camera's ONVIF username and password
3. Click "Discover Cameras"
4. View discovered cameras with live snapshots

## Important Notes

### Network Requirements
- **ONVIF Discovery** requires UDP multicast (port 3702) on your local network
- When deployed to Vercel, discovery works best from devices on the same network as the cameras
- For remote access, you may need to manually configure camera IPs

### FFmpeg Dependency
- The snapshot endpoint requires FFmpeg to convert RTSP streams to JPEG
- **Vercel Limitation**: FFmpeg is not available by default in Vercel's serverless environment
- **Solutions**:
  - Use a custom FFmpeg layer (see [Vercel FFmpeg guide](https://github.com/ericnograles/vercel-ffmpeg))
  - Deploy to a platform with FFmpeg support (AWS Lambda with layer, Docker, VPS)
  - Use camera's native snapshot URL if available

### Serverless Limitations
- State (discovered devices) resets between serverless cold starts
- Functions have a 10-second execution timeout on free tier (30s on Pro)
- UDP multicast may not work reliably in some serverless environments

## Alternative Deployment Options

### Docker (Full Feature Support)
```bash
docker build -t onvif-camera-grid .
docker run -p 8080:8080 --network host onvif-camera-grid
```

### VPS/Traditional Server
```bash
cd onvif-server
npm install
node server.js
```

## Troubleshooting

### No cameras discovered
- Verify you're on the same network as the cameras
- Check firewall allows UDP port 3702
- Verify ONVIF credentials are correct
- Ensure cameras have ONVIF enabled

### Snapshots not loading on Vercel
- FFmpeg is not available by default
- Use custom FFmpeg layer or alternative deployment
- Check camera documentation for native snapshot URLs

### CORS errors
- Ensure you're accessing the app via the correct domain
- API functions include CORS headers by default

## Configuration

### Environment Variables
Create `.env.local` for local development:
```bash
# Optional configuration
ONVIF_TIMEOUT=5000
```

## License

ISC

## Contributing

Contributions welcome! Please open an issue or PR.