const fs = require('fs');

const mapSeksi = (oldName) => {
  if (!oldName) return "Support & Humas";
  const name = oldName.toLowerCase();
  if (name.includes("sekretar") || name.includes("bendahara") || name.includes("ketua")) {
    return "BPH & Kesekretariatan";
  }
  if (name.includes("acara") || name.includes("lomba") || name.includes("pentas seni") || name.includes("hadiah")) {
    return "Divisi Acara Terpadu";
  }
  if (name.includes("perlengkap") || name.includes("konsumsi") || name.includes("keamanan") || name.includes("kebersihan")) {
    return "Divisi Operasional Lapangan";
  }
  if (name.includes("humas") || name.includes("publikasi") || name.includes("dokumentasi") || name.includes("dana usaha")) {
    return "Support & Humas";
  }
  return "Support & Humas";
};

let db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));

if (db.rkba) {
  db.rkba.forEach(item => {
    item.seksi = mapSeksi(item.seksi);
  });
}

if (db.keuangan) {
  db.keuangan.forEach(tx => {
    if (tx.type === 'Keluar' && tx.seksi) {
      tx.seksi = mapSeksi(tx.seksi);
    }
  });
}

if (db.panitia) {
  db.panitia.forEach(p => {
    p.seksi = mapSeksi(p.seksi);
  });
}

if (db.tasks) {
  db.tasks.forEach(t => {
    t.seksi = mapSeksi(t.seksi);
  });
}

fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
console.log("Migrated db.json legacy seksi to 4 divisions.");
