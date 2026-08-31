const fs = require('fs');

const mapSeksi = (oldName) => {
  if (!oldName) return "Support & Humas";
  const name = oldName.toLowerCase();
  if (name.includes("sekretar") || name.includes("bendahara") || name.includes("ketua") || name.includes("bph")) {
    return "BPH & Kesekretariatan";
  }
  if (name.includes("acara") || name.includes("lomba") || name.includes("pentas seni") || name.includes("hadiah")) {
    return "Divisi Acara Terpadu";
  }
  if (name.includes("perlengkap") || name.includes("konsumsi") || name.includes("keamanan") || name.includes("kebersihan") || name.includes("operasional")) {
    return "Divisi Operasional Lapangan";
  }
  return "Support & Humas";
};

let content = fs.readFileSync('src/data/initialData.ts', 'utf-8');

// We have to parse it? Or replace it using regex?
// It's a TS file exporting `initialData`. It's hard to parse.
// Let's just run a regex over "seksi": "..."
content = content.replace(/"seksi":\s*"([^"]+)"/g, (match, seksi) => {
  return `"seksi": "${mapSeksi(seksi)}"`;
});

fs.writeFileSync('src/data/initialData.ts', content);
console.log("Migrated initialData.ts");
