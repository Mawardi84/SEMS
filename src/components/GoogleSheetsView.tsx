import React, { useState, useEffect } from "react";
import { 
  FileSpreadsheet, 
  LogIn, 
  LogOut, 
  RefreshCw, 
  Check, 
  Link, 
  PlusCircle, 
  Download, 
  Upload,
  AlertTriangle,
  UserCheck,
  ExternalLink
} from "lucide-react";
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken,
  createGoogleSpreadsheet,
  exportDataToGoogleSheet,
  importDataFromGoogleSheet
} from "../lib/googleSheets";
import { SystemSetting, SEMSData } from "../types";
import { User } from "firebase/auth";

interface GoogleSheetsViewProps {
  settings: SystemSetting;
  semsData: SEMSData;
  onSaveSettings: (settings: SystemSetting) => Promise<void>;
  onRefreshData: () => Promise<void>;
  onImportSuccess: (importedData: SEMSData) => Promise<void>;
}

export default function GoogleSheetsView({ 
  settings, 
  semsData, 
  onSaveSettings, 
  onRefreshData,
  onImportSuccess
}: GoogleSheetsViewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualSheetId, setManualSheetId] = useState(settings.sheetId || "");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsAuthenticating(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        showStatus("success", `Berhasil masuk sebagai ${result.user.displayName}`);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      showStatus("error", `Gagal masuk: ${err.message || "Pastikan pop-up diizinkan di browser Anda."}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      showStatus("info", "Anda telah keluar dari akun Google.");
    } catch (err: any) {
      showStatus("error", `Gagal keluar: ${err.message}`);
    }
  };

  const showStatus = (type: "success" | "error" | "info", text: string) => {
    setStatusMessage({ type, text });
    if (type !== "error") {
      setTimeout(() => setStatusMessage(null), 8000);
    }
  };

  // Create New Spreadsheet
  const handleCreateNewSpreadsheet = async () => {
    if (!token) {
      showStatus("error", "Silakan hubungkan akun Google Anda terlebih dahulu.");
      return;
    }
    setIsProcessing(true);
    setStatusMessage({ type: "info", text: "Sedang membuat spreadsheet baru di Google Drive Anda..." });
    
    try {
      const dateStr = new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
      const title = `Database SEMS RW 04 Ngabean (${dateStr})`;
      const result = await createGoogleSpreadsheet(title);
      
      // Save Sheet ID in settings
      const updatedSettings = {
        ...settings,
        sheetId: result.id
      };
      await onSaveSettings(updatedSettings);
      setManualSheetId(result.id);
      
      showStatus("success", `Spreadsheet berhasil dibuat! Nama: "${title}"`);
    } catch (err: any) {
      showStatus("error", `Gagal membuat spreadsheet: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Connect manual ID
  const handleConnectSpreadsheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSheetId.trim()) {
      showStatus("error", "ID Spreadsheet tidak boleh kosong.");
      return;
    }

    // Extract Spreadsheet ID if a full URL is provided
    let extractedId = manualSheetId.trim();
    if (extractedId.includes("docs.google.com/spreadsheets")) {
      const parts = extractedId.split("/d/");
      if (parts[1]) {
        extractedId = parts[1].split("/")[0];
      }
    }

    setIsProcessing(true);
    try {
      const updatedSettings = {
        ...settings,
        sheetId: extractedId
      };
      await onSaveSettings(updatedSettings);
      setManualSheetId(extractedId);
      showStatus("success", "Koneksi ID Spreadsheet berhasil diperbarui.");
    } catch (err: any) {
      showStatus("error", `Gagal memperbarui koneksi: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisconnectSpreadsheet = async () => {
    if (!window.confirm("Apakah Anda yakin ingin memutuskan hubungan spreadsheet? ID spreadsheet akan dihapus dari pengaturan lokal.")) {
      return;
    }
    setIsProcessing(true);
    try {
      const updatedSettings = {
        ...settings,
        sheetId: ""
      };
      await onSaveSettings(updatedSettings);
      setManualSheetId("");
      showStatus("info", "Hubungan spreadsheet berhasil diputuskan.");
    } catch (err: any) {
      showStatus("error", `Gagal memutuskan hubungan: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // EXPORT Data: Local -> Google Sheets
  const handleExportData = async () => {
    if (!settings.sheetId) {
      showStatus("error", "Hubungkan spreadsheet terlebih dahulu.");
      return;
    }
    if (!token) {
      showStatus("error", "Sesi login Google telah kedaluwarsa. Silakan masuk kembali.");
      return;
    }
    
    setIsProcessing(true);
    setStatusMessage({ type: "info", text: "Sedang mengunggah data lokal ke Google Sheets..." });

    try {
      await exportDataToGoogleSheet(settings.sheetId, semsData);
      showStatus("success", "Sinkronisasi EKSPORT Selesai! Seluruh data lokal telah berhasil ditulis ke Google Sheets.");
    } catch (err: any) {
      showStatus("error", `Gagal melakukan eksport data: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // IMPORT Data: Google Sheets -> Local
  const handleImportData = async () => {
    if (!settings.sheetId) {
      showStatus("error", "Hubungkan spreadsheet terlebih dahulu.");
      return;
    }
    if (!token) {
      showStatus("error", "Sesi login Google telah kedaluwarsa. Silakan masuk kembali.");
      return;
    }

    if (!window.confirm("PENTING: Proses sinkronisasi IMPORT akan menimpa seluruh data lokal SEMS dengan data yang berada di Google Sheets Anda. Apakah Anda yakin ingin melanjutkan?")) {
      return;
    }

    setIsProcessing(true);
    setStatusMessage({ type: "info", text: "Sedang mengunduh dan menyelaraskan data dari Google Sheets..." });

    try {
      const importedData = await importDataFromGoogleSheet(settings.sheetId);
      
      // Push to backend server
      const response = await fetch("/api/sems/sync-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(importedData)
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan data impor ke database server.");
      }

      await onImportSuccess(importedData);
      showStatus("success", "Sinkronisasi IMPORT Sukses! Seluruh tabel lokal SEMS telah diselaraskan dengan Google Sheets.");
    } catch (err: any) {
      showStatus("error", `Gagal melakukan import data: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header card with information */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-white"></div>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-50 rounded-xl text-red-600 shrink-0">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-extrabold text-slate-800 uppercase tracking-wide">Google Sheets Sync Integration</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sambungkan aplikasi SEMS Anda dengan Google Sheets untuk mengimpor, mengekspor, dan mengedit data kepanitiaan HUT RI Ke-81 secara kolaboratif langsung melalui spreadsheet Google Drive Anda.
            </p>
          </div>
        </div>
      </div>

      {/* Notification Area */}
      {statusMessage && (
        <div className={`p-4 rounded-lg flex items-start gap-3 border text-xs leading-relaxed font-sans ${
          statusMessage.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : statusMessage.type === "error" 
              ? "bg-rose-50 border-rose-200 text-rose-800" 
              : "bg-blue-50 border-blue-200 text-blue-800"
        }`}>
          {statusMessage.type === "error" ? (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          ) : (
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* STEP 1: Google Account Authentication */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 font-mono">1</span>
            <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Akun Google</h2>
          </div>

          {!user ? (
            <div className="space-y-4 text-center py-4">
              <p className="text-[11px] text-slate-400">Masuk dengan akun Google untuk memberikan izin akses ke Google Drive dan Google Sheets.</p>
              
              <button
                type="button"
                id="btn-google-signin"
                onClick={handleLogin}
                disabled={isAuthenticating}
                className="w-full flex items-center justify-center gap-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded p-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition duration-150 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4 text-slate-500" />
                {isAuthenticating ? "Menghubungkan..." : "Masuk dengan Google"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ""} className="w-9 h-9 rounded-full referrerPolicy='no-referrer' border border-slate-200" />
                ) : (
                  <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm">
                    {user.displayName ? user.displayName[0] : "U"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-slate-800 truncate leading-none mb-0.5">{user.displayName}</p>
                  <p className="text-[10px] text-slate-400 truncate leading-none">{user.email}</p>
                  <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold mt-1.5 uppercase tracking-wide">
                    <UserCheck className="w-3 h-3" />
                    <span>Terhubung</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                id="btn-google-signout"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-1.5 border border-rose-200 hover:bg-rose-50 text-rose-700 text-[10px] font-bold py-1.5 rounded transition uppercase tracking-wide"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar Akun
              </button>
            </div>
          )}
        </div>

        {/* STEP 2: Spreadsheet Connection */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 font-mono">2</span>
            <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Koneksi Spreadsheet</h2>
          </div>

          {!settings.sheetId ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-dashed border-slate-200 p-4 rounded-lg flex flex-col items-center justify-center text-center space-y-3">
                  <PlusCircle className="w-7 h-7 text-red-500 animate-bounce" />
                  <div className="space-y-1">
                    <h3 className="text-[11px] font-bold text-slate-700">Buat Spreadsheet Otomatis</h3>
                    <p className="text-[10px] text-slate-400">Buat file database baru dengan format tabel siap pakai di Google Drive Anda.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateNewSpreadsheet}
                    disabled={isProcessing || !user}
                    className="w-full bg-red-700 hover:bg-red-800 disabled:opacity-55 text-white text-[10px] font-bold py-2 rounded transition uppercase tracking-wide shadow-sm"
                  >
                    {isProcessing ? "Memproses..." : "Buat Spreadsheet Baru"}
                  </button>
                </div>

                <div className="border border-slate-200 p-4 rounded-lg space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Link className="w-3.5 h-3.5 text-slate-400" />
                      Hubungkan Manual
                    </h3>
                    <p className="text-[10px] text-slate-400">Masukkan URL Spreadsheet Google Sheets atau ID Spreadsheet yang sudah ada.</p>
                  </div>

                  <form onSubmit={handleConnectSpreadsheet} className="space-y-2">
                    <input
                      type="text"
                      value={manualSheetId}
                      onChange={(e) => setManualSheetId(e.target.value)}
                      placeholder="Masukkan URL atau ID Spreadsheet"
                      className="w-full text-[11px] border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50/50"
                    />
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold py-2 rounded transition uppercase tracking-wide shadow-sm"
                    >
                      Hubungkan ID
                    </button>
                  </form>
                </div>
              </div>
              {!user && (
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded text-[10px] text-amber-800 font-medium">
                  Harap selesaikan Langkah 1 (Masuk Akun Google) sebelum membuat atau menghubungkan Spreadsheet.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Spreadsheet Terkoneksi</p>
                    <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Database SEMS RW 04 Ngabean
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 break-all select-all">ID: {settings.sheetId}</p>
                  </div>
                  
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${settings.sheetId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-bold text-red-600 hover:text-red-700 bg-white border border-slate-200 p-1.5 rounded transition shadow-2xs shrink-0"
                  >
                    <span>Buka Sheet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200/50 p-2.5 rounded text-[10px] font-sans leading-relaxed">
                  <strong>Status Koneksi Aktif!</strong> Spreadsheet ini memiliki 7 tab utama: <em>Pengaturan, Panitia, Kegiatan, RKBA, Natura, Keuangan, dan Tasks</em> yang tersinkron penuh dengan aplikasi SEMS.
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleDisconnectSpreadsheet}
                  disabled={isProcessing}
                  className="text-[10px] text-slate-400 hover:text-rose-600 font-bold uppercase tracking-wider"
                >
                  Putuskan Hubungan Spreadsheet
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* STEP 3: DATA SYNCHRONIZATION CONTROLS */}
      {settings.sheetId && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 font-mono">3</span>
            <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Sinkronisasi Data Dua Arah (Bi-directional)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* EXPORT: Local -> Sheets */}
            <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 space-y-3.5">
              <div className="space-y-1">
                <h3 className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                  <Upload className="w-4 h-4 text-red-600" />
                  Export Data ke Google Sheets
                </h3>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Unggah seluruh database lokal SEMS Anda (Daftar Anggota, RKBA, Natura, Kas, Program Kerja) ke Google Sheets. Ini akan menimpa baris yang berada di Google Sheets Anda.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportData}
                disabled={isProcessing || !user}
                className="w-full flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded shadow-sm transition uppercase tracking-wider"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {isProcessing ? "Sinkronisasi..." : "Export ke Google Sheets"}
              </button>
            </div>

            {/* IMPORT: Sheets -> Local */}
            <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 space-y-3.5">
              <div className="space-y-1">
                <h3 className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                  <Download className="w-4 h-4 text-emerald-600" />
                  Import Data dari Google Sheets
                </h3>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Tarik baris data dari Google Sheets Anda untuk menggantikan database lokal SEMS. Sangat cocok jika Anda melakukan input massal di Google Sheets dan ingin melihatnya langsung di dashboard.
                </p>
              </div>

              <button
                type="button"
                onClick={handleImportData}
                disabled={isProcessing || !user}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded shadow-sm transition uppercase tracking-wider"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isProcessing ? "Menyelaraskan..." : "Import dari Google Sheets"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
