import { jsPDF } from "jspdf";
import { toCanvas } from "html-to-image";

/**
 * Analyzes a row of pixels in a canvas context to determine its "blankness" score (0.0 to 1.0).
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

  if (maxBandLength >= 6) {
    return bestBandMid;
  }

  if (maxBlankness >= 0.88) {
    return bestY;
  }

  return targetEndY;
}

export async function exportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    alert(`Gagal mengekspor: Konten ${elementId} tidak ditemukan.`);
    return;
  }

  const exportBtn = document.querySelector('[data-export-btn]') as HTMLElement | null;

  try {
    if (exportBtn) exportBtn.textContent = 'Menyiapkan...';

    // Add temporary styling for export
    const originalWidth = element.style.width;
    const originalDisplay = element.style.display;
    element.style.width = "813px";
    element.style.display = "block";

    const canvas = await toCanvas(element, {
      pixelRatio: 1.5,
      backgroundColor: "#ffffff",
      style: {
        boxShadow: "none",
        color: "#0f172a"
      },
      filter: (node) => {
        if (node instanceof HTMLElement && node.classList.contains("no-print")) return false;
        return true;
      }
    });

    // Restore styling
    element.style.width = originalWidth;
    element.style.display = originalDisplay;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // Folio / F4 dimensions: 215mm x 330mm (21.5cm x 33cm)
    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: [215, 330] });
    const marginX = 10;
    const marginY = 12;
    const printableWidth = 195; // 215 - 20
    const printableHeight = 306; // 330 - 24

    const pageCanvasHeight = Math.floor(canvas.width * (printableHeight / printableWidth));

    const pages: { startY: number; endY: number }[] = [];
    let currentY = 0;

    while (currentY < canvas.height) {
      const remainingHeight = canvas.height - currentY;
      if (remainingHeight <= pageCanvasHeight) {
        pages.push({ startY: currentY, endY: canvas.height });
        break;
      }

      const targetEndY = currentY + pageCanvasHeight;
      const minSearchY = currentY + Math.floor(pageCanvasHeight * 0.65);
      const breakY = findOptimalPageBreak(ctx, currentY, targetEndY, canvas.width, minSearchY);

      pages.push({ startY: currentY, endY: breakY });
      currentY = breakY;
    }

    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const sliceHeight = p.endY - p.startY;

      if (sliceHeight <= 0) continue;

      if (i > 0) {
        pdf.addPage();
      }

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

      const sliceData = tempCanvas.toDataURL("image/jpeg", 0.95);
      const pdfSliceHeight = (sliceHeight * printableWidth) / canvas.width;

      pdf.addImage(
        sliceData,
        "JPEG",
        marginX,
        marginY,
        printableWidth,
        pdfSliceHeight,
        undefined,
        "FAST"
      );
    }

    pdf.save(filename);
  } catch (error: any) {
    console.error("PDF generation failed:", error);
    alert("Gagal mengekspor berkas PDF.\n\nDetail: " + (error.message || "Unknown error"));
  } finally {
    if (exportBtn) exportBtn.textContent = 'Ekspor PDF';
  }
}
