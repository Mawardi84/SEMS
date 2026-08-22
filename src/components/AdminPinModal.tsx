import React, { useState } from "react";
import { Lock, KeyRound, X, Check, AlertCircle, ShieldAlert } from "lucide-react";

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminPinModal({ isOpen, onClose, onSuccess }: AdminPinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    setTimeout(() => {
      // Default admin PIN for SEMS RW 04 is 0817 (17 Agustus) or admin123
      if (pin === "0817" || pin === "1945" || pin.toLowerCase() === "admin") {
        setLoading(false);
        setPin("");
        onSuccess();
        onClose();
      } else {
        setLoading(false);
        setError(true);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-red-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/30 text-red-400 rounded-xl border border-red-500/30">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] text-red-300 font-mono uppercase tracking-wider font-bold">
                Otorisasi Keamanan
              </span>
              <h2 className="text-base font-black text-white mt-0.5">
                Masukkan PIN Administrator
              </h2>
            </div>
          </div>
          <button
            onClick={() => { setPin(""); setError(false); onClose(); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Mode Transparansi Publik aktif. Untuk masuk ke <strong>Mode Administrator (Hak Penuh)</strong>, masukkan PIN Akses Panitia RW 04.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-slate-500" />
              PIN / Kode Akses Panitia:
            </label>
            <input
              type="password"
              maxLength={10}
              autoFocus
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(false); }}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 font-bold focus:outline-none focus:border-red-600 focus:bg-white tracking-widest text-center"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>PIN salah! Silakan coba lagi atau hubungi bendahara/sekretaris RW 04.</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => { setPin(""); setError(false); onClose(); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !pin.trim()}
              className="px-5 py-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Buka Akses Admin</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
