const fs = require('fs');
let code = fs.readFileSync('src/components/ProposalView.tsx', 'utf8');

code = code.replace(
  /(\*Proposal Konsolidasi Real-time[^\n]+)\n\s*<div className="space-y-5">/,
  '$1\n                    </div>\n                    <div className="space-y-5">'
);

fs.writeFileSync('src/components/ProposalView.tsx', code);
