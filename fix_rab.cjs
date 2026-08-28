const fs = require('fs');

const dbPath = 'db.json';
const tsPath = 'src/data/initialData.ts';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// 1. Calculate Realisasi per Seksi
let realisasiSeksi = {};
db.keuangan.filter(t => t.type === 'Keluar').forEach(t => {
  realisasiSeksi[t.seksi] = (realisasiSeksi[t.seksi] || 0) + t.amount;
});

// Update paguAnggaranSeksi
db.settings.paguAnggaranSeksi = {
  "Sekretaris": realisasiSeksi["Sekretaris"] || 0,
  "Acara": realisasiSeksi["Acara"] || 0,
  "Seksi Lomba": realisasiSeksi["Seksi Lomba"] || 0,
  "Seksi Pentas Seni": realisasiSeksi["Seksi Pentas Seni"] || 0,
  "Perlengkapan": realisasiSeksi["Perlengkapan"] || 0,
  "Konsumsi": realisasiSeksi["Konsumsi"] || 0,
  "Seksi Hadiah Dan Doorprize": realisasiSeksi["Seksi Hadiah Dan Doorprize"] || 0,
  "Bendahara": realisasiSeksi["Bendahara"] || 0,
  "Humas": realisasiSeksi["Humas"] || 0,
  "Keamanan dan Kebersihan": realisasiSeksi["Keamanan dan Kebersihan"] || 0,
  "Seksi Dokumentasi dan Publikasi": realisasiSeksi["Seksi Dokumentasi dan Publikasi"] || 0,
  "Seksi Dana Usaha": realisasiSeksi["Seksi Dana Usaha"] || 0
};

// 2. Generate RKBA exactly matching Realisasi
// We can group transactions by `seksi` and create one RKBA per seksi, or group by `activityId`.
// Let's create RKBA based on realisasiSeksi
db.rkba = Object.keys(realisasiSeksi).map((seksi, index) => {
  return {
    id: `rkba-${String(index+1).padStart(2, '0')}`,
    activityCode: `ACT-${String(index+1).padStart(3, '0')}`,
    kegiatanId: "keg-1", // default
    name: `Anggaran ${seksi}`,
    seksi: seksi,
    qty: 1,
    unit: "Paket",
    price: realisasiSeksi[seksi],
    total: realisasiSeksi[seksi],
    fundingSource: "Kas Utama",
    status: "Disetujui"
  };
});

// Update transactions refId to match the new RKBA
db.keuangan.forEach(t => {
  if (t.type === 'Keluar') {
    const rkba = db.rkba.find(r => r.seksi === t.seksi);
    if (rkba) {
      t.refId = rkba.id;
    }
  }
});

// Clear budget changes and reallocations
db.budgetChanges = [];
db.budgetReallocations = [];

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('db.json updated');
