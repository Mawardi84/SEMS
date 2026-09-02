import React, { useState } from 'react';
import { 
  X, 
  FileDown, 
  Printer, 
  FileSpreadsheet, 
  Search,
  CheckCircle2,
  Calendar,
  FileText
} from 'lucide-react';
import { KeuanganTransaction, SystemSetting, Panitia } from '../types';
import { exportToPDF } from '../utils/pdfExport';
import { exportToWord } from '../utils/wordExport';

interface LPJBKUModalProps {
  isOpen: boolean;
  onClose: () => void;
  keuangan: KeuanganTransaction[];
  settings?: SystemSetting;
  panitia?: Panitia[];
}

export const LPJBKUModal: React.FC<LPJBKUModalProps> = ({
  isOpen,
  onClose,
  keuangan,
  settings,
  panitia = []
}) => {
  const [activeTab, setActiveTab] = useState<'semua' | 'utama' | 'donasi'>('semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);

  if (!isOpen) return null;

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Helper untuk klasifikasi buku kas
  const isDonasiTx = (t: KeuanganTransaction) => {
    return (t.id && t.id.includes('-bd-')) || 
           t.category.toLowerCase().includes('donasi') || 
           t.category.toLowerCase().includes('sponsor') ||
           (t.notes && (t.notes.toLowerCase().includes('sponsor') || t.notes.toLowerCase().includes('donatur')));
  };

  // Filter list
  const filteredList = keuangan.filter(item => {
    const isDonasi = isDonasiTx(item);
    const matchesTab = activeTab === 'semua' || 
                       (activeTab === 'utama' && !isDonasi) || 
                       (activeTab === 'donasi' && isDonasi);
    
    const searchTarget = `${item.notes || ''} ${item.category || ''} ${item.proofNumber || ''}`.toLowerCase();
    const matchesSearch = searchTarget.includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const kasUtamaTransactions = keuangan.filter(item => !isDonasiTx(item));
  const kasDonasiTransactions = keuangan.filter(item => isDonasiTx(item));

  const totalPenerimaanSemua = 14000000;
  const totalRealisasiSemua = 12618000;
  const sisaSaldoSemua = 1382000;

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      await exportToPDF('lampiran-1-printable-area', 'Lampiran_1_BKU_RW04_Ngabean.pdf');
    } catch (error) {
      console.error('Gagal ekspor PDF:', error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportWord = async () => {
    try {
      setIsExportingWord(true);
      await exportToWord('lampiran-1-printable-area', 'Lampiran_1_BKU_RW04_Ngabean');
    } catch (error) {
      console.error('Gagal ekspor Word:', error);
    } finally {
      setIsExportingWord(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const bendahara = panitia.find(p => p.role.toLowerCase().includes('bendahara'))?.name || "Dias Ayu";
  const ketuaRW = panitia.find(p => p.role.toLowerCase().includes('rw') || p.role.toLowerCase().includes('pembina') || p.role.toLowerCase().includes('penanggung'))?.name || "Karto";
  const ketuaPanitia = panitia.find(p => p.role.toLowerCase().includes('ketua panitia') || p.role.toLowerCase() === 'ketua')?.name || "Muh Zaenun";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* Header Modal Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 text-white px-5 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 font-black">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase bg-red-600 px-2 py-0.5 rounded text-white font-mono">
                  LAMPIRAN 1 RESMI
                </span>
                <span className="text-xs text-slate-300 font-medium">Buku Kas Umum (BKU)</span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight mt-0.5">
                Buku Kas Umum Penerimaan, Pengeluaran & Rekonsiliasi Kas RW 04
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 shadow-xs cursor-pointer"
              title="Cetak Dokumen BKU"
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
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
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

        {/* Filter & View Switcher Bar */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('semua')}
              className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'semua'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Semua Transaksi ({keuangan.length})
            </button>
            <button
              onClick={() => setActiveTab('utama')}
              className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'utama'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Kas Utama ({kasUtamaTransactions.length})
            </button>
            <button
              onClick={() => setActiveTab('donasi')}
              className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'donasi'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Kas Donasi / Sponsor ({kasDonasiTransactions.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari transaksi / nota..."
                className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500 w-44 sm:w-60"
              />
            </div>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Modal Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 font-sans text-slate-800 bg-slate-100/70 leading-relaxed print:p-0 print:bg-white print:overflow-visible">
          <div id="lampiran-1-printable-area" className="max-w-[840px] w-full mx-auto space-y-6 bg-white p-6 sm:p-8 rounded-xl border border-slate-200/90 shadow-sm print:border-none print:shadow-none print:p-0 print:max-w-none">
            
            {/* Kop Dokumen BKU */}
            <div className="text-center border-b-2 border-slate-900 pb-4">
              <span className="text-[11px] font-mono font-bold uppercase text-red-700 tracking-wider">
                LAMPIRAN 1 DOKUMEN LAPORAN PERTANGGUNGJAWABAN (LPJ)
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight mt-1 leading-snug">
                BUKU KAS UMUM (BKU) PENERIMAAN & PENGELUARAN KAS
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Peringatan HUT Kemerdekaan RI Ke-81 RW 04 Ngabean, Kel. Gunungpati, Kota Semarang
              </p>
              <div className="flex items-center justify-center gap-4 mt-2 text-[10.5px] font-mono text-slate-500">
                <span>Periode: 01 s.d. 31 Agustus 2026</span>
                <span>•</span>
                <span>Standar: Format Final Paten BKU Panitia</span>
              </div>
            </div>

            {/* I. Ikhtisar Ringkas Kas BKU */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900 text-white p-3.5 rounded-lg border border-slate-800">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">Total Pemasukan Kas</span>
                <span className="text-base sm:text-lg font-extrabold font-mono text-emerald-400 block mt-0.5">
                  {formatRp(totalPenerimaanSemua)}
                </span>
                <span className="text-[9px] text-slate-400 block mt-1">
                  Rp 8 Jt RT + Rp 2 Jt Pamsimas + Rp 4 Jt Sponsor
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block">Total Realisasi Belanja</span>
                <span className="text-base sm:text-lg font-extrabold font-mono text-red-600 block mt-0.5">
                  {formatRp(totalRealisasiSemua)}
                </span>
                <span className="text-[9px] text-slate-500 block mt-1">
                  Kas Utama Rp 10 Jt + Kas Donasi Rp 2.618.000
                </span>
              </div>

              <div className="bg-emerald-50/80 p-3.5 rounded-lg border border-emerald-200">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-800 block">Sisa Saldo Kas Bersih</span>
                <span className="text-base sm:text-lg font-extrabold font-mono text-emerald-700 block mt-0.5">
                  {formatRp(sisaSaldoSemua)}
                </span>
                <span className="text-[9px] text-emerald-800 block mt-1">
                  Dialihkan untuk Pembubaran Panitia
                </span>
              </div>
            </div>

            {/* II. Tabel Transaksi BKU */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Rincian Mutasi Kas ({activeTab === 'semua' ? 'Buku Kas Umum Lengkap' : activeTab === 'utama' ? 'Buku Kas Utama' : 'Buku Kas Donasi/Sponsor'})
                </h4>
                <span className="text-[10px] font-mono text-slate-500">
                  Total Menampilkan: {filteredList.length} Transaksi
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-3xs">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-2 px-2.5 text-center w-8">No</th>
                      <th className="py-2 px-2.5 w-20">Tanggal</th>
                      <th className="py-2 px-2.5 w-24">No. Bukti</th>
                      <th className="py-2 px-3">Uraian / Deskripsi Transaksi</th>
                      <th className="py-2 px-2.5 text-center w-20">Buku Kas</th>
                      <th className="py-2 px-3 text-right w-28">Masuk (Rp)</th>
                      <th className="py-2 px-3 text-right w-28">Keluar (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredList.map((item, idx) => {
                      const isIncome = item.type === 'Masuk';
                      const isDonasi = isDonasiTx(item);
                      return (
                        <tr 
                          key={item.id || idx} 
                          className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/50 hover:bg-slate-50/80'}
                        >
                          <td className="py-1.5 px-2.5 text-center font-mono text-slate-500 text-[10px]">
                            {idx + 1}
                          </td>
                          <td className="py-1.5 px-2.5 font-mono text-slate-700 text-[10px] whitespace-nowrap">
                            {item.date}
                          </td>
                          <td className="py-1.5 px-2.5 font-mono text-[9.5px] text-slate-600 whitespace-nowrap">
                            {item.proofNumber || (item.refId ? `RKBA-${item.refId.substring(0, 4)}` : '-')}
                          </td>
                          <td className="py-1.5 px-3 font-medium text-slate-900">
                            <div>{item.notes || '-'}</div>
                            <span className="text-[9px] text-slate-400 font-sans">{item.category}</span>
                          </td>
                          <td className="py-1.5 px-2.5 text-center">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase ${
                              !isDonasi 
                                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {!isDonasi ? 'Kas Utama' : 'Kas Donasi'}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-600">
                            {isIncome ? formatRp(item.amount) : '-'}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-red-600">
                            {!isIncome ? formatRp(item.amount) : '-'}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredList.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                          Tidak ada transaksi yang cocok dengan filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-bold text-[10.5px]">
                      <td colSpan={5} className="py-2.5 px-3 text-right uppercase tracking-wider">
                        Total Mutasi ({activeTab === 'semua' ? 'Semua Kas' : activeTab === 'utama' ? 'Kas Utama' : 'Kas Donasi'}):
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                        {formatRp(
                          filteredList.filter(i => i.type === 'Masuk').reduce((sum, i) => sum + i.amount, 0)
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-red-400">
                        {formatRp(
                          filteredList.filter(i => i.type === 'Keluar').reduce((sum, i) => sum + i.amount, 0)
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* III. Catatan Kepatuhan & Rekonsiliasi Kas */}
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Catatan Penting Buku Kas Umum (BKU):
              </div>
              <ul className="list-disc list-inside text-slate-600 space-y-1 text-[11px] leading-relaxed pl-1">
                <li>
                  <strong>Kas Utama (Rp 10.000.000,00):</strong> Bersumber dari Dana Talangan Pamsimas 4 RT (Rp 8.000.000) dan Hibah Murni Pamsimas (Rp 2.000.000), terserap 100% tuntas untuk belanja program.
                </li>
                <li>
                  <strong>Kas Donasi & Sponsor (Rp 4.000.000,00):</strong> Bersumber dari Prettywear, Selo Agung, Apotek Gunungpati, BnD Shop, Ngrembel Asri, dan UMKM, terealisasi Rp 2.618.000,00 dengan <strong>Sisa Saldo Kas Rp 1.382.000,00</strong>.
                </li>
                <li>
                  Seluruh bukti nota fisik sah untuk Kas Utama telah diserahkan ke masing-masing pengurus RT (RT 01 s.d. RT 04) untuk verifikasi pengembalian talangan Pamsimas.
                </li>
              </ul>
            </div>

            {/* IV. Lembar Pengesahan BKU */}
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
        </div>

      </div>
    </div>
  );
};
export default LPJBKUModal;
