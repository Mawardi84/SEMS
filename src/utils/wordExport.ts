import { saveAs } from 'file-saver';

export async function exportToWord(elementId: string, filename: string) {
  let element = document.getElementById(elementId);
  if (!element) {
    element = document.querySelector('#document-preview-paper') || 
              document.querySelector('.print\\:block') || 
              document.querySelector('[id*="preview"]') as HTMLElement;
  }

  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    alert(`Gagal mengekspor Word: Konten dokumen tidak ditemukan.`);
    return;
  }

  const cleanFilename = filename.replace(/\.(png|jpg|jpeg|doc|docx|pdf)$/i, "");
  const htmlContent = element.innerHTML;
  
  try {
    const response = await fetch('/api/export-to-word', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ htmlContent }),
    });

    if (response.ok) {
      const blob = await response.blob();
      saveAs(blob, `${cleanFilename}.docx`);
      return;
    }
  } catch (error) {
    console.warn("Server-side docx export encountered error, falling back to client-side DOC export:", error);
  }

  // Client-side fallback to standard MS Word document
  try {
    const wordDocumentHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>${cleanFilename}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 215mm 330mm;
            margin: 20mm 20mm 20mm 20mm;
          }
          body {
            font-family: Arial, "Helvetica Neue", sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #1e293b;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 8pt;
            margin-bottom: 8pt;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 6pt 8pt;
            font-size: 10pt;
          }
          th {
            background-color: #f1f5f9;
            font-weight: bold;
          }
          h1, h2, h3, h4 {
            color: #0f172a;
            font-family: Arial, sans-serif;
          }
          h1 { font-size: 16pt; font-weight: bold; text-align: center; }
          h2 { font-size: 14pt; font-weight: bold; text-align: center; }
          h3 { font-size: 12pt; font-weight: bold; }
          h4 { font-size: 11pt; font-weight: bold; }
          p { margin-bottom: 8pt; text-align: justify; }
          .break-after-page { page-break-after: always; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    const blob = new Blob([wordDocumentHtml], { type: "application/msword;charset=utf-8" });
    saveAs(blob, `${cleanFilename}.doc`);
  } catch (clientError: any) {
    console.error("Client-side Word export failed:", clientError);
    alert("Gagal mengekspor berkas Word.\n\nDetail: " + (clientError.message || "Unknown error"));
  }
}

