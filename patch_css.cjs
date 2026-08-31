const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Set margin to 0 for @page
css = css.replace(/margin: 12mm 10mm 12mm 10mm;/, 'margin: 0;');

fs.writeFileSync('src/index.css', css);
