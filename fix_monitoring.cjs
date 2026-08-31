const fs = require('fs');
let code = fs.readFileSync('src/components/MonitoringView.tsx', 'utf-8');

const regex = /export const getPrimarySeksiForTx[\s\S]*?export const matchTxToSeksi = \(tx: any, targetSeksi: string\): boolean => {[\s\S]*?return normTarget === assigned;\n};/g;

code = code.replace(regex, `export const getPrimarySeksiForTx = (tx: any): string => {
  return tx.seksi || "Lain-lain";
};

export const matchTxToSeksi = (tx: any, targetSeksi: string): boolean => {
  const normTarget = targetSeksi.toLowerCase().replace(/^seksi\\s*/i, "").replace(/^divisi\\s*/i, "").trim();
  const assigned = getPrimarySeksiForTx(tx).toLowerCase().replace(/^seksi\\s*/i, "").replace(/^divisi\\s*/i, "").trim();
  return normTarget === assigned;
};`);

fs.writeFileSync('src/components/MonitoringView.tsx', code);
console.log("Fixed MonitoringView.tsx");
