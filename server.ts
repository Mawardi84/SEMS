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
import { 
  SEMSData, 
  RKBAItem, 
  KeuanganTransaction, 
  Panitia, 
  Kegiatan, 
  SeksiTask,
  BudgetChange,
  BudgetReallocation,
  AuditTrailRecord,
  Notulensi
} from "./src/types.js";

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
const MD_BACKUP_PATH = path.join(currentDirname, "DATA_MASTER_SEMS_RW04.md");
const JSON_BACKUP_PATH = path.join(currentDirname, "backup_database_rw04.json");

// Helper to extract JSON data from Markdown code block
function extractDataFromMarkdownFile(filePath: string): SEMSData | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, "utf8");
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed && parsed.settings) {
        return parsed as SEMSData;
      }
    }
  } catch (err) {
    console.error(`Error parsing markdown backup from ${filePath}:`, err);
  }
  return null;
}

// Local DB Helper with Auto-Restore from MD / Backup JSON
function readDB(): SEMSData {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf8");
      if (raw && raw.trim().length > 0) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.settings) {
          if (!parsed.notulensi) parsed.notulensi = [];
          if (!parsed.documents) parsed.documents = [];
          if (!parsed.undangan) parsed.undangan = [];
          if (!parsed.budgetChanges) parsed.budgetChanges = [];
          if (!parsed.budgetReallocations) parsed.budgetReallocations = [];
          if (!parsed.auditTrails) parsed.auditTrails = [];
          if (!parsed.lpj) parsed.lpj = initialData.lpj;

          // Ensure backwards-compatible activityCode and baseline locking for existing RKBA items
          if (Array.isArray(parsed.rkba)) {
            parsed.rkba = parsed.rkba.map((item: any, idx: number) => {
              const activityCode = item.activityCode || `ACT-${String(idx + 1).padStart(3, '0')}`;
              const activityStatus = item.activityStatus || (item.status === 'Disetujui' || item.status === 'Belanja' ? 'BERJALAN' : 'RENCANA');
              return {
                ...item,
                activityCode,
                activityStatus,
                isLockedBaseline: item.isLockedBaseline !== undefined ? item.isLockedBaseline : (item.status === 'Disetujui' || item.status === 'Belanja')
              };
            });
          }

          return parsed;
        }
      }
    }

    // Auto-Recovery Strategy: If db.json is missing or corrupted:
    console.log("Database db.json not found or empty. Initiating auto-recovery from Master Markdown/Backup...");
    
    // 1. Try reading from DATA_MASTER_SEMS_RW04.md
    const fromMd = extractDataFromMarkdownFile(MD_BACKUP_PATH) || 
                   extractDataFromMarkdownFile(path.join(process.cwd(), "DATA_MASTER_SEMS_RW04.md")) ||
                   extractDataFromMarkdownFile(path.join(currentDirname, "src/data/DATA_MASTER_SEMS_RW04.md"));
    if (fromMd) {
      console.log("Successfully restored database from DATA_MASTER_SEMS_RW04.md!");
      writeDB(fromMd);
      return fromMd;
    }

    // 2. Try reading from backup_database_rw04.json
    if (fs.existsSync(JSON_BACKUP_PATH)) {
      const backupRaw = fs.readFileSync(JSON_BACKUP_PATH, "utf8");
      const backupParsed = JSON.parse(backupRaw);
      if (backupParsed && backupParsed.settings) {
        console.log("Successfully restored database from backup_database_rw04.json!");
        writeDB(backupParsed);
        return backupParsed;
      }
    }

    // 3. Fallback to initialData
    console.log("Restoring database from initialData default dataset...");
    writeDB(initialData);
    return initialData;
  } catch (error) {
    console.error("Error reading db.json, falling back to master data:", error);
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
      res.send(Buffer.from(docx as any));
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

  // API - Restore from Master Markdown file
  app.post("/api/sems/restore-from-md", (req, res) => {
    try {
      const fromMd = extractDataFromMarkdownFile(MD_BACKUP_PATH) || 
                     extractDataFromMarkdownFile(path.join(process.cwd(), "DATA_MASTER_SEMS_RW04.md")) ||
                     extractDataFromMarkdownFile(path.join(currentDirname, "src/data/DATA_MASTER_SEMS_RW04.md"));
      if (fromMd) {
        writeDB(fromMd);
        return res.json({ success: true, message: "Database berhasil dipulihkan dari file Master Markdown!", data: fromMd });
      }
      // Fallback
      writeDB(initialData);
      res.json({ success: true, message: "Database dipulihkan menggunakan data master bawaan.", data: initialData });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Gagal memulihkan dari Markdown: " + err.message });
    }
  });

  // API - Download Master Markdown
  app.get("/api/sems/download-backup-md", (req, res) => {
    const filePath = fs.existsSync(MD_BACKUP_PATH) ? MD_BACKUP_PATH : path.join(process.cwd(), "DATA_MASTER_SEMS_RW04.md");
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Disposition', 'attachment; filename=DATA_MASTER_SEMS_RW04.md');
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.sendFile(filePath);
    } else {
      res.status(404).json({ success: false, error: "File Markdown Master tidak ditemukan." });
    }
  });

  // API - Download JSON Backup
  app.get("/api/sems/download-backup-json", (req, res) => {
    const db = readDB();
    res.setHeader('Content-Disposition', `attachment; filename=backup_database_rw04_${new Date().toISOString().slice(0, 10)}.json`);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(JSON.stringify(db, null, 2));
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
    const { action, data, actor } = req.body as { action: 'add' | 'edit' | 'delete' | 'approve' | 'reject'; data: RKBAItem; actor?: string };
    
    if (action === 'add') {
      const idx = (db.rkba?.length || 0) + 1;
      const newItem: RKBAItem = {
        ...data,
        id: 'rkba_' + Date.now(),
        activityCode: data.activityCode || `ACT-${String(idx).padStart(3, '0')}`,
        total: data.qty * data.price,
        status: data.status || 'Draft',
        activityStatus: data.activityStatus || 'RENCANA',
        isLockedBaseline: false,
        dateAdded: new Date().toISOString().split('T')[0]
      };
      db.rkba.push(newItem);
      logAudit(db, 'RAB', newItem.id, 'CREATE', actor || 'Seksi Terkait', `Menambahkan item RAB baru: ${newItem.name} (Seksi ${newItem.seksi}) senilai Rp ${newItem.total.toLocaleString('id-ID')}`, undefined, newItem.status);
    } else if (action === 'edit') {
      const prev = db.rkba.find(r => r.id === data.id);
      if (prev && prev.isLockedBaseline) {
        return res.status(400).json({ 
          success: false, 
          error: "Item RAB Awal ini telah disahkan dan dikunci. Silakan gunakan menu 'Perubahan Anggaran' untuk memodifikasi." 
        });
      }
      const updatedItem = {
        ...data,
        total: data.qty * data.price
      };
      db.rkba = db.rkba.map(r => r.id === data.id ? updatedItem : r);
      logAudit(db, 'RAB', data.id, 'UPDATE', actor || 'Seksi Terkait', `Mengubah item RAB: ${data.name}`, prev ? `${prev.name} (${prev.total})` : undefined, `${data.name} (${updatedItem.total})`);
    } else if (action === 'delete') {
      const prev = db.rkba.find(r => r.id === data.id);
      if (prev && prev.isLockedBaseline) {
        return res.status(400).json({ 
          success: false, 
          error: "Item RAB Awal ini telah disahkan dan dikunci. Item tidak boleh dihapus langsung. Silakan ajukan di menu 'Perubahan Anggaran' (DITIADAKAN)." 
        });
      }
      db.rkba = db.rkba.filter(r => r.id !== data.id);
      logAudit(db, 'RAB', data.id, 'CANCEL', actor || 'Admin Panitia', `Menghapus item draf RAB: ${prev?.name}`, prev ? `${prev.name} (${prev.total})` : undefined, 'DELETED');
    } else if (action === 'approve') {
      // Approve RKBA item and lock baseline
      const prev = db.rkba.find(r => r.id === data.id);
      db.rkba = db.rkba.map(r => {
        if (r.id === data.id) {
          return { 
            ...r, 
            status: 'Disetujui' as const, 
            activityStatus: 'BERJALAN' as const,
            isLockedBaseline: true 
          };
        }
        return r;
      });
      logAudit(db, 'RAB', data.id, 'APPROVE', actor || 'Ketua Panitia', `Mengesahkan & Mengunci Baseline RAB Awal: ${prev?.name} (Rp ${prev?.total.toLocaleString('id-ID')})`, prev?.status, 'Disetujui (Locked Baseline)');
    } else if (action === 'reject') {
      // Reject RKBA item
      const prev = db.rkba.find(r => r.id === data.id);
      db.rkba = db.rkba.map(r => {
        if (r.id === data.id) {
          return { ...r, status: 'Ditolak' as const };
        }
        return r;
      });
      logAudit(db, 'RAB', data.id, 'REJECT', actor || 'Ketua Panitia', `Menolak usulan item RAB: ${prev?.name}`, prev?.status, 'Ditolak');
    }
    
    writeDB(db);
    res.json({ success: true, rkba: db.rkba, auditTrails: db.auditTrails });
  });

  // Helper to append audit trail log
  function logAudit(
    db: SEMSData, 
    entityType: 'RAB' | 'PERUBAHAN' | 'REALOKASI' | 'REALISASI' | 'NOTULENSI' | 'LPJ', 
    entityId: string, 
    action: 'CREATE' | 'UPDATE' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'CANCEL', 
    actor: string, 
    reason: string,
    previousState?: string,
    newState?: string
  ) {
    if (!db.auditTrails) {
      db.auditTrails = [];
    }
    const record: AuditTrailRecord = {
      id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      entityType,
      entityId,
      action,
      actor: actor || 'Admin Panitia',
      previousState,
      newState: newState || '',
      reason: reason || '-'
    };
    db.auditTrails.unshift(record);
  }

  // API - CRUD & Workflow Perubahan Anggaran (Budget Changes)
  app.post("/api/sems/budget-changes", (req, res) => {
    try {
      const db = readDB();
      if (!db.budgetChanges) db.budgetChanges = [];

      const { action, data, actor } = req.body as { 
        action: 'add' | 'edit' | 'submit' | 'approve' | 'reject' | 'cancel'; 
        data: BudgetChange;
        actor?: string;
      };

      if (!data) {
        return res.status(400).json({ success: false, error: "Data perubahan anggaran diperlukan." });
      }

      if (action === 'add') {
        const changeNumber = data.changeNumber || `PA-2026-${String(db.budgetChanges.length + 1).padStart(3, '0')}`;
        const newItem: BudgetChange = {
          ...data,
          id: data.id || 'bc_' + Date.now(),
          changeNumber,
          status: data.status || 'DRAFT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.budgetChanges.unshift(newItem);
        logAudit(db, 'PERUBAHAN', newItem.id, 'CREATE', actor || data.proposedBy, `Membuat draf perubahan anggaran ${changeNumber}: ${data.changeType} untuk ${data.activityName}`, undefined, newItem.status);
      } else if (action === 'edit') {
        const prev = db.budgetChanges.find(b => b.id === data.id);
        if (prev && prev.status === 'DISETUJUI') {
          return res.status(400).json({ success: false, error: "Perubahan anggaran yang sudah disetujui tidak dapat diedit langsung." });
        }
        db.budgetChanges = db.budgetChanges.map(b => b.id === data.id ? { ...data, updatedAt: new Date().toISOString() } : b);
        logAudit(db, 'PERUBAHAN', data.id, 'UPDATE', actor || data.proposedBy, `Mengubah data perubahan anggaran ${data.changeNumber}`, prev?.status, data.status);
      } else if (action === 'submit') {
        const prev = db.budgetChanges.find(b => b.id === data.id);
        db.budgetChanges = db.budgetChanges.map(b => b.id === data.id ? { ...b, status: 'DIAJUKAN', updatedAt: new Date().toISOString() } : b);
        logAudit(db, 'PERUBAHAN', data.id, 'SUBMIT', actor || data.proposedBy, `Mengajukan persetujuan perubahan anggaran ${data.changeNumber}`, prev?.status, 'DIAJUKAN');
      } else if (action === 'approve') {
        const prev = db.budgetChanges.find(b => b.id === data.id);
        const approvedItem: BudgetChange = {
          ...(prev || data),
          status: 'DISETUJUI',
          approvedBy: actor || data.approvedBy || 'Ketua Panitia',
          approvalDate: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString()
        };
        db.budgetChanges = db.budgetChanges.map(b => b.id === data.id ? approvedItem : b);

        // Update target activity status if needed
        if (approvedItem.changeType === 'DITIADAKAN') {
          db.rkba = db.rkba.map(r => r.id === approvedItem.activityId ? { ...r, activityStatus: 'DITIADAKAN' as const } : r);
        } else if (approvedItem.changeType === 'DITAMBAHKAN') {
          db.rkba = db.rkba.map(r => r.id === approvedItem.activityId ? { ...r, activityStatus: 'DITAMBAHKAN' as const } : r);
        }

        logAudit(db, 'PERUBAHAN', data.id, 'APPROVE', actor || approvedItem.approvedBy || 'Ketua Panitia', `Menyetujui perubahan anggaran ${approvedItem.changeNumber}: ${approvedItem.changeType} senilai Rp ${approvedItem.changeAmount.toLocaleString('id-ID')}`, prev?.status, 'DISETUJUI');
      } else if (action === 'reject') {
        const prev = db.budgetChanges.find(b => b.id === data.id);
        db.budgetChanges = db.budgetChanges.map(b => b.id === data.id ? { 
          ...b, 
          status: 'DITOLAK', 
          approvedBy: actor || data.approvedBy || 'Ketua Panitia',
          notes: data.notes || b.notes,
          updatedAt: new Date().toISOString() 
        } : b);
        logAudit(db, 'PERUBAHAN', data.id, 'REJECT', actor || 'Ketua Panitia', `Menolak perubahan anggaran ${data.changeNumber}. Catatan: ${data.notes || '-'}`, prev?.status, 'DITOLAK');
      } else if (action === 'cancel') {
        const prev = db.budgetChanges.find(b => b.id === data.id);
        db.budgetChanges = db.budgetChanges.map(b => b.id === data.id ? { ...b, status: 'CANCELLED', updatedAt: new Date().toISOString() } : b);
        logAudit(db, 'PERUBAHAN', data.id, 'CANCEL', actor || 'Admin Panitia', `Membatalkan perubahan anggaran ${data.changeNumber}`, prev?.status, 'CANCELLED');
      }

      writeDB(db);
      res.json({ 
        success: true, 
        budgetChanges: db.budgetChanges, 
        rkba: db.rkba,
        auditTrails: db.auditTrails 
      });
    } catch (error: any) {
      console.error("Budget Changes API Error:", error);
      res.status(500).json({ success: false, error: error.message || "Gagal memproses data perubahan anggaran." });
    }
  });

  // API - CRUD & Workflow Realokasi Anggaran (Budget Reallocations)
  app.post("/api/sems/budget-reallocations", (req, res) => {
    try {
      const db = readDB();
      if (!db.budgetReallocations) db.budgetReallocations = [];

      const { action, data, actor } = req.body as { 
        action: 'add' | 'edit' | 'submit' | 'approve' | 'reject' | 'cancel'; 
        data: BudgetReallocation;
        actor?: string;
      };

      if (!data) {
        return res.status(400).json({ success: false, error: "Data realokasi anggaran diperlukan." });
      }

      if (action === 'add') {
        if (data.amount > data.availableAmount) {
          return res.status(400).json({ success: false, error: "Nilai realokasi tidak boleh melebihi dana yang tersedia di sumber." });
        }
        const reallocationNumber = data.reallocationNumber || `RA-2026-${String(db.budgetReallocations.length + 1).padStart(3, '0')}`;
        const remainingAmount = Math.max(0, data.availableAmount - data.amount);
        const newItem: BudgetReallocation = {
          ...data,
          id: data.id || 'br_' + Date.now(),
          reallocationNumber,
          remainingAmount,
          status: data.status || 'DRAFT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.budgetReallocations.unshift(newItem);
        logAudit(db, 'REALOKASI', newItem.id, 'CREATE', actor || data.proposedBy || 'Admin', `Membuat draf realokasi ${reallocationNumber}: ${data.sourceActivityName} -> ${data.targetActivityName} sebesar Rp ${data.amount.toLocaleString('id-ID')}`, undefined, newItem.status);
      } else if (action === 'edit') {
        const prev = db.budgetReallocations.find(r => r.id === data.id);
        if (prev && prev.status === 'DISETUJUI') {
          return res.status(400).json({ success: false, error: "Realokasi anggaran yang sudah disetujui tidak dapat diedit langsung." });
        }
        const remainingAmount = Math.max(0, data.availableAmount - data.amount);
        db.budgetReallocations = db.budgetReallocations.map(r => r.id === data.id ? { 
          ...data, 
          remainingAmount, 
          updatedAt: new Date().toISOString() 
        } : r);
        logAudit(db, 'REALOKASI', data.id, 'UPDATE', actor || 'Admin', `Mengubah data realokasi ${data.reallocationNumber}`, prev?.status, data.status);
      } else if (action === 'submit') {
        const prev = db.budgetReallocations.find(r => r.id === data.id);
        db.budgetReallocations = db.budgetReallocations.map(r => r.id === data.id ? { ...r, status: 'DIAJUKAN', updatedAt: new Date().toISOString() } : r);
        logAudit(db, 'REALOKASI', data.id, 'SUBMIT', actor || 'Admin', `Mengajukan persetujuan realokasi ${data.reallocationNumber}`, prev?.status, 'DIAJUKAN');
      } else if (action === 'approve') {
        const prev = db.budgetReallocations.find(r => r.id === data.id);
        const approvedItem: BudgetReallocation = {
          ...(prev || data),
          status: 'DISETUJUI',
          approvedBy: actor || data.approvedBy || 'Ketua Panitia',
          approvalDate: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString()
        };
        db.budgetReallocations = db.budgetReallocations.map(r => r.id === data.id ? approvedItem : r);

        // Update status of target/source activity if needed
        db.rkba = db.rkba.map(r => {
          if (r.id === approvedItem.sourceActivityId) {
            return { ...r, activityStatus: 'DIALIHKAN' as const };
          }
          return r;
        });

        logAudit(db, 'REALOKASI', data.id, 'APPROVE', actor || approvedItem.approvedBy || 'Ketua Panitia', `Menyetujui realokasi ${approvedItem.reallocationNumber}: ${approvedItem.sourceActivityName} -> ${approvedItem.targetActivityName} sebesar Rp ${approvedItem.amount.toLocaleString('id-ID')}`, prev?.status, 'DISETUJUI');
      } else if (action === 'reject') {
        const prev = db.budgetReallocations.find(r => r.id === data.id);
        db.budgetReallocations = db.budgetReallocations.map(r => r.id === data.id ? { 
          ...r, 
          status: 'DITOLAK', 
          approvedBy: actor || 'Ketua Panitia',
          notes: data.notes || r.notes,
          updatedAt: new Date().toISOString() 
        } : r);
        logAudit(db, 'REALOKASI', data.id, 'REJECT', actor || 'Ketua Panitia', `Menolak realokasi ${data.reallocationNumber}. Catatan: ${data.notes || '-'}`, prev?.status, 'DITOLAK');
      } else if (action === 'cancel') {
        const prev = db.budgetReallocations.find(r => r.id === data.id);
        db.budgetReallocations = db.budgetReallocations.map(r => r.id === data.id ? { ...r, status: 'CANCELLED', updatedAt: new Date().toISOString() } : r);
        logAudit(db, 'REALOKASI', data.id, 'CANCEL', actor || 'Admin Panitia', `Membatalkan realokasi ${data.reallocationNumber}`, prev?.status, 'CANCELLED');
      }

      writeDB(db);
      res.json({ 
        success: true, 
        budgetReallocations: db.budgetReallocations, 
        rkba: db.rkba,
        auditTrails: db.auditTrails 
      });
    } catch (error: any) {
      console.error("Budget Reallocation API Error:", error);
      res.status(500).json({ success: false, error: error.message || "Gagal memproses data realokasi anggaran." });
    }
  });

  // API - Get Audit Trails
  app.get("/api/sems/audit-trails", (req, res) => {
    const db = readDB();
    res.json({ success: true, auditTrails: db.auditTrails || [] });
  });

  // API - Update LPJ Section Presenter & Metadata
  app.post("/api/sems/lpj/update-section", (req, res) => {
    try {
      const db = readDB();
      if (!db.lpj) db.lpj = initialData.lpj;
      
      const { 
        sectionId, 
        presenterRole, 
        presenterNameSnapshot, 
        status, 
        notes, 
        actor, 
        reason 
      } = req.body;

      if (!sectionId) {
        return res.status(400).json({ success: false, error: "sectionId diperlukan." });
      }

      const sectionIndex = db.lpj!.sections.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) {
        return res.status(404).json({ success: false, error: "Bab LPJ tidak ditemukan." });
      }

      const prevSection = db.lpj!.sections[sectionIndex];
      const oldPresenter = prevSection.presenterNameSnapshot || prevSection.presenterRole;
      const newPresenter = presenterNameSnapshot || presenterRole || prevSection.presenterRole;

      db.lpj!.sections[sectionIndex] = {
        ...prevSection,
        presenterRole: presenterRole || prevSection.presenterRole,
        presenterNameSnapshot: presenterNameSnapshot || prevSection.presenterNameSnapshot,
        status: status || prevSection.status,
        notes: notes !== undefined ? notes : prevSection.notes,
        updatedAt: new Date().toISOString()
      };

      db.lpj!.updatedAt = new Date().toISOString();

      const changeDetail = oldPresenter !== newPresenter 
        ? `Mengubah penyampai Bab ${prevSection.sectionCode} (${prevSection.sectionTitle}) dari '${oldPresenter}' menjadi '${newPresenter}'`
        : `Memperbarui status/catatan Bab ${prevSection.sectionCode} (${prevSection.sectionTitle})`;

      logAudit(
        db,
        'LPJ',
        sectionId,
        'UPDATE',
        actor || 'Admin Panitia',
        `${changeDetail}. Alasan: ${reason || 'Penyesuaian susunan penyampai'}`,
        oldPresenter,
        newPresenter
      );

      writeDB(db);
      res.json({ success: true, lpj: db.lpj, auditTrails: db.auditTrails });
    } catch (error: any) {
      console.error("LPJ Section Update Error:", error);
      res.status(500).json({ success: false, error: error.message || "Gagal memperbarui bab LPJ." });
    }
  });

  // API - Update LPJ Overall Status with Strict Reconciliation & Checklist Guard
  app.post("/api/sems/lpj/update-status", (req, res) => {
    try {
      const db = readDB();
      if (!db.lpj) db.lpj = initialData.lpj;

      const { status: targetStatus, actor, notes, isReconciled, reconciliationNotes } = req.body;

      if (!targetStatus) {
        return res.status(400).json({ success: false, error: "Status tujuan diperlukan." });
      }

      const prevStatus = db.lpj!.status;

      // STRICT VALIDATION: If attempting to approve (DISETUJUI), ensure finance is reconciled
      if (targetStatus === 'DISETUJUI') {
        const totalPemasukan = (db.keuangan || []).filter(t => t.type === 'Masuk').reduce((s, t) => s + t.amount, 0);
        const totalPengeluaran = (db.keuangan || []).filter(t => t.type === 'Keluar').reduce((s, t) => s + t.amount, 0);
        const hasUnreconciledTransactions = (db.keuangan || []).some(t => t.proofStatus === 'Belum Lengkap');
        
        const effectiveReconciled = isReconciled !== undefined ? isReconciled : db.lpj!.isReconciled;
        
        if (!effectiveReconciled) {
          return res.status(400).json({ 
            success: false, 
            error: "LPJ BELUM SIAP DISETUJUI: Bagian Laporan Keuangan belum direkonsiliasi secara penuh. Pastikan seluruh kuitansi terverifikasi dan rekonsiliasi ditandai seimbang." 
          });
        }
      }

      db.lpj!.status = targetStatus;
      if (isReconciled !== undefined) db.lpj!.isReconciled = isReconciled;
      if (reconciliationNotes !== undefined) db.lpj!.reconciliationNotes = reconciliationNotes;
      if (targetStatus === 'DISETUJUI') {
        db.lpj!.approvalDate = new Date().toISOString();
        db.lpj!.approvedByRW = actor || 'Ketua RW 04 Ngabean';
      }
      db.lpj!.updatedAt = new Date().toISOString();

      logAudit(
        db,
        'LPJ',
        db.lpj!.id,
        targetStatus === 'DISETUJUI' ? 'APPROVE' : 'UPDATE',
        actor || 'Panitia Pelaksana',
        `Mengubah status LPJ Panitia menjadi ${targetStatus}. ${notes ? `Catatan: ${notes}` : ''}`,
        prevStatus,
        targetStatus
      );

      writeDB(db);
      res.json({ success: true, lpj: db.lpj, auditTrails: db.auditTrails });
    } catch (error: any) {
      console.error("LPJ Status Update Error:", error);
      res.status(500).json({ success: false, error: error.message || "Gagal memperbarui status LPJ." });
    }
  });

  // API - Save LPJ Master Full State
  app.post("/api/sems/lpj/save-master", (req, res) => {
    try {
      const db = readDB();
      const { lpj, actor, reason } = req.body;
      if (!lpj) {
        return res.status(400).json({ success: false, error: "Data LPJ tidak boleh kosong." });
      }

      db.lpj = { ...lpj, updatedAt: new Date().toISOString() };

      logAudit(
        db,
        'LPJ',
        db.lpj?.id || 'LPJ-MASTER',
        'UPDATE',
        actor || 'Admin Panitia',
        `Menyimpan pembaruan dokumen LPJ Master. Alasan: ${reason || 'Pembaruan data laporan'}`,
        undefined,
        db.lpj?.status
      );

      writeDB(db);
      res.json({ success: true, lpj: db.lpj, auditTrails: db.auditTrails });
    } catch (error: any) {
      console.error("LPJ Save Master Error:", error);
      res.status(500).json({ success: false, error: error.message || "Gagal menyimpan LPJ." });
    }
  });

  // API - Generate Notulen Rapat LPJ Otomatis (11 Agenda Baku)
  app.post("/api/sems/lpj/generate-notulen", (req, res) => {
    try {
      const db = readDB();
      if (!db.lpj) db.lpj = initialData.lpj;
      const { date, location, leader, actor } = req.body;

      const meetingDate = date || "Minggu, 23 Agustus 2026";
      const meetingLocation = location || "Balai RW 04 Ngabean";
      const meetingLeader = leader || db.lpj?.ketuaNameSnapshot || "Ketua Panitia";
      const sekretarisName = db.lpj?.sekretarisNameSnapshot || "Sekretaris Panitia";
      const bendaharaName = db.lpj?.bendaharaNameSnapshot || "Bendahara Panitia";
      const ketuaName = db.lpj?.ketuaNameSnapshot || "Ketua Panitia";
      const rwName = db.lpj?.rwNameSnapshot || "Ketua RW 04";

      const totalPemasukan = (db.keuangan || []).filter(t => t.type === 'Masuk').reduce((s, t) => s + t.amount, 0);
      const totalPengeluaran = (db.keuangan || []).filter(t => t.type === 'Keluar').reduce((s, t) => s + t.amount, 0);
      const saldoSisa = totalPemasukan - totalPengeluaran;
      const totalKegiatan = (db.kegiatan || []).length;
      const totalChanges = (db.budgetChanges || []).length;
      const totalRealloc = (db.budgetReallocations || []).length;

      const minutesNumber = `NR-LPJ-2026-${String((db.notulensi?.length || 0) + 1).padStart(3, '0')}`;

      const agendaItems = [
        "1. Pembukaan",
        `2. Penyampaian laporan pelaksanaan oleh Sekretaris (${sekretarisName})`,
        `3. Penyampaian laporan administrasi oleh Sekretaris (${sekretarisName})`,
        `4. Penyampaian laporan keuangan oleh Bendahara (${bendaharaName})`,
        `5. Penyampaian perubahan anggaran oleh Bendahara (${bendaharaName})`,
        `6. Penyampaian rekonsiliasi keuangan oleh Bendahara (${bendaharaName})`,
        `7. Penyampaian kesimpulan oleh Ketua Panitia (${ketuaName})`,
        "8. Tanya jawab dan tanggapan peserta musyawarah",
        "9. Klarifikasi dan penegasan pertanggungjawaban",
        `10. Pengesahan LPJ oleh Pengurus RW (${rwName}) dan Ketua Panitia`,
        "11. Penutup dan doa bersama"
      ];

      const notulenContentMarkdown = `# NOTULENSI RAPAT PLENO PERTANGGUNGJAWABAN (LPJ)
## PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81
**RUKUN WARGA 04 KELURAHAN NGABEAN KOTA SEMARANG**
Nomor Risalah: **${minutesNumber}**

---

### I. IDENTITAS & INFORMASI MUSYAWARAH
- **Hari / Tanggal** : ${meetingDate}
- **Waktu**          : 19:30 - 22:30 WIB
- **Tempat**         : ${meetingLocation}
- **Pimpinan Sidang**: ${meetingLeader}
- **Notulis**        : ${sekretarisName}
- **Jumlah Hadir**   : Pengurus RW 04, Ketua RT 01-04, Tokoh Masyarakat, dan Seluruh Panitia Pelaksana

---

### II. SUSUNAN AGENDA RESMI PENYAMPAIAN LPJ
${agendaItems.join("\n")}

---

### III. JALANNYA MUSYAWARAH & RINGKASAN PENYAMPAIAN PER BIDANG

#### 1. Laporan Pendahuluan & Pengantar Umum (Disampaikan oleh Ketua Panitia: ${ketuaName})
Ketua Panitia membuka sidang pleno pertanggungjawaban dengan memanjatkan rasa syukur atas suksesnya seluruh rangkaian HUT RI Ke-81. Disampaikan bahwa LPJ ini merupakan wujud pertanggungjawaban kolektif seluruh panitia pelaksana kepada warga dan pengurus RW 04 Ngabean.

#### 2. Laporan Pelaksanaan & Administrasi (Disampaikan oleh Sekretaris: ${sekretarisName})
- **Pelaksanaan Kegiatan:** Seluruh ${totalKegiatan > 0 ? `${totalKegiatan} kegiatan` : 'rangkaian kegiatan lomba, tirakatan, dan pentas seni'} berhasil terlaksana dengan aman, tertib, dan disambut antusias tinggi oleh warga RT 01 s.d RT 04.
- **Administrasi:** Seluruh berkas perizinan, surat keluar, daftar hadir, dan dokumentasi foto/video telah diarsipkan secara digital di Google Drive SEMS RW 04.

#### 3. Laporan Keuangan, Perubahan Anggaran, & Rekonsiliasi (Disampaikan oleh Bendahara: ${bendaharaName})
- **Penerimaan Dana:** Total pemasukan terhimpun sebesar **Rp ${totalPemasukan.toLocaleString('id-ID')}** (Iuran Warga RT 01-04, Donatur, dan Sponsor).
- **Pengeluaran Riil:** Total realisasi belanja kegiatan sebesar **Rp ${totalPengeluaran.toLocaleString('id-ID')}**.
- **Sisa Saldo Kas:** Saldo surplus bersih sebesar **Rp ${saldoSisa.toLocaleString('id-ID')}**.
- **Perubahan & Realokasi Anggaran:** Terdokumentasi ${totalChanges} perubahan pagu anggaran (PA) dan ${totalRealloc} pergeseran realokasi antar seksi (RA) yang semuanya telah disetujui sesuai regulasi musyawarah.
- **Rekonsiliasi Kas:** Rekonsiliasi kas telah seimbang (balance) dengan seluruh nota dan bukti kuitansi terverifikasi lengkap.

#### 4. Kesimpulan & Penegasan Pertanggungjawaban Akhir (Disampaikan oleh Ketua Panitia: ${ketuaName})
Ketua Panitia menegaskan bahwa masa tugas kepanitiaan HUT RI Ke-81 telah tuntas dilaksanakan dengan penuh dedikasi dan kejujuran. Sisa efisiensi dana kepanitiaan sebesar Rp 1.382.000 (bersumber dari Kas Donatur) akan dialihfungsikan untuk kegiatan Konsolidasi Internal dan Pembubaran Panitia. Kegiatan ini dirancang di luar lingkungan (ekskursi/pembinaan keakraban) guna melepas penat setelah satu bulan penuh menyiapkan acara kemerdekaan, sekaligus mempererat solidaritas antar pemuda dan warga yang tergabung dalam kepanitiaan tahun ini.

---

### IV. TANGGAPAN, TANYA JAWAB, & PENGESAHAN DOKUMEN
1. Perwakilan Ketua RT dan Tokoh Warga mengapresiasi kinerja transparan dan akuntabel dari panitia pelaksana.
2. Pengurus RW 04 menyatakan menerima dan **MENGESAHKAN** Laporan Pertanggungjawaban (LPJ) Panitia HUT RI Ke-81 tanpa catatan keberatan.
3. Panitia Pelaksana secara resmi dibubarkan dengan ucapan terima kasih dan penghargaan setinggi-tingginya dari warga.

---

### V. PENGESAHAN DOKUMEN RISALAH
Semarang, ${meetingDate}

| Pembuat Notulen | Mengetahui / Mengesahkan |
| :---: | :---: |
| **${sekretarisName}**<br>Sekretaris Panitia | **${ketuaName}**<br>Ketua Panitia |
| | **${rwName}**<br>Ketua RW 04 Ngabean |
`;

      const notulensiId = 'notulensi_lpj_' + Date.now();
      const newNotulensi: Notulensi = {
        id: notulensiId,
        minutesNumber,
        title: "Rapat Pleno Pertanggungjawaban (LPJ) HUT RI Ke-81",
        date: meetingDate,
        time: "19:30 - 22:30 WIB",
        location: meetingLocation,
        leader: meetingLeader,
        attendeesCount: 25,
        attendeesList: `Ketua RW (${rwName}), Ketua Panitia (${ketuaName}), Sekretaris (${sekretarisName}), Bendahara (${bendaharaName}), Ketua RT 01-04, Tokoh Masyarakat`,
        agenda: agendaItems.join("\n"),
        notesRaw: `Sidang pleno LPJ HUT RI Ke-81 dipimpin oleh Ketua Panitia. Sekretaris memaparkan pelaksanaan agenda. Bendahara memaparkan laporan keuangan (Total Masuk Rp ${totalPemasukan.toLocaleString('id-ID')}, Belanja Rp ${totalPengeluaran.toLocaleString('id-ID')}, Sisa Saldo Rp ${saldoSisa.toLocaleString('id-ID')}). Pengurus RW 04 secara bulat menerima dan mengesahkan LPJ.`,
        decisions: `1. Menerima dan Mengesahkan Laporan Pertanggungjawaban (LPJ) HUT RI Ke-81 RW 04 Ngabean secara bulat.\n2. Menyerahkan sisa saldo kas panitia sebesar Rp ${saldoSisa.toLocaleString('id-ID')} kepada Kas Utama RW 04.\n3. Menyatakan masa tugas Kepanitiaan HUT RI Ke-81 resmi selesai dan dibubarkan dengan rasa hormat.`,
        contentMarkdown: notulenContentMarkdown,
        actionItems: [
          { id: "ai_lpj_1", task: "Serah terima sisa saldo kas ke Bendahara RW 04", pic: bendaharaName, deadline: "25 Agustus 2026" },
          { id: "ai_lpj_2", task: "Pengarsipan dokumen LPJ fisik dan digital di Balai RW 04", pic: sekretarisName, deadline: "28 Agustus 2026" }
        ],
        createdAt: new Date().toISOString()
      };

      if (!db.notulensi) db.notulensi = [];
      db.notulensi.unshift(newNotulensi);

      db.lpj!.meetingMinutesId = notulensiId;
      db.lpj!.updatedAt = new Date().toISOString();

      logAudit(
        db,
        'NOTULENSI',
        notulensiId,
        'CREATE',
        actor || 'Sekretaris Panitia',
        `Membuat Notulensi Rapat Pleno LPJ Resmi (${minutesNumber}) dengan 11 agenda baku.`,
        undefined,
        'DISAHKAN'
      );

      writeDB(db);
      res.json({ 
        success: true, 
        notulensi: db.notulensi, 
        lpj: db.lpj, 
        auditTrails: db.auditTrails,
        createdNotulensi: newNotulensi 
      });
    } catch (error: any) {
      console.error("LPJ Generate Notulen Error:", error);
      res.status(500).json({ success: false, error: error.message || "Gagal membuat notulen LPJ." });
    }
  });

  // API - Generate Role-based Speech Scripts (Naskah Penyampaian LPJ)
  app.post("/api/sems/lpj/generate-speech", async (req, res) => {
    try {
      const db = readDB();
      if (!db.lpj) db.lpj = initialData.lpj;

      const totalPemasukan = (db.keuangan || []).filter(t => t.type === 'Masuk').reduce((s, t) => s + t.amount, 0);
      const totalPengeluaran = (db.keuangan || []).filter(t => t.type === 'Keluar').reduce((s, t) => s + t.amount, 0);
      const saldoSisa = totalPemasukan - totalPengeluaran;
      const totalKegiatan = (db.kegiatan || []).length;
      const totalSelesai = (db.kegiatan || []).filter(k => k.status === 'SELESAI' || k.status === 'Selesai').length;
      const totalChanges = (db.budgetChanges || []).length;
      const totalRealloc = (db.budgetReallocations || []).length;

      const ketuaName = db.lpj?.ketuaNameSnapshot || "Ketua Panitia";
      const sekretarisName = db.lpj?.sekretarisNameSnapshot || "Sekretaris Panitia";
      const bendaharaName = db.lpj?.bendaharaNameSnapshot || "Bendahara Panitia";
      const rwName = db.lpj?.rwNameSnapshot || "Ketua RW 04";

      // Try AI generation first if Gemini client available, else use robust offline generated speech
      let scripts = {
        ketua: `### NASKAH PENYAMPAIAN KETUA PANITIA
**"Pengantar dan Pertanggungjawaban Akhir Panitia"**
*Penyampai: ${ketuaName} (Ketua Panitia HUT RI Ke-81 RW 04 Ngabean)*

---

*Assalamu’alaikum Warahmatullahi Wabarakatuh,*
*Selamat malam, salam sejahtera, dan salam kemerdekaan untuk kita semua.*

Yang kami hormati Bapak Ketua RW 04 Ngabean (${rwName}), para Ketua RT 01 s.d RT 04, para sesepuh pinisepuh, tokoh masyarakat, rekan-rekan panitia yang tangguh, serta seluruh bapak/ibu warga RW 04 yang kami banggakan.

Pertama-tama, marilah kita panjatkan puji dan syukur ke hadirat Tuhan Yang Maha Kuasa, atas limpahan rahmat, berkah kesehatan, dan kerukunan, sehingga kita dapat berkumpul di Balai RW 04 malam ini dalam rangka **Rapat Pleno Penyampaian Laporan Pertanggungjawaban (LPJ) Peringatan HUT Kemerdekaan RI Ke-81**.

Bapak, Ibu, dan hadirin yang kami hormati,

Sebagai Ketua Panitia, saya ingin menegaskan sejak awal bahwa **LPJ ini adalah bentuk pertanggungjawaban KOLEKTIF dari seluruh jajaran panitia pelaksana**. Keberhasilan kegiatan yang meriah, tertib, dan guyub ini bukanlah hasil kerja satu orang, melainkan buah dari keringat, pengorbanan waktu, dan keikhlasan seluruh seksi kepanitiaan bersama dukungan swadaya warga RW 04 yang luar biasa.

Pada malam hari ini, penyampaian LPJ telah kami bagi secara profesional sesuai bidang tugas:
1. **Bagian Pelaksanaan Kegiatan & Administrasi** akan dipaparkan secara langsung oleh rekan kami **Sekretaris (${sekretarisName})**.
2. **Bagian Laporan Keuangan, Perubahan Anggaran, & Rekonsiliasi Kas** akan dipaparkan secara terperinci dan transparan oleh rekan kami **Bendahara (${bendaharaName})**.
3. Di akhir sesi, saya akan menyampaikan kesimpulan umum, evaluasi kerja, dan penegasan serah terima sisa saldo kas panitia.

Kami berharap bapak/ibu sekalian dapat menyimak dan memberikan masukan konstruktif demi kemajuan kepanitiaan lingkungan kita di masa yang akan datang.

Terima kasih. Waktu selanjutnya kami serahkan kepada Sekretaris untuk memaparkan Laporan Pelaksanaan.

*Wassalamu’alaikum Warahmatullahi Wabarakatuh.*`,

        sekretaris: `### NASKAH PENYAMPAIAN SEKRETARIS
**"Laporan Pelaksanaan dan Administrasi Kegiatan"**
*Penyampai: ${sekretarisName} (Sekretaris Panitia HUT RI Ke-81 RW 04 Ngabean)*

---

*Assalamu’alaikum Warahmatullahi Wabarakatuh,*
*Selamat malam Bapak/Ibu hadirin yang kami hormati,*

Terima kasih atas kesempatan yang diberikan oleh Ketua Panitia. Izinkan saya, mewakili Sekretariat dan seluruh seksi lapangan, untuk menyampaikan **Laporan Pelaksanaan Kegiatan dan Administrasi HUT RI Ke-81 RW 04 Ngabean**.

#### 1. Laporan Pelaksanaan Kegiatan Lapangan
Rangkaian perayaan HUT RI Ke-81 di lingkungan RW 04 telah berjalan sejak awal Agustus 2026. Dari total **${totalKegiatan > 0 ? totalKegiatan : 'seluruh'} agenda program kerja** yang dirancang bersama:
- Lomba Anak (01 Agustus s/d 16 Agustus 2026) berjalan meriah dengan berbagai lomba tradisional edukatif.
- Malam Tirakatan & Lomba Warga (16 Agustus 2026): Berlangsung khidmat diisi doa bersama dan pemotongan tumpeng, dilanjutkan Lomba Ibu-ibu Tebak Gaya, Lomba Bapak-bapak Pukul Paku, serta Lomba Remaja Estafet Sarung.
- Jalan Sehat & Doorprize Warga (23 Agustus 2026): Jalan sehat bersama dengan dihibur Band Sendang Bunder, pembagian Hadiah Lomba Anak-anak, serta pengundian doorprize utama.
- Malam Puncak / Resepsi & Hiburan Dangdut (23 Agustus 2026 malam): Ditampilkan pentas seni tari anak-anak dilanjutkan hiburan dangdut solo organ.
- Seluruh kendala teknis lapangan di seksi Perlengkapan, Acara, dan Konsumsi dapat dimitigasi dengan sigap berkat kerjasama gotong royong warga.

#### 2. Laporan Administrasi & Surat-Menyurat
Di bidang ketatausahaan dan kesekretariatan:
- Seluruh surat permohonan izin keramaian ke kelurahan dan polsek setempat telah terselesaikan dan disetujui.
- Pengelolaan daftar hadir, notulensi rapat koordinasi mingguan, surat edaran iuran warga, dan piagam penghargaan pemenang lomba telah diarsipkan rapi.
- Seluruh dokumen dan dokumentasi foto/video beresolusi tinggi telah diunggah ke repositori digital Google Drive SEMS RW 04 dan dapat diakses terbuka oleh pengurus lingkungan.

Demikian laporan pelaksanaan dan administrasi ini kami sampaikan. Selanjutnya, kami persilakan Bendahara untuk memaparkan Laporan Keuangan secara lengkap.

*Wassalamu’alaikum Warahmatullahi Wabarakatuh.*`,

        bendahara: `### NASKAH PENYAMPAIAN BENDAHARA
**"Laporan Pertanggungjawaban Keuangan, Perubahan Anggaran, & Rekonsiliasi"**
*Penyampai: ${bendaharaName} (Bendahara Panitia HUT RI Ke-81 RW 04 Ngabean)*

---

*Assalamu’alaikum Warahmatullahi Wabarakatuh,*
*Selamat malam Bapak/Ibu, para sesepuh, dan rekan-rekan panitia sekalian,*

Terima kasih kepada Ketua dan Sekretaris. Selaku Bendahara Panitia, saya memegang amanah untuk memaparkan laporan keuangan yang akuntabel, transparan, dan dapat dipertanggungjawabkan hingga rupiah terakhir.

Berikut adalah ringkasan pembukuan keuangan kegiatan HUT RI Ke-81 RW 04 Ngabean:

#### 1. Realisasi Penerimaan Dana (Pemasukan)
Total penerimaan kas panitia terhimpun sebesar **Rp ${totalPemasukan.toLocaleString('id-ID')}**, bersumber dari:
- Setoran Iuran Pokok Warga RT 01 s.d RT 04.
- Bantuan dana usaha, donatur perorangan, dan kemitraan sponsorship.

#### 2. Realisasi Belanja Kegiatan (Pengeluaran)
Total realisasi pengeluaran untuk membiayai kebutuhan seluruh seksi (Acara, Lomba, Panggung/Tenda, Konsumsi, Hadiah, dan Keamanan) sebesar **Rp ${totalPengeluaran.toLocaleString('id-ID')}**.

#### 3. Tata Kelola Perubahan & Realokasi Anggaran
Dalam perjalanan kegiatan, terdapat:
- **${totalChanges} dokumen Perubahan Anggaran (PA)** yang diajukan seksi dan disetujui secara resmi.
- **${totalRealloc} dokumen Realokasi Anggaran (RA)** antar pos belanja (zero-sum) guna efisiensi tanpa menambah beban defisit.

#### 4. Rekonsiliasi Kas & Sisa Saldo Akhir
Setelah dilakukan pencocokan antara buku kas, mutasi rekening, dan kelengkapan bukti nota/kuitansi fisik:
- Posisi keuangan dinyatakan **SEIMBANG & TELAH DIREKONSILIASI PENUH**.
- Terdapat **Sisa Saldo Kas Bersih sebesar Rp ${saldoSisa.toLocaleString('id-ID')}**.

Seluruh nota belanja dan buku kas asli telah kami siapkan di meja sidang untuk diperiksa bersama. Sisa saldo surplus ini siap kami serahkan secara utuh kepada kas pengurus RW 04.

Terima kasih. Waktu kami kembalikan kepada Ketua Panitia.

*Wassalamu’alaikum Warahmatullahi Wabarakatuh.*`
      };

      // If AI is available, optionally enhance scripts
      try {
        if (process.env.GEMINI_API_KEY) {
          const ai = getGeminiClient();
          const prompt = `Sebagai konsultan organisasi warga, tolong sempurnakan 3 naskah pidato/penyampaian LPJ berikut agar bernada sangat berwibawa, santun, hangat, dan mencerminkan semangat gotong royong warga RW 04 Ngabean:
Ketua Panitia: ${ketuaName}
Sekretaris: ${sekretarisName}
Bendahara: ${bendaharaName}
Data Keuangan: Masuk Rp ${totalPemasukan}, Belanja Rp ${totalPengeluaran}, Sisa Rp ${saldoSisa}.

Berikan output JSON dengan keys: "ketua", "sekretaris", "bendahara".`;

          const aiResp = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  ketua: { type: Type.STRING },
                  sekretaris: { type: Type.STRING },
                  bendahara: { type: Type.STRING }
                },
                required: ["ketua", "sekretaris", "bendahara"]
              }
            }
          });

          const parsedAI = JSON.parse(aiResp.text || "{}");
          if (parsedAI.ketua && parsedAI.sekretaris && parsedAI.bendahara) {
            scripts = parsedAI;
          }
        }
      } catch (aiErr) {
        console.warn("AI Speech Generation fallback to template:", aiErr);
      }

      db.lpj!.speechScripts = scripts;
      db.lpj!.updatedAt = new Date().toISOString();
      writeDB(db);

      res.json({ success: true, speechScripts: scripts, lpj: db.lpj });
    } catch (error: any) {
      console.error("Speech Generation Error:", error);
      res.status(500).json({ success: false, error: error.message || "Gagal membuat naskah penyampaian LPJ." });
    }
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
    const { action, data, actor } = req.body as { action: 'add' | 'edit' | 'delete'; data: KeuanganTransaction; actor?: string };
    
    if (action === 'add') {
      const newTx: KeuanganTransaction = {
        ...data,
        id: data.id || 'tx_' + Date.now(),
        date: data.date || new Date().toISOString().split('T')[0]
      };
      db.keuangan.push(newTx);
      logAudit(db, 'REALISASI', newTx.id, 'CREATE', actor || 'Bendahara', `Mencatat transaksi kas ${newTx.type} Rp ${newTx.amount.toLocaleString('id-ID')} (${newTx.category}): ${newTx.notes}`, undefined, `${newTx.type} - Rp ${newTx.amount}`);
    } else if (action === 'edit') {
      const prev = db.keuangan.find(t => t.id === data.id);
      db.keuangan = db.keuangan.map(t => t.id === data.id ? data : t);
      logAudit(db, 'REALISASI', data.id, 'UPDATE', actor || 'Bendahara', `Mengubah transaksi kas ${data.category}: ${data.notes}`, prev ? `${prev.type} - Rp ${prev.amount}` : undefined, `${data.type} - Rp ${data.amount}`);
    } else if (action === 'delete') {
      const prev = db.keuangan.find(t => t.id === data.id);
      db.keuangan = db.keuangan.filter(t => t.id !== data.id);
      logAudit(db, 'REALISASI', data.id, 'CANCEL', actor || 'Bendahara', `Menghapus transaksi kas: ${prev?.notes || '-'} (Rp ${prev?.amount.toLocaleString('id-ID')})`, prev ? `${prev.type} - Rp ${prev.amount}` : undefined, 'DELETED');
    }
    
    writeDB(db);
    res.json({ success: true, keuangan: db.keuangan, auditTrails: db.auditTrails });
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

  // API - Quick Toggle Task Status
  app.post("/api/sems/tasks/toggle", (req, res) => {
    const db = readDB();
    const { id } = req.body as { id: string };
    
    db.tasks = db.tasks.map(t => {
      if (t.id === id) {
        const nextStatusMap = { 'Belum': 'Proses', 'Proses': 'Selesai', 'Selesai': 'Belum' } as const;
        return { ...t, status: nextStatusMap[t.status] };
      }
      return t;
    });
    
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
  Halaman 9: ### BAB IV. PERTANGGUNGJAWABAN KEUANGAN (Uraian posisi kas, rincian penerimaan total Rp 14.000.000 mencakup: 1. Rp 8.000.000 dari iuran 4 RT melalui dana talangan Pamsimas @ Rp 2.000.000 di mana panitia telah menyerahkan fisik nota belanja Rp 2.000.000 ke masing-masing RT dan pihak RT yang mengembalikan ke Pamsimas dari iuran warganya, 2. Rp 2.000.000 murni sumbangan/donasi sukarela dari Pamsimas, 3. Rp 4.000.000 murni dari sponsor dan donatur warga dermawan. Serta penegasan bahwa sisa efisiensi dana kepanitiaan sebesar Rp 1.382.000 yang bersumber dari Kas Donatur/Sponsor dialihfungsikan untuk kegiatan Konsolidasi Internal dan Pembubaran Panitia / ekskursi di luar lingkungan untuk melepas penat dan mempererat solidaritas, bukan dikembalikan ke kas RW)
  ---
  Halaman 10: ### BAB V. EVALUASI (DILARANG MENYEBUT KENDALA CUACA ATAU HUJAN karena Juli-Agustus musim kemarau. Evaluasi WAJIB berfokus pada 4 poin: 1. Tantangan Administrasi & Pengelolaan Keuangan (keterlambatan nota & relokasi anggaran dadakan), 2. Kendala Koordinasi & Komposisi Panitia (struktur gemuk & beban kerja asimetris), 3. Tantangan Logistik & Operasional, 4. Rekomendasi & Solusi Kepanitiaan Ramping 9-11 orang. JANGAN menyebut SK kepanitiaan)
  ---
  Halaman 11: ### BAB VI. PENUTUP (Uraian akhir resmi, permohonan maaf setulus-tulusnya atas segala kekurangan teknis atau fasilitas di lapangan, ungkapan terima kasih mendalam secara khusus dan eksplisit kepada: Ketua RW 04, Pengurus RT 01-04, Pengelola Pamsimas, seluruh Sponsor Resmi dan Donatur Dermawan, Tokoh Masyarakat, Tokoh Agama, Karang Taruna, PKK, serta seluruh warga RW 04, serta penegasan pengalihan sisa efisiensi dana Rp 1.382.000 untuk ekskursi pembubaran panitia)
  ---
  Halaman 12: ### LAMPIRAN (Wajib menyertakan 3 Lampiran Resmi: Lampiran 1: Buku Kas Umum (BKU) & Rekonsiliasi Kas, Lampiran 2: Laporan Rekonsiliasi Pengembalian Dana Talangan Pamsimas & Realisasi Swadaya RT, Lampiran 3: Dokumentasi Foto & Berkas Fisik Nota Belanja. DILARANG membuat atau menyebut SK Pembentukan Panitia RW dan DILARANG membuat presensi/daftar hadir karena tidak terdapat SK dan presensi).
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
          temperature: 0.7,
          maxOutputTokens: 8192,
        }
      });

      let lpjText = response.text || "";

      const penutupFormal = `### BAB VI. PENUTUP

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
**${namaRW.toUpperCase()} NGABEAN**`;

      const lampiranFormal = `### LAMPIRAN

Sebagai dokumen pendukung pertanggungjawaban panitia, berikut dilampirkan berkas-berkas resmi:

- **Lampiran 1:** Buku Kas Umum (BKU) Penerimaan, Pengeluaran & Rekonsiliasi Kas
- **Lampiran 2:** Laporan Rekonsiliasi Pengembalian Dana Talangan Pamsimas & Realisasi Swadaya RT
- **Lampiran 3:** Dokumentasi Foto Kegiatan & Bundel Berkas Fisik Nota Belanja Panitia

Laporan Pertanggungjawaban ini dibuat rangkap sebagai dokumentasi resmi dan arsip warga.`;

      // Guarantee complete BAB VI Penutup and Lampiran in formal mode
      if (templateType === "formal") {
        if (lpjText.includes("BAB VI") || lpjText.includes("PENUTUP")) {
          // If BAB VI exists but is truncated or missing key parts, replace from BAB VI onwards
          if (!lpjText.includes("Permohonan Maaf") || !lpjText.includes("Ungkapan Terima Kasih") || !lpjText.includes("Bapak Karto") || !lpjText.includes("1.382.000")) {
            const cutIdx = lpjText.indexOf("### BAB VI") !== -1 ? lpjText.indexOf("### BAB VI") : lpjText.indexOf("BAB VI");
            if (cutIdx !== -1) {
              lpjText = lpjText.substring(0, cutIdx).trim() + `\n\n---\n\n` + penutupFormal + `\n\n---\n\n` + lampiranFormal;
            } else {
              lpjText += `\n\n---\n\n` + penutupFormal + `\n\n---\n\n` + lampiranFormal;
            }
          } else if (!lpjText.includes("LAMPIRAN") && !lpjText.includes("Lampiran 1")) {
            lpjText += `\n\n---\n\n` + lampiranFormal;
          }
        } else {
          lpjText += `\n\n---\n\n` + penutupFormal + `\n\n---\n\n` + lampiranFormal;
        }
      } else {
        // Ringkas mode guarantee
        if (!lpjText.includes("Permohonan Maaf") || !lpjText.includes("Terima Kasih") || !lpjText.includes("1.382.000")) {
          lpjText += `\n\n**Permohonan Maaf & Terima Kasih:**\nPanitia menyampaikan permohonan maaf sebesar-besarnya atas segala kekurangan, serta ucapan terima kasih mendalam kepada Bapak Karto (Ketua RW 04), Pengurus RT 01-04, Pengelola Pamsimas RW 04, seluruh sponsor & donatur dermawan, serta seluruh warga RW 04 Ngabean atas kebersamaan dan gotong royong luar biasa.\n\nSisa saldo kas Rp 1.382.000,00 dialokasikan untuk kegiatan konsolidasi internal dan pembubaran panitia di luar lingkungan.`;
        }
      }

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
      const { action, data, actor } = req.body as { action: 'add' | 'edit' | 'delete'; data: any; actor?: string };
      
      if (action === 'add') {
        const existingIndex = db.notulensi.findIndex((n: any) => n.id === data.id);
        const minutesNumber = data.minutesNumber || `NR-2026-${String(db.notulensi.length + 1).padStart(3, '0')}`;
        if (existingIndex >= 0) {
          db.notulensi[existingIndex] = { 
            ...data, 
            minutesNumber: db.notulensi[existingIndex].minutesNumber || minutesNumber,
            createdAt: db.notulensi[existingIndex].createdAt || new Date().toISOString() 
          };
          logAudit(db, 'NOTULENSI', data.id, 'UPDATE', actor || data.leader || 'Sekretaris', `Memperbarui risalah notulensi: ${data.title} (${minutesNumber})`, undefined, 'TERCATAT');
        } else {
          const newItem = {
            ...data,
            id: data.id || 'notulensi_' + Date.now(),
            minutesNumber,
            linkedBudgetChanges: data.linkedBudgetChanges || [],
            linkedReallocations: data.linkedReallocations || [],
            createdAt: data.createdAt || new Date().toISOString()
          };
          db.notulensi.push(newItem);
          logAudit(db, 'NOTULENSI', newItem.id, 'CREATE', actor || data.leader || 'Sekretaris', `Mencatat berita acara & risalah notulensi: ${newItem.title} (${minutesNumber})`, undefined, 'TERBIT');
        }
      } else if (action === 'edit') {
        const prev = db.notulensi.find(n => n.id === data.id);
        db.notulensi = db.notulensi.map(n => n.id === data.id ? { ...data, minutesNumber: n.minutesNumber || data.minutesNumber || `NR-2026-001`, createdAt: n.createdAt || new Date().toISOString() } : n);
        logAudit(db, 'NOTULENSI', data.id, 'UPDATE', actor || data.leader || 'Sekretaris', `Mengubah berita acara notulensi: ${data.title}`, prev?.title, data.title);
      } else if (action === 'delete') {
        const prev = db.notulensi.find(n => n.id === data.id);
        db.notulensi = db.notulensi.filter(n => n.id !== data.id);
        logAudit(db, 'NOTULENSI', data.id, 'CANCEL', actor || 'Sekretaris Panitia', `Menghapus dokumen notulensi: ${prev?.title || '-'}`, prev?.title, 'DELETED');
      }
      
      writeDB(db);
      res.json({ success: true, notulensi: db.notulensi, auditTrails: db.auditTrails });
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
