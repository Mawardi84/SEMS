import { toBlob, toCanvas } from "html-to-image";
import { saveAs } from "file-saver";
import JSZip from "jszip";

const commonOptions = {
  pixelRatio: 2,
  backgroundColor: "#ffffff",
  style: {
    boxShadow: "none",
    color: "#0f172a"
  },
  filter: (node: any) => {
    if (node instanceof HTMLElement && node.classList.contains("no-print")) return false;
    return true;
  }
};

export async function exportToImage(elementId: string, filename: string, format: "png" | "jpeg" = "png") {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    alert(`Gagal mengekspor: Konten ${elementId} tidak ditemukan.`);
    return;
  }

  try {
    const cleanFilename = filename.replace(/\.(png|jpg|jpeg|pdf|doc|docx)$/i, "");
    const ext = format === "jpeg" ? ".jpg" : ".png";
    const finalFilename = `${cleanFilename}${ext}`;

    const originalWidth = element.style.width;
    element.style.width = "813px";

    const blob = await toBlob(element, { ...commonOptions, width: 813 });
    
    element.style.width = originalWidth;

    if (blob) {
      saveAs(blob, finalFilename);
    } else {
      throw new Error("Blob is null");
    }
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
  const ext = format === "jpeg" ? "jpg" : "png";
  const cleanFilename = filename.replace(/\.(png|jpg|jpeg|pdf|doc|docx|zip)$/i, "");

  try {
    for (let i = 0; i < pageNodes.length; i++) {
      const pageEl = pageNodes[i];
      
      const originalWidth = pageEl.style.width;
      pageEl.style.width = "813px";

      const blob = await toBlob(pageEl, { ...commonOptions, width: 813 });
      
      pageEl.style.width = originalWidth;

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
