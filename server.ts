import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { initialData } from "./src/data/initialData.js";
import { SEMSData, RKBAItem, KeuanganTransaction, Panitia, Kegiatan, NaturaItem, SeksiTask } from "./src/types.js";

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
    return JSON.parse(raw);
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
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

  // API - CRUD Natura (In-Kind Contribution)
  app.post("/api/sems/natura", (req, res) => {
    const db = readDB();
    const { action, data } = req.body as { action: 'add' | 'edit' | 'delete'; data: NaturaItem };
    
    if (action === 'add') {
      db.natura.push({ ...data, id: 'natura_' + Date.now() });
    } else if (action === 'edit') {
      db.natura = db.natura.map(n => n.id === data.id ? data : n);
    } else if (action === 'delete') {
      db.natura = db.natura.filter(n => n.id !== data.id);
    }
    
    writeDB(db);
    res.json({ success: true, natura: db.natura });
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
        templateType: "formal" | "ringkas" | "natura";
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
      const totalNatura = db.natura.reduce((sum, n) => sum + n.estimatedValue, 0);
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
        const rtNaturaValue = db.natura.filter(n => n.rt === rtName).reduce((sum, n) => sum + n.estimatedValue, 0);
        return `- **${rtName} Ngabean:** Iuran Tunai Rp ${collected.toLocaleString('id-ID')} (${pct}% lunas dari target Rp ${target.toLocaleString('id-ID')}), Swadaya Natura Rp ${rtNaturaValue.toLocaleString('id-ID')}`;
      }).join('\n');

      // Summary of top 30 transactions
      const keuanganSummary = db.keuangan.map(t => {
        return `- [Tanggal ${t.date}] [Kas ${t.type}] Rp ${t.amount.toLocaleString('id-ID')} (${t.category}) - ${t.notes}`;
      }).slice(0, 30).join('\n') + (db.keuangan.length > 30 ? "\n- ... (dan transaksi penunjang lainnya)" : "");

      // Summary of tasks
      const tasksSummary = db.tasks.map(t => {
        return `- [Status: ${t.status}] ${t.taskName} (Penanggungjawab: Seksi ${t.seksi})`;
      }).join('\n');

      // Summary of natura
      const naturaSummary = db.natura.length > 0 
        ? db.natura.map(n => {
            return `- RT ${n.rt}: Sumbangan berupa ${n.item} (${n.qty} ${n.unit}, Estimasi Nilai: Rp ${n.estimatedValue.toLocaleString('id-ID')}) oleh warga atas nama ${n.donorName}`;
          }).join('\n')
        : "- Belum ada catatan sumbangan swadaya natura non-tunai.";

      const client = getGeminiClient();

      const systemInstruction = `Anda adalah Sekretaris Keuangan dan Humas yang sangat profesional untuk kepanitiaan warga di Indonesia.
Tugas Anda adalah merumuskan naskah Laporan Pertanggungjawaban (LPJ) yang indah, rapi, transparan, dan mengesankan dalam Bahasa Indonesia formal dan hangat.

PANDUAN PENULISAN:
1. Tulis laporan dengan nada yang profesional, penuh rasa syukur, apresiatif terhadap swadaya gotong royong warga, dan akuntabel.
2. Gunakan markdown untuk struktur yang rapi (gunakan ## untuk judul bagian, tebalkan kata-kata penting).
3. Anda diberikan data real-time berupa iuran warga, sumbangan natura, daftar program kerja, dan riwayat transaksi. Seluruh angka keuangan dan statistik di dalam laporan harus 100% konsisten dengan data yang diberikan! Jangan pernah mengarang angka yang berbeda.
4. Tulis konten yang lengkap, berbobot, dan bernilai sastra/formal yang tinggi, hindari penjelasan yang dipotong atau berupa placeholder kosong.
5. Format mata uang menggunakan penulisan rupiah Indonesia standar (misal: Rp 1.500.000).

KETENTUAN PENTING UNTUK LAYOUT:
- JANGAN menyertakan KOP SURAT (Letterhead) di bagian paling atas karena Kop Surat sudah digambar secara dinamis oleh sistem di kertas cetak.
- JANGAN menulis baris tanda tangan atau tabel tanda tangan di bagian paling bawah karena sistem sudah memiliki grid tanda tangan digital yang rapi.
- Cukup akhiri laporan Anda dengan menulis baris tanggal persis seperti berikut di baris paling akhir:
  Semarang, [Isi Tanggal LPJ]
- Setelah baris tanggal tersebut, jangan tulis apa pun lagi (jangan beri nama orang, jabatan, atau garis kosong).

PANDUAN KHUSUS UNTUK TEMPLATE "${templateType}":
- Jika template "formal": Tulis naskah laporan lengkap resmi. Terdiri dari kata pengantar/pendahuluan, laporan realisasi keuangan (jelaskan perolehan iuran, sebutkan RT yang lunas/paling aktif, jelaskan pengeluaran utama), status program kerja (apresiasi seksi-seksi pelaksana), analisis efisiensi pengeluaran kas vs swadaya warga, draf rekomendasi untuk kepanitiaan periode berikutnya, dan penutup.
- Jika template "ringkas": Tulis naskah laporan ringkas/eksekutif yang ditujukan langsung untuk warga. Nada penulisan sangat guyub, hangat, santun, dan fokus pada kebersamaan. Sebutkan angka-angka utama (Kas Masuk, Kas Keluar, Sisa Kas, Total Swadaya/Natura), apresiasi kerukunan warga, rincian singkat kemeriahan program kerja, dan penutup yang menyentuh hati.
- Jika template "natura": Tulis naskah Laporan Swadaya & Gotong Royong Non-Tunai. Fokuskan seluruh pembahasan pada kekuatan gotong-royong non-finansial warga (sumbangan berupa barang, tenaga, sound, panggung, makanan, dll). Sebutkan rincian kontribusi warga per RT (donor, barang, estimasi nilai), jelaskan bagaimana sumbangan non-tunai ini menghemat anggaran belanja kas riil panitia secara drastis, dan berikan rekomendasi kemandirian sosial kemasyarakatan.`;

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
2. Total Nilai Swadaya Non-Tunai (Natura): Rp ${totalNatura.toLocaleString('id-ID')}
3. Total Realisasi Pengeluaran Kas: Rp ${totalPengeluaran.toLocaleString('id-ID')}
4. Saldo Kas Sisa Akhir: Rp ${saldoSisa.toLocaleString('id-ID')}

=== PROGRESS PROGRAM KERJA ===
- Total Program Kerja: ${totalTasks} program
- Selesai & Sukses: ${completedTasks} program
- Dalam Proses: ${processingTasks} program
- Belum Terlaksana: ${pendingTasks} program
- Persentase Keberhasilan: ${persenTugas}%

=== RINCIAN CATATAN KAS MASUK & KELUAR ===
${keuanganSummary}

=== RINCIAN IURAN TUNAI & NATURA PER RT ===
${rtCollectionsSummary}

=== RINCIAN SWADAYA NATURA WARGA ===
${naturaSummary}

=== RINCIAN TUGAS PROGRAM KERJA PER SEKSI ===
${tasksSummary}

Silakan susun draf laporan pertanggungjawaban sesuai dengan instruksi sistem. Pastikan untuk menulis ulasan analisis yang mendalam, kaya bahasa, dan mengesankan. Dan pastikan di baris paling akhir naskah diakhiri dengan kalimat: Semarang, ${tanggalLPJ}`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.8,
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
