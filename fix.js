const fs = require('fs');
let code = fs.readFileSync('src/components/MonitoringView.tsx', 'utf8');

// The end of renderFormalCover looks like:
//                          <div className="text-[8px] text-slate-400 font-mono">
//                            Sistem Pengelolaan Acara & Keuangan Waktu Nyata (SEMS) • 2026
//                          </div>
//                        </div>
//                      </div>
//                    );
//                  };
//
// We need it to be:
//                          <div className="text-[8px] text-slate-400 font-mono">
//                            Sistem Pengelolaan Acara & Keuangan Waktu Nyata (SEMS) • 2026
//                          </div>
//                        </div>
//                      </div>
//                      </div>
//                    );
//                  };

const search = `                          <div className="text-[8px] text-slate-400 font-mono">
                            Sistem Pengelolaan Acara & Keuangan Waktu Nyata (SEMS) • 2026
                          </div>
                        </div>
                      </div>`;

const replacement = `                          <div className="text-[8px] text-slate-400 font-mono">
                            Sistem Pengelolaan Acara & Keuangan Waktu Nyata (SEMS) • 2026
                          </div>
                        </div>
                      </div>
                      </div>`;

if (code.includes(search)) {
  code = code.replace(search, replacement);
  
  // also let's fix the missing `);` if I deleted it!
  const regexMissingParens = /<\/div>\s*};\s*\/\/\s*Custom themed title page/g;
  if (code.match(regexMissingParens)) {
      code = code.replace(/<\/div>\s*};\s*\/\/\s*Custom themed title page/, '</div>\n);\n};\n// Custom themed title page');
  }
  
  fs.writeFileSync('src/components/MonitoringView.tsx', code);
  console.log("Fixed!");
} else {
  console.log("Not found!");
}
