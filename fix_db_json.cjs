const fs = require('fs');
let db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));

db.settings.seksiList = [
  "BPH & Kesekretariatan",
  "Divisi Acara Terpadu",
  "Divisi Operasional Lapangan",
  "Support & Humas"
];

db.settings.paguAnggaranSeksi = {
  "BPH & Kesekretariatan": 1050000,
  "Divisi Acara Terpadu": 5300000,
  "Divisi Operasional Lapangan": 11200000,
  "Support & Humas": 0
};

fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
console.log("Fixed db.json");
