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

    // Identify all individual pages inside the container (only explicit page breaks)
    let pageNodes: HTMLElement[] = [];
    
    // Check for elements with explicit break-after-page or pdf-page classes
    const potentialPages = Array.from(
      container.querySelectorAll<HTMLElement>('.break-after-page, .print\\:break-after-page, [data-pdf-page]')
    );

    if (potentialPages.length > 0) {
      pageNodes = potentialPages.filter(el => el.offsetHeight > 50);
    }

    // If no explicit page breaks exist, the container itself is the target single document
    if (pageNodes.length === 0) {
      pageNodes = [container];
    }

    // Standard Indonesian A4 (210mm x 297mm) / F4 (215mm x 330mm)
    const pdfPageWidthMm = 210;
    const standardPageHeightMm = 297;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    let isFirstPage = true;

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

      const contentHeightMm = (canvas.height * pdfPageWidthMm) / canvas.width;

      // If this page fits within standard page height or single page (e.g. up to 330mm)
      if (contentHeightMm <= 335) {
        const pageHeightMm = Math.max(standardPageHeightMm, contentHeightMm);
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (!isFirstPage) {
          pdf.addPage([pdfPageWidthMm, pageHeightMm], 'portrait');
        } else {
          isFirstPage = false;
        }

        // Add image keeping 100% exact proportional aspect ratio (no stretching!)
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfPageWidthMm, contentHeightMm, undefined, 'FAST');
      } else {
        // Multi-page slicing for long continuous documents
        const sliceHeightPx = (standardPageHeightMm * canvas.width) / pdfPageWidthMm;
        let currentYPx = 0;

        while (currentYPx < canvas.height) {
          const chunkCanvas = document.createElement('canvas');
          chunkCanvas.width = canvas.width;
          const currentChunkHeightPx = Math.min(sliceHeightPx, canvas.height - currentYPx);
          chunkCanvas.height = currentChunkHeightPx;

          const ctx = chunkCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, chunkCanvas.width, chunkCanvas.height);
            ctx.drawImage(
              canvas,
              0, currentYPx, canvas.width, currentChunkHeightPx,
              0, 0, canvas.width, currentChunkHeightPx
            );
          }

          const chunkImgData = chunkCanvas.toDataURL('image/jpeg', 0.95);
          const chunkHeightMm = (currentChunkHeightPx * pdfPageWidthMm) / canvas.width;

          if (!isFirstPage) {
            pdf.addPage([pdfPageWidthMm, standardPageHeightMm], 'portrait');
          } else {
            isFirstPage = false;
          }

          pdf.addImage(chunkImgData, 'JPEG', 0, 0, pdfPageWidthMm, chunkHeightMm, undefined, 'FAST');
          currentYPx += sliceHeightPx;
        }
      }
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

