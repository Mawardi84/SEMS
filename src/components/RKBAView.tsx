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
  TrendingDown
} from "lucide-react";
import { RKBAItem, SystemSetting, KeuanganTransaction } from "../types";

interface RKBAViewProps {
  rkba: RKBAItem[];
  settings: SystemSetting;
  keuangan: KeuanganTransaction[];
  onSaveRKBA: (action: 'add' | 'edit' | 'delete' | 'approve' | 'reject', data: RKBAItem) => Promise<void>;
  onBelanjaItem: (rkbaId: string) => Promise<void>;
  isRecordingBelanjaId: string | null;
}

export default function RKBAView({
  rkba,
  settings,
  keuangan,
  onSaveRKBA,
  onBelanjaItem,
  isRecordingBelanjaId
}: RKBAViewProps) {
  // Filter States
  const [filterSeksi, setFilterSeksi] = useState<string>("Semua");
  const [filterStatus, setFilterStatus] = useState<string>("Semua");
  const [filterSource, setFilterSource] = useState<string>("Semua");

  // Form / Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RKBAItem | null>(null);
  const [form, setForm] = useState<Omit<RKBAItem, 'id' | 'total' | 'dateAdded'>>({
    name: "",
    seksi: settings.seksiList[0] || "Acara",
    qty: 1,
    unit: "Pcs",
    price: 10000,
    fundingSource: "Kas Utama",
    status: "Draft",
    notes: ""
  });

  // Expanded AI Feedback states (id to boolean map)
  const [expandedAI, setExpandedAI] = useState<Record<string, boolean>>({});

  const toggleExpandAI = (id: string) => {
    setExpandedAI(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Calculations
  const proposedTotal = rkba.reduce((acc, r) => acc + r.total, 0);
  const approvedTotal = rkba.filter(r => r.status === 'Disetujui').reduce((acc, r) => acc + r.total, 0);
  
  // Filter items
  const filteredRKBA = rkba.filter(item => {
    const matchSeksi = filterSeksi === "Semua" || item.seksi === filterSeksi;
    const matchStatus = filterStatus === "Semua" || item.status === filterStatus;
    const matchSource = filterSource === "Semua" || item.fundingSource === filterSource;
    return matchSeksi && matchStatus && matchSource;
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      name: "",
      seksi: settings.seksiList[0] || "Acara",
      qty: 1,
      unit: "Pcs",
      price: 10000,
      fundingSource: "Kas Utama",
      status: "Draft",
      notes: ""
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: RKBAItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      seksi: item.seksi,
      qty: item.qty,
      unit: item.unit,
      price: item.price,
      fundingSource: item.fundingSource,
      status: item.status,
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
      total: form.qty * form.price,
      dateAdded: editingItem ? editingItem.dateAdded : new Date().toISOString().split('T')[0]
    };
    await onSaveRKBA(action, payload);
    setShowModal(false);
  };

  const handleDelete = async (item: RKBAItem) => {
    if (confirm(`Apakah Anda yakin ingin menghapus '${item.name}' dari daftar RKBA?`)) {
      await onSaveRKBA('delete', item);
    }
  };

  const handleApprove = async (item: RKBAItem) => {
    await onSaveRKBA('approve', item);
  };

  const handleReject = async (item: RKBAItem) => {
    await onSaveRKBA('reject', item);
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
            RKBA (Rencana Kebutuhan Barang & Anggaran)
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Pengajuan kebutuhan, penganggaran seksi, audit kelayakan anggaran, serta persetujuan bendahara & ketua panitia.
          </p>
        </div>
        <button
          id="btn-add-rkba"
          onClick={handleOpenAdd}
          className="flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold px-3 py-1.5 rounded shadow-xs transition-all duration-150 self-start md:self-auto uppercase tracking-wide"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajukan Kebutuhan Anggaran
        </button>
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

      {/* 3. Filtering Toolbar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap items-center gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Saring:</span>
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
            {settings.seksiList.map(s => (
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
        {(filterSeksi !== "Semua" || filterStatus !== "Semua" || filterSource !== "Semua") && (
          <button
            onClick={() => {
              setFilterSeksi("Semua");
              setFilterStatus("Semua");
              setFilterSource("Semua");
            }}
            className="text-[11px] text-red-600 hover:text-red-800 font-bold ml-auto font-sans"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* 4. RKBA Items Table list */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-sans text-[10px] uppercase tracking-wider border-b border-slate-200 font-bold">
              <th className="px-4 py-2 font-bold text-slate-600">Kebutuhan / Seksi</th>
              <th className="px-4 py-2 font-bold text-slate-600">Volume</th>
              <th className="px-4 py-2 font-bold text-slate-600">Harga Satuan</th>
              <th className="px-4 py-2 font-bold text-slate-600">Total Kebutuhan</th>
              <th className="px-4 py-2 font-bold text-slate-600">Sumber Dana</th>
              <th className="px-4 py-2 font-bold text-slate-600">Status</th>
              <th className="px-4 py-2 font-bold text-slate-600 text-right">Menu / Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {filteredRKBA.map((item) => {
              const hasBeenSpent = keuangan.some(t => t.refId === item.id);
              const statusMap = {
                "Draft": "bg-slate-100 text-slate-600 border-slate-200",
                "Disetujui": "bg-red-100 text-red-700 border-red-200",
                "Ditolak": "bg-rose-50 text-rose-600 border-rose-100"
              };



              return (
                <React.Fragment key={item.id}>
                  <tr className="hover:bg-slate-50/40 transition-colors duration-150">
                    <td className="px-4 py-2">
                      <div>
                        <span className="font-bold text-slate-800 text-xs block">{item.name}</span>
                        <span className="text-[10px] font-mono font-medium text-slate-400 mt-0.5 block">
                          Seksi: {item.seksi}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 font-mono text-slate-600 font-bold">
                      {item.qty} {item.unit}
                    </td>
                    <td className="px-4 py-2 font-mono text-slate-500">
                      {formatRp(item.price)}
                    </td>
                    <td className="px-4 py-2 font-bold font-mono text-slate-800">
                      {formatRp(item.total)}
                    </td>
                    <td className="px-4 py-2">
                      <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold border border-indigo-100 px-1.5 py-0.5 rounded">
                        {item.fundingSource}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${statusMap[item.status]}`}>
                        {item.status}
                      </span>
                    </td>

                     {/* MENU & ACTIONS */}
                     <td className="px-4 py-2 text-right">
                       <div className="flex justify-end items-center gap-1">
                         
                         {/* Approval workflow buttons for leadership */}
                         {item.status === 'Draft' && (
                           <>
                             <button
                               id={`approve-btn-${item.id}`}
                               onClick={() => handleApprove(item)}
                               title="Setujui Anggaran"
                               className="p-1 text-emerald-600 hover:bg-emerald-50 rounded border border-emerald-100"
                             >
                               <CheckCircle className="w-3.5 h-3.5" />
                             </button>
                             <button
                               id={`reject-btn-${item.id}`}
                               onClick={() => handleReject(item)}
                               title="Tolak Anggaran"
                               className="p-1 text-rose-600 hover:bg-rose-50 rounded border border-rose-100"
                             >
                               <XCircle className="w-3.5 h-3.5" />
                             </button>
                           </>
                         )}

                         {/* RECORD BELANJA (SINGLE-CLICK TRANSAKSI) */}
                         {item.status === 'Disetujui' && (
                           <button
                             id={`belanja-btn-${item.id}`}
                             onClick={() => onBelanjaItem(item.id)}
                             disabled={hasBeenSpent || isRecordingBelanjaId === item.id}
                             className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-sans border transition-all ${
                               hasBeenSpent 
                                 ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                                 : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-xs"
                             }`}
                           >
                             <ShoppingBag className="w-3 h-3 shrink-0" />
                             <span>
                               {hasBeenSpent 
                                 ? "Dibukukan" 
                                 : isRecordingBelanjaId === item.id 
                                   ? "Membukukan..." 
                                   : "Belanjakan"}
                             </span>
                           </button>
                         )}

                         {/* Edit and Trash */}
                         <button
                           id={`edit-rkba-${item.id}`}
                           onClick={() => handleOpenEdit(item)}
                           className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"
                         >
                           <Edit className="w-3.5 h-3.5" />
                         </button>
                         <button
                           id={`delete-rkba-${item.id}`}
                           onClick={() => handleDelete(item)}
                           className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                         >
                           <Trash className="w-3.5 h-3.5" />
                         </button>

                       </div>
                     </td>
                   </tr>

                 </React.Fragment>
               );
             })}
             {filteredRKBA.length === 0 && (
               <tr>
                 <td colSpan={7} className="text-center py-6 text-slate-400 font-sans">
                   Tidak ada item anggaran yang sesuai dengan filter saringan saat ini.
                 </td>
               </tr>
             )}
           </tbody>
         </table>
       </div>

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
               <div>
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

               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Seksi Penanggungjawab</label>
                   <select
                     value={form.seksi}
                     onChange={(e) => setForm({ ...form, seksi: e.target.value })}
                     className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50"
                   >
                     {settings.seksiList.map(s => (
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

    </div>
  );
}
