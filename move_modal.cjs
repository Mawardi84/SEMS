const fs = require('fs');

function moveModal(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Extract the modal part
  const modalStartMatch = code.match(/<PDFPreviewModal\s+isOpen=\{isPreviewOpen\}/);
  if (!modalStartMatch) return;
  
  const modalStartIndex = code.lastIndexOf('<div className="space-y-5">', modalStartMatch.index);
  
  let modalEndIndex = code.indexOf('</PDFPreviewModal>', modalStartMatch.index);
  if (modalEndIndex === -1) return;
  modalEndIndex += '</PDFPreviewModal>'.length;
  
  // Find where the wrapper div ends
  const afterModal = code.indexOf('<!-- 1. Header Area -->', modalEndIndex); 
  // actually the original structure is:
  // <div className="space-y-5">
  //   <PDFPreviewModal> ... </PDFPreviewModal>
  //   {/* 1. Header Area */}
  
  let modalBlock = code.substring(modalStartIndex, modalEndIndex);
  // Remove it from the original location
  code = code.replace(modalBlock, '<div className="space-y-5">');
  
  // Now modify modalBlock to use renderPaperContent()
  modalBlock = modalBlock.replace(/<DocumentPreviewRenderer[\s\S]*?<\/DocumentPreviewRenderer>/, '{renderPaperContent()}');
  
  // Now find where to insert it inside the IIFE.
  // Look for: <div id="document-preview-paper" className="space-y-8 print:space-y-0">
  // We want to place it somewhere inside the IIFE. How about right before the main return of the IIFE?
  // Let's find:
  //                    </div>
  //                  </div>
  //                );
  //              })()
  // 
  
  // Let's insert it right after the outermost wrapper of the IIFE's return.
  // The IIFE returns `<div className="..."> ... </div>`
  
  const iifeReturnString = '                  </div>\n                );\n              })()';
  const insertionPoint = code.indexOf(iifeReturnString);
  if (insertionPoint !== -1) {
     // Wait, the IIFE returns a single JSX element. We can wrap it in a Fragment if we add the modal!
     // Actually, we can just insert the modal before the final `</div>` of the IIFE.
     // Let's find the `</div>\n                );`
     const insertIndex = code.lastIndexOf('</div>', insertionPoint);
     code = code.substring(0, insertIndex) + '\n' + modalBlock + '\n' + code.substring(insertIndex);
  }
  
  fs.writeFileSync(file, code);
}

moveModal('src/components/MonitoringView.tsx');
moveModal('src/components/ProposalView.tsx');
