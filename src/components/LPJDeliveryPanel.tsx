import React, { useState } from "react";
import { 
  LPJMaster, 
  LPJSection, 
  LPJRole, 
  LPJStatus, 
  Panitia, 
  KeuanganTransaction, 
  AuditTrailRecord,
  BudgetChange,
  BudgetReallocation
} from "../types";
import { 
  ShieldCheck, 
  UserCheck, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  Sparkles, 
  Send, 
  Lock, 
  ArrowRight, 
  CheckSquare, 
  Square,
  Award,
  History,
  FileCheck,
  Scale
} from "lucide-react";

interface LPJDeliveryPanelProps {
  lpj?: LPJMaster;
  panitia: Panitia[];
  keuangan: KeuanganTransaction[];
  budgetChanges: BudgetChange[];
  budgetReallocations: BudgetReallocation[];
  auditTrails: AuditTrailRecord[];
  onUpdateSection: (sectionId: string, updates: Partial<LPJSection>, actor?: string, reason?: string) => Promise<any>;
  onUpdateStatus: (status: LPJStatus, actor?: string, notes?: string, isReconciled?: boolean, reconciliationNotes?: string) => Promise<any>;
  onOpenSpeechModal: () => void;
  onOpenNotulenModal: () => void;
  onNavigateView?: (view: string) => void;
}

const ROLE_LABELS: Record<LPJRole, { title: string; color: string; badgeClass: string; desc: string }> = {
  KETUA_PANITIA: {
    title: "Ketua Panitia",
    color: "red",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
    desc: "Penegasan pertanggungjawaban umum, pembukaan, evaluasi, kesimpulan akhir, dan serah terima sisa saldo."
  },
  SEKRETARIS: {
    title: "Sekretaris",
    color: "blue",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    desc: "Laporan pelaksanaan seluruh kegiatan lapangan, kehadiran warga, administrasi perizinan, dan notulensi."
  },
  BENDAHARA: {
    title: "Bendahara",
    color: "emerald",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    desc: "Laporan keuangan kas riil, perubahan anggaran, realokasi pos belanja, rekonsiliasi kuitansi, dan sisa saldo."
  },
  RW: {
    title: "Pengurus RW 04",
    color: "purple",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    desc: "Tanggapan warga, evaluasi lingkungan, dan pengesahan resmi penerimaan LPJ Panitia."
  },
  LAINNYA: {
    title: "Seksi Terkait",
    color: "slate",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
    desc: "Pemateri pendamping dari seksi-seksi untuk klarifikasi detail teknis."
  }
};

const WORKFLOW_STEPS: { status: LPJStatus; label: string; desc: string }[] = [
  { status: "DRAFT", label: "Draf Awal", desc: "Penyusunan berkas & laporan masing-masing seksi" },
  { status: "DIPERIKSA", label: "Pemeriksaan Internal", desc: "Pengecekan nota & sinkronisasi administrasi" },
  { status: "SIAP_DISAMPAIKAN", label: "Siap Disampaikan", desc: "Rekonsiliasi kas tuntas & naskah siap" },
  { status: "DISAMPAIKAN", label: "Disampaikan ke Pleno", desc: "Pemaparan resmi di Balai RW 04" },
  { status: "DISETUJUI", label: "Disahkan & Diterima", desc: "Disahkan oleh Ketua RW & 3 Pimpinan Panitia" },
  { status: "DIARSIPKAN", label: "Diarsipkan", desc: "Terdokumentasi permanen di arsip RW" }
];

export default function LPJDeliveryPanel({
  lpj,
  panitia,
  keuangan,
  budgetChanges,
  budgetReallocations,
  auditTrails,
  onUpdateSection,
  onUpdateStatus,
  onOpenSpeechModal,
  onOpenNotulenModal,
  onNavigateView
}: LPJDeliveryPanelProps) {
  // Active editing modal state
  const [editingSection, setEditingSection] = useState<LPJSection | null>(null);
  const [editRole, setEditRole] = useState<LPJRole>("KETUA_PANITIA");
  const [editPresenterName, setEditPresenterName] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [editReason, setEditReason] = useState<string>("");
  const [isSavingSection, setIsSavingSection] = useState<boolean>(false);

  // Workflow transition confirmation state
  const [pendingStatusChange, setPendingStatusChange] = useState<LPJStatus | null>(null);
  const [statusActor, setStatusActor] = useState<string>("Ketua Panitia");
  const [statusNotes, setStatusNotes] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Check reconciliation status
  const totalMasuk = keuangan.filter(t => t.type === 'Masuk').reduce((s, t) => s + t.amount, 0);
  const totalKeluar = keuangan.filter(t => t.type === 'Keluar').reduce((s, t) => s + t.amount, 0);
  const saldoSisa = totalMasuk - totalKeluar;
  const unverifiedProofs = keuangan.filter(t => t.proofStatus === 'Belum Lengkap').length;

  const currentStatus: LPJStatus = lpj?.status || "DRAFT";
  const isReconciled = lpj?.isReconciled ?? (unverifiedProofs === 0 && totalKeluar > 0);

  // Checklist computation
  const checklistItems = [
    {
      id: "chk_adm",
      label: "Laporan Pelaksanaan & Administrasi Lengkap",
      desc: "Seluruh agenda selesai dan berkas surat tersimpan rapi oleh Sekretaris.",
      done: true,
      role: "Sekretaris"
    },
    {
      id: "chk_fin",
      label: "Rekonsiliasi Keuangan & Nota Lengkap",
      desc: `Total Belanja Rp ${totalKeluar.toLocaleString('id-ID')}. Kuitansi belum lengkap: ${unverifiedProofs} item.`,
      done: isReconciled,
      role: "Bendahara",
      critical: true
    },
    {
      id: "chk_budget_mgmt",
      label: "Tata Kelola Perubahan & Realokasi Anggaran",
      desc: `${budgetChanges.length} Perubahan Anggaran (PA) & ${budgetReallocations.length} Realokasi Pos (RA) tercatat.`,
      done: true,
      role: "Bendahara"
    },
    {
      id: "chk_conclusion",
      label: "Naskah Pidato & Kesimpulan Pertanggungjawaban",
      desc: `Penegasan serah terima sisa saldo kas (Rp ${saldoSisa.toLocaleString('id-ID')}) siap disampaikan.`,
      done: Boolean(lpj?.speechScripts?.ketua),
      role: "Ketua Panitia"
    },
    {
      id: "chk_minutes",
      label: "Notulen Rapat Pleno LPJ Resmi (11 Agenda Baku)",
      desc: lpj?.meetingMinutesId ? "Notulen rapat pleno sudah terbit." : "Belum digenerate.",
      done: Boolean(lpj?.meetingMinutesId),
      role: "Sekretaris"
    }
  ];

  const allChecklistPassed = checklistItems.every(c => c.done);

  // Handle open edit modal
  const handleOpenEditModal = (section: LPJSection) => {
    setEditingSection(section);
    setEditRole(section.presenterRole);
    setEditPresenterName(section.presenterNameSnapshot || "");
    setEditNotes(section.notes || "");
    setEditReason("");
  };

  // Save section presenter updates
  const handleSaveSectionPresenter = async () => {
    if (!editingSection) return;
    setIsSavingSection(true);
    try {
      await onUpdateSection(
        editingSection.id,
        {
          presenterRole: editRole,
          presenterNameSnapshot: editPresenterName,
          notes: editNotes,
          status: editingSection.status
        },
        editPresenterName || "Admin Panitia",
        editReason || "Penyesuaian susunan penyampai bab LPJ"
      );
      setEditingSection(null);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSavingSection(false);
    }
  };

  // Handle status update
  const handleExecuteStatusChange = async (newStatus: LPJStatus) => {
    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(
        newStatus,
        statusActor,
        statusNotes,
        isReconciled,
        `Rekonsiliasi kas: Saldo sisa Rp ${saldoSisa.toLocaleString('id-ID')}, ${unverifiedProofs === 0 ? 'Semua nota valid' : 'Terdapat nota dalam verifikasi'}`
      );
      setPendingStatusChange(null);
      setStatusNotes("");
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const sections = lpj?.sections || [];

  return (
    <div className="space-y-6">
      {/* 1. Core Principles Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-sm border border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-red-600 text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                Prinsip Resmi
              </span>
              <span className="text-xs text-slate-300 font-mono">Pertanggungjawaban Kolektif Panitia</span>
            </div>
            <h3 className="text-base font-extrabold tracking-tight mt-1.5 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Struktur & Tanggung Jawab Penyampaian LPJ
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              <strong>LPJ merupakan pertanggungjawaban PANITIA secara keseluruhan.</strong> Ketua Panitia bertanggung jawab menyampaikan/menegaskan pertanggungjawaban akhir, Sekretaris memaparkan administrasi & kegiatan lapangan, dan Bendahara memaparkan keuangan & rekonsiliasi kas.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenSpeechModal}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Naskah Pidato 3 Peran
            </button>
            <button
              onClick={onOpenNotulenModal}
              className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 border border-slate-600 shadow-sm transition cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-emerald-400" />
              Generate Notulen (11 Agenda)
            </button>
          </div>
        </div>
      </div>

      {/* 2. Workflow Pipeline Visualizer */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-3xs">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
              Status & Alur Kerja Dokumen LPJ
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-extrabold text-slate-800">
                Tahap Saat Ini: <span className="text-red-600 uppercase font-mono">{currentStatus.replace(/_/g, " ")}</span>
              </span>
            </div>
          </div>

          {currentStatus !== "DIARSIPKAN" && (
            <div className="flex items-center gap-2">
              {currentStatus === "DRAFT" && (
                <button
                  onClick={() => setPendingStatusChange("DIPERIKSA")}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-2xs"
                >
                  Ajukan Pemeriksaan
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              {currentStatus === "DIPERIKSA" && (
                <button
                  onClick={() => setPendingStatusChange("SIAP_DISAMPAIKAN")}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-2xs"
                >
                  Tandai Siap Disampaikan
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              {currentStatus === "SIAP_DISAMPAIKAN" && (
                <button
                  onClick={() => setPendingStatusChange("DISAMPAIKAN")}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-2xs"
                >
                  Mulai Rapat Pleno (Disampaikan)
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              {currentStatus === "DISAMPAIKAN" && (
                <button
                  onClick={() => setPendingStatusChange("DISETUJUI")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Sahkan & Terima LPJ
                </button>
              )}
              {currentStatus === "DISETUJUI" && (
                <button
                  onClick={() => setPendingStatusChange("DIARSIPKAN")}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-2xs"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Arsipkan Dokumen Permanen
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pipeline Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
          {WORKFLOW_STEPS.map((step, idx) => {
            const stepIdx = WORKFLOW_STEPS.findIndex(s => s.status === currentStatus);
            const isPassed = idx < stepIdx;
            const isCurrent = step.status === currentStatus;
            
            let cardClass = "bg-slate-50 border-slate-200 text-slate-400";
            if (isCurrent) cardClass = "bg-red-50/70 border-red-400 text-red-700 font-bold ring-2 ring-red-500/20";
            else if (isPassed) cardClass = "bg-emerald-50/60 border-emerald-300 text-emerald-800";

            return (
              <div 
                key={step.status}
                className={`p-3 rounded-lg border text-left transition-all ${cardClass}`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="font-bold">0{idx + 1}</span>
                  {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  {isCurrent && <Clock className="w-3.5 h-3.5 text-red-600 animate-pulse" />}
                </div>
                <div className="text-xs font-bold leading-tight">{step.label}</div>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Role Overview Cards (3 Pillars of LPJ Delivery) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ketua Panitia Pillar */}
        <div className="bg-white p-4 rounded-xl border border-red-200/80 shadow-3xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded uppercase">
                Pilar 1: Pimpinan
              </span>
              <span className="text-xs text-slate-400 font-mono">Bab A & G</span>
            </div>
            <h4 className="text-sm font-extrabold text-slate-800">Ketua Panitia</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Bertanggung jawab menyampaikan <strong>Laporan Pendahuluan</strong> dan menegaskan <strong>Kesimpulan & Pertanggungjawaban Akhir</strong> panitia secara resmi.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Pejabat:</span>
            <strong className="text-slate-800">{lpj?.ketuaNameSnapshot || "Ketua Panitia"}</strong>
          </div>
        </div>

        {/* Sekretaris Pillar */}
        <div className="bg-white p-4 rounded-xl border border-blue-200/80 shadow-3xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded uppercase">
                Pilar 2: Administrasi
              </span>
              <span className="text-xs text-slate-400 font-mono">Bab B & C</span>
            </div>
            <h4 className="text-sm font-extrabold text-slate-800">Sekretaris</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Menyampaikan <strong>Laporan Pelaksanaan Kegiatan</strong> seluruh seksi lapangan, daftar hadir, surat-menyurat, arsip dokumentasi, dan risalah notulen.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Pejabat:</span>
            <strong className="text-slate-800">{lpj?.sekretarisNameSnapshot || "Sekretaris Panitia"}</strong>
          </div>
        </div>

        {/* Bendahara Pillar */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-3xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                Pilar 3: Keuangan
              </span>
              <span className="text-xs text-slate-400 font-mono">Bab D, E & F</span>
            </div>
            <h4 className="text-sm font-extrabold text-slate-800">Bendahara</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Menyampaikan <strong>Laporan Keuangan Riil</strong>, pergeseran <strong>Perubahan & Realokasi Anggaran</strong>, serta bukti <strong>Rekonsiliasi Kas Seimbang</strong>.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Pejabat:</span>
            <strong className="text-slate-800">{lpj?.bendaharaNameSnapshot || "Bendahara Panitia"}</strong>
          </div>
        </div>
      </div>

      {/* 4. Table of 8 LPJ Sections & Assigned Presenters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-3xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Struktur 8 Bab LPJ & Pembagian Penyampai Resmi
            </h4>
            <p className="text-[11px] text-slate-500">
              Setiap bab memiliki penanggung jawab khusus untuk memastikan penyampaian berbobot dan transparan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded">
              Total 8 Bab
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-mono text-[10px] uppercase">
                <th className="py-2.5 px-3 w-12 text-center">Bab</th>
                <th className="py-2.5 px-4 font-bold">Judul Laporan Bagian LPJ</th>
                <th className="py-2.5 px-4 font-bold">Penyampai Resmi (Role)</th>
                <th className="py-2.5 px-4 font-bold">Nama Pejabat</th>
                <th className="py-2.5 px-4 font-bold">Status Kesiapan</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {sections.map((section) => {
                const roleMeta = ROLE_LABELS[section.presenterRole] || ROLE_LABELS.KETUA_PANITIA;
                return (
                  <tr key={section.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-center font-mono font-bold text-red-600">
                      {section.sectionCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{section.sectionTitle}</div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{section.notes}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleMeta.badgeClass}`}>
                        {roleMeta.title}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {section.presenterNameSnapshot || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        section.status === "SIAP" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {section.status === "SIAP" ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-500" />}
                        {section.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleOpenEditModal(section)}
                        className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded text-[11px] border border-slate-200 cursor-pointer transition shadow-2xs"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500" />
                        Ubah
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Pre-Approval Checklist Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-3xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Checklist Validasi Pra-Pengesahan LPJ
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Seluruh parameter wajib diverifikasi hijau sebelum LPJ dapat disahkan oleh Ketua RW 04 Ngabean.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold font-mono px-2.5 py-1 rounded-full border ${
              allChecklistPassed 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {allChecklistPassed ? "✔ Siap Disahkan" : "⚠ Menunggu Kelengkapan"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {checklistItems.map((item) => (
            <div 
              key={item.id}
              className={`p-3 rounded-lg border flex items-start justify-between gap-3 ${
                item.done 
                  ? "bg-emerald-50/40 border-emerald-200/80" 
                  : "bg-amber-50/40 border-amber-200/80"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{item.label}</div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{item.desc}</p>
                </div>
              </div>

              <span className="text-[9px] font-mono font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
                PIC: {item.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Edit Section Presenter Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                  Bab {editingSection.sectionCode}
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                  Ubah Penyampai: {editingSection.sectionTitle}
                </h3>
              </div>
              <button
                onClick={() => setEditingSection(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Peran Penanggung Jawab (Role)
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as LPJRole)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                >
                  <option value="KETUA_PANITIA">Ketua Panitia</option>
                  <option value="SEKRETARIS">Sekretaris</option>
                  <option value="BENDAHARA">Bendahara</option>
                  <option value="RW">Pengurus RW 04</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {ROLE_LABELS[editRole]?.desc}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Nama Pejabat / Penyampai
                </label>
                <input
                  type="text"
                  value={editPresenterName}
                  onChange={(e) => setEditPresenterName(e.target.value)}
                  placeholder="Contoh: Bpk. Bambang Sutrisno"
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Catatan / Pokok Pembahasan
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Alasan Perubahan (Audit Trail)
                </label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Contoh: Kesepakatan rapat pleno pembagian tugas"
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSavingSection}
                onClick={handleSaveSectionPresenter}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSavingSection ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Simpan & Catat Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Status Change Confirmation Modal */}
      {pendingStatusChange && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Konfirmasi Perubahan Status LPJ
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Anda akan memindahkan status LPJ Panitia dari <strong>{currentStatus}</strong> menjadi <strong className="text-red-700">{pendingStatusChange}</strong>.
            </p>

            {pendingStatusChange === "DISETUJUI" && !isReconciled && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Peringatan Rekonsiliasi:</strong> Rekonsiliasi keuangan belum ditandai seimbang atau masih ada kuitansi yang belum diverifikasi. Sistem merekomendasikan menyelesaikan verifikasi nota belanja terlebih dahulu.
                </div>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Nama Petugas Pengubah (Aktor)
                </label>
                <input
                  type="text"
                  value={statusActor}
                  onChange={(e) => setStatusActor(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Catatan / Keterangan Status
                </label>
                <textarea
                  rows={2}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Contoh: LPJ disahkan dalam Sidang Pleno Balai RW 04..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPendingStatusChange(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleExecuteStatusChange(pendingStatusChange)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isUpdatingStatus ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Konfirmasi Ubah Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
