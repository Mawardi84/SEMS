const fs = require('fs');

function fix(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Make sure the main virtual paper wrapper in MonitoringView doesn't add padding during print
  // In MonitoringView.tsx:
  // <div className="p-4 sm:p-8 bg-slate-200/60 h-[800px] overflow-y-auto select-text print:h-auto print:bg-transparent print:p-0 print:overflow-visible">
  
  // And the getPaperClass:
  // let base = "relative p-8 sm:p-14 shadow-md max-w-[813px] min-h-[1247px] mx-auto select-text overflow-hidden transition-all duration-300 z-10 break-after-page flex flex-col justify-between print:min-h-0 print:shadow-none print:border-none  print:mb-0 print:break-after-page ";
  // Let's add print:max-w-none print:mx-0 print:p-10 (to give physical margins to the content) 
  // Wait, the CSS uses F4 paper and margin: 0; 
  // So the paper element ITSELF needs to be the page size OR we rely on print:max-w-none and just padding.
  
  code = code.replace(
    /let base = "relative p-8 sm:p-14 shadow-md max-w-\[813px\] min-h-\[1247px\] mx-auto select-text overflow-hidden transition-all duration-300 z-10 break-after-page flex flex-col justify-between print:min-h-0 print:shadow-none print:border-none  print:mb-0 print:break-after-page ";/g,
    'let base = "relative p-8 sm:p-14 shadow-md max-w-[813px] min-h-[1247px] mx-auto select-text overflow-hidden transition-all duration-300 z-10 break-after-page flex flex-col justify-between print:min-h-0 print:max-w-none print:mx-0 print:shadow-none print:border-none print:mb-0 print:break-after-page ";'
  );
  
  fs.writeFileSync(file, code);
}
fix('src/components/MonitoringView.tsx');
