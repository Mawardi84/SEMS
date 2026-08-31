const fs = require('fs');

function fix(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  code = code.replace(
    /<\/PDFPreviewModal>\n\s*<\/div>\n\s*\);\n\s*\}\)\(\)/,
    '</PDFPreviewModal>\n                  </div>\n                  </div>\n                );\n              })()'
  );
  
  fs.writeFileSync(file, code);
}
fix('src/components/MonitoringView.tsx');
fix('src/components/ProposalView.tsx');
