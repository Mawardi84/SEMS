import { SEMSData } from '../types';

export const initialData: SEMSData = {
  settings: {
    id: "rw04_sems_config",
    rtList: ["RT 01", "RT 02", "RT 03", "RT 04"],
    seksiList: [
      "Sekretaris",
      "Bendahara",
      "Humas",
      "Acara",
      "Seksi Lomba",
      "Seksi Pentas Seni",
      "Perlengkapan",
      "Konsumsi",
      "Keamanan dan Kebersihan",
      "Seksi Dokumentasi dan Publikasi",
      "Seksi Dana Usaha",
      "Seksi Hadiah Dan Doorprize"
    ],
    targetIuranPerRT: 1500000,
    paguAnggaranSeksi: {
      "Sekretaris": 1000000,
      "Bendahara": 1000000,
      "Humas": 1000000,
      "Acara": 3000000,
      "Seksi Lomba": 2000000,
      "Seksi Pentas Seni": 3000000,
      "Perlengkapan": 4000000,
      "Konsumsi": 5000000,
      "Keamanan dan Kebersihan": 1000000,
      "Seksi Dokumentasi dan Publikasi": 1000000,
      "Seksi Dana Usaha": 1000000,
      "Seksi Hadiah Dan Doorprize": 2000000
    },
    sheetId: "1SEMS_RW04_NGABEAN_SPREADSHEET_ID_XYZ123",
    sheetApiKey: "AIzaSyFakeKey_SEMS_GoogleSheetsAPI_2026",
    themeColor: "red",
    kopLine1: "PANITIA PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81",
    kopLine2: "RUKUN WARGA 04 KELURAHAN NGABEAN",
    kopLine3: "Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah",
    kopLine4: "Sekretariat: Balai RW 04 Ngabean, Telp: +62 812-3456-7890 | Kode Pos: 50141",
    logoStyle: "flag",
    logoUrl: "",
    kopStyle: "classic-centered"
  },
  panitia: [],
  kegiatan: [],
  rkba: [],
  keuangan: [],
  tasks: [],
  notulensi: [
    {
      id: "notulensi_seed_1",
      title: "Rapat Pleno I Persiapan HUT RI Ke-81",
      date: "Kamis, 2 Juli 2026",
      time: "19:30 - 22:00 WIB",
      location: "Balai RW 04 Ngabean",
      leader: "Ketua Panitia",
      attendeesCount: 18,
      attendeesList: "Ketua RW, Sekretaris, Bendahara, Humas, Acara, Perlengkapan, Konsumsi, Perwakilan RT",
      agenda: "1. Pengesahan Struktur Kepanitiaan HUT RI Ke-81\n2. Pembahasan Pagu Anggaran Rencana Kebutuhan Barang dan Jasa (RKBA)\n3. Rencana Target Pendanaan",
      notesRaw: "- Struktur kepanitiaan secara resmi disahkan oleh Ketua RW 04 Ngabean.\n- Bendahara mengonfirmasi pagu anggaran tiap Seksi disesuaikan dengan pagu batas operasional (Sekretaris, Bendahara, Humas, Lomba, Perlengkapan, dll).\n- Humas melaporkan target iuran per RT sebesar Rp 1.500.000 dengan target terkumpul maksimal akhir Juli.\n- Seksi Acara merancang draf rangkaian kegiatan dimulai 10 Agustus 2026.",
      decisions: "- Menetapkan kepanitiaan HUT RI Ke-81 dipimpin oleh Ketua Panitia.\n- Menyepakati pagu batas operasional seksi-seksi panitia.\n- Memulai penarikan dana serentak di 4 RT mulai 5 Juli 2026.",
      contentMarkdown: "# NOTULENSI RAPAT KOORDINASI KEPANITIAAN\n## RAPAT PLENO I PERSIAPAN HUT RI KE-81\n**HUT KEMERDEKAAN REPUBLIK INDONESIA KE-81 - RW 04 NGABEAN**\n\n---\n\n### I. IDENTITAS & INFORMASI RAPAT\n- **Hari / Tanggal** : Kamis, 2 Juli 2026\n- **Waktu**          : 19:30 - 22:00 WIB\n- **Tempat**         : Balai RW 04 Ngabean\n- **Pimpinan Rapat** : Ketua Panitia\n- **Jumlah Peserta** : 18 Orang\n- **Daftar Hadir**   : Ketua RW, Sekretaris, Bendahara, Humas, Acara, Perlengkapan, Konsumsi, Perwakilan RT\n\n---\n\n### II. AGENDA RAPAT\n1. Pengesahan Struktur Kepanitiaan HUT RI Ke-81\n2. Pembahasan Pagu Anggaran Rencana Kebutuhan Barang dan Jasa (RKBA)\n3. Rencana Target Pendanaan\n\n---\n\n### III. RINGKASAN PEMBAHASAN & HASIL JALANNYA RAPAT\nBerikut adalah rincian jalannya musyawarah mufakat perwakilan panitia RW 04 Ngabean:\n\n- **Pengesahan Struktur Kepanitiaan**: Struktur organisasi kepanitiaan secara resmi disahkan oleh Ketua RW 04 Ngabean Semarang. Kepemimpinan utama diamanatkan kepada Ketua Panitia.\n- **Pagu Anggaran Operasional**: Bendahara mengonfirmasi rancangan pagu anggaran tiap seksi agar disesuaikan dengan pagu batas operasional di sistem utama SEMS demi menjaga efisiensi anggaran belanja.\n- **Target Pendanaan**: Humas melaporkan target per RT ditetapkan merata sebesar Rp 1.500.000,00 dengan tenggat waktu setoran kas selambat-lambatnya akhir Juli 2026.\n- **Rancangan Acara**: Seksi Acara merancang draf pembukaan serta rangkaian lomba kemerdekaan yang dijadwalkan dimulai pada tanggal 10 Agustus 2026.\n\n---\n\n### IV. KEPUTUSAN UTAMA RAPAT\nKeputusan mutlak yang disetujui secara bulat oleh seluruh peserta sidang pleno:\n\n- Menetapkan susunan pengurus kepanitiaan HUT RI Ke-81 dipimpin oleh Ketua Panitia.\n- Menyepakati batas operasional anggaran RKBA per seksi sesuai data master sistem.\n- Meluncurkan penarikan dana serentak di seluruh wilayah RT 01-04 mulai tanggal 5 Juli 2026.\n\n---\n\n### V. RENCANA TINDAK LANJUT (ACTION PLAN)\nAktivitas lanjutan taktis yang wajib diselesaikan oleh penanggung jawab masing-masing seksi:\n\n| No | Rencana Tindak Lanjut / Tugas | Seksi Penanggung Jawab (PIC) | Batas Waktu (Deadline) |\n| :--- | :--- | :--- | :--- |\n| 1 | Menyosialisasikan formulir ke pengurus lingkungan | Humas | 10 Juli 2026 |\n| 2 | Mengunggah rincian draf awal anggaran RKBA seksi ke sistem SEMS | Sekretaris | 8 Juli 2026 |\n| 3 | Menyiapkan draf rundown dan teknis lomba kemerdekaan | Acara | 12 Juli 2026 |\n\n---\n\n### VI. PENUTUP & PENGESAHAN DOKUMEN\nDemikian berita acara rapat koordinasi ini disusun dengan sebenarnya untuk dijadikan acuan koordinasi seluruh panitia pelaksana.\n\nSemarang, 2 Juli 2026\n\n**Pembuat Notulen (Sekretaris)**\nKepanitiaan HUT RI Ke-81 RW 04 Ngabean",
      actionItems: [
        { id: "ai_0", task: "Menyosialisasikan formulir ke pengurus lingkungan", pic: "Humas", deadline: "10 Juli 2026" },
        { id: "ai_1", task: "Mengunggah rincian draf awal anggaran RKBA seksi ke sistem SEMS", pic: "Sekretaris", deadline: "8 Juli 2026" },
        { id: "ai_2", task: "Menyiapkan draf rundown dan teknis lomba kemerdekaan", pic: "Acara", deadline: "12 Juli 2026" }
      ],
      createdAt: "2026-07-02T15:00:00.000Z"
    }
  ],
  documents: [],
  undangan: []
};
