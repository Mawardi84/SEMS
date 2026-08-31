import React, { useState } from "react";
import { 
  Wallet, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Trash, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Download,
  Eye,
  FileSpreadsheet
} from "lucide-react";
import { KeuanganTransaction, SystemSetting } from "../types";
import { exportToPDF } from "../utils/pdfExport";
import { exportToWord } from "../utils/wordExport";
import { PDFPreviewModal } from "./PDFPreviewModal";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface KeuanganViewProps {
  keuangan: KeuanganTransaction[];
  settings: SystemSetting;
  onSaveKeuangan: (action: 'add' | 'edit' | 'delete', data: KeuanganTransaction) => Promise<void>;
  onOpenExcelImport?: () => void;
  isReadOnly?: boolean;
}

export default function KeuanganView({
  keuangan,
  settings,
  onSaveKeuangan,
  onOpenExcelImport,
  isReadOnly = false
}: KeuanganViewProps) {
  const [filterType, setFilterType] = useState<string>("Semua");
  const [filterBukuKas, setFilterBukuKas] = useState<string>("Semua");
  const [filterCategory, setFilterCategory] = useState<string>("Semua");
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<KeuanganTransaction | null>(null);

  const handleExportWord = async () => {
    await exportToWord("printable-keuangan-area", `Buku-Kas-${new Date().toISOString().split('T')[0]}`);
    setIsPreviewOpen(false);
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    await exportToPDF("printable-keuangan-area", `Buku-Kas-${new Date().toISOString().split('T')[0]}.pdf`);
    setIsExportingPDF(false);
    setIsPreviewOpen(false);
  };

  const renderPrintableContent = () => (
    <div id="printable-keuangan-area" className="space-y-4 bg-white p-6 rounded-lg border border-slate-200">
        
        {/* Printable Document Title Header */}
        <div className="border-b-[3px] border-double border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xs font-black font-serif tracking-wide uppercase text-slate-950">
              LAPORAN ARUS KAS & BUKU KAS UMUM (TUNAI)
            </h1>
            <p className="text-[9px] text-slate-500 font-serif">
              Sistem Manajemen Event Kemasyarakatan (SEMS) RW 04 Ngabean • HUT RI Ke-81
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[9px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 block">
              Tanggal Cetak: {new Date().toLocaleDateString("id-ID")}
            </span>
            <span className="text-[8px] text-slate-400 block mt-1">
              Filter: Buku ({filterBukuKas}) • Tipe ({filterType}) • Kategori ({filterCategory})
            </span>
          </div>
        </div>

      {/* 2. Visual Balance cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Balance */}
        <div className="bg-slate-900 text-white p-4 rounded-lg shadow-md border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full transform translate-x-12 -translate-y-12"></div>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">SALDO NETTO KAS UTAMA</span>
          <span className="text-xl font-extrabold font-mono block mt-1 tracking-tight text-white">{formatRp(currentBalance)}</span>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-300 font-mono">
            <span className="text-emerald-400">Total Masuk: {formatRp(totalIncome)}</span>
          </div>
        </div>

        {/* Card 2: Income */}
        <div className="bg-white p-4 rounded-lg shadow-xs border border-slate-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Arus Masuk (Tunai)</span>
            <span className="text-lg font-bold font-mono text-emerald-600 tracking-tight block">
              {formatRp(totalIncome)}
            </span>
            <span className="text-[9px] text-slate-400 font-medium block">
              Dari Iuran RT, Donatur, Sponsor
            </span>
          </div>
          <div className="bg-emerald-50 p-2 rounded text-emerald-600 border border-emerald-100">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Expense */}
        <div className="bg-white p-4 rounded-lg shadow-xs border border-slate-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Arus Keluar (Belanja)</span>
            <span className="text-lg font-bold font-mono text-red-600 tracking-tight block">
              {formatRp(totalExpense)}
            </span>
            <span className="text-[9px] text-slate-400 font-medium block">
              Untuk Belanja RKBA & Operasional
            </span>
          </div>
          <div className="bg-red-50 p-2 rounded text-red-600 border border-red-100">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* 3. Visualisasi Arus Kas */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
          Tren Arus Kas (Pemasukan vs Pengeluaran)
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={cashflowData}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
              <defs>
                <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorKeluar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getDate()}/${d.getMonth()+1}`;
                }}
              />
              <YAxis 
                tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(1)}Jt`} 
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                formatter={(value: number) => formatRp(value)}
                labelFormatter={(label) => `Tanggal: ${label}`}
                contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="masuk" name="Arus Masuk" stroke="#10b981" fillOpacity={1} fill="url(#colorMasuk)" strokeWidth={2} />
              <Area type="monotone" dataKey="keluar" name="Arus Keluar" stroke="#ef4444" fillOpacity={1} fill="url(#colorKeluar)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Ledger Table List */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-sans text-[10px] uppercase tracking-wider border-b border-slate-200 font-bold">
              <th className="px-4 py-2 font-bold text-slate-600">Tanggal Transaksi</th>
              <th className="px-4 py-2 font-bold text-slate-600">Aliran / Kategori</th>
              <th className="px-4 py-2 font-bold text-slate-600">Keterangan / Deskripsi</th>
              <th className="px-4 py-2 font-bold text-slate-600">Ref RKBA</th>
              <th className="px-4 py-2 font-bold text-slate-600 text-right">Nominal (Rp)</th>
              {!isReadOnly && <th className="px-4 py-2 font-bold text-slate-600 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {filteredTransactions.map((t) => {
              const isIncome = t.type === "Masuk";
              return (
                <tr key={t.id} className="hover:bg-slate-50/40 transition-colors duration-150">
                  <td className="px-4 py-2 font-mono text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.date}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isIncome ? "bg-emerald-500" : "bg-red-500"}`}></span>
                      <span className="font-bold text-slate-800">{t.category}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 font-sans text-slate-600 leading-normal max-w-sm">
                    {t.notes}
                  </td>
                  <td className="px-4 py-2 font-mono text-[9px] text-slate-400">
                    {t.refId ? (
                      <span className="bg-slate-100 border border-slate-200 px-1 py-0.5 rounded font-bold text-slate-600">
                        RKBA: #{t.refId.substring(0, 4)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className={`px-4 py-2 font-bold font-mono text-right text-xs ${
                    isIncome ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {isIncome ? "+" : "-"} {formatRp(t.amount)}
                  </td>
                  {!isReadOnly && (
                    <td className="px-4 py-2 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => handleOpenEdit(t)} className="text-[10px] text-blue-600 font-bold hover:underline">Edit</button>
                        <button onClick={() => handleDelete(t)} className="text-[10px] text-red-600 font-bold hover:underline">Hapus</button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Omit<KeuanganTransaction, 'id'>>({
    type: "Masuk",
    date: new Date().toISOString().split('T')[0],
    category: "Donasi Tunai",
    amount: 100000,
    notes: "",
    refId: ""
  });

  // Calculate stats
  const totalIncome = keuangan
    .filter(t => t.type === "Masuk")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = keuangan
    .filter(t => t.type === "Keluar")
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = totalIncome - totalExpense;

  // Categories list based on type
  const incomeCategories = ["Iuran RT", "Donasi Tunai", "Sponsorship", "Bantuan RW", "Dana Talangan / Pinjaman", "Lain-lain"];
  const expenseCategories = ["RKBA Belanja", "Operasional Lomba", "Konsumsi Panitia", "Sewa Perlengkapan", "Pengembalian Dana Talangan", "Lain-lain"];
  const allCategories = [...new Set([...incomeCategories, ...expenseCategories])];

  // Adjust category when type changes in form
  const handleTypeChange = (type: "Masuk" | "Keluar") => {
    setForm(prev => ({
      ...prev,
      type,
      category: type === "Masuk" ? "Donasi Tunai" : "Operasional Lomba"
    }));
  };

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setForm({
      type: "Masuk",
      date: new Date().toISOString().split('T')[0],
      category: "Donasi Tunai",
      amount: 100000,
      notes: "",
      refId: ""
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = editingTransaction ? 'edit' : 'add';
    const payload: KeuanganTransaction = {
      ...form,
      id: editingTransaction ? editingTransaction.id : ""
    };
    await onSaveKeuangan(action, payload);
    setShowModal(false);
    setEditingTransaction(null);
  };

  const handleOpenEdit = (t: KeuanganTransaction) => {
    setEditingTransaction(t);
    setForm({
      type: t.type,
      date: t.date,
      category: t.category,
      amount: t.amount,
      notes: t.notes,
      refId: t.refId
    });
    setShowModal(true);
  };

  const handleDelete = async (t: KeuanganTransaction) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pencatatan transaksi senilai ${formatRp(t.amount)} ini?`)) {
      await onSaveKeuangan('delete', t);
    }
  };

  // Filter list
  const filteredTransactions = keuangan.filter(t => {
    const matchType = filterType === "Semua" || t.type === filterType;
    const matchCategory = filterCategory === "Semua" || t.category === filterCategory;
    const isBukuUtama = !t.id || t.id.includes("-bu-");
    const isBukuDonasi = t.id && t.id.includes("-bd-");
    const matchBuku = filterBukuKas === "Semua" || (filterBukuKas === "Buku Utama" ? isBukuUtama : (filterBukuKas === "Buku Donasi" ? isBukuDonasi : true));
    return matchType && matchCategory && matchBuku;
  });

  // Chart data: Cashflow over time
  const cashflowData = React.useMemo(() => {
    // Group by date
    const dateMap = new Map<string, { date: string, masuk: number, keluar: number }>();
    
    // Sort transactions by date ascending first
    const sorted = [...keuangan].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sorted.forEach(t => {
      const d = t.date;
      if (!dateMap.has(d)) {
        dateMap.set(d, { date: d, masuk: 0, keluar: 0 });
      }
      const current = dateMap.get(d)!;
      if (t.type === 'Masuk') {
        current.masuk += t.amount;
      } else {
        current.keluar += t.amount;
      }
    });

    return Array.from(dateMap.values());
  }, [keuangan]);

  const formatRp = (num: number) => {
    return "Rp " + num.toLocaleString("id-ID");
  };

  return (
    <div className="space-y-5">
      
      {/* 1. Header with Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
            <Wallet className="w-4 h-4 text-red-600" />
            Buku Kas & Arus Keuangan (Tunai)
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Buku besar digital perbendaharaan RW 04 Ngabean. Catat seluruh pemasukan kas riil dan pengeluaran belanja panitia.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {onOpenExcelImport && !isReadOnly && (
            <button
              onClick={onOpenExcelImport}
              className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold px-3 py-1.5 rounded shadow-xs transition-all duration-150 uppercase tracking-wide cursor-pointer"
              title="Import Transaksi Keuangan dari File Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
              Import Excel
            </button>
          )}
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-1.5 rounded shadow-xs transition-all duration-150 uppercase tracking-wide cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Pratinjau Cetak
          </button>
          <button
            onClick={handleExportWord}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded shadow-xs transition-all duration-150 uppercase tracking-wide cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh DOC
          </button>
          {!isReadOnly && (
            <button
              id="btn-add-keuangan"
              onClick={handleOpenAdd}
              className="flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold px-3 py-1.5 rounded shadow-xs transition-all duration-150 uppercase tracking-wide cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Pencatatan Transaksi Manual
            </button>
          )}
        </div>
      </div>

      <PDFPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        title="Pratinjau Laporan Keuangan" 
        onDownload={handleExportPDF}
        onExportWord={handleExportWord}
      >
        {renderPrintableContent()}
      </PDFPreviewModal>

      {renderPrintableContent()}

      {/* 5. MANUAL TRANSACTION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-red-750 text-white px-4 py-3 border-b border-red-850 flex justify-between items-center">
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider">
                {editingTransaction ? "Edit Transaksi Keuangan" : "Catat Transaksi Keuangan Baru"}
              </h3>
              <button 
                id="close-keuangan-modal"
                onClick={() => setShowModal(false)}
                className="text-white/85 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
              
              {/* Type selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipe Arus Kas</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTypeChange("Masuk")}
                    className={`p-2 rounded text-xs font-bold font-sans text-center transition-all border ${
                      form.type === "Masuk"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    Masuk (Pemasukan)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange("Keluar")}
                    className={`p-2 rounded text-xs font-bold font-sans text-center transition-all border ${
                      form.type === "Keluar"
                        ? "bg-red-50 border-red-500 text-red-700"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    Keluar (Pengeluaran)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kategori Transaksi</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50 font-semibold"
                  >
                    {form.type === "Masuk" 
                      ? incomeCategories.map(c => <option key={c} value={c}>{c}</option>)
                      : expenseCategories.map(c => <option key={c} value={c}>{c}</option>)
                    }
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nominal Transaksi (Rp)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50 text-right font-mono font-bold"
                  placeholder="Rp 0"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Keterangan / Rincian</label>
                <textarea
                  required
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50 h-16 resize-none"
                  placeholder="Contoh: Pembayaran iuran RT 01 Ngabean lunas ke perbendaharaan RW."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-submit-keuangan"
                  className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded shadow-xs transition-colors"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
