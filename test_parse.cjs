const fs = require('fs');

const code = fs.readFileSync('src/components/MonitoringView.tsx', 'utf-8');
const startIdx = code.indexOf('const generateLocalLPJ =');
const endIdx = code.indexOf('Laporan Pertanggungjawaban ini dibuat rangkap sebagai dokumentasi resmi dan arsip warga.`;', startIdx) + 91;

const funcStr = code.substring(startIdx, endIdx) + '\n};';

const script = `
  const formatRp = (val) => "Rp " + val;
  const useMockData = false;
  const namaRW = "RW 04";
  const namaKegiatan = "HUT";
  const tanggalLPJ = "17 Aug";
  const totalPemasukan = 0;
  const totalPengeluaran = 0;
  const saldoSisa = 0;
  const persenTugas = 0;
  const totalTasks = 0;
  const completedTasks = 0;
  const processingTasks = 0;
  const pendingTasks = 0;
  const rtRows = "";
  const totalTargetRT = 0;
  const totalCollectedRT = 0;
  const avgPctRT = 0;
  
  ${funcStr}
  
  const text = generateLocalLPJ('formal');
  const pages = text.split("---").map(p => p.trim()).filter(p => p.length > 0);
  console.log("TOTAL PAGES:", pages.length);
  pages.forEach((p, i) => console.log("PAGE", i, ":", p.substring(0, 50).replace(/\\n/g, ' ')));
`;

fs.writeFileSync('test_run.cjs', script);
