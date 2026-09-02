import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileDown, 
  Printer, 
  FileSpreadsheet, 
  Search,
  CheckCircle2,
  Calendar,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Receipt,
  Gift,
  Building2,
  User,
  DollarSign,
  Info,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Tag
} from 'lucide-react';
import { SumbanganRecord, SystemSetting, Panitia, KeuanganTransaction } from '../types';
import { initialSumbanganData } from '../data/initialSumbanganData';
import { exportToPDF } from '../utils/pdfExport';
import { exportToWord } from '../utils/wordExport';

interface LPJSumbanganModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: SystemSetting;
  panitia?: Panitia[];
  keuangan?: KeuanganTransaction[];
  onUpdateSumbanganList?: (newList: SumbanganRecord[]) => void;
}

export const LPJSumbanganModal: React.FC<LPJSumbanganModalProps> = ({
  isOpen,
  onClose,
  settings,
  panitia = [],
  keuangan = [],
  onUpdateSumbanganList
}) => {
  // State for sumbangan records from localStorage or initial
  const [sumbanganList, setSumbanganList] = useState<SumbanganRecord[]>(() => {
    try {
      const saved = localStorage.getItem('sems_sumbangan_records_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      const oldSaved = localStorage.getItem('sems_sumbangan_records');
      if (oldSaved) {
        const parsed = JSON.parse(oldSaved);
        if (Array.isArray(parsed) && parsed.some((r: SumbanganRecord) => r.id === 'smb-trl-01')) {
          return parsed;
        }
      }
      return initialSumbanganData;
    } catch (e) {
      return initialSumbanganData;
    }
  });

  // Modal active view: 'document' (Dokumen Lampiran 3), 'form' (Input & Kelola), 'receipt' (Kuitansi Digital)
  const [activeTab, setActiveTab] = useState<'document' | 'form' | 'receipt'>('document');
  const [filterDonorType, setFilterDonorType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<SumbanganRecord | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    donorType: SumbanganRecord['donorType'];
    donorName: string;
    category: SumbanganRecord['category'];
    amount: number;
    itemDescription: string;
    date: string;
    receiptNumber: string;
    receivedBy: string;
    contactPerson: string;
    notes: string;
    status: SumbanganRecord['status'];
  }>({
    donorType: 'Donatur Warga',
    donorName: '',
    category: 'Dana Tunai',
    amount: 0,
    itemDescription: '',
    date: new Date().toISOString().split('T')[0],
    receiptNumber: `KWT-DN-${String(Date.now()).slice(-4)}`,
    receivedBy: 'Dias Ayu',
    contactPerson: '',
    notes: '',
    status: 'Terverifikasi'
  });

  const [formSuccessMessage, setFormSuccessMessage] = useState<string>('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);

  // Save to localStorage and notify parent
  useEffect(() => {
    try {
      localStorage.setItem('sems_sumbangan_records_v2', JSON.stringify(sumbanganList));
      localStorage.setItem('sems_sumbangan_records', JSON.stringify(sumbanganList));
      if (onUpdateSumbanganList) {
        onUpdateSumbanganList(sumbanganList);
      }
    } catch (e) {
      console.error('Error saving sumbangan records:', e);
    }
  }, [sumbanganList, onUpdateSumbanganList]);

  if (!isOpen) return null;

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Convert number to terbilang rupiah
  const terbilang = (angka: number): string => {
    if (angka === 0) return 'Nol Rupiah';
    const bil: string[] = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    let hasil = '';

    const baca = (n: number): string => {
      if (n < 12) return bil[n];
      if (n < 20) return `${bil[n - 10]} Belas`;
      if (n < 100) return `${bil[Math.floor(n / 10)]} Puluh ${bil[n % 10]}`.trim();
      if (n < 200) return `Seratus ${baca(n - 100)}`.trim();
      if (n < 1000) return `${bil[Math.floor(n / 100)]} Ratus ${baca(n % 100)}`.trim();
      if (n < 2000) return `Seribu ${baca(n - 1000)}`.trim();
      if (n < 1000000) return `${baca(Math.floor(n / 1000))} Ribu ${baca(n % 1000)}`.trim();
      if (n < 1000000000) return `${baca(Math.floor(n / 1000000))} Juta ${baca(n % 1000000)}`.trim();
      return `${baca(Math.floor(n / 1000000000))} Miliar ${baca(n % 1000000000)}`.trim();
    };

    hasil = `${baca(angka)} Rupiah`.trim();
    return hasil;
  };

  const ketuaPanitia = panitia.find(p => p.role.toLowerCase().includes('ketua panitia') || p.role.toLowerCase() === 'ketua')?.name || "Muh Zaenun";
  const bendahara = panitia.find(p => p.role.toLowerCase().includes('bendahara'))?.name || "Dias Ayu";
  const ketuaRW = panitia.find(p => p.role.toLowerCase().includes('rw') || p.role.toLowerCase().includes('pembina') || p.role.toLowerCase().includes('penanggung'))?.name || "Karto";

  // Calculations
  const rtRecords = sumbanganList.filter(s => s.donorType === 'RT');
  const pamsimasRecords = sumbanganList.filter(s => s.donorType === 'Pamsimas');
  const sponsorRecords = sumbanganList.filter(s => s.donorType === 'Sponsor Resmi' || s.donorType === 'UMKM');
  const wargaRecords = sumbanganList.filter(s => s.donorType === 'Donatur Warga' || s.donorType === 'Lainnya' || s.donorType === 'Pengembalian Efisiensi');

  const totalTunaiRT = rtRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalTunaiPamsimas = pamsimasRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalTunaiSponsor = sponsorRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalTunaiWarga = wargaRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
  const grandTotalPenerimaan = totalTunaiRT + totalTunaiPamsimas + totalTunaiSponsor + totalTunaiWarga;

  // Filtered for table
  const filteredList = sumbanganList.filter(item => {
    let matchesType = false;
    if (filterDonorType === 'all') {
      matchesType = true;
    } else if (filterDonorType === 'Donatur Warga') {
      matchesType = item.donorType === 'Donatur Warga' || item.donorType === 'Lainnya' || item.donorType === 'Pengembalian Efisiensi';
    } else if (filterDonorType === 'Sponsor Resmi') {
      matchesType = item.donorType === 'Sponsor Resmi' || item.donorType === 'UMKM';
    } else {
      matchesType = item.donorType === filterDonorType;
    }

    const target = `${item.donorName} ${item.receiptNumber} ${item.notes || ''} ${item.itemDescription || ''} ${item.category}`.toLowerCase();
    const matchesSearch = target.includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Handle Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.donorName.trim()) {
      alert('Mohon isi nama donatur / RT!');
      return;
    }

    if (editingId) {
      // Update
      const updated = sumbanganList.map(item => {
        if (item.id === editingId) {
          return {
            ...item,
            ...formData
          };
        }
        return item;
      });
      setSumbanganList(updated);
      setFormSuccessMessage(`Data sumbangan "${formData.donorName}" berhasil diperbarui!`);
      setEditingId(null);
    } else {
      // Create
      const newRecord: SumbanganRecord = {
        id: `smb-${Date.now()}`,
        ...formData
      };
      setSumbanganList([newRecord, ...sumbanganList]);
      setFormSuccessMessage(`Penerimaan sumbangan dari "${formData.donorName}" berhasil dicatat ke Lampiran 3!`);
    }

    // Reset form to blank
    setFormData({
      donorType: 'Donatur Warga',
      donorName: '',
      category: 'Dana Tunai',
      amount: 0,
      itemDescription: '',
      date: new Date().toISOString().split('T')[0],
      receiptNumber: `KWT-DN-${String(Date.now()).slice(-4)}`,
      receivedBy: bendahara,
      contactPerson: '',
      notes: '',
      status: 'Terverifikasi'
    });

    setTimeout(() => {
      setFormSuccessMessage('');
    }, 4000);
  };

  const handleEdit = (record: SumbanganRecord) => {
    setEditingId(record.id);
    setFormData({
      donorType: record.donorType,
      donorName: record.donorName,
      category: record.category,
      amount: record.amount,
      itemDescription: record.itemDescription || '',
      date: record.date,
      receiptNumber: record.receiptNumber,
      receivedBy: record.receivedBy,
      contactPerson: record.contactPerson || '',
      notes: record.notes || '',
      status: record.status
    });
    setActiveTab('form');
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Hapus catatan sumbangan dari "${name}"?`)) {
      const updated = sumbanganList.filter(item => item.id !== id);
      setSumbanganList(updated);
    }
  };

  const handleResetToMaster = () => {
    if (window.confirm('Kembalikan seluruh data penerimaan sumbangan ke standar paten Master LPJ RW 04?')) {
      setSumbanganList(initialSumbanganData);
      localStorage.setItem('sems_sumbangan_records_v2', JSON.stringify(initialSumbanganData));
      localStorage.setItem('sems_sumbangan_records', JSON.stringify(initialSumbanganData));
      alert('Data sumbangan berhasil direset ke standar resmi master RW 04.');
    }
  };

  const handleViewReceipt = (record: SumbanganRecord) => {
    setSelectedReceipt(record);
    setActiveTab('receipt');
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      const elemId = activeTab === 'receipt' ? 'single-kuitansi-print-area' : 'lampiran-3-printable-area';
      const filename = activeTab === 'receipt' 
        ? `Kuitansi_${selectedReceipt?.receiptNumber || 'Donatur'}.pdf`
        : 'Lampiran_3_Kuitansi_Sumbangan_RW04_Ngabean.pdf';
      await exportToPDF(elemId, filename);
    } catch (error) {
      console.error('Gagal ekspor PDF:', error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportWord = async () => {
    try {
      setIsExportingWord(true);
      const elemId = activeTab === 'receipt' ? 'single-kuitansi-print-area' : 'lampiran-3-printable-area';
      const filename = activeTab === 'receipt' 
        ? `Kuitansi_${selectedReceipt?.receiptNumber || 'Donatur'}`
        : 'Lampiran_3_Kuitansi_Sumbangan_RW04_Ngabean';
      await exportToWord(elemId, filename);
    } catch (error) {
      console.error('Gagal ekspor Word:', error);
    } finally {
      setIsExportingWord(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* Header Modal Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-amber-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-black">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase bg-amber-600 px-2 py-0.5 rounded text-white font-mono">
                  LAMPIRAN 3 RESMI
                </span>
                <span className="text-xs text-amber-200 font-medium">Modul Rekonsiliasi Sumbangan LPJ</span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight mt-0.5">
                Penerimaan Sumbangan Swadaya RT & Donatur (Pengganti Nota Belanja)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 shadow-xs cursor-pointer"
              title="Cetak Dokumen Lampiran 3"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              onClick={handleExportWord}
              disabled={isExportingWord}
              className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-blue-500/40 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Docx</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{isExportingPDF ? 'Mengekspor...' : 'Unduh PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab & Action Toolbar */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('document')}
              className={`px-3.5 py-1.5 rounded-md font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'document'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Dokumen Lampiran 3 LPJ</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('form');
                if (!editingId) {
                  setFormData({
                    donorType: 'Donatur Warga',
                    donorName: '',
                    category: 'Dana Tunai',
                    amount: 0,
                    itemDescription: '',
                    date: new Date().toISOString().split('T')[0],
                    receiptNumber: `KWT-DN-${String(Date.now()).slice(-4)}`,
                    receivedBy: bendahara,
                    contactPerson: '',
                    notes: '',
                    status: 'Terverifikasi'
                  });
                }
              }}
              className={`px-3.5 py-1.5 rounded-md font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{editingId ? 'Edit Sumbangan' : 'Input Sumbangan Baru'}</span>
            </button>
            {selectedReceipt && (
              <button
                onClick={() => setActiveTab('receipt')}
                className={`px-3.5 py-1.5 rounded-md font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'receipt'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Kuitansi Digital ({selectedReceipt.receiptNumber})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToMaster}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-red-700 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset data sumbangan ke default master RW 04"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Data Master</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 font-sans text-slate-800 bg-slate-100/70 leading-relaxed print:p-0 print:bg-white print:overflow-visible">
          
          {/* TAB 1: DOKUMEN RESMI LAMPIRAN 3 */}
          {activeTab === 'document' && (
            <div id="lampiran-3-printable-area" className="max-w-[860px] w-full mx-auto space-y-6 bg-white p-6 sm:p-8 rounded-xl border border-slate-200/90 shadow-sm print:border-none print:shadow-none print:p-0 print:max-w-none">
              
              {/* Kop Dokumen Lampiran 3 */}
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <span className="text-[11px] font-mono font-bold uppercase text-amber-800 tracking-wider">
                  LAMPIRAN 3 DOKUMEN LAPORAN PERTANGGUNGJAWABAN (LPJ)
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight mt-1 leading-snug">
                  DAFTAR KUITANSI & REKAPITULASI PENERIMAAN SUMBANGAN RT, SPONSOR & DONATUR
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Peringatan HUT Kemerdekaan RI Ke-81 RW 04 Ngabean, Kel. Gunungpati, Kota Semarang
                </p>
                <div className="flex items-center justify-center gap-4 mt-2 text-[10.5px] font-mono text-slate-500">
                  <span>Periode: 01 s.d. 31 Agustus 2026</span>
                  <span>•</span>
                  <span>Status: Rekonsiliasi Kuitansi Sah Pengganti Nota Belanja Fisik</span>
                </div>
              </div>

              {/* Banner Regulasi & Keterangan Pengganti Nota Belanja */}
              <div className="bg-amber-50/90 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-950 space-y-1.5 shadow-3xs">
                <div className="font-extrabold flex items-center gap-2 text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Ketetapan Administratif Lampiran 3 LPJ RW 04 Ngabean:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900/90">
                  Sesuai dengan kesepakatan tata kelola keuangan perayaan HUT RI Ke-81, seluruh berkas <strong>nota belanja fisik sebesar Rp 2.000.000,00 per RT (Total Rp 8.000.000,00)</strong> telah diserahkan langsung kepada masing-masing pengurus RT (RT 01, RT 02, RT 03, RT 04) sebagai dasar penarikan iuran warga dan pelunasan dana talangan Pamsimas. Dengan demikian, Lampiran 3 ini memuat daftar kuitansi resmi tanda terima sumbangan swadaya RT, hibah Pamsimas, dan sponsor/donatur secara terstruktur dan transparan.
                </p>
              </div>

              {/* Ringkasan Statistik Penerimaan */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900 text-white p-3 rounded-lg border border-slate-800">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Total Penerimaan Kas</span>
                  <span className="text-base font-extrabold font-mono text-emerald-400 block mt-0.5">
                    {formatRp(grandTotalPenerimaan)}
                  </span>
                  <span className="text-[8.5px] text-slate-400 block mt-0.5">Kas Utama + Kas Donasi</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Swadaya 4 RT</span>
                  <span className="text-base font-extrabold font-mono text-slate-900 block mt-0.5">
                    {formatRp(totalTunaiRT)}
                  </span>
                  <span className="text-[8.5px] text-emerald-700 font-semibold block mt-0.5">4 RT Lunas @ Rp 2 Jt</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Hibah Pamsimas</span>
                  <span className="text-base font-extrabold font-mono text-slate-900 block mt-0.5">
                    {formatRp(totalTunaiPamsimas)}
                  </span>
                  <span className="text-[8.5px] text-slate-500 block mt-0.5">Sumbangan Murni</span>
                </div>

                <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 block">Sponsor & Donatur</span>
                  <span className="text-base font-extrabold font-mono text-amber-900 block mt-0.5">
                    {formatRp(totalTunaiSponsor + totalTunaiWarga)}
                  </span>
                  <span className="text-[8.5px] text-amber-800 font-medium block mt-0.5">Cash + Doorprize/Natura</span>
                </div>
              </div>

              {/* Tabel Bagian 1: Sumbangan Swadaya 4 RT & Hibah Pamsimas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-red-600" />
                    <span>A. Penerimaan Sumbangan Swadaya RT & Hibah Pamsimas (Kas Utama Rp 10.000.000)</span>
                  </h4>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-3xs">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[9px]">
                        <th className="py-2 px-2.5 text-center w-8">No</th>
                        <th className="py-2 px-2.5 w-24">No. Kuitansi</th>
                        <th className="py-2 px-2.5 w-20">Tanggal</th>
                        <th className="py-2 px-3">Nama Pihak Penyetor / Instansi</th>
                        <th className="py-2 px-2.5 text-center w-24">Bentuk Donasi</th>
                        <th className="py-2 px-3 text-right w-28">Nominal (Rp)</th>
                        <th className="py-2 px-2.5 text-center w-20 print:hidden">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {[...rtRecords, ...pamsimasRecords].map((item, idx) => (
                        <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/50 hover:bg-slate-50/80'}>
                          <td className="py-2 px-2.5 text-center font-mono text-slate-500 text-[10px]">{idx + 1}</td>
                          <td className="py-2 px-2.5 font-mono text-[9.5px] font-bold text-red-700 whitespace-nowrap">{item.receiptNumber}</td>
                          <td className="py-2 px-2.5 font-mono text-slate-700 text-[10px] whitespace-nowrap">{item.date}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            <div>{item.donorName}</div>
                            <span className="text-[9.5px] font-normal text-slate-500">{item.notes}</span>
                          </td>
                          <td className="py-2 px-2.5 text-center">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {formatRp(item.amount)}
                          </td>
                          <td className="py-2 px-2.5 text-center print:hidden">
                            <button
                              onClick={() => handleViewReceipt(item)}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded text-[9.5px] font-semibold border border-slate-200 transition cursor-pointer"
                              title="Lihat Kuitansi Digital"
                            >
                              Kuitansi
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold text-[10.5px] border-t border-slate-300">
                        <td colSpan={5} className="py-2 px-3 text-right uppercase tracking-wider text-slate-700">
                          Subtotal Kas Utama (RT & Pamsimas):
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-900 font-extrabold">
                          {formatRp(totalTunaiRT + totalTunaiPamsimas)}
                        </td>
                        <td className="print:hidden"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Tabel Bagian 2: Sponsor Resmi & Donatur Dermawan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-amber-600" />
                    <span>B. Penerimaan Sponsor Resmi, Donatur Perorangan & Pengembalian Efisiensi (Kas Donasi Rp 4.000.000 + Doorprize)</span>
                  </h4>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-3xs">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[9px]">
                        <th className="py-2 px-2.5 text-center w-8">No</th>
                        <th className="py-2 px-2.5 w-24">No. Kuitansi</th>
                        <th className="py-2 px-2.5 w-20">Tanggal</th>
                        <th className="py-2 px-3">Nama Sponsor / Donatur</th>
                        <th className="py-2 px-2.5 text-center w-28">Bentuk Donasi</th>
                        <th className="py-2 px-3 text-right w-28">Nominal Tunai (Rp)</th>
                        <th className="py-2 px-2.5 text-center w-20 print:hidden">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {[...sponsorRecords, ...wargaRecords].map((item, idx) => (
                        <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/50 hover:bg-slate-50/80'}>
                          <td className="py-2 px-2.5 text-center font-mono text-slate-500 text-[10px]">{idx + 1}</td>
                          <td className="py-2 px-2.5 font-mono text-[9.5px] font-bold text-amber-800 whitespace-nowrap">{item.receiptNumber}</td>
                          <td className="py-2 px-2.5 font-mono text-slate-700 text-[10px] whitespace-nowrap">{item.date}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            <div>{item.donorName}</div>
                            {item.itemDescription && (
                              <div className="text-[9.5px] text-amber-700 font-medium mt-0.5 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 shrink-0" />
                                <span>{item.itemDescription}</span>
                              </div>
                            )}
                            <span className="text-[9px] font-normal text-slate-500">{item.notes}</span>
                          </td>
                          <td className="py-2 px-2.5 text-center">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase ${
                              item.amount > 0 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {item.amount > 0 ? formatRp(item.amount) : <span className="text-slate-400 font-normal">Natura/Barang</span>}
                          </td>
                          <td className="py-2 px-2.5 text-center print:hidden">
                            <button
                              onClick={() => handleViewReceipt(item)}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded text-[9.5px] font-semibold border border-slate-200 transition cursor-pointer"
                              title="Lihat Kuitansi Digital"
                            >
                              Kuitansi
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold text-[10.5px] border-t border-slate-300">
                        <td colSpan={5} className="py-2 px-3 text-right uppercase tracking-wider text-slate-700">
                          Subtotal Kas Donasi Tunai (Sponsor, Donatur & Kembalian Tarling):
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-amber-900 font-extrabold">
                          {formatRp(totalTunaiSponsor + totalTunaiWarga)}
                        </td>
                        <td className="print:hidden"></td>
                      </tr>
                      <tr className="bg-slate-900 text-white font-bold text-[11px]">
                        <td colSpan={5} className="py-2.5 px-3 text-right uppercase tracking-wider">
                          TOTAL PENERIMAAN KAS TUNAI RESMI (A + B):
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-black">
                          {formatRp(grandTotalPenerimaan)}
                        </td>
                        <td className="print:hidden"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Lembar Pengesahan Lampiran 3 */}
              <div className="border-t-2 border-slate-300 pt-5 mt-6">
                <div className="text-right text-xs text-slate-600 mb-5">
                  Semarang, 31 Agustus 2026
                </div>

                <div className="grid grid-cols-3 gap-4 text-center text-xs">
                  <div className="space-y-1 relative">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Ketua Panitia Pelaksana</span>
                    <div className="h-16 flex items-center justify-center relative w-full my-1">
                      {settings?.signatureKetuaUrl ? (
                        <img 
                          src={settings.signatureKetuaUrl} 
                          alt="Tanda Tangan Ketua" 
                          className="max-h-full max-w-[110px] object-contain mix-blend-multiply" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-14" />
                      )}
                    </div>
                    <div className="font-bold underline text-slate-900">{ketuaPanitia}</div>
                  </div>

                  <div className="space-y-1 relative">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Bendahara Panitia</span>
                    <div className="h-16 flex items-center justify-center relative w-full my-1">
                      {settings?.signatureBendaharaUrl ? (
                        <img 
                          src={settings.signatureBendaharaUrl} 
                          alt="Tanda Tangan Bendahara" 
                          className="max-h-full max-w-[110px] object-contain mix-blend-multiply" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-14" />
                      )}
                    </div>
                    <div className="font-bold underline text-slate-900">{bendahara}</div>
                  </div>

                  <div className="space-y-1 relative">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Mengetahui, Ketua RW 04</span>
                    <div className="h-16 flex items-center justify-center relative w-full my-1">
                      {settings?.stempelUrl && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 pointer-events-none select-none z-0 opacity-80 mix-blend-multiply">
                          <img 
                            src={settings.stempelUrl} 
                            alt="Stempel RW" 
                            className="w-full h-full object-contain" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div className="h-14 relative z-10" />
                    </div>
                    <div className="font-bold underline text-slate-900">{ketuaRW}</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: FORM INPUT & KELOLA DATA SUMBANGAN */}
          {activeTab === 'form' && (
            <div className="max-w-[860px] w-full mx-auto space-y-6">
              
              {/* Form Input Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs uppercase tracking-wider">
                      {editingId ? 'Edit Catatan Penerimaan Sumbangan' : 'Form Input Penerimaan Sumbangan Baru'}
                    </span>
                  </div>
                  {editingId && (
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setFormData({
                          donorType: 'Donatur Warga',
                          donorName: '',
                          category: 'Dana Tunai',
                          amount: 0,
                          itemDescription: '',
                          date: new Date().toISOString().split('T')[0],
                          receiptNumber: `KWT-DN-${String(Date.now()).slice(-4)}`,
                          receivedBy: bendahara,
                          contactPerson: '',
                          notes: '',
                          status: 'Terverifikasi'
                        });
                      }}
                      className="text-[11px] text-amber-300 hover:text-white underline cursor-pointer"
                    >
                      Batal Edit (Input Baru)
                    </button>
                  )}
                </div>

                {formSuccessMessage && (
                  <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-5 py-2.5 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{formSuccessMessage}</span>
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Tipe Donatur */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Jenis Sumber Sumbangan <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.donorType}
                        onChange={(e) => {
                          const val = e.target.value as SumbanganRecord['donorType'];
                          setFormData({
                            ...formData,
                            donorType: val,
                            // Autofill convenience
                            amount: val === 'RT' ? 2000000 : val === 'Pamsimas' ? 2000000 : val === 'Pengembalian Efisiensi' ? 200000 : formData.amount,
                            receiptNumber: val === 'RT' ? 'KWT-RT01-0726' : val === 'Pamsimas' ? 'KWT-PMS-0726' : val === 'Pengembalian Efisiensi' ? 'KWT-TRL-0826' : formData.receiptNumber,
                            category: val === 'Pengembalian Efisiensi' ? 'Pengembalian Dana' : formData.category,
                            notes: val === 'Pengembalian Efisiensi' ? 'Kembalian efisiensi honor pentas seni Tarling dari Kas 1 dialihkan ke Kas Donasi (BKM-BD-09)' : formData.notes
                          });
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="RT">Iuran Swadaya RT (RT 01 s.d. RT 04)</option>
                        <option value="Pamsimas">Hibah Sukarela Pamsimas RW 04</option>
                        <option value="Sponsor Resmi">Sponsor Resmi Perusahaan</option>
                        <option value="Donatur Warga">Donatur Perorangan / Simpatisan</option>
                        <option value="Pengembalian Efisiensi">Pengembalian Efisiensi Kas 1 (Kembalian Tarling)</option>
                        <option value="UMKM">UMKM Kuliner Warga RW 04</option>
                        <option value="Lainnya">Lain-lain</option>
                      </select>
                    </div>

                    {/* Nama Donatur */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Nama Donatur / Instansi / RT <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.donorName}
                        onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                        placeholder="Contoh: Swadaya Warga RT 02 / Prettywear / Mas Agung"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Bentuk Donasi */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Bentuk / Metode Donasi <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as SumbanganRecord['category'] })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="Dana Tunai">Dana Tunai (Cash)</option>
                        <option value="Transfer Bank">Transfer Bank</option>
                        <option value="Pengembalian Dana">Pengembalian Dana (Efisiensi Kas)</option>
                        <option value="Barang / Doorprize">Barang / Doorprize</option>
                        <option value="Logistik / Konsumsi">Logistik / Konsumsi</option>
                        <option value="Jasa / Hibah">Jasa / Fasilitas Acara</option>
                      </select>
                    </div>

                    {/* Nominal Tunai */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Nominal Rupiah (Rp)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={10000}
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                        {formatRp(formData.amount)}
                      </span>
                    </div>

                    {/* Tanggal Penerimaan */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Tanggal Terima <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Deskripsi Barang / Doorprize (Jika ada) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Rincian Barang / Hadiah / Doorprize (Jika Berupa Barang / Natura)
                    </label>
                    <input
                      type="text"
                      value={formData.itemDescription}
                      onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                      placeholder="Contoh: 1 Unit Mesin Cuci 2 Tabung / Voucher Rekreasi 10 Tiket / 5 Kardus Air Mineral"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Nomor Kuitansi */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Nomor Kuitansi / Tanda Terima <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.receiptNumber}
                        onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                        placeholder="KWT-DN-001"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    {/* Penerima / Bendahara */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Nama Penerima / Bendahara
                      </label>
                      <input
                        type="text"
                        value={formData.receivedBy}
                        onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                        placeholder="Dias Ayu"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    {/* Kontak / PIC */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Kontak / PIC Penyerah
                      </label>
                      <input
                        type="text"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="Contoh: 08123456789 / Bpk. Ketua RT"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Keterangan / Pemanfaatan */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Keterangan Alokasi & Pemanfaatan
                    </label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Contoh: Sponsorship hadiah utama jalan sehat / pelunasan dana talangan Pamsimas"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingId ? 'Simpan Perubahan' : 'Catat Penerimaan Sumbangan'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Data Table Management Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    Daftar Semua Sumbangan Terdaftar ({sumbanganList.length} Item)
                  </h4>
                  <div className="flex items-center gap-2">
                    <select
                      value={filterDonorType}
                      onChange={(e) => setFilterDonorType(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1"
                    >
                      <option value="all">Semua Kategori ({sumbanganList.length})</option>
                      <option value="RT">Swadaya RT ({rtRecords.length})</option>
                      <option value="Pamsimas">Pamsimas ({pamsimasRecords.length})</option>
                      <option value="Sponsor Resmi">Sponsor Resmi ({sponsorRecords.length})</option>
                      <option value="Donatur Warga">Donatur Warga & Efisiensi ({wargaRecords.length})</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Cari donatur/kuitansi..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1 w-40"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 text-white text-[9px] uppercase font-bold">
                      <tr>
                        <th className="py-2 px-2.5 text-center w-8">No</th>
                        <th className="py-2 px-2.5">No. Kuitansi</th>
                        <th className="py-2 px-3">Nama Donatur / Instansi</th>
                        <th className="py-2 px-2.5">Kategori</th>
                        <th className="py-2 px-3 text-right">Nominal (Rp)</th>
                        <th className="py-2 px-2.5 text-center">Status</th>
                        <th className="py-2 px-3 text-center w-28">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px]">
                      {filteredList.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2 px-2.5 text-center text-slate-500 font-mono">{idx + 1}</td>
                          <td className="py-2 px-2.5 font-mono font-bold text-amber-800">{item.receiptNumber}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            <div>{item.donorName}</div>
                            {item.itemDescription && (
                              <div className="text-[10px] text-amber-700">{item.itemDescription}</div>
                            )}
                          </td>
                          <td className="py-2 px-2.5">
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 border border-slate-200">
                              {item.donorType}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {item.amount > 0 ? formatRp(item.amount) : 'Natura'}
                          </td>
                          <td className="py-2 px-2.5 text-center">
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleViewReceipt(item)}
                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                title="Cetak Kuitansi"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                                title="Edit Data"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id, item.donorName)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Hapus Data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: KUITANSI DIGITAL CETAK SATUAN */}
          {activeTab === 'receipt' && selectedReceipt && (
            <div className="max-w-[720px] w-full mx-auto space-y-4">
              <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-3xs print:hidden">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-600" />
                  Pratinjau Kuitansi Tanda Terima Resmi #{selectedReceipt.receiptNumber}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('document')}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                  >
                    &larr; Kembali ke Lampiran 3
                  </button>
                </div>
              </div>

              {/* Printable Kuitansi Box */}
              <div id="single-kuitansi-print-area" className="bg-white p-6 sm:p-8 rounded-xl border-2 border-slate-800 shadow-md space-y-5 print:border-2 print:shadow-none print:p-6 print:m-0">
                {/* Kop Kuitansi */}
                <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
                  <div>
                    <div className="text-[10px] font-black tracking-wider uppercase text-red-700 font-mono">
                      PANITIA PERINGATAN HUT RI KE-81
                    </div>
                    <div className="text-sm font-black text-slate-900 uppercase">
                      RUKUN WARGA 04 NGABEAN, KEL. GUNUNGPATI
                    </div>
                    <div className="text-[9.5px] text-slate-500">
                      Sekretariat: Balai RW 04 Ngabean, Kec. Gunungpati, Kota Semarang
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black font-mono bg-slate-900 text-white px-2.5 py-1 rounded">
                      KUITANSI
                    </span>
                    <div className="text-[10px] font-mono text-slate-600 mt-1 font-bold">
                      No: {selectedReceipt.receiptNumber}
                    </div>
                  </div>
                </div>

                {/* Isi Kuitansi Formal */}
                <div className="space-y-3.5 text-xs text-slate-800">
                  <div className="grid grid-cols-4 gap-2 items-baseline">
                    <span className="font-bold text-slate-600">Telah Terima Dari</span>
                    <span className="col-span-3 font-extrabold text-sm text-slate-900 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                      : {selectedReceipt.donorName}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 items-baseline">
                    <span className="font-bold text-slate-600">Banyaknya Uang</span>
                    <span className="col-span-3 italic font-semibold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 leading-relaxed">
                      : {selectedReceipt.amount > 0 ? terbilang(selectedReceipt.amount) : selectedReceipt.itemDescription || 'Sumbangan Barang / Fasilitas Kegiatan'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 items-baseline">
                    <span className="font-bold text-slate-600">Untuk Pembayaran</span>
                    <span className="col-span-3 font-medium text-slate-800">
                      : {selectedReceipt.notes || 'Sumbangan Swadaya & Partisipasi Perayaan HUT RI Ke-81 RW 04 Ngabean'}
                      {selectedReceipt.itemDescription && (
                        <div className="text-[11px] font-bold text-amber-800 mt-1">
                          Rincian Natura: {selectedReceipt.itemDescription}
                        </div>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 items-baseline">
                    <span className="font-bold text-slate-600">Kategori / Metode</span>
                    <span className="col-span-3 font-mono text-slate-700">
                      : {selectedReceipt.category} ({selectedReceipt.donorType})
                    </span>
                  </div>
                </div>

                {/* Bottom Nominal Box & Signature */}
                <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-end justify-between gap-4">
                  <div className="bg-slate-900 text-white px-5 py-3 rounded-lg border border-slate-800 w-full sm:w-auto">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Jumlah Uang:</span>
                    <span className="text-lg font-black font-mono text-emerald-400">
                      {selectedReceipt.amount > 0 ? formatRp(selectedReceipt.amount) : 'NATURA / BARANG'}
                    </span>
                  </div>

                  <div className="text-right text-xs space-y-1 w-full sm:w-60 relative">
                    <div className="text-slate-600 text-[10px]">
                      Semarang, {selectedReceipt.date}
                    </div>
                    <div className="text-[10px] font-bold text-slate-700 uppercase">
                      Penerima / Bendahara Panitia
                    </div>

                    <div className="h-16 flex items-center justify-end relative my-1">
                      {settings?.stempelUrl && (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 pointer-events-none select-none z-0 opacity-70 mix-blend-multiply">
                          <img 
                            src={settings.stempelUrl} 
                            alt="Stempel" 
                            className="w-full h-full object-contain" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      {settings?.signatureBendaharaUrl ? (
                        <img 
                          src={settings.signatureBendaharaUrl} 
                          alt="TTD Bendahara" 
                          className="max-h-full max-w-[100px] object-contain mix-blend-multiply relative z-10" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-12" />
                      )}
                    </div>

                    <div className="font-bold underline text-slate-900">
                      {selectedReceipt.receivedBy || bendahara}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
export default LPJSumbanganModal;
