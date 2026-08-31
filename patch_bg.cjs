const fs = require('fs');
let code = fs.readFileSync('src/components/MonitoringView.tsx', 'utf-8');

// Add import
const importStatement = `import garudaBg from "../assets/images/garuda_cover_bg_1788103458041.jpg";\n`;
code = code.replace(/import \{ exportToPDF \} from "\.\.\/utils\/pdfExport";/, importStatement + `import { exportToPDF } from "../utils/pdfExport";`);

// Modify the renderFormalCover wrapper div to use the background
code = code.replace(
  /<div className="flex-1 flex flex-col justify-between py-6 px-4 relative min-h-\[900px\] border-4 border-double border-red-600 rounded-lg p-6 bg-white shadow-3xs">/,
  `<div className="flex-1 flex flex-col justify-between py-6 px-4 relative min-h-[900px] border-4 border-double border-red-600 rounded-lg p-6 shadow-3xs overflow-hidden bg-white" style={{ backgroundImage: \`url(\${garudaBg})\`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="absolute inset-0 bg-white/80 z-0"></div>
      <div className="relative z-10 flex flex-col h-full justify-between">`
);

// We need to close this new relative z-10 wrapper at the end of renderFormalCover
code = code.replace(
  /<\/div>\s*<\/div>\s*\);\s*};\s*\/\/\s*Generate the markdown/g,
  `</div>
      </div>
      </div>
    );
  };
  // Generate the markdown`
);

fs.writeFileSync('src/components/MonitoringView.tsx', code);
console.log("Patched background image into MonitoringView.tsx");
