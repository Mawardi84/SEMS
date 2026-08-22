import React, { useState } from "react";
import { 
  Share2, 
  Copy, 
  Check, 
  Eye, 
  ShieldCheck, 
  Lock, 
  ExternalLink, 
  FileSpreadsheet, 
  Wallet, 
  TrendingUp, 
  Layers, 
  X,
  Sparkles,
  Info
} from "lucide-react";

interface ShareAnggaranModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBudgetViewOnly: boolean;
  onToggleBudgetViewOnly: (enabled: boolean) => void;
}

export default function ShareAnggaranModal({
  isOpen,
  onClose,
  isBudgetViewOnly,
  onToggleBudgetViewOnly
}: ShareAnggaranModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const shareableUrl = `${currentOrigin}/?mode=budget-view`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      // Fallback if clipboard API fails in iframe
      const input = document.createElement("input");
      input.value = shareableUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const budgetModules = [
    { title: "Dashboard Executive", desc: "KPI Anggaran, Transparansi Pamsimas (Talangan 8 Jt vs Donasi 2 Jt), Iuran 4 RT, Realisasi Belanja, Sisa Kas", icon: TrendingUp },
    { title: "RAB Awal (Baseline)", desc: "Daftar Rencana Kebutuhan Barang & Anggaran per seksi dengan status disahkan (Read-only, tombol edit/hapus disembunyikan)", icon: FileSpreadsheet },
    { title: "Perubahan Anggaran", desc: "Riwayat addendum, penambahan, dan peniadaan pos kegiatan resmi berdasar notulensi", icon: Layers },
    { title: "Realokasi Anggaran", desc: "Transparansi pergeseran dana antar-seksi dengan prinsip zero-sum balance", icon: Layers },
    { title: "Arus Kas & Buku Kas Umum", desc: "Aliran pemasukan & pengeluaran kas riil, bukti transaksi, dan ekspor laporan (tanpa tombol tambah/ubah transaksi)", icon: Wallet },
    { title: "Monitoring & LPJ", desc: "Realisasi anggaran riil per seksi, analisis varians pagu, dan draf Laporan Pertanggungjawaban", icon: ShieldCheck }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-red-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/30 text-red-400 rounded-xl border border-red-500/30">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold uppercase tracking-wider border border-emerald-500/30">
                  Mode Transparansi Publik
                </span>
                <span className="text-[10px] text-slate-300 font-mono">
                  Hanya Lihat (View-Only)
                </span>
              </div>
              <h2 className="text-base font-black text-white mt-0.5">
                Bagikan Tautan: Khusus Transparansi Anggaran
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-700 custom-scrollbar">
          
          {/* Direct Share Link Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600" />
                Tautan Publik Transparansi Anggaran:
              </label>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded font-bold">
                Auto-Protect (Read-Only)
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 font-semibold focus:outline-none focus:border-blue-500 select-all"
              />
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 shadow-xs ${
                  copied 
                    ? "bg-emerald-600 text-white shadow-emerald-600/30" 
                    : "bg-red-700 hover:bg-red-800 text-white shadow-red-700/20"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Link</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Siapapun yang membuka tautan ini akan otomatis masuk ke <strong>Mode Publik Transparansi Anggaran</strong> tanpa hak akses untuk menambah, mengedit, atau menghapus data.
            </p>
          </div>

          {/* Mode Switcher inside modal for previewing */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg mt-0.5">
                <Lock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-blue-950">
                  Pratinjau Mode di Layar Anda Saat Ini
                </h4>
                <p className="text-[11px] text-blue-800/80 mt-0.5">
                  {isBudgetViewOnly 
                    ? "Saat ini Anda sedang dalam Mode Hanya Lihat Anggaran (Publik dengan proteksi PIN admin)." 
                    : "Saat ini Anda dalam Mode Administrator (Akses Penuh Edit & Pengaturan)."}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onToggleBudgetViewOnly(!isBudgetViewOnly);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                isBudgetViewOnly
                  ? "bg-white text-blue-800 border-blue-300 hover:bg-blue-50"
                  : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-xs"
              }`}
            >
              {isBudgetViewOnly ? "Buka PIN Admin" : "Coba Mode Hanya Lihat"}
            </button>
          </div>

          {/* Module scope breakdown */}
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Cakupan Fitur yang Dapat Dilihat Publik:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {budgetModules.map((m, idx) => {
                const Icon = m.icon;
                return (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-3xs flex items-start gap-2.5">
                    <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">{m.title}</h5>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{m.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security & Isolation Notice */}
          <div className="bg-slate-100/80 rounded-xl p-3 border border-slate-200 flex items-start gap-2.5 text-[11px] text-slate-600">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p>
              <strong>Proteksi Keamanan:</strong> Menu administratif seperti <em>Pengaturan Sistem</em>, <em>Google Sheets Sync</em>, <em>Data Master</em>, <em>Dokumen Proposal</em>, <em>Notulensi</em>, <em>Kupon</em>, dan tombol <em>Reset Database</em> otomatis disembunyikan dalam mode ini.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            HUT RI Ke-81 RW 04 Ngabean Semarang
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
