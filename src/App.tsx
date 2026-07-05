import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import RKBAView from "./components/RKBAView";
import NaturaView from "./components/NaturaView";
import KeuanganView from "./components/KeuanganView";
import MonitoringView from "./components/MonitoringView";
import MasterDataView from "./components/MasterDataView";
import SettingView from "./components/SettingView";
import { SEMSData, SystemSetting, Panitia, Kegiatan, RKBAItem, NaturaItem, KeuanganTransaction } from "./types";
import { Award, AlertTriangle, RefreshCw, Menu } from "lucide-react";

export default function App() {
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [semsData, setSemsData] = useState<SEMSData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Auditing & action loading states
  const [isRecordingBelanjaId, setIsRecordingBelanjaId] = useState<string | null>(null);

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
      throw error;
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

  // 5. NATURA CRUD
  const handleSaveNatura = async (action: 'add' | 'edit' | 'delete', data: NaturaItem) => {
    try {
      const response = await fetch("/api/sems/natura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data })
      });
      if (!response.ok) throw new Error("Gagal sinkronisasi data Natura.");
      const result = await response.json();
      if (result.success && semsData) {
        setSemsData({ ...semsData, natura: result.natura });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  // 6. KEUANGAN MANUAL LEDGER CRUD
  const handleSaveKeuangan = async (action: 'add' | 'delete', data: KeuanganTransaction) => {
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

  // 7. TASK STATUS TOGGLE (Belum -> Proses -> Selesai)
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

  return (
    <div className="h-screen bg-[#f4f7f6] flex font-sans selection:bg-red-600 selection:text-white overflow-hidden">
      {/* Sidebar Navigation */}
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
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger Menu Trigger for Mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider hidden sm:inline">PROJECT:</span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded uppercase">
                HUT RI KE-81 RW 04 NGABEAN
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">System Mode</p>
              <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Fully Synced
              </p>
            </div>
          </div>
        </header>

        {/* Main Panel Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {currentView === "dashboard" && (
            <DashboardView data={semsData} />
          )}

          {currentView === "rkba" && (
            <RKBAView 
              rkba={semsData.rkba} 
              settings={semsData.settings} 
              keuangan={semsData.keuangan}
              onSaveRKBA={handleSaveRKBA}
              onBelanjaItem={handleBelanjaItem}
              isRecordingBelanjaId={isRecordingBelanjaId}
            />
          )}

          {currentView === "natura" && (
            <NaturaView 
              natura={semsData.natura} 
              settings={semsData.settings} 
              onSaveNatura={handleSaveNatura} 
            />
          )}

          {currentView === "keuangan" && (
            <KeuanganView 
              keuangan={semsData.keuangan} 
              settings={semsData.settings} 
              onSaveKeuangan={handleSaveKeuangan} 
            />
          )}

          {currentView === "monitoring" && (
            <MonitoringView 
              tasks={semsData.tasks} 
              settings={semsData.settings} 
              keuangan={semsData.keuangan}
              natura={semsData.natura}
              onToggleTaskStatus={handleToggleTaskStatus}
            />
          )}

          {currentView === "master" && (
            <MasterDataView 
              panitia={semsData.panitia} 
              kegiatan={semsData.kegiatan} 
              settings={semsData.settings}
              onSavePanitia={handleSavePanitia}
              onSaveKegiatan={handleSaveKegiatan}
            />
          )}

          {currentView === "setting" && (
            <SettingView 
              settings={semsData.settings} 
              onSaveSettings={handleSaveSettings} 
            />
          )}
        </main>
      </div>
    </div>
  );
}
