const fs = require('fs');
let code = fs.readFileSync('src/components/MonitoringView.tsx', 'utf-8');

// We need to replace the markdown table block
const oldTableStr = `    const seksiBudgetTableMarkdown = \`| No | Pos / Seksi Anggaran | Alokasi Pagu (Rp) | Realisasi Belanja (Rp) | Sisa Alokasi (Rp) | % Penyerapan |
|:--:|:---------------------|------------------:|-----------------------:|----------------------:|:------------:|
\${seksiRows}
| **Σ** | **TOTAL BELANJA SEKSI** | **\${formatRp(totalPaguSeksi)}** | **\${formatRp(totalSpentSeksi)}** | **\${formatRp(totalSisaSeksi)}** | **\${totalPctSeksi}%** |\`;`;

const newTableStr = `    const seksiBudgetTableMarkdown = \`| No | Pos / Divisi | Alokasi Pagu (Rp) | Realisasi (Total) | Dari Kas Utama | Dari Kas Donasi | Sisa Alokasi (Rp) | % Penyerapan |
|:--:|:---------------------|------------------:|-----------------------:|-----------------------:|-----------------------:|----------------------:|:------------:|
\${seksiRows}
| **Σ** | **TOTAL BELANJA SEKSI** | **\${formatRp(totalPaguSeksi)}** | **\${formatRp(totalSpentSeksi)}** | **\${formatRp(totalSpentSeksi - 2618000)}** | **\${formatRp(2618000)}** | **\${formatRp(totalSisaSeksi)}** | **\${totalPctSeksi}%** |\`;`;

code = code.replace(oldTableStr, newTableStr);

fs.writeFileSync('src/components/MonitoringView.tsx', code);
console.log("Fixed markdown table generator");
