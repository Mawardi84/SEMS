const fs = require('fs');
let code = fs.readFileSync('src/components/KeuanganView.tsx', 'utf-8');

// Add filterBukuKas state
code = code.replace(
  /const \[filterType, setFilterType\] = useState<string>\("Semua"\);/,
  `const [filterType, setFilterType] = useState<string>("Semua");\n  const [filterBukuKas, setFilterBukuKas] = useState<string>("Semua");`
);

// Add to printable header
code = code.replace(
  /Filter: Tipe \(\{filterType\}\) • Kategori \(\{filterCategory\}\)/,
  `Filter: Buku ({filterBukuKas}) • Tipe ({filterType}) • Kategori ({filterCategory})`
);

// Add the filter logic
code = code.replace(
  /const filteredTransactions = keuangan\.filter\(t => \{([\s\S]*?)return matchType && matchCategory;/,
  `const filteredTransactions = keuangan.filter(t => {
    const matchType = filterType === "Semua" || t.type === filterType;
    const matchCategory = filterCategory === "Semua" || t.category === filterCategory;
    const isBukuUtama = !t.id || t.id.includes("-bu-");
    const isBukuDonasi = t.id && t.id.includes("-bd-");
    const matchBuku = filterBukuKas === "Semua" || (filterBukuKas === "Buku Utama" ? isBukuUtama : (filterBukuKas === "Buku Donasi" ? isBukuDonasi : true));
    return matchType && matchCategory && matchBuku;`
);

// Add the UI dropdown for the filter
code = code.replace(
  /<div className="flex flex-wrap gap-2">/,
  `<div className="flex flex-wrap gap-2">
                <select
                  value={filterBukuKas}
                  onChange={(e) => setFilterBukuKas(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-700 text-[10px] rounded px-2 py-1 focus:border-sky-500 focus:outline-none"
                >
                  <option value="Semua">Semua Buku Kas</option>
                  <option value="Buku Utama">Buku Utama</option>
                  <option value="Buku Donasi">Buku Donasi</option>
                </select>`
);

// Also let's show an indicator on the transaction row
code = code.replace(
  /\{t\.proofNumber && \(\s*<div className="text-\[9px\] text-slate-500 font-mono mt-1">\s*Ref: \{t\.proofNumber\}\s*<\/div>\s*\)\}/,
  `{t.proofNumber && (
                              <div className="text-[9px] text-slate-500 font-mono mt-1">
                                Ref: {t.proofNumber}
                              </div>
                            )}
                            <div className="text-[9px] mt-1 font-mono font-bold w-max px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600">
                                {(!t.id || t.id.includes("-bu-")) ? "Buku Utama" : "Buku Donasi"}
                            </div>`
);

fs.writeFileSync('src/components/KeuanganView.tsx', code);
console.log("Fixed KeuanganView.tsx");
