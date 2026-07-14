import React, { useState } from "react";
import { 
  BookOpen, 
  LayoutDashboard, 
  FileSpreadsheet, 
  Gift, 
  Wallet, 
  TrendingUp, 
  Users, 
  Settings, 
  HelpCircle, 
  Search,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Info
} from "lucide-react";

interface GuideTopic {
  id: string;
  title: string;
  icon: React.ElementType;
  category: "umum" | "fitur" | "sheets" | "faq";
  content: React.ReactNode;
}

export default function GuideBookView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"semua" | "umum" | "fitur" | "sheets" | "faq">("semua");
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>("pendahuluan");

  const topics: GuideTopic[] = [
    {
      id: "pendahuluan",
      title: "1. Pendahuluan & Konsep Utama SEMS",
      icon: BookOpen,
      category: "umum",
      content: (
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>
            Selamat datang di <strong>SEMS (Sistem Evaluasi & Monitoring Seksi) RW 04 Ngabean</strong>. Aplikasi ini dirancang khusus untuk memfasilitasi panitia penyelenggara dalam mengelola, memantau, dan melaporkan seluruh rangkaian persiapan hingga pelaksanaan kegiatan peringatan <strong>Hari Ulang Tahun Kemerdekaan Republik Indonesia Ke-81</strong> di lingkungan RW 04 Ngabean, Kelurahan Gunungpati, Kota Semarang.
          </p>
          
          <div className="bg-red-50 border border-red-200 p-3.5 rounded-lg text-slate-800 space-y-1">
            <h4 className="font-bold flex items-center gap-1.5 text-red-700 text-xs uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Misi Utama Aplikasi SEMS
            </h4>
            <p className="text-[11px] text-slate-600">
              Menghadirkan administrasi kepanitiaan yang transparan, akuntabel, dan bebas dari kerumitan pencatatan manual. Seluruh pengeluaran anggaran seksi dipantau secara real-time untuk mencegah <em>over-budget</em>, serta memudahkan pembuatan Laporan Pertanggungjawaban (LPJ) secara otomatis.
            </p>
          </div>

          <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] mt-4">Alur Kerja Sistem (Workflow)</h4>
          <ol className="list-decimal list-inside space-y-2 pl-1">
            <li>
              <strong>Perencanaan (RKBA):</strong> Setiap Seksi Panitia (Acara, Perlengkapan, Konsumsi, Humas, dll.) mengajukan draf kebutuhan belanja barang beserta estimasi harga dan kuantitas.
            </li>
            <li>
              <strong>Persetujuan & Kontrol Pagu:</strong> Bendahara/Ketua menyetujui anggaran belanja sesuai pagu batas anggaran yang ditentukan di Pengaturan Sistem.
            </li>
            <li>
              <strong>Penerimaan Dana (Kas):</strong> Sistem mencatat iuran warga per RT, sponsor, donatur tunai.
            </li>
            <li>
              <strong>Realisasi Belanja & Pembukuan:</strong> Panitia merealisasikan belanja dari draf RKBA yang disetujui. Pembukuan arus kas keluar (debet) tercatat otomatis tanpa harus input ulang di menu Keuangan.
            </li>
            <li>
              <strong>Pelaporan (LPJ & Monitoring):</strong> Progress kegiatan dipantau, sisa kas dihitung, dan draf LPJ siap dicetak/diunduh kapan saja.
            </li>
          </ol>
        </div>
      )
    },
    {
      id: "dashboard",
      title: "2. Dashboard Executive",
      icon: LayoutDashboard,
      category: "fitur",
      content: (
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>
            Menu ini adalah pusat kendali visual utama yang merangkum kesehatan finansial dan operasional kepanitiaan dalam grafik interaktif dan kartu indikator performa utama (KPI).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <h5 className="font-bold text-slate-800 text-[11px] mb-1">Indikator Keuangan Utama:</h5>
              <ul className="list-disc list-inside space-y-1 text-[10px] text-slate-500">
                <li><strong>Total Anggaran (RKBA):</strong> Jumlah dana yang direncanakan.</li>
                <li><strong>Realisasi Belanja:</strong> Dana aktual yang sudah dibayarkan.</li>
                <li><strong>Kas Tersedia:</strong> Sisa saldo kas riil saat ini.</li>
                <li><strong>Sisa Skuad Anggaran:</strong> Batas aman sisa perencanaan belanja.</li>
              </ul>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <h5 className="font-bold text-slate-800 text-[11px] mb-1">Visualisasi & Grafik:</h5>
              <ul className="list-disc list-inside space-y-1 text-[10px] text-slate-500">
                <li><strong>Grafik Alokasi Anggaran:</strong> Proporsi pagu belanja per seksi.</li>
                <li><strong>Statistik Partisipasi RT:</strong> Persentase pencapaian target iuran warga di tiap RT.</li>
                <li><strong>Log Kegiatan Terbaru:</strong> Daftar program kerja terdekat yang perlu dieksekusi.</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-800">
              <strong>Tips Professional:</strong> Selalu pantau persentase target iuran RT. Jika ada RT dengan persentase di bawah 50%, Humas dapat segera berkoordinasi dengan Ketua RT setempat untuk mempercepat penarikan iuran warga.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "rkba",
      title: "3. Pengelolaan RKBA & Realisasi Belanja Otomatis",
      icon: FileSpreadsheet,
      category: "fitur",
      content: (
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>
            <strong>RKBA (Rencana Kebutuhan Belanja & Anggaran)</strong> adalah modul paling krusial untuk mengunci rencana belanja panitia agar tidak melampaui batas anggaran (pagu) seksi.
          </p>

          <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Tiga Status Utama RKBA:</h4>
          <div className="space-y-2 pl-1">
            <div className="flex gap-2 items-start">
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[9px] font-bold rounded uppercase shrink-0 mt-0.5">DRAFT</span>
              <p className="text-[11px]">Usulan baru dari seksi. Belum memotong anggaran resmi dan belum bisa dibelanjakan. Masih bisa diedit atau dihapus.</p>
            </div>
            <div className="flex gap-2 items-start">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold rounded uppercase shrink-0 mt-0.5">DISETUJUI</span>
              <p className="text-[11px]">Draf telah ditinjau oleh Bendahara/Ketua dan dinyatakan sah. Nilai total anggaran terkunci di pagu seksi.</p>
            </div>
            <div className="flex gap-2 items-start">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded uppercase shrink-0 mt-0.5">BELANJA</span>
              <p className="text-[11px]">Barang telah dibeli secara fisik. Uang kas otomatis terpotong, dan kuitansi tercatat di buku kas keuangan.</p>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-lg space-y-1">
            <h5 className="font-bold text-emerald-800 text-xs flex items-center gap-1.5 uppercase">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Fitur Cerdas: "Realisasikan Belanja" Sekali Klik
            </h5>
            <p className="text-[10.5px] text-slate-700">
              Saat barang dengan status <strong>DISETUJUI</strong> telah dibeli, Anda tidak perlu repot membuka menu Keuangan dan menulis transaksi keluar secara manual. Cukup klik tombol <strong>"Realisasikan Belanja"</strong> di tabel RKBA. Sistem akan otomatis:
            </p>
            <ul className="list-disc list-inside text-[10px] text-slate-600 pl-2 space-y-0.5">
              <li>Mengubah status barang tersebut menjadi <strong>BELANJA</strong>.</li>
              <li>Menambahkan baris pengeluaran di menu <strong>Arus Kas Keuangan</strong> dengan kategori "RKBA Belanja".</li>
              <li>Menghubungkan transaksi kas dengan ID RKBA terkait (<em>Ref ID</em>) demi kebutuhan audit yang transparan.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "keuangan",
      title: "5. Pembukuan Arus Kas Keuangan",
      icon: Wallet,
      category: "fitur",
      content: (
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>
            Buku kas digital yang mencatat setiap rupiah masuk dan keluar. Arus kas yang rapi menjamin tidak akan terjadi selisih uang kas fisik di akhir acara.
          </p>

          <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Kategori Transaksi Kas:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg">
              <h5 className="font-bold text-emerald-800 text-[10.5px] uppercase mb-1">Transaksi Masuk</h5>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-600">
                <li><strong>Iuran RT:</strong> Setoran kas wajib dari tiap rukun tetangga.</li>
                <li><strong>Sponsorship:</strong> Dana kontribusi perusahaan / koperasi mitra.</li>
                <li><strong>Donasi Tunai:</strong> Sumbangan sukarela perorangan.</li>
              </ul>
            </div>
            <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-lg">
              <h5 className="font-bold text-rose-800 text-[10.5px] uppercase mb-1">Transaksi Keluar</h5>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-600">
                <li><strong>RKBA Belanja:</strong> Terbuat otomatis saat realisasi belanja barang.</li>
                <li><strong>Operasional:</strong> Biaya kuitansi kecil, transportasi panitia, ATK surat, dll.</li>
              </ul>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2.5">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-[10px] text-amber-800">
              <strong>Peringatan Keamanan Audit:</strong> Transaksi kas keluar dengan kategori <em>"RKBA Belanja"</em> sebaiknya tidak dihapus secara manual di halaman Keuangan. Jika ada kekeliruan, editlah status barang tersebut kembali ke "DISETUJUI" di halaman <strong>RKBA</strong> untuk menghapus catatan kas keluar tersebut secara aman.
            </div>
          </div>
        </div>
      )
    },
    {
      id: "sheets",
      title: "6. Sinkronisasi Google Sheets (Dua Arah / Bi-directional)",
      icon: FileSpreadsheet,
      category: "sheets",
      content: (
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>
            Fitur integrasi canggih yang menghubungkan database lokal aplikasi SEMS langsung ke spreadsheet cloud di <strong>Google Drive</strong> Anda. Anda dapat berkolaborasi menulis data bersama panitia lain di Google Sheets, lalu mengimpornya kembali ke aplikasi dalam hitungan detik.
          </p>

          <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Panduan Langkah-demi-Langkah Penggunaan Google Sheets:</h4>
          
          <div className="space-y-3.5 pl-1.5 border-l-2 border-red-500">
            <div>
              <h5 className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                <span className="w-4 h-4 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-[9px] font-bold">1</span>
                Hubungkan Akun Google Anda
              </h5>
              <p className="text-[10.5px] text-slate-500 pl-5">
                Buka tab <strong>"Google Sheets Sync"</strong> di sidebar. Klik <strong>"Masuk dengan Google"</strong>. Di jendela pop-up, masukkan akun Google Anda dan setujui izin untuk membaca dan menulis Google Drive serta Google Sheets.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                <span className="w-4 h-4 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-[9px] font-bold">2</span>
                Mempersiapkan Spreadsheet di Drive
              </h5>
              <p className="text-[10.5px] text-slate-500 pl-5">
                Klik tombol <strong>"Buat Spreadsheet Baru"</strong>. Aplikasi akan otomatis membuat file spreadsheet baru bernama <em>"Database SEMS RW 04 Ngabean (Tanggal)"</em> di dalam Google Drive Anda yang berisi 7 lembar kerja (sheets) dengan struktur tajuk kolom yang sesuai.
              </p>
              <p className="text-[10px] text-amber-700 pl-5 font-medium mt-1">
                <em>*Alternatif:* Jika Anda sudah memiliki spreadsheet sebelumnya, Anda dapat menempelkan URL atau ID spreadsheet Anda di kotak "Hubungkan Manual" lalu klik "Hubungkan ID".</em>
              </p>
            </div>

            <div>
              <h5 className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                <span className="w-4 h-4 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-[9px] font-bold">3</span>
                Melakukan Export Data (Aplikasi ke Google Sheets)
              </h5>
              <p className="text-[10.5px] text-slate-500 pl-5">
                Klik tombol <strong>"Export ke Google Sheets"</strong> di Langkah 3. Seluruh draf panitia, anggaran, realisasi, dan kas lokal yang sedang aktif saat ini akan langsung disalin bersih ke dalam spreadsheet Google Drive Anda.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                <span className="w-4 h-4 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-[9px] font-bold">4</span>
                Melakukan Import Data (Google Sheets ke Aplikasi)
              </h5>
              <p className="text-[10.5px] text-slate-500 pl-5">
                Jika Anda atau panitia lain mengedit data kepanitiaan secara masal, mengubah nama, atau menambah data langsung di Google Sheets, cukup buka aplikasi SEMS ini dan klik tombol <strong>"Import dari Google Sheets"</strong>. Seluruh database lokal aplikasi akan diselaraskan dengan data terbaru yang ada di spreadsheet awan Anda.
              </p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 p-3.5 rounded-lg text-slate-800 space-y-1">
            <h4 className="font-bold flex items-center gap-1.5 text-red-700 text-xs uppercase">
              <Lightbulb className="w-4 h-4 text-red-600" />
              Aturan Penting Pengeditan Spreadsheet:
            </h4>
            <p className="text-[10px] text-slate-600 leading-relaxed pl-1">
              - <strong>Jangan mengubah nama tab (sheet):</strong> Tab harus tetap bernama <em>Pengaturan, Panitia, Kegiatan, RKBA, Natura, Keuangan, dan Tasks</em>.<br />
              - <strong>Jangan menghapus baris pertama (header):</strong> Baris pertama pada setiap tab berisi label kolom utama yang dibaca oleh parser program. Mulailah menulis data baru Anda pada baris kedua.<br />
              - <strong>Gunakan format tanggal standar:</strong> Tulis tanggal dalam format <code>YYYY-MM-DD</code> (contoh: <code>2026-08-17</code>).
            </p>
          </div>
        </div>
      )
    },
    {
      id: "monitoring",
      title: "7. Monitoring Kegiatan & Pembuatan LPJ Otomatis",
      icon: TrendingUp,
      category: "fitur",
      content: (
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>
            Menu ini didedikasikan untuk melacak kemajuan tugas-tugas dari setiap Seksi Panitia dan menyajikan Laporan Pertanggungjawaban (LPJ) Kemerdekaan HUT RI Ke-81 secara instan dan rapi.
          </p>

          <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Fitur Monitoring Program Kerja:</h4>
          <p className="text-[11px] text-slate-500 pl-1">
            Menampilkan kartu tugas per seksi dengan indikator status: <strong>Belum Mulai</strong>, <strong>Sedang Proses</strong>, atau <strong>Selesai</strong>. Panitia dapat mengubah status tugas secara langsung dengan mengeklik kotak aksi guna memperbarui bilah persentase kemajuan (progress bar) keseluruhan program kerja.
          </p>

          <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Draf LPJ Kemerdekaan RI Ke-81 Otomatis:</h4>
          <p className="text-[11px] text-slate-500 pl-1">
            Sistem secara dinamis menyatukan seluruh laporan keuangan dan logistik ke dalam satu halaman formal yang mencakup:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-4 text-[11px] text-slate-600">
            <li>Surat pengantar penutupan kepanitiaan resmi tingkat RW 04 Ngabean.</li>
            <li>Rangkuman Neraca Saldo Keuangan (Total Masuk, Total Keluar, Sisa Saldo Riil).</li>
            <li>Lampiran Rincian Buku Kas Masuk dan Buku Kas Keluar secara kronologis.</li>
            <li>Lampiran Rincian Belanja Barang RKBA yang telah terealisasi.</li>
          </ul>
        </div>
      )
    },
    {
      id: "settings",
      title: "8. Konfigurasi Sistem",
      icon: Settings,
      category: "fitur",
      content: (
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>
            Gunakan menu <strong>"Pengaturan Sistem"</strong> untuk menyesuaikan parameter dasar program agar sesuai dengan kondisi riil di lingkungan RW Anda.
          </p>

          <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Parameter yang Dapat Disesuaikan:</h4>
          <ul className="list-disc list-inside space-y-1.5 pl-1 text-[11px]">
            <li>
              <strong>Daftar Rukun Tetangga (RT List):</strong> Daftarkan RT yang ada di wilayah RW Anda (contoh: <code>RT 01, RT 02, RT 03, RT 04, RT 05, RT 06</code>).
            </li>
            <li>
              <strong>Daftar Seksi Kepanitiaan (Seksi List):</strong> Tambah, kurangi, atau ubah seksi yang bertugas (contoh: <code>Acara, Perlengkapan, Konsumsi, Humas & Dokumentasi, Keamanan</code>).
            </li>
            <li>
              <strong>Target Iuran per RT (Rp):</strong> Atur target setoran kas yang disepakati untuk setiap RT (contoh: <code>Rp1.500.000</code>). Indikator pencapaian target di dashboard akan dihitung berdasarkan angka ini.
            </li>
            <li>
              <strong>Pagu Anggaran Seksi (Pagu Limit):</strong> Alokasikan batas nominal maksimal pengeluaran untuk setiap seksi guna mencegah pemborosan kas utama.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: "faq",
      title: "9. Pertanyaan Sering Diajukan (FAQ)",
      icon: HelpCircle,
      category: "faq",
      content: (
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <h5 className="font-bold text-slate-800 text-[11px]">Q: Mengapa halaman kembali ke dashboard setelah menambah data di aplikasi?</h5>
              <p className="text-[10.5px] text-slate-600">
                A: Masalah tersebut telah kami perbaiki sepenuhnya! Sekarang, aplikasi SEMS dilengkapi fitur <strong>Sesi Navigasi Mandiri</strong> menggunakan <code>localStorage</code> browser. Sistem akan selalu mengingat halaman aktif terakhir Anda, sehingga ketika Anda merefresh halaman atau memperbarui draf data, Anda akan tetap berada di halaman/menu yang sedang dikerjakan tanpa terlempar kembali ke dashboard.
              </p>
            </div>

            <div className="p-4 bg-red-50/50 border border-red-200 rounded-lg space-y-3.5">
              <h5 className="font-extrabold text-red-800 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-red-600 animate-pulse" />
                Q: Bagaimana Alur Pengembalian Dana Talangan Pamsimas?
              </h5>
              <div className="space-y-3 text-[11px] text-slate-600 leading-relaxed">
                <p>
                  Mengingat saldo kas awal kepanitiaan adalah <strong>Rp 0</strong> saat pembentukan, panitia mengandalkan pinjaman lunak awal dari pihak <strong>Pamsimas RW 04 Ngabean</strong> sebagai jembatan pembiayaan mendesak (pembelian ATK, panjar panggung, DP perlengkapan). Berikut adalah alur pertanggungjawaban & pelunasan dana talangan secara tertib di sistem:
                </p>
                
                <div className="relative pl-4 border-l-2 border-red-500 space-y-3">
                  <div>
                    <span className="font-bold text-slate-800 block">1. Pencatatan Pinjaman Masuk (Awal)</span>
                    <p className="text-slate-500 text-[10.5px]">
                      Saat dana diterima dari kas Pamsimas, bendahara menginput pemasukan kas dengan nominal pinjaman tersebut (misal Rp 1.500.000) menggunakan kategori <strong className="text-slate-700">"Dana Talangan / Pinjaman"</strong>. Ini merefleksikan posisi kewajiban hutang aktif panitia.
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">2. Realisasi Pengeluaran Awal</span>
                    <p className="text-slate-500 text-[10.5px]">
                      Dana tersebut dibelanjakan untuk urusan persiapan awal. Seluruh transaksi dicatat rapi melalui RKBA atau langsung di menu Buku Kas Pengeluaran.
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">3. Akumulasi Iuran Swadaya Warga (RT 01 - RT 04)</span>
                    <p className="text-slate-500 text-[10.5px]">
                      Iuran sukarela/wajib per RT mulai ditarik dan disetor oleh masing-masing Koordinator RT ke Bendahara. Begitu terkumpul, posisi kas utama panitia meningkat dan memiliki sisa saldo aman (net surplus).
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">4. Pembayaran Balik ke Pamsimas (Reimbursement)</span>
                    <p className="text-slate-500 text-[10.5px]">
                      Bendahara menarik tunai dari saldo kas utama sebesar nominal pinjaman awal untuk diserahkan kembali secara resmi kepada pengelola Pamsimas.
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">5. Pencatatan Pelunasan di Menu Keuangan SEMS</span>
                    <p className="text-slate-500 text-[10.5px]">
                      Untuk menyeimbangkan saldo akhir, bendahara wajib mencatat satu baris transaksi <strong className="text-rose-600 font-semibold">Kas Keluar</strong> sebesar nominal talangan tersebut dengan kategori <strong className="text-slate-700">"Pengembalian Dana Talangan"</strong> dan keterangan <em className="text-slate-500">"Pelunasan dana talangan awal Pamsimas RW 04"</em>.
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">6. Verifikasi Rekonsiliasi Otomatis pada LPJ</span>
                    <p className="text-slate-500 text-[10.5px]">
                      Sistem monitoring akan mendeteksi transaksi pengeluaran tersebut dan secara otomatis menetapkan status hutang talangan menjadi <strong className="text-emerald-600 uppercase font-extrabold text-[10px]">LUNAS (Rp 0)</strong> di BAB IV (Pertanggungjawaban Keuangan) Laporan Pertanggungjawaban (LPJ).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <h5 className="font-bold text-slate-800 text-[11px]">Q: Apakah saya perlu memiliki akun berbayar Google Cloud untuk fitur sinkronisasi?</h5>
              <p className="text-[10.5px] text-slate-600">
                A: Tidak. Fitur Google Sheets Sync ini menggunakan akun Google personal gratis Anda. Seluruh berkas spreadsheet yang dibuat akan tersimpan dengan aman di Google Drive Anda sendiri tanpa biaya langganan tambahan apa pun.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <h5 className="font-bold text-slate-800 text-[11px]">Q: Mengapa saya mendapatkan error 'Google API Error: Unauthorized (401)'?</h5>
              <p className="text-[10.5px] text-slate-600">
                A: Sesi token Google Anda kemungkinan telah kedaluwarsa demi alasan keamanan sistem. Silakan buka menu <strong>Google Sheets Sync</strong>, klik tombol <strong>"Keluar Akun"</strong> lalu lakukan <strong>"Masuk dengan Google"</strong> kembali untuk memperbarui token otorisasi Anda.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <h5 className="font-bold text-slate-800 text-[11px]">Q: Bagaimana cara memulihkan draf bawaan asli jika data rusak?</h5>
              <p className="text-[10.5px] text-slate-600">
                A: Anda dapat menggunakan tombol <strong>"Reset Database"</strong> yang berada di bagian paling bawah sidebar kiri. Konfirmasikan tindakan tersebut untuk mengembalikan seluruh tabel kepanitiaan HUT RI Ke-81 RW 04 Ngabean ke pengaturan draf awal default pabrik.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const filteredTopics = topics.filter(topic => {
    const matchesCategory = activeCategory === "semua" || topic.category === activeCategory;
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          topic.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleExpand = (id: string) => {
    if (expandedTopicId === id) {
      setExpandedTopicId(null);
    } else {
      setExpandedTopicId(id);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-amber-500"></div>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-50 rounded-xl text-red-600 shrink-0">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1 flex-1">
            <h1 className="text-lg font-extrabold text-slate-800 uppercase tracking-wide">Buku Panduan Penggunaan Aplikasi (SEMS)</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Panduan lengkap cara mengoperasikan Sistem Evaluasi & Monitoring Seksi (SEMS) RW 04 Ngabean untuk kepanitiaan perayaan HUT Kemerdekaan RI Ke-81 secara efektif, mandiri, dan profesional.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3.5 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari bab atau panduan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg pl-9 pr-4 py-2 bg-slate-50/50"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {(["semua", "umum", "fitur", "sheets", "faq"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider transition duration-150 ${
                activeCategory === cat 
                  ? "bg-red-600 text-white shadow-sm" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {cat === "semua" ? "Semua Bab" : cat === "umum" ? "Umum" : cat === "fitur" ? "Fitur Utama" : cat === "sheets" ? "Google Sheets" : "FAQ"}
            </button>
          ))}
        </div>
      </div>

      {/* Guide Topics Accordion List */}
      <div className="space-y-3">
        {filteredTopics.length > 0 ? (
          filteredTopics.map((topic) => {
            const TopicIcon = topic.icon;
            const isExpanded = expandedTopicId === topic.id;
            return (
              <div 
                key={topic.id}
                id={`guide-topic-${topic.id}`}
                className={`bg-white rounded-lg border transition duration-200 overflow-hidden ${
                  isExpanded ? "border-red-300 shadow-md ring-1 ring-red-100" : "border-slate-200 hover:border-slate-300 shadow-2xs"
                }`}
              >
                {/* Trigger */}
                <button
                  type="button"
                  onClick={() => toggleExpand(topic.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/40 transition duration-150 focus:outline-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${isExpanded ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}`}>
                      <TopicIcon className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-bold leading-tight ${isExpanded ? "text-slate-900 font-extrabold" : "text-slate-700"}`}>
                      {topic.title}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    topic.category === "umum" ? "bg-slate-100 text-slate-600" :
                    topic.category === "fitur" ? "bg-blue-50 text-blue-700" :
                    topic.category === "sheets" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {topic.category === "umum" ? "Umum" :
                     topic.category === "fitur" ? "Fitur" :
                     topic.category === "sheets" ? "Sheets" : "FAQ"}
                  </span>
                </button>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 bg-white">
                    {topic.content}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">Topik panduan tidak ditemukan.</p>
            <p className="text-[11px] text-slate-400">Pastikan ejaan pencarian Anda benar atau ubah kategori filter di atas.</p>
          </div>
        )}
      </div>

      {/* Quick Action Button to Return to Dashboard or Setup Sheet */}
      <div className="bg-slate-900 text-white rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-red-400">Butuh bantuan lebih lanjut?</h4>
          <p className="text-[10.5px] text-slate-400 leading-relaxed max-w-xl">
            Jika Anda mengalami kendala teknis tak terduga atau selisih data, segera hubungi sekretariat panitia HUT RI Ke-81 atau gunakan fitur reset database untuk memulai dari awal.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <div className="text-[11px] font-mono text-slate-400">
            SEMS v1.2-Stable
          </div>
        </div>
      </div>
    </div>
  );
}
