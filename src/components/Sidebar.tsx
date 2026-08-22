import React from "react";
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  FileSpreadsheet, 
  Wallet, 
  TrendingUp, 
  RefreshCw,
  Award,
  X,
  BookOpen,
  FolderOpen,
  Ticket,
  FileDiff,
  ArrowRightLeft,
  FileText,
  Eye,
  ShieldCheck
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onResetData: () => void;
  isResetting: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  isBudgetViewOnly?: boolean;
}

export default function Sidebar({ 
  currentView, 
  onViewChange, 
  onResetData, 
  isResetting, 
  isOpen = false, 
  onClose,
  isBudgetViewOnly = false
}: SidebarProps) {
  const allSections = [
    {
      title: isBudgetViewOnly ? "Informasi Transparansi" : "Informasi Utama",
      items: [
        { id: "dashboard", label: "Dashboard Executive", icon: LayoutDashboard },
        { id: "panduan", label: "Buku Panduan", icon: BookOpen },
      ]
    },
    ...(!isBudgetViewOnly ? [
      {
        title: "Administrasi & Risalah",
        items: [
          { id: "proposal", label: "Dokumen Proposal", icon: FileSpreadsheet },
          { id: "notulensi", label: "Notulensi & Risalah", icon: FileText },
          { id: "documents", label: "Arsip Dokumen", icon: FolderOpen },
        ]
      }
    ] : []),
    {
      title: "Tata Kelola Anggaran",
      items: [
        { id: "rkba", label: "RAB Awal (Baseline)", icon: FileSpreadsheet },
        { id: "perubahan-anggaran", label: "Perubahan Anggaran", icon: FileDiff },
        { id: "realokasi-anggaran", label: "Realokasi Anggaran", icon: ArrowRightLeft },
        { id: "keuangan", label: "Arus Kas & Realisasi", icon: Wallet },
        { id: "monitoring", label: "Monitoring & LPJ", icon: TrendingUp },
      ]
    },
    ...(!isBudgetViewOnly ? [
      {
        title: "Kupon & Atribut",
        items: [
          { id: "coupon", label: "Cetak Kupon Jalan Sehat", icon: Ticket },
        ]
      },
      {
        title: "Konfigurasi & Sinkronisasi",
        items: [
          { id: "master", label: "Data Master", icon: Users },
          { id: "sheets", label: "Google Sheets Sync", icon: FileSpreadsheet },
          { id: "setting", label: "Pengaturan Sistem", icon: Settings },
        ]
      }
    ] : [])
  ];

  return (
    <>
      {/* Backdrop for mobile and tablet screens */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-[3px] z-40 lg:hidden transition-opacity duration-200"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full z-50 transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:h-screen lg:z-auto select-none text-slate-300 ${
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
      }`}>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-900/40 border border-red-500/30">
              <Award className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xs font-black text-white leading-tight uppercase tracking-wider">SEMS RW 04</h1>
              <p className="text-[9px] text-red-400 font-extrabold uppercase tracking-widest leading-none mt-0.5">
                {isBudgetViewOnly ? "Transparansi Anggaran" : "HUT RI Ke-81 Ngabean"}
              </p>
            </div>
          </div>
          
          {/* Close trigger for mobile */}
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Public View Indicator Badge if active */}
        {isBudgetViewOnly && (
          <div className="mx-3 mt-3 p-2 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-[10px] text-emerald-300 flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-bold leading-tight">Mode Transparansi Publik (Hanya Lihat)</span>
          </div>
        )}

      {/* Navigation List grouped by sections */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto custom-scrollbar">
        {allSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-[0.2em] mb-1.5 px-2">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => {
                    onViewChange(item.id);
                    if (onClose) onClose();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-red-600 text-white shadow-lg shadow-red-900/20 border-l-4 border-white font-extrabold"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                  <span className="truncate text-left">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Info & Controls */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-2">
        <div className="bg-slate-900 p-2.5 rounded-xl text-[10px] text-slate-400 leading-relaxed font-sans border border-slate-800 shadow-inner">
          <div className="flex justify-between items-center text-slate-300 font-bold mb-1">
            <span className="uppercase text-[8px] tracking-[0.15em] text-slate-500">Status Akses</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider">
                {isBudgetViewOnly ? "View-Only" : "Admin Aktif"}
              </span>
            </span>
          </div>
          <p className="font-mono text-[9px] text-slate-500">
            {isBudgetViewOnly ? "Hak Akses: Warga / Publik (Anggaran)" : "Database: Sheets Local Sync"}
          </p>
        </div>

        {!isBudgetViewOnly && (
          <button
            id="btn-reset-db"
            onClick={onResetData}
            disabled={isResetting}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-850 rounded-lg text-[10px] font-mono text-slate-400 hover:text-white transition-all duration-200 disabled:opacity-50 shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isResetting ? "animate-spin text-red-500" : "text-slate-500"}`} />
            {isResetting ? "Mereset..." : "Reset Database"}
          </button>
        )}
      </div>
    </aside>
  </>
  );
}
