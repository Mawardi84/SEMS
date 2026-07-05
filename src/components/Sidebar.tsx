import React from "react";
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  FileSpreadsheet, 
  Gift, 
  Wallet, 
  TrendingUp, 
  RefreshCw,
  Award,
  X,
  BookOpen
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
  const menuItems = [
    { id: "dashboard", label: "Dashboard Executive", icon: LayoutDashboard },
    { id: "rkba", label: "RKBA (Anggaran)", icon: FileSpreadsheet },
    { id: "natura", label: "Kontribusi Natura", icon: Gift },
    { id: "keuangan", label: "Arus Kas Keuangan", icon: Wallet },
    { id: "monitoring", label: "Monitoring & LPJ", icon: TrendingUp },
    { id: "master", label: "Data Master", icon: Users },
    { id: "sheets", label: "Google Sheets Sync", icon: FileSpreadsheet },
    { id: "panduan", label: "Buku Panduan", icon: BookOpen },
    { id: "setting", label: "Pengaturan Sistem", icon: Settings },
  ];

  return (
    <>
      {/* Backdrop for mobile and tablet screens */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 lg:hidden transition-opacity duration-200"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col h-full z-50 transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:h-screen lg:z-auto select-none ${
        isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full lg:translate-x-0"
      }`}>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#e61d1d] rounded-lg flex items-center justify-center text-white shadow-sm">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xs font-extrabold text-slate-800 leading-tight uppercase tracking-wider">SEMS RW 04</h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">HUT RI Ke-81 Ngabean</p>
            </div>
          </div>
          
          {/* Close trigger for mobile */}
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">
          Main Menu
        </div>
        {menuItems.map((item) => {
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
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-[#fdeeee] text-[#e61d1d] border-r-2 border-[#e61d1d]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#e61d1d]" : "text-slate-400"}`} />
              <span className="truncate text-left">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1 h-1 rounded-full bg-[#e61d1d]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info & Reset */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
        <div className="bg-white p-2.5 rounded-md text-[10px] text-slate-500 leading-relaxed font-sans border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center text-slate-700 font-bold mb-1">
            <span className="uppercase text-[9px] tracking-wider text-slate-400">System Status</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] text-emerald-600 font-semibold uppercase">Fully Synced</span>
            </span>
          </div>
          <p className="font-mono text-[9px] text-slate-400">Database: Sheets Local Sync</p>
        </div>

        <button
          id="btn-reset-db"
          onClick={onResetData}
          disabled={isResetting}
          className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 rounded-md text-[10px] font-mono text-slate-500 hover:text-slate-700 transition-all duration-200 disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-3 h-3 ${isResetting ? "animate-spin text-red-500" : ""}`} />
          {isResetting ? "Mereset..." : "Reset Database"}
        </button>
      </div>
    </aside>
  </>
  );
}
