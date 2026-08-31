const fs = require("fs");

let tsContent = fs.readFileSync("src/data/initialData.ts", "utf-8");
const jsonPart = tsContent.replace(/^import [^;]+;\s*/, "").replace(/^export const initialData: SEMSData = /, "").replace(/;\s*$/, "");
const data = JSON.parse(jsonPart);

// Exact mapping for transactions
const mapRealisasi = {
    // BPH & Kesekretariatan (Total 523.000)
    "Cetak Proposal (TF)": "BPH & Kesekretariatan", // 258k
    "Print": "BPH & Kesekretariatan", // 6k
    "Print + beli tali": "BPH & Kesekretariatan", // 23k
    "MMT + konsumsi": "BPH & Kesekretariatan", // 200k
    "Tali ID card": "BPH & Kesekretariatan", // 36k

    // Divisi Acara Terpadu (Total 4.909.000)
    "DP Sound (TF)": "Divisi Acara Terpadu", // 300k
    "Panggung + tratak": "Divisi Acara Terpadu", // 750k
    "Tarling": "Divisi Acara Terpadu", // 1500k
    "Pelunasan sound": "Divisi Acara Terpadu", // 900k
    "Acc tari anak": "Divisi Acara Terpadu", // 15k
    "Hadiah uang tunai lomba remaja": "Divisi Acara Terpadu", // 225k
    "Sound tirakat + konsumsi": "Divisi Acara Terpadu", // 200k
    "Beli alat make up untuk tari anak": "Divisi Acara Terpadu", // 181k
    "Panggung + Tratak (Tambahan)": "Divisi Acara Terpadu", // 760k
    "Kebutuhan pentas seni": "Divisi Acara Terpadu", // 78k

    // All others go to Divisi Operasional Lapangan (Total 7.186.000)
    // 35k, 47k, 30k, 50k, 160k, 834k, 235.5k, 967k, 740.5k, 149k, 309k, 187.5k, 597k, 12k, 38k, 257k, 319k, 415k, 599.5k, 10k, 20k, 369k, 150k, 100k, 77k, 95k, 9k, 242k, 132k
};

data.keuangan.forEach(t => {
    if (t.type === "Keluar") {
        let found = false;
        for (const [key, val] of Object.entries(mapRealisasi)) {
            if (t.notes.includes(key) || key.includes(t.notes)) {
                t.seksi = val;
                found = true;
                break;
            }
        }
        if (!found) {
            t.seksi = "Divisi Operasional Lapangan";
        }
    } else {
        // Pemasukan
        t.seksi = "Support & Humas";
    }
});

fs.writeFileSync("src/data/initialData.ts", "import { SEMSData } from '../types';\n\nexport const initialData: SEMSData = " + JSON.stringify(data, null, 2) + ";\n", "utf-8");
