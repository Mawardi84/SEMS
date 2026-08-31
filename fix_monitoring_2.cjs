const fs = require('fs');
let code = fs.readFileSync('src/components/MonitoringView.tsx', 'utf-8');

// Replace seksiTableData map
const oldTableData = /const seksiTableData = seksiList\.map\(\(seksiName, idx\) => \{([\s\S]*?)return \{ idx: idx \+ 1, seksi: seksiName, pagu, spent, sisa, percent \};\n\s*\}\);/;

const newTableData = `const seksiTableData = seksiList.map((seksiName, idx) => {
                    let pagu = safeSettings.paguAnggaranSeksi[seksiName] || 0;
                    let spent = 0;
                    let spentUtama = 0;
                    let spentDonasi = 0;
                    
                    if (useMockData) {
                      // mock logic
                      spent = Math.round(pagu * 0.9);
                    } else {
                      const txs = keuangan.filter(t => t.type === 'Keluar' && matchTxToSeksi(t, seksiName));
                      spent = txs.reduce((sum, t) => sum + t.amount, 0);
                      spentUtama = txs.filter(t => !t.id || t.id.includes('-bu-')).reduce((sum, t) => sum + t.amount, 0);
                      spentDonasi = txs.filter(t => t.id && t.id.includes('-bd-')).reduce((sum, t) => sum + t.amount, 0);
                    }
                    const sisa = pagu - spent;
                    const percent = pagu > 0 ? Math.round((spent / pagu) * 100) : 0;
                    return { idx: idx + 1, seksi: seksiName, pagu, spent, spentUtama, spentDonasi, sisa, percent };
                  });`;

code = code.replace(oldTableData, newTableData);

// Now update the table render
const oldTableRender = /<th className="px-2 py-1\.5 text-right text-inherit">Realisasi<\/th>([\s\S]*?)<td className="px-2 py-1 text-right font-mono font-bold text-slate-800">\{formatRp\(row\.spent\)\}<\/td>/g;

const newTableRender = `<th className="px-2 py-1.5 text-right text-inherit">Realisasi (Total)</th>
                                          <th className="px-2 py-1.5 text-right text-inherit hidden md:table-cell">Kas Utama</th>
                                          <th className="px-2 py-1.5 text-right text-inherit hidden md:table-cell">Kas Donasi</th>$1<td className="px-2 py-1 text-right font-mono font-bold text-slate-800">{formatRp(row.spent)}</td>
                                            <td className="px-2 py-1 text-right font-mono text-[9px] text-slate-500 hidden md:table-cell">{formatRp(row.spentUtama || 0)}</td>
                                            <td className="px-2 py-1 text-right font-mono text-[9px] text-slate-500 hidden md:table-cell">{formatRp(row.spentDonasi || 0)}</td>`;

code = code.replace(
  /<th className="px-2 py-1\.5 text-right text-inherit">Realisasi<\/th>/,
  `<th className="px-2 py-1.5 text-right text-inherit">Realisasi (Total)</th>
                                          <th className="px-2 py-1.5 text-right text-inherit hidden md:table-cell">Dari Kas Utama</th>
                                          <th className="px-2 py-1.5 text-right text-inherit hidden md:table-cell">Dari Kas Donasi</th>`
);

code = code.replace(
  /<td className="px-2 py-1 text-right font-mono font-bold text-slate-800">\{formatRp\(row\.spent\)\}<\/td>/g,
  `<td className="px-2 py-1 text-right font-mono font-bold text-slate-800">{formatRp(row.spent)}</td>
                                            <td className="px-2 py-1 text-right font-mono text-[9px] text-slate-500 hidden md:table-cell">{formatRp(row.spentUtama || 0)}</td>
                                            <td className="px-2 py-1 text-right font-mono text-[9px] text-slate-500 hidden md:table-cell">{formatRp(row.spentDonasi || 0)}</td>`
);

fs.writeFileSync('src/components/MonitoringView.tsx', code);
console.log("Updated MonitoringView.tsx for Donasi Table");
