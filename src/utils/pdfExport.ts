import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export async function exportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    alert(`Gagal mengekspor: Konten ${elementId} tidak ditemukan.`);
    return;
  }

  // Temporary styling adjustments for rendering high-fidelity PDF
  const originalStyle = element.style.cssText;
  element.style.maxHeight = "none"; // Unlimit heights so full content renders
  element.style.overflow = "visible"; // Allow overflow so all table rows are captured

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // 2x resolution for ultra-sharp text and graphics
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      ignoreElements: (el) => el.classList.contains("no-print"),
    });

    // Revert original styles
    element.style.cssText = originalStyle;

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    
    // A4 dimensions: 210mm x 297mm
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;

    // Remaining pages if long content
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("Gagal merumuskan file PDF. Silakan coba kembali.");
    element.style.cssText = originalStyle;
  }
}
