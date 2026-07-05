import React, { useState } from "react";
import { 
  Settings, 
  Save, 
  CheckCircle2
} from "lucide-react";
import { SystemSetting } from "../types";

interface SettingViewProps {
  settings: SystemSetting;
  onSaveSettings: (settings: SystemSetting) => Promise<void>;
}

export default function SettingView({ settings, onSaveSettings }: SettingViewProps) {
  const [rtListStr, setRtListStr] = useState(settings.rtList.join(", "));
  const [seksiListStr, setSeksiListStr] = useState(settings.seksiList.join(", "));
  const [targetIuran, setTargetIuran] = useState(settings.targetIuranPerRT);
  const [paguBudgets, setPaguBudgets] = useState<Record<string, number>>({ ...settings.paguAnggaranSeksi });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Parse comma list back to array
  const parseCommaList = (str: string): string[] => {
    return str.split(",").map(item => item.trim()).filter(item => item.length > 0);
  };

  const handlePaguChange = (seksi: string, value: number) => {
    setPaguBudgets(prev => ({
      ...prev,
      [seksi]: value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const updatedSeksiList = parseCommaList(seksiListStr);
    
    // Ensure every seksi in list has a pagu entry
    const finalPagu: Record<string, number> = {};
    updatedSeksiList.forEach(seksi => {
      finalPagu[seksi] = paguBudgets[seksi] || 1000000; // default 1jt if empty
    });

    const updatedSettings: SystemSetting = {
      ...settings,
      rtList: parseCommaList(rtListStr),
      seksiList: updatedSeksiList,
      targetIuranPerRT: Number(targetIuran),
      paguAnggaranSeksi: finalPagu
    };

    try {
      await onSaveSettings(updatedSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      {/* Title with Settings context */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
            <Settings className="w-4 h-4 text-red-600" />
            Konfigurasi Sistem SEMS
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Atur parameter operasional panitia RW 04 Ngabean Semarang.
          </p>
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={handleSave} className="space-y-5">
          
          {/* Form Fields: General Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-3.5">
              <h3 className="text-[11px] font-extrabold text-slate-700 pb-1 border-b border-slate-200 uppercase tracking-wider">Struktur Wilayah & Seksi</h3>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Daftar Rukun Tetangga (RT)</label>
                <input
                  type="text"
                  value={rtListStr}
                  onChange={(e) => setRtListStr(e.target.value)}
                  placeholder="Pisahkan dengan koma, misal: RT 01, RT 02"
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50/50"
                  required
                />
                <span className="text-[9px] text-slate-400 mt-0.5 block">Daftar RT aktif yang berada di wilayah RW 04 Ngabean.</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Daftar Seksi Kepanitiaan</label>
                <input
                  type="text"
                  value={seksiListStr}
                  onChange={(e) => setSeksiListStr(e.target.value)}
                  placeholder="Pisahkan dengan koma, misal: Acara, Konsumsi"
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50/50"
                  required
                />
                <span className="text-[9px] text-slate-400 mt-0.5 block">Seksi kepanitiaan yang mengusulkan barang & anggaran (RKBA).</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Iuran Pokok per RT (Rp)</label>
                <input
                  type="number"
                  value={targetIuran}
                  onChange={(e) => setTargetIuran(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50/50"
                  required
                />
                <span className="text-[9px] text-slate-400 mt-0.5 block">Target iuran kas tunai yang wajib disetor oleh bendahara RT ke panitia RW.</span>
              </div>
            </div>

            <div className="space-y-3.5">
              <h3 className="text-[11px] font-extrabold text-slate-700 pb-1 border-b border-slate-200 uppercase tracking-wider">Batas Anggaran (Pagu) per Seksi</h3>
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2.5 max-h-64 overflow-y-auto">
                {parseCommaList(seksiListStr).map((seksi) => (
                  <div key={seksi} className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-bold text-slate-700 shrink-0">{seksi}</span>
                    <div className="flex items-center gap-2 max-w-xs w-36">
                      <span className="text-[10px] font-bold text-slate-400 font-mono">Rp</span>
                      <input
                        type="number"
                        value={paguBudgets[seksi] ?? 1000000}
                        onChange={(e) => handlePaguChange(seksi, Number(e.target.value))}
                        className="w-full text-xs text-right border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1 bg-white font-mono"
                      />
                    </div>
                  </div>
                ))}
                {parseCommaList(seksiListStr).length === 0 && (
                  <div className="text-center py-4 text-xs text-slate-400">
                    Tulis daftar seksi terlebih dahulu untuk mengatur pagu anggaran.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error/Success Prompt and Submit Button */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-bold uppercase tracking-wide animate-bounce">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Konfigurasi SEMS Berhasil Disimpan!</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              id="btn-save-settings"
              disabled={isSaving}
              className="flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold px-3.5 py-2 rounded shadow-xs transition-all duration-200 disabled:opacity-50 uppercase tracking-wide"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? "Menyimpan..." : "Simpan Konfigurasi"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
