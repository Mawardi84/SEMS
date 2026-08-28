import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

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
 * Analyzes a row of pixels in a canvas context to determine its "blankness" score (0.0 to 1.0).
 * 1.0 means completely white/transparent, 0.0 means dark text or imagery.
 */
function getRowBlankness(
  ctx: CanvasRenderingContext2D,
  y: number,
  width: number,
  step: number = 6
): number {
  try {
    const imgData = ctx.getImageData(0, y, width, 1).data;
    let whitePixels = 0;
    let totalSampled = 0;

    for (let x = 0; x < width; x += step) {
      const idx = x * 4;
      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];
      const a = imgData[idx + 3];

      totalSampled++;
      if (a < 15 || (r >= 238 && g >= 238 && b >= 238)) {
        whitePixels++;
      }
    }

    return totalSampled > 0 ? whitePixels / totalSampled : 1.0;
  } catch (e) {
    return 1.0;
  }
}

/**
 * Finds the optimal Y coordinate in the canvas to split pages cleanly
 * without slicing through lines of text, cards, or table rows.
 */
function findOptimalPageBreak(
  ctx: CanvasRenderingContext2D,
  startY: number,
  targetEndY: number,
  canvasWidth: number,
  minSearchY: number
): number {
  if (targetEndY >= ctx.canvas.height) {
    return ctx.canvas.height;
  }

  const searchStart = Math.min(targetEndY, ctx.canvas.height - 1);
  const searchEnd = Math.max(minSearchY, startY + 50);

  let bestY = searchStart;
  let maxBlankness = -1;

  let currentBandStart = -1;
  let maxBandLength = 0;
  let bestBandMid = searchStart;

  for (let y = searchStart; y >= searchEnd; y--) {
    const blankness = getRowBlankness(ctx, y, canvasWidth, 6);

    if (blankness > maxBlankness) {
      maxBlankness = blankness;
      bestY = y;
    }

    if (blankness >= 0.95) {
      if (currentBandStart === -1) {
        currentBandStart = y;
      }
    } else {
      if (currentBandStart !== -1) {
        const bandLength = currentBandStart - y;
        if (bandLength > maxBandLength) {
          maxBandLength = bandLength;
          bestBandMid = Math.floor((currentBandStart + y + 1) / 2);
        }
        currentBandStart = -1;
      }
    }
  }

  if (currentBandStart !== -1) {
    const bandLength = currentBandStart - searchEnd;
    if (bandLength > maxBandLength) {
      maxBandLength = bandLength;
      bestBandMid = Math.floor((currentBandStart + searchEnd) / 2);
    }
  }

  // If a solid white band of at least 6 pixels high was found, use its center
  if (maxBandLength >= 6) {
    return bestBandMid;
  }

  // If high blankness found, use bestY
  if (maxBlankness >= 0.88) {
    return bestY;
  }

  // Fallback
  return targetEndY;
}

export async function exportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    alert(`Gagal mengekspor: Konten ${elementId} tidak ditemukan.`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // 2x scale for sharp High-DPI rendering
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      ignoreElements: (el) => el.classList.contains("no-print"),
      onclone: (clonedDoc) => {
        try {
          // 1. Sanitize all <style> tags text content
          const styles = clonedDoc.querySelectorAll("style");
          styles.forEach((style) => {
            if (style.textContent) {
              style.textContent = sanitizeCssText(style.textContent);
            }
          });

          // 2. Sanitize all inline [style] attributes
          const styledElements = clonedDoc.querySelectorAll("[style]");
          styledElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style.cssText) {
              htmlEl.style.cssText = sanitizeCssText(htmlEl.style.cssText);
            }
          });

          // 3. Expand target cloned root element to standard A4 print dimensions
          const clonedTarget = clonedDoc.getElementById(elementId);
          if (clonedTarget) {
            clonedTarget.style.width = "794px"; // Exact A4 pixel width at 96 DPI
            clonedTarget.style.minWidth = "794px";
            clonedTarget.style.maxWidth = "794px";
            clonedTarget.style.boxSizing = "border-box";
            clonedTarget.style.maxHeight = "none";
            clonedTarget.style.height = "auto";
            clonedTarget.style.overflow = "visible";
            clonedTarget.style.backgroundColor = "#ffffff";
            clonedTarget.style.color = "#0f172a";
            clonedTarget.style.margin = "0 auto";
            clonedTarget.style.padding = "24px";

            // Unconstrain all parents up to <body> to prevent container clipping
            let parent = clonedTarget.parentElement;
            while (parent && parent !== clonedDoc.body) {
              parent.style.maxHeight = "none";
              parent.style.height = "auto";
              parent.style.overflow = "visible";
              parent.style.display = "block";
              parent = parent.parentElement;
            }
            if (clonedDoc.body) {
              clonedDoc.body.style.maxHeight = "none";
              clonedDoc.body.style.height = "auto";
              clonedDoc.body.style.overflow = "visible";
            }
          }

          // 4. Sanitize elements in cloned document without destroying borders or layout
          const allNodes = clonedDoc.querySelectorAll("*");
          allNodes.forEach((node) => {
            const el = node as HTMLElement;
            if (!el || !el.style) return;

            // Strip effects that html2canvas turns into black boxes
            el.style.boxShadow = "none";
            el.style.textShadow = "none";
            el.style.filter = "none";
            el.style.backdropFilter = "none";

            // Sanitize explicit inline colors
            if (el.style.color) {
              el.style.color = sanitizeCssText(el.style.color);
            }
            if (el.style.backgroundColor) {
              el.style.backgroundColor = sanitizeCssText(el.style.backgroundColor);
            }
            if (el.style.borderColor) {
              el.style.borderColor = sanitizeCssText(el.style.borderColor);
            }
          });

          // 5. Inject CSS overrides to avoid page breaks inside cards, tables & signatures
          const styleOverride = clonedDoc.createElement("style");
          styleOverride.textContent = `
            *, *::before, *::after {
              box-shadow: none !important;
              text-shadow: none !important;
              filter: none !important;
              backdrop-filter: none !important;
              mix-blend-mode: normal !important;
              --tw-shadow: none !important;
              --tw-shadow-colored: none !important;
              --tw-ring-shadow: none !important;
              --tw-ring-offset-shadow: none !important;
            }
            body, html {
              background-color: #ffffff !important;
              color: #0f172a !important;
            }
            table, tr, td, th, .card, blockquote, figure, h1, h2, h3, h4, .signature-block {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          `;
          clonedDoc.head.appendChild(styleOverride);
        } catch (err) {
          console.error("Failed to post-process stylesheets in html2canvas:", err);
        }
      },
    });

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // A4 dimensions: 210mm x 297mm
    // Margins: 10mm left/right, 12mm top/bottom
    const pdf = new jsPDF("p", "mm", "a4");
    const marginX = 10;
    const marginY = 12;
    const printableWidth = 190; // 210 - 20
    const printableHeight = 273; // 297 - 24

    // Convert printable height (273mm) into canvas pixels
    const pageCanvasHeight = Math.floor(canvas.width * (printableHeight / printableWidth));

    const pages: { startY: number; endY: number }[] = [];
    let currentY = 0;

    while (currentY < canvas.height) {
      const remainingHeight = canvas.height - currentY;

      // If remaining height fits in one page, finalize
      if (remainingHeight <= pageCanvasHeight) {
        pages.push({ startY: currentY, endY: canvas.height });
        break;
      }

      const targetEndY = currentY + pageCanvasHeight;
      // Search window: bottom 35% of the page
      const minSearchY = currentY + Math.floor(pageCanvasHeight * 0.65);

      const breakY = findOptimalPageBreak(ctx, currentY, targetEndY, canvas.width, minSearchY);

      pages.push({ startY: currentY, endY: breakY });
      currentY = breakY;
    }

    // Render each page slice to PDF
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const sliceHeight = p.endY - p.startY;

      if (sliceHeight <= 0) continue;

      if (i > 0) {
        pdf.addPage();
      }

      // Create temp canvas for slice
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = sliceHeight;

      const tempCtx = tempCanvas.getContext("2d");
      if (tempCtx) {
        tempCtx.fillStyle = "#ffffff";
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(
          canvas,
          0,
          p.startY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );
      }

      const sliceData = tempCanvas.toDataURL("image/png");
      const pdfSliceHeight = (sliceHeight * printableWidth) / canvas.width;

      pdf.addImage(
        sliceData,
        "PNG",
        marginX,
        marginY,
        printableWidth,
        pdfSliceHeight,
        undefined,
        "FAST"
      );

      // Add page numbers on multi-page exports
      if (pages.length > 1) {
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184); // slate-400
        pdf.text(`Halaman ${i + 1} dari ${pages.length} • SEMS RW 04 Ngabean`, 105, 290, {
          align: "center",
        });
      }
    }

    pdf.save(filename);
  } catch (error: any) {
    console.error("PDF generation failed:", error);
    alert(
      "Gagal mengekspor berkas PDF.\n\n" +
        "Catatan Keamanan Browser: Jika Anda saat ini membuka pratinjau di dalam bingkai (iframe) AI Studio, browser Anda mungkin memblokir unduhan langsung.\n\n" +
        "Silakan klik tombol 'Open in new tab' (Buka di tab baru) di sudut kanan atas layar pratinjau Anda untuk membukanya di halaman penuh, lalu lakukan ekspor kembali. Seluruh data Anda aman."
    );
  }
}
