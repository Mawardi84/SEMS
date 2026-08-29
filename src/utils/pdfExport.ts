import html2pdf from "html2pdf.js";

/**
 * Exports the element to a PDF file using html2pdf.js for robust layout preservation.
 */
export async function exportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    alert(`Gagal mengekspor: Konten ${elementId} tidak ditemukan.`);
    return;
  }

  // Define PDF options for F4/Folio (215mm x 330mm)
  const opt = {
    margin: [10, 10, 12, 10], // top, left, bottom, right
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 1.5, // Balance between quality and performance
      useCORS: true, 
      logging: false,
      backgroundColor: "#ffffff",
      letterRendering: true
    },
    jsPDF: { unit: 'mm', format: [215, 330], orientation: 'portrait' }
  };

  try {
    // Show a temporary loading indicator if possible (user-friendly)
    const exportBtn = document.querySelector('[data-export-btn]');
    if (exportBtn) exportBtn.textContent = 'Menyiapkan...';

    await html2pdf().set(opt).from(element).save();

    if (exportBtn) exportBtn.textContent = 'Ekspor PDF';
  } catch (error: any) {
    console.error("PDF generation failed:", error);
    
    if (exportBtn) exportBtn.textContent = 'Ekspor PDF';
    
    alert(
      "Gagal mengekspor berkas PDF.\n\n" +
      "Pastikan Anda memiliki koneksi internet yang stabil dan coba ulangi kembali."
    );
  }
}
