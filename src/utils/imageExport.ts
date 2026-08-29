import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import JSZip from "jszip";

// Offscreen 1x1 canvas context used for color parsing & conversion
const colorCanvas = document.createElement("canvas");
colorCanvas.width = 1;
colorCanvas.height = 1;
const colorCtx = colorCanvas.getContext("2d", { willReadFrequently: true });

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

function sanitizeCssText(cssText: string): string {
  if (!cssText) return cssText;
  const colorFuncRegex = /(oklch|oklab|color-mix|lab|light-dark|color)\((?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*\)/gi;
  return cssText.replace(colorFuncRegex, (match) => {
    return toRgbOrRgba(match);
  });
}

export async function exportToImage(elementId: string, filename: string, format: "png" | "jpeg" = "png") {
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
          const styles = clonedDoc.querySelectorAll("style");
          styles.forEach((style) => {
            if (style.textContent) {
              style.textContent = sanitizeCssText(style.textContent);
            }
          });

          const styledElements = clonedDoc.querySelectorAll("[style]");
          styledElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style.cssText) {
              htmlEl.style.cssText = sanitizeCssText(htmlEl.style.cssText);
            }
          });

          const clonedTarget = clonedDoc.getElementById(elementId);
          if (clonedTarget) {
            clonedTarget.style.boxSizing = "border-box";
            clonedTarget.style.maxHeight = "none";
            clonedTarget.style.height = "auto";
            clonedTarget.style.overflow = "visible";
            clonedTarget.style.backgroundColor = "#ffffff";
            clonedTarget.style.color = "#0f172a";

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

          const allNodes = clonedDoc.querySelectorAll("*");
          allNodes.forEach((node) => {
            const el = node as HTMLElement;
            if (!el || !el.style) return;

            el.style.boxShadow = "none";
            el.style.textShadow = "none";
            el.style.filter = "none";
            el.style.backdropFilter = "none";

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
          `;
          clonedDoc.head.appendChild(styleOverride);
        } catch (err) {
          console.error("Failed to post-process stylesheets in html2canvas:", err);
        }
      },
    });

    const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
    const ext = format === "jpeg" ? ".jpg" : ".png";
    const cleanFilename = filename.replace(/\.(png|jpg|jpeg|pdf|doc|docx)$/i, "");
    const finalFilename = `${cleanFilename}${ext}`;

    canvas.toBlob(
      (blob) => {
        if (blob) {
          saveAs(blob, finalFilename);
        } else {
          const dataUrl = canvas.toDataURL(mimeType, format === "jpeg" ? 0.95 : undefined);
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = finalFilename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      },
      mimeType,
      format === "jpeg" ? 0.95 : undefined
    );
  } catch (error: any) {
    console.error(`Gambar ${format.toUpperCase()} export failed:`, error);
    alert(`Gagal mengekspor berkas gambar ${format.toUpperCase()}.\n\nDetail: ${error?.message || "Terjadi kesalahan."}`);
  }
}

export async function exportToPNG(elementId: string, filename: string) {
  return exportToImage(elementId, filename, "png");
}

export async function exportToJPG(elementId: string, filename: string) {
  return exportToImage(elementId, filename, "jpeg");
}

export async function exportToImageZip(
  elementId: string,
  filename: string,
  format: "png" | "jpeg" = "png"
) {
  const container = document.getElementById(elementId);
  if (!container) {
    console.error(`Element with id ${elementId} not found`);
    alert(`Gagal mengekspor: Konten ${elementId} tidak ditemukan.`);
    return;
  }

  // Find page elements inside container.
  let pageNodes: HTMLElement[] = [];
  
  if (container.children.length > 1) {
    pageNodes = Array.from(container.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement && child.offsetHeight > 0
    );
  }

  if (pageNodes.length === 0) {
    const subPages = container.querySelectorAll<HTMLElement>('.print\\:break-after-page, .print\\:break-before-page, [key^="page-"]');
    if (subPages.length > 1) {
      pageNodes = Array.from(subPages);
    } else {
      pageNodes = [container];
    }
  }

  const zip = new JSZip();
  const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
  const ext = format === "jpeg" ? "jpg" : "png";
  const cleanFilename = filename.replace(/\.(png|jpg|jpeg|pdf|doc|docx|zip)$/i, "");

  try {
    for (let i = 0; i < pageNodes.length; i++) {
      const pageEl = pageNodes[i];
      const canvas = await html2canvas(pageEl, {
        scale: 2, // 2x scale for sharp High-DPI rendering
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        ignoreElements: (el) => el.classList.contains("no-print"),
        onclone: (clonedDoc) => {
          try {
            const styles = clonedDoc.querySelectorAll("style");
            styles.forEach((style) => {
              if (style.textContent) {
                style.textContent = sanitizeCssText(style.textContent);
              }
            });

            const styledElements = clonedDoc.querySelectorAll("[style]");
            styledElements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              if (htmlEl.style.cssText) {
                htmlEl.style.cssText = sanitizeCssText(htmlEl.style.cssText);
              }
            });

            const allNodes = clonedDoc.querySelectorAll("*");
            allNodes.forEach((node) => {
              const el = node as HTMLElement;
              if (!el || !el.style) return;

              el.style.boxShadow = "none";
              el.style.textShadow = "none";
              el.style.filter = "none";
              el.style.backdropFilter = "none";

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
            `;
            clonedDoc.head.appendChild(styleOverride);
          } catch (err) {
            console.error("Failed to post-process stylesheets in html2canvas:", err);
          }
        },
      });

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (b) => resolve(b),
          mimeType,
          format === "jpeg" ? 0.95 : undefined
        );
      });

      if (blob) {
        const pageNum = String(i + 1).padStart(2, "0");
        zip.file(`${cleanFilename}_Halaman_${pageNum}.${ext}`, blob);
      }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${cleanFilename}_${format.toUpperCase()}_ZIP.zip`);
  } catch (error: any) {
    console.error(`Export ZIP ${format.toUpperCase()} failed:`, error);
    alert(`Gagal mengekspor berkas ZIP gambar ${format.toUpperCase()}.\n\nDetail: ${error?.message || "Terjadi kesalahan."}`);
  }
}

export async function exportToPNGZip(elementId: string, filename: string) {
  return exportToImageZip(elementId, filename, "png");
}

export async function exportToJPGZip(elementId: string, filename: string) {
  return exportToImageZip(elementId, filename, "jpeg");
}

