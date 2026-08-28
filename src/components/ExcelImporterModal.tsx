import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import { 
  FileSpreadsheet, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  X, 
  ArrowRight, 
  RefreshCcw, 
  Layers,
  Table,
  DollarSign,
  Users,
  Briefcase,
  Sparkles,
  FileCheck
} from "lucide-react";
import { SEMSData, KeuanganTransaction, RKBAItem, Panitia } from "../types";

interface ExcelImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  semsData: SEMSData;
  onUpdateSemsData: (newData: SEMSData) => void;
  initialTarget?: "keuangan" | "rkba" | "panitia" | "auto";
  defaultTargetType?: "keuangan" | "rkba" | "panitia" | "auto";
}

type ImportTarget = "keuangan" | "rkba" | "panitia";

interface FieldMapping {
  excelColumn: string;
  targetField: string;
}

export default function ExcelImporterModal({
  isOpen,
  onClose,
  semsData,
  onUpdateSemsData,
  initialTarget = "keuangan",
  defaultTargetType
}: ExcelImporterModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>("");
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const effectiveTarget = (defaultTargetType || initialTarget);
  const [targetType, setTargetType] = useState<ImportTarget>(
    effectiveTarget === "auto" ? "keuangan" : (effectiveTarget as ImportTarget)
  );

  React.useEffect(() => {
    if (isOpen) {
      const activeTarget = defaultTargetType || initialTarget;
      if (activeTarget && activeTarget !== "auto") {
        setTargetType(activeTarget as ImportTarget);
      }
    }
  }, [isOpen, defaultTargetType, initialTarget]);
  
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<{ count: number; message: string } | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Default Column Definitions for Target Types
  const targetFieldOptions: Record<ImportTarget, { key: string; label: string; aliases: string[] }[]> = {
    keuangan: [
      { key: "date", label: "Tanggal (YYYY-MM-DD)", aliases: ["tanggal", "tgl", "date", "waktu"] },
      { key: "category", label: "Kategori / Jenis", aliases: ["kategori", "category", "jenis", "pos"] },
      { key: "notes", label: "Uraian / Keterangan", aliases: ["uraian", "keterangan", "notes", "description", "nama transaksi", "item"] },
      { key: "amount", label: "Jumlah / Nominal (Rp)", aliases: ["jumlah", "nominal", "amount", "harga", "total", "biaya", "debet", "kredit", "nilai"] },
      { key: "type", label: "Jenis (Masuk/Keluar)", aliases: ["type", "jenis transaksi", "tipe", "masuk/keluar", "alokasi"] },
      { key: "seksi", label: "Seksi Penanggung Jawab", aliases: ["seksi", "divisi", "penanggung jawab", "pj"] },
      { key: "paymentMethod", label: "Metode Bayar", aliases: ["metode", "pembayaran", "payment", "cara bayar"] },
      { key: "proofNumber", label: "No. Kwitansi / Bukti", aliases: ["bukti", "kwitansi", "voucher", "no kwitansi", "ref"] }
    ],
    rkba: [
      { key: "name", label: "Nama Barang / Kegiatan", aliases: ["nama", "barang", "kegiatan", "uraian", "item", "nama barang"] },
      { key: "seksi", label: "Seksi", aliases: ["seksi", "divisi", "penanggung jawab"] },
      { key: "qty", label: "Kuantitas (Qty)", aliases: ["qty", "jumlah", "kuantitas", "banyaknya", "volume"] },
      { key: "unit", label: "Satuan (Paket/Pcs/ls)", aliases: ["satuan", "unit", "sat"] },
      { key: "price", label: "Harga Satuan (Rp)", aliases: ["harga", "harga satuan", "price", "tarif", "satuan rp"] },
      { key: "fundingSource", label: "Sumber Dana", aliases: ["sumber dana", "kas", "sumber"] },
      { key: "category", label: "Kategori Pos", aliases: ["kategori", "pos"] }
    ],
    panitia: [
      { key: "name", label: "Nama Lengkap", aliases: ["nama", "nama lengkap", "name", "panitia"] },
      { key: "jabatan", label: "Jabatan", aliases: ["jabatan", "role", "posisi"] },
      { key: "seksi", label: "Seksi", aliases: ["seksi", "divisi", "bidang"] },
      { key: "phone", label: "No. HP / WhatsApp", aliases: ["phone", "hp", "no hp", "telepon", "wa", "whatsapp"] },
      { key: "rt", label: "Wilayah / RT", aliases: ["rt", "wilayah", "alamat"] }
    ]
  };

  const resetState = () => {
    setFileName("");
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet("");
    setParsedRows([]);
    setHeaders([]);
    setMappings({});
    setImportSummary(null);
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv");
    if (!isExcel) {
      alert("Harap pilih file spreadsheet format .xlsx, .xls, atau .csv!");
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: "binary", cellDates: true });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        
        if (wb.SheetNames.length > 0) {
          const firstSheet = wb.SheetNames[0];
          setSelectedSheet(firstSheet);
          processSheet(wb, firstSheet);
        }
      } catch (err: any) {
        alert("Gagal membaca file Excel: " + err.message);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const processSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    const worksheet = wb.Sheets[sheetName];
    if (!worksheet) return;

    // Convert sheet to json with raw headers
    const rawData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1, defval: "" });
    if (!rawData || rawData.length === 0) {
      setHeaders([]);
      setParsedRows([]);
      return;
    }

    // Find header row (first non-empty array)
    let headerRowIdx = 0;
    while (headerRowIdx < rawData.length && (!rawData[headerRowIdx] || rawData[headerRowIdx].every((cell: any) => cell === ""))) {
      headerRowIdx++;
    }

    if (headerRowIdx >= rawData.length) {
      setHeaders([]);
      setParsedRows([]);
      return;
    }

    const detectedHeaders = rawData[headerRowIdx].map((h: any, idx: number) => String(h || `Kolom ${idx + 1}`).trim());
    setHeaders(detectedHeaders);

    // Objects from subsequent rows
    const dataRows = rawData.slice(headerRowIdx + 1).filter((row: any[]) => row && row.some(cell => cell !== "" && cell !== null && cell !== undefined));
    
    const formattedObjects = dataRows.map((rowArr: any[]) => {
      const obj: Record<string, any> = {};
      detectedHeaders.forEach((h: string, idx: number) => {
        obj[h] = rowArr[idx] !== undefined ? rowArr[idx] : "";
      });
      return obj;
    });

    setParsedRows(formattedObjects);

    // Auto-map headers based on targetType aliases
    autoMapHeaders(detectedHeaders, targetType);
  };

  const autoMapHeaders = (detectedHeaders: string[], target: ImportTarget) => {
    const newMappings: Record<string, string> = {};
    const targetFields = targetFieldOptions[target];

    targetFields.forEach(tf => {
      const matchedHeader = detectedHeaders.find(dh => {
        const lowerH = dh.toLowerCase().trim();
        return tf.aliases.some(alias => lowerH.includes(alias));
      });
      if (matchedHeader) {
        newMappings[tf.key] = matchedHeader;
      }
    });

    setMappings(newMappings);
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbook) {
      processSheet(workbook, sheetName);
    }
  };

  const handleTargetChange = (newTarget: ImportTarget) => {
    setTargetType(newTarget);
    if (headers.length > 0) {
      autoMapHeaders(headers, newTarget);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Process Import Data into SEMS Data
  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) {
      alert("Tidak ada data yang dapat diimport dari sheet ini.");
      return;
    }

    setIsProcessing(true);
    try {
      const newSemsData = { ...semsData };
      let importedCount = 0;

      if (targetType === "keuangan") {
        const newTxList: KeuanganTransaction[] = parsedRows.map((row, idx) => {
          const rawDate = row[mappings["date"]] || new Date().toISOString().slice(0, 10);
          let formattedDate = String(rawDate);
          if (typeof rawDate === "number") {
            // Excel serial date format
            const parsedD = XLSX.SSF.parse_date_code(rawDate);
            if (parsedD) {
              formattedDate = `${parsedD.y}-${String(parsedD.m).padStart(2, '0')}-${String(parsedD.d).padStart(2, '0')}`;
            }
          }

          const rawAmount = String(row[mappings["amount"]] || "0").replace(/[^0-9.-]/g, "");
          const amount = Math.abs(parseFloat(rawAmount) || 0);

          const rawType = String(row[mappings["type"]] || "").toLowerCase();
          const type: "Masuk" | "Keluar" = rawType.includes("masuk") || rawType.includes("pemasukan") || rawType.includes("debet") || rawType.includes("in") ? "Masuk" : "Keluar";

          return {
            id: `trx_excel_${Date.now()}_${idx}`,
            type,
            date: formattedDate.length === 10 ? formattedDate : new Date().toISOString().slice(0, 10),
            category: String(row[mappings["category"]] || "Lain-lain").trim(),
            amount,
            notes: String(row[mappings["notes"]] || "Import dari Excel").trim(),
            seksi: String(row[mappings["seksi"]] || "Umum").trim(),
            paymentMethod: (String(row[mappings["paymentMethod"]] || "Tunai").includes("Transfer") ? "Transfer" : "Tunai") as "Tunai" | "Transfer",
            proofStatus: "Lengkap" as const,
            proofNumber: String(row[mappings["proofNumber"]] || `EXCEL-${idx + 1}`).trim()
          };
        }).filter(t => t.amount > 0 || t.notes.length > 0);

        importedCount = newTxList.length;
        if (importMode === "replace") {
          newSemsData.keuangan = newTxList;
        } else {
          newSemsData.keuangan = [...(newSemsData.keuangan || []), ...newTxList];
        }

      } else if (targetType === "rkba") {
        const newRkbaList: RKBAItem[] = parsedRows.map((row, idx) => {
          const rawPrice = String(row[mappings["price"]] || "0").replace(/[^0-9.-]/g, "");
          const price = parseFloat(rawPrice) || 0;
          const rawQty = String(row[mappings["qty"]] || "1").replace(/[^0-9.-]/g, "");
          const qty = parseFloat(rawQty) || 1;
          const total = qty * price;

          return {
            id: `rkba_excel_${Date.now()}_${idx}`,
            activityCode: `ACT-${String((newSemsData.rkba?.length || 0) + idx + 1).padStart(3, "0")}`,
            name: String(row[mappings["name"]] || `Item Excel ${idx + 1}`).trim(),
            seksi: String(row[mappings["seksi"]] || "Umum").trim(),
            qty,
            unit: String(row[mappings["unit"]] || "Paket").trim(),
            price,
            total,
            fundingSource: (String(row[mappings["fundingSource"]] || "Kas Utama").includes("Sponsorship") ? "Sponsorship" : "Kas Utama") as "Kas Utama" | "Sponsorship",
            category: String(row[mappings["category"]] || "Perlengkapan").trim(),
            status: "Disetujui" as const,
            activityStatus: "BERJALAN" as const,
            isLockedBaseline: false,
            notes: String(row[mappings["name"]] || "Item RAB Baseline (Import Excel)").trim(),
            dateAdded: new Date().toISOString().slice(0, 10)
          };
        }).filter(r => r.name.length > 0);

        importedCount = newRkbaList.length;
        if (importMode === "replace") {
          newSemsData.rkba = newRkbaList;
        } else {
          newSemsData.rkba = [...(newSemsData.rkba || []), ...newRkbaList];
        }

      } else if (targetType === "panitia") {
        const newPanitiaList: Panitia[] = parsedRows.map((row, idx) => {
          const jabatanStr = String(row[mappings["jabatan"]] || "Anggota").trim();
          return {
            id: `panitia_excel_${Date.now()}_${idx}`,
            name: String(row[mappings["name"]] || `Panitia ${idx + 1}`).trim(),
            jabatan: jabatanStr,
            role: jabatanStr,
            seksi: String(row[mappings["seksi"]] || "Umum").trim(),
            phone: String(row[mappings["phone"]] || "").trim(),
            rt: String(row[mappings["rt"]] || "RT 04").trim()
          };
        }).filter(p => p.name.length > 0);

        importedCount = newPanitiaList.length;
        if (importMode === "replace") {
          newSemsData.panitia = newPanitiaList;
        } else {
          newSemsData.panitia = [...(newSemsData.panitia || []), ...newPanitiaList];
        }
      }

      // Sync with server API
      try {
        const resp = await fetch("/api/sems/sync-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSemsData)
        });
        if (resp.ok) {
          await resp.json();
        }
      } catch (err) {
        console.warn("Backend API offline, saving locally:", err);
      }

      // Local browser state
      try {
        localStorage.setItem("sems_data_backup", JSON.stringify(newSemsData));
      } catch (e) {}

      onUpdateSemsData(newSemsData);
      setImportSummary({
        count: importedCount,
        message: `Berhasil mengimpor ${importedCount} data ${targetType === "keuangan" ? "Transaksi Keuangan" : targetType === "rkba" ? "Pagu Anggaran & RKBA" : "Panitia"}!`
      });

    } catch (err: any) {
      alert("Terjadi kesalahan saat mengimpor data: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = (target: ImportTarget) => {
    let templateData: any[] = [];
    let fileName = "";

    if (target === "keuangan") {
      fileName = "Template_Transaksi_Keuangan_SEMS.xlsx";
      templateData = [
        {
          "Tanggal": "2026-08-16",
          "Uraian / Keterangan": "Pengajuan beli air mineral keperluan Jalan Sehat",
          "Kategori": "Konsumsi Jalan Sehat",
          "Jumlah (Rp)": 418000,
          "Jenis (Masuk/Keluar)": "Keluar",
          "Seksi": "Konsumsi",
          "Metode Bayar": "Tunai",
          "No Kwitansi": "BKK-BU-22"
        },
        {
          "Tanggal": "2026-08-01",
          "Uraian / Keterangan": "Sumbangan Warga RT 01",
          "Kategori": "Iuran & Swadaya Warga",
          "Jumlah (Rp)": 1500000,
          "Jenis (Masuk/Keluar)": "Masuk",
          "Seksi": "Bendahara",
          "Metode Bayar": "Transfer",
          "No Kwitansi": "BKM-BU-01"
        }
      ];
    } else if (target === "rkba") {
      fileName = "Template_RAB_Anggaran_SEMS.xlsx";
      templateData = [
        {
          "Nama Barang / Kegiatan": "MMT / Banner Panggung Utama",
          "Seksi": "Sekretaris",
          "Kuantitas": 1,
          "Satuan": "Paket",
          "Harga Satuan (Rp)": 400000,
          "Sumber Dana": "Kas Utama",
          "Kategori Pos": "Perlengkapan"
        },
        {
          "Nama Barang / Kegiatan": "Hadiah Utama Doorprize Jalan Sehat",
          "Seksi": "Seksi Pentas Seni",
          "Kuantitas": 1,
          "Satuan": "Unit",
          "Harga Satuan (Rp)": 1200000,
          "Sumber Dana": "Kas Utama",
          "Kategori Pos": "Hadiah & Doorprize"
        }
      ];
    } else if (target === "panitia") {
      fileName = "Template_Daftar_Panitia_SEMS.xlsx";
      templateData = [
        {
          "Nama Lengkap": "Bambang Mulyono",
          "Jabatan": "Ketua Panitia",
          "Seksi": "Pengurus Inti",
          "No HP / WhatsApp": "081234567890",
          "Wilayah / RT": "RT 04"
        },
        {
          "Nama Lengkap": "Siti Rahmawati",
          "Jabatan": "Koordinator",
          "Seksi": "Konsumsi",
          "No HP / WhatsApp": "085678901234",
          "Wilayah / RT": "RT 02"
        }
      ];
    }

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Import");
    XLSX.writeFile(wb, fileName);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-700 via-red-800 to-amber-700 text-white p-6 flex justify-between items-center relative">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-amber-300">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Import Data File Excel (.xlsx / .csv)
                  <span className="text-xs bg-amber-400 text-slate-900 px-2.5 py-0.5 rounded-full font-semibold">
                    Live Parser
                  </span>
                </h2>
                <p className="text-xs text-red-100 mt-0.5">
                  Unggah file spreadsheet untuk memperbarui Keuangan, RAB, atau Data Panitia secara cepat & otomatis.
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            
            {/* Target Selectors & Template Download */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleTargetChange("keuangan")}
                className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
                  targetType === "keuangan"
                    ? "border-red-600 bg-red-50/80 text-red-900 ring-2 ring-red-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <DollarSign className={`w-5 h-5 ${targetType === "keuangan" ? "text-red-600" : "text-slate-400"}`} />
                  <div>
                    <div className="font-semibold text-sm">Transaksi Keuangan</div>
                    <div className="text-xs text-slate-500">Pemasukan & Pengeluaran</div>
                  </div>
                </div>
                {targetType === "keuangan" && <CheckCircle2 className="w-4 h-4 text-red-600" />}
              </button>

              <button
                type="button"
                onClick={() => handleTargetChange("rkba")}
                className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
                  targetType === "rkba"
                    ? "border-amber-600 bg-amber-50/80 text-amber-900 ring-2 ring-amber-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Briefcase className={`w-5 h-5 ${targetType === "rkba" ? "text-amber-600" : "text-slate-400"}`} />
                  <div>
                    <div className="font-semibold text-sm">Pagu Anggaran & RKBA</div>
                    <div className="text-xs text-slate-500">Rencana Kebutuhan Barang</div>
                  </div>
                </div>
                {targetType === "rkba" && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
              </button>

              <button
                type="button"
                onClick={() => handleTargetChange("panitia")}
                className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
                  targetType === "panitia"
                    ? "border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Users className={`w-5 h-5 ${targetType === "panitia" ? "text-emerald-600" : "text-slate-400"}`} />
                  <div>
                    <div className="font-semibold text-sm">Data Panitia</div>
                    <div className="text-xs text-slate-500">Anggota & Pengurus RW</div>
                  </div>
                </div>
                {targetType === "panitia" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </button>
            </div>

            {/* Template Download Option */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Belum memiliki format Excel yang pas? Unduh contoh template resmi kami:</span>
              </div>
              <button
                onClick={() => handleDownloadTemplate(targetType)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <Download className="w-3.5 h-3.5 text-red-600" />
                Unduh Template Excel
              </button>
            </div>

            {/* Dropzone & Upload */}
            {!parsedRows.length ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                  dragActive 
                    ? "border-red-500 bg-red-50/50 scale-[0.99]" 
                    : "border-slate-300 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-400"
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                />
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-700 flex items-center justify-center mb-4">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Klik untuk memilih file Excel atau drag & drop file ke sini
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Mendukung format spreadsheet <span className="font-semibold text-slate-700">.xlsx, .xls, .csv</span>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* File Info Bar */}
                <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-sm">{fileName}</div>
                      <div className="text-xs text-slate-400">
                        Total {parsedRows.length} baris terdeteksi • {headers.length} kolom
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {sheetNames.length > 1 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-300">Pilih Sheet:</span>
                        <select
                          value={selectedSheet}
                          onChange={(e) => handleSheetChange(e.target.value)}
                          className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none"
                        >
                          {sheetNames.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      onClick={resetState}
                      className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 transition"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                      Ganti File
                    </button>
                  </div>
                </div>

                {/* Column Mapping Configuration */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-600" />
                    Pemetaan Kolom Excel ke Field SEMS ({targetType.toUpperCase()})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {targetFieldOptions[targetType].map((field) => (
                      <div key={field.key} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-amber-200 text-xs">
                        <span className="font-medium text-slate-700">{field.label}:</span>
                        <select
                          value={mappings[field.key] || ""}
                          onChange={(e) => setMappings({ ...mappings, [field.key]: e.target.value })}
                          className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 max-w-[180px]"
                        >
                          <option value="">-- Pilih Kolom --</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center text-xs text-slate-600 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Table className="w-4 h-4 text-slate-500" />
                      Pratinjau 5 Baris Pertama Data Excel:
                    </span>
                    <span>Menampilkan max 5 dari {parsedRows.length} baris</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 font-semibold">#</th>
                          {headers.map((h, i) => (
                            <th key={i} className="p-2.5 font-semibold whitespace-nowrap border-l border-slate-200">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                            {headers.map((h, i) => (
                              <td key={i} className="p-2.5 whitespace-nowrap border-l border-slate-100">
                                {String(row[h] !== undefined ? row[h] : "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Import Mode Options */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-semibold text-slate-700">Mode Penggabungan:</span>
                    <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer">
                      <input 
                        type="radio" 
                        name="importMode" 
                        checked={importMode === "append"} 
                        onChange={() => setImportMode("append")} 
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span>Tambahkan ke Data Ada (Append)</span>
                    </label>

                    <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer">
                      <input 
                        type="radio" 
                        name="importMode" 
                        checked={importMode === "replace"} 
                        onChange={() => setImportMode("replace")} 
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span className="text-red-700 font-medium">Timpa/Ganti Semua (Replace)</span>
                    </label>
                  </div>

                  <button
                    onClick={handleExecuteImport}
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCcw className="w-4 h-4 animate-spin" />
                        Memproses Import...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Import {parsedRows.length} Baris Sekarang
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                </div>

                {/* Success Notification */}
                {importSummary && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>{importSummary.message}</span>
                    </div>
                    <button
                      onClick={onClose}
                      className="px-3 py-1 bg-emerald-700 text-white rounded-lg font-bold hover:bg-emerald-800 transition"
                    >
                      Selesai & Lihat Data
                    </button>
                  </motion.div>
                )}
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
