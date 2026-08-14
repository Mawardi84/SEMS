import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Gift, 
  FileSpreadsheet, 
  Users, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Building,
  Target,
  LayoutGrid,
  Table,
  Tv,
  Trophy,
  ArrowRight,
  ShieldCheck,
  Search,
  ChevronRight,
  BarChart3,
  PieChart as LucidePieChart,
  LineChart as LucideLineChart,
  Activity,
  Download,
  Sparkles,
  History,
  FileText,
  GitCompare,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Clock,
  ExternalLink
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { SEMSData } from "../types";
import { exportToPDF } from "../utils/pdfExport";

interface DashboardViewProps {
  data: SEMSData;
  onNavigateView?: (viewName: string) => void;
}

export default function DashboardView({ data, onNavigateView }: DashboardViewProps) {
  const settings = data?.settings;
  const keuangan = data?.keuangan || [];
  const rkba = data?.rkba || [];
  const panitia = data?.panitia || [];
  const kegiatan = data?.kegiatan || [];
  const tasks = data?.tasks || [];
  const budgetChanges = data?.budgetChanges || [];
  const budgetReallocations = data?.budgetReallocations || [];
  const auditTrails = data?.auditTrails || [];
  const notulensi = data?.notulensi || [];

  // Safety checks for settings
  const safeSettings = {
    id: settings?.id || "default",
    sheetId: settings?.sheetId || "",
    sheetApiKey: settings?.sheetApiKey || "",
    targetIuranPerRT: settings?.targetIuranPerRT || 0,
    rtList: settings?.rtList || [],
    seksiList: settings?.seksiList || [],
    paguAnggaranSeksi: settings?.paguAnggaranSeksi || {},
    themeColor: settings?.themeColor || "#cc0000"
  };

  // Multi-view states
  const [dashboardLayout, setDashboardLayout] = useState<"bento" | "analytical" | "projector">("bento");
  const [analyticalTab, setAnalyticalTab] = useState<"cashflow" | "seksi" | "rt">("cashflow");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChart, setActiveChart] = useState<"bar" | "area" | "pie">("bar");
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    let filename = `Laporan-Dashboard-${dashboardLayout}`;
    if (dashboardLayout === "analytical") {
      filename += `-${analyticalTab}`;
    }
    filename += `-${new Date().toISOString().split('T')[0]}.pdf`;
    
    await exportToPDF("printable-dashboard-area", filename);
    setIsExportingPDF(false);
  };

  // 1. Core Financial Calculations
  const totalIncome = keuangan
    .filter((t) => t.type === "Masuk")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = keuangan
    .filter((t) => t.type === "Keluar")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // 2. Budget RKBA Calculations
  const rkbaTotalProposed = rkba.reduce((sum, r) => sum + r.total, 0);
  const rkbaTotalApproved = rkba
    .filter((r) => r.status === "Disetujui" || r.status === "Belanja")
    .reduce((sum, r) => sum + r.total, 0);

  // 3. RT Collection Tracker
  const rtCollections = (settings?.rtList || []).map((rtName) => {
    // Find all income transactions of type "Iuran RT" matching this RT name in description/notes
    const collected = keuangan
      .filter((t) => t.type === "Masuk" && t.category === "Iuran RT" && (t.notes || "").toLowerCase().includes(rtName.toLowerCase()))
      .reduce((sum, t) => sum + t.amount, 0);

    const percentCash = Math.min(100, Math.round((collected / (settings?.targetIuranPerRT || 1)) * 100));

    return {
      name: rtName,
      collected,
      percent: percentCash,
    };
  });

  const totalRTTarget = (settings?.targetIuranPerRT || 0) * (settings?.rtList || []).length;
  const totalRTCashCollected = rtCollections.reduce((sum, r) => sum + r.collected, 0);
  const totalRTPercent = totalRTTarget > 0 ? Math.round((totalRTCashCollected / totalRTTarget) * 100) : 0;

  // 4. Seksi Budget Utilization
  const seksiBudgets = (settings?.seksiList || []).map((seksi) => {
    const pagu = settings?.paguAnggaranSeksi?.[seksi] || 0;
    
    // Sum of approved RKBA for this seksi
    const approved = rkba
      .filter((r) => r.seksi === seksi && (r.status === "Disetujui" || r.status === "Belanja"))
      .reduce((sum, r) => sum + r.total, 0);

    // Sum of actual expenses (real money spent) recorded for approved RKBA of this seksi
    const rkbaIdsOfSeksi = rkba.filter((r) => r.seksi === seksi).map((r) => r.id);
    const spent = keuangan
      .filter((t) => t.type === "Keluar" && t.category === "RKBA Belanja" && t.refId && rkbaIdsOfSeksi.includes(t.refId))
      .reduce((sum, t) => sum + t.amount, 0);

    const percentOfPagu = pagu > 0 ? Math.round((approved / pagu) * 100) : 0;

    return {
      name: seksi,
      pagu,
      approved,
      spent,
      percent: percentOfPagu,
    };
  });

  // 5. Tasks Completion
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Selesai").length;
  const taskPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 6. Master Governance Budget Calculations
  const totalBaselinePagu = Object.values(safeSettings.paguAnggaranSeksi || {}).reduce((a, b) => a + b, 0);

  const approvedBudgetChanges = budgetChanges.filter(c => c.status === "DISETUJUI");
  const totalApprovedBudgetChangeDelta = approvedBudgetChanges.reduce((sum, c) => {
    if (c.changeType === "DITAMBAHKAN") return sum + (c.changeAmount || c.revisedAmount || 0);
    if (c.changeType === "DITIADAKAN") return sum - (c.initialAmount || c.changeAmount || 0);
    return sum + (c.changeAmount || (c.revisedAmount - c.initialAmount) || 0);
  }, 0);

  const approvedReallocations = budgetReallocations.filter(r => r.status === "DISETUJUI");
  const totalApprovedReallocationVolume = approvedReallocations.reduce((sum, r) => sum + r.amount, 0);

  const totalActivePagu = Math.max(0, totalBaselinePagu + totalApprovedBudgetChangeDelta);

  const totalRealisasiKas = keuangan
    .filter(t => t.type === "Keluar" && t.category === "RKBA Belanja")
    .reduce((sum, t) => sum + t.amount, 0);

  const sisaPaguAktif = totalActivePagu - totalRealisasiKas;
  const paguAbsorptionPercent = totalActivePagu > 0 ? Math.round((totalRealisasiKas / totalActivePagu) * 100) : 0;

  const pendingProposalsCount = budgetChanges.filter(c => c.status === "DIAJUKAN").length +
    budgetReallocations.filter(r => r.status === "DIAJUKAN").length;

  // Sorting for RT Leaderboard (Projector Mode)
  const sortedRtLeaderboard = [...rtCollections].sort((a, b) => b.percent - a.percent);

  // Formatting utility
  const formatRp = (num: number) => {
    return "Rp " + num.toLocaleString("id-ID");
  };

  // Formatting short currency for axes (e.g., Rp 1.5jt, Rp 500rb)
  const formatShortRp = (num: number) => {
    if (num >= 1000000) {
      return "Rp " + (num / 1000000).toFixed(1) + " jt";
    } else if (num >= 1000) {
      return "Rp " + (num / 1000).toFixed(0) + " rb";
    }
    return "Rp " + num;
  };

  const CHART_COLORS = ["#6366f1", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

  // 6. Cumulative spending timeline calculation
  const cumulativeSpendingData = (() => {
    const spendingTransactions = keuangan
      .filter((t) => t.type === "Keluar")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (spendingTransactions.length === 0) {
      return [
        {
          date: "Belum dimulai",
          spending: 0,
          cumulative: 0,
          budgetLimit: rkbaTotalApproved,
        }
      ];
    }

    const spendingByDate: Record<string, number> = {};
    spendingTransactions.forEach((t) => {
      const dateStr = t.date;
      spendingByDate[dateStr] = (spendingByDate[dateStr] || 0) + t.amount;
    });

    const uniqueDates = Object.keys(spendingByDate).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    let runningTotal = 0;
    return uniqueDates.map((date) => {
      runningTotal += spendingByDate[date];
      let formattedDate = date;
      try {
        const d = new Date(date);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
        }
      } catch (e) {
        // Fallback
      }

      return {
        date: formattedDate,
        spending: spendingByDate[date],
        cumulative: runningTotal,
        budgetLimit: rkbaTotalApproved,
      };
    });
  })();

  const totalRKBASpent = keuangan
    .filter((t) => t.type === "Keluar" && t.category === "RKBA Belanja")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalRKBASaving = rkbaTotalApproved - totalRKBASpent;
  const savingPercent = rkbaTotalApproved > 0 ? Math.round((totalRKBASaving / rkbaTotalApproved) * 100) : 0;

  return (
    <div className="space-y-5">
      
      {/* 1. Header & Multi-View Layout Toggles */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-red-600 font-sans text-[10px] font-bold uppercase tracking-wider">
            <Building className="w-3.5 h-3.5" />
            <span>Executive Control Board — RW 04 Ngabean</span>
          </div>
          <h2 className="text-sm font-sans font-extrabold text-slate-800 mt-0.5 uppercase tracking-wide">
            Event Management System (SEMS) Kemerdekaan RI Ke-81
          </h2>
          <p className="text-[11px] text-slate-500">
            Kelola data terpusat, swadaya warga, anggaran belanja seksi, dan progres pertanggungjawaban panitia secara real-time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-stretch xl:self-auto">
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-all duration-150 uppercase tracking-wide disabled:opacity-50 cursor-pointer no-print"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{isExportingPDF ? "Mengekspor..." : "Ekspor Laporan PDF"}</span>
          </button>

          {/* Beautiful Segmented Layout Switcher */}
          <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200 self-stretch xl:self-auto shrink-0 justify-between items-center gap-0.5 no-print">
          <button
            id="layout-toggle-bento"
            onClick={() => setDashboardLayout("bento")}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold transition-all duration-150 flex-1 xl:flex-none ${
              dashboardLayout === "bento"
                ? "bg-white text-red-600 shadow-xs border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Bento Eksekutif</span>
          </button>

          <button
            id="layout-toggle-analytical"
            onClick={() => setDashboardLayout("analytical")}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold transition-all duration-150 flex-1 xl:flex-none ${
              dashboardLayout === "analytical"
                ? "bg-white text-red-600 shadow-xs border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Buku Besar Analitis</span>
          </button>

          <button
            id="layout-toggle-projector"
            onClick={() => setDashboardLayout("projector")}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold transition-all duration-150 flex-1 xl:flex-none ${
              dashboardLayout === "projector"
                ? "bg-white text-red-600 shadow-xs border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Layar Rapat Proyektor</span>
          </button>
        </div>
        </div>
      </div>

      {/* Printable Wrapper for High-Fidelity PDF Export */}
      <div id="printable-dashboard-area" className="space-y-5">

      {/* ==================== VIEW 1: BENTO EXECUTIVE GRID (DEFAULT) ==================== */}
      {dashboardLayout === "bento" && (
        <div className="space-y-5 animate-fade-in">
          {/* Stunning National Pride & Event Readiness Banner */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-5 text-white shadow-md border border-red-500/30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 relative overflow-hidden mb-5">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none"></div>
            
            <div className="space-y-3 relative z-10 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-white/20 text-white rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                  <span>RW 04 Ngabean Semarang</span>
                </span>
              </div>
              <h3 className="text-lg font-black uppercase tracking-wide leading-tight">
                🇮🇩 Gelora Kemerdekaan RI Ke-81
              </h3>
              <p className="text-xs text-red-50 leading-relaxed max-w-xl">
                Semangat kemerdekaan berkobar dalam kebersamaan warga. Seluruh data swadaya, program kerja seksi, dan rancangan belanja dikelola secara transparan dan akuntabel di portal SEMS.
              </p>
            </div>

            {/* Dynamic Event Readiness Widget */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 md:w-80 shrink-0 relative z-10 space-y-3 flex flex-col justify-center">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-100">Kesiapan Acara</span>
                <span className="text-2xl font-black font-mono leading-none text-white">
                  {Math.round((taskPercent + totalRTPercent) / 2)}%
                </span>
              </div>
              {/* Custom High-Fidelity Progress Track */}
              <div className="w-full bg-red-950/40 rounded-full h-2.5 overflow-hidden border border-red-900/20">
                <div 
                  className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${Math.round((taskPercent + totalRTPercent) / 2)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-red-100 font-mono">
                <span>Task: {taskPercent}% Selesai</span>
                <span>Swadaya: {totalRTPercent}% Terkumpul</span>
              </div>
            </div>
          </div>

          {/* Primary KPI Metrics Row - Perfect Balanced 4-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Kas Utama */}
            <div id="card-bento-kpi-kas" className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 border-l-4 border-red-600 flex items-center justify-between hover:shadow-md transition-all duration-200 group">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Saldo Kas Utama RW</span>
                <span className="text-xl font-mono font-extrabold text-slate-800 tracking-tight block group-hover:text-red-600 transition-colors">
                  {formatRp(netBalance)}
                </span>
                <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500">
                  <span className="text-emerald-600 font-bold">Masuk: {formatRp(totalIncome)}</span>
                </div>
              </div>
              <div className="bg-red-50 p-2.5 rounded-xl border border-red-100 shrink-0 group-hover:scale-105 transition-transform">
                <Wallet className="w-5 h-5 text-red-600" />
              </div>
            </div>

            {/* KPI 2: Swadaya Warga (The Missing 4th Card to balance grid) */}
            <div id="card-bento-kpi-swadaya" className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 border-l-4 border-amber-500 flex items-center justify-between hover:shadow-md transition-all duration-200 group">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Swadaya & Iuran RT</span>
                <span className="text-xl font-mono font-extrabold text-slate-800 tracking-tight block group-hover:text-amber-600 transition-colors">
                  {totalRTPercent}% Terkumpul
                </span>
                <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500">
                  <span className="text-amber-600 font-semibold">{formatRp(totalRTCashCollected)} dari {formatShortRp(totalRTTarget)}</span>
                </div>
              </div>
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 shrink-0 group-hover:scale-105 transition-transform">
                <Gift className="w-5 h-5 text-amber-600" />
              </div>
            </div>

            {/* KPI 3: Anggaran Disetujui (RKBA) */}
            <div id="card-bento-kpi-rkba" className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 border-l-4 border-indigo-500 flex items-center justify-between hover:shadow-md transition-all duration-200 group">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Rencana Belanja RKBA</span>
                <span className="text-xl font-mono font-extrabold text-slate-800 tracking-tight block group-hover:text-indigo-600 transition-colors">
                  {formatRp(rkbaTotalApproved)}
                </span>
                <span className="text-[9px] font-mono text-slate-500 block">
                  Diusulkan: {formatRp(rkbaTotalProposed)}
                </span>
              </div>
              <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 shrink-0 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              </div>
            </div>

            {/* KPI 4: Kinerja Panitia */}
            <div id="card-bento-kpi-tasks" className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 border-l-4 border-emerald-500 flex items-center justify-between hover:shadow-md transition-all duration-200 group">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Progres Program Kerja</span>
                <span className="text-xl font-mono font-extrabold text-slate-800 tracking-tight block group-hover:text-emerald-600 transition-colors">
                  {taskPercent}% Selesai
                </span>
                <span className="text-[9px] font-mono text-slate-500 block">
                  {completedTasks} dari {totalTasks} selesai
                </span>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 shrink-0 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Master Governance & Fiscal Control Hub */}
          <div id="card-budget-governance-hub" className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 text-white shadow-lg border border-slate-700/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-16 translate-x-16"></div>

            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-700/60">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-indigo-500/30 flex items-center gap-1">
                    <Scale className="w-3 h-3" />
                    <span>Governance & Fiscal Control</span>
                  </span>
                  {pendingProposalsCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30 animate-pulse">
                      {pendingProposalsCount} Menunggu Persetujuan
                    </span>
                  )}
                </div>
                <h3 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                  Konsolidasi Pagu Anggaran & Pengendalian Belanja
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Integrasi otomatis antara RAB Baseline Awal, Perubahan Anggaran (Add/Deduct), Realokasi Antar Seksi, dan Realisasi Kas Riil.
                </p>
              </div>

              {/* Quick Navigation Action Hub */}
              {onNavigateView && (
                <div className="flex flex-wrap items-center gap-1.5 self-stretch sm:self-auto">
                  <button
                    onClick={() => onNavigateView("perubahan-anggaran")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition shadow-sm cursor-pointer"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>Perubahan Anggaran ({budgetChanges.length})</span>
                  </button>
                  <button
                    onClick={() => onNavigateView("realokasi-anggaran")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold transition border border-slate-600 cursor-pointer"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Realokasi ({budgetReallocations.length})</span>
                  </button>
                  <button
                    onClick={() => onNavigateView("notulensi")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold transition border border-slate-600 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Risalah Rapat ({notulensi.length})</span>
                  </button>
                </div>
              )}
            </div>

            {/* 6-Grid Fiscal Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 relative z-10">
              {/* 1. Baseline RAB */}
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">1. Baseline Awal</span>
                <span className="text-sm md:text-base font-mono font-extrabold text-white mt-1 block">
                  {formatRp(totalBaselinePagu)}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Pagu awal seksi</span>
              </div>

              {/* 2. Perubahan Net */}
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-semibold">2. Net Perubahan</span>
                  {totalApprovedBudgetChangeDelta >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-amber-400" />
                  )}
                </div>
                <span className={`text-sm md:text-base font-mono font-extrabold mt-1 block ${
                  totalApprovedBudgetChangeDelta >= 0 ? "text-emerald-400" : "text-amber-400"
                }`}>
                  {totalApprovedBudgetChangeDelta >= 0 ? "+" : ""}{formatRp(totalApprovedBudgetChangeDelta)}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">{approvedBudgetChanges.length} SK Disetujui</span>
              </div>

              {/* 3. Realokasi Pergeseran */}
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">3. Realokasi Pos</span>
                <span className="text-sm md:text-base font-mono font-extrabold text-indigo-300 mt-1 block">
                  {formatRp(totalApprovedReallocationVolume)}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">{approvedReallocations.length} Berita Acara</span>
              </div>

              {/* 4. Pagu Aktif Total */}
              <div className="bg-indigo-950/70 rounded-xl p-3 border border-indigo-500/40">
                <span className="text-[9px] font-mono uppercase tracking-wider text-indigo-300 block font-semibold">4. Pagu Aktif</span>
                <span className="text-sm md:text-base font-mono font-extrabold text-amber-300 mt-1 block">
                  {formatRp(totalActivePagu)}
                </span>
                <span className="text-[9px] text-indigo-200 block mt-0.5">Plafon belanja sah</span>
              </div>

              {/* 5. Realisasi Belanja */}
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">5. Realisasi Kas</span>
                <span className="text-sm md:text-base font-mono font-extrabold text-red-400 mt-1 block">
                  {formatRp(totalRealisasiKas)}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Serapan {paguAbsorptionPercent}%</span>
              </div>

              {/* 6. Sisa Pagu */}
              <div className="bg-emerald-950/60 rounded-xl p-3 border border-emerald-500/40">
                <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-300 block font-semibold">6. Sisa Pagu</span>
                <span className={`text-sm md:text-base font-mono font-extrabold mt-1 block ${
                  sisaPaguAktif >= 0 ? "text-emerald-300" : "text-red-400"
                }`}>
                  {formatRp(sisaPaguAktif)}
                </span>
                <span className="text-[9px] text-emerald-200 block mt-0.5">{sisaPaguAktif >= 0 ? "Saldo aman" : "Defisit pagu"}</span>
              </div>
            </div>
          </div>

          {/* Visual Chart Card */}
          <div id="card-budget-analytics" className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/60">
              <div>
                <div className="flex items-center gap-1.5 text-red-600 font-sans text-[10px] font-bold uppercase tracking-wider">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Real-time Financial Analytics</span>
                </div>
                <h3 className="font-sans font-extrabold text-slate-800 text-xs uppercase tracking-wider mt-0.5">
                  Visualisasi Anggaran vs. Realisasi Belanja (RKBA vs Kas)
                </h3>
                <p className="text-[10px] text-slate-500">
                  Analisis perbandingan rencana anggaran disetujui terhadap pengeluaran kas aktual.
                </p>
              </div>

              {/* Chart Switcher Buttons */}
              <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200 gap-0.5 self-start sm:self-auto">
                <button
                  id="btn-chart-switch-bar"
                  onClick={() => setActiveChart("bar")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold transition-all duration-150 cursor-pointer ${
                    activeChart === "bar"
                      ? "bg-white text-slate-800 shadow-xs border border-slate-200"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Per Seksi</span>
                </button>
                <button
                  id="btn-chart-switch-area"
                  onClick={() => setActiveChart("area")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold transition-all duration-150 cursor-pointer ${
                    activeChart === "area"
                      ? "bg-white text-slate-800 shadow-xs border border-slate-200"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <LucideLineChart className="w-3.5 h-3.5" />
                  <span>Tren Belanja</span>
                </button>
                <button
                  id="btn-chart-switch-pie"
                  onClick={() => setActiveChart("pie")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold transition-all duration-150 cursor-pointer ${
                    activeChart === "pie"
                      ? "bg-white text-slate-800 shadow-xs border border-slate-200"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <LucidePieChart className="w-3.5 h-3.5" />
                  <span>Porsi Seksi</span>
                </button>
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 xl:grid-cols-4 gap-6 items-stretch">
              {/* Chart Area */}
              <div className="xl:col-span-3 min-h-[260px] flex flex-col justify-center">
                {activeChart === "bar" && (
                  <div id="chart-container-bar" className="w-full h-full animate-fade-in">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={seksiBudgets}
                        margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                        />
                        <YAxis 
                          tickFormatter={formatShortRp}
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                        />
                        <Tooltip 
                          formatter={(value: any) => [formatRp(Number(value)), ""]}
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: 'none', 
                            borderRadius: '6px',
                            padding: '8px 12px',
                            color: '#fff',
                            fontSize: '11px',
                            fontFamily: 'monospace'
                          }}
                          itemStyle={{ color: '#fff' }}
                          labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                          verticalAlign="bottom"
                          height={36}
                        />
                        <Bar 
                          name="Anggaran Disetujui (RKBA)" 
                          dataKey="approved" 
                          fill="#6366f1" 
                          radius={[3, 3, 0, 0]} 
                        />
                        <Bar 
                          name="Realisasi Belanja" 
                          dataKey="spent" 
                          fill="#ef4444" 
                          radius={[3, 3, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {activeChart === "area" && (
                  <div id="chart-container-area" className="w-full h-full animate-fade-in">
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart
                        data={cumulativeSpendingData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                        />
                        <YAxis 
                          tickFormatter={formatShortRp}
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                        />
                        <Tooltip 
                          formatter={(value: any, name: string) => [
                            formatRp(Number(value)), 
                            name === "cumulative" ? "Akumulasi Pengeluaran" : name === "budgetLimit" ? "Total Plafon RKBA" : "Pengeluaran"
                          ]}
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: 'none', 
                            borderRadius: '6px',
                            padding: '8px 12px',
                            color: '#fff',
                            fontSize: '11px',
                            fontFamily: 'monospace'
                          }}
                          itemStyle={{ color: '#fff' }}
                          labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                          verticalAlign="bottom"
                          height={36}
                        />
                        <Area 
                          name="cumulative" 
                          type="monotone" 
                          dataKey="cumulative" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorCumulative)" 
                        />
                        <Area
                          name="budgetLimit"
                          type="monotone"
                          dataKey="budgetLimit"
                          stroke="#6366f1"
                          strokeWidth={1.5}
                          strokeDasharray="5 5"
                          fill="none"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {activeChart === "pie" && (
                  <div id="chart-container-pie" className="w-full h-full animate-fade-in flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={seksiBudgets.filter(s => s.approved > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="approved"
                        >
                          {seksiBudgets.filter(s => s.approved > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => [formatRp(Number(value)), "Porsi Anggaran"]}
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: 'none', 
                            borderRadius: '6px',
                            padding: '8px 12px',
                            color: '#fff',
                            fontSize: '11px'
                          }}
                        />
                        <Legend 
                          layout="horizontal" 
                          verticalAlign="bottom" 
                          align="center"
                          wrapperStyle={{ fontSize: '9px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Side Summary Panel */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ikhtisar Penyerapan</h4>
                  <div className="mt-3 space-y-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Total RKBA Disetujui:</span>
                      <span className="text-sm font-mono font-bold text-indigo-600 block leading-tight">{formatRp(rkbaTotalApproved)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Total Realisasi Belanja:</span>
                      <span className="text-sm font-mono font-bold text-red-600 block leading-tight">{formatRp(totalRKBASpent)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Sisa Anggaran (Efisiensi):</span>
                      <span className="text-sm font-mono font-bold text-emerald-600 block leading-tight">
                        {formatRp(totalRKBASaving)} {rkbaTotalApproved > 0 && `(${savingPercent}%)`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold uppercase">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span>Rekomendasi Analitik</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    {totalRKBASaving < 0 
                      ? "⚠️ Pengeluaran saat ini melebihi rencana anggaran RKBA yang disetujui. Segera audit belanja pendukung!" 
                      : `✅ Sinergi penghematan berjalan sangat baik. Masih tersedia cadangan ${formatRp(totalRKBASaving)} untuk operasional darurat.`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Bento Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left Column (2/3 width on Large screen) */}
            <div className="lg:col-span-2 space-y-5">
              {/* Iuran RT Collection Dashboard */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <h3 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider">Monitoring Iuran RT (Kas Riil)</h3>
                    <p className="text-[10px] text-slate-500">Iuran pokok warga per RT (Target: {formatRp(safeSettings.targetIuranPerRT)})</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono font-extrabold bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 rounded uppercase">
                      Terkumpul: {totalRTPercent}%
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">{formatRp(totalRTCashCollected)} / {formatRp(totalRTTarget)}</span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {rtCollections.map((rt) => (
                    <div key={rt.name} className="space-y-1 p-2 rounded hover:bg-slate-50 transition-colors duration-150 border border-slate-100">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-700">{rt.name} Ngabean</span>
                        <span className="font-mono text-slate-600">
                          Cash: {formatRp(rt.collected)} ({rt.percent}%)
                        </span>
                      </div>

                      <div className="relative w-full h-2.5 bg-slate-100 rounded overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-emerald-500 rounded transition-all duration-500"
                          style={{ width: `${rt.percent}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-slate-400">
                        <span>Target: {formatRp(safeSettings.targetIuranPerRT)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub Grid: Agenda Only */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider">Agenda Utama HUT RI Ke-81</h3>
                  </div>
                  <div className="p-3 space-y-2">
                    {kegiatan.map((k) => {
                      const statusColors = {
                        "Perencanaan": "bg-slate-100 text-slate-600 border-slate-200",
                        "Persiapan": "bg-amber-100 text-amber-700 border-amber-200",
                        "Pelaksanaan": "bg-red-100 text-red-700 border-red-200",
                        "Selesai": "bg-emerald-100 text-emerald-700 border-emerald-200"
                      };
                      return (
                        <div key={k.id} className="flex items-start justify-between gap-2 p-2 rounded border border-slate-100 hover:border-slate-200 transition-all duration-150">
                          <div>
                            <h4 className="text-[11px] font-bold text-slate-800 line-clamp-1">{k.name}</h4>
                            <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              <span>{k.date} ({k.time})</span>
                            </div>
                          </div>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${statusColors[k.status] || ""}`}>
                            {k.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (1/3 width): Seksi Performance & Resources */}
            <div className="space-y-5">
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <h3 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider">Pagu vs Anggaran Seksi</h3>
                  <p className="text-[10px] text-slate-500">Penyerapan anggaran disetujui terhadap batas pagu</p>
                </div>

                <div className="p-4 space-y-4">
                  {seksiBudgets.map((seksi) => {
                    const limitExceeded = seksi.approved > seksi.pagu;
                    const percent = Math.min(100, Math.round((seksi.approved / (seksi.pagu || 1)) * 100));
                    
                    return (
                      <div key={seksi.name} className="space-y-1">
                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <span className="text-slate-700">{seksi.name}</span>
                          <span className="font-mono text-slate-500">
                            {percent}%
                          </span>
                        </div>

                        <div className="w-full h-2 bg-slate-100 rounded overflow-hidden relative">
                          <div 
                            className={`h-full rounded transition-all duration-500 ${
                              limitExceeded ? "bg-red-600 animate-pulse" : "bg-red-50"
                            }`}
                            style={{ width: `${percent}%`, backgroundColor: limitExceeded ? "" : "#ef4444" }}
                          />
                        </div>

                        <div className="flex justify-between text-[9px] text-slate-400">
                          <span>Setuju: <strong className="text-slate-600 font-semibold">{formatRp(seksi.approved)}</strong></span>
                          <span>Pagu: {formatRp(seksi.pagu)}</span>
                        </div>

                        {seksi.spent > 0 && (
                          <div className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                            <span>Dibelanjakan: {formatRp(seksi.spent)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <h3 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider">Sumber Daya Panitia</h3>
                </div>
                
                <div className="p-4 space-y-2.5">
                  <div className="flex justify-between text-xs border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Total Struktur Panitia</span>
                    <span className="font-mono font-bold text-slate-800">{panitia.length} Orang</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Target Koleksi Iuran RT</span>
                    <span className="font-mono font-bold text-slate-800">{formatRp(totalRTTarget)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Item Kebutuhan Terencana</span>
                    <span className="font-mono font-bold text-slate-800">{rkba.length} Barang</span>
                  </div>

                  <div className="mt-3 p-2 bg-slate-50 rounded border border-slate-100 text-[10px] text-slate-500 leading-normal text-center">
                    Semua data di atas tersinkronisasi otomatis dengan Database Spreadsheet RW 04 Ngabean.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Trail & Governance Activity Feed */}
          <div id="card-governance-audit-feed" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Jejak Audit & Riwayat Keputusan Anggaran
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Transparansi perubahan data, persetujuan realokasi, dan risalah notulensi secara kronologis.
                  </p>
                </div>
              </div>

              {onNavigateView && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateView("notulensi")}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    <span>Buka Risalah Rapat</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="p-4">
              {auditTrails.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                  <p>Belum ada rekaman audit log. Aktivitas perubahan anggaran dan notulensi akan tercatat otomatis di sini.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditTrails.slice(-6).reverse().map((audit) => {
                    const actionColors: Record<string, string> = {
                      CREATE: "bg-emerald-50 text-emerald-700 border-emerald-200",
                      UPDATE: "bg-blue-50 text-blue-700 border-blue-200",
                      APPROVE: "bg-indigo-50 text-indigo-700 border-indigo-200",
                      REJECT: "bg-rose-50 text-rose-700 border-rose-200",
                      CANCEL: "bg-amber-50 text-amber-700 border-amber-200",
                      LINK: "bg-purple-50 text-purple-700 border-purple-200"
                    };

                    const typeLabels: Record<string, string> = {
                      BUDGET_CHANGE: "Perubahan Anggaran",
                      BUDGET_REALLOCATION: "Realokasi Pos",
                      NOTULENSI: "Risalah Notulensi",
                      RKBA: "Item Belanja RKBA",
                      SETTINGS: "Konfigurasi Sistem"
                    };

                    let formattedDate = audit.timestamp;
                    try {
                      formattedDate = new Date(audit.timestamp).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      });
                    } catch (e) {
                      // fallback
                    }

                    return (
                      <div
                        key={audit.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition gap-2"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border shrink-0 mt-0.5 ${
                            actionColors[audit.action] || "bg-slate-100 text-slate-700 border-slate-200"
                          }`}>
                            {audit.action}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-bold text-slate-800">
                                {typeLabels[audit.entityType] || audit.entityType}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                #{audit.entityId}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                              {audit.details}
                            </p>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center text-right shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <span className="text-[10px] font-medium text-slate-500 font-mono">
                            {audit.actor}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {formattedDate}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== VIEW 2: ANALYTICAL LEDGER VIEW ==================== */}
      {dashboardLayout === "analytical" && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Sub-tabs selector for Analytical view */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200 self-start sm:self-auto gap-0.5">
              <button
                onClick={() => setAnalyticalTab("cashflow")}
                className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all duration-150 ${
                  analyticalTab === "cashflow"
                    ? "bg-white text-slate-800 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Buku Arus Kas ({keuangan.length})
              </button>
              <button
                onClick={() => setAnalyticalTab("seksi")}
                className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all duration-150 ${
                  analyticalTab === "seksi"
                    ? "bg-white text-slate-800 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Penyerapan Seksi ({safeSettings.seksiList.length})
              </button>
              <button
                onClick={() => setAnalyticalTab("rt")}
                className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all duration-150 ${
                  analyticalTab === "rt"
                    ? "bg-white text-slate-800 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Kolektivitas RT ({safeSettings.rtList.length})
              </button>
            </div>

            {/* Quick search input */}
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Cari entri data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs border border-slate-200 pl-8 pr-3 py-1.5 rounded bg-slate-50 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Tab Content 1: CASHFLOW */}
          {analyticalTab === "cashflow" && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detail Aliran Kas Buku Besar</span>
                <span className="text-[10px] font-mono text-slate-500 font-bold">Total: {keuangan.length} Transaksi</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-sans text-[10px] uppercase tracking-wider border-b border-slate-200 font-bold">
                      <th className="px-4 py-2.5">ID</th>
                      <th className="px-4 py-2.5">Arus</th>
                      <th className="px-4 py-2.5">Tanggal</th>
                      <th className="px-4 py-2.5">Kategori</th>
                      <th className="px-4 py-2.5">Nominal</th>
                      <th className="px-4 py-2.5">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {keuangan
                      .filter(t => 
                        (t.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (t.notes || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (t.id || "").toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-2 font-mono text-[10px] text-slate-400">{t.id}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                              t.type === "Masuk" 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                : "bg-red-50 text-red-700 border-red-100"
                            }`}>
                              {t.type}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-mono text-slate-500">{t.date}</td>
                          <td className="px-4 py-2 font-semibold text-slate-600">{t.category}</td>
                          <td className={`px-4 py-2 font-mono font-bold ${t.type === "Masuk" ? "text-emerald-600" : "text-red-600"}`}>
                            {t.type === "Masuk" ? "+" : "-"} {formatRp(t.amount)}
                          </td>
                          <td className="px-4 py-2 text-slate-600 italic font-sans max-w-xs truncate" title={t.notes}>{t.notes}</td>
                        </tr>
                      ))}
                    {keuangan.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-400 font-sans">
                          Tidak ditemukan transaksi kas terdaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab Content 2: SEKSI penyerapan */}
          {analyticalTab === "seksi" && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tabel Penyerapan Pagu Belanja Per Seksi</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-sans text-[10px] uppercase tracking-wider border-b border-slate-200 font-bold">
                      <th className="px-4 py-2.5">Nama Seksi</th>
                      <th className="px-4 py-2.5 text-right">Pagu Batas</th>
                      <th className="px-4 py-2.5 text-right">RKBA Disetujui</th>
                      <th className="px-4 py-2.5 text-right">Telah Dibelanjakan</th>
                      <th className="px-4 py-2.5 text-right">Sisa Pagu Belanja</th>
                      <th className="px-4 py-2.5">Rasio Efisiensi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {seksiBudgets
                      .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((s) => {
                        const remaining = s.pagu - s.approved;
                        const efficiencyRatio = s.pagu > 0 ? Math.round(((s.pagu - s.approved) / s.pagu) * 100) : 0;
                        return (
                          <tr key={s.name} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-800">Seksi {s.name}</td>
                            <td className="px-4 py-3 text-right font-mono text-slate-500">{formatRp(s.pagu)}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-indigo-600">{formatRp(s.approved)}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">{formatRp(s.spent)}</td>
                            <td className={`px-4 py-3 text-right font-mono font-bold ${remaining < 0 ? "text-red-600" : "text-slate-600"}`}>
                              {formatRp(remaining)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                remaining < 0 
                                  ? "bg-red-50 text-red-700 border border-red-100 animate-pulse" 
                                  : efficiencyRatio > 30 
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                    : "bg-amber-50 text-amber-700 border border-amber-100"
                              }`}>
                                {remaining < 0 ? "OVER-BUDGET!" : `Hemat ${efficiencyRatio}%`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab Content 3: RT KOLEKTIF */}
          {analyticalTab === "rt" && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tabel Audit Iuran & Kontribusi Swadaya RT</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-sans text-[10px] uppercase tracking-wider border-b border-slate-200 font-bold">
                      <th className="px-4 py-2.5">Rukun Tetangga (RT)</th>
                      <th className="px-4 py-2.5 text-right">Kas Tunai Masuk</th>
                      <th className="px-4 py-2.5 text-right">Target Iuran RT</th>
                      <th className="px-4 py-2.5">Progres Kas Riil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {rtCollections
                      .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((r) => (
                        <tr key={r.name} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-800">{r.name} Ngabean</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{formatRp(r.collected)}</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-400">{formatRp(safeSettings.targetIuranPerRT)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold w-8">{r.percent}%</span>
                              <div className="w-24 h-1.5 bg-slate-100 rounded overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500" 
                                  style={{ width: `${r.percent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ==================== VIEW 3: CITIZEN PROJECTOR MODE ==================== */}
      {dashboardLayout === "projector" && (
        <div className="space-y-6 bg-slate-900 text-white p-6 rounded-lg shadow-xl border border-slate-800 animate-fade-in select-none">
          
          {/* Top Banner with high visibility project details */}
          <div className="border-b-2 border-slate-700 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded uppercase tracking-widest animate-pulse inline-block mb-2">
                ● LIVE DATA RAPAT WARGA RW 04 NGABEAN
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight font-sans text-white uppercase">
                LAPORAN PERKEMBANGAN HUT RI KE-81
              </h1>
              <p className="text-slate-400 text-xs mt-1 font-mono uppercase tracking-wider">
                Kelurahan Gunungpati • Single Source of Truth Spreadsheet System
              </p>
            </div>
            <div className="bg-slate-800 p-4 rounded-md border border-slate-700 flex flex-col items-center justify-center shrink-0 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Metode Data</span>
              <span className="text-sm text-emerald-400 font-extrabold font-mono">100% SINKRON</span>
            </div>
          </div>

          {/* Giga Financial Swadaya Metrics row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Massive Card 1: Combined swadaya value */}
            <div id="projector-card-combined" className="bg-slate-800 p-5 rounded-lg border-2 border-amber-500/30 text-center space-y-1">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">Total Iuran Tunai Warga</span>
              <span className="text-3xl font-mono font-extrabold text-amber-400 tracking-tight block">
                {formatRp(totalRTCashCollected)}
              </span>
              <span className="text-[9px] text-slate-400 block uppercase tracking-wide">
                Total Akumulasi Iuran Seluruh RT
              </span>
            </div>

            {/* Massive Card 2: Saldo Kas Utama */}
            <div id="projector-card-kas" className="bg-slate-800 p-5 rounded-lg border-2 border-red-500/30 text-center space-y-1">
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest block">Saldo Kas Tunai Utama</span>
              <span className="text-3xl font-mono font-extrabold text-red-500 tracking-tight block">
                {formatRp(netBalance)}
              </span>
              <span className="text-[9px] text-slate-400 block uppercase tracking-wide">
                Total Masuk: {formatRp(totalIncome)} | Keluar: {formatRp(totalExpense)}
              </span>
            </div>

            {/* Massive Card 3: Task completion */}
            <div id="projector-card-tasks" className="bg-slate-800 p-5 rounded-lg border-2 border-emerald-500/30 text-center space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block">Progres Persiapan Kinerja</span>
              <span className="text-3xl font-mono font-extrabold text-emerald-400 tracking-tight block">
                {taskPercent}% Selesai
              </span>
              <span className="text-[9px] text-slate-400 block uppercase tracking-wide">
                {completedTasks} Selesai dari {totalTasks} Agenda Proker Seksi
              </span>
            </div>

          </div>

          {/* High Contrast Projector Visual Analytics */}
          <div id="projector-card-chart" className="bg-slate-800 p-5 rounded-lg border border-slate-700 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2.5">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
                  <BarChart3 className="w-4 h-4 text-red-500" />
                  Grafik Anggaran vs Realisasi Belanja Seksi (Layar Lebar)
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                  Perbandingan visual terpusat untuk memantau efisiensi kepatuhan dana per seksi kepanitiaan.
                </p>
              </div>
              <span className="text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                RKBA VS ARUS KAS KELUAR
              </span>
            </div>

            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={seksiBudgets}
                  margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                    axisLine={{ stroke: '#475569' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={formatShortRp}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    axisLine={{ stroke: '#475569' }}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatRp(Number(value)), ""]}
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      border: '1px solid #334155', 
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#cbd5e1', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#cbd5e1' }}
                    verticalAlign="bottom"
                    height={36}
                  />
                  <Bar 
                    name="Anggaran Disetujui (RKBA)" 
                    dataKey="approved" 
                    fill="#818cf8" 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Bar 
                    name="Realisasi Belanja Kas" 
                    dataKey="spent" 
                    fill="#f87171" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leaderboard and Agenda Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* RT SWADAYA LEADERBOARD */}
            <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
              <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  KLASEMEN KONTRIBUSI IURAN RT
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                  UANG TUNAI KAS RT
                </span>
              </div>

              <div className="space-y-4">
                {sortedRtLeaderboard.map((rt, idx) => {
                  let badge = "●";
                  let badgeColor = "text-slate-500";
                  let bgBorderColor = "border-slate-700";

                  if (idx === 0) {
                    badge = "🥇";
                    bgBorderColor = "border-amber-400/50 bg-amber-500/5";
                  } else if (idx === 1) {
                    badge = "🥈";
                    bgBorderColor = "border-slate-300/40 bg-slate-100/5";
                  } else if (idx === 2) {
                    badge = "🥉";
                    bgBorderColor = "border-amber-700/40 bg-amber-800/5";
                  }

                  return (
                    <div 
                      key={rt.name} 
                      className={`p-3 border rounded flex items-center justify-between gap-4 transition-all duration-300 ${bgBorderColor}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl shrink-0">{badge}</span>
                        <div>
                          <span className="text-sm font-bold text-white block leading-tight">{rt.name} Ngabean</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Target: {formatRp(safeSettings.targetIuranPerRT)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="text-xs font-mono font-extrabold text-emerald-400 block leading-none">
                          {formatRp(rt.collected)}
                        </span>
                        
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-[10px] font-mono font-bold text-slate-300">{rt.percent}%</span>
                          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${idx === 0 ? "bg-amber-400" : "bg-emerald-500"}`} 
                              style={{ width: `${rt.percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* UPCOMING RAPAT SLIDES SUMMARY */}
            <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
                    <Calendar className="w-4 h-4 text-red-500" />
                    LINI MASA AGENDA TERDEKAT
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
                    RW 04 NGABEAN
                  </span>
                </div>

                <div className="space-y-3">
                  {kegiatan.map((k) => (
                    <div key={k.id} className="p-3 bg-slate-900/60 rounded border border-slate-700 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-white leading-tight uppercase tracking-wide">{k.name}</h4>
                        <p className="text-[10px] text-slate-400 font-sans mt-1">Lokasi: {k.location}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-red-400 font-mono font-bold block">{k.date}</span>
                        <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{k.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700 text-center text-xs text-slate-400 leading-normal">
                Sistem Informasi Manajemen RW 04 Ngabean Semarang dibangun dengan semangat 
                <strong className="text-white font-extrabold"> GOTONG ROYONG </strong> 
                untuk kemakmuran dan transparansi bersama.
              </div>
            </div>

          </div>

        </div>
      )}
      </div>

    </div>
  );
}

