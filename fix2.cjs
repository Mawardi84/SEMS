const fs = require('fs');

function fix(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  code = code.replace(
    /(\*LPJ Konsolidasi Real-time[^\n]+)\n\s*<div className="space-y-5">/,
    '$1\n                    </div>\n                    <div className="space-y-5">'
  );
  
  // also wait, I need to check if the extra </div> is there at the end
  code = code.replace(
    /<\/PDFPreviewModal>\n<\/div>\n\n                  <\/div>\n                \);\n              \}\)\(\)/,
    '</PDFPreviewModal>\n                  </div>\n                );\n              })()'
  );
  
  fs.writeFileSync(file, code);
}
fix('src/components/MonitoringView.tsx');
fix('src/components/ProposalView.tsx');
