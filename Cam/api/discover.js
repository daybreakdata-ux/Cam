// This file contains the API endpoint for discovering cameras. It handles incoming requests, processes authentication, and returns a list of discovered devices.

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Mock function to simulate camera discovery
const discoverCameras = async (username, password) => {
  // Replace with actual discovery logic
  return [
    { id: '1', name: 'Camera 1', address: '192.168.1.10', rtspUrl: 'rtsp://192.168.1.10/stream' },
    { id: '2', name: 'Camera 2', address: '192.168.1.11', rtspUrl: 'rtsp://192.168.1.11/stream' },
  ];
};

router.post('/', async (req, res) => {
  const { username, password, timeoutMs } = req.body;

  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'Username and password are required' });
  }

  try {
    const devices = await discoverCameras(username, password);
    res.json({ ok: true, devices });
  } catch (error) {
    console.error('Discovery error:', error);
    res.status(500).json({ ok: false, error: 'Failed to discover cameras' });
  }
});

module.exports = router;