import express from "express";
import path from "path";
import fs from "fs";
import HTMLtoDOCX from "html-to-docx";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { initialData } from "./src/data/initialData.js";
import { SEMSData, RKBAItem, KeuanganTransaction, Panitia, Kegiatan, SeksiTask } from "./src/types.js";

dotenv.config();

// Lazy initialize GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it via Settings > Secrets.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Safe resolution of directory path for both ESM development and bundled CJS production compatibility
const currentDirname = (() => {
  try {
    if (typeof import.meta !== "undefined" && import.meta.url) {
      return dirname(fileURLToPath(import.meta.url));
    }
  } catch (e) {
    // Fallback to __dirname or process.cwd()
  }
  return typeof __dirname !== "undefined" ? __dirname : process.cwd();
})();

const DB_PATH = path.join(currentDirname, "db.json");

// Local DB Helper
function readDB(): SEMSData {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf8");
      return initialData;
    }
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed.notulensi) {
      parsed.notulensi = [];
    }
    if (!parsed.documents) {
      parsed.documents = [];
    }
    if (!parsed.undangan) {
      parsed.undangan = [];
    }
    return parsed;
  } catch (error) {
    console.error("Error reading db.json, returning initialData:", error);
    return initialData;
  }
}

function writeDB(data: SEMSData) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing db.json:", error);
  }
}

async function startServer() {
  
async function generateWithRetry(client: any, options: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.models.generateContent(options);
    } catch (error: any) {
      const isRetryable = 
        error?.status === "UNAVAILABLE" || 
        error?.status === 503 || 
        error?.message?.includes("503") || 
        error?.message?.includes("high demand") || 
        error?.status === 429 || 
        error?.message?.includes("429") ||
        error?.message?.includes("quota") ||
        error?.message?.includes("RESOURCE_EXHAUSTED");

      if (isRetryable && attempt < maxRetries) {
        const delay = attempt * 5000;
        console.warn(`Gemini API busy or quota limit (attempt ${attempt}), retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
      throw error;
    }
  }
}

const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API - Export to Word
  app.post("/api/export-to-word", async (req, res) => {
    try {
      const { htmlContent } = req.body;
      const fullHtml = `<!DOCTYPE html><html><body>${htmlContent}</body></html>`;
      const docx = await HTMLtoDOCX(fullHtml, undefined, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename=document.docx');
      res.send(Buffer.from(docx as ArrayBuffer));
    } catch (error) {
      console.error("Word export failed:", error);
      res.status(500).json({ success: false, error: "Gagal mengekspor ke Word." });
    }
  });

  // API - Get all SEMS data
  app.get("/api/sems/data", (req, res) => {
    const data = readDB();
    res.json(data);
  });

  // API - Reset to initial data
  app.post("/api/sems/reset", (req, res) => {
    writeDB(initialData);
    res.json({ success: true, message: "Database berhasil direset ke kondisi awal." });
  });

  // API - Update Settings
  app.post("/api/sems/settings", (req, res) => {
    const db = readDB();
    db.settings = { ...db.settings, ...req.body };
    writeDB(db);
    res.json({ success: true, settings: db.settings });
  });

  // API - Sync/Import full SEMS data from Google Sheets
  app.post("/api/sems/sync-import", (req, res) => {
    const data = req.body as SEMSData;
    if (!data || !data.settings) {
      return res.status(400).json({ success: false, error: "Format data tidak valid." });
    }
    writeDB(data);
    res.json({ success: true, message: "Database berhasil disinkronisasi dari Google Sheets!" });
  });

  // API - CRUD Panitia
  app.post("/api/sems/panitia", (req, res) => {
    const db = readDB();
    const { action, data } = req.body as { action: 'add' | 'edit' | 'delete'; data: Panitia };
    
    if (action === 'add') {
      db.panitia.push({ ...data, id: 'panitia_' + Date.now() });
    } else if (action === 'edit') {
      db.panitia = db.panitia.map(p => p.id === data.id ? data : p);
    } else if (action === 'delete') {
      db.panitia = db.panitia.filter(p => p.id !== data.id);
    }
    
    writeDB(db);
    res.json({ success: true, panitia: db.panitia });
  });

  // API - CRUD Kegiatan
  app.post("/api/sems/kegiatan", (req, res) => {
    const db = readDB();
    const { action, data } = req.body as { action: 'add' | 'edit' | 'delete'; data: Kegiatan };
    
    if (action === 'add') {
      db.kegiatan.push({ ...data, id: 'kegiatan_' + Date.now() });
    } else if (action === 'edit') {
      db.kegiatan = db.kegiatan.map(k => k.id === data.id ? data : k);
    } else if (action === 'delete') {
      db.kegiatan = db.kegiatan.filter(k => k.id !== data.id);
    }
    
    writeDB(db);
    res.json({ success: true, kegiatan: db.kegiatan });
  });

  // API - CRUD RKBA (Rencana Kebutuhan Barang dan Anggaran)
  app.post("/api/sems/rkba", (req, res) => {
    const db = readDB();
    const { action, data } = req.body as { action: 'add' | 'edit' | 'delete' | 'approve' | 'reject'; data: RKBAItem };
    
    if (action === 'add') {
      const newItem: RKBAItem = {
        ...data,
        id: 'rkba_' + Date.now(),
        total: data.qty * data.price,
        dateAdded: new Date().toISOString().split('T')[0]
      };
      db.rkba.push(newItem);
    } else if (action === 'edit') {
      const updatedItem = {
        ...data,
        total: data.qty * data.price
      };
      db.rkba = db.rkba.map(r => r.id === data.id ? updatedItem : r);
    } else if (action === 'delete') {
      db.rkba = db.rkba.filter(r => r.id !== data.id);
    } else if (action === 'approve') {
      // Approve RKBA item
      db.rkba = db.rkba.map(r => {
        if (r.id === data.id) {
          return { ...r, status: 'Disetujui' as const };
        }
        return r;
      });
    } else if (action === 'reject') {
      // Reject RKBA item
      db.rkba = db.rkba.map(r => {
        if (r.id === data.id) {
          return { ...r, status: 'Ditolak' as const };
        }
        return r;
      });
    }
    
    writeDB(db);
    res.json({ success: true, rkba: db.rkba });
  });

  // API - Record Approved RKBA directly to Keuangan Ledger (Satu-klik Belanja)
  app.post("/api/sems/rkba/belanja", (req, res) => {
    const db = readDB();
    const rkbaId = req.body.id || req.body.rkbaId;
    
    if (!rkbaId) {
      return res.status(400).json({ success: false, error: "ID RKBA diperlukan." });
    }
    
    const rkbaItem = db.rkba.find(r => r.id === rkbaId);
    
    if (!rkbaItem) {
      return res.status(404).json({ success: false, error: "Item RKBA tidak ditemukan" });
    }
    
    if (rkbaItem.status !== "Disetujui") {
      return res.status(400).json({ success: false, error: "Hanya item RKBA yang berstatus 'Disetujui' yang dapat dicatat belanjanya." });
    }

    // Check if already recorded to avoid double ledger record
    const exists = db.keuangan.some(t => t.refId === rkbaId);
    if (exists) {
      return res.status(400).json({ success: false, error: "Belanja untuk item RKBA ini sudah pernah dicatat di Keuangan." });
    }

    // Determine category based on seksi
    const tx: KeuanganTransaction = {
      id: 'tx_rkba_' + Date.now(),
      type: 'Keluar',
      date: new Date().toISOString().split('T')[0],
      category: 'RKBA Belanja',
      amount: rkbaItem.total,
      notes: `Belanja RKBA: ${rkbaItem.name} (${rkbaItem.qty} ${rkbaItem.unit} @ Rp ${rkbaItem.price.toLocaleString('id-ID')}) oleh Seksi ${rkbaItem.seksi}`,
      refId: rkbaId
    };

    // Update RKBA status to "Belanja"
    db.rkba = db.rkba.map(r => r.id === rkbaId ? { ...r, status: 'Belanja' as any } : r);

    db.keuangan.push(tx);
    writeDB(db);

    res.json({ 
      success: true, 
      rkba: db.rkba, 
      keuangan: db.keuangan, 
      message: "Belanja RKBA berhasil dibukukan ke Keuangan!" 
    });
  });

  app.post("/api/sems/analyze-budget-ai", async (req, res) => {
    try {
      const { rkba, keuangan, kegiatan, settings } = req.body;
      const ai = getGeminiClient();
      
      const prompt = `Sebagai analis keuangan kegiatan organisasi kepanitiaan yang bijak, tolong berikan analisis "Smart Budget" terhadap anggaran kegiatan berikut ini. 

DATA KEGIATAN:
${JSON.stringify(kegiatan)}

RENCANA KEBUTUHAN BARANG & ANGGARAN (RKBA):
${JSON.stringify(rkba)}

TARGET IURAN PER RT:
${settings.targetIuranPerRT}

Berdasarkan data RKBA di atas:
1. Evaluasi apakah harga satuan (unit price) wajar atau berpotensi overbudget (Markup). 
2. Berikan analisis proporsi anggaran per seksi. Apakah ada seksi yang terlalu mendominasi dana yang tidak wajar?
3. Rekomendasi efisiensi/penghematan cerdas yang bisa dilakukan panitia.
4. Tampilkan prediksi apakah kas ini sehat jika ditunjang dari "Target Iuran" dan opsi "Sponsorship".

Berikan hasil analisis dalam format Markdown dengan bahasa yang profesional, tegas, tetapi suportif. Format dengan heading, bullet points, dan penekanan (bold) yang rapi.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      
      const analysis = response.text;
      res.json({ success: true, analysis });
    } catch (error: any) {
      console.error("AI Budget Analysis Error:", error);
      res.status(500).json({ success: false, error: error.message || "Gagal menganalisis anggaran dengan AI." });
    }
  });

  // API - CRUD Keuangan
  app.post("/api/sems/keuangan", (req, res) => {
    const db = readDB();
    const { action, data } = req.body as { action: 'add' | 'edit' | 'delete'; data: KeuanganTransaction };
    
    if (action === 'add') {
      db.keuangan.push({ ...data, id: 'tx_' + Date.now() });
    } else if (action === 'edit') {
      db.keuangan = db.keuangan.map(t => t.id === data.id ? data : t);
    } else if (action === 'delete') {
      // If deleted, check if we need to remove refId association or just delete
      db.keuangan = db.keuangan.filter(t => t.id !== data.id);
    }
    
    writeDB(db);
    res.json({ success: true, keuangan: db.keuangan });
  });

  // API - CRUD Seksi Tasks
  app.post("/api/sems/tasks", (req, res) => {
    const db = readDB();
    const { action, data } = req.body as { action: 'add' | 'edit' | 'delete' | 'toggle'; data: SeksiTask };
    
    if (action === 'add') {
      db.tasks.push({ ...data, id: 'task_' + Date.now() });
    } else if (action === 'edit') {
      db.tasks = db.tasks.map(t => t.id === data.id ? data : t);
    } else if (action === 'delete') {
      db.tasks = db.tasks.filter(t => t.id !== data.id);
    } else if (action === 'toggle') {
      db.tasks = db.tasks.map(t => {
        if (t.id === data.id) {
          const nextStatusMap = { 'Belum': 'Proses', 'Proses': 'Selesai', 'Selesai': 'Belum' } as const;
          return { ...t, status: nextStatusMap[t.status] };
        }
        return t;
      });
    }
    
    writeDB(db);
    res.json({ success: true, tasks: db.tasks });
  });

  // API - AI-powered LPJ Generation using Gemini API
  app.post("/api/sems/generate-lpj-ai", async (req, res) => {
    try {
      const db = readDB();
      const {
        templateType,
        namaKegiatan,
        namaRW,
        tanggalLPJ,
        namaKetua,
        namaSekretaris,
        namaBendahara,
        namaRWKetua
      } = req.body as {
        templateType: "formal" | "ringkas";
        namaKegiatan: string;
        namaRW: string;
        tanggalLPJ: string;
        namaKetua: string;
        namaSekretaris: string;
        namaBendahara: string;
        namaRWKetua: string;
      };

      // Calculate aggregates
      const totalPemasukan = db.keuangan.filter(t => t.type === 'Masuk').reduce((sum, t) => sum + t.amount, 0);
      const totalPengeluaran = db.keuangan.filter(t => t.type === 'Keluar').reduce((sum, t) => sum + t.amount, 0);
      const saldoSisa = totalPemasukan - totalPengeluaran;
      const totalTasks = db.tasks.length;
      const completedTasks = db.tasks.filter(t => t.status === 'Selesai').length;
      const processingTasks = db.tasks.filter(t => t.status === 'Proses').length;
      const pendingTasks = db.tasks.filter(t => t.status === 'Belum').length;
      const persenTugas = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Summary of RT Collections
      const rtCollectionsSummary = db.settings.rtList.map((rtName) => {
        const collected = db.keuangan
          .filter(t => t.type === 'Masuk' && t.category === 'Iuran RT' && t.notes.includes(rtName))
          .reduce((sum, t) => sum + t.amount, 0);
        const target = db.settings.targetIuranPerRT;
        const pct = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 100;
        return `- **${rtName} Ngabean:** Iuran Tunai Rp ${collected.toLocaleString('id-ID')} (${pct}% lunas dari target Rp ${target.toLocaleString('id-ID')})`;
      }).join('\n');

      // Summary of top 30 transactions
      const keuanganSummary = db.keuangan.map(t => {
        return `- [Tanggal ${t.date}] [Kas ${t.type}] Rp ${t.amount.toLocaleString('id-ID')} (${t.category}) - ${t.notes}`;
      }).slice(0, 30).join('\n') + (db.keuangan.length > 30 ? "\n- ... (dan transaksi penunjang lainnya)" : "");

      // Summary of tasks
      const tasksSummary = db.tasks.map(t => {
        return `- [Status: ${t.status}] ${t.taskName} (Penanggungjawab: Seksi ${t.seksi})`;
      }).join('\n');

      const client = getGeminiClient();

      const systemInstruction = `Anda adalah Sekretaris Keuangan dan Humas yang sangat profesional untuk kepanitiaan warga di Indonesia.
Tugas Anda adalah merumuskan naskah Laporan Pertanggungjawaban (LPJ) yang indah, rapi, transparan, dan mengesankan dalam Bahasa Indonesia formal dan hangat.

PANDUAN PENULISAN:
1. Tulis laporan dengan nada yang profesional, penuh rasa syukur, apresiatif terhadap swadaya gotong royong warga, dan akuntabel.
2. Gunakan markdown untuk struktur yang rapi (gunakan ## untuk judul bagian, tebalkan kata-kata penting).
3. Anda diberikan data real-time berupa iuran warga, dana talangan dari Pamsimas, daftar program kerja, dan riwayat transaksi. Seluruh angka keuangan dan statistik di dalam laporan harus 100% konsisten dengan data yang diberikan! Jangan pernah mengarang angka yang berbeda.
4. Tulis konten yang lengkap, berbobot, dan bernilai sastra/formal yang tinggi, hindari penjelasan yang dipotong atau berupa placeholder kosong.
5. Format mata uang menggunakan penulisan rupiah Indonesia standar (misal: Rp 1.500.000).

KETENTUAN PENTING UNTUK LAYOUT:
- JANGAN menyertakan KOP SURAT (Letterhead) di bagian paling atas karena Kop Surat sudah digambar secara dinamis oleh sistem di kertas cetak.
- JANGAN menulis baris tanda tangan atau tabel tanda tangan di bagian paling bawah karena sistem sudah memiliki grid tanda tangan digital yang rapi.
- Cukup akhiri laporan Anda dengan menulis baris tanggal persis seperti berikut di baris paling akhir:
  Semarang, [Isi Tanggal LPJ]
- Setelah baris tanggal tersebut, jangan tulis apa pun lagi (jangan beri nama orang, jabatan, atau garis kosong).

PANDUAN KHUSUS UNTUK TEMPLATE "${templateType}":
- Jika template "formal": Tulis naskah laporan lengkap resmi 12 HALAMAN. Anda WAJIB menggunakan pembatas horizontal "---" sebagai PEMISAH HALAMAN antar bagian/bab.
  STRUKTUR 12 HALAMAN WAJIB:
  Halaman 1: Sampul Utama Laporan (Tulis # LAPORAN PERTANGGUNGJAWABAN (LPJ) diikuti subjudul panitia HUT RI)
  ---
  Halaman 2: ### HALAMAN JUDUL (Identitas lengkap pengajuan laporan)
  ---
  Halaman 3: ### LEMBAR PENGESAHAN (Uraian singkat penandatanganan, JANGAN buat daftar nama tanda tangan, sistem otomatis menyematkan di bagian bawah)
  ---
  Halaman 4: ### KATA PENGANTAR (Ucapan syukur, maksud penyusunan, apresiasi warga)
  ---
  Halaman 5: ### DAFTAR ISI (Daftar 12 poin struktur LPJ lengkap)
  ---
  Halaman 6: ### BAB I. PENDAHULUAN (Latar belakang HUT RI Ke-81, Dasar kegiatan, dan Tujuan)
  ---
  Halaman 7: ### BAB II. PERENCANAAN KEGIATAN (Uraian kepanitiaan dan rancangan jadwal, JANGAN buat bagan, sistem otomatis menyisipkan bagan struktur organisasi di bawah)
  ---
  Halaman 8: ### BAB III. PELAKSANAAN KEGIATAN (Uraian detail perlombaan, tirakatan, jalan sehat, dan persentase capaian)
  ---
  Halaman 9: ### BAB IV. PERTANGGUNGJAWABAN KEUANGAN (Uraian posisi kas, pengelolaan dana talangan awal dari Pamsimas yang telah dikembalikan seiring terkumpulnya iuran RT, JANGAN buat tabel keuangan/realisasi, sistem otomatis menyisipkan tabel realisasi seksi, RT, dan neraca saldo di bawah)
  ---
  Halaman 10: ### BAB V. EVALUASI (Analisis kendala lapangan, solusi taktis, dan rekomendasi kepanitiaan mendatang)
  ---
  Halaman 11: ### BAB VI. PENUTUP (Uraian akhir, ungkapan terima kasih mendalam, permohonan maaf, harapan masa depan)
  ---
  Halaman 12: ### LAMPIRAN (Daftar dokumen pelengkap, absen, nota belanja)
  Pastikan Anda menyelesaikan dan menulis KESELURUHAN 12 halaman tersebut secara lengkap dengan penjelasan komprehensif tanpa terputus. Jarak antar halaman dipisahkan tepat dengan "---".
- Jika template "ringkas": Tulis naskah laporan ringkas/eksekutif yang ditujukan langsung untuk warga. Nada penulisan sangat guyub, hangat, santun, dan fokus pada kebersamaan. Sebutkan angka-angka utama (Kas Masuk, Kas Keluar, Sisa Kas, Swadaya Tunai), apresiasi kerukunan warga, rincian singkat kemeriahan program kerja, dan penutup yang menyentuh hati. Gunakan "---" untuk memisahkan halaman jika perlu.`;

      const prompt = `Formulasikan laporan pertanggungjawaban dengan data rill berikut:
Nama Kegiatan: ${namaKegiatan}
Wilayah / RW: ${namaRW}
Tanggal LPJ: ${tanggalLPJ}
Nama Ketua Panitia: ${namaKetua}
Nama Sekretaris: ${namaSekretaris}
Nama Bendahara: ${namaBendahara}
Nama Ketua RW: ${namaRWKetua}
Template Dokumen: ${templateType}

=== DATA AGREGASI PEMBUKUAN REAL-TIME ===
1. Total Pemasukan Kas Tunai: Rp ${totalPemasukan.toLocaleString('id-ID')}
2. Total Realisasi Pengeluaran Kas: Rp ${totalPengeluaran.toLocaleString('id-ID')}
3. Saldo Kas Sisa Akhir: Rp ${saldoSisa.toLocaleString('id-ID')}

=== PROGRESS PROGRAM KERJA ===
- Total Program Kerja: ${totalTasks} program
- Selesai & Sukses: ${completedTasks} program
- Dalam Proses: ${processingTasks} program
- Belum Terlaksana: ${pendingTasks} program
- Persentase Keberhasilan: ${persenTugas}%

=== RINCIAN CATATAN KAS MASUK & KELUAR ===
${keuanganSummary}

=== RINCIAN IURAN TUNAI PER RT ===
${rtCollectionsSummary}

=== RINCIAN TUGAS PROGRAM KERJA PER SEKSI ===
${tasksSummary}

Silakan susun draf laporan pertanggungjawaban sesuai dengan instruksi sistem. Pastikan untuk menulis ulasan analisis yang mendalam, kaya bahasa, dan mengesankan. Dan pastikan di baris paling akhir naskah diakhiri dengan kalimat: Semarang, ${tanggalLPJ}`;

      const response = await generateWithRetry(client, {
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.8,
          maxOutputTokens: 8192,
        }
      });

      const lpjText = response.text || "";
      res.json({ success: true, lpj: lpjText });
    } catch (error: any) {
      console.error("AI LPJ Generation Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Gagal berkomunikasi dengan Gemini AI. Pastikan GEMINI_API_KEY Anda sudah terkonfigurasi di Settings > Secrets."
      });
    }
  });

  // API - AI-powered Proposal Generation using Gemini API
  app.post("/api/sems/generate-proposal-ai", async (req, res) => {
    try {
      const db = readDB();
      const {
        templateType,
        namaKegiatan,
        namaRW,
        tanggalProposal,
        namaKetua,
        namaSekretaris,
        namaBendahara,
        namaRWKetua,
        sponsorshipPackages
      } = req.body as {
        templateType: "formal" | "ringkas" | "sponsor";
        namaKegiatan: string;
        namaRW: string;
        tanggalProposal: string;
        namaKetua: string;
        namaSekretaris: string;
        namaBendahara: string;
        namaRWKetua: string;
        sponsorshipPackages?: { name: string; benefit: string; price?: number }[];
      };

      // Calculate aggregates
      const totalRAB = db.rkba.reduce((sum, r) => sum + r.total, 0);
      const totalTargetIuran = db.settings.targetIuranPerRT * db.settings.rtList.length;
      const targetSponsorship = Math.max(0, totalRAB - totalTargetIuran);
      const totalTasks = db.tasks.length;

      // Summary of Tasks for Proposal
      const tasksSummary = db.tasks.map(t => {
        return `- ${t.taskName} (Seksi Pelaksana: ${t.seksi})`;
      }).join('\n');

      // Summary of RAB for Proposal
      const rabSummary = db.rkba.map(r => {
        return `- Seksi ${r.seksi} - ${r.name}: Rp ${r.total.toLocaleString('id-ID')}`;
      }).join('\n');

      const client = getGeminiClient();

      const systemInstruction = `Anda adalah Sekretaris Keuangan dan Humas yang sangat profesional untuk kepanitiaan warga di Indonesia.
Tugas Anda adalah merumuskan naskah PROPOSAL KEGIATAN yang indah, meyakinkan, rapi, transparan, dan mengesankan dalam Bahasa Indonesia formal.

PANDUAN PENULISAN:
1. Tulis proposal dengan nada yang persuasif, visioner, dan menumbuhkan semangat kebersamaan/gotong royong warga.
2. Gunakan markdown untuk struktur yang rapi (gunakan ## untuk judul bagian, tebalkan kata-kata penting).
3. Anda diberikan data rencana anggaran belanja (RAB), rencana program kerja, dan target pendanaan. Seluruh angka keuangan dan statistik di dalam proposal harus 100% konsisten dengan data yang diberikan!
4. Tulis konten yang lengkap, berbobot, dan bernilai sastra/formal yang tinggi, hindari penjelasan yang dipotong atau berupa placeholder kosong. Buatkan Latar Belakang dan Tujuan Kegiatan yang sangat relevan dengan HUT RI atau kegiatan warga.
5. Format mata uang menggunakan penulisan rupiah Indonesia standar (misal: Rp 1.500.000).

KETENTUAN PENTING UNTUK LAYOUT:
- JANGAN menyertakan KOP SURAT (Letterhead) di bagian paling atas karena Kop Surat sudah digambar secara dinamis oleh sistem di kertas cetak.
- JANGAN menulis baris tanda tangan atau tabel tanda tangan di bagian paling bawah karena sistem sudah memiliki grid tanda tangan digital yang rapi.
- Cukup akhiri proposal Anda dengan menulis baris tanggal persis seperti berikut di baris paling akhir:
  Semarang, [Isi Tanggal Proposal]
- Setelah baris tanggal tersebut, jangan tulis apa pun lagi (jangan beri nama orang, jabatan, atau garis kosong).

PANDUAN STRIKTIF DUPLIKASI DAN HARGA SPONSORSHIP:
- JANGAN PERNAH menyertakan informasi susunan panitia (seperti ketua, sekretaris, bendahara, atau bagan) di halaman lain mana pun selain Halaman 4 (BAB II. SUSUNAN PANITIA).
- JANGAN PERNAH menyertakan informasi tabel sponsorship atau harga paket di halaman lain mana pun selain Halaman 7 (BAB V. PENAWARAN KERJASAMA SPONSORSHIP).
- Anda WAJIB menyematkan 3 kategori paket sponsorship dengan harga rill berikut di Halaman 7 (BAB V):
  * Paket Platinum: Rp 3.000.000
  * Paket Gold: Rp 2.500.000
  * Paket Silver: Rp 1.500.000

PANDUAN KHUSUS UNTUK TEMPLATE "${templateType}":
- Jika template "formal": Tulis naskah proposal lengkap resmi. Anda WAJIB menggunakan pembatas horizontal "---" sebagai PEMISAH HALAMAN antar bab.
  STRUKTUR 8 HALAMAN WAJIB:
  Halaman 1: Judul Utama Proposal (misal: # PROPOSAL KEGIATAN)
  ---
  Halaman 2: ### KATA PENGANTAR
  ---
  Halaman 3: ### BAB I. PENDAHULUAN (Latar Belakang & Tujuan)
  ---
  Halaman 4: ### BAB II. SUSUNAN PANITIA (PENTING: Judul bab WAJIB persis seperti ini. Cukup tulis 1 paragraf pengantar saja tentang kepanitiaan. JANGAN BUAT BAGAN/DAFTAR NAMA, karena sistem yang akan menyisipkan bagan otomatis secara dinamis di sini).
  ---
  Halaman 5: ### BAB III. RENCANA PROGRAM KERJA (PENTING: Judul bab WAJIB persis seperti ini. Cukup tulis 1 paragraf pengantar saja. JANGAN BUAT TABEL, karena sistem yang akan menyisipkan tabel otomatis secara dinamis di sini).
  ---
  Halaman 6: ### BAB IV. RENCANA ANGGARAN BIAYA (RAB) (PENTING: Judul bab WAJIB persis seperti ini. Cukup tulis 1 paragraf pengantar saja. JANGAN BUAT TABEL, karena sistem yang akan menyisipkan tabel otomatis secara dinamis di sini).
  ---
  Halaman 7: ### BAB V. PENAWARAN KERJASAMA SPONSORSHIP (PENTING: Judul bab WAJIB persis seperti ini. Uraikan keuntungan BRAND EXPOSURE bagi sponsor secara persuasif dan sebutkan rincian 3 paket sponsorship yang tersedia dengan harga berikut: Paket Platinum Rp 3.000.000, Paket Gold Rp 2.500.000, Paket Silver Rp 1.500.000).
  ---
  Halaman 8: ### BAB VI. PENUTUP
  Pastikan Anda menyelesaikan dan menulis KESELURUHAN 8 halaman tersebut dengan penjelasan komprehensif, jangan berhenti di tengah jalan.
- Jika template "ringkas": Tulis naskah proposal ringkas/eksekutif summary. Nada penulisan persuasif to-the-point. Sebutkan latar belakang singkat, program utama, 3 paket sponsorship yang tersedia (Platinum Rp 3.000.000, Gold Rp 2.500.000, Silver Rp 1.500.000), dan total kebutuhan dana. Gunakan "---" untuk memisahkan halaman jika perlu.
- Jika template "sponsor": Tulis naskah PROPOSAL PENAWARAN KERJASAMA SPONSORSHIP. Gunakan "---" pada baris baru sebagai pemisah halaman.
  STRUKTUR 8 HALAMAN WAJIB:
  Halaman 1: Judul & Tema Kegiatan Sponsorship (Prospectus)
  ---
  Halaman 2: ### KATA PENGANTAR (Visi & Misi Kerjasama)
  ---
  Halaman 3: ### BAB I. PENDAHULUAN (Latar Belakang & Tujuan Kegiatan)
  ---
  Halaman 4: ### BAB II. SUSUNAN PANITIA (Cukup tulis 1 paragraf pengantar saja. JANGAN BUAT BAGAN, karena sistem akan menyisipkan Bagan Panitia otomatis di bawah teks Anda).
  ---
  Halaman 5: ### BAB III. RENCANA PROGRAM KERJA (Rincian Acara. Cukup tulis 1 paragraf pengantar saja. JANGAN BUAT TABEL, karena sistem akan menyisipkan Daftar Acara otomatis di bawah teks Anda).
  ---
  Halaman 6: ### BAB IV. RENCANA ANGGARAN BIAYA (RAB) (Cukup tulis 1 paragraf pengantar saja. JANGAN BUAT TABEL, karena sistem akan menyisipkan Rekapitulasi RAB otomatis di bawah teks Anda).
  ---
  Halaman 7: ### BAB V. PENAWARAN KERJASAMA SPONSORSHIP (PENTING: Judul bab WAJIB persis seperti ini. Uraikan keuntungan BRAND EXPOSURE bagi sponsor secara persuasif dan sebutkan rincian 3 paket sponsorship yang tersedia dengan harga rill berikut: Paket Platinum Rp 3.000.000, Paket Gold Rp 2.500.000, Paket Silver Rp 1.500.000).
  ---
  Halaman 8: ### BAB VI. PENUTUP (Harapan dan ajakan kerjasama).
  Pastikan Anda menulis KESELURUHAN 8 halaman tersebut.`;

      const prompt = `Formulasikan proposal kegiatan dengan data rill berikut:
Nama Kegiatan: ${namaKegiatan}
Wilayah / RW: ${namaRW}
Tanggal Proposal: ${tanggalProposal}
Nama Ketua Panitia: ${namaKetua}
Nama Sekretaris: ${namaSekretaris}
Nama Bendahara: ${namaBendahara}
Nama Ketua RW: ${namaRWKetua}
Template Dokumen: ${templateType}

=== RENCANA AGREGASI PENDANAAN ===
1. Total Rencana Anggaran Biaya (RAB): Rp ${totalRAB.toLocaleString('id-ID')}
2. Proyeksi Iuran Warga (${db.settings.rtList.length} RT): Rp ${totalTargetIuran.toLocaleString('id-ID')}
3. Target Sponsorship / Donatur: Rp ${targetSponsorship.toLocaleString('id-ID')}

=== RENCANA PROGRAM KERJA ===
Total Program Kerja: ${totalTasks} kegiatan
Rincian Agenda:
${tasksSummary}

=== RINCIAN RENCANA ANGGARAN BIAYA ===
${rabSummary}

${sponsorshipPackages ? `=== PAKET SPONSORSHIP YANG DITAWARKAN ===\n${sponsorshipPackages.map(p => `- **Paket ${p.name}** (Harga: Rp ${p.price ? p.price.toLocaleString('id-ID') : 0}): ${p.benefit}`).join('\n')}` : ""}

Silakan susun draf proposal kegiatan sesuai dengan instruksi sistem. Pastikan untuk menulis latar belakang yang meyakinkan, kaya bahasa, dan mengesankan. Dan pastikan di baris paling akhir naskah diakhiri dengan kalimat: Semarang, ${tanggalProposal}`;

      const response = await generateWithRetry(client, {
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.8,
          maxOutputTokens: 8192,
        }
      });

      const proposalText = response.text || "";
      res.json({ success: true, proposal: proposalText });
    } catch (error: any) {
      console.error("AI Proposal Generation Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Gagal berkomunikasi dengan Gemini AI. Pastikan GEMINI_API_KEY Anda sudah terkonfigurasi di Settings > Secrets."
      });
    }
  });

  // API - CRUD Notulensi (Meeting Minutes)
  app.post("/api/sems/notulensi", (req, res) => {
    try {
      const db = readDB();
      const { action, data } = req.body as { action: 'add' | 'edit' | 'delete'; data: any };
      
      if (action === 'add') {
        const existingIndex = db.notulensi.findIndex((n: any) => n.id === data.id);
        if (existingIndex >= 0) {
          db.notulensi[existingIndex] = { ...data, createdAt: db.notulensi[existingIndex].createdAt || new Date().toISOString() };
        } else {
          const newItem = {
            ...data,
            id: data.id || 'notulensi_' + Date.now(),
            createdAt: data.createdAt || new Date().toISOString()
          };
          db.notulensi.push(newItem);
        }
      } else if (action === 'edit') {
        db.notulensi = db.notulensi.map(n => n.id === data.id ? { ...data, createdAt: n.createdAt || new Date().toISOString() } : n);
      } else if (action === 'delete') {
        db.notulensi = db.notulensi.filter(n => n.id !== data.id);
      }
      
      writeDB(db);
      res.json({ success: true, notulensi: db.notulensi });
    } catch (error: any) {
      console.error("Notulensi CRUD Error:", error);
      res.status(500).json({ success: false, error: error.message || "Gagal memproses data notulensi." });
    }
  });

  // API - CRUD Digital Documents
  app.post("/api/sems/documents", (req, res) => {
    try {
      const db = readDB();
      const { action, data } = req.body as { action: 'add' | 'edit' | 'delete'; data: any };
      
      if (!db.documents) {
        db.documents = [];
      }

      if (action === 'add') {
        const existingIndex = db.documents.findIndex((d: any) => d.id === data.id);
        if (existingIndex >= 0) {
          db.documents[existingIndex] = { ...data, uploadDate: db.documents[existingIndex].uploadDate || new Date().toISOString() };
        } else {
          const newItem = {
            ...data,
            id: data.id || 'doc_' + Date.now(),
            uploadDate: data.uploadDate || new Date().toISOString()
          };
          db.documents.push(newItem);
        }
      } else if (action === 'edit') {
        db.documents = db.documents.map(d => d.id === data.id ? { ...data, uploadDate: d.uploadDate || new Date().toISOString() } : d);
      } else if (action === 'delete') {
        db.documents = db.documents.filter(d => d.id !== data.id);
      }
      
      writeDB(db);
      res.json({ success: true, documents: db.documents });
    } catch (error: any) {
      console.error("Documents CRUD Error:", error);
      res.status(500).json({ success: false, error: error.message || "Gagal memproses data dokumen." });
    }
  });

  // API - CRUD Undangan Rapat (Meeting Invitations)
  app.post("/api/sems/undangan", (req, res) => {
    try {
      const db = readDB();
      const { action, data } = req.body as { action: 'add' | 'edit' | 'delete'; data: any };
      
      if (!db.undangan) {
        db.undangan = [];
      }

      if (action === 'add') {
        const existingIndex = db.undangan.findIndex((u: any) => u.id === data.id);
        if (existingIndex >= 0) {
          db.undangan[existingIndex] = { ...data, createdAt: db.undangan[existingIndex].createdAt || new Date().toISOString() };
        } else {
          const newItem = {
            ...data,
            id: data.id || 'undangan_' + Date.now(),
            createdAt: data.createdAt || new Date().toISOString()
          };
          db.undangan.push(newItem);
        }
      } else if (action === 'edit') {
        db.undangan = db.undangan.map(u => u.id === data.id ? { ...data, createdAt: u.createdAt || new Date().toISOString() } : u);
      } else if (action === 'delete') {
        db.undangan = db.undangan.filter(u => u.id !== data.id);
      }
      
      writeDB(db);
      res.json({ success: true, undangan: db.undangan });
    } catch (error: any) {
      console.error("Undangan CRUD Error:", error);
      res.status(500).json({ success: false, error: error.message || "Gagal memproses data undangan." });
    }
  });

  // API - AI-powered Undangan Rapat Generation using Gemini API
  app.post("/api/sems/generate-undangan-ai", async (req, res) => {
    try {
      const {
        letterNumber,
        subject,
        date,
        time,
        location,
        agenda,
        notes,
        recipients,
        signatoryName,
        signatoryRole,
        signatoryName2,
        signatoryRole2
      } = req.body;

      const client = getGeminiClient();

      const systemInstruction = `Anda adalah Sekretaris RW dan Ahli Administrasi Surat Resmi. Tugas Anda adalah menyusun Surat Undangan Rapat resmi kenegaraan/RT-RW yang sangat rapi, menggunakan Bahasa Indonesia yang baku (EYD), sopan, berwibawa, dan memiliki tata letak surat resmi Indonesia yang estetik dalam format Markdown.`;

      const prompt = `Silakan buat draf Surat Undangan Rapat resmi berbasis Markdown dengan rincian berikut:
- **Nomor Surat**: ${letterNumber || "[Nomor Surat]"}
- **Perihal**: ${subject || "Undangan Rapat Panitia"}
- **Lampiran**: -
- **Sifat**: Penting / Segera
- **Penerima / Kepada Yth**: ${recipients && recipients.length > 0 ? recipients.join(", ") : "Bapak/Ibu/Sdr/i Pengurus & Panitia"}
- **Hari, Tanggal Rapat**: ${date}
- **Waktu Rapat**: ${time}
- **Tempat Rapat**: ${location}
- **Agenda Rapat**: ${agenda}
- **Catatan Tambahan**: ${notes || "-"}
- **Penandatangan 1**: ${signatoryName} (${signatoryRole})
- **Penandatangan 2**: ${signatoryName2 ? `${signatoryName2} (${signatoryRole2})` : ""}

**Panduan Format Surat**:
1. Gunakan KOP SURAT resmi fiktif yang elegan di bagian paling atas (Panitia Peringatan HUT RI Ke-81 RW 04 Ngabean, Semarang Barat).
2. Tuliskan tanggal surat dibuat, nomor, perihal, lampiran di sisi kiri/kanan secara proporsional.
3. Gunakan kata pembuka yang sopan dan hangat ("Dengan hormat, Sehubungan dengan persiapan memperingati...", dll).
4. Rincian acara (Hari, Tanggal, Waktu, Tempat, Agenda) wajib ditata rapi dalam format list atau tabel Markdown dengan padding yang bersih.
5. Gunakan kata penutup yang formal dan penuh harapan kehadiran.
6. Buat area tanda tangan (kolom tanda tangan kiri dan kanan) di bagian bawah menggunakan tabel Markdown agar posisinya sejajar dan rapi jika ada dua penandatangan. Tuliskan "Mengetahui," jika penandatangan kedua adalah Ketua RW.

Keluarkan hasil berupa Markdown murni yang siap ditampilkan, tanpa membungkusnya dalam penjelasan atau salam pembuka di luar dokumen surat itu sendiri.`;

      const response = await generateWithRetry(client, {
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3
        }
      });

      const undanganText = response.text || "";
      res.json({ success: true, contentMarkdown: undanganText });
    } catch (error: any) {
      console.error("AI Undangan Generation Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Gagal berkomunikasi dengan Gemini AI. Pastikan GEMINI_API_KEY sudah dikonfigurasi di Settings > Secrets."
      });
    }
  });

  // API - AI-powered Notulensi Generation using Gemini API
  app.post("/api/sems/generate-notulensi-ai", async (req, res) => {
    try {
      const {
        title,
        date,
        time,
        location,
        leader,
        attendeesCount,
        attendeesList,
        agenda,
        notesRaw
      } = req.body;

      const client = getGeminiClient();

      const systemInstruction = `Anda adalah Sekretaris Profesional dan Ahli Administrasi Rapat. Tugas Anda adalah merumuskan Notulen Rapat (Minutes of Meeting) formal yang sangat rapi, kaya bahasa, terstruktur secara profesional, dan berwibawa menggunakan Bahasa Indonesia formal (EYD).`;

      const prompt = `Silakan susun draf dokumen Notulensi Rapat Profesional berdasarkan data real-time rapat berikut:

=== DATA IDENTITAS RAPAT ===
Judul Rapat: ${title}
Hari & Tanggal: ${date}
Waktu Pelaksanaan: ${time}
Tempat/Lokasi: ${location}
Pimpinan Rapat: ${leader}
Jumlah Peserta: ${attendeesCount} orang
Daftar Hadir/Seksi Terkait: ${attendeesList}
Agenda Rapat Utama:
${agenda}

=== CATATAN MENTAH & PEMBAHASAN RAPAT ===
${notesRaw}

Silakan rumuskan dokumen Notulensi Rapat Resmi yang lengkap dengan struktur berikut:
1. HEADER FORMAL (Judul, Waktu, Tempat, Pimpinan, Kehadiran)
2. AGENDA RAPAT
3. JALANNYA RAPAT & RINGKASAN PEMBAHASAN (Tulis analisis mendalam, penjelasannya kaya kosa kata, profesional, dan runtut per topik bahasan)
4. KEPUTUSAN UTAMA RAPAT (Daftar poin hasil keputusan rapat yang disepakati bersama secara tegas)
5. RENCANA TINDAK LANJUT / ACTION ITEMS (Sajikan dalam bentuk tabel markdown atau format daftar yang sangat rapi, berisi: Rincian Tugas, Seksi/PIC Penanggung Jawab, dan Batas Waktu)
6. PENUTUP & BLOK TANDA TANGAN FORMAL di bagian akhir sebelah kiri/kanan:
Semarang, ${date}
Pembuat Notulen (Sekretaris) dan Mengetahui (Ketua Panitia).

Tuliskan dokumen ini dalam format Markdown yang sangat elegan dan teratur.`;

      const response = await generateWithRetry(client, {
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              notulensi: {
                type: Type.STRING,
                description: "Teks lengkap Notulensi Rapat dalam format Markdown."
              },
              actionItems: {
                type: Type.ARRAY,
                description: "Daftar rencana tindak lanjut atau komitmen tugas (Action Items) yang diekstrak dari catatan rapat.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    task: { type: Type.STRING },
                    pic: { type: Type.STRING },
                    deadline: { type: Type.STRING }
                  }
                }
              }
            },
            required: ["notulensi", "actionItems"]
          }
        }
      });

      const responseData = JSON.parse(response.text || "{}");
      res.json({ 
        success: true, 
        notulensi: responseData.notulensi || "", 
        actionItems: responseData.actionItems || [] 
      });
    } catch (error: any) {
      console.error("AI Notulensi Generation Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Gagal berkomunikasi dengan Gemini AI. Pastikan GEMINI_API_KEY Anda sudah terkonfigurasi di Settings > Secrets."
      });
    }
  });

  // API - AI-powered Document Template Generation using Gemini API
  app.post("/api/sems/generate-doc-template-ai", async (req, res) => {
    try {
      const { title, category, prompt: userPrompt } = req.body;
      const client = getGeminiClient();

      const systemInstruction = `Anda adalah Sekretaris Profesional, Humas Unggul, dan Ahli Dokumen Organisasi Tingkat Rukun Warga (RW). Tugas Anda adalah merumuskan draf dokumen/surat formal atau template kuitansi/proposal dalam Bahasa Indonesia formal (EYD) yang rapi, berwibawa, dan siap digunakan oleh kepanitiaan HUT RI Ke-81 RW 04 Ngabean.`;

      const prompt = `Silakan susun draf dokumen / surat formal / template profesional berdasarkan data berikut:
Judul Dokumen: ${title}
Kategori Dokumen: ${category}
Keterangan Tambahan / Keinginan Pengguna:
${userPrompt}

Silakan buat draf dokumen ini dalam format Markdown yang sangat rapi, menyertakan kop surat RW 04 Ngabean jika itu berbentuk surat, nomor surat (buat format mock yang logis), salam pembuka, isi surat yang lengkap dan kaya kosa kata profesional, penutup, dan blok tanda tangan formal di bagian akhir (misalnya Ketua RW 04, Ketua Panitia, atau Sekretaris).`;

      const response = await generateWithRetry(client, {
        model: "gemini-3.5-flash",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const templateText = response.text || "";
      res.json({ success: true, template: templateText });
    } catch (error: any) {
      console.error("AI Document Template Generation Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Gagal berkomunikasi dengan Gemini AI. Pastikan GEMINI_API_KEY Anda sudah terkonfigurasi di Settings > Secrets."
      });
    }
  });

  // Setup Vite development server middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server SEMS running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch(err => {
  console.error("Failed to start SEMS server:", err);
});
