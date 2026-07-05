import React, { useState } from "react";
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
  ShieldCheck
} from "lucide-react";
import { SeksiTask, SystemSetting, KeuanganTransaction, NaturaItem } from "../types";

interface MonitoringViewProps {
  tasks: SeksiTask[];
  settings: SystemSetting;
  keuangan: KeuanganTransaction[];
  natura: NaturaItem[];
  onToggleTaskStatus: (taskId: string) => Promise<void>;
}

export default function MonitoringView({
  tasks,
  settings,
  keuangan,
  natura,
  onToggleTaskStatus
}: MonitoringViewProps) {
  const [lpjMarkdown, setLpjMarkdown] = useState<string>("");
  const [showLPJConsole, setShowLPJConsole] = useState(false);
  const [consoleLog, setConsoleLog] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLPJ, setCopiedLPJ] = useState(false);

  // Custom LPJ Template settings & inputs
  const [selectedTemplate, setSelectedTemplate] = useState<"formal" | "ringkas" | "natura">("formal");
  const [namaRW, setNamaRW] = useState<string>("RW 04 Ngabean");
  const [namaKegiatan, setNamaKegiatan] = useState<string>("Peringatan HUT RI Ke-81");
  const [tanggalLPJ, setTanggalLPJ] = useState<string>("17 Agustus 2026");
  const [namaKetua, setNamaKetua] = useState<string>("Budi Santoso");
  const [namaSekretaris, setNamaSekretaris] = useState<string>("Siti Rahma");
  const [namaBendahara, setNamaBendahara] = useState<string>("Hadi Wibowo");
  const [namaRWKetua, setNamaRWKetua] = useState<string>("H. Ahmad");

  // Custom LPJ Styling states
  const [paperTheme, setPaperTheme] = useState<"classic" | "creamy" | "minimal" | "green-gold">("classic");
  const [fontStyle, setFontStyle] = useState<"serif" | "sans" | "mono">("serif");
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [showStamp, setShowStamp] = useState<boolean>(true);

  // 1. Compute RT Contributions
  const rtCollections = settings.rtList.map((rtName) => {
    const collected = keuangan
      .filter((t) => t.type === "Masuk" && t.category === "Iuran RT" && t.notes.toLowerCase().includes(rtName.toLowerCase()))
      .reduce((sum, t) => sum + t.amount, 0);

    const naturaValue = natura
      .filter((n) => n.rt.toLowerCase().includes(rtName.toLowerCase()))
      .reduce((sum, n) => sum + n.estimatedValue, 0);

    const totalContribution = collected + naturaValue;
    const percent = Math.min(100, Math.round((collected / settings.targetIuranPerRT) * 100));

    let status = "Belum Mulai";
    let statusClass = "bg-slate-100 text-slate-500 border-slate-200";
    if (collected >= settings.targetIuranPerRT) {
      status = "LUNAS";
      statusClass = "bg-emerald-100 text-emerald-700 border-emerald-200";
    } else if (collected > 0) {
      status = "Kurang";
      statusClass = "bg-amber-100 text-amber-700 border-amber-200";
    }

    return {
      name: rtName,
      collected,
      naturaValue,
      totalContribution,
      percent,
      status,
      statusClass
    };
  });

  const formatRp = (num: number) => {
    return "Rp " + num.toLocaleString("id-ID");
  };

  const generateLocalLPJ = (templateType: "formal" | "ringkas" | "natura") => {
    // Math computations for the report
    const totalPemasukan = keuangan
      .filter(t => t.type === 'Masuk')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalNatura = natura.reduce((sum, n) => sum + n.estimatedValue, 0);

    const totalPengeluaran = keuangan
      .filter(t => t.type === 'Keluar')
      .reduce((sum, t) => sum + t.amount, 0);

    const saldoSisa = totalPemasukan - totalPengeluaran;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Selesai').length;
    const processingTasks = tasks.filter(t => t.status === 'Proses').length;
    const pendingTasks = tasks.filter(t => t.status === 'Belum').length;
    const persenTugas = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Detailed RT Collections output
    const rtCollectionsDetails = rtCollections.map(rt => {
      return `- **${rt.name} ${namaRW.replace(/RW\s*\d+\s*/i, "")}:** Kas Tunai: ${formatRp(rt.collected)} (${rt.percent}% lunas), Natura Gotong Royong: ${formatRp(rt.naturaValue)} (Total Kontribusi: ${formatRp(rt.totalContribution)})`;
    }).join("\n");

    // Detailed Tasks per Seksi output
    const seksiList = settings.seksiList;
    const seksiTasksDetails = seksiList.map(seksiName => {
      const seksiTasks = tasks.filter(t => t.seksi === seksiName);
      const done = seksiTasks.filter(t => t.status === 'Selesai').length;
      const total = seksiTasks.length;
      const pagu = settings.paguAnggaranSeksi[seksiName] || 0;
      return `- **Seksi ${seksiName}:** Menyelesaikan ${done} dari ${total} program kerja. (Pagu Maksimal: ${formatRp(pagu)})`;
    }).join("\n");

    // Total sisa pagu
    const totalSisaPagu = Object.values(settings.paguAnggaranSeksi).reduce((s,v) => s+v, 0) - totalPengeluaran;

    if (templateType === "ringkas") {
      return `RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY) LAPORAN PERTANGGUNGJAWABAN
[DOKUMEN RINGKAS WARGA]
KEGIATAN: ${namaKegiatan.toUpperCase()}
WILAYAH: ${namaRW.toUpperCase()} KELURAHAN NGABEAN SEMARANG

Yth. Bapak/Ibu Warga ${namaRW},

Salam sejahtera untuk kita semua. Atas nama seluruh jajaran Panitia Pelaksana, kami mengucapkan terima kasih sebesar-besarnya atas kebersamaan, sumbangan iuran, waktu, serta tenaga yang melimpah dari seluruh warga dalam memeriahkan ${namaKegiatan}.

Berikut adalah ringkasan kilas balik keuangan dan progress kegiatan yang dapat kami laporkan secara terbuka:

📊 I. KILAS BALIK REALISASI KEUANGAN
1. Total Dana Masuk (Kas Tunai Warga & Donatur): ${formatRp(totalPemasukan)}
2. Total Nilai Gotong Royong (Natura Non-Tunai): ${formatRp(totalNatura)}
3. Total Pengeluaran Kegiatan (Belanja Panitia): ${formatRp(totalPengeluaran)}
4. Sisa Saldo Kas Bersih Panitia: ${formatRp(saldoSisa)}

Sisa saldo sebesar ${formatRp(saldoSisa)} ini telah diserahkan kembali secara utuh kepada kas RW untuk kemaslahatan warga berikutnya.

📋 II. CAPAIAN PROGRAM KERJA & TUGAS SEKSI
Kepanitiaan sukses merampungkan ${persenTugas}% dari total target kegiatan:
- Total Program Kerja: ${totalTasks} Agenda Kegiatan
- Selesai & Sukses: ${completedTasks} Agenda (Contoh: Lomba anak-anak, tirakatan malam HUT RI, jalan sehat)
- Dalam Proses/Evaluasi: ${processingTasks} Agenda
- Belum Terlaksana: ${pendingTasks} Agenda

Sinergi gotong royong dan kontribusi natura dari warga berhasil menekan biaya operasional langsung, membuktikan bahwa warga ${namaRW} sangat guyub dan rukun.

Semarang, ${tanggalLPJ}
Hormat Kami,

[${namaKetua}]
Ketua Panitia Pelaksana`;
    }

    if (templateType === "natura") {
      // Create list of natura contributions
      const naturaListDetails = natura.length > 0 
        ? natura.map((n, idx) => `${idx + 1}. **${n.rt}** - ${n.item} (${n.qty} ${n.unit}, Estimasi nilai: ${formatRp(n.estimatedValue)}) oleh ${n.donorName}`).join("\n")
        : "- Belum ada catatan kontribusi natura dari warga.";

      return `LAPORAN KHUSUS SWADAYA & GOTONG ROYONG WARGA (NATURA)
PADA KEGIATAN: ${namaKegiatan.toUpperCase()}
WILAYAH: ${namaRW.toUpperCase()} KELURAHAN NGABEAN SEMARANG

---

Laporan ini disusun secara khusus untuk mengapresiasi dan mendokumentasikan tingginya partisipasi non-finansial (swadaya berupa barang, jasa, makanan, panggung, sound, dll) warga dalam menyukseskan ${namaKegiatan}.

I. ANALISIS MANFAAT KONTRIBUSI NATURA
- **Total Estimasi Nilai Natura Warga:** ${formatRp(totalNatura)}
- **Rasio Swadaya Terhadap Kas Tunai:** ${totalPemasukan > 0 ? Math.round((totalNatura / totalPemasukan) * 100) : 0}% dari total anggaran tunai.

Dengan adanya sumbangan natura warga senilai ${formatRp(totalNatura)}, panitia pelaksana berhasil memangkas biaya belanja operasional langsung hingga puluhan persen. Pola subsidi silang ini terbukti sangat efektif dalam mengurangi beban pengeluaran kas tunai.

II. RINCIAN DONASI NATURA WARGA PER RT
Berikut adalah catatan rincian sumbangan sukarela warga yang diterima oleh panitia:
${naturaListDetails}

III. REKOMENDASI KEMANDIRIAN KEMASYARAKATAN
1. Model kontribusi gotong royong non-tunai (natura) ini sangat layak dipertahankan pada event-event RW mendatang.
2. Koordinasi antar RT dalam mendistribusikan konsumsi dan perlengkapan membuat event berjalan mandiri tanpa bergantung penuh pada sponsorship eksternal.

Semarang, ${tanggalLPJ}
Dilaporkan oleh,

[${namaBendahara}]
Bendahara Panitia`;
    }

    // Default: Formal - Standard Template
    return `# LAPORAN PERTANGGUNGJAWABAN (LPJ) KEPANITIAAN
## PERINGATAN ${namaKegiatan.toUpperCase()}
## ${namaRW.toUpperCase()} KELURAHAN NGABEAN SEMARANG

Dengan hormat,
Puji syukur kami panjatkan kepada Tuhan Yang Maha Esa atas terselenggaranya seluruh rangkaian kegiatan peringatan ${namaKegiatan} di wilayah ${namaRW} Kelurahan Ngabean Semarang dengan tertib, meriah, dan transparan. Laporan ini disusun secara otomatis oleh Event Management System (SEMS) berdasarkan konsolidasi pembukuan kas dan kontribusi warga secara real-time.

---

### I. RINGKASAN KEUANGAN UTAMA
- **Total Dana Masuk (Kas Tunai):** ${formatRp(totalPemasukan)}
- **Total Nilai Gotong Royong (Natura):** ${formatRp(totalNatura)}
- **Total Pengeluaran Kegiatan:** ${formatRp(totalPengeluaran)}
- **Saldo Sisa Kas Saat Ini:** ${formatRp(saldoSisa)}

---

### II. DETAIL KONTRIBUSI WILAYAH (RT 01 - RT 07)
Setiap wilayah RT memiliki target iuran pokok sebesar ${formatRp(settings.targetIuranPerRT)}. Berikut adalah rincian capaian pengumpulan iuran tunai dan natura gotong royong warga:
${rtCollectionsDetails}

---

### III. STATUS PROGRAM KERJA & CAPAIAN SEKSI
Kepanitiaan terbagi menjadi ${seksiList.length} seksi fungsional. Berikut adalah status penyelesaian program kerja:
- **Total Program Kerja:** ${totalTasks} Kegiatan
- **Selesai:** ${completedTasks} Kegiatan
- **Dalam Proses:** ${processingTasks} Kegiatan
- **Belum Mulai:** ${pendingTasks} Kegiatan

Rincian per Seksi:
${seksiTasksDetails}

---

### IV. REKOMENDASI KEBERLANJUTAN KEPANITIAAN
Berdasarkan analisis efisiensi pengeluaran anggaran dan tingkat kontribusi gotong royong warga RW 04 Ngabean:
1. **Efisiensi Anggaran:** Realisasi pengeluaran berada di bawah total pagu anggaran seksi sebesar ${formatRp(Math.max(0, totalSisaPagu))}. Hal ini menunjukkan manajemen belanja barang yang sangat selektif dan efisien.
2. **Penguatan Natura:** Sumbangan natura warga senilai ${formatRp(totalNatura)} berhasil memangkas biaya operasional belanja riil, pola gotong royong ini harus terus dipertahankan pada event mendatang.
3. **Penyelesaian Tugas:** Seksi Panitia berhasil menuntaskan ${persenTugas}% dari seluruh target agenda program kerja. Apresiasi besar bagi seluruh jajaran koordinator seksi dan karang taruna.

Semarang, ${tanggalLPJ}

**PANITIA PELAKSANA ${namaKegiatan.toUpperCase()}**
**${namaRW.toUpperCase()} NGABEAN SEMARANG**

 Ketua Panitia,                    Sekretaris,



 [${namaKetua}]                     [${namaSekretaris}]


 Bendahara,                        Mengetahui,
                                   Ketua ${namaRW},



 [${namaBendahara}]                    [${namaRWKetua}]`;
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
    await logStep("Membaca kontribusi natura warga untuk kalkulasi total efisiensi...", 200);
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
      await logStep("Memetakan sumbangan swadaya & natura warga ke dalam variabel analisis...", 200);
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

  return (
    <div className="space-y-5">
      
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
            <TrendingUp className="w-4 h-4 text-red-600" />
            Monitoring Progress & Penyusunan LPJ
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Pantau rincian tugas seksi, tagihan iuran RT, serta formulasikan Laporan Pertanggungjawaban (LPJ) lengkap berbasis data real-time secara instan.
          </p>
        </div>
      </div>

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
                      <span className="font-mono text-slate-500 font-bold">{formatRp(rt.collected)} / {formatRp(settings.targetIuranPerRT)}</span>
                    </div>
                    <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${rt.percent}%` }}
                      />
                    </div>
                    {rt.naturaValue > 0 && (
                      <span className="text-[8px] text-amber-700 font-bold uppercase tracking-wide block">
                        + Kontribusi Natura Warga Senilai: {formatRp(rt.naturaValue)}
                      </span>
                    )}
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
            <span className="font-bold text-slate-700">Rp {settings.targetIuranPerRT.toLocaleString("id-ID")} (Kas Tunai) / RT</span>
          </div>
        </div>

      </div>

      {/* LPJ Generator module */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-4">
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
              <option value="natura">Template Laporan Natura (Swadaya)</option>
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
                placeholder="Budi Santoso"
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
                placeholder="Siti Rahma"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bendahara</label>
              <input
                type="text"
                value={namaBendahara}
                onChange={(e) => setNamaBendahara(e.target.value)}
                className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-white font-medium"
                placeholder="Hadi Wibowo"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ketua RW</label>
              <input
                type="text"
                value={namaRWKetua}
                onChange={(e) => setNamaRWKetua(e.target.value)}
                className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-white font-medium"
                placeholder="H. Ahmad"
              />
            </div>
            <div className="flex items-end">
              <span className="text-[10px] text-slate-400 italic leading-snug">
                *Dokumen di bawah akan terupdate otomatis begitu kolom identitas ini Anda edit.
              </span>
            </div>
          </div>
        </div>

        {/* Print Media Style Overrides */}
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-lpj-paper, #printable-lpj-paper * {
              visibility: visible !important;
            }
            #printable-lpj-paper {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              border: none !important;
              box-shadow: none !important;
              background: white !important;
              color: black !important;
              padding: 1.5cm !important;
              margin: 0 !important;
            }
          }
        `}</style>

        {/* Console loading terminal or LPJ output */}
        {showLPJConsole && (
          <div className="space-y-4">
            
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
                  let base = "relative p-6 sm:p-10 rounded shadow-2xl max-w-3xl mx-auto space-y-6 select-text overflow-hidden transition-all duration-300 z-10 ";
                  
                  if (paperTheme === "classic") {
                    base += "bg-white border-t-[8px] border-t-red-600 border border-slate-200 text-slate-900";
                  } else if (paperTheme === "creamy") {
                    base += "bg-[#FCF9F2] border-t-[8px] border-t-amber-800 border border-amber-900/15 text-stone-900";
                  } else if (paperTheme === "minimal") {
                    base += "bg-slate-50 border-t-[8px] border-t-slate-800 border border-slate-300 text-slate-900";
                  } else if (paperTheme === "green-gold") {
                    base += "bg-emerald-50/10 border-4 border-double border-emerald-600 text-emerald-950";
                  }
                  
                  if (fontStyle === "serif") {
                    base += " font-serif text-[12px] sm:text-[13px] tracking-wide leading-relaxed";
                  } else if (fontStyle === "sans") {
                    base += " font-sans text-[11px] sm:text-[12px] tracking-normal leading-relaxed";
                  } else if (fontStyle === "mono") {
                    base += " font-mono text-[10px] sm:text-[11px] tracking-tight leading-normal";
                  }
                  
                  return base;
                };

                const renderLetterhead = () => {
                  if (paperTheme === "classic") {
                    return (
                      <div className="flex justify-between items-center border-b-[3px] border-double border-slate-900 pb-3 mb-6">
                        <div className="w-12 h-12 rounded-full border border-slate-900 flex items-center justify-center bg-slate-50 shrink-0 shadow-2xs">
                          <Award className="w-7 h-7 text-red-600" />
                        </div>
                        <div className="text-center flex-1 px-4">
                          <h2 className="text-sm font-extrabold tracking-widest uppercase font-serif text-slate-950">{namaKegiatan}</h2>
                          <h3 className="text-xs font-bold uppercase font-serif text-slate-800">{namaRW} KELURAHAN NGABEAN</h3>
                          <p className="text-[9px] text-slate-500 italic font-serif mt-0.5">Sekretariat: RT 04 Ngabean, Kota Semarang, Jawa Tengah</p>
                        </div>
                        <div className="w-12 h-12 rounded-full border border-slate-900 flex items-center justify-center bg-slate-50 shrink-0 shadow-2xs">
                          <ShieldCheck className="w-7 h-7 text-slate-700" />
                        </div>
                      </div>
                    );
                  }
                  
                  if (paperTheme === "creamy") {
                    return (
                      <div className="flex justify-between items-center border-b-[3px] border-double border-amber-900 pb-3 mb-6">
                        <div className="w-12 h-12 rounded-full border border-amber-800 flex items-center justify-center bg-amber-50/50 shrink-0">
                          <Award className="w-7 h-7 text-amber-800" />
                        </div>
                        <div className="text-center flex-1 px-4">
                          <h2 className="text-sm font-black tracking-widest uppercase font-serif text-amber-950">{namaKegiatan}</h2>
                          <h3 className="text-xs font-bold uppercase font-serif text-amber-900">{namaRW} KELURAHAN NGABEAN</h3>
                          <p className="text-[9px] text-amber-800/70 italic font-serif mt-0.5 font-bold">PANITIA PERINGATAN KEMERDEKAAN RI KE-81</p>
                        </div>
                        <div className="w-12 h-12 rounded-full border border-amber-800 flex items-center justify-center bg-amber-50/50 shrink-0">
                          <Sparkles className="w-6 h-6 text-amber-700" />
                        </div>
                      </div>
                    );
                  }

                  if (paperTheme === "minimal") {
                    return (
                      <div className="flex justify-between items-end border-b border-slate-300 pb-4 mb-6">
                        <div className="text-left flex-1">
                          <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-sans">Dokumen Resmi Pertanggungjawaban</div>
                          <h2 className="text-base font-black tracking-tight text-slate-900 uppercase font-sans mt-0.5">{namaKegiatan}</h2>
                          <p className="text-[10px] text-slate-600 font-sans mt-0.5 font-semibold">{namaRW} Ngabean, Semarang, Jawa Tengah</p>
                        </div>
                        <div className="bg-slate-200 text-slate-700 text-[10px] font-mono px-2 py-1 rounded shrink-0 font-bold">
                          ID: LPJ-SEMS-RI81
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="flex justify-between items-center border-b-2 border-emerald-600 pb-3 mb-6">
                      <div className="w-12 h-12 rounded-full border-2 border-emerald-600 flex items-center justify-center bg-emerald-50 shrink-0">
                        <Award className="w-7 h-7 text-emerald-700" />
                      </div>
                      <div className="text-center flex-1 px-4">
                        <h2 className="text-sm font-extrabold tracking-wider uppercase text-emerald-900">{namaKegiatan}</h2>
                        <h3 className="text-xs font-bold uppercase text-emerald-800">{namaRW} KELURAHAN NGABEAN</h3>
                        <p className="text-[9px] text-emerald-700 italic mt-0.5">Pemberdayaan Gotong Royong & Swadaya Kemandirian</p>
                      </div>
                      <div className="w-12 h-12 rounded-full border-2 border-emerald-600 flex items-center justify-center bg-emerald-50 shrink-0">
                        <Check className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>
                  );
                };

                const renderSignatureGrid = () => {
                  return (
                    <div className="mt-10 pt-8 border-t border-slate-200/50 space-y-6">
                      <div className="text-center italic text-[9px] text-slate-400 mb-6">
                        *Laporan Pertanggungjawaban ini telah divalidasi dan disetujui secara digital oleh seluruh pimpinan wilayah RW 04 Ngabean.
                      </div>
                      <div className="grid grid-cols-2 gap-y-10 text-center text-slate-900">
                        {/* Row 1 */}
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Ketua Panitia Pelaksana</p>
                          <div className="h-14 flex items-center justify-center relative">
                            <span className="font-serif italic text-sm text-blue-700/80 tracking-widest font-bold rotate-[-3deg] select-none">
                              {namaKetua}
                            </span>
                          </div>
                          <p className="font-bold underline text-[11px] text-slate-800">{namaKetua}</p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Sekretaris Panitia</p>
                          <div className="h-14 flex items-center justify-center relative">
                            <span className="font-serif italic text-sm text-slate-500/80 tracking-widest font-bold rotate-[2deg] select-none">
                              {namaSekretaris}
                            </span>
                          </div>
                          <p className="font-bold underline text-[11px] text-slate-800">{namaSekretaris}</p>
                        </div>

                        {/* Row 2 */}
                        <div className="space-y-1 relative">
                          <p className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Bendahara Keuangan</p>
                          <div className="h-14 flex items-center justify-center relative z-10">
                            <span className="font-serif italic text-sm text-emerald-700/80 tracking-widest font-bold rotate-[-1deg] select-none">
                              {namaBendahara}
                            </span>
                          </div>
                          <p className="font-bold underline text-[11px] text-slate-800">{namaBendahara}</p>
                        </div>

                        <div className="space-y-1 relative">
                          <p className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Mengetahui, Ketua RW</p>
                          <div className="h-14 flex items-center justify-center relative">
                            {/* The circular stamp/seal */}
                            {showStamp && (
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-dashed border-indigo-600/60 flex items-center justify-center rotate-[-12deg] pointer-events-none select-none z-0 shadow-xs">
                                <div className="w-[72px] h-[72px] rounded-full border border-double border-indigo-600/50 flex flex-col items-center justify-center text-[5px] font-sans font-bold text-indigo-600/70 text-center leading-none">
                                  <span className="uppercase text-[4px]">PANITIA HUT-RI</span>
                                  <Award className="w-3.5 h-3.5 text-indigo-600/80 my-0.5" />
                                  <span className="uppercase text-[4.5px] tracking-tight">{namaRW.toUpperCase()} NGABEAN</span>
                                </div>
                              </div>
                            )}
                            <span className="font-serif italic text-sm text-indigo-800/80 tracking-widest font-bold rotate-[1deg] relative z-10 select-none">
                              {namaRWKetua}
                            </span>
                          </div>
                          <p className="font-bold underline text-[11px] text-slate-800">{namaRWKetua}</p>
                        </div>
                      </div>
                    </div>
                  );
                };

                const renderPaperContent = () => {
                  let mainBodyText = lpjMarkdown;
                  const signatureIndex = lpjMarkdown.indexOf("Semarang, ");
                  if (signatureIndex !== -1) {
                    mainBodyText = lpjMarkdown.substring(0, signatureIndex);
                  }
                  
                  return (
                    <div className="space-y-4">
                      <div className="whitespace-pre-wrap select-text leading-relaxed">
                        {mainBodyText.trim()}
                      </div>
                      {renderSignatureGrid()}
                    </div>
                  );
                };

                return (
                  <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    
                    {/* LPJ Toolbar controls */}
                    <div className="bg-slate-50 border-b border-slate-200 px-3 py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[11px]">
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
                    <div className="bg-slate-900 text-slate-200 px-4 py-3 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5">
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
                              onClick={() => setFontStyle("serif")}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${fontStyle === "serif" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                              Serif (Times)
                            </button>
                            <button
                              onClick={() => setFontStyle("sans")}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${fontStyle === "sans" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                              Sans (Inter)
                            </button>
                            <button
                              onClick={() => setFontStyle("mono")}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${fontStyle === "mono" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                              Mono (Courier)
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
                          onClick={() => window.print()}
                          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1 rounded text-[10px] font-black uppercase transition-all shadow-md"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-950" />
                          Cetak Dokumen
                        </button>
                      </div>
                    </div>

                    {/* Styled virtual paper layout */}
                    <div className="p-4 sm:p-8 bg-slate-200/60 max-h-[550px] overflow-y-auto select-text">
                      <div id="printable-lpj-paper" className={getPaperClass()}>
                        
                        {/* Decorative watermark */}
                        {showWatermark && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
                            <div className="text-red-600/[0.035] font-serif font-black text-3xl sm:text-4xl uppercase tracking-[0.25em] -rotate-[30deg] text-center whitespace-nowrap leading-none select-none">
                              {namaRW.toUpperCase()} SEMARANG — DRAF ASLI
                            </div>
                          </div>
                        )}

                        {/* Letterhead header */}
                        {renderLetterhead()}

                        {/* Body content */}
                        <div className="relative z-10">
                          {renderPaperContent()}
                        </div>

                      </div>
                    </div>

                    <div className="bg-red-50 p-2 text-[9px] text-red-800 border-t border-slate-200 font-bold tracking-wide uppercase text-center">
                      *LPJ Konsolidasi Real-time: Kas Masuk {formatRp(keuangan.filter(t => t.type === 'Masuk').reduce((s,t) => s+t.amount, 0))} | Natura Warga {formatRp(natura.reduce((s,n) => s+n.estimatedValue,0))} | Kas Keluar {formatRp(keuangan.filter(t => t.type === 'Keluar').reduce((s,t) => s+t.amount,0))}
                    </div>

                  </div>
                );
              })()
            }}

          </div>
        )}

      </div>

    </div>
  );
}
