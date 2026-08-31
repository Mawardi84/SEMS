const fs = require("fs");

let tsContent = fs.readFileSync("src/data/initialData.ts", "utf-8");
const jsonPart = tsContent.replace(/^import [^;]+;\s*/, "").replace(/^export const initialData: SEMSData = /, "").replace(/;\s*$/, "");
const data = JSON.parse(jsonPart);

// 1. Update Settings
data.settings.seksiList = [
  "BPH & Kesekretariatan",
  "Divisi Acara Terpadu",
  "Divisi Operasional Lapangan",
  "Support & Humas"
];
data.settings.paguAnggaranSeksi = {
  "BPH & Kesekretariatan": 1050000,
  "Divisi Acara Terpadu": 5300000,
  "Divisi Operasional Lapangan": 11200000,
  "Support & Humas": 0
};

// 2. Mapping Function
function mapSeksi(name, activityCode, oldSeksi) {
    if (activityCode && activityCode.startsWith("LAIN-")) {
        if (activityCode === "LAIN-06") return "Divisi Operasional Lapangan";
        return "BPH & Kesekretariatan";
    }
    if (activityCode && activityCode.startsWith("TIRAKAT-")) {
        if (activityCode === "TIRAKAT-03" || activityCode === "TIRAKAT-04") return "Divisi Operasional Lapangan"; // Hadiah jabutan & lomba
        return "Divisi Acara Terpadu";
    }
    if (activityCode && activityCode.startsWith("SEHAT-")) return "Divisi Operasional Lapangan";
    if (activityCode && activityCode.startsWith("LOMBA-")) return "Divisi Operasional Lapangan";
    if (activityCode && activityCode.startsWith("RESEPSI-")) {
        if (activityCode === "RESEPSI-04" || activityCode === "RESEPSI-06") return "Divisi Operasional Lapangan"; // Konsumsi
        return "Divisi Acara Terpadu"; // Panggung, Sound, Tarling, Kostum
    }
    
    // Fallback for transactions based on names/notes
    const lower = (name || "").toLowerCase() + " " + (oldSeksi || "").toLowerCase();
    if (lower.includes("cetak") || lower.includes("print") || lower.includes("administrasi") || lower.includes("tali id") || lower.includes("mmt")) {
        return "BPH & Kesekretariatan";
    }
    if (lower.includes("panggung") || lower.includes("tratak") || lower.includes("sound") || lower.includes("tarling") || lower.includes("tari") || lower.includes("make up") || lower.includes("pentas seni") || lower.includes("uang tunai remaja")) {
        // Exception for konsumsi pentas seni
        if (lower.includes("konsumsi") && !lower.includes("sound tirakat + konsumsi")) return "Divisi Operasional Lapangan";
        return "Divisi Acara Terpadu";
    }
    if (lower.includes("donasi") || lower.includes("donatur")) return "Support & Humas";
    return "Divisi Operasional Lapangan"; // Default to Operasional (Konsumsi, Lomba, Hadiah, Perlengkapan)
}

// Map RKBA
data.rkba.forEach(r => {
    r.seksi = mapSeksi(r.name, r.activityCode, r.seksi);
});

// Map Keuangan
data.keuangan.forEach(t => {
    if (t.type === "Masuk") {
        if (t.category === "Penerimaan Donasi" || t.notes.includes("Donasi")) {
            t.seksi = "Support & Humas";
        } else {
            t.seksi = "BPH & Kesekretariatan";
        }
    } else {
        // Manual override for some specific transactions
        if (t.notes === "Beli alat make up untuk tari anak") t.seksi = "Divisi Acara Terpadu";
        else if (t.notes === "Kebutuhan pentas seni") t.seksi = "Divisi Acara Terpadu";
        else if (t.notes === "Sound tirakat + konsumsi") t.seksi = "Divisi Acara Terpadu"; // Wait, 200k sound
        else t.seksi = mapSeksi(t.notes, null, t.seksi);
    }
});

// Map Budget Changes
data.budgetChanges.forEach(bc => {
    bc.seksi = mapSeksi(bc.activityName, bc.activityCode, bc.seksi);
});

// Map Reallocations
data.budgetReallocations.forEach(br => {
    br.sourceSeksi = mapSeksi(br.sourceActivityName, null, br.sourceSeksi);
    br.targetSeksi = mapSeksi(br.targetActivityName, null, br.targetSeksi);
});

fs.writeFileSync("src/data/initialData.ts", "import { SEMSData } from '../types';\n\nexport const initialData: SEMSData = " + JSON.stringify(data, null, 2) + ";\n", "utf-8");
console.log("Updated initialData.ts with Lean Structure");
