const fs = require('fs');

const dbPath = 'db.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

db.rkba = db.rkba.map(r => ({
  ...r,
  notes: "-",
  dateAdded: "2026-07-01"
}));

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('db.json fixed');
