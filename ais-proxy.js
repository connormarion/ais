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
    BoundingBoxes: [],
    FilterMessageTypes: ["PositionReport"],
    FilterTargets: {
      IMOs: [
        6615912, 7121140, 7366805, 7417276, 7514397, 7604300, 7802562, 7901966, 7914482, 7925302,
        7925314, 7942685, 8016304, 8023541, 8120014, 8121355, 8131362, 8213237, 8305511, 8322258,
        8428583, 8507016, 8628195, 8764975, 8765785, 8765943, 8767305, 8835566, 8841565, 8842143,
        8842246, 8851106, 8878855, 8892033, 8936592, 8940581, 8964109, 8964135, 8964288, 8964795,
        8964850, 8964862, 8966717, 8967553, 8968167, 8968181, 8968399, 8973435, 8975823, 8976475,
        8977194, 8977455, 8977730, 8978174, 8978227, 8978382, 8978461, 8978497, 8978502, 8978710,
        8982266, 8982541, 8982553, 8982565, 8982577, 8982591, 8983210, 8983521, 8987852, 8987905,
        8992819, 8992845, 8993966, 8998112, 8998124, 9010137, 9040326, 9043835, 9043861, 9043873,
        9043885, 9043914, 9043938, 9044645, 9053153, 9053165, 9055814, 9075228, 9089396, 9097147,
        9105798, 9132234, 9132313, 9132325, 9137349, 9158068, 9196565, 9202302, 9208887, 9212993,
        9213002, 9234551, 9245940, 9260744, 9260756, 9262742, 9268629, 9271200, 9271705, 9281396,
        9322592, 9327695, 9332858, 9347401, 9347413, 9349057, 9349069, 9349071, 9354038, 9382839,
        9382865, 9382877, 9383792, 9387426, 9388443, 9407809, 9413432, 9423114, 9458884, 9469405,
        9472347, 9472359, 9472361, 9472373, 9472438, 9472440, 9477969, 9515852, 9518957, 9529889,
        9546021, 9555761, 9566887, 9568835, 9575113, 9578737, 9582312, 9585077, 9591648, 9601120,
        9622655, 9627423, 9645619, 9645645, 9647588, 9647629, 9647643, 9647655, 9657674, 9664988,
        9670638, 9672648, 9679725, 9695171, 9706891, 9752577, 9759379, 9776925, 9778973, 9779070,
        9841392, 9900887, 9952880, 9955234, 9993054, 9993066, 9998676, 1035894, 1056109
      ]
    }
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
        console.log(`✅ AIS received for IMO ${imo}`);
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
