import React, { useState } from "react";
import { LPJMaster } from "../types";
import { 
  FileCheck, 
  Calendar, 
  MapPin, 
  User, 
  X, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  FileText,
  ListOrdered
} from "lucide-react";

interface LPJNotulenModalProps {
  isOpen: boolean;
  onClose: () => void;
  lpj?: LPJMaster;
  onGenerateNotulen: (payload: any) => Promise<any>;
  onNavigateView?: (view: string) => void;
}

const DEFAULT_11_AGENDAS = [
  "1. Pembukaan oleh Pimpinan Sidang",
  "2. Penyampaian laporan pelaksanaan oleh Sekretaris",
  "3. Penyampaian laporan administrasi oleh Sekretaris",
  "4. Penyampaian laporan keuangan oleh Bendahara",
  "5. Penyampaian perubahan anggaran oleh Bendahara",
  "6. Penyampaian rekonsiliasi keuangan oleh Bendahara",
  "7. Penyampaian kesimpulan oleh Ketua Panitia",
  "8. Tanya jawab dan tanggapan peserta musyawarah",
  "9. Klarifikasi dan penegasan pertanggungjawaban",
  "10. Pengesahan LPJ oleh Pengurus RW dan Ketua Panitia",
  "11. Penutup dan doa bersama"
];

export default function LPJNotulenModal({
  isOpen,
  onClose,
  lpj,
  onGenerateNotulen,
  onNavigateView
}: LPJNotulenModalProps) {
  const [meetingDate, setMeetingDate] = useState<string>("Minggu, 23 Agustus 2026");
  const [meetingLocation, setMeetingLocation] = useState<string>("Balai RW 04 Ngabean");
  const [meetingLeader, setMeetingLeader] = useState<string>(lpj?.ketuaNameSnapshot || "Ketua Panitia");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedSuccess, setGeneratedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerateNotulen({
        date: meetingDate,
        location: meetingLocation,
        leader: meetingLeader,
        actor: "Sekretaris Panitia"
      });
      setGeneratedSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                Standar Baku Organisasi
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                Generate Notulen Rapat LPJ (11 Agenda Baku)
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1"
          >
            ✕
          </button>
        </div>

        {generatedSuccess ? (
          <div className="space-y-4 py-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">Notulensi Rapat LPJ Berhasil Diterbitkan!</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Risalah resmi 11 agenda telah tersimpan ke dalam database dan terhubung dengan modul Notulensi & LPJ.
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={onClose}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition"
              >
                Tutup
              </button>
              {onNavigateView && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateView("notulensi");
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                >
                  <FileText className="w-4 h-4" />
                  Buka Menu Notulensi
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Sistem akan memformulasikan Berita Acara & Notulensi resmi Sidang Pleno LPJ secara otomatis dengan memetakan 11 agenda baku pertanggungjawaban:
            </p>

            {/* 11 Agenda Preview */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 max-h-48 overflow-y-auto space-y-1.5 font-mono text-[11px] text-slate-700">
              {DEFAULT_11_AGENDAS.map((agenda, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                  <span>{agenda}</span>
                </div>
              ))}
            </div>

            {/* Meeting metadata inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Hari / Tanggal Rapat
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg pl-8 p-2 text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Tempat Sidang
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={meetingLocation}
                    onChange={(e) => setMeetingLocation(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg pl-8 p-2 text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Pimpinan Sidang Pleno
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={meetingLeader}
                    onChange={(e) => setMeetingLeader(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg pl-8 p-2 text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
                {isGenerating ? "Menerbitkan..." : "Generate Notulen LPJ"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
