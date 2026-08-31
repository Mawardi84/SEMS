import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  Play, 
  Check, 
  RefreshCw, 
  Clipboard, 
  Download, 
  Users, 
  Info,
  Calendar,
  Layers,
  ArrowUpRight,
  ClipboardCheck,
  FileText,
  Printer,
  Palette,
  Type,
  Award,
  Sparkles,
  ShieldCheck,
  Upload,
  X,
  Image,
  Eye,
  FileCheck,
  UserCheck,
  Archive
} from "lucide-react";
import { 
  SeksiTask, 
  SystemSetting, 
  KeuanganTransaction, 
  Panitia,
  Kegiatan,
  BudgetChange,
  BudgetReallocation,
  Notulensi,
  AuditTrailRecord,
  RKBAItem,
  LPJMaster,
  LPJSection,
  LPJStatus
} from "../types";
import garudaBg from "../assets/images/garuda_cover_bg_1788103458041.jpg";
import { exportToPDF } from "../utils/pdfExport";
import { exportToWord } from "../utils/wordExport";
import { exportToPNG, exportToJPG, exportToPNGZip, exportToJPGZip } from "../utils/imageExport";
import { PDFPreviewModal } from "./PDFPreviewModal";
import OrgChart from "./OrgChart";
import LPJDeliveryPanel from "./LPJDeliveryPanel";
import LPJSpeechModal from "./LPJSpeechModal";
import LPJNotulenModal from "./LPJNotulenModal";
import DocumentPreviewRenderer from "./DocumentPreviewRenderer";

export const getPrimarySeksiForTx = (tx: any): string => {
  return tx.seksi || "Lain-lain";
};

export const matchTxToSeksi = (tx: any, targetSeksi: string): boolean => {
  const normTarget = targetSeksi.toLowerCase().replace(/^seksi\s*/i, "").replace(/^divisi\s*/i, "").trim();
  const assigned = getPrimarySeksiForTx(tx).toLowerCase().replace(/^seksi\s*/i, "").replace(/^divisi\s*/i, "").trim();
  return normTarget === assigned;
};

interface MonitoringViewProps {
  tasks: SeksiTask[];
  settings: SystemSetting;
  keuangan: KeuanganTransaction[];
  panitia: Panitia[];
  kegiatan?: Kegiatan[];
  budgetChanges?: BudgetChange[];
  budgetReallocations?: BudgetReallocation[];
  notulensi?: Notulensi[];
  auditTrails?: AuditTrailRecord[];
  rkba?: RKBAItem[];
  lpj?: LPJMaster;
  onToggleTaskStatus: (taskId: string) => Promise<void>;
  onUpdateLPJSection?: (sectionId: string, updates: Partial<LPJSection>, actor?: string, reason?: string) => Promise<any>;
  onUpdateLPJStatus?: (status: LPJStatus, actor?: string, notes?: string, isReconciled?: boolean, reconciliationNotes?: string) => Promise<any>;
  onSaveLPJ?: (lpj: any, actor?: string, reason?: string) => Promise<any>;
  onGenerateLPJNotulen?: (payload: any) => Promise<any>;
  onGenerateLPJSpeech?: () => Promise<any>;
  onNavigateView?: (view: string) => void;
}

export default function MonitoringView({
  tasks,
  settings,
  keuangan,
  panitia,
  kegiatan = [],
  budgetChanges = [],
  budgetReallocations = [],
  notulensi = [],
  auditTrails = [],
  rkba = [],
  lpj,
  onToggleTaskStatus,
  onUpdateLPJSection,
  onUpdateLPJStatus,
  onSaveLPJ,
  onGenerateLPJNotulen,
  onGenerateLPJSpeech,
  onNavigateView
}: MonitoringViewProps) {
  // Safety checks for props
  const safeSettings: SystemSetting = {
    id: settings?.id || "temp-id",
    rtList: settings?.rtList || [],
    seksiList: settings?.seksiList || [],
    targetIuranPerRT: settings?.targetIuranPerRT || 0,
    paguAnggaranSeksi: settings?.paguAnggaranSeksi || {},
    sheetId: settings?.sheetId || "",
    sheetApiKey: settings?.sheetApiKey || "",
    themeColor: settings?.themeColor || "#cc0000"
  };

  const [lpjMarkdown, setLpjMarkdown] = useState<string>("");
  const [showLPJConsole, setShowLPJConsole] = useState(false);
  const [consoleLog, setConsoleLog] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLPJ, setCopiedLPJ] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showSpeechModal, setShowSpeechModal] = useState(false);
  const [showNotulenModal, setShowNotulenModal] = useState(false);

  // Custom LPJ Template settings & inputs
  const [selectedTemplate, setSelectedTemplate] = useState<"formal" | "ringkas">("formal");
  const [namaRW, setNamaRW] = useState<string>("RW 04 Ngabean");
  const [namaKegiatan, setNamaKegiatan] = useState<string>("Peringatan HUT RI Ke-81");
  const [tanggalLPJ, setTanggalLPJ] = useState<string>("17 Agustus 2026");
  const [namaKetua, setNamaKetua] = useState<string>("");
  const [namaSekretaris, setNamaSekretaris] = useState<string>("");
  const [namaBendahara, setNamaBendahara] = useState<string>("");
  const [namaRWKetua, setNamaRWKetua] = useState<string>("");

  // Auto-fill panitia default names if empty
  useEffect(() => {
    if (panitia && panitia.length > 0) {
      if (!namaKetua) {
        const k = panitia.find((p) => p.role.toLowerCase().includes("ketua") && !p.role.toLowerCase().includes("rw"));
        if (k) setNamaKetua(k.name);
      }
      if (!namaSekretaris) {
        const s = panitia.find((p) => p.role.toLowerCase().includes("sekretaris"));
        if (s) setNamaSekretaris(s.name);
      }
      if (!namaBendahara) {
        const b = panitia.find((p) => p.role.toLowerCase().includes("bendahara"));
        if (b) setNamaBendahara(b.name);
      }
      if (!namaRWKetua) {
        const r = panitia.find((p) => p.role.toLowerCase().includes("rw") || p.role.toLowerCase().includes("pembina"));
        if (r) setNamaRWKetua(r.name);
      }
    }
  }, [panitia]);

  // Fallback names for rendering
  const displayKetua = namaKetua || panitia?.find((p) => p.role.toLowerCase().includes("ketua") && !p.role.toLowerCase().includes("rw"))?.name || "Muh Zaenun";
  const displaySekretaris = namaSekretaris || panitia?.find((p) => p.role.toLowerCase().includes("sekretaris"))?.name || "Mawardi";
  const displayBendahara = namaBendahara || panitia?.find((p) => p.role.toLowerCase().includes("bendahara"))?.name || "Dias Ayu";
  const displayRWKetua = namaRWKetua || panitia?.find((p) => p.role.toLowerCase().includes("rw") || p.role.toLowerCase().includes("pembina") || p.role.toLowerCase().includes("penanggung"))?.name || "Karto";

  // Custom LPJ Styling states
  const [paperTheme, setPaperTheme] = useState<"classic" | "creamy" | "minimal" | "green-gold">("classic");
  const [fontStyle, setFontStyle] = useState<"poppins" | "arial" | "mono">("poppins");
  const [showWatermark, setShowWatermark] = useState<boolean>(false);
  const [showStamp, setShowStamp] = useState<boolean>(false);

  // Logo HUT RI and offline fallback states
  const [eventLogo, setEventLogo] = useState<string>(() => {
    try {
      return localStorage.getItem("sems_lpj_logo") || "";
    } catch (e) {
      return "";
    }
  });
  const [useMockData, setUseMockData] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"monitoring" | "delivery">("monitoring");

  // 1. Compute RT Contributions
  const rtCollections = safeSettings.rtList.map((rtName) => {
    const directCollected = keuangan
      .filter((t) => t.type === "Masuk" && t.category === "Iuran RT" && (t.notes || "").toLowerCase().includes(rtName.toLowerCase()))
      .reduce((sum, t) => sum + t.amount, 0);

    // Cek apakah ter-cover oleh Dana Talangan Pamsimas (Rp 8.000.000 untuk 4 RT -> @ Rp 2.000.000 per RT)
    const hasTalangan = keuangan.some(
      (t) => t.type === "Masuk" && (
        t.category === "Dana Talangan / Pinjaman" || 
        (t.notes || "").toLowerCase().includes("talangan") || 
        (t.notes || "").toLowerCase().includes("pamsimas")
      )
    );
    const talanganPerRT = hasTalangan ? (safeSettings.targetIuranPerRT || 2000000) : 0;
    const collected = directCollected > 0 ? directCollected : talanganPerRT;

    const percent = Math.min(100, Math.round((collected / (safeSettings.targetIuranPerRT || 1)) * 100));

    let status = "Belum Mulai";
    let statusClass = "bg-slate-100 text-slate-500 border-slate-200";
    if (collected >= safeSettings.targetIuranPerRT) {
      status = directCollected > 0 ? "LUNAS" : "LUNAS (Talangan)";
      statusClass = "bg-emerald-100 text-emerald-700 border-emerald-200";
    } else if (collected > 0) {
      status = "Kurang";
      statusClass = "bg-amber-100 text-amber-700 border-amber-200";
    }

    return {
      name: rtName,
      collected,
      percent,
      status,
      statusClass,
      isTalangan: directCollected === 0 && talanganPerRT > 0
    };
  });

  const formatRp = (num: number) => {
    return "Rp " + num.toLocaleString("id-ID");
  };

  const generateLocalLPJ = (templateType: "formal" | "ringkas") => {
    // Math computations for the report
    const activePemasukan = keuangan
      .filter(t => t.type === 'Masuk')
      .reduce((sum, t) => sum + t.amount, 0);

    const activePengeluaran = keuangan
      .filter(t => t.type === 'Keluar')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPemasukan = useMockData ? 16500000 : activePemasukan;
    const totalPengeluaran = useMockData ? 12800000 : activePengeluaran;

    const saldoSisa = totalPemasukan - totalPengeluaran;

    const totalTasks = useMockData ? 18 : tasks.length;
    const completedTasks = useMockData ? 15 : tasks.filter(t => t.status === 'Selesai').length;
    const processingTasks = useMockData ? 2 : tasks.filter(t => t.status === 'Proses').length;
    const pendingTasks = useMockData ? 1 : tasks.filter(t => t.status === 'Belum').length;
    const persenTugas = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Detailed RT Collections output
    const rtCollectionsDetails = useMockData
      ? `- **RT 01 Ngabean:** Kas Tunai: Rp 4.500.000 (100% lunas)\n- **RT 02 Ngabean:** Kas Tunai: Rp 4.500.000 (100% lunas)\n- **RT 03 Ngabean:** Kas Tunai: Rp 3.000.000 (80% lunas)\n- **RT 04 Ngabean:** Kas Tunai: Rp 4.500.000 (100% lunas)`
      : rtCollections.map(rt => {
          return `- **${rt.name} ${namaRW.replace(/RW\s*\d+\s*/i, "")}:** Kas Tunai: ${formatRp(rt.collected)} (${rt.percent}% lunas)`;
        }).join("\n");

    // Detailed Tasks per Seksi output
    const seksiList = safeSettings.seksiList;
    const seksiTasksDetails = useMockData
      ? `- **Seksi Acara:** Menyelesaikan 3 dari 3 program kerja. (Pagu Maksimal: Rp 3.000.000)\n- **Seksi Perlengkapan:** Menyelesaikan 4 dari 4 program kerja. (Pagu Maksimal: Rp 4.000.000)\n- **Seksi Konsumsi:** Menyelesaikan 2 dari 2 program kerja. (Pagu Maksimal: Rp 5.000.000)\n- **Seksi Lomba:** Menyelesaikan 4 dari 5 program kerja. (Pagu Maksimal: Rp 2.000.000)`
      : seksiList.map(seksiName => {
          const seksiTasks = tasks.filter(t => t.seksi === seksiName);
          const done = seksiTasks.filter(t => t.status === 'Selesai').length;
          const total = seksiTasks.length;
          const pagu = safeSettings.paguAnggaranSeksi[seksiName] || 0;
          return `- **Seksi ${seksiName}:** Menyelesaikan ${done} dari ${total} program kerja. (Pagu Maksimal: ${formatRp(pagu)})`;
        }).join("\n");

    // Total sisa pagu
    const totalSisaPagu = Object.values(safeSettings.paguAnggaranSeksi).reduce((s,v) => s+v, 0) - totalPengeluaran;

    // Helper to determine if transaction is from Kas Donasi (Kas 2) or Kas Utama (Kas 1)
    const isKasDonasiTx = (t: { id?: string; proofNumber?: string; fundingSource?: string; category?: string }) => {
      const idLower = (t.id || "").toLowerCase();
      const proofUpper = (t.proofNumber || "").toUpperCase();
      const sourceLower = (t.fundingSource || "").toLowerCase();
      const categoryLower = (t.category || "").toLowerCase();
      return (
        idLower.includes("k2") ||
        idLower.includes("bd") ||
        idLower.includes("donasi") ||
        proofUpper.includes("BD") ||
        proofUpper.includes("DONASI") ||
        sourceLower.includes("donas") ||
        sourceLower.includes("sponsor") ||
        categoryLower.includes("donasi") ||
        categoryLower.includes("sponsor")
      );
    };

    // Laporan Realisasi Anggaran Seksi (Panitia) Table Markdown
    const seksiRows = seksiList.map((seksiName, idx) => {
      let pagu = safeSettings.paguAnggaranSeksi[seksiName] || 0;
      let spent = 0;
      let spentUtama = 0;
      let spentDonasi = 0;
      
      if (useMockData) {
        if (seksiName.includes("Sekretar") || seksiName.includes("BPH")) { pagu = 1050000; spent = 523000; spentUtama = 523000; spentDonasi = 0; }
        else if (seksiName.includes("Acara")) { pagu = 5300000; spent = 4909000; spentUtama = 3465000; spentDonasi = 1444000; }
        else if (seksiName.includes("Operasional") || seksiName.includes("Perlengkap")) { pagu = 11200000; spent = 7186000; spentUtama = 6012000; spentDonasi = 1174000; }
        else if (seksiName.includes("Humas") || seksiName.includes("Support")) { pagu = 0; spent = 0; spentUtama = 0; spentDonasi = 0; }
        else { spent = Math.round(pagu * 0.9); }
      } else {
        const txs = keuangan.filter(t => t.type === 'Keluar' && matchTxToSeksi(t, seksiName));
        spent = txs.reduce((sum, t) => sum + t.amount, 0);
        spentUtama = txs.filter(t => !isKasDonasiTx(t)).reduce((sum, t) => sum + t.amount, 0);
        spentDonasi = txs.filter(t => isKasDonasiTx(t)).reduce((sum, t) => sum + t.amount, 0);
      }
      const sisa = pagu - spent;
      const pct = pagu > 0 ? Math.round((spent / pagu) * 100) : 0;
      return `| ${idx + 1} | ${seksiName} | ${formatRp(pagu)} | ${formatRp(spent)} | ${formatRp(spentUtama)} | ${formatRp(spentDonasi)} | ${formatRp(sisa)} | ${pct}% |`;
    }).join("\n");

    const totalPaguSeksi = useMockData 
      ? 14000000 
      : Object.values(safeSettings.paguAnggaranSeksi).reduce((s, v) => s + v, 0);
    const totalSpentSeksi = totalPengeluaran;
    const totalSpentUtamaSeksi = useMockData ? 10000000 : keuangan.filter(t => t.type === 'Keluar' && !isKasDonasiTx(t)).reduce((s, t) => s + t.amount, 0);
    const totalSpentDonasiSeksi = useMockData ? 2618000 : keuangan.filter(t => t.type === 'Keluar' && isKasDonasiTx(t)).reduce((s, t) => s + t.amount, 0);
    const totalSisaSeksi = totalPaguSeksi - totalSpentSeksi;
    const totalPctSeksi = totalPaguSeksi > 0 ? Math.round((totalSpentSeksi / totalPaguSeksi) * 100) : 0;

    const seksiBudgetTableMarkdown = `| No | Pos / Divisi | Alokasi Pagu (Rp) | Realisasi (Total) | Dari Kas Utama | Dari Kas Donasi | Sisa Alokasi (Rp) | % Penyerapan |
|:--:|:---------------------|------------------:|-----------------------:|-----------------------:|-----------------------:|----------------------:|:------------:|
${seksiRows}
| **Σ** | **TOTAL BELANJA SEKSI** | **${formatRp(totalPaguSeksi)}** | **${formatRp(totalSpentSeksi)}** | **${formatRp(totalSpentUtamaSeksi)}** | **${formatRp(totalSpentDonasiSeksi)}** | **${formatRp(totalSisaSeksi)}** | **${totalPctSeksi}%** |`;

    // Detail Kontribusi Wilayah RT Table Markdown
    const rtRows = (useMockData
      ? [
          { name: "RT 01 Ngabean", target: 4500000, collected: 4500000, pct: 100 },
          { name: "RT 02 Ngabean", target: 4500000, collected: 4500000, pct: 100 },
          { name: "RT 03 Ngabean", target: 4500000, collected: 3000000, pct: 80 },
          { name: "RT 04 Ngabean", target: 4500000, collected: 4500000, pct: 100 },
        ]
      : rtCollections.map(rt => ({
          name: `${rt.name} ${namaRW.replace(/RW\s*\d+\s*/i, "")}`,
          target: safeSettings.targetIuranPerRT,
          collected: rt.collected,
          pct: rt.percent,
        }))
    ).map((rt, idx) => {
      return `| ${idx + 1} | ${rt.name} | ${formatRp(rt.target)} | ${formatRp(rt.collected)} | ${rt.pct}% |`;
    }).join("\n");

    const totalTargetRT = useMockData ? 18000000 : safeSettings.targetIuranPerRT * safeSettings.rtList.length;
    const totalCollectedRT = useMockData ? 16500000 : rtCollections.reduce((s, r) => s + r.collected, 0);
    const avgPctRT = totalTargetRT > 0 ? Math.round((totalCollectedRT / totalTargetRT) * 100) : 0;

    const rtContributionTableMarkdown = `| No | Wilayah RT | Target Pokok (Rp) | Iuran Tunai (Rp) | % Capaian |
|:--:|:-----------|------------------:|-----------------:|:---------:|
${rtRows}
| **Σ** | **TOTAL KONTRIBUSI** | **${formatRp(totalTargetRT)}** | **${formatRp(totalCollectedRT)}** | **${avgPctRT}%** |`;

    if (templateType === "ringkas") {
      return `# RINGKASAN EKSEKUTIF LAPORAN PERTANGGUNGJAWABAN (LPJ)
## DOKUMEN RINGKAS WARGA - KEGIATAN: ${namaKegiatan.toUpperCase()}
## ${namaRW.toUpperCase()} SEMARANG

Yth. Bapak/Ibu Warga ${namaRW},

Salam sejahtera untuk kita semua. Atas nama seluruh jajaran Panitia Pelaksana, kami mengucapkan terima kasih sebesar-besarnya atas kebersamaan, sumbangan iuran, waktu, serta tenaga yang melimpah dari seluruh warga dalam memeriahkan ${namaKegiatan}.

Berikut adalah ringkasan kilas balik keuangan dan progress kegiatan yang dapat kami laporkan secara terbuka:

### I. KILAS BALIK REALISASI KEUANGAN
1. Total Dana Masuk (Kas Tunai Warga & Donatur): ${formatRp(totalPemasukan)}
   - Iuran 4 RT (Talangan Pamsimas): Rp 8.000.000,00 (@ Rp 2.000.000/RT - SPJ nota telah diserahkan ke masing-masing RT)
   - Sumbangan Sukarela Murni Pamsimas: Rp 2.000.000,00
   - Sponsor & Donatur Warga Dermawan: Rp 4.000.000,00
2. Total Pengeluaran Kegiatan (Belanja Panitia): ${formatRp(totalPengeluaran)}
3. Sisa Saldo Kas Bersih Panitia: ${formatRp(saldoSisa)}

### II. CAPAIAN PROGRAM KERJA & TUGAS SEKSI
Kepanitiaan sukses merampungkan ${persenTugas}% dari total target kegiatan:
- Total Program Kerja: ${totalTasks} Agenda Kegiatan
- Selesai & Sukses: ${completedTasks} Agenda (Lomba anak-anak/dewasa, tirakatan malam HUT RI, jalan sehat & pentas seni)
- Dalam Proses/Evaluasi: ${processingTasks} Agenda
- Belum Terlaksana: ${pendingTasks} Agenda

### III. PERMOHONAN MAAF & UNGKAPAN TERIMA KASIH
**Permohonan Maaf:**
Panitia Pelaksana memohon maaf yang sebesar-besarnya dan setulus-tulusnya kepada seluruh warga, sesepuh, dan tokoh masyarakat atas segala kekurangan teknis atau keterbatasan fasilitas selama acara berlangsung.

**Ungkapan Terima Kasih:**
Terima kasih mendalam kami sampaikan kepada:
1. **Bapak Karto (Ketua RW 04 Ngabean)** & Pengurus RW atas bimbingan dan kepercayaan.
2. **Pengurus RT 01, RT 02, RT 03, dan RT 04 Ngabean** atas koordinasi dan gotong royong warga.
3. **Pengelola Pamsimas RW 04 Ngabean** atas bantuan likuiditas dana talangan dan donasi murni.
4. **Seluruh Sponsor Resmi & Donatur Dermawan** atas bantuan materiil dan doorprize.
5. **Tokoh Agama, Tokoh Masyarakat, Karang Taruna, PKK, serta Seluruh Warga RW 04 Ngabean** atas antusiasme guyub rukun.
6. **Seluruh Rekan Panitia Pelaksana** atas dedikasi dan kerja keras tanpa pamrih.

**Alokasi Sisa Kas Bersih:**
Sisa efisiensi dana kepanitiaan sebesar **Rp 1.382.000,00** (bersumber murni dari Kas Donatur/Sponsor) dialihfungsikan untuk kegiatan **Konsolidasi Internal dan Pembubaran Panitia** di luar lingkungan (ekskursi keakraban) guna melepas penat dan mempererat tali silaturahmi.

Semarang, ${tanggalLPJ}
Hormat Kami,

**PANITIA PELAKSANA PERINGATAN HUT RI KE-81**
**${namaRW.toUpperCase()} NGABEAN**`;
    }

    // Default: Formal - Standard Template (12-part structure)
    return `# LAPORAN PERTANGGUNGJAWABAN (LPJ)
## PANITIA PELAKSANA PERINGATAN HUT RI KE-81
## ${namaKegiatan.toUpperCase()}
## ${namaRW.toUpperCase()} KOTA SEMARANG

---

### HALAMAN JUDUL

**LAPORAN PERTANGGUNGJAWABAN (LPJ)**
**PELAKSANAAN KEGIATAN PERINGATAN HARI ULANG TAHUN KEMERDEKAAN REPUBLIK INDONESIA KE-81**

Diajukan oleh:
Panitia Pelaksana Peringatan HUT RI Ke-81
${namaRW}, Kecamatan Gunungpati, Kota Semarang

Sebagai wujud akuntabilitas, transparansi, dan dokumentasi sejarah atas pelaksanaan agenda sosial kemasyarakatan di tingkat wilayah.

---

### LEMBAR PENGESAHAN

Dokumen Laporan Pertanggungjawaban (LPJ) Peringatan Hari Ulang Tahun Kemerdekaan Republik Indonesia Ke-81 ini telah diperiksa, dievaluasi, dan disahkan oleh pengurus kepanitiaan serta pimpinan wilayah pada:

Hari/Tanggal: ${tanggalLPJ}
Tempat: Balai Warga ${namaRW}, Semarang

Dengan pengesahan ini, masa bakti kepanitiaan dinyatakan selesai dengan rasa hormat dan apresiasi yang setinggi-tingginya dari warga.

---

### KATA PENGANTAR

Puji syukur kehadirat Tuhan Yang Maha Esa, karena atas rahmat dan karunia-Nya seluruh rangkaian kegiatan peringatan Hari Ulang Tahun Kemerdekaan Republik Indonesia Ke-81 di wilayah ${namaRW} dapat terselenggara dengan lancar, tertib, dan penuh kemeriahan.

Laporan Pertanggungjawaban (LPJ) ini disusun sebagai bentuk transparansi dan tanggung jawab panitia pelaksana kepada seluruh warga, pengurus RW, serta para donatur yang telah memberikan dukungan moril maupun materiil. Kami menyadari bahwa kesuksesan rangkaian acara ini tidak lepas dari kerja keras panitia, partisipasi aktif warga, serta sinergi gotong royong yang luar biasa.

Kami menyampaikan permohonan maaf atas segala kekurangan selama persiapan hingga pelaksanaan kegiatan. Semoga laporan ini bermanfaat untuk kepanitiaan di masa mendatang.

Semarang, ${tanggalLPJ}
Panitia Pelaksana

---

### DAFTAR ISI

1. Sampul (Cover)
2. Halaman Judul
3. Lembar Pengesahan
4. Kata Pengantar
5. Daftar Isi
6. BAB I. PENDAHULUAN
7. BAB II. PERENCANAAN KEGIATAN
8. BAB III. PELAKSANAAN KEGIATAN
9. BAB IV. PERTANGGUNGJAWABAN KEUANGAN
10. BAB V. EVALUASI
11. BAB VI. PENUTUP
12. Lampiran

---

### BAB I. PENDAHULUAN

**1. Latar Belakang**
Hari Ulang Tahun Kemerdekaan Republik Indonesia merupakan momentum bersejarah yang wajib diperingati oleh seluruh warga negara sebagai wujud rasa syukur dan penghormatan terhadap jasa para pahlawan. Di tingkat wilayah ${namaRW} Ngabean, peringatan ini diselenggarakan untuk merajut kembali tali silaturahmi, membangkitkan rasa nasionalisme, serta memupuk semangat gotong royong dan kemandirian warga setelah sekian lama beraktivitas dalam kesibukan masing-masing.

**2. Dasar Kegiatan**
- Pancasila dan Undang-Undang Dasar Negara Republik Indonesia Tahun 1945.
- Hasil Keputusan Rapat Warga ${namaRW} Ngabean tentang Pembentukan Panitia HUT RI Ke-81.

**3. Tujuan Kegiatan**
- Mempererat tali silaturahmi dan kerukunan antar tetangga di lingkungan ${namaRW}.
- Menumbuhkan sportivitas, kreativitas, dan rasa percaya diri anak-anak serta remaja melalui berbagai perlombaan.
- Menjaga kelestarian tradisi gotong royong dan swadaya mandiri masyarakat perkotaan.

---

### BAB II. PERENCANAAN KEGIATAN

Perencanaan kegiatan dirancang secara matang melalui beberapa kali rapat koordinasi panitia. Perencanaan mencakup pembentukan susunan panitia, penyusunan jadwal kerja, serta pembagian pagu anggaran per seksi demi memastikan penggunaan dana yang efektif dan efisien.

**1. Struktur Kepanitiaan**
Struktur kepanitiaan dibentuk secara inklusif melibatkan unsur tokoh masyarakat, karang taruna, dan perwakilan warga dari setiap RT. Bagan alur koordinasi kepanitiaan disematkan di bawah ini.

**2. Jadwal & Program Kerja**
Setiap seksi pelaksana (Acara, Perlengkapan, Konsumsi, Lomba, Humas, Keamanan) memiliki target agenda masing-masing dengan alokasi anggaran terkontrol.

---

### BAB III. PELAKSANAAN KEGIATAN

Rangkaian kegiatan HUT RI Ke-81 di wilayah ${namaRW} Ngabean telah sukses dilaksanakan dengan partisipasi aktif yang sangat tinggi dari warga dari seluruh RT (RT 01 s.d. RT 04).

**1. Uraian Pelaksanaan Kegiatan**
Seluruh seksi pelaksana telah mengeksekusi program kerja dengan tingkat keberhasilan mencapai ${persenTugas}%. Beberapa agenda utama yang terlaksana meliputi:
- **Lomba Anak (01 Agustus s/d 16 Agustus 2026):** Berjalan meriah dengan berbagai perlombaan tradisional edukatif anak-anak.
- **Malam Tirakatan & Lomba Warga (16 Agustus 2026):** Berlangsung khidmat diisi dengan doa bersama dan pemotongan tumpeng. Kegiatan setelah Tirakatan meliputi: Lomba Ibu-ibu Tebak Gaya, Lomba Bapak-bapak Pukul Paku, dilanjutkan Lomba Remaja Estafet Sarung.
- **Jalan Sehat & Doorprize Warga (23 Agustus 2026 - Pagi/Siang):** Jalan sehat bersama dengan dihibur dengan Band Sendang Bunder, dilanjutkan dengan pembagian Hadiah Lomba Anak-anak, lalu acara inti pengundian doorprize jalan sehat.
- **Malam Puncak / Resepsi & Hiburan Dangdut (23 Agustus 2026 - Malam):** Masih pada tanggal yang sama yaitu 23 Agustus 2026 malamnya dilanjutkan dengan malam puncak / resepsi dengan menampilkan pentas seni tari dari anak-anak dilanjutkan acara utama hiburan dangdut solo organ.

**2. Status Capaian Kegiatan**
- Total Program Kerja: ${totalTasks} Agenda Kegiatan
- Selesai & Sukses: ${completedTasks} Agenda
- Dalam Proses/Evaluasi: ${processingTasks} Agenda
- Belum Terlaksana: ${pendingTasks} Agenda

---

### BAB IV. PERTANGGUNGJAWABAN KEUANGAN

Laporan keuangan ini disusun secara transparan dan akuntabel berdasarkan sistem pencatatan kas terintegrasi (Single Source of Truth). Seluruh pengeluaran seksi didukung oleh bukti belanja fisik yang sah.

**1. Ringkasan Posisi Kas Bersih**
- Total Pemasukan Kas Tunai: ${formatRp(totalPemasukan)} (Terdiri dari Dana Talangan 4 RT Rp 8.000.000, Sumbangan Pamsimas Rp 2.000.000, dan Sponsor/Donatur Rp 4.000.000)
- Total Realisasi Pengeluaran: ${formatRp(totalPengeluaran)}
- **Sisa Saldo Kas Akhir:** **${formatRp(saldoSisa)}** (Sisa efisiensi dana kepanitiaan sebesar Rp 1.382.000 bersumber dari Kas Donatur/Sponsor dialihfungsikan untuk kegiatan Konsolidasi Internal dan Pembubaran Panitia / ekskursi pembinaan keakraban di luar lingkungan)

**2. Pengelolaan & Struktur Penerimaan Kas (Pamsimas, RT, dan Sponsor/Donatur)**
Penerimaan kas sebesar Rp 14.000.000,00 terdistribusi secara akuntabel dalam 3 pilar:
1. **Dana Talangan 4 RT via Pamsimas (Rp 8.000.000,00):** Alokasi dana talangan kas muka operasional @ Rp 2.000.000,00 untuk RT 01 s.d. RT 04 yang dipinjamkan oleh Pamsimas RW 04 Ngabean saat awal pembentukan panitia.
   - **Mekanisme Pertanggungjawaban:** Panitia pelaksana **hanya menyerahkan fisik bundel SPJ / nota-nota bukti belanja riil sebesar Rp 2.000.000,00 per RT** kepada masing-masing pengurus RT (RT 01 s.d. RT 04).
   - **Mekanisme Pelunasan:** Pihak pengurus RT dari hasil penarikan iuran warganya yang **langsung mengembalikan dan menyetorkan pelunasan dana talangan tersebut kepada pengelola Pamsimas**.
   - Dengan demikian, kewajiban panitia terhadap dana talangan Pamsimas dinyatakan **LUNAS / TUNTAS 100%** melalui serah terima berkas nota belanja per RT.
2. **Sumbangan / Donasi Murni Pamsimas (Rp 2.000.000,00):** Merupakan sumbangan sukarela murni dari kas pengelola Pamsimas RW 04 untuk mendukung kesuksesan HUT RI Ke-81 RW 04 (hibah murni tanpa kewajiban pengembalian).
3. **Penerimaan Murni Sponsor & Donatur (Rp 4.000.000,00):** Merupakan penerimaan tunai dari sponsor resmi (Prettywear, Selo Agung, Apotek Gunungpati, BnD Shop, Ngrembel Asri, dll.) dan para donatur warga dermawan serta partisipasi swadaya simpatisan.

---

### BAB V. EVALUASI

Evaluasi dilakukan untuk mencatat kendala yang dihadapi selama pelaksanaan serta solusi yang diterapkan sebagai pembelajaran berharga bagi kepanitiaan di masa mendatang.

**1. Tantangan Administrasi dan Pengelolaan Keuangan**
- **Keterlambatan Serah Terima Nota Lapangan:** Banyaknya pengeluaran tak terduga berskala kecil saat hari-H (seperti pembelian es teh, solasi, tali id card dll) sering kali tidak langsung dilaporkan oleh seksi terkait. Hal ini memicu penumpukan nota di akhir acara dan menyebabkan perlunya rekonsiliasi ulang yang memakan waktu untuk menyamakan saldo riil di dompet dengan draf laporan di Excel.
- **Dinamika Relokasi Anggaran Dadakan:** Kondisi lapangan menuntut fleksibilitas tinggi, seperti keharusan merelokasi sisa dana sound system atau subsidi kas untuk menutupi kebutuhan spontan (misalnya penambahan hadiah lomba remaja, lomba bapak/ibu, dan kebutuhan make-up pentas seni tari anak).

**2. Kendala Koordinasi dan Komposisi Panitia**
- **In-efisiensi Struktur Kepanitiaan (Gemuk):** Komposisi panitia yang melibatkan terlalu banyak orang (seksi yang terlalu dipecah) justru memunculkan tantangan komunikasi dan memperlambat pengambilan keputusan. Selain itu, struktur yang besar berdampak langsung pada membengkaknya biaya operasional, khususnya alokasi konsumsi rapat dan konsumsi pekerja lapangan.
- **Beban Kerja Terpusat (Asimetris):** Meskipun jumlah personil kepanitiaan cukup banyak, pada eksekusi teknisnya (seperti pencarian doorprize, loading barang, hingga penyusunan LPJ), beban kerja terberat sering kali hanya bertumpu pada segelintir tim inti saja.

**3. Tantangan Logistik dan Operasional**
- **Manajemen Waktu Pengadaan Vendor:** Menyatukan jadwal vendor yang berbeda (panggung, tratak, dan sound system) membutuhkan pengawalan ekstra, terutama saat proses bongkar pasang agar tidak mengganggu rundown acara malam resepsi.
- **Swadaya Perlengkapan Ekstra:** Keterbatasan pagu anggaran awal membuat panitia harus mengandalkan swadaya atau subsidi silang untuk menutupi kebutuhan teknis kebersihan (seperti trashbag) dan kelengkapan pentas seni.

**4. Rekomendasi & Solusi untuk Tahun Depan**
- **Transisi ke Lean Structure (Kepanitiaan Ramping):** Memangkas jumlah panitia menjadi tim inti yang tangkas (9–11 orang). Divisi cukup disederhanakan menjadi BPH, Divisi Acara Terpadu, Divisi Operasional Lapangan, dan Support/Humas. Hal ini terbukti akan menekan biaya konsumsi panitia secara drastis dan mempercepat alur kerja.
- **Disiplin Sistem Reimbursement Satu Pintu:** Memberlakukan aturan ketat di mana setiap pengeluaran lapangan sekecil apa pun (tali, minum, selotip) harus segera diserahkan notanya kepada kesekretariatan maksimal 1x24 jam untuk langsung di-input ke dalam Buku Kas Harian.
- **Penebalan Dana Tak Terduga (Darurat):** Mengingat tingginya dinamika perubahan rundown atau penambahan kuota hadiah, pagu "Biaya Tak Terduga" di RAB tahun depan perlu dinaikkan persentasenya agar BPH tidak perlu terlalu sering melakukan subsidi silang antar-seksi.

---

### BAB VI. PENUTUP

Demikian Laporan Pertanggungjawaban (LPJ) Peringatan HUT Kemerdekaan Republik Indonesia Ke-81 di wilayah ${namaRW} Ngabean ini kami susun dengan sebenar-benarnya dan penuh rasa tanggung jawab. Keberhasilan seluruh rangkaian kegiatan ini merupakan bukti nyata bahwa semangat gotong royong, kebersamaan, dan persatuan warga tetap terjaga dengan sangat baik.

**Permohonan Maaf:**
Selaku Panitia Pelaksana, kami menyadari sepenuhnya bahwa dalam perencanaan, persiapan, maupun pelaksanaan kegiatan di lapangan masih terdapat berbagai kekurangan, keterbatasan fasilitas, serta kekhilafan baik teknis maupun non-teknis. Untuk itu, dengan segala kerendahan hati, kami menyampaikan **permohonan maaf yang sebesar-besarnya dan setulus-tulusnya** kepada seluruh warga, sesepuh, para tokoh masyarakat, donatur, serta para tamu undangan atas segala ketidaknyamanan yang mungkin terjadi.

**Ungkapan Terima Kasih & Penghargaan yang Setinggi-tingginya:**
Kami menyampaikan rasa terima kasih dan apresiasi yang tak terhingga kepada seluruh pihak yang telah memberikan kontribusi, dukungan, dan dedikasi luar biasa:
1. **Bapak Karto selaku Ketua ${namaRW} Ngabean beserta segenap Pengurus RW**, atas arahan, bimbingan, kebijakan, dan kepercayaan penuh yang senantiasa diberikan kepada kami.
2. **Bapak/Ibu Pengurus RT 01, RT 02, RT 03, dan RT 04 Ngabean**, atas kerja sama yang solid, koordinasi lapangan, penarikan swadaya iuran warga, serta pengawalan kegiatan dari awal hingga akhir.
3. **Pengelola Pamsimas RW 04 Ngabean**, atas bantuan likuiditas dana talangan operasional serta sumbangan donasi murni demi kelancaran kegiatan kemerdekaan.
4. **Seluruh Sponsor Resmi (Prettywear, Apotek Gunungpati, Selo Agung, BnD Shop, Ngrembel Asri, UMKM kuliner warga)** dan **Para Donatur Dermawan**, atas keikhlasan bantuan materil, dana tunai, maupun hadiah doorprize yang melimpah.
5. **Para Sesepuh, Tokoh Agama, Tokoh Masyarakat, Karang Taruna, Ibu-Ibu PKK, serta Seluruh Warga ${namaRW} Ngabean tanpa terkecuali**, atas partisipasi aktif, antusiasme, guyub rukun, dan kebersamaan yang menjadi nyawa utama perayaan kemerdekaan ini.
6. **Seluruh Rekan-Rekan Panitia Pelaksana**, yang telah mendharmabaktikan tenaga, waktu, pikiran, dan komitmen tanpa pamrih.

**Penetapan Akhir Masa Bakti & Alokasi Sisa Kas:**
Dengan diserahkannya laporan pertanggungjawaban ini, maka masa bakti Panitia Pelaksana Peringatan HUT RI Ke-81 secara resmi dinyatakan **SELESAI dan BERAKHIR**.

Adapun sisa efisiensi dana kepanitiaan sebesar **Rp 1.382.000,00** (yang bersumber murni dari Kas Donatur/Sponsor) disepakati dan dialihfungsikan untuk kegiatan **Konsolidasi Internal dan Pembubaran Panitia** di luar lingkungan (ekskursi/pembinaan keakraban). Agenda ini bertujuan untuk melepas penat setelah satu bulan penuh mencurahkan tenaga dalam menyukseskan acara kemerdekaan, sekaligus merawat tali silaturahmi dan solidaritas antar pemuda serta warga yang tergabung dalam kepanitiaan tahun ini.

Semoga kerukunan, kesehatan, dan kemakmuran senantiasa melimpahi seluruh warga ${namaRW} Ngabean. Merdeka!

Semarang, ${tanggalLPJ}

**PANITIA PELAKSANA PERINGATAN HUT RI KE-81**
**${namaRW.toUpperCase()} NGABEAN**

---

### LAMPIRAN

Sebagai dokumen pendukung pertanggungjawaban panitia, berikut dilampirkan berkas-berkas resmi:

- **Lampiran 1:** Buku Kas Umum (BKU) Penerimaan, Pengeluaran & Rekonsiliasi Kas
- **Lampiran 2:** Laporan Rekonsiliasi Pengembalian Dana Talangan Pamsimas & Realisasi Swadaya RT
- **Lampiran 3:** Dokumentasi Foto Kegiatan & Bundel Berkas Fisik Nota Belanja Panitia

Laporan Pertanggungjawaban ini dibuat rangkap sebagai dokumentasi resmi dan arsip warga.`;
  };

  const triggerLPJGeneration = async () => {
    setShowLPJConsole(true);
    setIsGenerating(true);
    setLpjMarkdown("");
    setConsoleLog([]);

    const logStep = (msg: string, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setConsoleLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
          resolve();
        }, delay);
      });
    };

    await logStep("Inisialisasi Pembuatan Laporan Pertanggungjawaban (LPJ)...", 150);
    await logStep("Menghubungkan ke basis data internal (Single Source of Truth)...", 200);
    await logStep("Mengagregasi pembukuan kas utama: menghitung pemasukan & pengeluaran...", 250);
    await logStep("Membaca kontribusi swadaya tunai RT untuk kalkulasi total efisiensi...", 200);
    await logStep("Menganalisis matriks progress program kerja dari seluruh seksi...", 250);
    await logStep("Melakukan komparasi realisasi anggaran terhadap pagu batas operasional...", 200);
    await logStep("Menyusun draf rekomendasi keberlanjutan kepanitiaan...", 150);

    const report = generateLocalLPJ(selectedTemplate);
    setLpjMarkdown(report);
    setIsGenerating(false);
    await logStep("Sukses! Dokumen LPJ otomatis telah berhasil dirumuskan.", 100);
  };

  const triggerAILPJGeneration = async () => {
    setShowLPJConsole(true);
    setIsGenerating(true);
    setLpjMarkdown("");
    setConsoleLog([]);

    const logStep = (msg: string, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setConsoleLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
          resolve();
        }, delay);
      });
    };

    try {
      await logStep("Menginisialisasi Mesin Kecerdasan Buatan Gemini AI...", 150);
      await logStep("Mengonsolidasikan basis data rill pembukuan keuangan dan progres progja...", 200);
      await logStep("Memetakan sumbangan swadaya iuran RT ke dalam variabel analisis...", 200);
      await logStep("Membangun konteks instruksi penulisan laporan profesional (Bahasa Indonesia)...", 150);
      await logStep("Mengirim muatan data rill ke model gemini-3.5-flash...", 250);

      const response = await fetch("/api/sems/generate-lpj-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateType: selectedTemplate,
          namaKegiatan,
          namaRW,
          tanggalLPJ,
          namaKetua,
          namaSekretaris,
          namaBendahara,
          namaRWKetua,
        }),
      });

      const data = await response.json();

      if (data.success && data.lpj) {
        setLpjMarkdown(data.lpj);
        await logStep("Analisis mendalam selesai! AI sukses menulis naskah LPJ yang kaya kosa kata.", 100);
      } else {
        throw new Error(data.error || "Gagal memproses draf LPJ dari AI.");
      }
    } catch (err: any) {
      console.error(err);
      await logStep(`⚠️ Warning: ${err.message || "Gagal berkomunikasi dengan server AI."}`, 100);
      await logStep("Mengaktifkan mode penulisan aman offline (Draf Lokal)...", 150);
      const report = generateLocalLPJ(selectedTemplate);
      setLpjMarkdown(report);
      await logStep("Sukses! Draf LPJ standar lokal berhasil dirumuskan sebagai cadangan.", 100);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLPJToClipboard = () => {
    if (!lpjMarkdown) return;
    navigator.clipboard.writeText(lpjMarkdown);
    setCopiedLPJ(true);
    setTimeout(() => setCopiedLPJ(false), 2000);
  };

  const [isExportingImage, setIsExportingImage] = useState(false);

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    await exportToPDF("document-preview-paper", `LPJ-${namaKegiatan.replace(/\s+/g, "-")}.pdf`);
    setIsExportingPDF(false);
  };

  const handleExportWord = async () => {
    if (!namaKegiatan) {
      alert("Mohon lengkapi data identitas proposal (Nama Kegiatan) sebelum export.");
      return;
    }
    await exportToWord("document-preview-paper", `LPJ-${namaKegiatan.replace(/\s+/g, "-")}`);
  };

  const handleExportPNG = async () => {
    setIsExportingImage(true);
    await exportToPNG("document-preview-paper", `LPJ-${namaKegiatan.replace(/\s+/g, "-")}.png`);
    setIsExportingImage(false);
  };

  const handleExportPNGZip = async () => {
    setIsExportingImage(true);
    await exportToPNGZip("document-preview-paper", `LPJ-${namaKegiatan.replace(/\s+/g, "-")}`);
    setIsExportingImage(false);
  };

  const handleExportJPG = async () => {
    setIsExportingImage(true);
    await exportToJPG("document-preview-paper", `LPJ-${namaKegiatan.replace(/\s+/g, "-")}.jpg`);
    setIsExportingImage(false);
  };

  const handleExportJPGZip = async () => {
    setIsExportingImage(true);
    await exportToJPGZip("document-preview-paper", `LPJ-${namaKegiatan.replace(/\s+/g, "-")}`);
    setIsExportingImage(false);
  };

  return (
    <>
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200 print:hidden">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
            <TrendingUp className="w-4 h-4 text-red-600" />
            Monitoring & Pelaporan
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Pantau rincian tugas seksi, tagihan iuran RT, serta formulasikan Laporan Pertanggungjawaban (LPJ).
          </p>
        </div>
      </div>

      <div className="flex space-x-1 border-b border-slate-200 print:hidden">
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'monitoring'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Progress & Penyusunan LPJ
        </button>
        <button
          onClick={() => setActiveTab('delivery')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'delivery'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Pengiriman LPJ Terpusat
        </button>
      </div>

      {activeTab === 'delivery' ? (
        <div className="relative">
          <LPJDeliveryPanel
            lpj={lpj}
            panitia={panitia}
            keuangan={keuangan}
            budgetChanges={budgetChanges}
            budgetReallocations={budgetReallocations}
            auditTrails={auditTrails}
            onUpdateSection={onUpdateLPJSection || (async () => {})}
            onUpdateStatus={onUpdateLPJStatus || (async () => {})}
            onOpenSpeechModal={() => setShowSpeechModal(true)}
            onOpenNotulenModal={() => setShowNotulenModal(true)}
            onNavigateView={onNavigateView}
          />

          {showSpeechModal && lpj && (
            <LPJSpeechModal
              isOpen={showSpeechModal}
              lpj={lpj}
              onClose={() => setShowSpeechModal(false)}
              onGenerateSpeech={onGenerateLPJSpeech || (async () => {})}
            />
          )}

          {showNotulenModal && lpj && (
            <LPJNotulenModal
              isOpen={showNotulenModal}
              lpj={lpj}
              onClose={() => setShowNotulenModal(false)}
              onGenerateNotulen={onGenerateLPJNotulen || (async () => {})}
            />
          )}
        </div>
      ) : (
        <>
          {/* Grid: Tasks & Iuran RT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Card Left: Seksi Tasks list */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="font-sans font-extrabold text-slate-800 text-xs uppercase tracking-wider">Progress Program Kerja (Tugas)</h3>
              <p className="text-[11px] text-slate-500">Klik status untuk mengubah progres (Belum &rarr; Proses &rarr; Selesai)</p>
            </div>
            <span className="text-[9px] text-slate-500 font-sans font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
              Total: {tasks.length} Program
            </span>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {tasks.map((task) => {
              let statusColor = "bg-slate-50 border-slate-200 text-slate-600";
              if (task.status === "Proses") statusColor = "bg-amber-50 border-amber-200 text-amber-700";
              else if (task.status === "Selesai") statusColor = "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold";

              return (
                <div 
                  key={task.id} 
                  className="p-2.5 border border-slate-200 bg-slate-50/10 hover:bg-white hover:shadow-xs rounded flex items-center justify-between gap-4 transition-all duration-150"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-red-700 bg-red-50 border border-red-100 px-1 py-0.2 rounded uppercase tracking-wide font-mono">
                        {task.seksi}
                      </span>
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">{task.taskName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[9px] text-slate-400 font-sans">
                      <span>PIC: <strong className="text-slate-600 font-medium">{task.assignedTo}</strong></span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Deadline: {task.deadline}</span>
                      </span>
                    </div>
                  </div>

                  {/* Toggleable Action pill */}
                  <button
                    id={`toggle-task-${task.id}`}
                    onClick={() => onToggleTaskStatus(task.id)}
                    className={`flex items-center gap-1 border px-2 py-1 rounded text-[9px] font-sans font-bold tracking-wide uppercase hover:opacity-85 shadow-2xs transition-all ${statusColor}`}
                  >
                    {task.status === "Selesai" ? (
                      <Check className="w-3 h-3 shrink-0 text-emerald-600" />
                    ) : (
                      <Clock className="w-3 h-3 shrink-0 text-amber-500 animate-pulse" />
                    )}
                    <span>{task.status}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card Right: Iuran RT Board */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-1">Papan Kontribusi Wilayah (RT)</h3>
            <p className="text-[11px] text-slate-500 mb-3">Laporan rincian setoran kas tunai per RT 01 - RT 07 Ngabean</p>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {rtCollections.map((rt) => (
                <div key={rt.name} className="p-2 bg-slate-50/50 rounded border border-slate-200 flex items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-800">{rt.name} Ngabean</span>
                      <span className="font-mono text-slate-500 font-bold">{formatRp(rt.collected)} / {formatRp(safeSettings.targetIuranPerRT)}</span>
                    </div>
                    <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${rt.percent}%` }}
                      />
                    </div>
                  </div>

                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${rt.statusClass}`}>
                    {rt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Ketentuan Target RT:</span>
            <span className="font-bold text-slate-700">Rp {safeSettings.targetIuranPerRT.toLocaleString("id-ID")} (Kas Tunai) / RT</span>
          </div>
        </div>

      </div>

      {/* LPJ Generator module */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-sans font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-red-600" />
              Penyusunan & Pengaturan Dokumen LPJ
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pilih dari berbagai template laporan formal dan sesuaikan data tanda tangan pengurus secara real-time.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value as any)}
              className="text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded px-3 py-2 bg-slate-50 font-bold text-slate-700"
            >
              <option value="formal">Template LPJ Resmi (Lengkap)</option>
              <option value="ringkas">Template LPJ Ringkas (Warga)</option>
            </select>
            <button
              id="btn-generate-lpj-ai"
              onClick={triggerAILPJGeneration}
              disabled={isGenerating}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-extrabold text-[11px] px-4 py-2 rounded shadow-md transition-all duration-150 border border-transparent uppercase tracking-wide disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {isGenerating ? (
                <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              )}
              {isGenerating ? "Menganalisis..." : "Generate dengan AI ✨"}
            </button>
            <button
              id="btn-generate-lpj-local"
              onClick={triggerLPJGeneration}
              disabled={isGenerating}
              className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] px-3.5 py-2 rounded border border-slate-200 uppercase tracking-wide disabled:opacity-50 shrink-0 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Draf Cepat
            </button>
          </div>
        </div>

        {/* Live Input Controls */}
        <div className="bg-slate-50 p-4 rounded border border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <h4 className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Sesuaikan Data Identitas LPJ (Live Update)</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Kegiatan</label>
              <input
                type="text"
                value={namaKegiatan}
                onChange={(e) => setNamaKegiatan(e.target.value)}
                className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-white font-medium"
                placeholder="Peringatan HUT RI Ke-81"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Wilayah / RW</label>
              <input
                type="text"
                value={namaRW}
                onChange={(e) => setNamaRW(e.target.value)}
                className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-white font-medium"
                placeholder="RW 04 Ngabean"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal Dokumen</label>
              <input
                type="text"
                value={tanggalLPJ}
                onChange={(e) => setTanggalLPJ(e.target.value)}
                className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-white font-medium"
                placeholder="17 Agustus 2026"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ketua Panitia</label>
              <input
                type="text"
                value={namaKetua}
                onChange={(e) => setNamaKetua(e.target.value)}
                className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-white font-medium"
                placeholder="Ketik nama Ketua Panitia..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 pt-1">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sekretaris</label>
              <input
                type="text"
                value={namaSekretaris}
                onChange={(e) => setNamaSekretaris(e.target.value)}
                className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-white font-medium"
                placeholder="Ketik nama Sekretaris..."
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bendahara</label>
              <input
                type="text"
                value={namaBendahara}
                onChange={(e) => setNamaBendahara(e.target.value)}
                className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-white font-medium"
                placeholder="Ketik nama Bendahara..."
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ketua RW</label>
              <input
                type="text"
                value={namaRWKetua}
                onChange={(e) => setNamaRWKetua(e.target.value)}
                className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-white font-medium"
                placeholder="Ketik nama Ketua RW..."
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mode Data Dokumen</label>
              <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded border border-slate-200">
                <input
                  type="checkbox"
                  id="toggle-use-mock-data"
                  checked={useMockData}
                  onChange={(e) => {
                    setUseMockData(e.target.checked);
                    // Automatically trigger draf update
                    setTimeout(() => {
                      const btn = document.getElementById("btn-generate-lpj-local");
                      if (btn) btn.click();
                    }, 50);
                  }}
                  className="rounded accent-red-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                />
                <label htmlFor="toggle-use-mock-data" className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider cursor-pointer flex items-center gap-1 select-none">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Simulasi Mockup Offline
                </label>
              </div>
            </div>
          </div>

          {/* Logo Upload Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200/60">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Unggah Logo HUT RI / Event</label>
              <div className="flex items-center gap-3 bg-white p-2.5 rounded border border-slate-200 shadow-3xs">
                {eventLogo ? (
                  <div className="relative w-12 h-12 border border-slate-100 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 group">
                    <img src={eventLogo} alt="Logo HUT RI" className="max-w-full max-h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => {
                        setEventLogo("");
                        try { localStorage.removeItem("sems_lpj_logo"); } catch (e) {}
                      }}
                      className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer text-[8px] font-bold uppercase"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-12 h-12 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <Image className="w-4.5 h-4.5 text-slate-400" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    id="logo-upload-input"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const base64 = event.target?.result as string;
                          setEventLogo(base64);
                          try { localStorage.setItem("sems_lpj_logo", base64); } catch (e) {}
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="logo-upload-input"
                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] px-2.5 py-1.5 rounded border border-slate-200 cursor-pointer transition-colors uppercase tracking-wider shadow-2xs"
                  >
                    <Upload className="w-3 h-3 text-slate-500" />
                    Pilih Gambar
                  </label>
                  <p className="text-[8px] text-slate-400 mt-1">Format JPG/PNG, maks 1MB. Tampil di sisi kanan Kop Surat.</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-start text-[9.5px] text-slate-500 bg-amber-50/40 p-2.5 rounded border border-amber-100/50">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mr-2" />
              <span className="leading-snug">
                <strong>Visual Tip:</strong> Gunakan opsi <strong>Simulasi Mockup Offline</strong> apabila tidak ada koneksi internet atau data pembukuan masih kosong. Sistem akan seketika menyusun naskah LPJ lengkap menggunakan data demo berkualitas tinggi.
              </span>
            </div>
          </div>
        </div>

        {/* Console loading terminal or LPJ output */}
        {showLPJConsole && (
          <div className="space-y-4 print:space-y-0 print:border-none print:shadow-none">
            
            {/* Terminal screen if loading */}
            {isGenerating && (
              <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-[9px] text-emerald-400 space-y-1.5 max-h-48 overflow-y-auto">
                {consoleLog.map((log, idx) => (
                  <div key={idx} className="animate-fade-in">{log}</div>
                ))}
                <div className="flex items-center gap-1 text-slate-400">
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                  <span>Sedang merumuskan draf LPJ berbasis pembukuan waktu nyata...</span>
                </div>
              </div>
            )}

            {/* Markdown Display if ready */}
            {lpjMarkdown && !isGenerating && {
              // Helper components inside the render cycle
              ...(() => {
                const getPaperClass = () => {
                  let base = "relative p-8 sm:p-14 shadow-md max-w-[813px] min-h-[1247px] mx-auto select-text overflow-hidden transition-all duration-300 z-10 break-after-page flex flex-col justify-between print:min-h-0 print:max-w-none print:mx-0 print:shadow-none print:border-none print:mb-0 print:break-after-page ";
                  
                  if (paperTheme === "classic") {
                    base += "bg-white border-t-[8px] border-t-red-600 border border-slate-200 text-slate-900";
                  } else if (paperTheme === "creamy") {
                    base += "bg-[#FCF9F2] border-t-[8px] border-t-amber-800 border border-amber-900/15 text-stone-900";
                  } else if (paperTheme === "minimal") {
                    base += "bg-slate-50 border-t-[8px] border-t-slate-800 border border-slate-300 text-slate-900";
                  } else if (paperTheme === "green-gold") {
                    base += "bg-emerald-50/10 border-4 border-double border-emerald-600 text-emerald-950";
                  }
                  
                  if (fontStyle === "poppins") {
                    base += " font-poppins text-[11px] sm:text-[12px] tracking-wide leading-relaxed";
                  } else if (fontStyle === "arial") {
                    base += " font-arial text-[11px] sm:text-[12px] tracking-normal leading-relaxed";
                  } else if (fontStyle === "mono") {
                    base += " font-mono text-[10px] sm:text-[11px] tracking-tight leading-normal";
                  }
                  
                  return base;
                };

                const renderRightLogoAndDivider = (dividerColorClass: string = "border-slate-300") => {
                  return (
                    <div className={`flex items-center shrink-0 pl-3 ml-3 border-l-2 ${dividerColorClass} h-12`}>
                      {eventLogo ? (
                        <img src={eventLogo} alt="Logo Event" className="w-12 h-12 object-contain" />
                      ) : (
                        /* Beautiful default fallback logo HUT RI 81 */
                        <div className="w-11 h-11 rounded border border-red-200 bg-red-50 flex flex-col items-center justify-center text-red-600 font-extrabold select-none p-0.5 leading-none shadow-3xs shrink-0">
                          <span className="text-[7.5px] font-serif font-black tracking-tighter uppercase">HUT RI</span>
                          <span className="text-xs font-sans font-black tracking-tighter mt-0.5">81</span>
                        </div>
                      )}
                    </div>
                  );
                };

                const renderLetterhead = () => {
                  if (paperTheme === "classic") {
                    return (
                      <div className="flex justify-between items-center border-b-[4px] border-double border-red-800 pb-4 mb-8 bg-red-50/30 p-4 rounded-t-lg">
                        <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                          {eventLogo ? <img src={eventLogo} alt="Logo Event" className="w-full h-full object-contain" /> : <div className="w-full h-full bg-red-100 rounded-full flex items-center justify-center text-red-700 font-black">HUT</div>}
                        </div>
                        <div className="text-center flex-1 px-4">
                          <h2 className="text-[14px] sm:text-lg font-black tracking-wider uppercase font-serif text-red-950">{namaKegiatan}</h2>
                          <h3 className="text-[11px] sm:text-sm font-bold uppercase font-serif text-red-800 mt-1">{namaRW.toUpperCase()}</h3>
                          <p className="text-[9px] sm:text-[10px] text-slate-600 font-sans mt-1">Sekretariat: RT 04 Ngabean, Kota Semarang, Jawa Tengah</p>
                        </div>
                        <div className="w-16 h-16 shrink-0" />
                      </div>
                    );
                  }
                  
                  if (paperTheme === "creamy") {
                    return (
                      <div className="flex justify-between items-center border-b-[2px] border-amber-900/40 pb-4 mb-8">
                        <div className="w-16 h-16 shrink-0">
                          {eventLogo && <img src={eventLogo} alt="Logo Event" className="w-full h-full object-contain" />}
                        </div>
                        <div className="text-center flex-1 px-3">
                          <h2 className="text-[13px] sm:text-base font-black tracking-widest uppercase font-serif text-amber-950">{namaKegiatan}</h2>
                          <h3 className="text-[10px] sm:text-xs font-bold uppercase font-serif text-amber-900 mt-1">{namaRW.toUpperCase()}</h3>
                          <div className="w-1/3 h-[1px] bg-amber-900/30 mx-auto mt-2" />
                        </div>
                        <div className="w-16 h-16 shrink-0" />
                      </div>
                    );
                  }
                  
                  if (paperTheme === "minimal") {
                    return (
                      <div className="flex justify-between items-start border-b border-slate-300 pb-6 mb-8">
                        <div className="text-left flex-1">
                          <h2 className="text-base sm:text-xl font-black tracking-tight text-slate-950 uppercase font-sans">{namaKegiatan}</h2>
                          <h3 className="text-[11px] sm:text-xs font-bold text-slate-700 font-sans uppercase tracking-widest mt-1">{namaRW} Ngabean, Semarang</h3>
                        </div>
                        {renderRightLogoAndDivider("border-slate-300")}
                      </div>
                    );
                  }

                  return (
                    <div className="flex justify-between items-center border-b-2 border-emerald-700 pb-4 mb-8 bg-emerald-50/20 p-4 rounded-lg">
                      <div className="w-14 h-14 shrink-0">
                        {eventLogo && <img src={eventLogo} alt="Logo Event" className="w-full h-full object-contain" />}
                      </div>
                      <div className="text-center flex-1 px-3">
                        <h2 className="text-[13px] sm:text-base font-extrabold tracking-wider uppercase text-emerald-950">{namaKegiatan}</h2>
                        <h3 className="text-[10px] sm:text-xs font-bold uppercase text-emerald-800 mt-1">{namaRW.toUpperCase()}</h3>
                      </div>
                      <div className="w-14 h-14 shrink-0" />
                    </div>
                  );
                };

                const renderSignatureGrid = () => {
                  return (
                    <div className="mt-10 pt-8 border-t border-slate-200/50 space-y-6">
                      <div className="text-right text-[10.5px] font-medium text-slate-700 pr-10">
                        Semarang, {tanggalLPJ}
                      </div>
                      <div className="grid grid-cols-2 gap-y-10 text-center text-slate-900">
                        {/* Row 1 */}
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Ketua Panitia Pelaksana</p>
                          <div className="h-14 flex items-center justify-center relative">
                            {showStamp && (
                              <span className="font-serif italic text-sm text-blue-700/80 tracking-widest font-bold rotate-[-3deg] select-none">
                                {displayKetua}
                              </span>
                            )}
                          </div>
                          <p className="font-bold underline text-[11px] text-slate-800">{displayKetua}</p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Sekretaris Panitia</p>
                          <div className="h-14 flex items-center justify-center relative">
                            {showStamp && (
                              <span className="font-serif italic text-sm text-slate-500/80 tracking-widest font-bold rotate-[2deg] select-none">
                                {displaySekretaris}
                              </span>
                            )}
                          </div>
                          <p className="font-bold underline text-[11px] text-slate-800">{displaySekretaris}</p>
                        </div>

                        {/* Row 2 */}
                        <div className="space-y-1 relative">
                          <p className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Bendahara Keuangan</p>
                          <div className="h-14 flex items-center justify-center relative z-10">
                            {showStamp && (
                              <span className="font-serif italic text-sm text-emerald-700/80 tracking-widest font-bold rotate-[-1deg] select-none">
                                {displayBendahara}
                              </span>
                            )}
                          </div>
                          <p className="font-bold underline text-[11px] text-slate-800">{displayBendahara}</p>
                        </div>

                        <div className="space-y-1 relative">
                          <p className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Mengetahui, Ketua RW</p>
                          <div className="h-14 flex items-center justify-center relative">
                            {/* The circular stamp/seal */}
                            {showStamp && (
                              <>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-dashed border-indigo-600/60 flex items-center justify-center rotate-[-12deg] pointer-events-none select-none z-0 shadow-xs">
                                  {settings?.stempelUrl ? (
                                    <img src={settings.stempelUrl} alt="Stempel" className="w-full h-full object-contain opacity-80" />
                                  ) : (
                                    <div className="w-[72px] h-[72px] rounded-full border border-double border-indigo-600/50 flex flex-col items-center justify-center text-[5px] font-sans font-bold text-indigo-600/70 text-center leading-none">
                                      <span className="uppercase text-[4px]">PANITIA HUT-RI</span>
                                      <Award className="w-3.5 h-3.5 text-indigo-600/80 my-0.5" />
                                      <span className="uppercase text-[4.5px] tracking-tight">{namaRW.toUpperCase()} NGABEAN</span>
                                    </div>
                                  )}
                                </div>
                                <span className="font-serif italic text-sm text-indigo-800/80 tracking-widest font-bold rotate-[1deg] relative z-10 select-none">
                                  {displayRWKetua}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="font-bold underline text-[11px] text-slate-800">{displayRWKetua}</p>
                        </div>
                      </div>
                    </div>
                  );
                };

                const renderPaperContent = () => {
                  let mainBodyText = lpjMarkdown || generateLocalLPJ(selectedTemplate);

                  const cleanNamaRW = namaRW.includes("Ngabean") ? namaRW : `${namaRW} Ngabean`;
                  const penutupFormal = `### BAB VI. PENUTUP

Demikian Laporan Pertanggungjawaban (LPJ) Peringatan HUT Kemerdekaan Republik Indonesia Ke-81 di wilayah ${cleanNamaRW} ini kami susun dengan sebenar-benarnya dan penuh rasa tanggung jawab. Keberhasilan seluruh rangkaian kegiatan ini merupakan bukti nyata bahwa semangat gotong royong, kebersamaan, dan persatuan warga tetap terjaga dengan sangat baik.

**Permohonan Maaf:**
Selaku Panitia Pelaksana, kami menyadari sepenuhnya bahwa dalam perencanaan, persiapan, maupun pelaksanaan kegiatan di lapangan masih terdapat berbagai kekurangan, keterbatasan fasilitas, serta kekhilafan baik teknis maupun non-teknis. Untuk itu, dengan segala kerendahan hati, kami menyampaikan **permohonan maaf yang sebesar-besarnya dan setulus-tulusnya** kepada seluruh warga, sesepuh, para tokoh masyarakat, donatur, serta para tamu undangan atas segala ketidaknyamanan yang mungkin terjadi.

**Ungkapan Terima Kasih & Penghargaan yang Setinggi-tingginya:**
Kami menyampaikan rasa terima kasih dan apresiasi yang tak terhingga kepada seluruh pihak yang telah memberikan kontribusi, dukungan, dan dedikasi luar biasa:
1. **Bapak Karto selaku Ketua ${cleanNamaRW} beserta segenap Pengurus RW**, atas arahan, bimbingan, kebijakan, dan kepercayaan penuh yang senantiasa diberikan kepada kami.
2. **Bapak/Ibu Pengurus RT 01, RT 02, RT 03, dan RT 04 Ngabean**, atas kerja sama yang solid, koordinasi lapangan, penarikan swadaya iuran warga, serta pengawalan kegiatan dari awal hingga akhir.
3. **Pengelola Pamsimas RW 04 Ngabean**, atas bantuan likuiditas dana talangan operasional serta sumbangan donasi murni demi kelancaran kegiatan kemerdekaan.
4. **Seluruh Sponsor Resmi (Prettywear, Apotek Gunungpati, Selo Agung, BnD Shop, Ngrembel Asri, UMKM kuliner warga)** dan **Para Donatur Dermawan**, atas keikhlasan bantuan materil, dana tunai, maupun hadiah doorprize yang melimpah.
5. **Para Sesepuh, Tokoh Agama, Tokoh Masyarakat, Karang Taruna, Ibu-Ibu PKK, serta Seluruh Warga ${cleanNamaRW} tanpa terkecuali**, atas partisipasi aktif, antusiasme, guyub rukun, dan kebersamaan yang menjadi nyawa utama perayaan kemerdekaan ini.
6. **Seluruh Rekan-Rekan Panitia Pelaksana**, yang telah mendharmabaktikan tenaga, waktu, pikiran, dan komitmen tanpa pamrih.

**Penetapan Akhir Masa Bakti & Alokasi Sisa Kas:**
Dengan diserahkannya laporan pertanggungjawaban ini, maka masa bakti Panitia Pelaksana Peringatan HUT RI Ke-81 secara resmi dinyatakan **SELESAI dan BERAKHIR**.

Adapun sisa efisiensi dana kepanitiaan sebesar **Rp 1.382.000,00** (yang bersumber murni dari Kas Donatur/Sponsor) disepakati dan dialihfungsikan untuk kegiatan **Konsolidasi Internal dan Pembubaran Panitia** di luar lingkungan (ekskursi/pembinaan keakraban). Agenda ini bertujuan untuk melepas penat setelah satu bulan penuh mencurahkan tenaga dalam menyukseskan acara kemerdekaan, sekaligus merawat tali silaturahmi dan solidaritas antar pemuda serta warga yang tergabung dalam kepanitiaan tahun ini.

Semoga kerukunan, kesehatan, dan kemakmuran senantiasa melimpahi seluruh warga ${cleanNamaRW}. Merdeka!`;

                  const lampiranFormal = `### LAMPIRAN

Sebagai dokumen pendukung pertanggungjawaban panitia, berikut dilampirkan 3 berkas resmi:

- **Lampiran 1:** Buku Kas Umum (BKU) Penerimaan & Pengeluaran Kas
- **Lampiran 2:** Laporan Rekonsiliasi Pengembalian Dana Talangan Pamsimas & Realisasi Swadaya RT
- **Lampiran 3:** Dokumentasi Foto Kegiatan & Berkas Fisik Nota Belanja Panitia

Laporan Pertanggungjawaban ini dibuat rangkap sebagai dokumentasi resmi dan arsip warga.`;

                  // Guarantee that Formal template always contains full BAB VI Penutup and Lampiran
                  if (selectedTemplate === "formal") {
                    if (mainBodyText.includes("BAB VI") || mainBodyText.includes("PENUTUP")) {
                      if (!mainBodyText.includes("Permohonan Maaf") || !mainBodyText.includes("Ungkapan Terima Kasih") || !mainBodyText.includes("Bapak Karto") || !mainBodyText.includes("1.382.000")) {
                        const cutIdx = mainBodyText.indexOf("### BAB VI") !== -1 ? mainBodyText.indexOf("### BAB VI") : mainBodyText.indexOf("BAB VI");
                        if (cutIdx !== -1) {
                          mainBodyText = mainBodyText.substring(0, cutIdx).trim() + `\n\n---\n\n` + penutupFormal + `\n\n---\n\n` + lampiranFormal;
                        } else {
                          mainBodyText += `\n\n---\n\n` + penutupFormal + `\n\n---\n\n` + lampiranFormal;
                        }
                      } else if (!mainBodyText.includes("LAMPIRAN") && !mainBodyText.includes("Lampiran 1")) {
                        mainBodyText += `\n\n---\n\n` + lampiranFormal;
                      }
                    } else {
                      mainBodyText += `\n\n---\n\n` + penutupFormal + `\n\n---\n\n` + lampiranFormal;
                    }
                  }

                  const activePemasukan = keuangan
                    .filter(t => t.type === 'Masuk')
                    .reduce((sum, t) => sum + t.amount, 0);

                  const activeNatura = 0;

                  const activePengeluaran = keuangan
                    .filter(t => t.type === 'Keluar')
                    .reduce((sum, t) => sum + t.amount, 0);

                  const totalPemasukan = useMockData ? 16500000 : activePemasukan;
                  const totalNatura = 0;
                  const totalPengeluaran = useMockData ? 12800000 : activePengeluaran;
                  const saldoSisa = totalPemasukan - totalPengeluaran;
                  const totalCombinedValue = totalPemasukan + totalNatura;

                  // Percentage calculations
                  const percentPemasukan = totalCombinedValue > 0 ? Math.round((totalPemasukan / totalCombinedValue) * 100) : 0;
                  const percentNatura = totalCombinedValue > 0 ? Math.round((totalNatura / totalCombinedValue) * 100) : 0;
                  const percentPengeluaran = totalPemasukan > 0 ? Math.round((totalPengeluaran / totalPemasukan) * 100) : 0;

                  // Get theme-specific visual assets
                  const theme = (() => {
                    if (paperTheme === "classic") {
                      return {
                        bg: "bg-red-50/40 border-red-200/60",
                        badge: "bg-red-100 text-red-800 border-red-200",
                        bar1: "bg-red-600",
                        bar2: "bg-amber-500",
                        bar3: "bg-red-600",
                        textAccent: "text-red-800",
                        thBg: "bg-red-700 text-white",
                        thBorder: "border-red-800/20",
                        stripeBg: "even:bg-red-50/15",
                        sumBg: "bg-red-50/90 text-red-950",
                        sumBorder: "border-t-2 border-red-300",
                        tableBorder: "border-red-200/80"
                      };
                    }
                    if (paperTheme === "creamy") {
                      return {
                        bg: "bg-amber-50/50 border-amber-900/10",
                        badge: "bg-amber-100 text-amber-900 border-amber-900/20",
                        bar1: "bg-amber-800",
                        bar2: "bg-amber-500",
                        bar3: "bg-amber-800",
                        textAccent: "text-amber-900",
                        thBg: "bg-amber-900 text-amber-50",
                        thBorder: "border-amber-950/20",
                        stripeBg: "even:bg-amber-50/15",
                        sumBg: "bg-amber-100/60 text-amber-950",
                        sumBorder: "border-t-2 border-amber-800/40",
                        tableBorder: "border-amber-900/10"
                      };
                    }
                    if (paperTheme === "minimal") {
                      return {
                        bg: "bg-slate-100/60 border-slate-200",
                        badge: "bg-slate-200 text-slate-800 border-slate-300",
                        bar1: "bg-slate-800",
                        bar2: "bg-slate-400",
                        bar3: "bg-slate-800",
                        textAccent: "text-slate-800",
                        thBg: "bg-slate-900 text-slate-100",
                        thBorder: "border-slate-950/20",
                        stripeBg: "even:bg-slate-100/30",
                        sumBg: "bg-slate-100 text-slate-950",
                        sumBorder: "border-t-2 border-slate-400",
                        tableBorder: "border-slate-300"
                      };
                    }
                    // green-gold
                    return {
                      bg: "bg-emerald-50/50 border-emerald-200/55",
                      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
                      bar1: "bg-emerald-600",
                      bar2: "bg-emerald-400",
                      bar3: "bg-emerald-700",
                      textAccent: "text-emerald-950",
                      thBg: "bg-emerald-800 text-white",
                      thBorder: "border-emerald-900/20",
                      stripeBg: "even:bg-emerald-50/15",
                      sumBg: "bg-emerald-50/90 text-emerald-950",
                      sumBorder: "border-t-2 border-emerald-300",
                      tableBorder: "border-emerald-200"
                    };
                  })();

                  // Clean markdown parsing & rendering helper to strip raw stars and hashes
                  const renderCleanText = (text: string) => {
                    if (!text) return "";
                    // Regex split for **bold text**
                    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
                    return parts.map((part, index) => {
                      if (index % 2 === 1) {
                        return <strong key={index} className="font-extrabold text-slate-950">{part.replace(/[*#]/g, "")}</strong>;
                      }
                      return part.replace(/[*#]/g, "");
                    });
                  };

                  const renderMarkdownCleanly = (markdownText: string) => {
                    if (!markdownText) return null;

                    if (markdownText.includes("### DAFTAR ISI") || markdownText.includes("DAFTAR ISI")) {
                      return (
                        <div key="toc-custom" className="space-y-4 my-2 font-sans">
                          <div className="bg-red-700 text-white px-3.5 py-2.5 rounded-md mb-4 flex items-center justify-between shadow-xs">
                            <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase font-sans flex items-center gap-2 text-white">
                              <span className="w-2 h-4 bg-amber-400 rounded-xs inline-block shrink-0" />
                              DAFTAR ISI LAPORAN PERTANGGUNGJAWABAN
                            </h3>
                            <span className="text-[8.5px] font-mono font-bold uppercase bg-red-900/90 text-amber-300 px-2.5 py-0.5 rounded border border-red-500/60 shrink-0">
                              Struktur Dokumen Formal
                            </span>
                          </div>

                          <div className="space-y-2.5 px-1 sm:px-2">
                            {[
                              { no: 1, title: "Sampul Utama (Cover)", page: 1 },
                              { no: 2, title: "Halaman Judul", page: 2 },
                              { no: 3, title: "Lembar Pengesahan", page: 3 },
                              { no: 4, title: "Kata Pengantar", page: 4 },
                              { no: 5, title: "Daftar Isi", page: 5 },
                              { no: 6, title: "BAB I. PENDAHULUAN", page: 6, sub: ["Latar Belakang Kegiatan", "Maksud & Tujuan", "Landasan Hukum & Dasar Pelaksanaan"] },
                              { no: 7, title: "BAB II. PERENCANAAN KEGIATAN", page: 7, sub: ["Struktur Kepanitiaan & Alur Koordinasi", "Rancangan Jadwal & Rundown Acara"] },
                              { no: 8, title: "BAB III. PELAKSANAAN KEGIATAN", page: 8, sub: ["Rangkaian Lomba Warga & Anak", "Malam Tirakatan 17-an", "Jalan Sehat & Panggung Pentas Seni"] },
                              { no: 9, title: "BAB IV. PERTANGGUNGJAWABAN KEUANGAN", page: 9, sub: ["Realisasi Belanja Seksi Panitia", "Rekapitulasi Iuran & Swadaya RT", "Tabel Realisasi & Neraca Saldo Kas Sisa"] },
                              { no: 10, title: "BAB V. EVALUASI", page: 10, sub: ["Tantangan Administrasi & Keuangan", "Kendala Kepanitiaan & Koordinasi", "Tantangan Logistik & Operasional", "Rekomendasi & Solusi Kepanitiaan Depan"] },
                              { no: 11, title: "BAB VI. PENUTUP", page: 11, sub: ["Permohonan Maaf & Ungkapan Terima Kasih", "Penetapan Akhir Masa Bakti & Alokasi Sisa Kas"] },
                              { no: 12, title: "LAMPIRAN DOKUMEN RESMI", page: 12, sub: ["Lampiran 1: Buku Kas Umum (BKU) Kas Masuk & Keluar", "Lampiran 2: Rekonsiliasi Pengembalian Dana Talangan Pamsimas", "Lampiran 3: Dokumentasi Foto Kegiatan & Berkas Fisik Nota"] }
                            ].map((item) => (
                              <div key={item.no} className="space-y-1">
                                <div className="flex items-baseline justify-between gap-1 text-[11px] sm:text-xs">
                                  <span className="font-bold text-slate-800 shrink-0">
                                    {item.no}. {item.title}
                                  </span>
                                  <span className="flex-1 border-b border-dotted border-slate-400 mx-1.5 -mb-0.5 opacity-75" />
                                  <span className="font-mono text-slate-700 font-bold shrink-0">Hal. {item.page}</span>
                                </div>
                                {item.sub && (
                                  <div className="pl-5 space-y-0.5">
                                    {item.sub.map((subTitle, subIdx) => (
                                      <div key={subIdx} className="flex items-baseline justify-between gap-1 text-[10px] text-slate-600">
                                        <span className="shrink-0 italic">• {subTitle}</span>
                                        <span className="flex-1 border-b border-dotted border-slate-300 mx-1.5 -mb-0.5 opacity-50" />
                                        <span className="font-mono text-slate-500 shrink-0 text-[9.5px]">Hal. {item.page}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    const lines = markdownText.split("\n");
                    const elements: React.ReactNode[] = [];
                    let inList = false;
                    let listItems: React.ReactNode[] = [];
                    let inOrderedList = false;
                    let oListItems: React.ReactNode[] = [];

                    const flushLists = (keyPrefix: string) => {
                      if (inList && listItems.length > 0) {
                        elements.push(
                          <ul key={`ul-${keyPrefix}-${elements.length}`} className="list-disc pl-5 my-2 space-y-1 font-sans text-slate-700 leading-relaxed text-[11px] sm:text-[12px] text-justify">
                            {listItems}
                          </ul>
                        );
                        listItems = [];
                        inList = false;
                      }
                      if (inOrderedList && oListItems.length > 0) {
                        elements.push(
                          <ol key={`ol-${keyPrefix}-${elements.length}`} className="list-decimal pl-5 my-2 space-y-1.5 font-sans text-slate-700 leading-relaxed text-[11px] sm:text-[12px] text-justify">
                            {oListItems}
                          </ol>
                        );
                        oListItems = [];
                        inOrderedList = false;
                      }
                    };

                    for (let i = 0; i < lines.length; i++) {
                      const rawLine = lines[i];
                      const trimmed = rawLine.trim();

                      // Skip markdown table lines entirely as we render beautiful colored HTML tables instead
                      if (trimmed.startsWith("|") || trimmed.startsWith("+-") || (trimmed.startsWith(":") && trimmed.includes("-"))) {
                        flushLists(`table-${i}`);
                        continue;
                      }

                      if (trimmed === "---") {
                        flushLists(`hr-${i}`);
                        elements.push(<hr key={`hr-${i}`} className="border-t border-slate-200/60 my-4" />);
                        continue;
                      }

                      // Header 1 (e.g. # LAPORAN PERTANGGUNGJAWABAN (LPJ) KEPANITIAAN)
                      if (trimmed.startsWith("# ")) {
                        flushLists(`h1-${i}`);
                        const cleanHeader = trimmed.substring(2).replace(/[#*]/g, "").trim();
                        elements.push(
                          <h1 key={`h1-${i}`} className={`text-[12px] sm:text-[14px] font-black tracking-wider uppercase text-center ${theme.textAccent} font-sans mt-3 mb-1.5`}>
                            {cleanHeader}
                          </h1>
                        );
                        continue;
                      }

                      // Header 2 (e.g. ## PERINGATAN...)
                      if (trimmed.startsWith("## ")) {
                        flushLists(`h2-${i}`);
                        const cleanHeader = trimmed.substring(3).replace(/[#*]/g, "").trim();
                        elements.push(
                          <h2 key={`h2-${i}`} className="text-[10px] sm:text-[12px] font-extrabold tracking-normal uppercase text-center text-slate-800 font-sans mb-3">
                            {cleanHeader}
                          </h2>
                        );
                        continue;
                      }

                      // Header 3 (e.g. ### I. PENDAHULUAN)
                      if (trimmed.startsWith("### ")) {
                        flushLists(`h3-${i}`);
                        const cleanHeader = trimmed.substring(4).replace(/[#*]/g, "").trim();
                        elements.push(
                          <h3 key={`h3-${i}`} className={`text-xs font-black tracking-wider uppercase ${theme.textAccent} font-sans mt-5 mb-2.5 flex items-center gap-1.5 border-b pb-1`}>
                            {cleanHeader}
                          </h3>
                        );
                        continue;
                      }

                      // Header 4 (e.g. #### A. Laporan Realisasi)
                      if (trimmed.startsWith("#### ")) {
                        flushLists(`h4-${i}`);
                        const cleanHeader = trimmed.substring(5).replace(/[#*]/g, "").trim();
                        elements.push(
                          <h4 key={`h4-${i}`} className="text-[10px] sm:text-[11px] font-bold text-slate-800 font-sans uppercase tracking-wider mt-4 mb-2">
                            {cleanHeader}
                          </h4>
                        );
                        continue;
                      }

                      // Bullet list item
                      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                        if (inOrderedList) flushLists(`switch-list-${i}`);
                        inList = true;
                        const cleanItem = trimmed.substring(2);
                        listItems.push(
                          <li key={`li-${i}`} className="pl-1 text-justify">
                            {renderCleanText(cleanItem)}
                          </li>
                        );
                        continue;
                      }

                      // Numbered list item
                      const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
                      if (numMatch) {
                        if (inList) flushLists(`switch-olist-${i}`);
                        inOrderedList = true;
                        const cleanItem = numMatch[2];
                        oListItems.push(
                          <li key={`oli-${i}`} className="pl-1 text-justify">
                            {renderCleanText(cleanItem)}
                          </li>
                        );
                        continue;
                      }

                      // Empty line
                      if (trimmed === "") {
                        flushLists(`empty-${i}`);
                        elements.push(<div key={`space-${i}`} className="h-1.5" />);
                        continue;
                      }

                      // Regular paragraph
                      flushLists(`p-${i}`);
                      elements.push(
                        <p key={`p-${i}`} className="text-[11px] sm:text-[12px] text-slate-700 leading-relaxed font-sans mb-2 text-justify">
                          {renderCleanText(rawLine)}
                        </p>
                      );
                    }

                    // Final flush
                    flushLists("final");

                    return elements;
                  };
                  
                  // Calculate Seksi budget data
                  const seksiList = safeSettings.seksiList;
                  const isKasDonasiTxCalc = (t: { id?: string; proofNumber?: string; fundingSource?: string; category?: string }) => {
                    const idLower = (t.id || "").toLowerCase();
                    const proofUpper = (t.proofNumber || "").toUpperCase();
                    const sourceLower = (t.fundingSource || "").toLowerCase();
                    const categoryLower = (t.category || "").toLowerCase();
                    return (
                      idLower.includes("k2") ||
                      idLower.includes("bd") ||
                      idLower.includes("donasi") ||
                      proofUpper.includes("BD") ||
                      proofUpper.includes("DONASI") ||
                      sourceLower.includes("donas") ||
                      sourceLower.includes("sponsor") ||
                      categoryLower.includes("donasi") ||
                      categoryLower.includes("sponsor")
                    );
                  };

                  const seksiTableData = seksiList.map((seksiName, idx) => {
                    let pagu = safeSettings.paguAnggaranSeksi[seksiName] || 0;
                    let spent = 0;
                    let spentUtama = 0;
                    let spentDonasi = 0;
                    
                    if (useMockData) {
                      if (seksiName.includes("Sekretar") || seksiName.includes("BPH")) { pagu = 1050000; spent = 523000; spentUtama = 523000; spentDonasi = 0; }
                      else if (seksiName.includes("Acara")) { pagu = 5300000; spent = 4909000; spentUtama = 3465000; spentDonasi = 1444000; }
                      else if (seksiName.includes("Operasional") || seksiName.includes("Perlengkap")) { pagu = 11200000; spent = 7186000; spentUtama = 6012000; spentDonasi = 1174000; }
                      else if (seksiName.includes("Humas") || seksiName.includes("Support")) { pagu = 0; spent = 0; spentUtama = 0; spentDonasi = 0; }
                      else { pagu = safeSettings.paguAnggaranSeksi[seksiName] || 0; spent = Math.round(pagu * 0.9); }
                    } else {
                      const txs = keuangan.filter(t => t.type === 'Keluar' && matchTxToSeksi(t, seksiName));
                      spent = txs.reduce((sum, t) => sum + t.amount, 0);
                      spentUtama = txs.filter(t => !isKasDonasiTxCalc(t)).reduce((sum, t) => sum + t.amount, 0);
                      spentDonasi = txs.filter(t => isKasDonasiTxCalc(t)).reduce((sum, t) => sum + t.amount, 0);
                    }
                    const sisa = pagu - spent;
                    const percent = pagu > 0 ? Math.round((spent / pagu) * 100) : 0;
                    return { idx: idx + 1, seksi: seksiName, pagu, spent, spentUtama, spentDonasi, sisa, percent };
                  });

                  const totalPaguSeksi = useMockData ? 14000000 : Object.values(safeSettings.paguAnggaranSeksi).reduce((s, v) => s + v, 0);
                  const totalSpentSeksi = totalPengeluaran;
                  const totalSpentUtamaSeksi = seksiTableData.reduce((acc, row) => acc + (row.spentUtama || 0), 0);
                  const totalSpentDonasiSeksi = seksiTableData.reduce((acc, row) => acc + (row.spentDonasi || 0), 0);
                  const totalSisaSeksi = totalPaguSeksi - totalSpentSeksi;
                  const totalPercentSeksi = totalPaguSeksi > 0 ? Math.round((totalSpentSeksi / totalPaguSeksi) * 100) : 0;

                  // Calculate RT iuran collection data
                  const rtTableData = (useMockData
                    ? [
                        { name: "RT 01 Ngabean", target: 4500000, collected: 4500000, percent: 100, natura: 1200000, total: 5700000 },
                        { name: "RT 02 Ngabean", target: 4500000, collected: 4500000, percent: 100, natura: 850000, total: 5350000 },
                        { name: "RT 03 Ngabean", target: 4500000, collected: 3000000, percent: 80, natura: 900000, total: 3900000 },
                        { name: "RT 04 Ngabean", target: 4500000, collected: 4500000, percent: 100, natura: 500000, total: 5000000 },
                      ]
                    : rtCollections.map(rt => ({
                        name: `${rt.name} ${namaRW.replace(/RW\s*\d+\s*/i, "")}`,
                        target: safeSettings.targetIuranPerRT,
                        collected: rt.collected,
                        percent: rt.percent,
                        natura: 0,
                        total: rt.collected
                      }))
                  );

                  const totalTargetRT = useMockData ? 18000000 : safeSettings.targetIuranPerRT * safeSettings.rtList.length;
                  const totalCollectedRT = useMockData ? 16500000 : rtCollections.reduce((s, r) => s + r.collected, 0);
                  const totalNaturaRT = totalNatura;
                  const totalSinergiRT = totalCollectedRT + totalNaturaRT;
                  const avgPercentRT = totalTargetRT > 0 ? Math.round((totalCollectedRT / totalTargetRT) * 100) : 0;

                  // Custom themed cover page for HUT RI
                  const renderFormalCover = () => {
                    return (
                      <div className="flex-1 flex flex-col justify-between py-6 px-4 relative min-h-[900px] border-4 border-double border-red-600 rounded-lg p-6 shadow-3xs overflow-hidden bg-white" style={{ backgroundImage: `url(${garudaBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="absolute inset-0 bg-gradient-to-l from-white via-white/90 to-white/30 z-0"></div>
      <div className="relative z-10 flex flex-col h-full justify-between">
                        {/* Decorative Red & White Corner Ribbon on top right */}
                        <div className="absolute top-0 right-0 w-28 h-28 overflow-hidden pointer-events-none z-20">
                          <div className="absolute top-6 -right-10 w-36 py-1 bg-gradient-to-r from-red-600 to-red-700 text-white text-[9px] font-black uppercase tracking-widest text-center rotate-45 border-b-2 border-white/40 shadow-md">
                            HUT RI 81
                          </div>
                        </div>

                        {/* Top Accent: Merah Putih Bar */}
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-300" />
                            <span className="text-[9px] font-mono font-black tracking-widest text-slate-800 bg-white/90 border border-slate-200 px-2 py-0.5 rounded shadow-2xs uppercase">DOKUMEN PERTANGGUNGJAWABAN</span>
                          </div>
                          <span className="text-[8.5px] font-mono font-black text-red-700 uppercase border border-red-200 bg-red-50 px-2.5 py-0.5 rounded shadow-2xs">OFFICIAL LPJ</span>
                        </div>

                        {/* Main Center Block */}
                        <div className="my-auto space-y-6 text-center">
                          {/* Large Emblem */}
                          <div className="flex justify-center">
                            <div className="relative w-28 h-28 flex items-center justify-center rounded-full bg-gradient-to-br from-red-50 to-white border-4 border-red-600 shadow-md overflow-hidden p-1">
                              {eventLogo ? (
                                <img src={eventLogo} alt="Logo HUT RI" className="w-full h-full object-contain" />
                              ) : (
                                <div className="absolute inset-1.5 rounded-full border-2 border-dashed border-red-500/50 flex flex-col items-center justify-center">
                                  <span className="text-[9.5px] font-sans font-black tracking-widest text-red-600 uppercase">HUT RI</span>
                                  <span className="text-3xl font-serif font-black tracking-tight text-red-700 leading-none my-1">81</span>
                                  <span className="text-[7.5px] font-sans font-extrabold text-slate-500 tracking-widest uppercase">INDONESIA</span>
                                </div>
                              )}
                              <div className="absolute -top-1 -right-1 text-amber-500">
                                <Sparkles className="w-5 h-5 animate-pulse" />
                              </div>
                            </div>
                          </div>

                          {/* Titles */}
                          <div className="space-y-3">
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight">
                              LAPORAN <br />
                              <span className="text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded inline-block mt-1">PERTANGGUNGJAWABAN (LPJ)</span>
                            </h1>
                            
                            <div className="w-16 h-1 bg-red-600 mx-auto rounded-full" />

                            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest leading-relaxed max-w-md mx-auto">
                              PELAKSANAAN KEGIATAN PERINGATAN HARI ULANG TAHUN KEMERDEKAAN REPUBLIK INDONESIA KE-81
                            </p>
                          </div>

                          {/* Specific Event/RW Display */}
                          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 max-w-sm mx-auto space-y-1.5 shadow-3xs">
                            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">DILAKSANAKAN DI WILAYAH:</h2>
                            <p className="text-sm font-black text-slate-800 uppercase font-sans tracking-tight">
                              {namaRW.toUpperCase()}
                            </p>
                            <p className="text-[9px] font-bold text-slate-500 font-sans tracking-wide">
                              Kecamatan Gunungpati, Kota Semarang, Jawa Tengah
                            </p>
                          </div>
                        </div>

                        {/* Bottom Metadata block */}
                        <div className="border-t border-slate-200 pt-5 mt-auto text-center space-y-3">
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">DIAJUKAN OLEH:</p>
                          <div className="grid grid-cols-2 gap-2 text-left max-w-md mx-auto text-[10px] font-sans bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                            <div>
                              <span className="text-slate-400 block uppercase text-[7.5px] font-bold tracking-wider">Organisasi:</span>
                              <strong className="text-slate-700 block font-bold leading-tight">Panitia Pelaksana HUT RI 81</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block uppercase text-[7.5px] font-bold tracking-wider">Pimpinan:</span>
                              <strong className="text-slate-700 block font-bold leading-tight">{namaKetua} (Ketua)</strong>
                            </div>
                            <div className="mt-1">
                              <span className="text-slate-400 block uppercase text-[7.5px] font-bold tracking-wider">Tanggal Laporan:</span>
                              <strong className="text-slate-700 block font-bold leading-tight">{tanggalLPJ}</strong>
                            </div>
                            <div className="mt-1">
                              <span className="text-slate-400 block uppercase text-[7.5px] font-bold tracking-wider">Sifat Dokumen:</span>
                              <strong className="text-emerald-700 block font-bold leading-tight uppercase text-[8px] tracking-wide">✔ Transparan & Akuntabel</strong>
                            </div>
                          </div>
                          
                          <div className="text-[8px] text-slate-400 font-mono">
                            Sistem Pengelolaan Acara & Keuangan Waktu Nyata (SEMS) • 2026
                          </div>
                        </div>
                      </div>
                      </div>
                    );
                  };

                  // Custom themed title page for HUT RI
                  const renderFormalTitlePage = () => {
                    return (
                      <div className="flex-1 flex flex-col justify-between py-6 px-4 relative min-h-[900px] border-2 border-slate-300 rounded-lg p-6 bg-white shadow-3xs">
                        {/* Elegant minimalist ribbon at top left */}
                        <div className="absolute top-0 left-0 w-2.5 h-full bg-red-600/10 flex flex-col">
                          <div className="h-1/2 bg-red-600" />
                          <div className="h-1/2 bg-slate-200" />
                        </div>

                        <div className="pl-6 flex-1 flex flex-col justify-between">
                          {/* Header title marker */}
                          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <span className="text-[8.5px] font-mono font-black text-slate-400 tracking-widest uppercase">HALAMAN JUDUL UTAMA LPJ</span>
                            <span className="text-[8px] font-mono font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">Dokumen Resmi No. HUT81/LPJ/04</span>
                          </div>

                          {/* Body Content */}
                          <div className="my-auto space-y-8">
                            <div className="space-y-2">
                              <div className="text-[9.5px] font-extrabold text-red-600 uppercase tracking-widest">DOKUMEN PERTANGGUNGJAWABAN</div>
                              <h1 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-wide leading-snug">
                                PELAKSANAAN KEGIATAN PERINGATAN HARI ULANG TAHUN KEMERDEKAAN REPUBLIK INDONESIA KE-81
                              </h1>
                              <p className="text-[11px] text-slate-500 font-sans italic">
                                Dilengkapi dengan konsolidasi real-time keuangan, swadaya natura, laporan kerja per seksi fungsional, dan bagan alur struktur kepanitiaan.
                              </p>
                            </div>

                            <hr className="border-t border-slate-200/80 w-1/3" />

                            {/* Detailed Metadata Grid */}
                            <div className="space-y-4 text-xs">
                              <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">IDENTITAS PENGAJUAN LAPORAN</h3>
                              <div className="grid grid-cols-1 gap-3 font-sans bg-slate-50 p-4 rounded-xl border border-slate-200/60 shadow-3xs">
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="text-slate-400 font-medium">Judul Laporan</span>
                                  <span className="col-span-2 font-bold text-slate-800">Laporan Pertanggungjawaban (LPJ) HUT RI Ke-81</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-2">
                                  <span className="text-slate-400 font-medium">Nama Kegiatan</span>
                                  <span className="col-span-2 font-semibold text-slate-700">{namaKegiatan}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-2">
                                  <span className="text-slate-400 font-medium">Wilayah Kerja</span>
                                  <span className="col-span-2 font-semibold text-slate-700">{namaRW}, Kecamatan Gunungpati, Kota Semarang</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-2">
                                  <span className="text-slate-400 font-medium">Penyusun Laporan</span>
                                  <span className="col-span-2 font-semibold text-slate-700">Panitia Pelaksana Peringatan HUT RI Ke-81 {namaRW}</span>
                                </div>
                              </div>
                            </div>

                            {/* Short paragraph of purpose */}
                            <div className="bg-red-50/30 border-l-2 border-red-600/70 p-3 text-[10px] sm:text-[11px] text-slate-600 rounded-r-lg">
                              <strong>Tujuan Dokumen:</strong> Dokumen ini diajukan oleh panitia pelaksana sebagai laporan resmi, bukti pertanggungjawaban pengelolaan dana, inventarisasi aset, serta menjadi warisan sejarah (legacy) dokumentasi warga demi kelangsungan gotong royong di masa depan.
                            </div>
                          </div>

                          {/* Footer and seal stamp reference */}
                          <div className="border-t border-slate-100 pt-4 mt-auto text-[8.5px] text-slate-400 flex justify-between items-center font-mono">
                            <span>SEMS DIGITAL ARCHIVE • NGABEAN</span>
                            <span className="uppercase text-[7.5px] font-black text-red-600 bg-red-50 px-2 py-0.5 border border-red-100 rounded">SALINAN ASLI DRAF</span>
                          </div>
                        </div>
                      </div>
                    );
                  };

                  // Render multi-page document layout
                  const pages = mainBodyText.split("---").map(p => p.trim()).filter(p => p.length > 0);

                  return pages.map((pageText, pageIndex) => {
                    const isCoverPage = pageIndex === 0;
                    const isLastPage = pageIndex === pages.length - 1;
                    const isFormalCover = selectedTemplate === "formal" && pageIndex === 0;
                    const isFormalTitlePage = selectedTemplate === "formal" && pageIndex === 1;
                    const isLembarPengesahan = selectedTemplate === "formal" && (pageText.includes("### LEMBAR PENGESAHAN") || pageIndex === 2);
                    const isBabIIPerencanaan = selectedTemplate === "formal" && (pageText.includes("### BAB II. PERENCANAAN KEGIATAN") || pageIndex === 6);
                    const isBabIVKeuangan = selectedTemplate === "formal" && (pageText.includes("### BAB IV. PERTANGGUNGJAWABAN KEUANGAN") || pageIndex === 8);
                    const isBabVIPenutup = selectedTemplate === "formal" && (pageText.includes("### BAB VI. PENUTUP") || pageIndex === 10);
                    const isLampiranPage = selectedTemplate === "formal" && (pageText.includes("### LAMPIRAN") || pageText.includes("LAMPIRAN 1") || pageIndex === 11);

                    return (
                      <div key={`page-${pageIndex}`} className={getPaperClass()}>
                        
                        {/* Decorative watermark */}
                        {showWatermark && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
                            <div className="text-red-600/[0.035] font-serif font-black text-3xl sm:text-4xl uppercase tracking-[0.25em] -rotate-[30deg] text-center whitespace-nowrap leading-none select-none">
                              {namaRW.toUpperCase()} SEMARANG — DRAF ASLI
                            </div>
                          </div>
                        )}

                        <div className="relative z-10 flex-1 flex flex-col">
                          {isCoverPage && !isFormalCover && (
                            <div className="mb-8">
                              {renderLetterhead()}
                            </div>
                          )}

                          <div className="leading-relaxed flex-1">
                            {isFormalCover ? (
                              renderFormalCover()
                            ) : isFormalTitlePage ? (
                              renderFormalTitlePage()
                            ) : (
                              renderMarkdownCleanly(pageText)
                            )}
                             
                            {/* Appended Content on Lembar Pengesahan */}
                            {isLembarPengesahan && (
                              <div className="mt-6">
                                {renderSignatureGrid()}
                              </div>
                            )}

                            {/* Appended Content on BAB II Perencanaan */}
                            {isBabIIPerencanaan && (
                              <div className="mt-5 space-y-3 border-t border-slate-200/40 pt-4 break-inside-avoid">
                                <div className="flex items-center justify-between border-b border-slate-200/50 pb-1.5">
                                  <h4 className={`text-[10px] font-black tracking-wider uppercase ${theme.textAccent} font-sans flex items-center gap-1.5`}>
                                    <Layers className="w-3.5 h-3.5 shrink-0 text-red-600" />
                                    BAGAN ALUR STRUKTUR ORGANISASI KEPANITIAAN
                                  </h4>
                                  <span className="text-[7px] font-mono font-bold uppercase bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded">
                                    Garis Koordinasi
                                  </span>
                                </div>
                                <div className="p-1 border border-slate-100 rounded-lg">
                                  <OrgChart panitia={panitia} settings={settings} printMode={true} />
                                </div>
                              </div>
                            )}

                            {/* Appended Content on BAB IV Keuangan */}
                            {isBabIVKeuangan && (
                              <div className="mt-4 space-y-5">
                                {/* Section A Table */}
                                <div className="space-y-1">
                                  <h4 className="text-[10px] font-bold text-slate-800 font-sans uppercase tracking-wider">
                                    A. Laporan Realisasi Anggaran Seksi (Belanja Kegiatan)
                                  </h4>
                                  
                                  <div className={`overflow-x-auto rounded border ${theme.tableBorder} bg-white shadow-3xs`}>
                                    <table className="w-full text-left border-collapse text-[10px] sm:text-[10.5px]">
                                      <thead>
                                        <tr className={`${theme.thBg} border-b ${theme.thBorder} font-bold uppercase tracking-wider text-[8px]`}>
                                          <th className="px-2 py-1.5 text-center text-inherit">No</th>
                                          <th className="px-2 py-1.5 text-inherit">Seksi / Pos Anggaran</th>
                                          <th className="px-2 py-1.5 text-right text-inherit">Alokasi Pagu</th>
                                          <th className="px-2 py-1.5 text-right text-inherit">Realisasi (Total)</th>
                                          <th className="px-2 py-1.5 text-right text-inherit hidden md:table-cell">Dari Kas Utama</th>
                                          <th className="px-2 py-1.5 text-right text-inherit hidden md:table-cell">Dari Kas Donasi</th>
                                          <th className="px-2 py-1.5 text-right text-inherit">Sisa Anggaran</th>
                                          <th className="px-2 py-1.5 text-center text-inherit">Penyerapan (%)</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 font-sans">
                                        {seksiTableData.map((row) => (
                                          <tr key={row.idx} className={`hover:bg-slate-50/50 transition-colors ${theme.stripeBg}`}>
                                            <td className="px-2 py-1 text-center text-slate-400 font-medium">{row.idx}</td>
                                            <td className="px-2 py-1 font-semibold text-slate-800">Seksi {row.seksi}</td>
                                            <td className="px-2 py-1 text-right font-mono text-slate-600">{formatRp(row.pagu)}</td>
                                            <td className="px-2 py-1 text-right font-mono font-bold text-slate-800">{formatRp(row.spent)}</td>
                                            <td className="px-2 py-1 text-right font-mono text-[9px] text-slate-500 hidden md:table-cell">{formatRp(row.spentUtama || 0)}</td>
                                            <td className="px-2 py-1 text-right font-mono text-[9px] text-slate-500 hidden md:table-cell">{formatRp(row.spentDonasi || 0)}</td>
                                            <td className="px-2 py-1 text-right font-mono text-slate-600">{formatRp(row.sisa)}</td>
                                            <td className="px-2 py-1 text-center">
                                              <span className={`px-1 py-0.2 rounded font-bold text-[8px] ${
                                                row.percent >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                row.percent >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                                'bg-slate-50 text-slate-600 border border-slate-100'
                                              }`}>
                                                {row.percent}%
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                        <tr className={`${theme.sumBg} font-extrabold ${theme.sumBorder} text-[10px]`}>
                                          <td className="px-2 py-2 text-center">Σ</td>
                                          <td className="px-2 py-2 uppercase tracking-wide text-[8px]">Total Belanja</td>
                                          <td className="px-2 py-2 text-right font-mono">{formatRp(totalPaguSeksi)}</td>
                                          <td className="px-2 py-2 text-right font-mono text-emerald-700">{formatRp(totalSpentSeksi)}</td>
                                          <td className="px-2 py-2 text-right font-mono text-slate-700 hidden md:table-cell">{formatRp(totalSpentUtamaSeksi)}</td>
                                          <td className="px-2 py-2 text-right font-mono text-slate-700 hidden md:table-cell">{formatRp(totalSpentDonasiSeksi)}</td>
                                          <td className="px-2 py-2 text-right font-mono">{formatRp(totalSisaSeksi)}</td>
                                          <td className="px-2 py-2 text-center">
                                            <span className="px-1 py-0.2 rounded bg-slate-900 text-amber-400 text-[8px] font-bold">
                                              {totalPercentSeksi}%
                                            </span>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Section B Table */}
                                <div className="space-y-1">
                                  <h4 className="text-[10px] font-bold text-slate-800 font-sans uppercase tracking-wider">
                                    B. Rekapitulasi Iuran & Swadaya Gotong Royong RT
                                  </h4>
                                  
                                  <div className={`overflow-x-auto rounded border ${theme.tableBorder} bg-white shadow-3xs`}>
                                    <table className="w-full text-left border-collapse text-[10px] sm:text-[10.5px]">
                                      <thead>
                                        <tr className={`${theme.thBg} border-b ${theme.thBorder} font-bold uppercase tracking-wider text-[8px]`}>
                                          <th className="px-2 py-1.5 text-center text-inherit">No</th>
                                          <th className="px-2 py-1.5 text-inherit">Wilayah RT</th>
                                          <th className="px-2 py-1.5 text-right text-inherit">Target Pokok</th>
                                          <th className="px-2 py-1.5 text-right text-inherit">Iuran Tunai</th>
                                          <th className="px-2 py-1.5 text-center text-inherit">Capaian (%)</th>
                                          <th className="px-2 py-1.5 text-right text-inherit">Swadaya Natura</th>
                                          <th className="px-2 py-1.5 text-right text-inherit">Sinergi Total</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 font-sans">
                                        {rtTableData.map((row, idx) => (
                                          <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${theme.stripeBg}`}>
                                            <td className="px-2 py-1 text-center text-slate-400 font-medium">{idx + 1}</td>
                                            <td className="px-2 py-1 font-semibold text-slate-800">{row.name}</td>
                                            <td className="px-2 py-1 text-right font-mono text-slate-600">{formatRp(row.target)}</td>
                                            <td className="px-2 py-1 text-right font-mono font-bold text-slate-800">{formatRp(row.collected)}</td>
                                            <td className="px-2 py-1 text-center">
                                              <span className={`px-1 py-0.2 rounded font-bold text-[8px] ${
                                                row.percent >= 100 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                'bg-amber-50 text-amber-700 border border-amber-100'
                                              }`}>
                                                {row.percent}%
                                              </span>
                                            </td>
                                            <td className="px-2 py-1 text-right font-mono text-amber-700">{formatRp(row.natura)}</td>
                                            <td className="px-2 py-1 text-right font-mono text-indigo-700 font-semibold">{formatRp(row.total)}</td>
                                          </tr>
                                        ))}
                                        <tr className={`${theme.sumBg} font-extrabold ${theme.sumBorder} text-[10px]`}>
                                          <td className="px-2 py-2 text-center">Σ</td>
                                          <td className="px-2 py-2 uppercase tracking-wide text-[8px]">Total Sinergi RT</td>
                                          <td className="px-2 py-2 text-right font-mono">{formatRp(totalTargetRT)}</td>
                                          <td className="px-2 py-2 text-right font-mono text-emerald-700">{formatRp(totalCollectedRT)}</td>
                                          <td className="px-2 py-2 text-center">
                                            <span className="px-1 py-0.2 rounded bg-slate-900 text-amber-400 text-[8px] font-bold">
                                              {avgPercentRT}%
                                            </span>
                                          </td>
                                          <td className="px-2 py-2 text-right font-mono text-amber-800">{formatRp(totalNaturaRT)}</td>
                                          <td className="px-2 py-2 text-right font-mono text-indigo-800">{formatRp(totalSinergiRT)}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Section C: Realisasi & Neraca Saldo */}
                                <div className={`border rounded-lg p-3 ${theme.bg} space-y-2`}>
                                  <div className="flex items-center justify-between border-b border-slate-200/50 pb-1">
                                    <h4 className={`text-[10px] font-black tracking-wider uppercase ${theme.textAccent} font-sans flex items-center gap-1`}>
                                      <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                                      C. TABEL REALISASI & NERACA SALDO KEUANGAN (AUDIT TRANSPARAN)
                                    </h4>
                                  </div>

                                  <div className={`overflow-x-auto rounded border ${theme.tableBorder} bg-white shadow-3xs`}>
                                    <table className="w-full text-left border-collapse text-[10px] sm:text-[10.5px]">
                                      <thead>
                                        <tr className={`${theme.thBg} border-b ${theme.thBorder} font-bold uppercase tracking-wider text-[8px]`}>
                                          <th className="px-2 py-1.5 text-inherit">Rincian Pos Posisi Keuangan</th>
                                          <th className="px-2 py-1.5 text-center text-inherit">Jenis Aliran</th>
                                          <th className="px-2 py-1.5 text-right text-inherit">Jumlah Rupiah (Rp)</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 font-sans">
                                        <tr className={`${theme.stripeBg} hover:bg-slate-50/50 transition-colors`}>
                                          <td className="px-2 py-1 font-medium text-slate-800">1. Penerimaan Dana Tunai (Kas Bersih Warga & Donatur)</td>
                                          <td className="px-2 py-1 text-center">
                                            <span className="px-1 py-0.2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-extrabold text-[7.5px] uppercase">
                                              Kas Masuk
                                            </span>
                                          </td>
                                          <td className="px-2 py-1 text-right font-mono font-bold text-emerald-600">
                                            {formatRp(totalPemasukan)}
                                          </td>
                                        </tr>
                                        <tr className="hover:bg-slate-50/50 transition-colors">
                                          <td className="px-2 py-1 font-medium text-slate-800">2. Kontribusi Gotong Royong RT (Swadaya Natura/Barang)</td>
                                          <td className="px-2 py-1 text-center">
                                            <span className="px-1 py-0.2 rounded-full bg-amber-50 border border-amber-100 text-amber-700 font-extrabold text-[7.5px] uppercase">
                                              Natura RT
                                            </span>
                                          </td>
                                          <td className="px-2 py-1 text-right font-mono font-bold text-amber-700">
                                            {formatRp(totalNatura)}
                                          </td>
                                        </tr>
                                        <tr className="bg-slate-50/60 font-bold text-slate-800">
                                          <td className="px-2 py-1">Total Kekuatan Sinergi Swadaya Warga (Kas + Natura)</td>
                                          <td className="px-2 py-1 text-center">
                                            <span className="px-1 py-0.2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-[7.5px] uppercase">
                                              Sinergi Total
                                            </span>
                                          </td>
                                          <td className="px-2 py-1 text-right font-mono text-indigo-800">
                                            {formatRp(totalCombinedValue)}
                                          </td>
                                        </tr>
                                        <tr className={`${theme.stripeBg} hover:bg-slate-50/50 transition-colors`}>
                                          <td className="px-2 py-1 font-medium text-slate-800">3. Realisasi Belanja & Pengeluaran Operasional</td>
                                          <td className="px-2 py-1 text-center">
                                            <span className="px-1 py-0.2 rounded-full bg-red-50 border border-red-100 text-red-700 font-extrabold text-[7.5px] uppercase">
                                              Kas Keluar
                                            </span>
                                          </td>
                                          <td className="px-2 py-1 text-right font-mono font-bold text-red-600">
                                            {formatRp(totalPengeluaran)}
                                          </td>
                                        </tr>
                                         <tr className={`${theme.sumBg} font-black text-[10px] ${theme.sumBorder}`}>
                                          <td className="px-2 py-1.5">Sisa Saldo Kas Riil (Dialihfungsikan untuk Konsolidasi Internal & Pembubaran Panitia)</td>
                                          <td className="px-2 py-1.5 text-center">
                                            <span className="px-1 py-0.2 rounded-full bg-slate-900 text-amber-400 font-bold text-[7.5px] uppercase">
                                              Kas Sisa
                                            </span>
                                          </td>
                                          <td className="px-2 py-1.5 text-right font-mono text-slate-950">
                                            {formatRp(saldoSisa)}
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Appended Content on Lampiran Page */}
                            {isLampiranPage && (
                              <div className="mt-6 space-y-5 text-xs border-t-2 border-slate-900 pt-5 print:break-inside-avoid">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 text-center">
                                  <h4 className="text-xs font-black text-red-800 uppercase tracking-wider font-sans">
                                    BERKAS REKAPITULASI LAMPIRAN RESMI LPJ
                                  </h4>
                                  <p className="text-[10.5px] text-slate-600 mt-1 font-sans">
                                    Berikut 3 berkas lampiran pendukung fisik & digital yang telah terverifikasi penuh oleh Panitia dan Pengurus RW 04 Ngabean.
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                  <div className="border border-slate-300 rounded-lg p-3.5 bg-white shadow-3xs flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-red-700 uppercase bg-red-100 px-2 py-0.5 rounded border border-red-200">Lampiran 1</span>
                                        <span className="text-[8px] font-mono text-emerald-700 font-bold">TERVERIFIKASI</span>
                                      </div>
                                      <div className="text-xs font-black text-slate-900 mt-2 font-sans">Buku Kas Umum (BKU)</div>
                                      <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                                        28 Transaksi Kas Utama & 9 Transaksi Kas Donasi tercatat presisi dengan sisa saldo bersih Rp 1.382.000,00.
                                      </p>
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-slate-100 text-[8.5px] font-mono text-slate-500">
                                      Status: Rekapitulasi Kas Lunas
                                    </div>
                                  </div>

                                  <div className="border border-slate-300 rounded-lg p-3.5 bg-white shadow-3xs flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-indigo-700 uppercase bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">Lampiran 2</span>
                                        <span className="text-[8px] font-mono text-emerald-700 font-bold">100% LUNAS</span>
                                      </div>
                                      <div className="text-xs font-black text-slate-900 mt-2 font-sans">Rekonsiliasi Pamsimas & RT</div>
                                      <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                                        Pengembalian dana talangan Pamsimas 4 RT @ Rp 2.000.000 (total Rp 8.000.000) telah tuntas via iuran warga.
                                      </p>
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-slate-100 text-[8.5px] font-mono text-slate-500">
                                      Status: Talangan Terserap Tuntas
                                    </div>
                                  </div>

                                  <div className="border border-slate-300 rounded-lg p-3.5 bg-white shadow-3xs flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-amber-800 uppercase bg-amber-100 px-2 py-0.5 rounded border border-amber-200">Lampiran 3</span>
                                        <span className="text-[8px] font-mono text-emerald-700 font-bold">ARSIP FISIK</span>
                                      </div>
                                      <div className="text-xs font-black text-slate-900 mt-2 font-sans">Dokumentasi & Nota Belanja</div>
                                      <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                                        Bundel nota asli belanja barang/jasa dan foto dokumentasi kegiatan tersimpan rapi pada sekretariat RW.
                                      </p>
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-slate-100 text-[8.5px] font-mono text-slate-500">
                                      Status: Terarsip di Kesekretariatan
                                    </div>
                                  </div>
                                </div>

                                <div className="border border-slate-200 bg-slate-50 rounded-lg p-3 text-center text-[9.5px] text-slate-500 font-mono">
                                  Dokumen LPJ ini diterbitkan secara otomatis oleh Sistem SEMS RW 04 Ngabean dan sah tanpa memerlukan pengubahan data manual.
                                </div>
                              </div>
                            )}

                          </div>

                          {/* Appended Content on Penutup (Formal) or Last Page (Ringkas) */}
                          {((selectedTemplate === "ringkas" && isLastPage) || isBabVIPenutup) && (
                            <div className="mt-8">
                              {renderSignatureGrid()}
                            </div>
                          )}

                        </div>

                        {!isCoverPage && (
                          <div className="mt-6 text-center text-[10px] text-slate-500 font-mono font-bold">
                            - {pageIndex + 1} -
                          </div>
                        )}
                      </div>
                    );
                  });
                };

                return (
                  <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm print:border-none print:shadow-none print:rounded-none">
                    
                    {/* LPJ Toolbar controls */}
                    <div className="bg-slate-50 border-b border-slate-200 px-3 py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[11px] print:hidden">
                      <span className="font-bold text-slate-700 font-sans flex items-center gap-1.5">
                        <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                        Preview Dokumen Hasil Rumusan LPJ
                      </span>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={copyLPJToClipboard}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-xs font-bold shadow-2xs"
                        >
                          <Clipboard className="w-3.5 h-3.5 text-slate-400" />
                          {copiedLPJ ? "Tersalin!" : "Salin Teks"}
                        </button>
                        <button
                          onClick={() => {
                            if (!lpjMarkdown) return;
                            const element = document.createElement("a");
                            const file = new Blob([lpjMarkdown], {type: 'text/plain;charset=utf-8'});
                            element.href = URL.createObjectURL(file);
                            element.download = `LPJ-${namaKegiatan.replace(/\s+/g, "-")}.txt`;
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                          }}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded text-xs font-bold shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-400" />
                          Unduh (.TXT)
                        </button>
                      </div>
                    </div>

                    {/* Document Styling Customization Toolbar */}
                    <div className="bg-slate-900 text-slate-200 px-4 py-3 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5 print:hidden">
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <span className="font-extrabold text-amber-400 flex items-center gap-1.5 font-sans uppercase tracking-wider text-[10px]">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          Studio Desain Dokumen
                        </span>
                        
                        {/* Theme presets picker */}
                        <div className="flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Kertas:</span>
                          <div className="flex gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
                            <button
                              onClick={() => setPaperTheme("classic")}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${paperTheme === "classic" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                              Resmi (Merah)
                            </button>
                            <button
                              onClick={() => setPaperTheme("creamy")}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${paperTheme === "creamy" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                              Klasik (Cream)
                            </button>
                            <button
                              onClick={() => setPaperTheme("minimal")}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${paperTheme === "minimal" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                              Modern
                            </button>
                            <button
                              onClick={() => setPaperTheme("green-gold")}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${paperTheme === "green-gold" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                              Swadaya
                            </button>
                          </div>
                        </div>

                        {/* Font picker */}
                        <div className="flex items-center gap-1.5">
                          <Type className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Font:</span>
                          <div className="flex gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
                            <button
                              onClick={() => setFontStyle("poppins")}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${fontStyle === "poppins" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                              Poppins
                            </button>
                            <button
                              onClick={() => setFontStyle("arial")}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${fontStyle === "arial" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                              Arial
                            </button>
                            <button
                              onClick={() => setFontStyle("mono")}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${fontStyle === "mono" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                              Mono
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Extra layout toggles */}
                      <div className="flex flex-wrap items-center gap-3.5 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none text-[10px] font-bold uppercase">
                          <input
                            type="checkbox"
                            checked={showWatermark}
                            onChange={(e) => setShowWatermark(e.target.checked)}
                            className="rounded accent-red-600 focus:ring-0 w-3 h-3 cursor-pointer"
                          />
                          <span>Watermark</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none text-[10px] font-bold uppercase">
                          <input
                            type="checkbox"
                            checked={showStamp}
                            onChange={(e) => setShowStamp(e.target.checked)}
                            className="rounded accent-red-600 focus:ring-0 w-3 h-3 cursor-pointer"
                          />
                          <span>Stempel</span>
                        </label>
                        
                        <button
                          onClick={() => setIsPreviewOpen(true)}
                          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-[10px] font-black uppercase transition-all shadow-md"
                        >
                          <Eye className="w-3.5 h-3.5 text-white" />
                          Pratinjau Cetak
                        </button>

                        <button
                          onClick={handleExportWord}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-[10px] font-black uppercase transition-all shadow-md cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-white" />
                          Unduh DOC
                        </button>

                        <button
                          onClick={handleExportPNG}
                          disabled={isExportingImage}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-[10px] font-black uppercase transition-all shadow-md disabled:opacity-50 cursor-pointer"
                          title="Ekspor sebagai 1 gambar PNG utuh"
                        >
                          {isExportingImage ? (
                            <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-white" />
                          )}
                          PNG (1 File)
                        </button>

                        <button
                          onClick={handleExportPNGZip}
                          disabled={isExportingImage}
                          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded text-[10px] font-black uppercase transition-all shadow-md disabled:opacity-50 cursor-pointer"
                          title="Ekspor gambar PNG per halaman dalam berkas .ZIP"
                        >
                          {isExportingImage ? (
                            <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                          ) : (
                            <Archive className="w-3.5 h-3.5 text-white" />
                          )}
                          PNG (ZIP per Hal)
                        </button>

                        <button
                          onClick={handleExportJPG}
                          disabled={isExportingImage}
                          className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-[10px] font-black uppercase transition-all shadow-md disabled:opacity-50 cursor-pointer"
                          title="Ekspor sebagai 1 gambar JPG utuh"
                        >
                          {isExportingImage ? (
                            <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-white" />
                          )}
                          JPG (1 File)
                        </button>

                        <button
                          onClick={handleExportJPGZip}
                          disabled={isExportingImage}
                          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-[10px] font-black uppercase transition-all shadow-md disabled:opacity-50 cursor-pointer"
                          title="Ekspor gambar JPG per halaman dalam berkas .ZIP"
                        >
                          {isExportingImage ? (
                            <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                          ) : (
                            <Archive className="w-3.5 h-3.5 text-white" />
                          )}
                          JPG (ZIP per Hal)
                        </button>

                        <button
                          onClick={() => window.print()}
                          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1 rounded text-[10px] font-black uppercase transition-all shadow-md"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-950" />
                          Cetak Dokumen
                        </button>
                        
                        <button
                          onClick={handleExportPDF}
                          disabled={isExportingPDF}
                          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-[10px] font-black uppercase transition-all shadow-md disabled:opacity-50 cursor-pointer"
                        >
                          {isExportingPDF ? (
                            <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-white" />
                          )}
                          {isExportingPDF ? "Mengekspor..." : "Ekspor PDF"}
                        </button>
                      </div>
                    </div>

                    {/* Styled virtual paper layout */}
                    <div className="p-4 sm:p-8 bg-slate-200/60 h-[800px] overflow-y-auto select-text print:h-auto print:bg-transparent print:p-0 print:overflow-visible">
                      <div id="document-preview-paper" className="space-y-8 print:space-y-0">
                        {renderPaperContent()}
                      </div>
                    </div>

                    <div className="bg-red-50 p-2 text-[9px] text-red-800 border-t border-slate-200 font-bold tracking-wide uppercase text-center print:hidden">
                      *LPJ Konsolidasi Real-time: Kas Masuk {formatRp(keuangan.filter(t => t.type === 'Masuk').reduce((s,t) => s+t.amount, 0))} | Kas Keluar {formatRp(keuangan.filter(t => t.type === 'Keluar').reduce((s,t) => s+t.amount,0))}
                    </div>
                    <div className="space-y-5">
      <PDFPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        title="Pratinjau LPJ" 
        onDownload={handleExportPDF}
        onExportWord={handleExportWord}
        onExportPNG={handleExportPNG}
        onExportPNGZip={handleExportPNGZip}
        onExportJPG={handleExportJPG}
        onExportJPGZip={handleExportJPGZip}
      >
        {renderPaperContent()}
      </PDFPreviewModal>
                  </div>
                  </div>
                );
              })()
            }}

          </div>
        )}

      </div>
        </>
      )}
    </>
  );
}
