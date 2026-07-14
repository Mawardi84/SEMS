import { UndanganRapat, SystemSetting } from "../types";

function convertMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";
  
  let html = markdown;
  
  // Replace headings
  html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 13pt; font-weight: bold; margin-top: 14pt; margin-bottom: 6pt; color: #1e293b;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: 15pt; font-weight: bold; margin-top: 18pt; margin-bottom: 8pt; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 style="font-size: 17pt; font-weight: bold; margin-top: 22pt; margin-bottom: 10pt; color: #1e293b;">$1</h1>');
  
  // Replace bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace italic text
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Replace line breaks inside paragraphs
  // Replace double spaces at line end with br
  html = html.replace(/  \n/g, '<br/>\n');

  // Parse lists: ul and li
  const lines = html.split('\n');
  let inList = false;
  let inOrderedList = false;
  const processedLines = lines.map(line => {
    const cleanLine = line.trim();
    if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
      const content = cleanLine.substring(2);
      let prefix = '';
      if (inOrderedList) {
        inOrderedList = false;
        prefix += '</ol>\n';
      }
      if (!inList) {
        inList = true;
        prefix += '<ul style="margin-top: 6px; margin-bottom: 6px; padding-left: 24px; list-style-type: disc;">';
      }
      return `${prefix}<li style="margin-bottom: 4pt; line-height: 1.5; color: #334155;">${content}</li>`;
    } else if (/^\d+\.\s(.*)/.test(cleanLine)) {
      const content = cleanLine.replace(/^\d+\.\s/, '');
      let prefix = '';
      if (inList) {
        inList = false;
        prefix += '</ul>\n';
      }
      if (!inOrderedList) {
        inOrderedList = true;
        prefix += '<ol style="margin-top: 6px; margin-bottom: 6px; padding-left: 24px; list-style-type: decimal;">';
      }
      return `${prefix}<li style="margin-bottom: 4pt; line-height: 1.5; color: #334155;">${content}</li>`;
    } else {
      let prefix = '';
      if (inList) {
        inList = false;
        prefix += '</ul>\n';
      }
      if (inOrderedList) {
        inOrderedList = false;
        prefix += '</ol>\n';
      }
      
      // If the line is a separator
      if (cleanLine === '---') {
        return '<hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 16pt 0;" />';
      }
      
      return prefix + (cleanLine ? `<p style="margin-top: 0; margin-bottom: 8pt; line-height: 1.6; color: #334155; text-align: justify;">${line}</p>` : '');
    }
  });
  
  if (inList) {
    processedLines.push('</ul>');
  }
  if (inOrderedList) {
    processedLines.push('</ol>');
  }
  
  return processedLines.join('\n');
}

export function exportToDOC(selectedUndangan: UndanganRapat, settings: SystemSetting | null, filename: string) {
  // Get Kop parameters
  const isMaster = selectedUndangan.useMasterKop !== false;
  const kLine1 = isMaster ? (settings?.kopLine1 || "PANITIA PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81") : (selectedUndangan.kopLine1 || "PANITIA PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81");
  const kLine2 = isMaster ? (settings?.kopLine2 || "RUKUN WARGA 04 KELURAHAN NGABEAN") : (selectedUndangan.kopLine2 || "RUKUN WARGA 04 KELURAHAN NGABEAN");
  const kLine3 = isMaster ? (settings?.kopLine3 || "Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah") : (selectedUndangan.kopLine3 || "Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah");
  const kLine4 = isMaster ? (settings?.kopLine4 || "Sekretariat: Balai RW 04 Ngabean, Telp: +62 812-3456-7890 | Kode Pos: 50141") : (selectedUndangan.kopLine4 || "Sekretariat: Balai RW 04 Ngabean, Telp: +62 812-3456-7890 | Kode Pos: 50141");
  const kLogoStyle = isMaster ? (settings?.logoStyle || "flag") : (selectedUndangan.logoStyle || "flag");
  const kLogoUrl = isMaster ? (settings?.logoUrl || "") : (selectedUndangan.logoUrl || "");

  // Prepare Markdown body (strip Hormat Kami block at the end since we render official table)
  let md = selectedUndangan.contentMarkdown || "";
  const keywords = ["**Hormat Kami,**", "Hormat Kami,", "Hormat kami,", "**Hormat kami,**"];
  for (const kw of keywords) {
    const idx = md.indexOf(kw);
    if (idx !== -1) {
      md = md.substring(0, idx).trim();
      break;
    }
  }

  const bodyHtml = convertMarkdownToHtml(md);

  // Render Logo for Kop
  let logoHtml = "";
  if (kLogoStyle !== "none") {
    if (kLogoStyle === "custom" && kLogoUrl) {
      logoHtml = `<img src="${kLogoUrl}" width="60" height="60" style="object-fit: contain;" />`;
    } else {
      // Inline beautiful standard icon representation in SVG for high fidelity
      const svgFlag = `<svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`;
      logoHtml = svgFlag;
    }
  }

  // Determine which signatures to show
  const showKetua = selectedUndangan.showKetuaSignature !== false;
  const showSekretaris = selectedUndangan.showSekretarisSignature !== false;
  const showBendahara = selectedUndangan.showBendaharaSignature === true;
  const showStempel = selectedUndangan.showStempel !== false && settings?.stempelUrl;

  // Render signatures row
  let activeSignatoriesCount = 0;
  if (showKetua) activeSignatoriesCount++;
  if (showSekretaris) activeSignatoriesCount++;
  if (showBendahara) activeSignatoriesCount++;

  let signatureTableHtml = "";
  if (activeSignatoriesCount > 0) {
    // We build columns for the signatures
    const widthPercentage = Math.floor(100 / activeSignatoriesCount);
    let columnsHtml = "";

    // 1. Ketua
    if (showKetua) {
      const ketuaRole = selectedUndangan.signatoryRole || "Ketua Panitia";
      const ketuaName = selectedUndangan.signatoryName || settings?.signatureKetuaName || "Fx. Mawardi";
      const signatureImg = settings?.signatureKetuaUrl 
        ? `<img src="${settings.signatureKetuaUrl}" width="110" height="55" style="object-fit: contain; max-height: 55px; margin: 5px auto;" />` 
        : `<div style="height: 55px;"></div>`;
      
      columnsHtml += `
        <td width="${widthPercentage}%" align="center" style="vertical-align: top; padding: 10px;">
          <div style="font-weight: bold; text-transform: uppercase; font-size: 9.5pt; color: #1e293b; margin-bottom: 8px;">
            ${ketuaRole}
          </div>
          ${signatureImg}
          <div style="margin-top: 8px;">
            <span style="font-weight: bold; border-bottom: 1px solid #334155; padding-bottom: 1px; color: #0f172a; font-size: 10.5pt;">
              ${ketuaName}
            </span>
          </div>
        </td>
      `;
    }

    // 2. Sekretaris
    if (showSekretaris) {
      const sekRole = selectedUndangan.signatoryRole2 || "Sekretaris Panitia";
      const sekName = selectedUndangan.signatoryName2 || settings?.signatureSekretarisName || "Tri Setiawan";
      const signatureImg = settings?.signatureSekretarisUrl 
        ? `<img src="${settings.signatureSekretarisUrl}" width="110" height="55" style="object-fit: contain; max-height: 55px; margin: 5px auto;" />` 
        : `<div style="height: 55px;"></div>`;
      
      columnsHtml += `
        <td width="${widthPercentage}%" align="center" style="vertical-align: top; padding: 10px;">
          <div style="font-weight: bold; text-transform: uppercase; font-size: 9.5pt; color: #1e293b; margin-bottom: 8px;">
            ${sekRole}
          </div>
          ${signatureImg}
          <div style="margin-top: 8px;">
            <span style="font-weight: bold; border-bottom: 1px solid #334155; padding-bottom: 1px; color: #0f172a; font-size: 10.5pt;">
              ${sekName}
            </span>
          </div>
        </td>
      `;
    }

    // 3. Bendahara
    if (showBendahara) {
      const bendRole = selectedUndangan.signatoryRole3 || "Bendahara Panitia";
      const bendName = selectedUndangan.signatoryName3 || settings?.signatureBendaharaName || "Heri Prasetyo";
      const signatureImg = settings?.signatureBendaharaUrl 
        ? `<img src="${settings.signatureBendaharaUrl}" width="110" height="55" style="object-fit: contain; max-height: 55px; margin: 5px auto;" />` 
        : `<div style="height: 55px;"></div>`;
      
      columnsHtml += `
        <td width="${widthPercentage}%" align="center" style="vertical-align: top; padding: 10px;">
          <div style="font-weight: bold; text-transform: uppercase; font-size: 9.5pt; color: #1e293b; margin-bottom: 8px;">
            ${bendRole}
          </div>
          ${signatureImg}
          <div style="margin-top: 8px;">
            <span style="font-weight: bold; border-bottom: 1px solid #334155; padding-bottom: 1px; color: #0f172a; font-size: 10.5pt;">
              ${bendName}
            </span>
          </div>
        </td>
      `;
    }

    // If there is a stamp, we can position it as floating or inside a relative box.
    // In Word, it's safer to put a beautiful background image or put a small label or embed the stamp inline.
    // For Word compatibility, let's render the stamp nicely below or in an extra row/absolute table overlay.
    // To keep formatting solid, we can display the stamp in a small sub-table or centered container,
    // or as an overlay cell if possible.
    let stampHtml = "";
    if (showStempel) {
      stampHtml = `
        <div style="text-align: left; margin-top: -15px; margin-bottom: 15px; padding-left: 20px;">
          <table border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="border: none; padding: 0;">
                <img src="${settings.stempelUrl}" width="80" height="80" style="opacity: 0.85;" />
              </td>
              <td style="border: none; padding-left: 10px; font-size: 8.5pt; color: #ef4444; vertical-align: middle; font-weight: bold; text-transform: uppercase;">
                STEMPEL RESMI RW 04 NGABEAN
              </td>
            </tr>
          </table>
        </div>
      `;
    }

    signatureTableHtml = `
      <div style="margin-top: 30pt; page-break-inside: avoid;">
        <p style="font-weight: bold; color: #0f172a; margin-bottom: 10pt;">Hormat Kami,</p>
        ${stampHtml}
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-top: 10pt;">
          <tr>
            ${columnsHtml}
          </tr>
        </table>
      </div>
    `;
  }

  // Construct complete high-fidelity Word HTML document
  const wordDocumentHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <title>${selectedUndangan.subject}</title>
  <style>
    @page {
      size: A4;
      margin: 1.0in 1.0in 1.0in 1.0in;
    }
    body {
      font-family: "Arial", "Calibri", "Helvetica", sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #334155;
    }
    h1 {
      font-size: 16pt;
      font-weight: bold;
      color: #0f172a;
      margin-top: 18pt;
      margin-bottom: 8pt;
    }
    h2 {
      font-size: 13pt;
      font-weight: bold;
      color: #1e293b;
      margin-top: 14pt;
      margin-bottom: 6pt;
    }
    p {
      margin-top: 0;
      margin-bottom: 8pt;
      text-align: justify;
    }
    ul, ol {
      margin-top: 0;
      margin-bottom: 8pt;
      padding-left: 20pt;
    }
    li {
      margin-bottom: 3pt;
    }
    .kop-title-1 {
      font-size: 9.5pt;
      font-weight: bold;
      color: #ef4444;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .kop-title-2 {
      font-size: 13.5pt;
      font-weight: 800;
      color: #1e293b;
      text-transform: uppercase;
    }
    .kop-address {
      font-size: 9pt;
      color: #64748b;
      font-style: italic;
    }
    .kop-contact {
      font-size: 8pt;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  
  <!-- Kop Surat (Header) Table -->
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 12pt;">
    <tr>
      ${logoHtml ? `<td width="70" align="left" style="vertical-align: middle; padding-right: 15px; border: none;">${logoHtml}</td>` : ""}
      <td align="left" style="vertical-align: middle; border: none;">
        <div class="kop-title-1">${kLine1}</div>
        <div class="kop-title-2">${kLine2}</div>
        <div class="kop-address">${kLine3}</div>
        <div class="kop-contact">${kLine4}</div>
      </td>
    </tr>
  </table>

  <!-- Kop Divider Line -->
  <div style="border-top: 1px solid #1e293b; border-bottom: 3px double #1e293b; height: 3px; margin-bottom: 20pt; font-size: 1px; line-height: 1px;">&nbsp;</div>

  <!-- Document Body Content -->
  <div style="padding-left: 5px; padding-right: 5px;">
    ${bodyHtml}
  </div>

  <!-- Signature Row Block -->
  ${signatureTableHtml}

  <!-- Footer Watermark info -->
  <div style="margin-top: 40pt; border-top: 1px solid #e2e8f0; padding-top: 8px; text-align: center; font-size: 8pt; color: #94a3b8;">
    Panitia HUT RI Ke-81 RW 04 Ngabean Semarang • Sistem Administrasi Surat Digital (DOC Export)
  </div>

</body>
</html>
`;

  try {
    const blob = new Blob([wordDocumentHtml], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export Word file:", error);
    alert(
      "Gagal mengekspor berkas Word.\n\n" +
      "Silakan coba buka aplikasi di tab penuh dengan tombol 'Open in new tab' di sudut kanan atas jika download diblokir oleh iframe browser."
    );
  }
}
