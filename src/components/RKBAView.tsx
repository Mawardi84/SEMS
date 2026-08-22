import React, { useState } from "react";
import { 
  FileSpreadsheet, 
  Plus, 
  Edit, 
  Trash, 
  CheckCircle, 
  XCircle, 
  Sparkles, 
  ShoppingBag, 
  Filter, 
  AlertTriangle,
  Info,
  DollarSign,
  HelpCircle,
  TrendingDown,
  Download,
  Eye,
  Lock,
  ShieldCheck,
  ArrowRightLeft,
  TrendingUp,
  Search,
  Layers,
  History
} from "lucide-react";
import { RKBAItem, SystemSetting, KeuanganTransaction, Kegiatan, ActivityStatus } from "../types";
import { exportToPDF } from "../utils/pdfExport";
import { exportToWord } from "../utils/wordExport";
import { PDFPreviewModal } from "./PDFPreviewModal";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface RKBAViewProps {
  rkba: RKBAItem[];
  kegiatan: Kegiatan[];
  settings: SystemSetting;
  keuangan: KeuanganTransaction[];
  onSaveRKBA: (action: 'add' | 'edit' | 'delete' | 'approve' | 'reject', data: RKBAItem) => Promise<void>;
  onBelanjaItem: (rkbaId: string) => Promise<void>;
  isRecordingBelanjaId: string | null;
  onNavigateView?: (viewName: string, params?: any) => void;
  isReadOnly?: boolean;
}

export default function RKBAView({
  rkba,
  kegiatan,
  settings,
  keuangan,
  onSaveRKBA,
  onBelanjaItem,
  isRecordingBelanjaId,
  onNavigateView,
  isReadOnly = false
}: RKBAViewProps) {
  // Safety checks
  const safeSettings = {
    seksiList: settings?.seksiList || []
  };

  // Filter States
  const [filterSeksi, setFilterSeksi] = useState<string>("Semua");
  const [filterStatus, setFilterStatus] = useState<string>("Semua");
  const [filterSource, setFilterSource] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Form / Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RKBAItem | null>(null);
  const [form, setForm] = useState<Omit<RKBAItem, 'id' | 'total' | 'dateAdded'>>({
    activityCode: "",
    name: "",
    seksi: safeSettings.seksiList[0] || "Acara",
    qty: 1,
    unit: "Pcs",
    price: 10000,
    fundingSource: "Kas Utama",
    status: "Draft",
    activityStatus: "RENCANA",
    notes: ""
  });

  // Expanded AI Feedback states (id to boolean map)
  const [expandedAI, setExpandedAI] = useState<Record<string, boolean>>({});
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleExportWord = async () => {
    await exportToWord("printable-rkba-area", `Laporan-RKBA-${new Date().toISOString().split('T')[0]}`);
    setIsPreviewOpen(false);
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    await exportToPDF("printable-rkba-area", `Laporan-RKBA-${new Date().toISOString().split('T')[0]}.pdf`);
    setIsExportingPDF(false);
    setIsPreviewOpen(false);
  };

  const renderPrintableContent = (isModal: boolean) => (
    <div className="space-y-6 bg-white p-10 rounded-none border-none text-slate-900 print:bg-white print:text-black">
        
        {/* Printable Document Title Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 print:border-b-2">
          <div>
            <h1 className="text-xl font-bold font-serif uppercase tracking-tight text-slate-950">
              LAPORAN RKBA
            </h1>
            <p className="text-xs text-slate-600 font-serif mt-0.5">
              Rencana Kebutuhan Barang & Anggaran - HUT RI Ke-81
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-mono text-slate-500 block">
              Tanggal Cetak: {new Date().toLocaleDateString("id-ID")}
            </span>
            <span className="text-[9px] text-slate-500 block mt-0.5">
              Seksi: {filterSeksi} | Status: {filterStatus}
            </span>
          </div>
        </div>

        {/* 2. Mini Budget Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3 shadow-xs">
          <div className="p-2 bg-slate-50 border border-slate-100 rounded">
            <HelpCircle className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">TOTAL USULAN (PROPOSED)</span>
            <span className="text-sm font-mono font-bold text-slate-700">{formatRp(proposedTotal)}</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3 shadow-xs">
          <div className="p-2 bg-red-50 border border-red-100 rounded">
            <CheckCircle className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">DISETUJUI (APPROVED REALISASI)</span>
            <span className="text-sm font-mono font-bold text-slate-800">{formatRp(approvedTotal)}</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3 shadow-xs">
          <div className="p-2 bg-emerald-50 border border-emerald-100 rounded">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Buku Belanja Terbayar</span>
            <span className="text-sm font-mono font-bold text-emerald-700">
              {formatRp(
                keuangan
                  .filter(t => t.type === 'Keluar' && t.category === 'RKBA Belanja')
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Visualisasi RKBA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm break-inside-avoid">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
            Anggaran per Seksi
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rkbaChartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="seksi" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis 
                  tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(1)}Jt`} 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(value: any) => formatRp(Number(value) || 0)}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="usulan" name="Total Usulan" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="realisasi" name="Disetujui/Belanja" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm break-inside-avoid">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
            Proporsi Sumber Dana (Disetujui)
          </h3>
          <div className="h-64 w-full">
            {rkbaSourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rkbaSourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {rkbaSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => formatRp(Number(value) || 0)}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs font-medium">
                Belum ada data disetujui.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. RKBA Items Table list */}
      {isModal ? (
        <div className="space-y-8 mt-8">
          {safeSettings.seksiList.map(seksi => {
            const seksiItems = filteredRKBA.filter(item => item.seksi === seksi);
            if (seksiItems.length === 0) return null;
            const subTotal = seksiItems.reduce((sum, item) => sum + item.total, 0);
            return (
              <div key={seksi} className="break-inside-avoid">
                <h3 className="text-xs font-bold bg-slate-100 p-2 border border-slate-300 uppercase tracking-wide">
                  SEKSI: {seksi}
                </h3>
                <table className="w-full text-left border-collapse border border-slate-300 mt-2">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider border-b-2 border-slate-300">
                      <th className="px-3 py-2 border-r border-slate-300 w-10 text-center">No</th>
                      <th className="px-3 py-2 border-r border-slate-300">Kebutuhan / Uraian</th>
                      <th className="px-3 py-2 border-r border-slate-300 w-24 text-center">Vol</th>
                      <th className="px-3 py-2 border-r border-slate-300 w-32 text-right">Harga Satuan (Rp)</th>
                      <th className="px-3 py-2 border-r border-slate-300 w-32 text-right">Jumlah (Rp)</th>
                      <th className="px-3 py-2 w-28 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {seksiItems.map((item, idx) => (
                      <tr key={item.id} className="border-b border-slate-200">
                        <td className="px-3 py-2 border-r border-slate-300 text-center">{idx + 1}</td>
                        <td className="px-3 py-2 border-r border-slate-300">{item.name}</td>
                        <td className="px-3 py-2 border-r border-slate-300 text-center">{item.qty} {item.unit}</td>
                        <td className="px-3 py-2 border-r border-slate-300 text-right">{formatRp(item.price).replace("Rp ", "")}</td>
                        <td className="px-3 py-2 border-r border-slate-300 text-right font-semibold">{formatRp(item.total).replace("Rp ", "")}</td>
                        <td className="px-3 py-2 text-center text-[10px]">{item.status}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                      <td colSpan={4} className="px-3 py-2 border-r border-slate-300 text-right uppercase tracking-wider text-[11px]">Subtotal {seksi}</td>
                      <td className="px-3 py-2 border-r border-slate-300 text-right">{formatRp(subTotal)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
          
          <div className="mt-8 border-4 border-slate-900 p-4 bg-slate-50 flex justify-between items-center break-inside-avoid">
            <span className="text-sm font-black uppercase tracking-widest">TOTAL KESELURUHAN RAB</span>
            <span className="text-lg font-black font-mono">{formatRp(filteredRKBA.reduce((sum, i) => sum + i.total, 0))}</span>
          </div>
          
          <div className="mt-16 grid grid-cols-2 gap-8 text-center text-sm font-serif break-inside-avoid pb-8">
            <div>
              <p className="mb-16">Mengetahui,<br/>Ketua Panitia</p>
              <p className="font-bold underline">_________________</p>
            </div>
            <div>
              <p className="mb-16">Disetujui Oleh,<br/>Ketua RW 04 Ngabean</p>
              <p className="font-bold underline">_________________</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-900 font-sans text-[10px] uppercase tracking-wider border-b-2 border-slate-900 font-bold print:bg-white print:border-b-2 print:border-black">
                <th className="px-3 py-3 text-left">Kode</th>
                <th className="px-4 py-3 text-left">Kebutuhan & Uraian</th>
                <th className="px-3 py-3 text-left">Volume</th>
                <th className="px-3 py-3 text-left text-right">Harga Satuan</th>
                <th className="px-4 py-3 text-left text-right">Total (RAB Awal)</th>
                <th className="px-3 py-3 text-left">Sumber</th>
                <th className="px-3 py-3 text-left">Status</th>
                {!isModal && !isReadOnly && <th className="px-4 py-3 text-left print:hidden">Aksi & Tata Kelola</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-900">
              {(isModal ? filteredRKBA : currentItems).map((item, idx) => {
                const isLocked = item.isLockedBaseline || item.status === 'Disetujui' || item.status === 'Belanja';
                const actStatus = item.activityStatus || (isLocked ? 'BERJALAN' : 'RENCANA');

                return (
                  <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                    <td className="px-3 py-3 font-mono text-[10px] font-bold text-slate-700 border-r border-slate-100 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                        {item.activityCode || `ACT-${String(idx + 1).padStart(3, '0')}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100">
                      <div className="font-semibold text-slate-950 flex items-center gap-1.5">
                        {item.name}
                        {isLocked && (
                          <span title="Historical Baseline Terkunci" className="inline-flex items-center text-slate-400">
                            <Lock className="w-3 h-3 text-slate-500" />
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-slate-600">{item.seksi}</span>
                        {item.notes && <span className="italic text-slate-400">"{item.notes}"</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono border-r border-slate-100 whitespace-nowrap">
                      {item.qty} {item.unit}
                    </td>
                    <td className="px-3 py-3 font-mono border-r border-slate-100 text-right whitespace-nowrap">
                      {formatRp(item.price)}
                    </td>
                    <td className="px-4 py-3 font-semibold font-mono border-r border-slate-100 text-right text-indigo-700 whitespace-nowrap">
                      {formatRp(item.total)}
                    </td>
                    <td className="px-3 py-3 text-[10px] border-r border-slate-100 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-medium">
                        {item.fundingSource}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono font-medium text-[10px] border-r border-slate-100 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-center font-bold ${
                          item.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' : 
                          item.status === 'Belanja' ? 'bg-blue-100 text-blue-700' : 
                          item.status === 'Ditolak' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {item.status}
                        </span>
                        {actStatus && actStatus !== 'RENCANA' && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-center ${
                            actStatus === 'DITIADAKAN' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                            actStatus === 'DITAMBAHKAN' ? 'bg-sky-100 text-sky-700 border border-sky-200' :
                            actStatus === 'DIALIHKAN' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {actStatus}
                          </span>
                        )}
                      </div>
                    </td>
                    {!isModal && !isReadOnly && (
                      <td className="px-4 py-3 print:hidden">
                        {!isLocked ? (
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => handleOpenEdit(item)} 
                              title="Edit Usulan"
                              className="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(item)} 
                              title="Hapus Usulan"
                              className="p-1.5 text-red-600 hover:text-red-800 bg-red-50 rounded hover:bg-red-100 transition-colors"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleApprove(item)} 
                              title="Sahkan & Kunci Baseline"
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 bg-emerald-50 rounded hover:bg-emerald-100 transition-colors flex items-center gap-1 text-[10px] font-bold"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Sahkan</span>
                            </button>
                            <button 
                              onClick={() => handleReject(item)} 
                              title="Tolak Usulan"
                              className="p-1.5 text-red-600 hover:text-red-800 bg-red-50 rounded hover:bg-red-100 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded border border-slate-200">
                              <Lock className="w-3 h-3 text-slate-500" />
                              Baseline Sah
                            </span>
                            {onNavigateView && (
                              <button
                                onClick={() => onNavigateView('perubahan-anggaran', { activityId: item.id })}
                                title="Ajukan Perubahan Anggaran"
                                className="px-2 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded text-[10px] font-bold transition-colors"
                              >
                                Perubahan
                              </button>
                            )}
                            {onNavigateView && (
                              <button
                                onClick={() => onNavigateView('realokasi-anggaran', { sourceActivityId: item.id })}
                                title="Ajukan Realokasi Anggaran"
                                className="px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded text-[10px] font-bold transition-colors"
                              >
                                Realokasi
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {(isModal ? filteredRKBA : currentItems).length === 0 && (
                <tr>
                  <td colSpan={isModal || isReadOnly ? 7 : 8} className="text-center py-6 text-slate-400 font-sans">
                    Tidak ada item anggaran yang sesuai dengan kriteria pencarian / saringan saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Pagination is hidden in print modal */}
          {!isModal && totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-[11px] font-bold text-slate-600 hover:text-red-700 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <span className="text-[11px] text-slate-500">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="text-[11px] font-bold text-slate-600 hover:text-red-700 disabled:opacity-50"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const toggleExpandAI = (id: string) => {
    setExpandedAI(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Calculations
  const proposedTotal = rkba.reduce((acc, r) => acc + r.total, 0);
  const approvedTotal = rkba.filter(r => r.status === 'Disetujui' || r.status === 'Belanja').reduce((acc, r) => acc + r.total, 0);
  
  // Filter items
  const filteredRKBA = rkba.filter(item => {
    const matchSeksi = filterSeksi === "Semua" || item.seksi === filterSeksi;
    const matchStatus = filterStatus === "Semua" || item.status === filterStatus;
    const matchSource = filterSource === "Semua" || item.fundingSource === filterSource;
    const matchSearch = searchQuery.trim() === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.activityCode && item.activityCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.seksi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSeksi && matchStatus && matchSource && matchSearch;
  });

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterSeksi, filterStatus, filterSource, searchQuery, rkba]);

  // Data for chart
  const rkbaChartData = React.useMemo(() => {
    const seksiMap = new Map<string, { seksi: string, usulan: number, realisasi: number }>();
    rkba.forEach(item => {
      const seksi = item.seksi;
      if (!seksiMap.has(seksi)) {
        seksiMap.set(seksi, { seksi, usulan: 0, realisasi: 0 });
      }
      const current = seksiMap.get(seksi)!;
      current.usulan += item.total;
      
      if (item.status === 'Disetujui' || item.status === 'Belanja') {
        current.realisasi += item.total;
      }
    });
    return Array.from(seksiMap.values());
  }, [rkba]);

  const rkbaSourceData = React.useMemo(() => {
    const sourceMap = new Map<string, number>();
    rkba.forEach(item => {
      if (item.status === 'Disetujui' || item.status === 'Belanja') {
        const source = item.fundingSource || 'Lainnya';
        sourceMap.set(source, (sourceMap.get(source) || 0) + item.total);
      }
    });
    return Array.from(sourceMap.entries()).map(([name, value]) => ({ name, value }));
  }, [rkba]);

  const COLORS = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRKBA.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRKBA.length / itemsPerPage);

  const handleOpenAdd = () => {
    setEditingItem(null);
    const nextCode = `ACT-${String(rkba.length + 1).padStart(3, '0')}`;
    setForm({
      activityCode: nextCode,
      name: "",
      seksi: safeSettings.seksiList[0] || "Acara",
      qty: 1,
      unit: "Pcs",
      price: 10000,
      fundingSource: "Kas Utama",
      status: "Draft",
      activityStatus: "RENCANA",
      notes: ""
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: RKBAItem) => {
    if (item.isLockedBaseline || item.status === 'Disetujui' || item.status === 'Belanja') {
      alert(`Item '${item.name}' telah disahkan sebagai Baseline RAB Awal (Terkunci).\n\nUntuk menjaga keabsahan audit trail keuangan, perubahan volume, harga satuan, atau peniadaan kegiatan harus diajukan melalui modul 'Perubahan Anggaran' atau 'Realokasi Anggaran'.`);
      return;
    }
    setEditingItem(item);
    setForm({
      activityCode: item.activityCode || "",
      name: item.name,
      seksi: item.seksi,
      qty: item.qty,
      unit: item.unit,
      price: item.price,
      fundingSource: item.fundingSource,
      status: item.status,
      activityStatus: item.activityStatus || 'RENCANA',
      notes: item.notes
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = editingItem ? 'edit' : 'add';
    const payload: RKBAItem = {
      ...form,
      id: editingItem ? editingItem.id : "",
      activityCode: form.activityCode || (editingItem?.activityCode || `ACT-${String(rkba.length + 1).padStart(3, '0')}`),
      total: form.qty * form.price,
      dateAdded: editingItem ? editingItem.dateAdded : new Date().toISOString().split('T')[0],
      isLockedBaseline: editingItem ? editingItem.isLockedBaseline : false
    };
    await onSaveRKBA(action, payload);
    setShowModal(false);
  };

  const handleDelete = async (item: RKBAItem) => {
    if (item.isLockedBaseline || item.status === 'Disetujui' || item.status === 'Belanja') {
      alert(`Item '${item.name}' merupakan historical baseline yang telah disahkan dan tidak boleh dihapus secara langsung.\n\nSilakan gunakan menu 'Perubahan Anggaran' dengan jenis perubahan 'DITIADAKAN' agar peniadaan tercatat dalam risalah audit.`);
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus usulan draf '${item.name}' dari daftar RKBA?`)) {
      await onSaveRKBA('delete', item);
    }
  };

  const handleApprove = async (item: RKBAItem) => {
    await onSaveRKBA('approve', item);
  };

  const handleReject = async (item: RKBAItem) => {
    await onSaveRKBA('reject', item);
  };

  const handleAnalyzeBudget = async () => {
    setIsAIModalOpen(true);
    setIsAnalyzing(true);
    setAiAnalysisResult("");
    try {
      const response = await fetch("/api/sems/analyze-budget-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rkba, keuangan, kegiatan, settings })
      });
      const data = await response.json();
      if (data.success) {
        setAiAnalysisResult(data.analysis);
      } else {
        setAiAnalysisResult("Gagal menganalisis anggaran: " + data.error);
      }
    } catch (err: any) {
      setAiAnalysisResult("Terjadi kesalahan jaringan: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatRp = (num: number) => {
    return "Rp " + num.toLocaleString("id-ID");
  };

  return (
    <div className="space-y-5">
      
      {/* 1. Header & Summary Grid */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
            <FileSpreadsheet className="w-4 h-4 text-red-600" />
            RKBA Awal (Rencana Kebutuhan Barang & Anggaran Baseline)
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Baseline anggaran awal kepanitiaan. Item yang telah disahkan dikunci secara permanen untuk memelihara integritas audit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <button
            onClick={handleAnalyzeBudget}
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold px-3 py-1.5 rounded shadow-xs transition-all duration-150 self-start md:self-auto uppercase tracking-wide cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Smart Budget
          </button>
          {!isReadOnly && (
            <button
              id="btn-add-rkba"
              onClick={handleOpenAdd}
              className="flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold px-3 py-1.5 rounded shadow-xs transition-all duration-150 self-start md:self-auto uppercase tracking-wide cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Ajukan Usulan Awal
            </button>
          )}
        </div>
      </div>

      {/* Governance & Baseline Policy Callout */}
      <div className="bg-slate-900 text-white p-3.5 rounded-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-2.5">
          <div className="p-2 bg-slate-800 rounded-md text-amber-400 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
              Prinsip Tata Kelola: RAB Awal adalah Historical Record (Baseline)
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                Immutability Rule
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Seluruh item RAB yang telah berstatus <strong className="text-slate-200">Disetujui</strong> dikunci sebagai baseline. Segala penambahan kegiatan, peniadaan, perubahan kuantitas/harga, atau pergeseran anggaran antar-seksi wajib melalui modul <strong className="text-sky-300">Perubahan Anggaran</strong> atau <strong className="text-purple-300">Realokasi</strong> dengan dasar Notulen Rapat.
            </p>
          </div>
        </div>
        {onNavigateView && (
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              onClick={() => onNavigateView('perubahan-anggaran')}
              className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold rounded flex items-center gap-1 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Perubahan Anggaran
            </button>
            <button
              onClick={() => onNavigateView('realokasi-anggaran')}
              className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold rounded flex items-center gap-1 transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Realokasi
            </button>
          </div>
        )}
      </div>

      {/* 3. Filtering Toolbar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap items-center gap-3 shadow-xs no-print">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Saring:</span>
        </div>

        {/* Search Filter */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode (ACT-...), nama kebutuhan, seksi..."
            className="w-full pl-8 pr-3 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Seksi Filter */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Seksi:</span>
          <select
            value={filterSeksi}
            onChange={(e) => setFilterSeksi(e.target.value)}
            className="text-[11px] bg-slate-50 border border-slate-200 focus:outline-none focus:border-red-500 rounded p-1 text-slate-700 font-semibold"
          >
            <option value="Semua">Semua Seksi</option>
            {safeSettings.seksiList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-[11px] bg-slate-50 border border-slate-200 focus:outline-none focus:border-red-500 rounded p-1 text-slate-700 font-semibold"
          >
            <option value="Semua">Semua Status</option>
            <option value="Draft">Draft</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Belanja">Belanja</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>

        {/* Source Filter */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Sumber Dana:</span>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="text-[11px] bg-slate-50 border border-slate-200 focus:outline-none focus:border-red-500 rounded p-1 text-slate-700 font-semibold"
          >
            <option value="Semua">Semua Sumber Dana</option>
            <option value="Kas Utama">Kas Utama</option>
            <option value="Donasi Warga">Donasi Warga</option>
            <option value="Iuran RT">Iuran RT</option>
            <option value="Sponsorship">Sponsorship</option>
          </select>
        </div>

        {/* Clear filter shortcut */}
        {(filterSeksi !== "Semua" || filterStatus !== "Semua" || filterSource !== "Semua" || searchQuery.trim() !== "") && (
          <button
            onClick={() => {
              setFilterSeksi("Semua");
              setFilterStatus("Semua");
              setFilterSource("Semua");
              setSearchQuery("");
            }}
            className="text-[11px] text-red-600 hover:text-red-800 font-bold ml-auto font-sans cursor-pointer"
          >
            Reset Filter
          </button>
        )}
      </div>

      {renderPrintableContent(false)}

      <div id="printable-rkba-area" className="hidden print:block">
        {renderPrintableContent(true)}
      </div>

      <PDFPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        title="Pratinjau Laporan RKBA" 
        onDownload={handleExportPDF}
        onExportWord={handleExportWord}
      >
        {renderPrintableContent(true)}
      </PDFPreviewModal>



        {/* 5. ADD/EDIT ITEM MODAL */}
       {showModal && (
         <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
           <div className="bg-white rounded-lg w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
             <div className="bg-red-750 text-white px-4 py-3 border-b border-red-850 flex justify-between items-center">
               <h3 className="font-sans font-bold text-xs uppercase tracking-wider">
                 {editingItem ? "Ubah Pengajuan Anggaran RKBA" : "Buat Usulan Kebutuhan Anggaran (RKBA)"}
               </h3>
               <button 
                 id="close-rkba-modal"
                 onClick={() => setShowModal(false)}
                 className="text-white/85 hover:text-white font-bold text-sm"
               >
                 ✕
               </button>
             </div>
             <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
               <div className="grid grid-cols-3 gap-3">
                 <div>
                   <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kode Kegiatan</label>
                   <input
                     type="text"
                     required
                     value={form.activityCode}
                     onChange={(e) => setForm({ ...form, activityCode: e.target.value })}
                     className="w-full text-xs font-mono border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50 font-bold"
                     placeholder="ACT-001"
                   />
                 </div>
                 <div className="col-span-2">
                   <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Barang / Kebutuhan</label>
                   <input
                     type="text"
                     required
                     value={form.name}
                     onChange={(e) => setForm({ ...form, name: e.target.value })}
                     className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50"
                     placeholder="Misal: Hadiah Piala Juara 1 Sepak Bola"
                   />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Seksi Penanggungjawab</label>
                   <select
                     value={form.seksi}
                     onChange={(e) => setForm({ ...form, seksi: e.target.value })}
                     className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50"
                   >
                     {safeSettings.seksiList.map(s => (
                       <option key={s} value={s}>{s}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sumber Pendanaan</label>
                   <select
                     value={form.fundingSource}
                     onChange={(e) => setForm({ ...form, fundingSource: e.target.value as any })}
                     className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50 font-semibold"
                   >
                     <option value="Kas Utama">Kas Utama</option>
                     <option value="Donasi Warga">Donasi Warga</option>
                     <option value="Iuran RT">Iuran RT</option>
                     <option value="Sponsorship">Sponsorship</option>
                   </select>
                 </div>
               </div>

               <div className="grid grid-cols-3 gap-3">
                 <div>
                   <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kuantitas</label>
                   <input
                     type="number"
                     required
                     min="1"
                     value={form.qty}
                     onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
                     className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50 text-center font-mono"
                   />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Satuan</label>
                   <input
                     type="text"
                     required
                     value={form.unit}
                     onChange={(e) => setForm({ ...form, unit: e.target.value })}
                     className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50 text-center"
                     placeholder="Pcs/Kotak/m2"
                   />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Harga Satuan (Rp)</label>
                   <input
                     type="number"
                     required
                     min="0"
                     value={form.price}
                     onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                     className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50 text-right font-mono"
                   />
                 </div>
               </div>

               <div className="p-2.5 bg-red-50 rounded border border-red-150 flex justify-between items-center text-xs">
                 <span className="font-bold text-red-800 uppercase tracking-wider text-[10px]">Total Estimasi Anggaran:</span>
                 <span className="font-extrabold text-red-700 font-mono text-xs">{formatRp(form.qty * form.price)}</span>
               </div>

               <div>
                 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Keterangan / Spesifikasi</label>
                 <textarea
                   value={form.notes}
                   onChange={(e) => setForm({ ...form, notes: e.target.value })}
                   className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50 h-14 resize-none"
                   placeholder="Keterangan tambahan barang atau jasa..."
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
                   id="btn-submit-rkba"
                   className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded shadow-xs transition-colors"
                 >
                   {editingItem ? "Simpan Perubahan" : "Ajukan RKBA"}
                 </button>
               </div>
             </form>
           </div>
        </div>
      )}

      {/* 6. AI SMART BUDGET MODAL */}
      {isAIModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-amber-500 text-white px-5 py-4 flex justify-between items-center">
              <h3 className="font-sans font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Smart Budget Analysis
              </h3>
              <button 
                onClick={() => setIsAIModalOpen(false)}
                className="text-white/80 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mb-4"></div>
                  <p className="text-sm font-semibold animate-pulse">AI sedang menganalisis kewajaran harga & proporsi anggaran...</p>
                </div>
              ) : (
                <div className="prose prose-sm prose-slate max-w-none 
                  prose-headings:font-bold prose-headings:text-slate-800 
                  prose-h1:text-lg prose-h2:text-md prose-h3:text-sm 
                  prose-p:text-slate-600 prose-li:text-slate-600
                  prose-strong:text-slate-800 prose-strong:font-bold"
                >
                  <div dangerouslySetInnerHTML={{ 
                    __html: aiAnalysisResult
                      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>')
                      .replace(/<\/ul>\n<ul>/gim, '')
                      .replace(/\n/g, '<br/>')
                  }} />
                </div>
              )}
            </div>
            
            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsAIModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded shadow-xs transition-colors uppercase tracking-wide"
              >
                Tutup Analisis
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
