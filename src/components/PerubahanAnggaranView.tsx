import React, { useState, useMemo } from "react";
import { 
  FileDiff, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  ShieldCheck, 
  ArrowRight, 
  Calendar, 
  User, 
  Eye, 
  Edit, 
  Trash2, 
  Info,
  Download,
  Printer,
  ChevronRight,
  Sparkles,
  Send,
  X
} from "lucide-react";
import { 
  BudgetChange, 
  RKBAItem, 
  Notulensi, 
  SystemSetting, 
  ChangeType, 
  ApprovalStatus 
} from "../types";
import { exportToPDF } from "../utils/pdfExport";
import { exportToWord } from "../utils/wordExport";

interface PerubahanAnggaranViewProps {
  budgetChanges: BudgetChange[];
  rkba: RKBAItem[];
  notulensi: Notulensi[];
  settings: SystemSetting;
  onSaveBudgetChange: (action: 'add' | 'edit' | 'submit' | 'approve' | 'reject' | 'cancel', data: BudgetChange, actor?: string) => Promise<void>;
  onNavigateView?: (viewName: string, params?: any) => void;
}

export default function PerubahanAnggaranView({
  budgetChanges = [],
  rkba = [],
  notulensi = [],
  settings,
  onSaveBudgetChange,
  onNavigateView
}: PerubahanAnggaranViewProps) {
  // Safety checks
  const safeSeksiList = settings?.seksiList || [
    "Ketua / Sekretariat",
    "Bendahara",
    "Acara",
    "Lomba",
    "Perlengkapan",
    "Konsumsi",
    "Humas",
    "Keamanan",
    "Dokumentasi & Publikasi"
  ];

  // Filter States
  const [filterType, setFilterType] = useState<string>("Semua");
  const [filterStatus, setFilterStatus] = useState<string>("Semua");
  const [filterSeksi, setFilterSeksi] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal States
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<BudgetChange | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<BudgetChange | null>(null);
  const [showNotulensiModal, setShowNotulensiModal] = useState<Notulensi | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<BudgetChange | null>(null);
  const [rejectNotes, setRejectNotes] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<{
    id?: string;
    changeNumber: string;
    date: string;
    activityMode: 'existing' | 'new';
    activityId: string;
    activityCode: string;
    activityName: string;
    seksi: string;
    changeType: ChangeType;
    initialAmount: number;
    changeAmount: number;
    revisedAmount: number;
    reason: string;
    decisionBasis: string;
    meetingMinutesId: string;
    meetingMinutesNumber: string;
    proposedBy: string;
    notes: string;
  }>({
    changeNumber: "",
    date: new Date().toISOString().split('T')[0],
    activityMode: 'existing',
    activityId: "",
    activityCode: "",
    activityName: "",
    seksi: safeSeksiList[0],
    changeType: "PERUBAHAN NILAI",
    initialAmount: 0,
    changeAmount: 0,
    revisedAmount: 0,
    reason: "",
    decisionBasis: "",
    meetingMinutesId: "",
    meetingMinutesNumber: "",
    proposedBy: "Seksi Terkait",
    notes: ""
  });

  const formatRp = (num: number) => {
    const isNegative = num < 0;
    const absVal = Math.abs(num || 0);
    return (isNegative ? "-Rp " : "Rp ") + absVal.toLocaleString("id-ID");
  };

  // Metrics Calculations (Approved changes only affect revised totals)
  const metrics = useMemo(() => {
    const approved = budgetChanges.filter(b => b.status === 'DISETUJUI');
    const pending = budgetChanges.filter(b => b.status === 'DIAJUKAN' || b.status === 'DRAFT');
    const rejected = budgetChanges.filter(b => b.status === 'DITOLAK');

    const netApprovedDelta = approved.reduce((sum, b) => sum + (b.changeAmount || 0), 0);
    const addedApprovedTotal = approved.filter(b => b.changeType === 'DITAMBAHKAN').reduce((sum, b) => sum + b.revisedAmount, 0);
    const removedApprovedTotal = approved.filter(b => b.changeType === 'DITIADAKAN').reduce((sum, b) => sum + Math.abs(b.changeAmount), 0);
    
    const countAdded = approved.filter(b => b.changeType === 'DITAMBAHKAN').length;
    const countRemoved = approved.filter(b => b.changeType === 'DITIADAKAN').length;
    const countModified = approved.filter(b => b.changeType === 'PERUBAHAN NILAI' || b.changeType === 'DIGABUNGKAN').length;

    return {
      totalChanges: budgetChanges.length,
      approvedCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      netApprovedDelta,
      addedApprovedTotal,
      removedApprovedTotal,
      countAdded,
      countRemoved,
      countModified
    };
  }, [budgetChanges]);

  // Filtered List
  const filteredChanges = useMemo(() => {
    return budgetChanges.filter(item => {
      const matchType = filterType === "Semua" || item.changeType === filterType;
      const matchStatus = filterStatus === "Semua" || item.status === filterStatus;
      const matchSeksi = filterSeksi === "Semua" || item.seksi === filterSeksi;
      const matchSearch = searchQuery.trim() === "" ||
        item.changeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.activityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.activityCode && item.activityCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.meetingMinutesNumber && item.meetingMinutesNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.seksi.toLowerCase().includes(searchQuery.toLowerCase());

      return matchType && matchStatus && matchSeksi && matchSearch;
    });
  }, [budgetChanges, filterType, filterStatus, filterSeksi, searchQuery]);

  // Open Add Modal
  const handleOpenAdd = (initialActivityId?: string) => {
    const nextNum = `PA-2026-${String(budgetChanges.length + 1).padStart(3, '0')}`;
    
    let selectedRkba: RKBAItem | undefined;
    if (initialActivityId) {
      selectedRkba = rkba.find(r => r.id === initialActivityId);
    }

    if (selectedRkba) {
      setFormData({
        changeNumber: nextNum,
        date: new Date().toISOString().split('T')[0],
        activityMode: 'existing',
        activityId: selectedRkba.id,
        activityCode: selectedRkba.activityCode || "ACT-000",
        activityName: selectedRkba.name,
        seksi: selectedRkba.seksi,
        changeType: "PERUBAHAN NILAI",
        initialAmount: selectedRkba.total,
        changeAmount: 0,
        revisedAmount: selectedRkba.total,
        reason: "",
        decisionBasis: "",
        meetingMinutesId: "",
        meetingMinutesNumber: "",
        proposedBy: selectedRkba.seksi || "Seksi Terkait",
        notes: ""
      });
    } else {
      const firstRkba = rkba[0];
      setFormData({
        changeNumber: nextNum,
        date: new Date().toISOString().split('T')[0],
        activityMode: 'existing',
        activityId: firstRkba?.id || "",
        activityCode: firstRkba?.activityCode || "ACT-001",
        activityName: firstRkba?.name || "",
        seksi: firstRkba?.seksi || safeSeksiList[0],
        changeType: "PERUBAHAN NILAI",
        initialAmount: firstRkba?.total || 0,
        changeAmount: 0,
        revisedAmount: firstRkba?.total || 0,
        reason: "",
        decisionBasis: "",
        meetingMinutesId: "",
        meetingMinutesNumber: "",
        proposedBy: firstRkba?.seksi || "Seksi Terkait",
        notes: ""
      });
    }

    setEditingItem(null);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: BudgetChange) => {
    if (item.status === 'DISETUJUI') {
      alert("Perubahan anggaran yang sudah disetujui tidak dapat diedit langsung demi menjaga integritas data.");
      return;
    }

    setEditingItem(item);
    setFormData({
      id: item.id,
      changeNumber: item.changeNumber,
      date: item.date,
      activityMode: item.changeType === 'DITAMBAHKAN' && !rkba.some(r => r.id === item.activityId) ? 'new' : 'existing',
      activityId: item.activityId,
      activityCode: item.activityCode || "",
      activityName: item.activityName,
      seksi: item.seksi,
      changeType: item.changeType,
      initialAmount: item.initialAmount,
      changeAmount: item.changeAmount,
      revisedAmount: item.revisedAmount,
      reason: item.reason,
      decisionBasis: item.decisionBasis || "",
      meetingMinutesId: item.meetingMinutesId || "",
      meetingMinutesNumber: item.meetingMinutesNumber || "",
      proposedBy: item.proposedBy,
      notes: item.notes || ""
    });
    setShowModal(true);
  };

  // Handle Target Activity Selection
  const handleSelectActivity = (rkbaId: string) => {
    const selected = rkba.find(r => r.id === rkbaId);
    if (!selected) return;

    const initial = selected.total;
    let change = formData.changeAmount;
    let revised = initial + change;

    if (formData.changeType === 'DITIADAKAN') {
      change = -initial;
      revised = 0;
    } else if (formData.changeType === 'DITAMBAHKAN') {
      change = formData.revisedAmount;
      revised = formData.revisedAmount;
    }

    setFormData(prev => ({
      ...prev,
      activityId: selected.id,
      activityCode: selected.activityCode || "ACT-000",
      activityName: selected.name,
      seksi: selected.seksi,
      initialAmount: initial,
      changeAmount: change,
      revisedAmount: revised,
      proposedBy: selected.seksi
    }));
  };

  // Handle Change Type Switch
  const handleChangeType = (type: ChangeType) => {
    let initial = formData.initialAmount;
    let change = formData.changeAmount;
    let revised = formData.revisedAmount;

    if (type === 'DITAMBAHKAN') {
      initial = 0;
      change = revised > 0 ? revised : 500000;
      revised = change;
    } else if (type === 'DITIADAKAN') {
      const activeRkba = rkba.find(r => r.id === formData.activityId);
      initial = activeRkba ? activeRkba.total : formData.initialAmount;
      change = -initial;
      revised = 0;
    } else if (type === 'PERUBAHAN NILAI' || type === 'DIGABUNGKAN') {
      const activeRkba = rkba.find(r => r.id === formData.activityId);
      initial = activeRkba ? activeRkba.total : formData.initialAmount;
      revised = initial;
      change = 0;
    }

    setFormData(prev => ({
      ...prev,
      changeType: type,
      initialAmount: initial,
      changeAmount: change,
      revisedAmount: revised
    }));
  };

  // Handle Meeting Selection
  const handleSelectMeeting = (meetingId: string) => {
    if (!meetingId) {
      setFormData(prev => ({
        ...prev,
        meetingMinutesId: "",
        meetingMinutesNumber: "",
        decisionBasis: ""
      }));
      return;
    }
    const meeting = notulensi.find(n => n.id === meetingId);
    if (meeting) {
      setFormData(prev => ({
        ...prev,
        meetingMinutesId: meeting.id,
        meetingMinutesNumber: meeting.title,
        decisionBasis: meeting.decisions || `Keputusan rapat tanggal ${meeting.date}`
      }));
    }
  };

  // Save Form Handler
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reason.trim()) {
      alert("Alasan perubahan anggaran wajib diisi secara rinci.");
      return;
    }

    if (formData.changeType === 'DITAMBAHKAN' && !formData.activityName.trim()) {
      alert("Nama kegiatan baru wajib diisi.");
      return;
    }

    setIsProcessing(true);
    try {
      const payload: BudgetChange = {
        id: editingItem ? editingItem.id : "",
        changeNumber: formData.changeNumber,
        date: formData.date,
        activityId: formData.activityId || (editingItem?.activityId || 'act_' + Date.now()),
        activityCode: formData.activityCode || `ACT-${String(rkba.length + 1).padStart(3, '0')}`,
        activityName: formData.activityName,
        seksi: formData.seksi,
        changeType: formData.changeType,
        initialAmount: formData.initialAmount,
        changeAmount: formData.changeAmount,
        revisedAmount: formData.revisedAmount,
        reason: formData.reason,
        decisionBasis: formData.decisionBasis,
        meetingMinutesId: formData.meetingMinutesId || undefined,
        meetingMinutesNumber: formData.meetingMinutesNumber || undefined,
        proposedBy: formData.proposedBy,
        status: editingItem ? editingItem.status : 'DRAFT',
        notes: formData.notes,
        createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const action = editingItem ? 'edit' : 'add';
      await onSaveBudgetChange(action, payload, formData.proposedBy);
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan perubahan anggaran.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Workflow Handlers
  const handleWorkflowSubmit = async (item: BudgetChange) => {
    if (confirm(`Ajukan perubahan anggaran ${item.changeNumber} (${item.activityName}) untuk mendapatkan persetujuan Ketua Panitia / Bendahara?`)) {
      setIsProcessing(true);
      await onSaveBudgetChange('submit', item, 'Seksi ' + item.seksi);
      setIsProcessing(false);
    }
  };

  const handleWorkflowApprove = async (item: BudgetChange) => {
    if (confirm(`SETUJUI perubahan anggaran ${item.changeNumber}?\n\nItem: ${item.activityName}\nPerubahan: ${formatRp(item.changeAmount)}\nRAB Revisi: ${formatRp(item.revisedAmount)}\n\nSetelah disetujui, perubahan ini akan resmi mempengaruhi RAB Revisi dan LPJ.`)) {
      setIsProcessing(true);
      await onSaveBudgetChange('approve', item, 'Ketua Panitia');
      setIsProcessing(false);
    }
  };

  const handleOpenReject = (item: BudgetChange) => {
    setShowRejectModal(item);
    setRejectNotes("");
  };

  const handleConfirmReject = async () => {
    if (!showRejectModal) return;
    setIsProcessing(true);
    await onSaveBudgetChange('reject', { ...showRejectModal, notes: rejectNotes }, 'Ketua Panitia');
    setIsProcessing(false);
    setShowRejectModal(null);
  };

  const handleWorkflowCancel = async (item: BudgetChange) => {
    if (confirm(`Batalkan draf usulan perubahan anggaran ${item.changeNumber}?`)) {
      setIsProcessing(true);
      await onSaveBudgetChange('cancel', item, 'Admin');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header with Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Tata Kelola Anggaran & Perubahan</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
            <FileDiff className="w-5 h-5 text-sky-600" />
            Perubahan Anggaran (Budget Changes)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mekanisme resmi revisi pagu, penambahan mata kegiatan, peniadaan, dan penyesuaian harga satuan berlandaskan Notulen Rapat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportToPDF("printable-budget-changes", `Perubahan-Anggaran-RW04-${new Date().toISOString().split('T')[0]}.pdf`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-300 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            Ekspor PDF
          </button>
          
          <button
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Ajukan Perubahan Anggaran
          </button>
        </div>
      </div>

      {/* 2. Executive Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Netto Delta */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className={`p-2.5 rounded-lg ${metrics.netApprovedDelta >= 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
            {metrics.netApprovedDelta >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Perubahan Bersih Disetujui
            </span>
            <span className={`text-base font-mono font-black ${metrics.netApprovedDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatRp(metrics.netApprovedDelta)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {metrics.approvedCount} transaksi disahkan
            </span>
          </div>
        </div>

        {/* Kegiatan Ditambahkan */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 bg-sky-50 text-sky-600 border border-sky-100 rounded-lg">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Kegiatan Ditambahkan
            </span>
            <span className="text-base font-mono font-black text-slate-900">
              +{formatRp(metrics.addedApprovedTotal)}
            </span>
            <span className="text-[10px] text-sky-600 font-semibold block mt-0.5">
              {metrics.countAdded} kegiatan baru
            </span>
          </div>
        </div>

        {/* Kegiatan Ditiadakan */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Kegiatan Ditiadakan
            </span>
            <span className="text-base font-mono font-black text-slate-900">
              -{formatRp(metrics.removedApprovedTotal)}
            </span>
            <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">
              {metrics.countRemoved} pos anggaran dibatalkan
            </span>
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Menunggu Persetujuan
            </span>
            <span className="text-base font-mono font-black text-amber-700">
              {metrics.pendingCount} Draf / Usulan
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Belum mempengaruhi RAB revisi
            </span>
          </div>
        </div>
      </div>

      {/* 3. Governance Banner & Rule Reminder */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-white flex items-center gap-2">
              Prinsip Auditabilitas: RAB Revisi Terikat Pengesahan Resmi
              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Rule #11 Workflow
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed max-w-4xl">
              Seluruh usulan penambahan, peniadaan, dan revisi nilai <strong className="text-white">tidak akan mempengaruhi kalkulasi RAB Revisi, Realisasi, maupun LPJ</strong> sebelum statusnya berubah menjadi <span className="text-emerald-400 font-bold">DISETUJUI</span> oleh Ketua Panitia/Bendahara dengan dasar Notulen Rapat yang sah.
            </p>
          </div>
        </div>
        
        {onNavigateView && (
          <button
            onClick={() => onNavigateView('notulensi')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer self-end md:self-auto"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            Buka Notulensi Rapat
          </button>
        )}
      </div>

      {/* 4. Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-xs font-bold text-slate-600 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Saring Data:</span>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no. perubahan, nama kegiatan, kode, notulen..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Filter Jenis Perubahan */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">Jenis:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="Semua">Semua Jenis</option>
            <option value="DITAMBAHKAN">DITAMBAHKAN</option>
            <option value="DITIADAKAN">DITIADAKAN</option>
            <option value="PERUBAHAN NILAI">PERUBAHAN NILAI</option>
            <option value="DIGABUNGKAN">DIGABUNGKAN</option>
          </select>
        </div>

        {/* Filter Status */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="Semua">Semua Status</option>
            <option value="DRAFT">DRAFT</option>
            <option value="DIAJUKAN">DIAJUKAN</option>
            <option value="DISETUJUI">DISETUJUI (HIJAU)</option>
            <option value="DITOLAK">DITOLAK (MERAH)</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        {/* Filter Seksi */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">Seksi:</span>
          <select
            value={filterSeksi}
            onChange={(e) => setFilterSeksi(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="Semua">Semua Seksi</option>
            {safeSeksiList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Reset Filter */}
        {(filterType !== "Semua" || filterStatus !== "Semua" || filterSeksi !== "Semua" || searchQuery.trim() !== "") && (
          <button
            onClick={() => {
              setFilterType("Semua");
              setFilterStatus("Semua");
              setFilterSeksi("Semua");
              setSearchQuery("");
            }}
            className="text-xs text-rose-600 hover:text-rose-800 font-bold ml-auto cursor-pointer"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* 5. Master Data Table */}
      <div id="printable-budget-changes" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Daftar Riwayat Perubahan Anggaran (Log Mutasi)
            </h3>
            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[10px] font-bold">
              {filteredChanges.length} Data
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            HUT RI Ke-81 RW 04 Ngabean
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/75 text-slate-800 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                <th className="px-3.5 py-3 text-left">No. Ref & Tgl</th>
                <th className="px-4 py-3 text-left">Kegiatan / Pos Anggaran</th>
                <th className="px-3.5 py-3 text-left">Jenis</th>
                <th className="px-3.5 py-3 text-right">RAB Awal</th>
                <th className="px-3.5 py-3 text-right">Perubahan (Δ)</th>
                <th className="px-3.5 py-3 text-right">RAB Revisi</th>
                <th className="px-3.5 py-3 text-left">Dasar Notulen</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center print:hidden">Aksi & Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredChanges.map((item, idx) => {
                const isApproved = item.status === 'DISETUJUI';
                const isDraft = item.status === 'DRAFT';
                const isSubmitted = item.status === 'DIAJUKAN';
                const isRejected = item.status === 'DITOLAK';

                const matchedMeeting = notulensi.find(n => n.id === item.meetingMinutesId);

                return (
                  <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                    {/* No. Ref & Tanggal */}
                    <td className="px-3.5 py-3 border-r border-slate-100 font-mono text-[11px] whitespace-nowrap">
                      <div className="font-bold text-slate-900">{item.changeNumber}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{item.date}</span>
                      </div>
                    </td>

                    {/* Kegiatan / Pos Anggaran */}
                    <td className="px-4 py-3 border-r border-slate-100">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {item.activityCode && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold border border-slate-200">
                            {item.activityCode}
                          </span>
                        )}
                        <span>{item.activityName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-slate-600">Seksi {item.seksi}</span>
                        <span>•</span>
                        <span className="italic text-slate-400 line-clamp-1 max-w-[200px]" title={item.reason}>
                          "{item.reason}"
                        </span>
                      </div>
                    </td>

                    {/* Jenis Perubahan Badge */}
                    <td className="px-3.5 py-3 border-r border-slate-100 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                        item.changeType === 'DITAMBAHKAN' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                        item.changeType === 'DITIADAKAN' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        item.changeType === 'PERUBAHAN NILAI' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {item.changeType}
                      </span>
                    </td>

                    {/* RAB Awal */}
                    <td className="px-3.5 py-3 border-r border-slate-100 text-right font-mono text-slate-600 whitespace-nowrap">
                      {formatRp(item.initialAmount)}
                    </td>

                    {/* Nilai Perubahan (Delta) */}
                    <td className={`px-3.5 py-3 border-r border-slate-100 text-right font-mono font-bold whitespace-nowrap ${
                      item.changeAmount > 0 ? 'text-emerald-700' : item.changeAmount < 0 ? 'text-rose-700' : 'text-slate-600'
                    }`}>
                      {item.changeAmount > 0 ? `+${formatRp(item.changeAmount)}` : formatRp(item.changeAmount)}
                    </td>

                    {/* RAB Revisi */}
                    <td className="px-3.5 py-3 border-r border-slate-100 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                      {formatRp(item.revisedAmount)}
                    </td>

                    {/* Dasar Notulen Rapat */}
                    <td className="px-3.5 py-3 border-r border-slate-100 text-[11px]">
                      {item.meetingMinutesId || item.meetingMinutesNumber ? (
                        <button
                          onClick={() => {
                            if (matchedMeeting) {
                              setShowNotulensiModal(matchedMeeting);
                            } else {
                              alert(`Dasar Keputusan Rapat: ${item.meetingMinutesNumber || 'Tercatat dalam risalah'}\n\n${item.decisionBasis || item.reason}`);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold transition-colors cursor-pointer text-left"
                          title="Klik untuk membuka risalah notulen"
                        >
                          <FileText className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate max-w-[130px]">{item.meetingMinutesNumber || 'Notulen Rapat'}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">- Tanpa Ref -</span>
                      )}
                    </td>

                    {/* Status Approval Badge */}
                    <td className="px-3.5 py-3 border-r border-slate-100 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 ${
                        isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        isSubmitted ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        isDraft ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                        'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {isApproved && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        {isSubmitted && <Clock className="w-3 h-3 text-amber-600" />}
                        {isDraft && <Edit className="w-3 h-3 text-slate-500" />}
                        {isRejected && <XCircle className="w-3 h-3 text-rose-600" />}
                        <span>{item.status}</span>
                      </span>
                    </td>

                    {/* Aksi & Workflow */}
                    <td className="px-4 py-3 text-center print:hidden whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Detail Button */}
                        <button
                          onClick={() => setShowDetailModal(item)}
                          title="Lihat Detail & Audit"
                          className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* DRAFT: Ajukan, Edit, Batalkan */}
                        {isDraft && (
                          <>
                            <button
                              onClick={() => handleWorkflowSubmit(item)}
                              title="Ajukan Persetujuan"
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Send className="w-3 h-3" />
                              <span>Ajukan</span>
                            </button>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              title="Edit Draf"
                              className="p-1.5 text-sky-600 hover:text-sky-800 bg-sky-50 rounded transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleWorkflowCancel(item)}
                              title="Batalkan"
                              className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {/* DIAJUKAN: Setujui, Tolak, Batalkan */}
                        {isSubmitted && (
                          <>
                            <button
                              onClick={() => handleWorkflowApprove(item)}
                              title="Setujui Perubahan Anggaran"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Setujui</span>
                            </button>
                            <button
                              onClick={() => handleOpenReject(item)}
                              title="Tolak Usulan"
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Tolak</span>
                            </button>
                          </>
                        )}

                        {/* DISETUJUI / DITOLAK: Info status */}
                        {isApproved && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                            Disahkan ({item.approvedBy || 'Ketua'})
                          </span>
                        )}
                        {isRejected && (
                          <button
                            onClick={() => alert(`Alasan Penolakan:\n${item.notes || 'Tidak memenuhi kriteria kelayakan dana.'}`)}
                            className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200 hover:bg-rose-100 cursor-pointer"
                          >
                            Lihat Catatan
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredChanges.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                    <FileDiff className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold">Belum ada data transaksi perubahan anggaran yang sesuai saringan.</p>
                    <button
                      onClick={() => handleOpenAdd()}
                      className="mt-3 inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ajukan Usulan Perubahan Sekarang
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. MODAL: Form Ajukan / Edit Perubahan Anggaran */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-600 rounded-lg">
                  <FileDiff className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide">
                    {editingItem ? `Edit Perubahan: ${editingItem.changeNumber}` : "Pengajuan Perubahan Anggaran"}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Sistem Tata Kelola Keuangan Panitia HUT RI Ke-81 RW 04 Ngabean
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* Change Type Selection */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  1. Pilih Jenis Perubahan Anggaran
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['PERUBAHAN NILAI', 'DITAMBAHKAN', 'DITIADAKAN', 'DIGABUNGKAN'] as ChangeType[]).map(t => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => handleChangeType(t)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold text-center border transition-all cursor-pointer ${
                        formData.changeType === t 
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs' 
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Activity Selection */}
              {formData.changeType !== 'DITAMBAHKAN' ? (
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    2. Pos Kegiatan RAB Baseline yang Diubah
                  </label>
                  <select
                    value={formData.activityId}
                    onChange={(e) => handleSelectActivity(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:border-sky-500 focus:outline-none cursor-pointer"
                  >
                    {rkba.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.activityCode || 'ACT'} - {r.name} (Seksi {r.seksi}) — RAB Awal: {formatRp(r.total)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Kode Kegiatan Baru
                    </label>
                    <input
                      type="text"
                      value={formData.activityCode || `ACT-${String(rkba.length + 1).padStart(3, '0')}`}
                      onChange={(e) => setFormData({ ...formData, activityCode: e.target.value })}
                      className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg p-2 bg-slate-50 focus:border-sky-500 focus:outline-none"
                      placeholder="ACT-008"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Nama Kegiatan Baru yang Ditambahkan
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.activityName}
                      onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                      className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2 bg-slate-50 focus:border-sky-500 focus:outline-none"
                      placeholder="Misal: Pentas Seni Musik Akustik Warga"
                    />
                  </div>
                </div>
              )}

              {/* Seksi & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Seksi Penanggung Jawab
                  </label>
                  <select
                    value={formData.seksi}
                    onChange={(e) => setFormData({ ...formData, seksi: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50 focus:border-sky-500 focus:outline-none"
                  >
                    {safeSeksiList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Tanggal Efektif Perubahan
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 bg-slate-50 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Komparasi Nilai Kalkulator (RAB Awal -> Perubahan -> RAB Revisi) */}
              <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Kalkulasi Akuntansi Perubahan Anggaran</span>
                  <span className="font-mono text-slate-400">Formula: Revisi = Awal + Δ Perubahan</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">RAB Awal (Baseline)</span>
                    <span className="text-xs sm:text-sm font-mono font-bold text-slate-200">
                      {formatRp(formData.initialAmount)}
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-[9px] uppercase tracking-wider text-sky-400 block">Nilai Perubahan (Δ)</span>
                    <span className={`text-xs sm:text-sm font-mono font-bold ${formData.changeAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formData.changeAmount >= 0 ? `+${formatRp(formData.changeAmount)}` : formatRp(formData.changeAmount)}
                    </span>
                  </div>

                  <div className="bg-sky-950/80 p-2.5 rounded-lg border border-sky-700">
                    <span className="text-[9px] uppercase tracking-wider text-amber-300 block">RAB Revisi Target</span>
                    <span className="text-xs sm:text-sm font-mono font-black text-white">
                      {formatRp(formData.revisedAmount)}
                    </span>
                  </div>
                </div>

                {/* Input Controls for revised amount */}
                {formData.changeType === 'PERUBAHAN NILAI' && (
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] text-slate-300 mb-1">
                        Masukkan Nilai RAB Revisi Baru (Rp):
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={formData.revisedAmount}
                        onChange={(e) => {
                          const rev = Number(e.target.value) || 0;
                          const delta = rev - formData.initialAmount;
                          setFormData({
                            ...formData,
                            revisedAmount: rev,
                            changeAmount: delta
                          });
                        }}
                        className="w-full text-xs font-mono font-bold bg-slate-950 border border-sky-500 rounded p-2 text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {formData.changeType === 'DITAMBAHKAN' && (
                  <div className="pt-2 border-t border-slate-800">
                    <label className="block text-[10px] text-slate-300 mb-1">
                      Masukkan Anggaran yang Dibutuhkan untuk Kegiatan Baru (Rp):
                    </label>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      value={formData.revisedAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setFormData({
                          ...formData,
                          revisedAmount: val,
                          changeAmount: val
                        });
                      }}
                      className="w-full text-xs font-mono font-bold bg-slate-950 border border-sky-500 rounded p-2 text-white focus:outline-none"
                    />
                  </div>
                )}

                {formData.changeType === 'DITIADAKAN' && (
                  <p className="text-[11px] text-rose-300 italic pt-1">
                    Pos kegiatan ini akan dibatalkan/ditiadakan. Anggaran sebesar {formatRp(formData.initialAmount)} akan dinolkan pada RAB Revisi.
                  </p>
                )}
              </div>

              {/* Dasar Keputusan & Tautan Notulen Rapat */}
              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  3. Dasar Keputusan & Risalah Rapat (Wajib untuk Akuntabilitas)
                </label>
                
                <select
                  value={formData.meetingMinutesId}
                  onChange={(e) => handleSelectMeeting(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:border-sky-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Pilih Notulen Rapat Sebagai Dasar Hukum Perubahan --</option>
                  {notulensi.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.title} ({n.date}) — Pemimpin: {n.leader || 'Ketua Panitia'}
                    </option>
                  ))}
                </select>
                
                <input
                  type="text"
                  value={formData.decisionBasis}
                  onChange={(e) => setFormData({ ...formData, decisionBasis: e.target.value })}
                  placeholder="Kutipan keputusan rapat (misal: Rapat Pleno Evaluasi Anggaran HUT RI Ke-81)"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* Alasan Perubahan Anggaran */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  4. Alasan Teknis Perubahan Anggaran (Wajib)
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Jelaskan secara transparan mengapa anggaran ini perlu ditambah/ditiadakan/diubah..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? "Menyimpan..." : (editingItem ? "Simpan Perubahan" : "Buat Draf Perubahan")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: Detail View & Audit Trail */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileDiff className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-black uppercase">Detail Transaksi Perubahan: {showDetailModal.changeNumber}</h3>
              </div>
              <button 
                onClick={() => setShowDetailModal(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Pos Anggaran / Kegiatan</span>
                  <span className="font-bold text-slate-900">{showDetailModal.activityName}</span>
                  <span className="text-[10px] text-slate-500 block">Seksi {showDetailModal.seksi}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Jenis Mutasi</span>
                  <span className="font-extrabold text-sky-700">{showDetailModal.changeType}</span>
                  <span className="text-[10px] text-slate-500 block">Status: {showDetailModal.status}</span>
                </div>
              </div>

              {/* Nominal Comparison */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">RAB Awal</span>
                  <span className="font-mono font-bold text-slate-800">{formatRp(showDetailModal.initialAmount)}</span>
                </div>
                <div className="p-2 bg-sky-50 rounded-lg border border-sky-100">
                  <span className="text-[9px] text-sky-600 font-bold uppercase block">Perubahan (Δ)</span>
                  <span className="font-mono font-bold text-sky-800">{formatRp(showDetailModal.changeAmount)}</span>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="text-[9px] text-emerald-600 font-bold uppercase block">RAB Revisi</span>
                  <span className="font-mono font-bold text-emerald-800">{formatRp(showDetailModal.revisedAmount)}</span>
                </div>
              </div>

              {/* Alasan & Dasar Hukum */}
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Alasan Perubahan</span>
                  <p className="p-2.5 bg-slate-50 rounded border border-slate-200 italic text-slate-800">
                    "{showDetailModal.reason}"
                  </p>
                </div>

                {showDetailModal.decisionBasis && (
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Dasar Keputusan Rapat</span>
                    <p className="p-2 bg-amber-50 rounded border border-amber-200 text-amber-900 font-medium">
                      {showDetailModal.decisionBasis}
                    </p>
                  </div>
                )}
              </div>

              {/* Signatures / Actors */}
              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 font-medium">Diusulkan oleh:</span>
                  <p className="font-bold text-slate-800">{showDetailModal.proposedBy || 'Seksi Terkait'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Disetujui oleh:</span>
                  <p className="font-bold text-slate-800">{showDetailModal.approvedBy || '- Menunggu -'} {showDetailModal.approvalDate && `(${showDetailModal.approvalDate})`}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowDetailModal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: Preview Notulensi Rapat Dasar Perubahan */}
      {showNotulensiModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-amber-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="text-sm font-black uppercase">{showNotulensiModal.title}</h3>
                  <p className="text-[10px] text-amber-200">Dasar Hukum Keputusan Perubahan Anggaran</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNotulensiModal(null)}
                className="p-1 hover:bg-amber-800 rounded text-amber-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-3 gap-2 bg-amber-50/50 p-3 rounded-lg border border-amber-200 text-[11px]">
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[9px]">Tanggal & Waktu</span>
                  <span className="font-bold text-slate-800">{showNotulensiModal.date}</span>
                  <span className="text-slate-500 block text-[10px]">{showNotulensiModal.time}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[9px]">Lokasi</span>
                  <span className="font-bold text-slate-800">{showNotulensiModal.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[9px]">Pemimpin Rapat</span>
                  <span className="font-bold text-slate-800">{showNotulensiModal.leader || 'Ketua Panitia'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Agenda Pembahasan</h4>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 whitespace-pre-line text-slate-800">
                  {showNotulensiModal.agenda}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 mb-1">
                  Hasil Keputusan Rapat (Dasar Anggaran)
                </h4>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 whitespace-pre-line text-amber-950 font-medium leading-relaxed">
                  {showNotulensiModal.decisions}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowNotulensiModal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Tutup Risalah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL: Konfirmasi Penolakan Usulan */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-4 bg-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-white" />
                <h3 className="text-sm font-black uppercase">Tolak Usulan Perubahan</h3>
              </div>
              <button onClick={() => setShowRejectModal(null)} className="text-white hover:text-rose-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600">
                Anda akan menolak pengajuan perubahan anggaran <strong className="text-slate-900">{showRejectModal.changeNumber}</strong> untuk kegiatan <strong className="text-slate-900">{showRejectModal.activityName}</strong>.
              </p>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Catatan / Alasan Penolakan:
                </label>
                <textarea
                  rows={3}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Misal: Anggaran melebihi batas estimasi kas iuran warga..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:border-rose-500 focus:outline-none bg-slate-50"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(null)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={isProcessing}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition-colors"
                >
                  {isProcessing ? "Memproses..." : "Konfirmasi Tolak"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
