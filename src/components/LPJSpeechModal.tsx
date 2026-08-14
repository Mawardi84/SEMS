import React, { useState } from "react";
import { LPJMaster } from "../types";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Volume2, 
  Printer, 
  X, 
  User, 
  RefreshCw, 
  Award, 
  FileText, 
  CheckCircle2, 
  Sliders 
} from "lucide-react";
import Markdown from "react-markdown";

interface LPJSpeechModalProps {
  isOpen: boolean;
  onClose: () => void;
  lpj?: LPJMaster;
  onGenerateSpeech: () => Promise<any>;
}

export default function LPJSpeechModal({
  isOpen,
  onClose,
  lpj,
  onGenerateSpeech
}: LPJSpeechModalProps) {
  const [activeRole, setActiveRole] = useState<"ketua" | "sekretaris" | "bendahara">("ketua");
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const scripts = lpj?.speechScripts || {
    ketua: "",
    sekretaris: "",
    bendahara: ""
  };

  const currentContent = scripts[activeRole] || "";

  const handleCopy = () => {
    if (!currentContent) return;
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onGenerateSpeech();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegenerating(false);
    }
  };

  const roleTitles = {
    ketua: {
      title: "Ketua Panitia",
      subtitle: "Pengantar & Penegasan Pertanggungjawaban Akhir",
      badgeClass: "bg-red-50 text-red-700 border-red-200",
      icon: Award
    },
    sekretaris: {
      title: "Sekretaris",
      subtitle: "Laporan Pelaksanaan & Administrasi Kegiatan",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      icon: FileText
    },
    bendahara: {
      title: "Bendahara",
      subtitle: "Laporan Keuangan, Perubahan Anggaran, & Rekonsiliasi",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: Volume2
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scale-in">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest bg-red-600 text-white px-2 py-0.5 rounded">
                  Naskah Resmi
                </span>
                <span className="text-xs text-slate-300 font-mono">Bahan Pidato Sidang Pleno</span>
              </div>
              <h3 className="text-base font-extrabold text-white tracking-tight mt-0.5">
                Naskah Penyampaian LPJ Berbasis Peran
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-600 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin text-amber-400" : ""}`} />
              {isRegenerating ? "Menyusun..." : "Perbarui Naskah"}
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div className="bg-slate-100/80 border-b border-slate-200 px-4 pt-3 flex gap-2 overflow-x-auto shrink-0">
          {(["ketua", "sekretaris", "bendahara"] as const).map((role) => {
            const info = roleTitles[role];
            const isActive = activeRole === role;
            const Icon = info.icon;
            return (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer border-t border-x ${
                  isActive
                    ? "bg-white text-slate-900 border-slate-200 shadow-3xs"
                    : "bg-transparent text-slate-500 border-transparent hover:text-slate-700"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-red-600" : "text-slate-400"}`} />
                <div className="text-left">
                  <div className="leading-tight">{info.title}</div>
                  <div className="text-[9px] font-normal text-slate-400 hidden sm:block">
                    {role === "ketua" ? "Bab A & G" : role === "sekretaris" ? "Bab B & C" : "Bab D, E & F"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Role Meta Subheader */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${roleTitles[activeRole].badgeClass}`}>
              {roleTitles[activeRole].title}
            </span>
            <span className="text-slate-600 font-medium">{roleTitles[activeRole].subtitle}</span>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Salin Naskah</span>
              </>
            )}
          </button>
        </div>

        {/* Content Body with Markdown Rendering */}
        <div className="flex-1 overflow-y-auto p-6 font-sans text-slate-800 bg-white leading-relaxed">
          {currentContent ? (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="prose prose-sm max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h3:text-base prose-h4:text-sm prose-p:text-xs prose-p:leading-relaxed prose-li:text-xs">
                <Markdown>{currentContent}</Markdown>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <Sparkles className="w-10 h-10 mb-3 text-slate-300 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-700">Naskah Belum Digenerate</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                Klik tombol di bawah untuk membuat naskah pidato formal secara instan berdasarkan data real-time SEMS.
              </p>
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Generate Naskah Sekarang
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono shrink-0">
          Naskah pidato resmi dapat dicetak atau dibacakan langsung dari perangkat tablet/smartphone saat Sidang Pleno LPJ.
        </div>
      </div>
    </div>
  );
}
