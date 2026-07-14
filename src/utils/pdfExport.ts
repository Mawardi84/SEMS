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
      scale: 1.5, // 1.5x resolution is perfect for crisp text while saving massive device memory
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      ignoreElements: (el) => el.classList.contains("no-print"),
      onclone: (clonedDoc) => {
        try {
          // Create a dummy element in active document body to resolve colors natively
          const dummy = document.createElement("div");
          dummy.style.display = "none";
          document.body.appendChild(dummy);

          const resolveColor = (colorStr: string): string => {
            try {
              dummy.style.color = "";
              dummy.style.color = colorStr;
              const computed = window.getComputedStyle(dummy).color;
              if (!computed || computed === "" || computed.includes("oklch") || computed.includes("oklab") || computed.includes("color-mix")) {
                return "rgb(120, 120, 120)";
              }
              return computed;
            } catch (e) {
              return "rgb(120, 120, 120)";
            }
          };

          const processText = (cssText: string): string => {
            if (!cssText) return cssText;
            
            // 1. Resolve oklch(...)
            let index = cssText.indexOf("oklch(");
            while (index !== -1) {
              let parenCount = 1;
              let i = index + 6;
              while (i < cssText.length && parenCount > 0) {
                if (cssText[i] === "(") parenCount++;
                else if (cssText[i] === ")") parenCount--;
                i++;
              }
              const fullMatch = cssText.substring(index, i);
              const resolved = resolveColor(fullMatch);
              cssText = cssText.substring(0, index) + resolved + cssText.substring(i);
              index = cssText.indexOf("oklch(");
            }

            // 1.5. Resolve oklab(...)
            index = cssText.indexOf("oklab(");
            while (index !== -1) {
              let parenCount = 1;
              let i = index + 6;
              while (i < cssText.length && parenCount > 0) {
                if (cssText[i] === "(") parenCount++;
                else if (cssText[i] === ")") parenCount--;
                i++;
              }
              const fullMatch = cssText.substring(index, i);
              const resolved = resolveColor(fullMatch);
              cssText = cssText.substring(0, index) + resolved + cssText.substring(i);
              index = cssText.indexOf("oklab(");
            }

            // 2. Resolve color-mix(...)
            index = cssText.indexOf("color-mix(");
            while (index !== -1) {
              let parenCount = 1;
              let i = index + 10;
              while (i < cssText.length && parenCount > 0) {
                if (cssText[i] === "(") parenCount++;
                else if (cssText[i] === ")") parenCount--;
                i++;
              }
              const fullMatch = cssText.substring(index, i);
              const resolved = resolveColor(fullMatch);
              cssText = cssText.substring(0, index) + resolved + cssText.substring(i);
              index = cssText.indexOf("color-mix(");
            }

            return cssText;
          };

          // Convert all oklch and color-mix values inside cloned <style> elements
          const styles = clonedDoc.querySelectorAll("style");
          styles.forEach((style) => {
            if (style.textContent) {
              style.textContent = processText(style.textContent);
            }
          });

          // Convert inline styles as well
          const elementsWithStyle = clonedDoc.querySelectorAll("[style]");
          elementsWithStyle.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style.cssText) {
              htmlEl.style.cssText = processText(htmlEl.style.cssText);
            }
          });

          // Disable modern filters and backdrop-filters which are not supported
          // by html2canvas and often render as solid black blocks/rectangles.
          // Note: box-shadows are kept to ensure the PDF design matches the web view.
          const styleOverride = clonedDoc.createElement("style");
          styleOverride.textContent = `
            * {
              filter: none !important;
              backdrop-filter: none !important;
            }
          `;
          clonedDoc.head.appendChild(styleOverride);

          document.body.removeChild(dummy);
        } catch (err) {
          console.error("Failed to post-process stylesheets in html2canvas:", err);
        }
      }
    });

    // Revert original styles
    element.style.cssText = originalStyle;

    const imgData = canvas.toDataURL("image/png");
    
    // A4 dimensions: 210mm x 297mm
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;

    // Remaining pages if long content
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error: any) {
    console.error("PDF generation failed:", error);
    alert(
      "Gagal mengekspor berkas PDF.\n\n" +
      "Catatan Keamanan Browser: Jika Anda saat ini membuka pratinjau di dalam bingkai (iframe) AI Studio, browser Anda mungkin memblokir unduhan langsung.\n\n" +
      "Silakan klik tombol 'Open in new tab' (Buka di tab baru) di sudut kanan atas layar pratinjau Anda untuk membukanya di halaman penuh, lalu lakukan ekspor kembali. Seluruh data Anda aman."
    );
    element.style.cssText = originalStyle;
  }
}
