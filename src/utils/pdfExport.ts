import { toCanvas, toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';

const printOptions = {
  pixelRatio: 2,
  backgroundColor: '#ffffff',
  style: {
    boxShadow: 'none',
    margin: '0',
    transform: 'none',
  },
  filter: (node: any) => {
    if (node instanceof HTMLElement) {
      if (node.classList.contains('no-print') || node.classList.contains('print:hidden')) {
        return false;
      }
    }
    return true;
  }
};

export async function exportToPDF(elementId: string, filename: string) {
  const exportBtns = document.querySelectorAll('[data-export-btn]');
  exportBtns.forEach(btn => { (btn as HTMLElement).textContent = 'Menyiapkan PDF...'; });

  try {
    let container = document.getElementById(elementId);
    if (!container) {
      container = document.querySelector('#document-preview-paper') || 
                  document.querySelector('.print\\:block') || 
                  document.querySelector('[id*="preview"]') as HTMLElement;
    }

    if (!container) {
      console.error(`Element with id ${elementId} not found`);
      alert(`Gagal mengekspor PDF: Konten dokumen tidak ditemukan di layar.`);
      return;
    }

    // Identify all individual pages inside the container
    let pageNodes: HTMLElement[] = [];
    
    // Check for elements with break-after-page or page wrapper keys
    const potentialPages = Array.from(
      container.querySelectorAll<HTMLElement>('.break-after-page, .print\\:break-after-page')
    );

    if (potentialPages.length > 0) {
      pageNodes = potentialPages.filter(el => el.offsetHeight > 50);
    }

    if (pageNodes.length === 0 && container.children.length > 0) {
      pageNodes = Array.from(container.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement && child.offsetHeight > 50
      );
    }

    if (pageNodes.length === 0) {
      pageNodes = [container];
    }

    // Standard Indonesian F4 / Folio (215mm x 330mm) or A4 (210mm x 297mm)
    const pdfPageWidthMm = 215;
    const pdfPageHeightMm = 330;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfPageWidthMm, pdfPageHeightMm],
      compress: true
    });

    for (let i = 0; i < pageNodes.length; i++) {
      const pageEl = pageNodes[i];

      const originalWidth = pageEl.style.width;
      const originalMaxWidth = pageEl.style.maxWidth;
      pageEl.style.width = '813px';
      pageEl.style.maxWidth = '813px';

      const canvas = await toCanvas(pageEl, {
        ...printOptions,
        width: 813,
      });

      pageEl.style.width = originalWidth;
      pageEl.style.maxWidth = originalMaxWidth;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const contentHeightMm = (canvas.height * pdfPageWidthMm) / canvas.width;
      const targetHeightMm = Math.max(pdfPageHeightMm, contentHeightMm);

      if (i > 0) {
        pdf.addPage([pdfPageWidthMm, targetHeightMm], 'portrait');
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfPageWidthMm, targetHeightMm, undefined, 'FAST');
    }

    const cleanFilename = filename.replace(/\.(png|jpg|jpeg|doc|docx|pdf)$/i, "") + ".pdf";

    // Direct blob download via FileSaver
    const pdfBlob = pdf.output('blob');
    saveAs(pdfBlob, cleanFilename);

  } catch (error: any) {
    console.error("PDF generation failed, trying browser print dialog as fallback:", error);
    
    // Fallback: browser print dialog
    try {
      const originalTitle = document.title;
      document.title = filename.replace(/\.pdf$/i, '');
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    } catch (printErr: any) {
      alert("Gagal mengekspor berkas PDF.\n\nDetail: " + (error.message || "Unknown error"));
    }
  } finally {
    exportBtns.forEach(btn => { (btn as HTMLElement).textContent = 'Ekspor PDF'; });
  }
}

