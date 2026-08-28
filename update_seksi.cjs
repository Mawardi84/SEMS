const fs = require('fs');

const dbPath = 'db.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// 1. Update transactions
db.keuangan.forEach(t => {
  if (t.id === 'trx-bu-26') {
    t.seksi = 'Acara';
  }
  if (t.id === 'trx-bd-20') {
    t.seksi = 'Konsumsi';
  }
  if (t.id === 'trx-bu-31') {
    t.seksi = 'Perlengkapan';
  }
});

// 2. Calculate realisasi per seksi
let realisasiSeksi = {};
db.keuangan.filter(t => t.type === 'Keluar').forEach(t => {
  realisasiSeksi[t.seksi] = (realisasiSeksi[t.seksi] || 0) + t.amount;
});

console.log('Realisasi per seksi:', realisasiSeksi);

// 3. Update settings paguAnggaranSeksi
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

// 4. Create RKBA for each active seksi
const seksiOrder = [
  "Acara",
  "Seksi Pentas Seni",
  "Perlengkapan",
  "Konsumsi",
  "Sekretaris",
  "Seksi Lomba",
  "Seksi Hadiah Dan Doorprize",
  "Humas"
];

db.rkba = seksiOrder.map((seksi, index) => {
  let name = `Anggaran ${seksi}`;
  if (seksi === 'Acara') name = 'Honor Pengisi Acara (Tarling)';
  else if (seksi === 'Seksi Pentas Seni') name = 'Perlengkapan Make Up Tari Anak';
  
  return {
    id: `rkba-${String(index + 1).padStart(2, '0')}`,
    activityCode: `ACT-${String(index + 1).padStart(3, '0')}`,
    kegiatanId: "keg-4",
    name: name,
    seksi: seksi,
    qty: 1,
    unit: "Paket",
    price: realisasiSeksi[seksi] || 0,
    total: realisasiSeksi[seksi] || 0,
    fundingSource: "Kas Utama",
    status: "Disetujui",
    notes: "-",
    dateAdded: "2026-07-01"
  };
});

// Update transaction refIds to point to matching RKBA
db.keuangan.forEach(t => {
  if (t.type === 'Keluar') {
    const rkba = db.rkba.find(r => r.seksi === t.seksi);
    if (rkba) {
      t.refId = rkba.id;
    }
  }
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
fs.writeFileSync('backup_database_rw04.json', JSON.stringify(db, null, 2));

const tsPath = 'src/data/initialData.ts';
const updatedDbString = JSON.stringify(db, null, 2);
const newTsContent = `import { SEMSData } from "../types";\n\nexport const initialData: SEMSData = ${updatedDbString};\n`;
fs.writeFileSync(tsPath, newTsContent);

console.log('Successfully updated all data sources!');
