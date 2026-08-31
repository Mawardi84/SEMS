const fs = require('fs');
const code = fs.readFileSync('src/components/MonitoringView.tsx', 'utf-8');
const lines = code.split('\n');
console.log(lines.slice(1720, 1745).join('\n'));
