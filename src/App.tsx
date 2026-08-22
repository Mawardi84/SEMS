import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import LandingPage from "./components/LandingPage";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import RKBAView from "./components/RKBAView";
import KeuanganView from "./components/KeuanganView";
import MonitoringView from "./components/MonitoringView";
import ProposalView from "./components/ProposalView";
import MasterDataView from "./components/MasterDataView";
import SettingView from "./components/SettingView";
import GoogleSheetsView from "./components/GoogleSheetsView";
import GuideBookView from "./components/GuideBookView";
import NotulensiView from "./components/NotulensiView";
import DigitalDocumentsView from "./components/DigitalDocumentsView";
import UndanganRapatView from "./components/UndanganRapatView";
import FestiveEventView from "./components/FestiveEventView";
import PerubahanAnggaranView from "./components/PerubahanAnggaranView";
import RealokasiAnggaranView from "./components/RealokasiAnggaranView";
import ShareAnggaranModal from "./components/ShareAnggaranModal";
import AdminPinModal from "./components/AdminPinModal";
import { SEMSData, SystemSetting, Panitia, Kegiatan, RKBAItem, KeuanganTransaction, Notulensi, DigitalDocument, UndanganRapat, BudgetChange, BudgetReallocation } from "./types";
import { Award, AlertTriangle, RefreshCw, Menu, Clock, Share2, Eye, ShieldCheck, Lock, ArrowLeft } from "lucide-react";

export default function App() {
  // Check if mode is budget-view from URL parameter or localStorage
  const [isBudgetViewOnly, setIsBudgetViewOnly] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get("mode");
        if (mode === "budget-view" || mode === "view" || params.get("view_only") === "true") {
          return true;
        }
        return localStorage.getItem("sems_budget_view_only") === "true";
      }
      return false;
    } catch (e) {
      return false;
    }
  });

  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  const [currentView, setCurrentView] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("sems_current_view");
      const validViews = [
        "dashboard",
        "proposal",
        "notulensi",
        "documents",
        "rkba",
        "perubahan-anggaran",
        "realokasi-anggaran",
        "keuangan",
        "monitoring",
        "master",
        "sheets",
        "panduan",
        "setting",
        "coupon"
      ];
      if (saved && validViews.includes(saved)) {
        return saved;
      }
      return "dashboard";
    } catch (e) {
      return "dashboard";
    }
  });
  const [semsData, setSemsData] = useState<SEMSData | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("sems_current_view", currentView);
    } catch (e) {
      // Ignore errors if localStorage is not accessible
    }
  }, [currentView]);

  // If in budget-view only mode, restrict access to administrative views
  useEffect(() => {
    if (isBudgetViewOnly) {
      const allowedViews = ["dashboard", "panduan", "rkba", "perubahan-anggaran", "realokasi-anggaran", "keuangan", "monitoring"];
      if (!allowedViews.includes(currentView)) {
        setCurrentView("dashboard");
      }
    }
  }, [isBudgetViewOnly, currentView]);

  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState<boolean>(false);

  const handleToggleBudgetViewOnly = (enabled: boolean) => {
    if (!enabled && isBudgetViewOnly) {
      // Trying to switch from view-only to admin mode requires Admin PIN
      setIsAdminPinModalOpen(true);
      return;
    }

    setIsBudgetViewOnly(enabled);
    try {
      localStorage.setItem("sems_budget_view_only", enabled ? "true" : "false");
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (enabled) {
          url.searchParams.set("mode", "budget-view");
        } else {
          url.searchParams.delete("mode");
          url.searchParams.delete("view_only");
        }
        window.history.replaceState({}, "", url.toString());
      }
    } catch (e) {
      // Ignore URL manipulation error in restrictive iframe
    }
  };
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isLandingPage, setIsLandingPage] = useState<boolean>(true);

  // Live Countdown to 17 Agustus 2026 (WIB)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const target = new Date("2026-08-17T00:00:00+07:00").getTime();
    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = target - now;
      if (difference <= 0) {
        setCountdown({ days: 0, hours: 0, mins: 0, secs: 0 });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((difference % (1000 * 60)) / 1000);
        setCountdown({ days, hours, mins, secs });
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auditing & action loading states
  const [isRecordingBelanjaId, setIsRecordingBelanjaId] = useState<string | null>(null);

  // Local storage backup/restore states
  const [showRestoreBanner, setShowRestoreBanner] = useState<boolean>(false);
  const [localBackup, setLocalBackup] = useState<SEMSData | null>(null);

  // Fetch initial SEMS data
  const fetchSemsData = async () => {
    try {
      const response = await fetch("/api/sems/data");
      if (!response.ok) {
        throw new Error("Gagal mengunduh database SEMS dari server.");
      }
      const json = await response.json();
      setSemsData(json);
      setErrorMessage("");
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Gagal menghubungi server SEMS.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSemsData();
  }, []);

  // Auto-save data to localStorage when semsData changes and has content
  useEffect(() => {
    if (semsData) {
      const hasContent = (
        (semsData.panitia && semsData.panitia.length > 0) ||
        (semsData.rkba && semsData.rkba.length > 0) ||
        (semsData.keuangan && semsData.keuangan.length > 0) ||
        (semsData.tasks && semsData.tasks.length > 0)
      );
      if (hasContent) {
        try {
          localStorage.setItem("sems_data_backup", JSON.stringify(semsData));
        } catch (e) {
          console.error("Gagal menyimpan backup ke browser:", e);
        }
      }
    }
  }, [semsData]);

  // Check for local browser backup on initial load after server fetch completes
  useEffect(() => {
    if (semsData && !isLoading) {
      try {
        const backupStr = localStorage.getItem("sems_data_backup");
        if (backupStr) {
          const parsed = JSON.parse(backupStr) as SEMSData;
          const hasLocalContent = (
            (parsed.panitia && parsed.panitia.length > 0) ||
            (parsed.rkba && parsed.rkba.length > 0) ||
            (parsed.keuangan && parsed.keuangan.length > 0) ||
            (parsed.tasks && parsed.tasks.length > 0)
          );
          const hasServerContent = (
            (semsData.panitia && semsData.panitia.length > 0) ||
            (semsData.rkba && semsData.rkba.length > 0) ||
            (semsData.keuangan && semsData.keuangan.length > 0) ||
            (semsData.tasks && semsData.tasks.length > 0)
          );

          if (hasLocalContent && !hasServerContent) {
            setLocalBackup(parsed);
            setShowRestoreBanner(true);
          }
        }
      } catch (err) {
        console.error("Gagal memeriksa data cadangan browser:", err);
      }
    }
  }, [isLoading, semsData]);

  // Restore backup to server and client
  const handleRestoreBackup = async () => {
    if (!localBackup) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/sems/sync-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localBackup)
      });
      if (!response.ok) {
        throw new Error("Gagal menyinkronkan data cadangan ke server Cloud Run.");
      }
      const result = await response.json();
      if (result.success) {
        setSemsData(localBackup);
        setShowRestoreBanner(false);
        alert("Berhasil memulihkan seluruh data Anda dari penyimpanan browser!");
      } else {
        throw new Error(result.error || "Gagal memulihkan.");
      }
    } catch (error: any) {
      alert("Gagal memulihkan data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissRestoreBanner = () => {
    setShowRestoreBanner(false);
  };

  // Reset database back to seed initial data
  const handleResetData = async () => {
    if (!confirm("Apakah Anda yakin ingin mereset database ke draf awal kepanitiaan HUT RI Ke-81 RW 04 Ngabean Semarang?")) {
      return;
    }
    setIsResetting(true);
    try {
      const response = await fetch("/api/sems/reset", { method: "POST" });
      if (!response.ok) {
        throw new Error("Gagal mereset database.");
      }
      try {
        localStorage.removeItem("sems_data_backup");
      } catch (e) {}
      setShowRestoreBanner(false);
      await fetchSemsData();
    } catch (error: any) {
      alert(error.message || "Gagal melakukan reset.");
    } finally {
      setIsResetting(false);
    }
  };

  // 1. SAVE SYSTEM CONFIG / SETTINGS
  const handleSaveSettings = async (updatedSettings: SystemSetting) => {
    try {
      const response = await fetch("/api/sems/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings)
      });
      if (!response.ok) {
        throw new Error("Gagal menyimpan konfigurasi.");
      }
      const result = await response.json();
      if (result.success) {
        setSemsData(prev => prev ? { ...prev, settings: updatedSettings } : null);
      } else {
        throw new Error(result.error || "Gagal menyimpan.");
      }
    } catch (error: any) {
      alert(error.message || "Gagal menyimpan konfigurasi.");
    }
  };

  // 2. PANITIA CRUD
  const handleSavePanitia = async (action: 'add' | 'edit' | 'delete', data: Panitia) => {
    try {
      const response = await fetch("/api/sems/panitia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data })
      });
      if (!response.ok) throw new Error("Gagal sinkronisasi data Panitia.");
      const result = await response.json();
      if (result.success && semsData) {
        setSemsData({ ...semsData, panitia: result.panitia });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  // 3. KEGIATAN CRUD
  const handleSaveKegiatan = async (action: 'add' | 'edit' | 'delete', data: Kegiatan) => {
    try {
      const response = await fetch("/api/sems/kegiatan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data })
      });
      if (!response.ok) throw new Error("Gagal sinkronisasi data Kegiatan.");
      const result = await response.json();
      if (result.success && semsData) {
        setSemsData({ ...semsData, kegiatan: result.kegiatan });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  // 4. RKBA CRUD & APPROVAL WORKFLOW
  const handleSaveRKBA = async (action: 'add' | 'edit' | 'delete' | 'approve' | 'reject', data: RKBAItem) => {
    try {
      const response = await fetch("/api/sems/rkba", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data })
      });
      if (!response.ok) throw new Error("Gagal sinkronisasi data RKBA.");
      const result = await response.json();
      if (result.success && semsData) {
        setSemsData({ ...semsData, rkba: result.rkba });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  // 5. NATURA CRUD removed

  // 6. KEUANGAN MANUAL LEDGER CRUD
  const handleSaveKeuangan = async (action: 'add' | 'edit' | 'delete', data: KeuanganTransaction) => {
    try {
      const response = await fetch("/api/sems/keuangan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data })
      });
      if (!response.ok) throw new Error("Gagal sinkronisasi Buku Kas.");
      const result = await response.json();
      if (result.success && semsData) {
        setSemsData({ ...semsData, keuangan: result.keuangan });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  // 7. TASK STATUS TOGGLE & CRUD (Belum -> Proses -> Selesai)
  const handleToggleTaskStatus = async (taskId: string) => {
    try {
      const response = await fetch("/api/sems/tasks/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId })
      });
      if (!response.ok) throw new Error("Gagal mengubah progres program kerja.");
      const result = await response.json();
      if (result.success && semsData) {
        setSemsData({ ...semsData, tasks: result.tasks });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleSaveTask = async (action: 'add' | 'edit' | 'delete' | 'toggle', data: any) => {
    try {
      const response = await fetch("/api/sems/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data })
      });
      if (!response.ok) throw new Error("Gagal menyimpan program kerja.");
      const result = await response.json();
      if (result.success && semsData) {
        setSemsData({ ...semsData, tasks: result.tasks });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  // 8. RECORD REAL TRANSAKSI FROM APPROVED RKBA (Bridges RKBA and Keuangan)
  const handleBelanjaItem = async (rkbaId: string) => {
    setIsRecordingBelanjaId(rkbaId);
    try {
      const response = await fetch("/api/sems/rkba/belanja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rkbaId })
      });
      if (!response.ok) throw new Error("Gagal membukukan belanja.");
      const result = await response.json();
      if (result.success && semsData) {
        // Update both rkba list and keuangan list
        setSemsData({ 
          ...semsData, 
          rkba: result.rkba,
          keuangan: result.keuangan 
        });
      } else {
        throw new Error(result.error || "Gagal membukukan.");
      }
    } catch (error: any) {
      alert("Gagal membukukan belanja: " + error.message);
    } finally {
      setIsRecordingBelanjaId(null);
    }
  };

  // 9. NOTULENSI CRUD
  const handleSaveNotulensi = async (action: 'add' | 'edit' | 'delete', data: Notulensi, actor?: string) => {
    try {
      const response = await fetch("/api/sems/notulensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data, actor })
      });
      if (!response.ok) throw new Error("Gagal sinkronisasi data Notulensi.");
      const result = await response.json();
      if (result.success && semsData) {
        setSemsData({ 
          ...semsData, 
          notulensi: result.notulensi,
          auditTrails: result.auditTrails || semsData.auditTrails
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  // 10. DIGITAL DOCUMENTS CRUD
  const handleSaveDocument = async (action: 'add' | 'edit' | 'delete', data: DigitalDocument) => {
    try {
      const response = await fetch("/api/sems/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data })
      });
      if (!response.ok) throw new Error("Gagal sinkronisasi data Dokumen Digital.");
      const result = await response.json();
      if (result.success && semsData) {
        setSemsData({ ...semsData, documents: result.documents });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  // 11. UNDANGAN RAPAT CRUD
  const handleSaveUndangan = async (action: 'add' | 'edit' | 'delete', data: UndanganRapat) => {
    try {
      const response = await fetch("/api/sems/undangan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data })
      });
      if (!response.ok) throw new Error("Gagal sinkronisasi data Undangan Rapat.");
      const result = await response.json();
      if (result.success && semsData) {
        setSemsData({ ...semsData, undangan: result.undangan });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  // 12. BUDGET CHANGES (Perubahan Anggaran) CRUD & WORKFLOW
  const handleSaveBudgetChange = async (action: 'add' | 'edit' | 'submit' | 'approve' | 'reject' | 'cancel', data: BudgetChange, actor?: string) => {
    try {
      const response = await fetch("/api/sems/budget-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data, actor })
      });
      if (!response.ok) throw new Error("Gagal sinkronisasi data Perubahan Anggaran.");
      const result = await response.json();
      if (result.success && semsData) {
        setSemsData({
          ...semsData,
          budgetChanges: result.budgetChanges,
          rkba: result.rkba || semsData.rkba,
          auditTrails: result.auditTrails || semsData.auditTrails
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert(error.message || "Gagal memproses perubahan anggaran.");
    }
  };

  // 13. BUDGET REALLOCATIONS (Realokasi Anggaran - Zero-Sum Shift) CRUD & WORKFLOW
  const handleSaveBudgetReallocation = async (action: 'add' | 'edit' | 'submit' | 'approve' | 'reject' | 'cancel', data: BudgetReallocation, actor?: string) => {
    try {
      const response = await fetch("/api/sems/budget-reallocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data, actor })
      });
      if (!response.ok) throw new Error("Gagal sinkronisasi data Realokasi Anggaran.");
      const result = await response.json();
      if (result.success && semsData) {
        setSemsData({
          ...semsData,
          budgetReallocations: result.budgetReallocations,
          rkba: result.rkba || semsData.rkba,
          auditTrails: result.auditTrails || semsData.auditTrails
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert(error.message || "Gagal memproses realokasi anggaran.");
    }
  };

  // 14. LPJ MANAGEMENT HANDLERS
  const handleUpdateLPJSection = async (sectionId: string, updates: any, actor?: string, reason?: string) => {
    try {
      const response = await fetch("/api/sems/lpj/update-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, ...updates, actor, reason })
      });
      if (!response.ok) throw new Error("Gagal memperbarui pembagian penyampai LPJ.");
      const result = await response.json();
      if (result.success && semsData) {
        setSemsData({
          ...semsData,
          lpj: result.lpj,
          auditTrails: result.auditTrails || semsData.auditTrails
        });
        return result.lpj;
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUpdateLPJStatus = async (status: string, actor?: string, notes?: string, isReconciled?: boolean, reconciliationNotes?: string) => {
    try {
      const response = await fetch("/api/sems/lpj/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, actor, notes, isReconciled, reconciliationNotes })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal memperbarui status LPJ.");
      }
      if (semsData) {
        setSemsData({
          ...semsData,
          lpj: result.lpj,
          auditTrails: result.auditTrails || semsData.auditTrails
        });
      }
      return result.lpj;
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleSaveLPJ = async (lpj: any, actor?: string, reason?: string) => {
    try {
      const response = await fetch("/api/sems/lpj/save-master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lpj, actor, reason })
      });
      if (!response.ok) throw new Error("Gagal menyimpan dokumen LPJ.");
      const result = await response.json();
      if (result.success && semsData) {
        setSemsData({
          ...semsData,
          lpj: result.lpj,
          auditTrails: result.auditTrails || semsData.auditTrails
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleGenerateLPJNotulen = async (payload: any) => {
    try {
      const response = await fetch("/api/sems/lpj/generate-notulen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Gagal membuat notulensi rapat LPJ.");
      const result = await response.json();
      if (result.success && semsData) {
        setSemsData({
          ...semsData,
          notulensi: result.notulensi,
          lpj: result.lpj,
          auditTrails: result.auditTrails || semsData.auditTrails
        });
        return result.createdNotulensi;
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleGenerateLPJSpeech = async () => {
    try {
      const response = await fetch("/api/sems/lpj/generate-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error("Gagal menghasilkan naskah penyampaian.");
      const result = await response.json();
      if (result.success && semsData) {
        setSemsData({
          ...semsData,
          lpj: result.lpj
        });
        return result.speechScripts;
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  // Loading Screen with National Pride Theme
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans selection:bg-red-600">
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 text-center max-w-sm w-full space-y-6 shadow-2xl relative overflow-hidden">
          {/* Top Red and White design */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 to-white"></div>
          
          <div className="flex justify-center">
            <div className="bg-red-700/10 p-5 rounded-2xl border border-red-500/20 animate-pulse">
              <Award className="w-12 h-12 text-red-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold font-sans tracking-tight">SEMS RW 04 Ngabean</h1>
            <p className="text-xs text-slate-400 font-mono">HUT Kemerdekaan RI Ke-81</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-mono">
            <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
            <span>Menghubungkan Database...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error screen
  if (errorMessage || !semsData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans p-4">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center max-w-md w-full space-y-5">
          <div className="flex justify-center text-amber-500">
            <AlertTriangle className="w-12 h-12" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold">Terjadi Gangguan Sistem</h1>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">{errorMessage || "Server SEMS tidak merespon."}</p>
          </div>
          <button
            onClick={fetchSemsData}
            className="w-full bg-red-700 hover:bg-red-800 text-white font-bold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Muat Ulang Sistem
          </button>
        </div>
      </div>
    );
  }

  if (isLandingPage) {
    return <LandingPage onEnter={() => setIsLandingPage(false)} />;
  }

  return (
    <div className="h-screen bg-slate-50 flex font-sans selection:bg-red-600 selection:text-white overflow-hidden print:h-auto print:overflow-visible text-slate-800">
      {/* Sidebar Navigation */}
      <div className="print:hidden">
        <Sidebar 
          currentView={currentView} 
          onViewChange={(view) => {
            setCurrentView(view);
            setIsSidebarOpen(false);
          }} 
          onResetData={handleResetData}
          isResetting={isResetting}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isBudgetViewOnly={isBudgetViewOnly}
        />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden print:h-auto print:overflow-visible">
        {/* Top Header - Premium Design with Live Countdown */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 lg:px-6 shrink-0 print:hidden shadow-xs relative z-30">
          <div className="flex items-center gap-3">
            {/* Hamburger Menu Trigger for Mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-red-600 transition-all cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 tracking-wider hidden sm:inline">PROJECT:</span>
              <span className="px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-lg uppercase tracking-wide border border-red-100 shadow-3xs">
                HUT RI KE-81 RW 04 NGABEAN
              </span>
              {isBudgetViewOnly && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                  <Eye className="w-3 h-3 text-emerald-600" />
                  Mode Transparansi Publik (View-Only)
                </span>
              )}
            </div>
          </div>

          {/* Center-Right Live Countdown, Share Button, and Sync Indicators */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Share Budget Transparency Link Button */}
            <button
              id="btn-share-anggaran"
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
              title="Bagikan Tautan Transparansi Anggaran (Hanya Lihat)"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bagikan Anggaran</span>
              <span className="sm:hidden">Bagikan</span>
            </button>

            {/* Beautiful Countdown Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-600/5 to-amber-500/5 hover:from-red-600/10 hover:to-amber-500/10 rounded-full border border-red-200/50 text-[11px] font-bold text-slate-700 shadow-3xs transition-all">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <span className="uppercase text-[9px] text-red-600 font-extrabold tracking-wider">HUT-RI 81:</span>
              <span className="font-mono text-slate-800 tracking-tight flex items-center gap-1 font-extrabold">
                <span className="text-red-600">{countdown.days}</span> Hari
                <span className="text-slate-400 font-normal">|</span>
                <span className="bg-slate-900 text-white text-[10px] font-bold font-mono px-1.5 py-0.5 rounded shadow-inner">
                  {String(countdown.hours).padStart(2, '0')}
                </span>:
                <span className="bg-slate-900 text-white text-[10px] font-bold font-mono px-1.5 py-0.5 rounded shadow-inner">
                  {String(countdown.mins).padStart(2, '0')}
                </span>:
                <span className="bg-slate-900 text-white text-[10px] font-bold font-mono px-1.5 py-0.5 rounded shadow-inner">
                  {String(countdown.secs).padStart(2, '0')}
                </span>
              </span>
            </div>

            {/* Sync Badge */}
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full shadow-3xs">
              <div className="text-right leading-none">
                <p className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Synced
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Panel Content Container with AnimatePresence transitions */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 print:overflow-visible print:h-auto print:p-0 print:space-y-0 print:block bg-slate-50/50 relative">
          
          {/* Public Transparency Banner when in isBudgetViewOnly mode */}
          {isBudgetViewOnly && (
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-4 shadow-sm border border-emerald-700/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in shrink-0">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-600/30 text-emerald-300 rounded-xl border border-emerald-500/30 shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-emerald-400 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                      Mode Publik Transparansi Anggaran
                    </span>
                    <span className="text-[10px] font-mono text-emerald-200">
                      Akses: Hanya Lihat (View-Only)
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white mt-1">
                    Portal Keterbukaan Informasi Keuangan & Anggaran RW 04 Ngabean
                  </h4>
                  <p className="text-[11px] text-emerald-100/90 leading-relaxed mt-0.5 max-w-3xl">
                    Anda sedang melihat laporan realisasi, transparansi kas Pamsimas, dan rancangan anggaran belanja. Hak perubahan data, edit, dan menu administratif dinonaktifkan untuk melindungi integritas data.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Info Link</span>
                </button>
                <button
                  onClick={() => handleToggleBudgetViewOnly(false)}
                  className="bg-white/10 hover:bg-white/20 text-emerald-100 text-xs font-bold px-3 py-2 rounded-xl border border-white/20 transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Kembali ke Mode Administrator"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Mode Admin</span>
                </button>
              </div>
            </div>
          )}

          {/* Mobile-only countdown bar */}
          <div className="md:hidden flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-2xs mb-2">
            <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              <span>HUT RI 81 Countdown</span>
            </span>
            <div className="font-mono text-xs font-black text-slate-800 tracking-tight">
              {countdown.days} Hari {String(countdown.hours).padStart(2, '0')}:{String(countdown.mins).padStart(2, '0')}:{String(countdown.secs).padStart(2, '0')}
            </div>
          </div>

          {showRestoreBanner && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-fade-in shrink-0">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Data Cadangan Browser Ditemukan</h4>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Aplikasi ini dijalankan pada server **Google Cloud (Cloud Run)** yang bersifat sementara (*stateless*). 
                    Server baru saja di-restart (kembali ke draf awal), namun kami menemukan cadangan data masukan Anda sebelumnya tersimpan dengan aman di browser ini.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto shrink-0">
                <button
                  onClick={handleRestoreBackup}
                  className="flex-1 md:flex-none bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Pulihkan Data Saya
                </button>
                <button
                  onClick={handleDismissRestoreBanner}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Abaikan
                </button>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="space-y-4 sm:space-y-6 print:space-y-0"
            >
              {currentView === "dashboard" && (
                <DashboardView 
                  data={semsData} 
                  onNavigateView={(view) => setCurrentView(view)}
                />
              )}

              {currentView === "rkba" && (
                <RKBAView 
                  rkba={semsData.rkba || []}
                  kegiatan={semsData.kegiatan || []}
                  settings={semsData.settings} 
                  keuangan={semsData.keuangan || []}
                  onSaveRKBA={handleSaveRKBA}
                  onBelanjaItem={handleBelanjaItem}
                  isRecordingBelanjaId={isRecordingBelanjaId}
                  onNavigateView={(view) => setCurrentView(view)}
                  isReadOnly={isBudgetViewOnly}
                />
              )}

              {currentView === "perubahan-anggaran" && (
                <PerubahanAnggaranView 
                  budgetChanges={semsData.budgetChanges || []}
                  rkba={semsData.rkba || []}
                  notulensi={semsData.notulensi || []}
                  settings={semsData.settings}
                  onSaveBudgetChange={handleSaveBudgetChange}
                  onNavigateView={(view) => setCurrentView(view)}
                  isReadOnly={isBudgetViewOnly}
                />
              )}

              {currentView === "realokasi-anggaran" && (
                <RealokasiAnggaranView 
                  budgetReallocations={semsData.budgetReallocations || []}
                  rkba={semsData.rkba || []}
                  notulensi={semsData.notulensi || []}
                  settings={semsData.settings}
                  onSaveBudgetReallocation={handleSaveBudgetReallocation}
                  onNavigateView={(view) => setCurrentView(view)}
                  isReadOnly={isBudgetViewOnly}
                />
              )}

              {currentView === "notulensi" && (
                <NotulensiView 
                  notulensi={semsData.notulensi || []}
                  budgetChanges={semsData.budgetChanges || []}
                  budgetReallocations={semsData.budgetReallocations || []}
                  auditTrails={semsData.auditTrails || []}
                  rkba={semsData.rkba || []}
                  settings={semsData.settings}
                  panitia={semsData.panitia || []}
                  kegiatan={semsData.kegiatan || []}
                  onSaveNotulensi={handleSaveNotulensi}
                  onNavigateView={(view) => setCurrentView(view)}
                />
              )}

              {currentView === "keuangan" && (
                <KeuanganView 
                  keuangan={semsData.keuangan}
                  settings={semsData.settings} 
                  onSaveKeuangan={handleSaveKeuangan} 
                  isReadOnly={isBudgetViewOnly}
                />
              )}

              {currentView === "proposal" && (
                <ProposalView 
                  rkba={semsData.rkba || []}
                  tasks={semsData.tasks || []} 
                  settings={semsData.settings} 
                  keuangan={semsData.keuangan || []}
                  panitia={semsData.panitia || []}
                  onToggleTaskStatus={handleToggleTaskStatus}
                />
              )}

              {currentView === "documents" && (
                <DigitalDocumentsView 
                  documents={semsData.documents || []}
                  panitia={semsData.panitia || []}
                  onSaveDocument={handleSaveDocument}
                />
              )}

              {currentView === "monitoring" && (
                <MonitoringView 
                  tasks={semsData.tasks || []} 
                  settings={semsData.settings} 
                  keuangan={semsData.keuangan || []}
                  panitia={semsData.panitia || []}
                  kegiatan={semsData.kegiatan || []}
                  budgetChanges={semsData.budgetChanges || []}
                  budgetReallocations={semsData.budgetReallocations || []}
                  notulensi={semsData.notulensi || []}
                  auditTrails={semsData.auditTrails || []}
                  rkba={semsData.rkba || []}
                  lpj={semsData.lpj}
                  onToggleTaskStatus={handleToggleTaskStatus}
                  onUpdateLPJSection={handleUpdateLPJSection}
                  onUpdateLPJStatus={handleUpdateLPJStatus}
                  onSaveLPJ={handleSaveLPJ}
                  onGenerateLPJNotulen={handleGenerateLPJNotulen}
                  onGenerateLPJSpeech={handleGenerateLPJSpeech}
                  onNavigateView={(view) => setCurrentView(view)}
                />
              )}

              {currentView === "master" && (
                <MasterDataView 
                  panitia={semsData.panitia || []} 
                  kegiatan={semsData.kegiatan || []} 
                  tasks={semsData.tasks || []}
                  settings={semsData.settings}
                  onSavePanitia={handleSavePanitia}
                  onSaveKegiatan={handleSaveKegiatan}
                  onSaveTask={handleSaveTask}
                  onToggleTaskStatus={handleToggleTaskStatus}
                />
              )}

              {currentView === "sheets" && (
                <GoogleSheetsView 
                  settings={semsData.settings} 
                  semsData={semsData}
                  onSaveSettings={handleSaveSettings}
                  onRefreshData={fetchSemsData}
                  onImportSuccess={async (importedData) => {
                    setSemsData(importedData);
                  }}
                />
              )}

              {currentView === "panduan" && (
                <GuideBookView />
              )}

               {currentView === "coupon" && (
                <FestiveEventView data={semsData} defaultTab="coupon" />
              )}

              {currentView === "setting" && (
                <SettingView 
                  settings={semsData.settings} 
                  onSaveSettings={handleSaveSettings} 
                  semsData={semsData}
                  onImportSuccess={async (importedData) => {
                    setSemsData(importedData);
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Share Budget Transparency Modal */}
      <ShareAnggaranModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        isBudgetViewOnly={isBudgetViewOnly}
        onToggleBudgetViewOnly={handleToggleBudgetViewOnly}
      />

      {/* Admin PIN Unlock Modal */}
      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        onSuccess={() => {
          setIsBudgetViewOnly(false);
          try {
            localStorage.setItem("sems_budget_view_only", "false");
            if (typeof window !== "undefined") {
              const url = new URL(window.location.href);
              url.searchParams.delete("mode");
              url.searchParams.delete("view_only");
              window.history.replaceState({}, "", url.toString());
            }
          } catch (e) {}
        }}
      />
    </div>
  );
}
