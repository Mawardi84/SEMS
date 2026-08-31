const fs = require('fs');

function fix(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // The main wrapper in MonitoringView:
  // <div className="p-4 sm:p-8 bg-slate-200/60 h-[800px] overflow-y-auto select-text print:h-auto print:bg-white  print:overflow-visible">
  // wait, earlier it was replaced to print:bg-transparent, but it looks like the user still wants print:bg-transparent.
  // Wait, I already fixed getPaperClass, let's see what else might be causing the box.
  
  code = code.replace(
    /className="p-4 sm:p-8 bg-slate-200\/60 h-\[800px\] overflow-y-auto select-text print:h-auto print:bg-white  print:overflow-visible"/g,
    'className="p-4 sm:p-8 bg-slate-200/60 h-[800px] overflow-y-auto select-text print:h-auto print:bg-transparent print:p-0 print:overflow-visible"'
  );
  
  fs.writeFileSync(file, code);
}
fix('src/components/MonitoringView.tsx');
