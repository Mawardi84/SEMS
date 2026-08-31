const fs = require('fs');
let code = fs.readFileSync('src/components/MonitoringView.tsx', 'utf-8');

code = code.replace(
  /<div className="absolute inset-0 bg-white\/80 z-0"><\/div>/,
  `<div className="absolute inset-0 bg-gradient-to-l from-white via-white/90 to-white/30 z-0"></div>`
);

fs.writeFileSync('src/components/MonitoringView.tsx', code);
console.log("Patched background overlay");
