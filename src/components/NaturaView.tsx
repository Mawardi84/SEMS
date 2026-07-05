import React, { useState } from "react";
import { 
  Gift, 
  Plus, 
  Edit, 
  Trash, 
  Heart, 
  Calendar, 
  Coins, 
  User, 
  Tag, 
  Layers, 
  Info,
  Download
} from "lucide-react";
import { NaturaItem, SystemSetting } from "../types";
import { exportToPDF } from "../utils/pdfExport";

interface NaturaViewProps {
  natura: NaturaItem[];
  settings: SystemSetting;
  onSaveNatura: (action: 'add' | 'edit' | 'delete', data: NaturaItem) => Promise<void>;
}

export default function NaturaView({
  natura,
  settings,
  onSaveNatura
}: NaturaViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<NaturaItem | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    await exportToPDF("printable-natura-area", `Laporan-Swadaya-Natura-${new Date().toISOString().split('T')[0]}.pdf`);
    setIsExportingPDF(false);
  };
  
  const [form, setForm] = useState<Omit<NaturaItem, 'id'>>({
    donorName: "",
    rt: settings.rtList[0] || "RT 01",
    item: "",
    qty: 1,
    unit: "Dus",
    estimatedValue: 50000,
    allocation: "Konsumsi",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  const totalNaturaValue = natura.reduce((sum, n) => sum + n.estimatedValue, 0);
  const totalDonors = new Set(natura.map(n => n.donorName)).size;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      donorName: "",
      rt: settings.rtList[0] || "RT 01",
      item: "",
      qty: 1,
      unit: "Dus",
      estimatedValue: 50000,
      allocation: "Konsumsi",
      date: new Date().toISOString().split('T')[0],
      notes: ""
    });
    setShowModal(true);
  };

  const handleOpenEdit = (n: NaturaItem) => {
    setEditingItem(n);
    setForm({
      donorName: n.donorName,
      rt: n.rt,
      item: n.item,
      qty: n.qty,
      unit: n.unit,
      estimatedValue: n.estimatedValue,
      allocation: n.allocation,
      date: n.date,
      notes: n.notes
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = editingItem ? 'edit' : 'add';
    const payload: NaturaItem = {
      ...form,
      id: editingItem ? editingItem.id : ""
    };
    await onSaveNatura(action, payload);
    setShowModal(false);
  };

  const handleDelete = async (n: NaturaItem) => {
    if (confirm(`Apakah Anda yakin ingin menghapus sumbangan Natura '${n.item}' dari '${n.donorName}'?`)) {
      await onSaveNatura('delete', n);
    }
  };

  const formatRp = (num: number) => {
    return "Rp " + num.toLocaleString("id-ID");
  };

  return (
    <div className="space-y-5">
      
      {/* 1. Header with Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
            <Gift className="w-4 h-4 text-red-600" />
            Kontribusi In-Kind (Natura) Warga
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Catat sumbangan warga berupa barang operasional, makanan, ataupun minuman demi menghemat kas tunai panitia.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold px-3 py-1.5 rounded border border-slate-200 shadow-xs transition-all duration-150 uppercase tracking-wide cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            {isExportingPDF ? "Mengekspor..." : "Ekspor PDF"}
          </button>
          <button
            id="btn-add-natura"
            onClick={handleOpenAdd}
            className="flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold px-3 py-1.5 rounded shadow-xs transition-all duration-150 uppercase tracking-wide cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Catat Sumbangan Natura
          </button>
        </div>
      </div>

      {/* Printable Wrapper for High-Fidelity PDF Export */}
      <div id="printable-natura-area" className="space-y-4 bg-white p-6 rounded-lg border border-slate-200">
        
        {/* Printable Document Title Header */}
        <div className="border-b-[3px] border-double border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xs font-black font-serif tracking-wide uppercase text-slate-950">
              LAPORAN KONTRIBUSI IN-KIND (NATURA) WARGA
            </h1>
            <p className="text-[9px] text-slate-500 font-serif">
              Sistem Manajemen Event Kemasyarakatan (SEMS) RW 04 Ngabean • HUT RI Ke-81
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[9px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 block">
              Tanggal Cetak: {new Date().toLocaleDateString("id-ID")}
            </span>
          </div>
        </div>

      {/* 2. Mini KPI summary widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">TOTAL ESTIMASI NILAI</span>
            <span className="text-base font-bold font-mono text-slate-800">{formatRp(totalNaturaValue)}</span>
          </div>
          <div className="bg-red-50 p-2 rounded text-red-600 border border-red-100">
            <Coins className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">TOTAL DONASI NATURA</span>
            <span className="text-base font-bold font-mono text-slate-800">{natura.length} Unit Barang</span>
          </div>
          <div className="bg-amber-50 p-2 rounded text-amber-600 border border-amber-100">
            <Heart className="w-4 h-4 fill-amber-50" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">DONATUR TERLIBAT</span>
            <span className="text-base font-bold font-mono text-slate-800">{totalDonors} Warga RW 04</span>
          </div>
          <div className="bg-indigo-50 p-2 rounded text-indigo-600 border border-indigo-100">
            <User className="w-4 h-4" />
          </div>
        </div>

      </div>

      <div className="bg-amber-50/55 p-3 rounded-lg border border-amber-100 flex gap-2.5 text-xs text-amber-800 leading-normal no-print">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p>
          <strong className="font-bold">Info Penghematan Kas:</strong> Setiap sumbangan Natura memiliki <strong className="font-bold">Estimasi Nilai Rp</strong>. Angka ini mewakili biaya yang berhasil dihemat oleh panitia karena tidak perlu membeli barang tersebut dari Kas Utama. Transparansi ini akan dilampirkan otomatis pada modul LPJ AI.
        </p>
      </div>

      {/* 3. Table lists of Natura */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-sans text-[10px] uppercase tracking-wider border-b border-slate-200 font-bold">
              <th className="px-4 py-2 font-bold text-slate-600">Donatur / RT</th>
              <th className="px-4 py-2 font-bold text-slate-600">Barang Sumbangan</th>
              <th className="px-4 py-2 font-bold text-slate-600">Kuantitas / Volume</th>
              <th className="px-4 py-2 font-bold text-slate-600">Estimasi Nilai Rp</th>
              <th className="px-4 py-2 font-bold text-slate-600">Alokasi Manfaat</th>
              <th className="px-4 py-2 font-bold text-slate-600">Tanggal Masuk</th>
              <th className="px-4 py-2 font-bold text-slate-600">Keterangan</th>
              <th className="px-4 py-2 font-bold text-slate-600 text-right no-print">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {natura.map((n) => (
              <tr key={n.id} className="hover:bg-slate-50/40 transition-colors duration-150">
                <td className="px-4 py-2">
                  <div>
                    <span className="font-bold text-slate-800 block">{n.donorName}</span>
                    <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">{n.rt}</span>
                  </div>
                </td>
                <td className="px-4 py-2 font-bold text-slate-800">
                  {n.item}
                </td>
                <td className="px-4 py-2 font-mono text-slate-600 font-bold">
                  {n.qty} {n.unit}
                </td>
                <td className="px-4 py-2 font-bold font-mono text-slate-800">
                  {formatRp(n.estimatedValue)}
                </td>
                <td className="px-4 py-2">
                  <span className="bg-red-50 border border-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded text-[9px]">
                    {n.allocation}
                  </span>
                </td>
                <td className="px-4 py-2 font-mono text-slate-500">
                  {n.date}
                </td>
                <td className="px-4 py-2 text-slate-500 italic max-w-xs truncate" title={n.notes}>
                  {n.notes || "-"}
                </td>
                <td className="px-4 py-2 text-right no-print">
                  <div className="flex justify-end gap-1">
                    <button
                      id={`edit-natura-${n.id}`}
                      onClick={() => handleOpenEdit(n)}
                      className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`delete-natura-${n.id}`}
                      onClick={() => handleDelete(n)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {natura.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-6 text-slate-400 font-sans">
                  Belum ada sumbangan Natura warga yang tercatat saat ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

</div>

      {/* 4. MODAL ADD / EDIT NATURA */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-red-750 text-white px-4 py-3 border-b border-red-850 flex justify-between items-center">
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider">
                {editingItem ? "Ubah Catatan Natura" : "Catat Sumbangan Natura (In-Kind)"}
              </h3>
              <button 
                id="close-natura-modal"
                onClick={() => setShowModal(false)}
                className="text-white/85 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Donatur / Warga</label>
                <input
                  type="text"
                  required
                  value={form.donorName}
                  onChange={(e) => setForm({ ...form, donorName: e.target.value })}
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50"
                  placeholder="Misal: Bapak H. Mulyono (RT 02)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Asal RT Warga</label>
                  <select
                    value={form.rt}
                    onChange={(e) => setForm({ ...form, rt: e.target.value })}
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50 font-semibold"
                  >
                    {settings.rtList.map(rt => (
                      <option key={rt} value={rt}>{rt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Alokasi Penyaluran</label>
                  <select
                    value={form.allocation}
                    onChange={(e) => setForm({ ...form, allocation: e.target.value })}
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50"
                  >
                    {settings.seksiList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Barang Sumbangan</label>
                <input
                  type="text"
                  required
                  value={form.item}
                  onChange={(e) => setForm({ ...form, item: e.target.value })}
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50"
                  placeholder="Misal: Air Mineral Gelas Club"
                />
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
                    placeholder="Dus/Kg/Pcs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Estimasi Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.estimatedValue}
                    onChange={(e) => setForm({ ...form, estimatedValue: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50 text-right font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal Terima</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Keterangan / Catatan</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50"
                    placeholder="Diantar jam 10 pagi, dsb."
                  />
                </div>
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
                  id="btn-submit-natura"
                  className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded shadow-xs transition-colors"
                >
                  {editingItem ? "Simpan Perubahan" : "Catat Natura"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
