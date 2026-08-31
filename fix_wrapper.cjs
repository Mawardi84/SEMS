const fs = require('fs');

function fix(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // The wrapper is: <div className="p-4 sm:p-8 bg-slate-200/60 h-[800px] overflow-y-auto select-text print:h-auto print:bg-white print:overflow-visible">
  code = code.replace(
    /className="p-4 sm:p-8 bg-slate-200\/60 h-\[800px\] overflow-y-auto select-text print:h-auto print:bg-white print:overflow-visible"/g,
    'className="p-4 sm:p-8 bg-slate-200/60 h-[800px] overflow-y-auto select-text print:h-auto print:bg-transparent print:p-0 print:overflow-visible"'
  );
  
  fs.writeFileSync(file, code);
}
fix('src/components/MonitoringView.tsx');
fix('src/components/ProposalView.tsx');
