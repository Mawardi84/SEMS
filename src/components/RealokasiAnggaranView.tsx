import React, { useState, useMemo } from "react";
import { 
  ArrowRightLeft, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  FileText, 
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
  Scale,
  Send,
  X,
  Layers,
  Sparkles
} from "lucide-react";
import { 
  BudgetReallocation, 
  RKBAItem, 
  Notulensi, 
  SystemSetting, 
  ApprovalStatus 
} from "../types";
import { exportToPDF } from "../utils/pdfExport";

interface RealokasiAnggaranViewProps {
  budgetReallocations: BudgetReallocation[];
  rkba: RKBAItem[];
  notulensi: Notulensi[];
  settings: SystemSetting;
  onSaveBudgetReallocation: (action: 'add' | 'edit' | 'submit' | 'approve' | 'reject' | 'cancel', data: BudgetReallocation, actor?: string) => Promise<void>;
  onNavigateView?: (viewName: string, params?: any) => void;
}

export default function RealokasiAnggaranView({
  budgetReallocations = [],
  rkba = [],
  notulensi = [],
  settings,
  onSaveBudgetReallocation,
  onNavigateView
}: RealokasiAnggaranViewProps) {
  // Safety list of seksi
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

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("Semua");
  const [filterSourceSeksi, setFilterSourceSeksi] = useState<string>("Semua");
  const [filterTargetSeksi, setFilterTargetSeksi] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<BudgetReallocation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<BudgetReallocation | null>(null);
  const [showNotulensiModal, setShowNotulensiModal] = useState<Notulensi | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<BudgetReallocation | null>(null);
  const [rejectNotes, setRejectNotes] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<{
    id?: string;
    reallocationNumber: string;
    date: string;
    sourceActivityId: string;
    sourceActivityName: string;
    sourceSeksi: string;
    targetActivityId: string;
    targetActivityName: string;
    targetSeksi: string;
    availableAmount: number;
    amount: number;
    remainingAmount: number;
    reason: string;
    decisionBasis: string;
    meetingMinutesId: string;
    meetingMinutesNumber: string;
    proposedBy: string;
    notes: string;
  }>({
    reallocationNumber: "",
    date: new Date().toISOString().split('T')[0],
    sourceActivityId: "",
    sourceActivityName: "",
    sourceSeksi: safeSeksiList[0],
    targetActivityId: "",
    targetActivityName: "",
    targetSeksi: safeSeksiList[1] || safeSeksiList[0],
    availableAmount: 0,
    amount: 0,
    remainingAmount: 0,
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

  // Metrics Calculations
  const metrics = useMemo(() => {
    const approved = budgetReallocations.filter(r => r.status === 'DISETUJUI');
    const pending = budgetReallocations.filter(r => r.status === 'DIAJUKAN' || r.status === 'DRAFT');
    const rejected = budgetReallocations.filter(r => r.status === 'DITOLAK');

    const totalApprovedShifted = approved.reduce((sum, r) => sum + (r.amount || 0), 0);
    const interSeksiCount = approved.filter(r => r.sourceSeksi !== r.targetSeksi).length;
    const intraSeksiCount = approved.filter(r => r.sourceSeksi === r.targetSeksi).length;

    return {
      totalCount: budgetReallocations.length,
      approvedCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      totalApprovedShifted,
      interSeksiCount,
      intraSeksiCount
    };
  }, [budgetReallocations]);

  // Filtered List
  const filteredReallocations = useMemo(() => {
    return budgetReallocations.filter(item => {
      const matchStatus = filterStatus === "Semua" || item.status === filterStatus;
      const matchSourceSeksi = filterSourceSeksi === "Semua" || item.sourceSeksi === filterSourceSeksi;
      const matchTargetSeksi = filterTargetSeksi === "Semua" || item.targetSeksi === filterTargetSeksi;
      const matchSearch = searchQuery.trim() === "" ||
        item.reallocationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sourceActivityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.targetActivityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sourceSeksi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.targetSeksi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.meetingMinutesNumber && item.meetingMinutesNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchStatus && matchSourceSeksi && matchTargetSeksi && matchSearch;
    });
  }, [budgetReallocations, filterStatus, filterSourceSeksi, filterTargetSeksi, searchQuery]);

  // Open Add Modal
  const handleOpenAdd = (initialSourceId?: string) => {
    const nextNum = `RA-2026-${String(budgetReallocations.length + 1).padStart(3, '0')}`;
    
    let source = rkba[0];
    if (initialSourceId) {
      const found = rkba.find(r => r.id === initialSourceId);
      if (found) source = found;
    }

    let target = rkba.length > 1 ? rkba[1] : rkba[0];
    if (source && target && source.id === target.id && rkba.length > 1) {
      target = rkba.find(r => r.id !== source.id) || rkba[0];
    }

    const available = source ? source.total : 0;
    const defaultShift = Math.min(250000, available);

    setFormData({
      reallocationNumber: nextNum,
      date: new Date().toISOString().split('T')[0],
      sourceActivityId: source?.id || "",
      sourceActivityName: source?.name || "",
      sourceSeksi: source?.seksi || safeSeksiList[0],
      targetActivityId: target?.id || "",
      targetActivityName: target?.name || "",
      targetSeksi: target?.seksi || safeSeksiList[1] || safeSeksiList[0],
      availableAmount: available,
      amount: defaultShift,
      remainingAmount: Math.max(0, available - defaultShift),
      reason: "",
      decisionBasis: "",
      meetingMinutesId: "",
      meetingMinutesNumber: "",
      proposedBy: source?.seksi || "Seksi Terkait",
      notes: ""
    });

    setEditingItem(null);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: BudgetReallocation) => {
    if (item.status === 'DISETUJUI') {
      alert("Realokasi anggaran yang sudah disetujui tidak dapat diedit langsung.");
      return;
    }

    setEditingItem(item);
    setFormData({
      id: item.id,
      reallocationNumber: item.reallocationNumber,
      date: item.date,
      sourceActivityId: item.sourceActivityId,
      sourceActivityName: item.sourceActivityName,
      sourceSeksi: item.sourceSeksi,
      targetActivityId: item.targetActivityId,
      targetActivityName: item.targetActivityName,
      targetSeksi: item.targetSeksi,
      availableAmount: item.availableAmount,
      amount: item.amount,
      remainingAmount: item.remainingAmount,
      reason: item.reason,
      decisionBasis: item.decisionBasis || "",
      meetingMinutesId: item.meetingMinutesId || "",
      meetingMinutesNumber: item.meetingMinutesNumber || "",
      proposedBy: item.proposedBy || item.sourceSeksi,
      notes: item.notes || ""
    });
    setShowModal(true);
  };

  // Source selection change
  const handleSelectSource = (sourceId: string) => {
    const source = rkba.find(r => r.id === sourceId);
    if (!source) return;

    const available = source.total;
    const shift = Math.min(formData.amount, available);

    setFormData(prev => ({
      ...prev,
      sourceActivityId: source.id,
      sourceActivityName: source.name,
      sourceSeksi: source.seksi,
      availableAmount: available,
      amount: shift,
      remainingAmount: Math.max(0, available - shift),
      proposedBy: source.seksi
    }));
  };

  // Target selection change
  const handleSelectTarget = (targetId: string) => {
    const target = rkba.find(r => r.id === targetId);
    if (!target) return;

    setFormData(prev => ({
      ...prev,
      targetActivityId: target.id,
      targetActivityName: target.name,
      targetSeksi: target.seksi
    }));
  };

  // Shift amount change
  const handleAmountChange = (amt: number) => {
    const validAmt = Math.max(0, amt);
    const remaining = Math.max(0, formData.availableAmount - validAmt);
    setFormData(prev => ({
      ...prev,
      amount: validAmt,
      remainingAmount: remaining
    }));
  };

  // Meeting selection change
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

  // Form submit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.sourceActivityId === formData.targetActivityId) {
      alert("Kegiatan sumber dan kegiatan penerima tidak boleh sama.");
      return;
    }

    if (formData.amount <= 0) {
      alert("Nilai nominal yang dialihkan harus lebih besar dari Rp 0.");
      return;
    }

    if (formData.amount > formData.availableAmount) {
      alert(`Nilai realokasi (${formatRp(formData.amount)}) melebihi batas dana tersedia di sumber (${formatRp(formData.availableAmount)}).`);
      return;
    }

    if (!formData.reason.trim()) {
      alert("Alasan pergeseran anggaran wajib diisi secara rinci.");
      return;
    }

    setIsProcessing(true);
    try {
      const payload: BudgetReallocation = {
        id: editingItem ? editingItem.id : "",
        reallocationNumber: formData.reallocationNumber,
        date: formData.date,
        sourceActivityId: formData.sourceActivityId,
        sourceActivityName: formData.sourceActivityName,
        sourceSeksi: formData.sourceSeksi,
        targetActivityId: formData.targetActivityId,
        targetActivityName: formData.targetActivityName,
        targetSeksi: formData.targetSeksi,
        availableAmount: formData.availableAmount,
        amount: formData.amount,
        remainingAmount: formData.remainingAmount,
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
      await onSaveBudgetReallocation(action, payload, formData.proposedBy);
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan realokasi anggaran.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Workflow actions
  const handleWorkflowSubmit = async (item: BudgetReallocation) => {
    if (confirm(`Ajukan usulan realokasi ${item.reallocationNumber} (${formatRp(item.amount)}: ${item.sourceActivityName} ➔ ${item.targetActivityName}) ke Ketua/Bendahara?`)) {
      setIsProcessing(true);
      await onSaveBudgetReallocation('submit', item, item.sourceSeksi);
      setIsProcessing(false);
    }
  };

  const handleWorkflowApprove = async (item: BudgetReallocation) => {
    if (confirm(`SETUJUI realokasi anggaran ${item.reallocationNumber}?\n\nSumber (-): ${item.sourceActivityName} (Seksi ${item.sourceSeksi})\nTujuan (+): ${item.targetActivityName} (Seksi ${item.targetSeksi})\nNominal: ${formatRp(item.amount)}\n\nTransaksi Zero-Sum ini akan resmi menggeser pagu tanpa mengubah total anggaran keseluruhan.`)) {
      setIsProcessing(true);
      await onSaveBudgetReallocation('approve', item, 'Ketua Panitia');
      setIsProcessing(false);
    }
  };

  const handleOpenReject = (item: BudgetReallocation) => {
    setShowRejectModal(item);
    setRejectNotes("");
  };

  const handleConfirmReject = async () => {
    if (!showRejectModal) return;
    setIsProcessing(true);
    await onSaveBudgetReallocation('reject', { ...showRejectModal, notes: rejectNotes }, 'Ketua Panitia');
    setIsProcessing(false);
    setShowRejectModal(null);
  };

  const handleWorkflowCancel = async (item: BudgetReallocation) => {
    if (confirm(`Batalkan draf realokasi anggaran ${item.reallocationNumber}?`)) {
      setIsProcessing(true);
      await onSaveBudgetReallocation('cancel', item, 'Admin');
      setIsProcessing(false);
    }
  };

  // Helper target item details for calculations
  const targetRkbaItem = useMemo(() => {
    return rkba.find(r => r.id === formData.targetActivityId);
  }, [rkba, formData.targetActivityId]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header with Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">
            <Scale className="w-3.5 h-3.5" />
            <span>Tata Kelola Anggaran & Pergeseran Pagu</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
            <ArrowRightLeft className="w-5 h-5 text-purple-600" />
            Realokasi Anggaran (Budget Reallocation)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pergeseran dana antar-seksi atau antar-kegiatan dengan prinsip keseimbangan netral (Zero-Sum Balance: Net $\Delta = 0$).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportToPDF("printable-budget-reallocations", `Berita-Acara-Realokasi-RW04-${new Date().toISOString().split('T')[0]}.pdf`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-300 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            Ekspor PDF
          </button>
          
          <button
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Ajukan Realokasi Anggaran
          </button>
        </div>
      </div>

      {/* 2. Executive Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Shifted */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 bg-purple-50 text-purple-600 border border-purple-100 rounded-lg">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Dana Dialihkan Disetujui
            </span>
            <span className="text-base font-mono font-black text-purple-700">
              {formatRp(metrics.totalApprovedShifted)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {metrics.approvedCount} pergeseran disahkan
            </span>
          </div>
        </div>

        {/* Zero-Sum Balance Indicator */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Integritas Zero-Sum
            </span>
            <span className="text-base font-mono font-black text-emerald-700">
              Rp 0 (Netto Imbang)
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
              100% Pagu Total Terjaga
            </span>
          </div>
        </div>

        {/* Inter-Seksi Shifts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 bg-sky-50 text-sky-600 border border-sky-100 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Distribusi Antar-Seksi
            </span>
            <span className="text-base font-mono font-black text-slate-900">
              {metrics.interSeksiCount} Lintas Seksi
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {metrics.intraSeksiCount} internal seksi
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
              Belum dieksekusi ke pagu aktif
            </span>
          </div>
        </div>
      </div>

      {/* 3. Governance Callout: Zero-Sum Principle */}
      <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-white flex items-center gap-2">
              Prinsip Akuntansi: Zero-Sum Reallocation Ledger
              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Balanced Movement Rule
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed max-w-4xl">
              Pergeseran anggaran memindahkan surplus efisiensi dana dari kegiatan sumber ke kegiatan penerima yang membutuhkan penambahan tanpa menambah total beban anggaran panitia. Setiap transaksi wajib divalidasi tidak melebihi sisa pagu sumber dan dilandasi <strong className="text-white">Notulen Rapat Pleno</strong>.
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

      {/* 4. Filter & Search Toolbar */}
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
            placeholder="Cari no. realokasi, kegiatan sumber/tujuan, seksi..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Filter Status */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="Semua">Semua Status</option>
            <option value="DRAFT">DRAFT</option>
            <option value="DIAJUKAN">DIAJUKAN</option>
            <option value="DISETUJUI">DISETUJUI (HIJAU)</option>
            <option value="DITOLAK">DITOLAK (MERAH)</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        {/* Filter Seksi Sumber */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">Sumber:</span>
          <select
            value={filterSourceSeksi}
            onChange={(e) => setFilterSourceSeksi(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="Semua">Semua Seksi</option>
            {safeSeksiList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Filter Seksi Tujuan */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">Penerima:</span>
          <select
            value={filterTargetSeksi}
            onChange={(e) => setFilterTargetSeksi(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="Semua">Semua Seksi</option>
            {safeSeksiList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Reset Filter */}
        {(filterStatus !== "Semua" || filterSourceSeksi !== "Semua" || filterTargetSeksi !== "Semua" || searchQuery.trim() !== "") && (
          <button
            onClick={() => {
              setFilterStatus("Semua");
              setFilterSourceSeksi("Semua");
              setFilterTargetSeksi("Semua");
              setSearchQuery("");
            }}
            className="text-xs text-rose-600 hover:text-rose-800 font-bold ml-auto cursor-pointer"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* 5. Master Data Table */}
      <div id="printable-budget-reallocations" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Buku Jurnal Pergeseran & Realokasi Anggaran
            </h3>
            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[10px] font-bold">
              {filteredReallocations.length} Transaksi
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
                <th className="px-4 py-3 text-left">Kegiatan Sumber (Pengurang)</th>
                <th className="px-2 py-3 text-center">Arah</th>
                <th className="px-4 py-3 text-left">Kegiatan Penerima (Penambah)</th>
                <th className="px-3.5 py-3 text-right">Nominal Dialihkan</th>
                <th className="px-3.5 py-3 text-right">Sisa Sumber</th>
                <th className="px-3.5 py-3 text-left">Dasar Notulen</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center print:hidden">Aksi & Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredReallocations.map((item, idx) => {
                const isApproved = item.status === 'DISETUJUI';
                const isDraft = item.status === 'DRAFT';
                const isSubmitted = item.status === 'DIAJUKAN';
                const isRejected = item.status === 'DITOLAK';

                const matchedMeeting = notulensi.find(n => n.id === item.meetingMinutesId);

                return (
                  <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                    {/* No. Ref & Tanggal */}
                    <td className="px-3.5 py-3 border-r border-slate-100 font-mono text-[11px] whitespace-nowrap">
                      <div className="font-bold text-slate-900">{item.reallocationNumber}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{item.date}</span>
                      </div>
                    </td>

                    {/* Kegiatan Sumber */}
                    <td className="px-4 py-3 border-r border-slate-100">
                      <div className="font-bold text-rose-800 flex items-center gap-1">
                        <span>{item.sourceActivityName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-slate-600">Seksi {item.sourceSeksi}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">Pagu Awal: {formatRp(item.availableAmount)}</span>
                      </div>
                    </td>

                    {/* Arah Shift */}
                    <td className="px-2 py-3 border-r border-slate-100 text-center">
                      <div className="p-1 rounded bg-purple-50 text-purple-600 inline-block">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </td>

                    {/* Kegiatan Penerima */}
                    <td className="px-4 py-3 border-r border-slate-100">
                      <div className="font-bold text-emerald-800 flex items-center gap-1">
                        <span>{item.targetActivityName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-slate-600">Seksi {item.targetSeksi}</span>
                        <span>•</span>
                        <span className="italic text-slate-400 line-clamp-1 max-w-[150px]" title={item.reason}>
                          "{item.reason}"
                        </span>
                      </div>
                    </td>

                    {/* Nominal Dialihkan */}
                    <td className="px-3.5 py-3 border-r border-slate-100 text-right font-mono font-black text-purple-700 whitespace-nowrap">
                      {formatRp(item.amount)}
                    </td>

                    {/* Sisa Sumber */}
                    <td className="px-3.5 py-3 border-r border-slate-100 text-right font-mono text-slate-600 whitespace-nowrap text-[11px]">
                      {formatRp(item.remainingAmount)}
                    </td>

                    {/* Dasar Notulen */}
                    <td className="px-3.5 py-3 border-r border-slate-100 text-[11px]">
                      {item.meetingMinutesId || item.meetingMinutesNumber ? (
                        <button
                          onClick={() => {
                            if (matchedMeeting) {
                              setShowNotulensiModal(matchedMeeting);
                            } else {
                              alert(`Dasar Keputusan Realokasi:\n${item.meetingMinutesNumber || 'Risalah Rapat'}\n\n${item.decisionBasis || item.reason}`);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold transition-colors cursor-pointer text-left"
                        >
                          <FileText className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate max-w-[120px]">{item.meetingMinutesNumber || 'Notulen'}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">- Tanpa Ref -</span>
                      )}
                    </td>

                    {/* Status Badge */}
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
                        {/* Detail View */}
                        <button
                          onClick={() => setShowDetailModal(item)}
                          title="Lihat Berita Acara & Detail"
                          className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* DRAFT */}
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
                              className="p-1.5 text-purple-600 hover:text-purple-800 bg-purple-50 rounded transition-colors cursor-pointer"
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

                        {/* DIAJUKAN */}
                        {isSubmitted && (
                          <>
                            <button
                              onClick={() => handleWorkflowApprove(item)}
                              title="Setujui Realokasi"
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

                        {/* DISETUJUI / DITOLAK */}
                        {isApproved && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                            Disahkan ({item.approvedBy || 'Ketua'})
                          </span>
                        )}
                        {isRejected && (
                          <button
                            onClick={() => alert(`Alasan Penolakan:\n${item.notes || 'Ditolak pimpinan.'}`)}
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

              {filteredReallocations.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                    <ArrowRightLeft className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold">Belum ada transaksi realokasi anggaran yang sesuai saringan.</p>
                    <button
                      onClick={() => handleOpenAdd()}
                      className="mt-3 inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ajukan Usulan Realokasi Sekarang
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. MODAL: Form Ajukan / Edit Realokasi Anggaran */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <ArrowRightLeft className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide">
                    {editingItem ? `Edit Realokasi: ${editingItem.reallocationNumber}` : "Pengajuan Realokasi Anggaran Antar-Pos"}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Sistem Tata Kelola Pergeseran Anggaran Panitia HUT RI Ke-81 RW 04 Ngabean
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
              {/* Ref Number & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Nomor Surat / Referensi Realokasi
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.reallocationNumber}
                    onChange={(e) => setFormData({ ...formData, reallocationNumber: e.target.value })}
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg p-2 bg-slate-50 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Tanggal Efektif Realokasi
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 bg-slate-50 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dual Selection: Source vs Target Activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Source Selection (Pengurang) */}
                <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-rose-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-600 inline-block"></span>
                      1. Pos Sumber (Pemberi Dana)
                    </span>
                    <span className="text-[9px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                      Saldo Berkurang (-)
                    </span>
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold mb-1">Pilih Kegiatan Sumber:</label>
                    <select
                      value={formData.sourceActivityId}
                      onChange={(e) => handleSelectSource(e.target.value)}
                      className="w-full text-xs font-bold border border-rose-300 rounded-lg p-2 bg-white text-rose-950 focus:outline-none focus:border-rose-500"
                    >
                      {rkba.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.activityCode || 'ACT'} - {r.name} ({r.seksi}) — Pagu: {formatRp(r.total)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-rose-900 border-t border-rose-200/60">
                    <span>Dana Tersedia:</span>
                    <span className="font-bold">{formatRp(formData.availableAmount)}</span>
                  </div>
                </div>

                {/* Target Selection (Penerima) */}
                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                      2. Pos Tujuan (Penerima Dana)
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                      Saldo Bertambah (+)
                    </span>
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold mb-1">Pilih Kegiatan Penerima:</label>
                    <select
                      value={formData.targetActivityId}
                      onChange={(e) => handleSelectTarget(e.target.value)}
                      className="w-full text-xs font-bold border border-emerald-300 rounded-lg p-2 bg-white text-emerald-950 focus:outline-none focus:border-emerald-500"
                    >
                      {rkba.map(r => (
                        <option key={r.id} value={r.id} disabled={r.id === formData.sourceActivityId}>
                          {r.activityCode || 'ACT'} - {r.name} ({r.seksi}) {r.id === formData.sourceActivityId ? '(Sama dengan sumber)' : `— Pagu: ${formatRp(r.total)}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-emerald-900 border-t border-emerald-200/60">
                    <span>Pagu Saat Ini:</span>
                    <span className="font-bold">{formatRp(targetRkbaItem?.total || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Zero-Sum Interactive Ledger Visualizer */}
              <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" />
                    Kalkulator Simulasi Zero-Sum Realokasi
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700">
                    Net Impact = Rp 0
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  {/* Source Post-Math */}
                  <div className="bg-slate-800/80 p-3 rounded-lg border border-rose-900/40 text-center">
                    <span className="text-[9px] text-rose-400 uppercase font-bold block">Sumber: Sisa Pagu Akhir</span>
                    <span className="text-sm font-mono font-black text-rose-300 block mt-1">
                      {formatRp(formData.remainingAmount)}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      ({formatRp(formData.availableAmount)} - {formatRp(formData.amount)})
                    </span>
                  </div>

                  {/* Nominal Shift Input */}
                  <div className="bg-purple-950/80 p-3 rounded-lg border border-purple-700 text-center">
                    <label className="text-[9px] text-purple-300 uppercase font-extrabold block mb-1">
                      Nominal Dialihkan (Rp)
                    </label>
                    <input
                      type="number"
                      min="1000"
                      max={formData.availableAmount}
                      step="1000"
                      value={formData.amount}
                      onChange={(e) => handleAmountChange(Number(e.target.value) || 0)}
                      className="w-full text-center text-sm font-mono font-black bg-slate-900 text-white border border-purple-500 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-purple-400"
                    />
                    <span className="text-[9px] text-purple-300 block mt-1">
                      {formatRp(formData.amount)}
                    </span>
                  </div>

                  {/* Target Post-Math */}
                  <div className="bg-slate-800/80 p-3 rounded-lg border border-emerald-900/40 text-center">
                    <span className="text-[9px] text-emerald-400 uppercase font-bold block">Tujuan: Pagu Revisi Baru</span>
                    <span className="text-sm font-mono font-black text-emerald-300 block mt-1">
                      {formatRp((targetRkbaItem?.total || 0) + formData.amount)}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      ({formatRp(targetRkbaItem?.total || 0)} + {formatRp(formData.amount)})
                    </span>
                  </div>
                </div>

                {formData.amount > formData.availableAmount && (
                  <div className="p-2 bg-rose-500/20 border border-rose-500/40 rounded text-rose-300 text-[11px] flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Peringatan: Nominal realokasi melebihi dana yang tersedia pada kegiatan sumber!</span>
                  </div>
                )}
              </div>

              {/* Justification / Reason */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Alasan Teknis Pergeseran Dana (Justifikasi)
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:border-purple-500 focus:outline-none leading-relaxed"
                  placeholder="Contoh: Efisiensi sewa genset di Seksi Perlengkapan dialihkan untuk subsidi tambahan hadiah piala di Seksi Lomba."
                />
              </div>

              {/* Notulensi Link */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Dasar Hukum: Tautan Notulen Rapat Pleno
                </label>
                <select
                  value={formData.meetingMinutesId}
                  onChange={(e) => handleSelectMeeting(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2 bg-slate-50 focus:border-purple-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Pilih Notulen Rapat Terkait (Opsional / Risalah Terlampir) --</option>
                  {notulensi.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.date} - {n.title} (Pemimpin: {n.leader})
                    </option>
                  ))}
                </select>
              </div>

              {/* Decision Basis Note */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Kutipan Risalah / Keputusan Rapat
                </label>
                <input
                  type="text"
                  value={formData.decisionBasis}
                  onChange={(e) => setFormData({ ...formData, decisionBasis: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50 focus:border-purple-500 focus:outline-none"
                  placeholder="Contoh: Rapat Pleno Panitia tanggal 10 Agustus menyetujui efisiensi belanja perlengkapan."
                />
              </div>
            </form>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isProcessing || formData.amount > formData.availableAmount || formData.amount <= 0}
                onClick={handleSubmitForm}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isProcessing ? "Menyimpan..." : editingItem ? "Simpan Perubahan" : "Simpan Draf Realokasi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: Detail & Audit Trail View */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-black uppercase tracking-wide">
                  Berita Acara Realokasi Anggaran: {showDetailModal.reallocationNumber}
                </h3>
              </div>
              <button 
                onClick={() => setShowDetailModal(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-bold">Nomor Dokumen:</span>
                    <span className="font-mono font-bold text-slate-900">{showDetailModal.reallocationNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Tanggal Transaksi:</span>
                    <span className="font-mono font-bold text-slate-900">{showDetailModal.date}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-bold">Status Persetujuan:</span>
                    <span className="font-bold text-purple-700">{showDetailModal.status}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Disahkan Oleh:</span>
                    <span className="font-bold text-slate-900">{showDetailModal.approvedBy || '-'} ({showDetailModal.approvalDate || '-'})</span>
                  </div>
                </div>
              </div>

              {/* Movement Summary */}
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-3">
                <span className="text-[10px] font-black uppercase text-purple-800 block">
                  Ikhtisar Mutasi Realokasi Zero-Sum
                </span>
                
                <div className="flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-rose-700 font-bold block">Sumber (-): {showDetailModal.sourceActivityName}</span>
                    <span className="text-slate-500 text-[10px]">Seksi {showDetailModal.sourceSeksi}</span>
                  </div>
                  <div className="text-center font-black text-purple-700 px-3 py-1 bg-white rounded-lg border border-purple-200">
                    {formatRp(showDetailModal.amount)}
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-700 font-bold block">Tujuan (+): {showDetailModal.targetActivityName}</span>
                    <span className="text-slate-500 text-[10px]">Seksi {showDetailModal.targetSeksi}</span>
                  </div>
                </div>
              </div>

              {/* Reasons & Decisions */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Alasan & Justifikasi:</span>
                <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed italic">
                  "{showDetailModal.reason}"
                </p>
              </div>

              {showDetailModal.decisionBasis && (
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Dasar Keputusan Rapat:</span>
                  <p className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 text-amber-900 leading-relaxed font-semibold">
                    {showDetailModal.decisionBasis}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowDetailModal(null)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: Reject Reason Form */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <XCircle className="w-5 h-5" />
              <h3 className="text-sm font-black uppercase">Tolak Usulan Realokasi Anggaran</h3>
            </div>
            <p className="text-xs text-slate-600">
              Masukkan alasan penolakan untuk realokasi <strong>{showRejectModal.reallocationNumber}</strong> ({showDetailModal?.sourceActivityName} ➔ {showDetailModal?.targetActivityName}):
            </p>
            <textarea
              rows={3}
              required
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:border-rose-500 focus:outline-none"
              placeholder="Contoh: Sisa pagu sumber masih diperlukan untuk cadangan biaya tak terduga."
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowRejectModal(null)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                disabled={isProcessing || !rejectNotes.trim()}
                onClick={handleConfirmReject}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-400 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL: Quick Notulensi Preview */}
      {showNotulensiModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-wide">
                  Risalah Notulen Rapat: {showNotulensiModal.title}
                </h3>
              </div>
              <button 
                onClick={() => setShowNotulensiModal(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-bold">Tanggal:</span>
                  <span className="font-mono font-bold text-slate-900">{showNotulensiModal.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Pemimpin:</span>
                  <span className="font-bold text-slate-900">{showNotulensiModal.leader}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Keputusan / Kesepakatan Rapat:</span>
                <p className="p-3 bg-amber-50/80 rounded-lg border border-amber-200 text-amber-900 leading-relaxed font-semibold">
                  {showNotulensiModal.decisions || showNotulensiModal.agenda}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowNotulensiModal(null)}
                className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
