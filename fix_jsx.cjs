const fs = require('fs');
const code = fs.readFileSync('src/components/MonitoringView.tsx', 'utf-8');

// Find renderFormalCover start and end
const start = code.indexOf('const renderFormalCover = () => {');
const nextFunc = code.indexOf('const renderFormalTitlePage = () => {');

const block = code.substring(start, nextFunc);
console.log(block);
