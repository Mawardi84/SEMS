import html2pdf from "html2pdf.js";

// Offscreen 1x1 canvas context used for 100% reliable color parsing & conversion
const colorCanvas = document.createElement("canvas");
colorCanvas.width = 1;
colorCanvas.height = 1;
const colorCtx = colorCanvas.getContext("2d", { willReadFrequently: true });

/**
 * Converts ANY valid CSS color string (oklch, oklab, color-mix, lab, light-dark, hex, hsl, etc.)
 * into standard rgb(...) or rgba(...) format compatible with html2canvas.
 */
function toRgbOrRgba(colorStr: string): string {
  if (
    !colorStr ||
    colorStr === "transparent" ||
    colorStr === "rgba(0, 0, 0, 0)" ||
    colorStr === "inherit" ||
    colorStr === "initial" ||
    colorStr === "none"
  ) {
    return "rgba(0, 0, 0, 0)";
  }

  if (
    /^rgba?\(/i.test(colorStr) ||
    (/^#[0-9a-f]{3,8}$/i.test(colorStr) && colorStr.length !== 5 && colorStr.length !== 9)
  ) {
    return colorStr;
  }

  if (!colorCtx) return "rgb(15, 23, 42)";

  try {
    colorCtx.clearRect(0, 0, 1, 1);
    colorCtx.fillStyle = "rgba(0, 0, 0, 0)";
    colorCtx.fillStyle = colorStr;

    const fillRes = colorCtx.fillStyle;
    if (fillRes && fillRes !== "rgba(0, 0, 0, 0)" && fillRes !== "#000000") {
      if (fillRes.startsWith("#") || fillRes.startsWith("rgb")) {
        return fillRes;
      }
    }

    colorCtx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = colorCtx.getImageData(0, 0, 1, 1).data;
    if (a === 0) return "rgba(0, 0, 0, 0)";
    if (a === 255) return `rgb(${r}, ${g}, ${b})`;
    return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
  } catch (e) {
    return "rgb(15, 23, 42)";
  }
}

/**
 * Sanitizes CSS text containing oklch, oklab, color-mix, lab, light-dark, or color functions.
 */
function sanitizeCssText(cssText: string): string {
  if (!cssText) return cssText;

  const colorFuncRegex = /(oklch|oklab|color-mix|lab|light-dark|color)\((?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*\)/gi;
  return cssText.replace(colorFuncRegex, (match) => {
    return toRgbOrRgba(match);
  });
}

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
      letterRendering: false, // Disabled to prevent hanging on complex layouts
      onclone: (clonedDoc: Document) => {
        // Sanitize all <style> tags text content
        const styles = clonedDoc.querySelectorAll("style");
        styles.forEach((style) => {
          if (style.textContent) {
            style.textContent = sanitizeCssText(style.textContent);
          }
        });

        // Sanitize all inline [style] attributes
        const styledElements = clonedDoc.querySelectorAll("[style]");
        styledElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.style.cssText) {
            htmlEl.style.cssText = sanitizeCssText(htmlEl.style.cssText);
          }
        });
      }
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
