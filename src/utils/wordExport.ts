import { saveAs } from 'file-saver';

export async function exportToWord(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    alert(`Gagal mengekspor: Konten ${elementId} tidak ditemukan.`);
    return;
  }

  const htmlContent = element.innerHTML;
  
  try {
    const response = await fetch('/api/export-to-word', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ htmlContent }),
    });

    if (!response.ok) {
      throw new Error('Failed to export word');
    }

    const blob = await response.blob();
    saveAs(blob, `${filename}.docx`);
  } catch (error) {
    console.error("Word export failed:", error);
    alert("Gagal mengekspor ke Word.");
  }
}
