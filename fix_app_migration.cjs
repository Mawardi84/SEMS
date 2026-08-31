const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const migrationCode = `
      // --- RUN TIME MIGRATION ---
      // Force migration to 4 Lean Structure Divisions
      if (json && json.settings && json.settings.seksiList && json.settings.seksiList.length !== 4) {
        console.log("Migrating seksiList to 4 divisions...");
        json.settings.seksiList = [
          "BPH & Kesekretariatan",
          "Divisi Acara Terpadu",
          "Divisi Operasional Lapangan",
          "Support & Humas"
        ];
        json.settings.paguAnggaranSeksi = {
          "BPH & Kesekretariatan": 1050000,
          "Divisi Acara Terpadu": 5300000,
          "Divisi Operasional Lapangan": 11200000,
          "Support & Humas": 0
        };
        // Also map RKBA and Keuangan
        const mapSeksi = (oldName) => {
          if (!oldName) return "Support & Humas";
          const name = oldName.toLowerCase();
          if (name.includes("sekretar") || name.includes("bendahara") || name.includes("ketua") || name.includes("bph")) return "BPH & Kesekretariatan";
          if (name.includes("acara") || name.includes("lomba") || name.includes("pentas seni") || name.includes("hadiah")) return "Divisi Acara Terpadu";
          if (name.includes("perlengkap") || name.includes("konsumsi") || name.includes("keamanan") || name.includes("kebersihan") || name.includes("operasional")) return "Divisi Operasional Lapangan";
          return "Support & Humas";
        };
        
        if (json.rkba) json.rkba.forEach((t) => t.seksi = mapSeksi(t.seksi));
        if (json.keuangan) json.keuangan.forEach((t) => {
          if (t.type === "Keluar" && t.seksi) t.seksi = mapSeksi(t.seksi);
        });
        if (json.tasks) json.tasks.forEach((t) => t.seksi = mapSeksi(t.seksi));
        if (json.panitia) json.panitia.forEach((t) => t.seksi = mapSeksi(t.seksi));
        
        // Save back to backend immediately if possible
        fetch("/api/sems/sync-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json)
        }).catch(e => console.error(e));
      }
      // --- END MIGRATION ---
`;

// Insert after `if (json && json.settings) {` in API fetch
code = code.replace(
  /if \(json && json\.settings\) \{([\s\S]*?)setSemsData\(json\);/,
  `if (json && json.settings) {${migrationCode}
              setSemsData(json);`
);

// Insert after `if (localSaved && localSaved.settings) {` in local fallback
const localMigrationCode = migrationCode.replace(/json/g, 'localSaved');
code = code.replace(
  /if \(localSaved && localSaved\.settings\) \{([\s\S]*?)setSemsData\(localSaved\);/,
  `if (localSaved && localSaved.settings) {${localMigrationCode}
        setSemsData(localSaved);`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Added migration to App.tsx");
