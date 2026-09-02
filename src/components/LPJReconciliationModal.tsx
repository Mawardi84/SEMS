import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  Printer, 
  X, 
  ShieldCheck, 
  Building2, 
  Coins, 
  Download,
  Copy,
  Check,
  FileText
} from 'lucide-react';
import { SystemSetting, Panitia } from '../types';
import { exportToPDF } from '../utils/pdfExport';
import { exportToWord } from '../utils/wordExport';

interface LPJReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: SystemSetting;
  panitia?: Panitia[];
}

export default function LPJReconciliationModal({
  isOpen,
  onClose,
  settings,
  panitia = []
}: LPJReconciliationModalProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printArea = document.getElementById("lampiran-2-printable-area");
    if (!printArea) {
      window.print();
      return;
    }

    try {
      const printIframe = document.createElement("iframe");
      printIframe.style.position = "fixed";
      printIframe.style.right = "0";
      printIframe.style.bottom = "0";
      printIframe.style.width = "0";
      printIframe.style.height = "0";
      printIframe.style.border = "0";
      document.body.appendChild(printIframe);

      const frameDoc = printIframe.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Lampiran 2 - Laporan Rekonsiliasi Dana Talangan Pamsimas & RT</title>
              <meta charset="utf-8" />
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @page {
                  size: A4 portrait;
                  margin: 15mm 15mm 15mm 15mm;
                }
                body {
                  font-family: Arial, Helvetica, sans-serif;
                  background: #ffffff;
                  color: #0f172a;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                }
                th, td {
                  border: 1px solid #cbd5e1;
                }
              </style>
            </head>
            <body class="p-6 bg-white">
              <div class="max-w-3xl mx-auto space-y-6">
                ${printArea.innerHTML}
              </div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                  }, 250);
                };
              </script>
            </body>
          </html>
        `);
        frameDoc.close();

        setTimeout(() => {
          try {
            document.body.removeChild(printIframe);
          } catch (e) {}
        }, 60000);
      } else {
        window.print();
      }
    } catch (e) {
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      await exportToPDF(
        "lampiran-2-printable-area", 
        "Lampiran_2_Rekonsiliasi_Pamsimas_RT_RW04.pdf"
      );
    } catch (err) {
      console.error("Failed to export PDF:", err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleDownloadWord = async () => {
    setIsExportingWord(true);
    try {
      await exportToWord(
        "lampiran-2-printable-area", 
        "Lampiran_2_Rekonsiliasi_Pamsimas_RT_RW04"
      );
    } catch (err) {
      console.error("Failed to export Word:", err);
    } finally {
      setIsExportingWord(false);
    }
  };

  const bendahara = panitia.find(p => p.role.toLowerCase().includes('bendahara'))?.name || "Dias Ayu";
  const ketuaRW = panitia.find(p => p.role.toLowerCase().includes('rw') || p.role.toLowerCase().includes('pembina') || p.role.toLowerCase().includes('penanggung'))?.name || "Karto";
  const ketuaPanitia = panitia.find(p => p.role.toLowerCase().includes('ketua panitia'))?.name || "Muh Zaenun";

  const handleCopySummary = () => {
    const text = `========================================================================================
LAMPIRAN 2 DOKUMEN LAPORAN PERTANGGUNGJAWABAN (LPJ) RESMI
LAPORAN REKONSILIASI PENGEMBALIAN DANA TALANGAN PAMSIMAS & REALISASI SWADAYA RT
Peringatan HUT RI Ke-81 RW 04 Ngabean, Gunungpati, Kota Semarang
========================================================================================

I. SKEMA LIKUIDITAS & MEKANISME REKONSILIASI
1. Pengelola Pamsimas RW 04 memberikan dana talangan kas awal: Rp 8.000.000,00 (@ Rp 2.000.000 untuk RT 01 s.d. RT 04).
2. Panitia Pelaksana menyerahkan bundel fisik nota belanja riil senilai Rp 2.000.000,00 ke masing-masing Pengurus RT.
3. Pengurus RT dari hasil iuran warga menyetorkan pelunasan langsung ke kas Pamsimas RW 04.
4. Status Kewajiban: Tuntas & Lunas 100% (Nol Tunggakan / Zero Discrepancy).

II. TABEL REALISASI & REKONSILIASI 4 RT
- RT 01 Ngabean: Talangan Rp 2.000.000,00 | SPJ Fisik Rp 2.000.000,00 | Pelunasan RT->Pamsimas Rp 2.000.000,00 | Status: LUNAS 100%
- RT 02 Ngabean: Talangan Rp 2.000.000,00 | SPJ Fisik Rp 2.000.000,00 | Pelunasan RT->Pamsimas Rp 2.000.000,00 | Status: LUNAS 100%
- RT 03 Ngabean: Talangan Rp 2.000.000,00 | SPJ Fisik Rp 2.000.000,00 | Pelunasan RT->Pamsimas Rp 2.000.000,00 | Status: LUNAS 100%
- RT 04 Ngabean: Talangan Rp 2.000.000,00 | SPJ Fisik Rp 2.000.000,00 | Pelunasan RT->Pamsimas Rp 2.000.000,00 | Status: LUNAS 100%
----------------------------------------------------------------------------------------
TOTAL REKONSILIASI: Rp 8.000.000,00 (100% TUNTAS)

III. REKAPITULASI ARUS KAS AKHIR
- Total Penerimaan Kas: Rp 14.000.000,00 (Talangan 4 RT Rp 8 Jt + Hibah Pamsimas Rp 2 Jt + Sponsor/Donatur Rp 4 Jt)
- Realisasi Belanja Riil: Rp 12.618.000,00 (100% didukung nota fisik sah)
- Sisa Saldo Kas Bersih: Rp 1.382.000,00 (Dialihkan untuk Konsolidasi Internal & Pembubaran Panitia)

Semarang, 31 Agustus 2026
Ketua Panitia Pelaksana: ${ketuaPanitia}
Bendahara Panitia: ${bendahara}
Mengetahui, Ketua RW 04 Ngabean: ${ketuaRW}
========================================================================================`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 print:p-0 print:bg-white print:static print:block">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scale-in print:h-auto print:max-w-none print:w-full print:shadow-none print:border-none print:block print:overflow-visible">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-600 text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                  Lampiran 2 Resmi LPJ
                </span>
                <span className="text-xs text-indigo-200 font-mono">Single Source of Truth</span>
              </div>
              <h3 className="text-base font-extrabold text-white tracking-tight mt-0.5">
                Laporan Rekonsiliasi Dana Talangan Pamsimas & Swadaya RT
              </h3>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 self-end sm:self-auto">
            {/* Copy button */}
            <button
              onClick={handleCopySummary}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              title="Salin ringkasan rekonsiliasi ke clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
              <span>{copied ? "Disalin!" : "Salin Teks"}</span>
            </button>

            {/* Word Export */}
            <button
              onClick={handleDownloadWord}
              disabled={isExportingWord}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
              title="Unduh dokumen dalam format Microsoft Word"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isExportingWord ? "Mengunduh..." : "Word (.doc)"}</span>
            </button>

            {/* PDF Export */}
            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-700 shadow-sm transition cursor-pointer disabled:opacity-50"
              title="Unduh berkas PDF siap cetak"
            >
              <Download className="w-3.5 h-3.5 text-red-400" />
              <span>{isExportingPDF ? "Menyiapkan PDF..." : "Unduh PDF"}</span>
            </button>

            {/* Direct Print */}
            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Buka dialog cetak browser"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 font-sans text-slate-800 bg-white leading-relaxed print:p-0 print:overflow-visible">
          <div id="lampiran-2-printable-area" className="max-w-3xl mx-auto space-y-6 bg-white p-2">
            
            {/* Kop Laporan Rekonsiliasi */}
            <div className="text-center border-b-2 border-slate-800 pb-4">
              <span className="text-[11px] font-mono font-bold uppercase text-indigo-700 tracking-wider">
                LAMPIRAN 2 DOKUMEN LAPORAN PERTANGGUNGJAWABAN (LPJ)
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight mt-1">
                LAPORAN REKONSILIASI PENGEMBALIAN DANA TALANGAN PAMSIMAS & REALISASI SWADAYA RT
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Peringatan HUT RI Ke-81 RW 04 Ngabean, Gunungpati, Kota Semarang
              </p>
            </div>

            {/* I. Latar Belakang & Skema */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 font-extrabold uppercase text-[11px]">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>I. Skema Likuiditas & Mekanisme Pengembalian Dana Talangan</span>
              </div>
              <p className="text-slate-600 text-justify leading-relaxed">
                Untuk menjamin kelancaran modal kerja operasional kepanitiaan sebelum iuran swadaya warga terhimpun, pihak <strong>Pengelola Pamsimas RW 04</strong> memberikan fasilitas dana talangan kas awal sebesar <strong>Rp 8.000.000,00</strong> (pembagian @ Rp 2.000.000,00 untuk RT 01 s.d. RT 04).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px]">1</span>
                    Kewajiban Panitia Pelaksana
                  </div>
                  <p className="text-[10.5px] text-slate-500 mt-1">
                    Menyerahkan bundel fisik nota belanja riil senilai <strong>Rp 2.000.000,00</strong> kepada masing-masing Pengurus RT 01–04.
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px]">2</span>
                    Pelunasan Pengurus RT ke Pamsimas
                  </div>
                  <p className="text-[10.5px] text-slate-500 mt-1">
                    Pengurus RT dari hasil himpunan iuran warga menyetorkan pelunasan langsung ke kas Pamsimas RW 04.
                  </p>
                </div>
              </div>
            </div>

            {/* II. Tabel Utama Rekonsiliasi 4 RT */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  II. Tabel Realisasi & Rekonsiliasi Wilayah RT (4 RT)
                </h4>
                <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                  Status: LUNAS 100%
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-300 shadow-3xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-mono text-[10px] uppercase">
                      <th className="py-2.5 px-3 text-center w-10">No</th>
                      <th className="py-2.5 px-3">Wilayah Rukun Tetangga</th>
                      <th className="py-2.5 px-3 text-right">Dana Talangan Pamsimas</th>
                      <th className="py-2.5 px-3 text-right">Penyerahan SPJ Fisik (Panitia &rarr; RT)</th>
                      <th className="py-2.5 px-3 text-right">Pelunasan RT &rarr; Pamsimas</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-sans text-[11px]">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400">1</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">RT 01 Ngabean</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">Rp 2.000.000,00</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold">Rp 2.000.000,00</td>
                      <td className="py-2.5 px-3 text-right font-mono text-indigo-700 font-bold">Rp 2.000.000,00</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          ✔ Lunas
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400">2</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">RT 02 Ngabean</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">Rp 2.000.000,00</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold">Rp 2.000.000,00</td>
                      <td className="py-2.5 px-3 text-right font-mono text-indigo-700 font-bold">Rp 2.000.000,00</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          ✔ Lunas
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400">3</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">RT 03 Ngabean</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">Rp 2.000.000,00</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold">Rp 2.000.000,00</td>
                      <td className="py-2.5 px-3 text-right font-mono text-indigo-700 font-bold">Rp 2.000.000,00</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          ✔ Lunas
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400">4</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">RT 04 Ngabean</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">Rp 2.000.000,00</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold">Rp 2.000.000,00</td>
                      <td className="py-2.5 px-3 text-right font-mono text-indigo-700 font-bold">Rp 2.000.000,00</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          ✔ Lunas
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-slate-300">
                      <td className="py-2.5 px-3 text-center">Σ</td>
                      <td className="py-2.5 px-3 uppercase tracking-wider text-[10px]">TOTAL REKONSILIASI</td>
                      <td className="py-2.5 px-3 text-right font-mono">Rp 8.000.000,00</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700">Rp 8.000.000,00</td>
                      <td className="py-2.5 px-3 text-right font-mono text-indigo-700">Rp 8.000.000,00</td>
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-700">100% Tuntas</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* III. Rekonsiliasi Kas Keseluruhan (Penerimaan, Belanja, Sisa) */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-600" />
                III. Rekapitulasi Aliran Kas & Peruntukan Sisa Saldo
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Total Penerimaan</span>
                  <div className="text-sm font-black text-emerald-700 font-mono mt-1">Rp 14.000.000,00</div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Rp 8 Jt (Talangan RT) + Rp 2 Jt (Hibah Pamsimas) + Rp 4 Jt (Sponsor/Donatur)
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Realisasi Belanja Riil</span>
                  <div className="text-sm font-black text-red-600 font-mono mt-1">Rp 12.618.000,00</div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Didukung 100% bukti nota/kuitansi fisik sah tanpa meninggalkan hutang.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-indigo-200 bg-indigo-50/40">
                  <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wide block">Sisa Saldo Kas Bersih</span>
                  <div className="text-sm font-black text-indigo-950 font-mono mt-1">Rp 1.382.000,00</div>
                  <p className="text-[10px] text-indigo-700 mt-1 font-medium">
                    Dialokasikan untuk Konsolidasi Internal & Pembubaran Panitia.
                  </p>
                </div>
              </div>
            </div>

            {/* IV. Lembar Pengesahan Rekonsiliasi */}
            <div className="border-t-2 border-slate-300 pt-6 mt-6">
              <div className="text-right text-xs text-slate-600 mb-6">
                Semarang, 31 Agustus 2026
              </div>

              <div className="grid grid-cols-3 gap-4 text-center text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Ketua Panitia Pelaksana</span>
                  <div className="h-16 flex items-center justify-center font-serif italic text-sm text-slate-700 font-bold">
                    ( Tanda Tangan )
                  </div>
                  <div className="font-bold underline text-slate-900">{ketuaPanitia}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Bendahara Panitia</span>
                  <div className="h-16 flex items-center justify-center font-serif italic text-sm text-emerald-800 font-bold">
                    ( Tanda Tangan )
                  </div>
                  <div className="font-bold underline text-slate-900">{bendahara}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Mengetahui, Ketua RW 04</span>
                  <div className="h-16 flex items-center justify-center font-serif italic text-sm text-indigo-800 font-bold">
                    ( Tanda Tangan & Stempel )
                  </div>
                  <div className="font-bold underline text-slate-900">{ketuaRW}</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono shrink-0 print:hidden">
          <span>Lampiran 2 Resmi LPJ Peringatan HUT RI Ke-81 RW 04 Ngabean</span>
          <span>Status Audit: Zero Discrepancy (Nol Selisih)</span>
        </div>
      </div>
    </div>
  );
}
