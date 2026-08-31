var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// test_gen.ts
var import_fs = __toESM(require("fs"), 1);
var code = import_fs.default.readFileSync("src/components/MonitoringView.tsx", "utf-8");
var startIdx = code.indexOf("const generateLocalLPJ =");
var endIdx = code.indexOf("};", startIdx) + 2;
var funcStr = code.substring(startIdx, endIdx);
var script = `
  const formatRp = (val) => "Rp " + val;
  const useMockData = false;
  const namaRW = "RW 04";
  const namaKegiatan = "HUT";
  const tanggalLPJ = "17 Aug";
  const totalPemasukan = 0;
  const totalPengeluaran = 0;
  const saldoSisa = 0;
  const persenTugas = 0;
  const totalTasks = 0;
  const completedTasks = 0;
  const processingTasks = 0;
  const pendingTasks = 0;
  const rtRows = "";
  const totalTargetRT = 0;
  const totalCollectedRT = 0;
  const avgPctRT = 0;
  
  ${funcStr}
  
  const text = generateLocalLPJ('formal');
  const pages = text.split("---").map(p => p.trim()).filter(p => p.length > 0);
  console.log("TOTAL PAGES:", pages.length);
  pages.forEach((p, i) => console.log("PAGE", i, ":", p.substring(0, 50).replace(/\\n/g, ' ')));
`;
import_fs.default.writeFileSync("test_run.js", script);
