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
**"Pengantar Pertanggungjawaban Kolektif & Ungkapan Syukur Kebersamaan Warga"**  
*Penyampai: Muh Zaenun (Ketua Panitia Peringatan HUT RI Ke-81 RW 04 Ngabean)*

---

*Assalamu’alaikum Warahmatullahi Wabarakatuh,*  
*Selamat malam, salam sejahtera, dan salam kemerdekaan bagi kita semua.*

Bapak-ibu hadirin sekalian yang kami hormati dan muliakan:
1. Bapak **Karto** selaku Ketua RW 04 Ngabean beserta seluruh jajaran Pengurus RW yang senantiasa membimbing kami;
2. Bapak dan Ibu Pengurus **RT 01, RT 02, RT 03, dan RT 04 Ngabean** yang luar biasa solid;
3. Segenap Pengelola **Pamsimas RW 04 Ngabean** atas dukungan dan kerjasamanya;
4. Para Sponsor Resmi (**Prettywear, Selo Agung, Apotek Gunungpati, BnD Shop, Ngrembel Asri, UMKM Kuliner Warga**) serta seluruh donatur dermawan;
5. Para sesepuh, pinisepuh, tokoh agama, tokoh masyarakat, rekan-rekan Karang Taruna, ibu-ibu PKK, serta seluruh warga RW 04 Ngabean yang kami banggakan dan cintai.

Puji dan syukur marilah senantiasa kita panjatkan ke hadirat Allah SWT, Tuhan Yang Maha Esa. Atas izin dan limpahan berkah-Nya, kita semua dapat berkumpul dalam keadaan sehat walafiat pada malam pleno ini guna menutup rangkaian Peringatan HUT Kemerdekaan Republik Indonesia Ke-81 di lingkungan RW 04 Ngabean yang telah berjalan sukses, aman, dan penuh kekeluargaan.

Malam hari ini, kami selaku panitia hadir di hadapan bapak-ibu sekalian untuk menunaikan amanah warga, yakni menyampaikan **Laporan Pertanggungjawaban (LPJ)** secara terbuka, jujur, dan apa adanya.

Perlu kami sampaikan dari lubuk hati yang paling dalam, bahwa **LPJ ini adalah bentuk kerja bersama dan tanggung jawab kolektif** seluruh jajaran panitia. Kesuksesan dan semarak acara kemarin bukanlah milik perorangan, melainkan buah dari keringat, tenaga, pikiran, serta keikhlasan seluruh warga RW 04.

Kami menyadari sepenuhnya, dalam proses persiapan hingga malam puncak kemarin, tentu ada kekurangan, salah kata, atau keterbatasan teknis. Untuk itu, dengan kerendahan hati, kami memohon maaf yang sebesar-besarnya kepada seluruh warga dan sesepuh sekalian.

Agar pemaparan malam ini tertib dan mudah dipahami bersama, laporan akan kami bagi ke dalam dua sesi:
1. **Laporan Pelaksanaan Kegiatan & Administrasi** yang akan disampaikan oleh Sekretaris Panitia, Bpk. Mawardi.
2. **Laporan Pengelolaan Keuangan & Saldo Kas** yang akan disampaikan oleh Bendahara Panitia, Ibu Dias Ayu.

Waktu selanjutnya, mari kita dengarkan bersama pemaparan dari rekan Sekretaris. Terima kasih.

*Wassalamu’alaikum Warahmatullahi Wabarakatuh.*`,

  sekretaris: `### NASKAH PIDATO PENYAMPAIAN LPJ — SEKRETARIS PANITIA
**"Laporan Pelaksanaan Kegiatan Lapangan & Tata Kelola Administrasi"**  
*Penyampai: Mawardi (Sekretaris Panitia HUT RI Ke-81 RW 04 Ngabean)*

---

*Assalamu’alaikum Warahmatullahi Wabarakatuh,*  
*Selamat malam bapak, ibu, dan seluruh warga RW 04 yang berbahagia.*

Terima kasih atas waktu yang diberikan oleh Ketua Panitia. Mewakili Divisi Kesekretariatan dan teman-teman panitia lapangan, izinkan kami melaporkan jalannya kegiatan perayaan HUT RI Ke-81 yang telah kita lalui bersama:

#### 1. Kilas Balik Kegiatan Warga
- **Lomba Anak-anak (01 s.d. 16 Agustus 2026):**  
  Berlangsung meriah di Lapangan RW 04. Anak-anak dari RT 01 sampai RT 04 tampak sangat antusias mengikuti berbagai lomba tradisional yang tidak hanya seru, tetapi juga melatih sportivitas sejak dini.
- **Malam Tirakatan & Lomba Keakraban (16 Agustus 2026):**  
  Dilaksanakan khidmat di Balai RW 04 diawali doa bersama dan pemotongan tumpeng wujud syukur kemerdekaan. Acara kemudian cair dan penuh gelak tawa berkat **Lomba Ibu-ibu Tebak Gaya**, **Lomba Bapak-bapak Pukul Paku**, serta **Lomba Remaja Estafet Sarung**.
- **Jalan Sehat Warga & Panggung Doorprize (23 Agustus 2026 Pagi):**  
  Diikuti ratusan warga dari anak-anak hingga sesepuh. Suasana semakin meriah dengan alunan musik dari **Band Sendang Bunder**, pembagian hadiah lomba anak, serta pengundian doorprize utama berupa **Mesin Cuci 2 Tabung dari Prettywear** serta berbagai voucher belanja UMKM kuliner warga.
- **Malam Puncak & Resepsi Rakyat (23 Agustus 2026 Malam):**  
  Sebagai penutup rangkaian, kita disuguhkan penampilan tarian indah dari anak-anak kita, dilanjutkan panggung hiburan **Dangdut Solo Organ** yang menjadi ajang silaturahmi akbar yang sangat menghibur.

#### 2. Catatan Administrasi
- Seluruh perizinan keramaian, surat-menyurat sponsor, notulensi rapat, hingga rekapitulasi data warga telah tertata rapi.
- Dokumen fisik pertanggungjawaban telah kami susun secara transparan dalam **3 Lampiran Resmi LPJ**:
  1. **Lampiran 1:** Buku Kas Umum (BKU) Penerimaan & Pengeluaran Kas
  2. **Lampiran 2:** Laporan Rekonsiliasi Pengembalian Dana Talangan Pamsimas & Realisasi Swadaya RT
  3. **Lampiran 3:** Kuitansi Penerimaan Sumbangan RT & Para Donatur serta Dokumentasi Foto Kegiatan

Demikian ringkasan kegiatan dan administrasi yang dapat kami laporkan. Waktu selanjutnya kami serahkan kepada Bendahara Panitia untuk memaparkan rincian keuangan. Terima kasih.

*Wassalamu’alaikum Warahmatullahi Wabarakatuh.*`,

  bendahara: `### NASKAH PIDATO PENYAMPAIAN LPJ — BENDAHARA PANITIA
**"Laporan Pertanggungjawaban Realisasi Anggaran, Rekonsiliasi Kas, & Sisa Saldo"**  
*Penyampai: Dias Ayu (Bendahara Panitia HUT RI Ke-81 RW 04 Ngabean)*

---

*Assalamu’alaikum Warahmatullahi Wabarakatuh,*  
*Selamat malam Bapak/Ibu, sesepuh, dan rekan-rekan seperjuangan panitia.*

Terima kasih kepada Ketua dan Sekretaris. Bapak-ibu sekalian yang kami hormati, malam ini saya melaporkan kondisi keuangan panitia secara terbuka, transparan, dan apa adanya tanpa ada yang ditutup-tutupi:

#### I. Total Pemasukan Kas Tunai: Rp 14.000.000,00
Dana kas bersih yang berhasil kita himpun bersumber dari 3 pos utama:
1. **Rp 8.000.000,00:** Iuran 4 RT (RT 01 s.d. RT 04 masing-masing Rp 2.000.000) melalui skema dana talangan Pamsimas. Panitia telah menyerahkan nota belanja fisik senilai Rp 2.000.000 ke masing-masing RT, dan alhamdulillah pelunasan ke Pamsimas kini sudah tuntas 100%.
2. **Rp 2.000.000,00:** Sumbangan sukarela murni (hibah) dari Pengelola Pamsimas RW 04 Ngabean.
3. **Rp 4.000.000,00:** Dukungan murni dari para Sponsor Resmi (*Prettywear, Selo Agung, Apotek Gunungpati, BnD Shop, Ngrembel Asri, UMKM Kuliner Warga*) serta donatur dermawan (termasuk kembalian efisiensi honor Tarling).

#### II. Realisasi Belanja Riil: Rp 12.618.000,00
Dari rencana anggaran awal sebesar Rp 17.550.000, berkat semangat swadaya konsumsi dan peralatan dari warga, kita berhasil melakukan efisiensi yang sangat baik sehingga total belanja riil hanya sebesar **Rp 12.618.000,00** dengan rincian:
- **BPH & Kesekretariatan:** Realisasi **Rp 523.000**
- **Divisi Acara Terpadu:** Realisasi **Rp 4.909.000**
- **Divisi Operasional Lapangan:** Realisasi **Rp 7.186.000**
*(Sumber dana belanja: Rp 10.000.000 dari Kas Utama + Rp 2.618.000 dari Kas Donasi).*

Seluruh nota kuitansi belanja asli sudah kami pegang lengkap dan diverifikasi bersama, tanpa ada sisa hutang sepeser pun.

#### III. Sisa Saldo Kas Bersih: Rp 1.382.000,00
Dari total pemasukan Rp 14.000.000 dikurangi total belanja Rp 12.618.000, kita memiliki sisa kas bersih sebesar **Rp 1.382.000,00**.

Sesuai hasil musyawarah bersama pengurus dan panitia, sisa efisiensi kas sponsor ini sebesar **Rp 1.382.000,00** dialokasikan untuk kegiatan **Konsolidasi Internal dan Pembubaran Panitia** (acara keakraban/ekskursi luar lingkungan) sebagai wujud apresiasi atas kerja keras rekan-rekan panitia yang telah berjuang berbulan-bulan demi suksesnya acara warga kita.

Demikian laporan pertanggungjawaban keuangan ini kami sampaikan. Atas kepercayaan dan dukungan bapak-ibu sekalian, kami ucapkan terima kasih yang sedalam-dalamnya.

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
