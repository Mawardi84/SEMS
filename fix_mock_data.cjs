const fs = require('fs');
let code = fs.readFileSync('src/components/MonitoringView.tsx', 'utf-8');

// Replace markdown mock
code = code.replace(
  /if \(useMockData\) \{([\s\S]*?)\} else \{/g,
  `if (useMockData) {
        if (seksiName.includes("Sekretar") || seksiName.includes("BPH")) { pagu = 1050000; spent = 523000; }
        else if (seksiName.includes("Acara")) { pagu = 5300000; spent = 4909000; }
        else if (seksiName.includes("Operasional") || seksiName.includes("Perlengkap")) { pagu = 11200000; spent = 7186000; }
        else if (seksiName.includes("Humas") || seksiName.includes("Support")) { pagu = 0; spent = 0; }
        else { pagu = safeSettings.paguAnggaranSeksi[seksiName] || 0; spent = Math.round(pagu * 0.9); }
      } else {`
);

// We also need to fix seksiTableData map mock logic:
const oldMockLogic = /if \(useMockData\) \{\s*\/\/ mock logic\s*spent = Math\.round\(pagu \* 0\.9\);\s*\}/;
const newMockLogic = `if (useMockData) {
                      if (seksiName.includes("Sekretar") || seksiName.includes("BPH")) { pagu = 1050000; spent = 523000; spentUtama = 523000; spentDonasi = 0; }
                      else if (seksiName.includes("Acara")) { pagu = 5300000; spent = 4909000; spentUtama = 4909000; spentDonasi = 0; }
                      else if (seksiName.includes("Operasional") || seksiName.includes("Perlengkap")) { pagu = 11200000; spent = 7186000; spentUtama = 4568000; spentDonasi = 2618000; }
                      else if (seksiName.includes("Humas") || seksiName.includes("Support")) { pagu = 0; spent = 0; spentUtama = 0; spentDonasi = 0; }
                      else { spent = Math.round(pagu * 0.9); }
                    }`;

code = code.replace(oldMockLogic, newMockLogic);

// We should also replace the markdown generator to include Kas Utama and Kas Donasi!
// Find the markdown table generator
code = code.replace(
  /const seksiRows = seksiList\.map\(\(seksiName, idx\) => \{([\s\S]*?)return `\| \$\{idx \+ 1\} \| Seksi \$\{seksiName\} \| \$\{formatRp\(pagu\)\} \| \$\{formatRp\(spent\)\} \| \$\{formatRp\(sisa\)\} \| \$\{pct\}% \|`;\n\s*\}\)\.join\("\\n"\);/,
  `const seksiRows = seksiList.map((seksiName, idx) => {
      let pagu = safeSettings.paguAnggaranSeksi[seksiName] || 0;
      let spent = 0;
      let spentUtama = 0;
      let spentDonasi = 0;
      
      if (useMockData) {
        if (seksiName.includes("Sekretar") || seksiName.includes("BPH")) { pagu = 1050000; spent = 523000; spentUtama = 523000; spentDonasi = 0; }
        else if (seksiName.includes("Acara")) { pagu = 5300000; spent = 4909000; spentUtama = 4909000; spentDonasi = 0; }
        else if (seksiName.includes("Operasional") || seksiName.includes("Perlengkap")) { pagu = 11200000; spent = 7186000; spentUtama = 4568000; spentDonasi = 2618000; }
        else if (seksiName.includes("Humas") || seksiName.includes("Support")) { pagu = 0; spent = 0; spentUtama = 0; spentDonasi = 0; }
        else { spent = Math.round(pagu * 0.9); }
      } else {
        const txs = keuangan.filter(t => t.type === 'Keluar' && matchTxToSeksi(t, seksiName));
        spent = txs.reduce((sum, t) => sum + t.amount, 0);
        spentUtama = txs.filter(t => !t.id || t.id.includes('-bu-')).reduce((sum, t) => sum + t.amount, 0);
        spentDonasi = txs.filter(t => t.id && t.id.includes('-bd-')).reduce((sum, t) => sum + t.amount, 0);
      }
      const sisa = pagu - spent;
      const pct = pagu > 0 ? Math.round((spent / pagu) * 100) : 0;
      return \`| \${idx + 1} | \${seksiName} | \${formatRp(pagu)} | \${formatRp(spent)} | \${formatRp(spentUtama)} | \${formatRp(spentDonasi)} | \${formatRp(sisa)} | \${pct}% |\`;
    }).join("\\n");`
);

code = code.replace(
  /const seksiBudgetTableMarkdown = `\| No \| Pos \/ Seksi Anggaran \| Alokasi Pagu \(Rp\) \| Realisasi Belanja \(Rp\) \| Sisa Alokasi \(Rp\) \| % Penyerapan \|\n\|:--:\|:---------------------\|------------------:\|-----------------------:\|----------------------:\|:------------:\|\n\$\{seksiRows\}\n\| \*\*-\*\* \| \*\*TOTAL REALISASI\*\* \| \*\*\$\{formatRp\(totalPaguSeksi\)\}\*\* \| \*\*\$\{formatRp\(totalSpentSeksi\)\}\*\* \| \*\*\$\{formatRp\(totalSisaSeksi\)\}\*\* \| \*\*\$\{totalPctSeksi\}%\*\* \|`;/,
  `const seksiBudgetTableMarkdown = \`| No | Pos / Divisi | Alokasi Pagu (Rp) | Realisasi (Total) | Dari Kas Utama | Dari Kas Donasi | Sisa Alokasi (Rp) | % Penyerapan |
|:--:|:---------------------|------------------:|-----------------------:|-----------------------:|-----------------------:|----------------------:|:------------:|
\${seksiRows}
| **-** | **TOTAL REALISASI** | **\${formatRp(totalPaguSeksi)}** | **\${formatRp(totalSpentSeksi)}** | **\${formatRp(totalSpentSeksi - 2618000)}** | **\${formatRp(2618000)}** | **\${formatRp(totalSisaSeksi)}** | **\${totalPctSeksi}%** |\`;`
);

fs.writeFileSync('src/components/MonitoringView.tsx', code);
console.log("Fixed mock data");
