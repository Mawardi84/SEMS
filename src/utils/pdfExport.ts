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
      scale: 1, // Reduced to 1 for faster performance
      useCORS: true, 
      logging: false,
      backgroundColor: "#ffffff",
      letterRendering: false // Disabled to prevent hanging on complex layouts
    },
    jsPDF: { unit: 'mm', format: [215, 330], orientation: 'portrait' }
  };

  const exportBtn = document.querySelector('[data-export-btn]') as HTMLElement | null;

  try {
    if (exportBtn) exportBtn.textContent = 'Menyiapkan...';

    // Ensure element is visible
    if (element.offsetWidth === 0 || element.offsetHeight === 0) {
      throw new Error("Elemen dokumen tidak memiliki dimensi. Pastikan pratinjau dimuat.");
    }

    await html2pdf().set(opt).from(element).save();
  } catch (error: any) {
    console.error("PDF generation failed:", error);
    
    alert(
      "Gagal mengekspor berkas PDF.\n\n" +
      "Pesan kesalahan: " + (error.message || "Unknown error") + "\n\n" +
      "Silakan screenshot pesan ini dan kirimkan ke kami."
    );
  } finally {
    if (exportBtn) exportBtn.textContent = 'Ekspor PDF';
  }
}
