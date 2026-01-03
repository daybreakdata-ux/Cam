const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

// Endpoint to get a snapshot from a camera
router.get('/snapshot', async (req, res) => {
  const { rtspUrl } = req.query;

  if (!rtspUrl) {
    return res.status(400).json({ error: 'RTSP URL is required' });
  }

  try {
    // Fetch the snapshot from the camera
    const response = await fetch(`http://camera-service/snapshot?rtspUrl=${encodeURIComponent(rtspUrl)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch snapshot from camera');
    }

    const imageBuffer = await response.buffer();
    res.set('Content-Type', 'image/jpeg');
    res.send(imageBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;