const fs = require('fs');
let code = fs.readFileSync('src/components/MonitoringView.tsx', 'utf8');

// I need to ensure the end of renderFormalCover is perfectly formed:
//                          <div className="text-[8px] text-slate-400 font-mono">
//                            Sistem Pengelolaan Acara & Keuangan Waktu Nyata (SEMS) • 2026
//                          </div>
//                        </div>
//                      </div>
//                      </div>
//                    );
//                  };
//                  // Custom themed title page for HUT RI

const targetStart = code.indexOf('Sistem Pengelolaan Acara & Keuangan Waktu Nyata (SEMS) • 2026');
const nextFunc = code.indexOf('const renderFormalTitlePage = () => {');
const chunk = code.substring(targetStart, nextFunc);
console.log("OLD CHUNK:\n", chunk);

const newChunk = `Sistem Pengelolaan Acara & Keuangan Waktu Nyata (SEMS) • 2026
                          </div>
                        </div>
                      </div>
                      </div>
                    );
                  };

                  // Custom themed title page for HUT RI
                  `;
code = code.substring(0, targetStart) + newChunk + code.substring(nextFunc);
fs.writeFileSync('src/components/MonitoringView.tsx', code);
console.log("FIXED!");
