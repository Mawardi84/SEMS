const fs = require('fs');

function patch(file) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(
    /<button\s+onClick={handleExportPDF}\s+className="flex items-center gap-1\.5 bg-indigo-600/g,
    '<button\n                          onClick={() => setIsPreviewOpen(true)}\n                          className="flex items-center gap-1.5 bg-indigo-600'
  );
  fs.writeFileSync(file, code);
}

patch('src/components/MonitoringView.tsx');
patch('src/components/ProposalView.tsx');
