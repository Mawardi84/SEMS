import React from 'react';
import { X, Printer, Download, Archive } from 'lucide-react';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onDownload: () => void;
  onExportWord?: () => void;
  onExportPNG?: () => void;
  onExportJPG?: () => void;
  onExportPNGZip?: () => void;
  onExportJPGZip?: () => void;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onDownload,
  onExportWord,
  onExportPNG,
  onExportJPG,
  onExportPNGZip,
  onExportJPGZip,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:bg-transparent print:static print:block print:p-0">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:rounded-none print:block print:overflow-visible">
        <div className="flex items-center justify-between p-4 border-b print:hidden">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <div className="flex items-center flex-wrap gap-2">
            {onExportWord && (
              <button
                onClick={onExportWord}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                title="Unduh sebagai dokumen Microsoft Word (.doc)"
              >
                <Download className="w-3.5 h-3.5" />
                Word
              </button>
            )}
            {onExportPNG && (
              <button
                onClick={onExportPNG}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                title="Ekspor sebagai 1 file gambar PNG utuh"
              >
                <Download className="w-3.5 h-3.5" />
                PNG (1 File)
              </button>
            )}
            {onExportPNGZip && (
              <button
                onClick={onExportPNGZip}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded text-xs font-bold hover:bg-teal-700 transition-colors cursor-pointer"
                title="Ekspor gambar PNG per halaman dalam berkas .ZIP"
              >
                <Archive className="w-3.5 h-3.5" />
                PNG (ZIP)
              </button>
            )}
            {onExportJPG && (
              <button
                onClick={onExportJPG}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-bold hover:bg-purple-700 transition-colors cursor-pointer"
                title="Ekspor sebagai 1 file gambar JPG utuh"
              >
                <Download className="w-3.5 h-3.5" />
                JPG (1 File)
              </button>
            )}
            {onExportJPGZip && (
              <button
                onClick={onExportJPGZip}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
                title="Ekspor gambar JPG per halaman dalam berkas .ZIP"
              >
                <Archive className="w-3.5 h-3.5" />
                JPG (ZIP)
              </button>
            )}
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              title="Ekspor dokumen sebagai PDF"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
              title="Cetak langsung dokumen"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-full cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 print:bg-transparent print:overflow-visible print:p-0 print:block">
          <div className="bg-white shadow-sm min-h-[800px] p-8 print:p-0 print:shadow-none print:min-h-0 print:block">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

