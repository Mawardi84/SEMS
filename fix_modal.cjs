const fs = require('fs');

function fixModal(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Find where I placed it inside the red box:
  // " | Kas Keluar {formatRp(keuangan.filter(t => t.type === 'Keluar').reduce((s,t) => s+t.amount,0))}\n                    <div className="space-y-5">"
  
  code = code.replace(
    /(\| Kas Keluar[^}]+\}\)\)\}\n)\s*<div className="space-y-5">/,
    '$1                    </div>\n                    <div className="space-y-5">'
  );
  
  // Remove the extra </div> I added later
  code = code.replace(
    /<\/PDFPreviewModal>\n<\/div>\n                  <\/div>\n                \);\n              \}\)\(\)/,
    '</PDFPreviewModal>\n                  </div>\n                );\n              })()'
  );
  
  fs.writeFileSync(file, code);
}

fixModal('src/components/MonitoringView.tsx');
fixModal('src/components/ProposalView.tsx');
