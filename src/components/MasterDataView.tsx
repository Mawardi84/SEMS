import React, { useState } from "react";
import { 
  Users, 
  Calendar, 
  Plus, 
  Edit, 
  Trash, 
  CheckCircle2, 
  UserPlus, 
  CalendarPlus, 
  Phone, 
  MapPin, 
  Clock, 
  Layers 
} from "lucide-react";
import { Panitia, Kegiatan, SystemSetting } from "../types";
import OrgChart from "./OrgChart";

interface MasterDataViewProps {
  panitia: Panitia[];
  kegiatan: Kegiatan[];
  settings: SystemSetting;
  onSavePanitia: (action: 'add' | 'edit' | 'delete', data: Panitia) => Promise<void>;
  onSaveKegiatan: (action: 'add' | 'edit' | 'delete', data: Kegiatan) => Promise<void>;
}

export default function MasterDataView({
  panitia,
  kegiatan,
  settings,
  onSavePanitia,
  onSaveKegiatan
}: MasterDataViewProps) {
  // Safety checks
  const safeSettings = {
    rtList: settings?.rtList || [],
    seksiList: settings?.seksiList || []
  };

  const [activeSubTab, setActiveSubTab] = useState<'panitia' | 'kegiatan' | 'bagan'>('panitia');
  
  // Modals / Form States
  const [showPanitiaModal, setShowPanitiaModal] = useState(false);
  const [editingPanitia, setEditingPanitia] = useState<Panitia | null>(null);
  const [panitiaForm, setPanitiaForm] = useState<Omit<Panitia, 'id'>>({
    name: "",
    role: "",
    phone: "",
    rt: safeSettings.rtList[0] || "RT 01",
    seksi: safeSettings.seksiList[0] || "Acara"
  });

  const [showKegiatanModal, setShowKegiatanModal] = useState(false);
  const [editingKegiatan, setEditingKegiatan] = useState<Kegiatan | null>(null);
  const [kegiatanForm, setKegiatanForm] = useState<Omit<Kegiatan, 'id'>>({
    name: "",
    date: new Date().toISOString().split('T')[0],
    time: "08:00 - 12:00",
    location: "RW 04 Ngabean",
    description: "",
    status: "Perencanaan"
  });

  // Panitia CRUD handlers
  const handleOpenAddPanitia = () => {
    setEditingPanitia(null);
    setPanitiaForm({
      name: "",
      role: "",
      phone: "",
      rt: safeSettings.rtList[0] || "RT 01",
      seksi: safeSettings.seksiList[0] || "Acara"
    });
    setShowPanitiaModal(true);
  };

  const handleOpenEditPanitia = (p: Panitia) => {
    setEditingPanitia(p);
    setPanitiaForm({
      name: p.name,
      role: p.role,
      phone: p.phone,
      rt: p.rt,
      seksi: p.seksi
    });
    setShowPanitiaModal(true);
  };

  const handlePanitiaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = editingPanitia ? 'edit' : 'add';
    
    let finalSeksi = panitiaForm.seksi;
    if (
      panitiaForm.role.toLowerCase().includes("pelindung") ||
      panitiaForm.role.toLowerCase().includes("penasihat")
    ) {
      finalSeksi = "-";
    }

    const payload: Panitia = {
      ...panitiaForm,
      seksi: finalSeksi,
      id: editingPanitia ? editingPanitia.id : ""
    };
    await onSavePanitia(action, payload);
    setShowPanitiaModal(false);
  };

  const handleDeletePanitia = async (p: Panitia) => {
    if (confirm(`Apakah Anda yakin ingin menghapus '${p.name}' dari struktur kepanitiaan?`)) {
      await onSavePanitia('delete', p);
    }
  };

  // Kegiatan CRUD handlers
  const handleOpenAddKegiatan = () => {
    setEditingKegiatan(null);
    setKegiatanForm({
      name: "",
      date: new Date().toISOString().split('T')[0],
      time: "08:00 - 12:00",
      location: "RW 04 Ngabean",
      description: "",
      status: "Perencanaan"
    });
    setShowKegiatanModal(true);
  };

  const handleOpenEditKegiatan = (k: Kegiatan) => {
    setEditingKegiatan(k);
    setKegiatanForm({
      name: k.name,
      date: k.date,
      time: k.time,
      location: k.location,
      description: k.description,
      status: k.status
    });
    setShowKegiatanModal(true);
  };

  const handleKegiatanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = editingKegiatan ? 'edit' : 'add';
    const payload: Kegiatan = {
      ...kegiatanForm,
      id: editingKegiatan ? editingKegiatan.id : ""
    };
    await onSaveKegiatan(action, payload);
    setShowKegiatanModal(false);
  };

  const handleDeleteKegiatan = async (k: Kegiatan) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kegiatan '${k.name}'?`)) {
      await onSaveKegiatan('delete', k);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Tab Selectors & Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Master Data Kepanitiaan & Kegiatan</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Kelola panitia pelaksana RW 04 Ngabean Semarang dan daftar kegiatan perayaan HUT RI Ke-81.
          </p>
        </div>
        <div className="flex bg-slate-200/60 p-0.5 rounded self-start sm:self-auto border border-slate-200">
          <button
            onClick={() => setActiveSubTab('panitia')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold font-sans transition-all duration-150 ${
              activeSubTab === 'panitia'
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Struktur Panitia ({panitia.length})
          </button>
          <button
            onClick={() => setActiveSubTab('kegiatan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold font-sans transition-all duration-150 ${
              activeSubTab === 'kegiatan'
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Agenda Kegiatan ({kegiatan.length})
          </button>
          <button
            onClick={() => setActiveSubTab('bagan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold font-sans transition-all duration-150 ${
              activeSubTab === 'bagan'
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            Bagan Organisasi (Chart)
          </button>
        </div>
      </div>

      <div className="p-4">
        
        {/* VIEW 1: PANITIA TABLE */}
        {activeSubTab === 'panitia' && (
          <div className="space-y-3.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daftar Pengurus RW & Panitia Terdaftar</span>
              <button
                id="btn-add-panitia"
                onClick={handleOpenAddPanitia}
                className="flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold px-2.5 py-1.5 rounded shadow-xs transition-all duration-150 uppercase tracking-wide"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Tambah Panitia
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-sans text-[10px] uppercase tracking-wider border-b border-slate-200 font-bold">
                    <th className="px-4 py-2 font-bold text-slate-600">Nama Panitia</th>
                    <th className="px-4 py-2 font-bold text-slate-600">Role / Jabatan</th>
                    <th className="px-4 py-2 font-bold text-slate-600">Seksi</th>
                    <th className="px-4 py-2 font-bold text-slate-600">Asal RT</th>
                    <th className="px-4 py-2 font-bold text-slate-600">No. Telpon</th>
                    <th className="px-4 py-2 font-bold text-slate-600 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {panitia.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      <td className="px-4 py-2 font-bold text-slate-800">{p.name}</td>
                      <td className="px-4 py-2 font-medium text-slate-600">{p.role}</td>
                      <td className="px-4 py-2">
                        {p.seksi === "-" || p.seksi === "" || p.role.toLowerCase().includes("pelindung") || p.role.toLowerCase().includes("penasihat") ? (
                          <span className="bg-slate-100 border border-slate-200 text-slate-500 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase">
                            Non-Seksi
                          </span>
                        ) : (
                          <span className="bg-red-50 border border-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded text-[9px]">
                            Seksi {p.seksi}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-semibold text-slate-500">{p.rt}</td>
                      <td className="px-4 py-2 font-mono text-slate-500">{p.phone}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            id={`edit-panitia-${p.id}`}
                            onClick={() => handleOpenEditPanitia(p)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-panitia-${p.id}`}
                            onClick={() => handleDeletePanitia(p)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {panitia.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400 font-sans">
                        Belum ada struktur panitia terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 2: KEGIATAN TABLE */}
        {activeSubTab === 'kegiatan' && (
          <div className="space-y-3.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daftar Agenda Kegiatan & Proker</span>
              <button
                id="btn-add-kegiatan"
                onClick={handleOpenAddKegiatan}
                className="flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold px-2.5 py-1.5 rounded shadow-xs transition-all duration-150 uppercase tracking-wide"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                Tambah Kegiatan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {kegiatan.map((k) => {
                const statusColors = {
                  "Perencanaan": "bg-slate-100 text-slate-600 border-slate-200",
                  "Persiapan": "bg-amber-100 text-amber-700 border-amber-200",
                  "Pelaksanaan": "bg-red-100 text-red-700 border-red-200",
                  "Selesai": "bg-emerald-100 text-emerald-700 border-emerald-200"
                };

                return (
                  <div key={k.id} className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/30 hover:bg-white hover:shadow-xs hover:border-slate-300 transition-all duration-200 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide leading-snug">{k.name}</h3>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${statusColors[k.status]}`}>
                          {k.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">{k.description}</p>
                      
                      <div className="space-y-1 text-[11px] text-slate-600 font-sans border-t border-slate-100 pt-2.5">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{k.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono">{k.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-700">{k.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-1.5 border-t border-slate-100 pt-2.5 mt-3">
                      <button
                        id={`edit-kegiatan-${k.id}`}
                        onClick={() => handleOpenEditKegiatan(k)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold hover:bg-slate-100 border border-slate-200 text-slate-600 rounded transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        id={`delete-kegiatan-${k.id}`}
                        onClick={() => handleDeleteKegiatan(k)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold hover:bg-red-50 border border-red-200 text-red-600 rounded transition-colors"
                      >
                        <Trash className="w-3 h-3" />
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
              {kegiatan.length === 0 && (
                <div className="col-span-2 text-center py-6 text-slate-400 font-sans">
                  Belum ada agenda kegiatan terdaftar.
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'bagan' && (
          <div className="bg-slate-50/50 p-2 sm:p-4 rounded-lg border border-slate-200">
            <OrgChart panitia={panitia} settings={settings} />
          </div>
        )}

      </div>

      {/* MODAL 1: ADD/EDIT PANITIA */}
      {showPanitiaModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-red-750 text-white px-4 py-3 border-b border-red-850 flex justify-between items-center">
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider">
                {editingPanitia ? "Ubah Struktur Panitia" : "Tambah Anggota Panitia Baru"}
              </h3>
              <button 
                id="close-panitia-modal"
                onClick={() => setShowPanitiaModal(false)}
                className="text-white/85 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handlePanitiaSubmit} className="p-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={panitiaForm.name}
                  onChange={(e) => setPanitiaForm({ ...panitiaForm, name: e.target.value })}
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50"
                  placeholder="Misal: Slamet Rahardjo"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Role/Jabatan</label>
                  <input
                    type="text"
                    required
                    value={panitiaForm.role}
                    onChange={(e) => setPanitiaForm({ ...panitiaForm, role: e.target.value })}
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50"
                    placeholder="Misal: Bendahara Lomba"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">No. WhatsApp/HP</label>
                  <input
                    type="text"
                    required
                    value={panitiaForm.phone}
                    onChange={(e) => setPanitiaForm({ ...panitiaForm, phone: e.target.value })}
                    className="w-full text-xs font-mono border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50"
                    placeholder="0812345678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Seksi</label>
                  {panitiaForm.role.toLowerCase().includes("pelindung") || panitiaForm.role.toLowerCase().includes("penasihat") ? (
                    <div className="w-full text-xs border border-slate-200 rounded p-1.5 bg-slate-100 text-slate-500 font-bold h-8 flex items-center">
                      Non-Seksi (Otomatis)
                    </div>
                  ) : (
                    <select
                      value={panitiaForm.seksi}
                      onChange={(e) => setPanitiaForm({ ...panitiaForm, seksi: e.target.value })}
                      className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50"
                    >
                      <option value="-">Non-Seksi</option>
                      {safeSettings.seksiList.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Asal RT</label>
                  <select
                    value={panitiaForm.rt}
                    onChange={(e) => setPanitiaForm({ ...panitiaForm, rt: e.target.value })}
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50"
                  >
                    {safeSettings.rtList.map(rt => (
                      <option key={rt} value={rt}>{rt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPanitiaModal(false)}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-submit-panitia"
                  className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded shadow-xs transition-colors"
                >
                  {editingPanitia ? "Simpan Perubahan" : "Tambah Panitia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD/EDIT KEGIATAN */}
      {showKegiatanModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-red-750 text-white px-4 py-3 border-b border-red-850 flex justify-between items-center">
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider">
                {editingKegiatan ? "Ubah Agenda Kegiatan" : "Tambah Agenda Kegiatan Baru"}
              </h3>
              <button 
                id="close-kegiatan-modal"
                onClick={() => setShowKegiatanModal(false)}
                className="text-white/85 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleKegiatanSubmit} className="p-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Kegiatan</label>
                <input
                  type="text"
                  required
                  value={kegiatanForm.name}
                  onChange={(e) => setKegiatanForm({ ...kegiatanForm, name: e.target.value })}
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50"
                  placeholder="Misal: Lomba Panjat Pinang RW"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={kegiatanForm.date}
                    onChange={(e) => setKegiatanForm({ ...kegiatanForm, date: e.target.value })}
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Waktu (Jam)</label>
                  <input
                    type="text"
                    required
                    value={kegiatanForm.time}
                    onChange={(e) => setKegiatanForm({ ...kegiatanForm, time: e.target.value })}
                    className="w-full text-xs font-mono border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50"
                    placeholder="08:00 - selesai"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lokasi</label>
                  <input
                    type="text"
                    required
                    value={kegiatanForm.location}
                    onChange={(e) => setKegiatanForm({ ...kegiatanForm, location: e.target.value })}
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50"
                    placeholder="Misal: Balai RW 04"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={kegiatanForm.status}
                    onChange={(e) => setKegiatanForm({ ...kegiatanForm, status: e.target.value as any })}
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50"
                  >
                    <option value="Perencanaan">Perencanaan</option>
                    <option value="Persiapan">Persiapan</option>
                    <option value="Pelaksanaan">Pelaksanaan</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Deskripsi Kegiatan</label>
                <textarea
                  value={kegiatanForm.description}
                  onChange={(e) => setKegiatanForm({ ...kegiatanForm, description: e.target.value })}
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50 h-16 resize-none"
                  placeholder="Detail singkat kegiatan..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowKegiatanModal(false)}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-submit-kegiatan"
                  className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded shadow-xs transition-colors"
                >
                  {editingKegiatan ? "Simpan Perubahan" : "Tambah Kegiatan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
