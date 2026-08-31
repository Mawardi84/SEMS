const fs = require('fs');
let code = fs.readFileSync('src/components/DocumentPreviewRenderer.tsx', 'utf8');

code = code.replace(/print:p-0/g, '');
// Keep the border so the top red line shows up
code = code.replace(/print:border-none/g, '');
code = code.replace(/print:min-h-0/g, 'print:min-h-[330mm]'); // F4 size height
// Also add print:w-[215mm]
code = code.replace(/print:break-after-page/g, 'print:break-after-page print:w-[215mm] print:mx-auto');

fs.writeFileSync('src/components/DocumentPreviewRenderer.tsx', code);
