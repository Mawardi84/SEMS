import React from "react";
import { 
  Users, 
  Star, 
  ShieldCheck, 
  HelpCircle, 
  User, 
  Award, 
  Layers,
  Phone,
  MapPin,
  ClipboardList
} from "lucide-react";
import { Panitia, SystemSetting } from "../types";

interface OrgChartProps {
  panitia: Panitia[];
  settings: SystemSetting;
  printMode?: boolean;
}

export default function OrgChart({ panitia, settings, printMode = false }: OrgChartProps) {
  // Check if we should use fallback mockup data (if no panitia are registered)
  const isDbEmpty = panitia.length === 0;

  // Modern default mock panitia to display if empty, or to complete missing roles
  const defaultPanitia: Panitia[] = [
    { id: "def_1", name: "Karto", role: "Ketua RW", phone: "-", rt: "RT 01", seksi: "-" },
    { id: "def_3", name: "Muh Zaenun", role: "Ketua Panitia", phone: "-", rt: "RT 01", seksi: "-" },
    { id: "def_3b", name: "Faldan", role: "Wakil Ketua", phone: "-", rt: "RT 02", seksi: "-" },
    { id: "def_4a", name: "Mawardi", role: "Sekretaris", phone: "-", rt: "RT 01", seksi: "-" },
    { id: "def_5a", name: "Dias Ayu", role: "Bendahara", phone: "-", rt: "RT 04", seksi: "-" },
    { id: "def_6", name: "Ade Rahmat", role: "Koordinator", phone: "-", rt: "RT 01", seksi: "Divisi Acara Terpadu" },
    { id: "def_7", name: "Gunarso", role: "Sub-Koordinator Lomba", phone: "-", rt: "RT 03", seksi: "Divisi Acara Terpadu" },
    { id: "def_8", name: "Eva", role: "Sub-Koordinator Pentas Seni", phone: "-", rt: "RT 02", seksi: "Divisi Acara Terpadu" },
    { id: "def_9", name: "Sandy", role: "Koordinator Logistik", phone: "-", rt: "RT 03", seksi: "Divisi Operasional Lapangan" },
    { id: "def_10", name: "Dita", role: "Koordinator Humas", phone: "-", rt: "RT 04", seksi: "Support & Humas" }
  ];

  const activePanitia = isDbEmpty ? defaultPanitia : panitia;

  // Extract core officers from the active list
  const penanggungJawabList = activePanitia.filter(p => p.role.toLowerCase().includes("ketua rw"));
  
  // Find primary leaders or fallback
  const ketuaList = activePanitia.filter(p => p.role.toLowerCase().includes("ketua panitia") || p.role.toLowerCase() === "ketua");
  const wakilKetuaList = activePanitia.filter(p => p.role.toLowerCase().includes("wakil ketua") || p.role.toLowerCase() === "wakil" || p.role.toLowerCase() === "wakil ketua panitia");
  const sekretarisList = activePanitia.filter(p => p.role.toLowerCase().includes("sekretaris"));
  const bendaharaList = activePanitia.filter(p => p.role.toLowerCase().includes("bendahara"));

  // Functional divisions (exclude BPH, Kesekretariatan, Sekretaris, Bendahara, and executive leadership)
  const semsSeksiList = (settings?.seksiList || []).filter(s => {
    const lower = (s || "").toLowerCase();
    return (
      !lower.includes("bph") &&
      !lower.includes("kesekretariatan") &&
      !lower.includes("sekretar") &&
      !lower.includes("bendahar") &&
      !lower.includes("penanggung") &&
      !lower.includes("ketua")
    );
  });

  // Group members into section groupings
  const seksiGroups = semsSeksiList.map(seksiName => {
    const members = activePanitia.filter(p => p.seksi === seksiName);
    const koordinator = members.find(p => 
      p.role.toLowerCase().includes("koordinator") || 
      p.role.toLowerCase().includes("ketua seksi") || 
      p.role.toLowerCase().includes("kabid") ||
      p.role.toLowerCase().includes("sub-koordinator")
    );
    const anggota = members.filter(p => p !== koordinator);

    return {
      name: seksiName,
      koordinator: koordinator || null,
      anggota: anggota,
      totalCount: members.length
    };
  }).filter(group => {
    const lower = group.name.toLowerCase();
    return (
      !lower.includes("bph") &&
      !lower.includes("kesekretariatan") &&
      !lower.includes("sekretar") &&
      !lower.includes("bendahar") &&
      (group.totalCount > 0 || !isDbEmpty)
    );
  });

  // Helper to format phone
  const formatPhone = (num: string) => num || "-";

  // Card Styling Constants based on print mode
  const bgMain = printMode ? "bg-white text-slate-900 border-slate-300" : "bg-slate-50 text-slate-800 border-slate-200/80";
  const textTitle = printMode ? "text-slate-900" : "text-slate-800";
  
  return (
    <div className={`w-full font-sans ${printMode ? "p-2 bg-white" : "p-4 space-y-6"}`}>
      
      {/* 1. Database Status Alert (Dashboard Mode Only) */}
      {!printMode && isDbEmpty && (
        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800 flex items-start gap-2.5 shadow-3xs">
          <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-extrabold text-amber-900">Mode Simulasi Aktif:</strong>
            <p className="mt-0.5 text-[11px] leading-relaxed">
              Database kepanitiaan masih kosong. Kami menyajikan bagan simulasi (mockup data) lengkap di bawah ini untuk menunjukkan visualisasi struktural yang utuh. Daftarkan panitia rill di tab <strong>Struktur Panitia</strong> untuk memperbarui bagan secara otomatis.
            </p>
          </div>
        </div>
      )}

      {/* 2. Title Block (Dashboard Mode Only) */}
      {!printMode && (
        <div className="text-center pb-2 border-b border-slate-100">
          <span className="bg-red-50 text-red-700 text-[9px] font-sans font-black px-2.5 py-0.5 rounded-full border border-red-200 uppercase tracking-widest">
            Struktur Organisasi
          </span>
          <h3 className="font-black text-slate-800 text-sm sm:text-base uppercase tracking-wider mt-1.5">
            Bagan Alur Kepanitiaan Event RW 04 Ngabean
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5 max-w-lg mx-auto">
            Garis koordinasi dan tanggung jawab fungsional dalam mensukseskan perayaan HUT RI Ke-81.
          </p>
        </div>
      )}

      {/* 3. The Tree Diagram Wrapper */}
      <div className="flex flex-col items-center w-full space-y-6">
        
        {/* ROW 1: PENANGGUNG JAWAB (Top Row) */}
        <div className="flex flex-wrap justify-center gap-4 w-full max-w-3xl">
          {/* Penanggung Jawab Card */}
          <div className="flex flex-col items-center shrink-0">
            <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 ${printMode ? "bg-slate-100 text-slate-700 border border-slate-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
              Penanggung Jawab
            </span>
            <div className={`px-4 py-2 border rounded-md shadow-3xs text-center min-w-[150px] max-w-[180px] bg-white`}>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Ketua RW</span>
              </div>
              <p className="text-[11px] font-black text-slate-800 line-clamp-1">
                {penanggungJawabList.length > 0 ? (penanggungJawabList.map(p => p.name || "[Nama]").join(", ")) : "Ketua RW 04"}
              </p>
              <p className="text-[9px] font-mono text-slate-500 font-bold mt-0.5">
                Pimpinan Wilayah
              </p>
            </div>
          </div>
        </div>

        {/* Vertical Line Connector */}
        <div className="h-4 w-0.5 bg-slate-300" />

        {/* ROW 2: KETUA PANITIA (Main Center Core) & WAKIL KETUA PANITIA */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full max-w-2xl">
          {/* Ketua Panitia */}
          <div className="flex flex-col items-center shrink-0 w-[160px] sm:w-[180px]">
            <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 ${printMode ? "bg-red-50 text-red-700 border border-red-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              Ketua Panitia
            </span>
            <div className={`px-4 py-2 border-2 rounded-md shadow-xs text-center w-full transition-all duration-150 ${
              printMode 
                ? "border-red-600 bg-white" 
                : "border-red-600 bg-red-50/20 hover:scale-102"
            }`}>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-[9.5px] font-black text-red-700 uppercase tracking-widest">Ketua Pelaksana</span>
              </div>
              <p className="text-xs font-black text-slate-800 truncate">
                {ketuaList.length > 0 ? (ketuaList[0].name || "[Nama]") : "Belum Ditunjuk"}
              </p>
              <p className="text-[9px] font-mono text-slate-500 font-bold mt-0.5">
                {ketuaList.length > 0 && ketuaList[0].phone && ketuaList[0].phone !== "-" ? formatPhone(ketuaList[0].phone) : "Ketua Pelaksana"}
              </p>
            </div>
          </div>

          {/* Wakil Ketua */}
          <div className="flex flex-col items-center shrink-0 w-[160px] sm:w-[180px]">
            <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 ${printMode ? "bg-amber-55 text-amber-800 border border-amber-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
              Wakil Ketua
            </span>
            <div className={`px-4 py-2 border rounded-md shadow-xs text-center w-full transition-all duration-150 ${
              printMode 
                ? "border-amber-500 bg-white" 
                : "border-amber-500 bg-amber-50/10 hover:scale-102"
            }`}>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-amber-600" />
                <span className="text-[9.5px] font-black text-amber-700 uppercase tracking-widest">Wakil Ketua</span>
              </div>
              <p className="text-xs font-black text-slate-800 truncate">
                {wakilKetuaList.length > 0 ? (wakilKetuaList[0].name || "[Nama]") : "Belum Ditunjuk"}
              </p>
              <p className="text-[9px] font-mono text-slate-500 font-bold mt-0.5">
                {wakilKetuaList.length > 0 && wakilKetuaList[0].phone && wakilKetuaList[0].phone !== "-" ? formatPhone(wakilKetuaList[0].phone) : "Wakil Pelaksana"}
              </p>
            </div>
          </div>
        </div>

        {/* Vertical Line Connector */}
        <div className="h-4 w-0.5 bg-slate-300" />

        {/* ROW 3: SEKRETARIS & BENDAHARA */}
        <div className="flex justify-center gap-4 sm:gap-8 w-full max-w-2xl">
          
          {/* Sekretaris Card */}
          <div className="flex flex-col items-center shrink-0 w-[140px] sm:w-[170px]">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sekretaris</span>
            <div className="px-3.5 py-2 border border-slate-200 bg-white rounded-md shadow-3xs text-center w-full">
              <span className="text-[8px] font-extrabold text-indigo-600 uppercase tracking-wider block mb-0.5">Administrasi</span>
              <p className="text-[10.5px] font-bold text-slate-800 truncate">
                {sekretarisList.length > 0 ? (sekretarisList[0].name || "[Nama]") : "Belum Ditunjuk"}
              </p>
              <p className="text-[8px] font-mono text-slate-400 mt-0.5">
                {sekretarisList.length > 0 ? formatPhone(sekretarisList[0].phone) : "-"}
              </p>
            </div>
          </div>

          {/* Bendahara Card */}
          <div className="flex flex-col items-center shrink-0 w-[140px] sm:w-[170px]">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bendahara</span>
            <div className="px-3.5 py-2 border border-slate-200 bg-white rounded-md shadow-3xs text-center w-full">
              <span className="text-[8px] font-extrabold text-amber-600 uppercase tracking-wider block mb-0.5">Keuangan</span>
              <p className="text-[10.5px] font-bold text-slate-800 truncate">
                {bendaharaList.length > 0 ? (bendaharaList[0].name || "[Nama]") : "Belum Ditunjuk"}
              </p>
              <p className="text-[8px] font-mono text-slate-400 mt-0.5">
                {bendaharaList.length > 0 ? formatPhone(bendaharaList[0].phone) : "-"}
              </p>
            </div>
          </div>

        </div>

        {/* Vertical Line Connector to divisions */}
        <div className="h-4 w-0.5 bg-slate-300" />

        {/* ROW 4: SEKSI-SEKSI STRUKTURAL (Grid of Division Cards) */}
        <div className="w-full">
          <div className="text-center mb-3">
            <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Divisi & Seksi Kerja</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full">
            {seksiGroups.map(group => (
              <div 
                key={group.name} 
                className={`p-3 border rounded-md shadow-3xs flex flex-col justify-between bg-white transition-all duration-150 ${
                  printMode 
                    ? "border-slate-300" 
                    : "border-slate-200/80 hover:border-slate-300"
                }`}
              >
                {/* Section Header */}
                <div className="border-b border-slate-100 pb-1.5 mb-2 flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider whitespace-normal break-words leading-tight">
                    Seksi {group.name}
                  </h4>
                  <span className="text-[8px] font-mono bg-slate-100 px-1 py-0.2 rounded text-slate-500 font-bold shrink-0 ml-1">
                    {group.totalCount} orang
                  </span>
                </div>

                {/* Koordinator */}
                <div className="mb-2 bg-slate-50/50 p-1.5 rounded border border-slate-100">
                  <span className="text-[8px] font-extrabold text-red-600 uppercase tracking-wider block leading-none mb-1">
                    Koordinator
                  </span>
                  {group.koordinator ? (
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-800 break-words leading-tight">
                        {group.koordinator.name ? group.koordinator.name.replace(/\s*\(RT\s*\d+\)/gi, "").replace(/\s*RT\s*0?\d+/gi, "").trim() : ""}
                      </p>
                      <p className="text-[7.5px] font-mono text-slate-400 leading-none mt-0.5">
                        {group.koordinator.phone && group.koordinator.phone !== "-" ? group.koordinator.phone : (group.koordinator.role || "Koordinator")}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[9.5px] text-slate-400 italic">Belum ditentukan</p>
                  )}
                </div>

                {/* Anggota List */}
                <div>
                  <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                    Anggota Seksi
                  </span>
                  {group.anggota.length > 0 ? (
                    <div className={`space-y-1 ${printMode ? "" : "max-h-[80px] overflow-y-auto pr-1"}`}>
                      {group.anggota.map((ang) => (
                        <div key={ang.id} className="flex items-center text-[9px] text-slate-700 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-1.5 shrink-0"></span>
                          <span className="font-semibold text-slate-700 break-words leading-tight">{ang.name ? ang.name.replace(/\s*\(RT\s*\d+\)/gi, "").replace(/\s*RT\s*0?\d+/gi, "").trim() : ""}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[8.5px] text-slate-400 italic">Tidak ada anggota tambahan</p>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
