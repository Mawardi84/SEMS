import React, { useState } from "react";
import { LPJMaster } from "../types";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Volume2, 
  Printer, 
  X, 
  User, 
  RefreshCw, 
  Award, 
  FileText, 
  CheckCircle2, 
  Sliders 
} from "lucide-react";
import Markdown from "react-markdown";

interface LPJSpeechModalProps {
  isOpen: boolean;
  onClose: () => void;
  lpj?: LPJMaster;
  onGenerateSpeech: () => Promise<any>;
}

const DEFAULT_SPEECH_SCRIPTS = {
  ketua: `### NASKAH PIDATO PENYAMPAIAN LPJ — KETUA PANITIA PELAKSANA
**"Pengantar Pertanggungjawaban Kolektif & Semangat Gotong Royong Warga"**  
*Penyampai: Muh Zaenun (Ketua Panitia Peringatan HUT RI Ke-81 RW 04 Ngabean)*

---

*Assalamu’alaikum Warahmatullahi Wabarakatuh,*  
*Selamat malam, salam sejahtera, dan salam kemerdekaan bagi kita semua.*

**Yang kami hormati dan muliakan:**
1. Bapak **Karto** selaku Ketua RW 04 Ngabean beserta seluruh jajaran Pengurus RW;
2. Bapak dan Ibu Pengurus **RT 01, RT 02, RT 03, dan RT 04 Ngabean**;
3. Segenap Pengelola **Pamsimas RW 04 Ngabean**;
4. Para Sponsor Resmi (**Prettywear, Selo Agung, Apotek Gunungpati, BnD Shop, Ngrembel Asri, UMKM Kuliner Warga**) serta segenap Donatur Dermawan;
5. Para Sesepuh, Pinisepuh, Tokoh Agama, Tokoh Masyarakat, Rekan-rekan Karang Taruna, Ibu-ibu PKK, serta seluruh warga RW 04 Ngabean yang kami banggakan.

Puji dan syukur marilah kita panjatkan ke hadirat Tuhan Yang Maha Esa, karena atas limpahan berkah, kesehatan, dan persatuan, seluruh rangkaian kegiatan Peringatan HUT Kemerdekaan Republik Indonesia Ke-81 di lingkungan RW 04 Ngabean telah sukses terlaksana dengan aman, lancar, dan penuh semarak keguyuban.

Malam hari ini, kepanitiaan hadir di hadapan panjenengan semua dalam **Rapat Pleno Pertanggungjawaban** untuk menunaikan amanah tertinggi organisasi warga, yaitu menyampaikan **Laporan Pertanggungjawaban (LPJ)** secara jujur, transparan, dan akuntabel.

Sebagai Ketua Panitia, saya menegaskan bahwa **LPJ ini adalah bentuk pertanggungjawaban kolektif seluruh jajaran panitia**. Kesuksesan acara kita bukanlah kerja perseorangan, melainkan buah dari keringat, kerja keras, dan keikhlasan seluruh seksi kepanitiaan bersama dukungan swadaya warga RW 04 yang luar biasa.

Kami menyadari sepenuhnya bahwa dalam persiapan hingga pelaksanaan tentu masih terdapat kekurangan maupun kekhilafan. Dari lubuk hati yang paling dalam, kami memohon maaf yang sebesar-besarnya kepada seluruh warga dan sesepuh lingkungan atas segala keterbatasan fasilitas maupun kendala teknis.

Penyampaian LPJ malam ini kami bagi secara profesional ke dalam bidang teknis:
1. **Laporan Pelaksanaan Kegiatan & Tata Kelola Administrasi** akan dipaparkan oleh **Sekretaris Panitia (Bpk. Mawardi)**.
2. **Laporan Realisasi Keuangan, Rekonsiliasi Kas, dan Sisa Saldo** akan dipaparkan secara terperinci oleh **Bendahara Panitia (Ibu Dias Ayu)**.

Kepada rekan Sekretaris, kami persilakan untuk memulai pemaparan.

*Wassalamu’alaikum Warahmatullahi Wabarakatuh.*`,

  sekretaris: `### NASKAH PIDATO PENYAMPAIAN LPJ — SEKRETARIS PANITIA
**"Laporan Pelaksanaan Kegiatan Lapangan & Tata Kelola Administrasi"**  
*Penyampai: Mawardi (Sekretaris Panitia HUT RI Ke-81 RW 04 Ngabean)*

---

*Assalamu’alaikum Warahmatullahi Wabarakatuh,*  
*Selamat malam Bapak, Ibu, dan hadirin yang kami hormati.*

Terima kasih atas waktu yang diberikan oleh Ketua Panitia. Mewakili Divisi Kesekretariatan dan seluruh seksi kerja lapangan, izinkan kami melaporkan pelaksanaan program kerja HUT RI Ke-81 RW 04 Ngabean:

#### 1. Rangkaian Pelaksanaan Kegiatan Utama
- **Rangkaian Lomba Anak (01 s.d. 16 Agustus 2026):**  
  Telah terselenggara di Lapangan RW 04 dengan antusiasme luar biasa dari anak-anak RT 01 hingga RT 04 melalui berbagai perlombaan tradisional edukatif yang memupuk sportivitas dan rasa percaya diri.
- **Malam Tirakatan & Lomba Warga (16 Agustus 2026):**  
  Berlangsung khidmat di Balai RW 04 dengan doa bersama kemerdekaan dan pemotongan tumpeng. Dilanjutkan lomba keakraban antar-RT: **Lomba Ibu-ibu Tebak Gaya**, **Lomba Bapak-bapak Pukul Paku**, serta **Lomba Remaja Estafet Sarung**.
- **Jalan Sehat Warga & Panggung Doorprize (23 Agustus 2026 - Pagi/Siang):**  
  Diikuti ratusan warga lintas usia, dimeriahkan penampilan **Band Sendang Bunder**, penyerahan hadiah pemenang lomba anak-anak, serta pengundian ratusan hadiah doorprize dengan hadiah utama **Mesin Cuci 2 Tabung dari Prettywear** dan voucher belanja UMKM kuliner warga.
- **Malam Puncak / Resepsi & Hiburan Rakyat (23 Agustus 2026 - Malam):**  
  Panggung purna perayaan menampilkan **Pentas Seni Tari Anak-anak RW 04** serta pertunjukan musik **Dangdut Solo Organ** yang menjadi panggung silaturahmi akbar seluruh warga.

#### 2. Laporan Administrasi & Kearsipan
- Pengelolaan izin keramaian, surat permohonan sponsorship, notulensi rapat pleno, dan edaran iuran warga terlaksana tertib.
- Seluruh berkas pertanggungjawaban fisik tersusun dalam **3 Lampiran Resmi LPJ**:
  1. **Lampiran 1:** Buku Kas Umum (BKU) Penerimaan & Pengeluaran Kas
  2. **Lampiran 2:** Laporan Rekonsiliasi Pengembalian Dana Talangan Pamsimas & Realisasi Swadaya RT
  3. **Lampiran 3:** Kuitansi Penerimaan Sumbangan RT & Para Donatur serta Dokumentasi Foto Kegiatan

Demikian laporan pelaksanaan dan administrasi kami sampaikan. Waktu selanjutnya kami persilakan kepada Bendahara Panitia untuk memaparkan pertanggungjawaban keuangan.

*Wassalamu’alaikum Warahmatullahi Wabarakatuh.*`,

  bendahara: `### NASKAH PIDATO PENYAMPAIAN LPJ — BENDAHARA PANITIA
**"Laporan Pertanggungjawaban Realisasi Anggaran, Rekonsiliasi Kas, & Sisa Saldo"**  
*Penyampai: Dias Ayu (Bendahara Panitia HUT RI Ke-81 RW 04 Ngabean)*

---

*Assalamu’alaikum Warahmatullahi Wabarakatuh,*  
*Selamat malam Bapak/Ibu, sesepuh, dan rekan-rekan panitia yang kami hormati.*

Terima kasih kepada Ketua dan Sekretaris. Selaku Bendahara Panitia, saya menyampaikan laporan keuangan perbendaharaan yang terbuka, transparan, dan telah direkonsiliasi hingga rupiah terakhir:

#### I. Total Pemasukan Kas Tunai: Rp 14.000.000,00
Penerimaan kas bersih terhimpun dari 3 pilar:
1. **Rp 8.000.000,00:** Iuran 4 RT (RT 01 s.d. RT 04 @ Rp 2.000.000) melalui skema likuiditas dana talangan Pamsimas. Panitia telah menyerahkan fisik nota belanja Rp 2.000.000 ke masing-masing RT, dan pelunasan ke Pamsimas dinyatakan tuntas 100%.
2. **Rp 2.000.000,00:** Sumbangan sukarela murni (hibah) dari Pengelola Pamsimas RW 04 Ngabean.
3. **Rp 4.000.000,00:** Penerimaan murni dari Sponsor Resmi (*Prettywear, Selo Agung, Apotek Gunungpati, BnD Shop, Ngrembel Asri, UMKM Kuliner Warga*) dan para donatur dermawan.

#### II. Realisasi Belanja & Efisiensi Anggaran: Rp 12.618.000,00
Dari pagu rencana awal sebesar **Rp 17.550.000,00**, berkat swadaya konsumsi dan sound system warga, panitia berhasil menghemat anggaran sebesar **Rp 4.932.000,00** dengan rincian serapan belanja:
- **BPH & Kesekretariatan:** Pagu Rp 1.050.000 | Realisasi **Rp 523.000** (Serapan 50%)
- **Divisi Acara Terpadu:** Pagu Rp 5.300.000 | Realisasi **Rp 4.909.000** (Serapan 93%)
- **Divisi Operasional Lapangan:** Pagu Rp 11.200.000 | Realisasi **Rp 7.186.000** (Serapan 64%)
- **Total Belanja Riil:** **Rp 12.618.000,00** *(Dari Kas Utama Rp 10.000.000 + Dari Kas Donasi Rp 2.618.000)*.

Seluruh nota fisik kuitansi belanja asli senilai Rp 12.618.000 telah diverifikasi lengkap tanpa meninggalkan hutang satu rupiah pun.

#### III. Sisa Saldo Kas Bersih: Rp 1.382.000,00
Dari total penerimaan Rp 14.000.000 dikurangi belanja riil Rp 12.618.000, terdapat sisa kas bersih riil sebesar **Rp 1.382.000,00**.

Sisa efisiensi kas sponsor sebesar **Rp 1.382.000,00** ini, sesuai kesepakatan musyawarah panitia dan pengurus RW, dialokasikan untuk kegiatan **Konsolidasi Internal dan Pembubaran Panitia** (ekskursi keakraban di luar lingkungan) sebagai tanda terima kasih atas dedikasi tanpa lelah para pemuda dan relawan panitia.

Demikian pertanggungjawaban keuangan ini kami sampaikan dengan penuh kejujuran dan keterbukaan.

*Wassalamu’alaikum Warahmatullahi Wabarakatuh.*`
};

export default function LPJSpeechModal({
  isOpen,
  onClose,
  lpj,
  onGenerateSpeech
}: LPJSpeechModalProps) {
  const [activeRole, setActiveRole] = useState<"ketua" | "sekretaris" | "bendahara">("ketua");
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const scripts = {
    ketua: lpj?.speechScripts?.ketua || DEFAULT_SPEECH_SCRIPTS.ketua,
    sekretaris: lpj?.speechScripts?.sekretaris || DEFAULT_SPEECH_SCRIPTS.sekretaris,
    bendahara: lpj?.speechScripts?.bendahara || DEFAULT_SPEECH_SCRIPTS.bendahara
  };

  const currentContent = scripts[activeRole] || DEFAULT_SPEECH_SCRIPTS[activeRole];

  const handleCopy = () => {
    if (!currentContent) return;
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onGenerateSpeech();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegenerating(false);
    }
  };

  const roleTitles = {
    ketua: {
      title: "Ketua Panitia",
      speaker: lpj?.ketuaNameSnapshot || "Muh Zaenun",
      subtitle: "Pengantar & Penegasan Pertanggungjawaban Akhir",
      badgeClass: "bg-red-50 text-red-700 border-red-200",
      icon: Award
    },
    sekretaris: {
      title: "Sekretaris",
      speaker: lpj?.sekretarisNameSnapshot || "Mawardi",
      subtitle: "Laporan Pelaksanaan & Administrasi Kegiatan",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      icon: FileText
    },
    bendahara: {
      title: "Bendahara",
      speaker: lpj?.bendaharaNameSnapshot || "Dias Ayu",
      subtitle: "Laporan Keuangan, Perubahan Anggaran, & Rekonsiliasi",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: Volume2
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scale-in print:h-auto print:shadow-none print:border-none">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest bg-red-600 text-white px-2 py-0.5 rounded">
                  Naskah Resmi
                </span>
                <span className="text-xs text-slate-300 font-mono">Bahan Pidato Sidang Pleno</span>
              </div>
              <h3 className="text-base font-extrabold text-white tracking-tight mt-0.5">
                Naskah Pidato LPJ (Ketua, Sekretaris & Bendahara)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-600 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Perbarui naskah menggunakan sinkronisasi data real-time"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin text-amber-400" : ""}`} />
              {isRegenerating ? "Menyusun..." : "Sinkronkan Naskah"}
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div className="bg-slate-100/80 border-b border-slate-200 px-4 pt-3 flex gap-2 overflow-x-auto shrink-0 print:hidden">
          {(["ketua", "sekretaris", "bendahara"] as const).map((role) => {
            const info = roleTitles[role];
            const isActive = activeRole === role;
            const Icon = info.icon;
            return (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer border-t border-x ${
                  isActive
                    ? "bg-white text-slate-900 border-slate-200 shadow-3xs"
                    : "bg-transparent text-slate-500 border-transparent hover:text-slate-700"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-red-600" : "text-slate-400"}`} />
                <div className="text-left">
                  <div className="leading-tight flex items-center gap-1.5">
                    <span>{info.title}</span>
                    <span className="text-[10px] font-normal text-slate-400">({info.speaker})</span>
                  </div>
                  <div className="text-[9px] font-normal text-slate-400 hidden sm:block">
                    {role === "ketua" ? "Bab A & G (Pengantar & Selesai)" : role === "sekretaris" ? "Bab B & C (Kegiatan & Administrasi)" : "Bab D, E & F (Keuangan & Saldo)"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Role Meta Subheader */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${roleTitles[activeRole].badgeClass}`}>
              {roleTitles[activeRole].title}: {roleTitles[activeRole].speaker}
            </span>
            <span className="text-slate-600 font-medium hidden sm:inline">{roleTitles[activeRole].subtitle}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition cursor-pointer"
              title="Cetak Naskah Pidato"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Cetak Naskah</span>
            </button>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Salin Naskah</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body with Markdown Rendering */}
        <div className="flex-1 overflow-y-auto p-6 font-sans text-slate-800 bg-white leading-relaxed print:p-0 print:overflow-visible">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="prose prose-sm max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h3:text-base prose-h4:text-sm prose-p:text-xs prose-p:leading-relaxed prose-li:text-xs">
              <Markdown>{currentContent}</Markdown>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono shrink-0 print:hidden">
          <span>Sistem Evaluasi & Monitoring SEMS RW 04 Ngabean</span>
          <span>Naskah dapat dibacakan langsung dari smartphone/tablet saat Sidang Pleno LPJ.</span>
        </div>
      </div>
    </div>
  );
}
