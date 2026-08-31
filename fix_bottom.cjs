const fs = require('fs');

function fix(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace the last </div> before ); with </>
  const match = code.match(/<\/div>\n\s*\);\n\}/);
  if (match) {
    code = code.replace(/<\/div>\n\s*\);\n\}/, '</>\n  );\n}');
  }
  
  fs.writeFileSync(file, code);
}
fix('src/components/MonitoringView.tsx');
fix('src/components/ProposalView.tsx');
