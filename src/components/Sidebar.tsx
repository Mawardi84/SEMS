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
  FileText,
  FolderOpen,
  Mail,
  Ticket,
  IdCard,
  Gift
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onResetData: () => void;
  isResetting: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ currentView, onViewChange, onResetData, isResetting, isOpen = false, onClose }: SidebarProps) {
  const sections = [
    {
      title: "Informasi Utama",
      items: [
        { id: "dashboard", label: "Dashboard Executive", icon: LayoutDashboard },
        { id: "panduan", label: "Buku Panduan", icon: BookOpen },
      ]
    },
    {
      title: "Administrasi & Arsip",
      items: [
        { id: "proposal", label: "Dokumen Proposal", icon: FileSpreadsheet },
        { id: "undangan", label: "Surat Undangan", icon: Mail },
        { id: "notulensi", label: "Notulensi Rapat", icon: FileText },
        { id: "documents", label: "Arsip Dokumen", icon: FolderOpen },
      ]
    },
    {
      title: "Keuangan & Progres",
      items: [
        { id: "rkba", label: "RKBA (Anggaran)", icon: FileSpreadsheet },
        { id: "keuangan", label: "Arus Kas Keuangan", icon: Wallet },
        { id: "monitoring", label: "Monitoring & LPJ", icon: TrendingUp },
      ]
    },
    {
      title: "Perayaan & Undian",
      items: [
        { id: "coupon", label: "Cetak Kupon Jalan Sehat", icon: Ticket },
        { id: "idcard", label: "Cetak ID Card Panitia", icon: IdCard },
        { id: "doorprize", label: "Undian Doorprize Digital", icon: Gift },
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
              <p className="text-[9px] text-red-400 font-extrabold uppercase tracking-widest leading-none mt-0.5">HUT RI Ke-81 Ngabean</p>
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

      {/* Navigation List grouped by sections */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto custom-scrollbar">
        {sections.map((section) => (
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

      {/* Footer Info & Reset */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-2">
        <div className="bg-slate-900 p-2.5 rounded-xl text-[10px] text-slate-400 leading-relaxed font-sans border border-slate-800 shadow-inner">
          <div className="flex justify-between items-center text-slate-300 font-bold mb-1">
            <span className="uppercase text-[8px] tracking-[0.15em] text-slate-500">System Status</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider">Fully Synced</span>
            </span>
          </div>
          <p className="font-mono text-[9px] text-slate-500">Database: Sheets Local Sync</p>
        </div>

        <button
          id="btn-reset-db"
          onClick={onResetData}
          disabled={isResetting}
          className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-850 rounded-lg text-[10px] font-mono text-slate-400 hover:text-white transition-all duration-200 disabled:opacity-50 shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isResetting ? "animate-spin text-red-500" : "text-slate-500"}`} />
          {isResetting ? "Mereset..." : "Reset Database"}
        </button>
      </div>
    </aside>
  </>
  );
}
