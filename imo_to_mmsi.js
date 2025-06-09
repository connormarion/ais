// imo_to_mmsi.js
const fetch = require('node-fetch');
const fs = require('fs');

const userkey = '61ed684bc5ebddc75b174555b376aab0';

const imos = [
  9043873, 9044645, 9043861, 9043938, 9043885, 9043914, 9413432, 9332858,
  9566887, 9105798, 9841392, 9349069, 9695171, 9010137, 9778973, 9664988,
  9472361, 9472373, 9347413, 7723821, 9622655, 9281396, 9354038, 8628195,
  // ... continue adding all your IMOs here ...
];

async function fetchMMSIs(imoList) {
  const results = [];

  for (const imo of imoList) {
    try {
      const url = `https://api.vesselfinder.com/vessels?userkey=${userkey}&imo=${imo}&format=json`;
      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0 && data[0].AIS?.MMSI) {
        results.push({ imo, mmsi: data[0].AIS.MMSI, name: data[0].AIS.NAME });
        console.log(`✅ IMO ${imo} → MMSI ${data[0].AIS.MMSI}`);
      } else {
        console.warn(`❌ IMO ${imo} → No MMSI found`);
      }
    } catch (err) {
      console.error(`⚠️ Error for IMO ${imo}:`, err.message);
    }

    await new Promise(r => setTimeout(r, 1000)); // avoid rate limit
  }

  return results;
}

(async () => {
  const converted = await fetchMMSIs(imos);
  fs.writeFileSync('imo_to_mmsi.json', JSON.stringify(converted, null, 2));
  console.log(`✅ Saved ${converted.length} IMO→MMSI mappings.`);
})();
