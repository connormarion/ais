// ais-proxy.js
// A basic Node.js WebSocket proxy that listens to AISstream and serves data over REST

const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const AISSTREAM_API_KEY = '4e0481cf94c58808a611c018a0a185435b268485';

let latestData = {}; // { imo: {...vesselData} }

const ws = new WebSocket(`wss://stream.aisstream.io/v0/stream`, {
  headers: {
    'x-api-key': AISSTREAM_API_KEY
  }
});

ws.on('open', () => {
  console.log('Connected to AISstream WebSocket');

  const subscribeMessage = {
    Apikey: AISSTREAM_API_KEY,
    BoundingBoxes: [], // empty gets all
    FilterMessageTypes: ["PositionReport"]
  };

  ws.send(JSON.stringify(subscribeMessage));
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data);
    if (msg.MessageType === 'PositionReport') {
      const imo = msg.Payload.IMO;
      if (imo) {
        latestData[imo] = msg.Payload;
      }
    }
  } catch (err) {
    console.error('Parse error:', err);
  }
});

app.get('/vessel/:imo', (req, res) => {
  const imo = req.params.imo;
  const vessel = latestData[imo];
  if (vessel) {
    res.json(vessel);
  } else {
    res.status(404).json({ error: 'Vessel not found yet in stream. Wait and retry.' });
  }
});
app.get('/ping', (req, res) => {
  res.status(200).send('AIS proxy is alive.');
});

app.listen(PORT, () => {
  console.log(`AIS Proxy server running on port ${PORT}`);
});

