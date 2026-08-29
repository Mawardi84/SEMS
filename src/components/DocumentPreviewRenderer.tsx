import React from "react";
import { X, Award } from "lucide-react";

interface DocumentPreviewRendererProps {
  proposalMarkdown: string;
  paperTheme: "classic" | "creamy" | "minimal" | "green-gold";
  fontStyle: "poppins" | "arial" | "mono";
  namaKegiatan: string;
  namaRW: string;
  namaKetua: string;
  namaSekretaris: string;
  namaBendahara: string;
  namaRWKetua: string;
  eventLogo: string;
  showStamp: boolean;
  useMockData: boolean;
  showLetterhead?: boolean;
  showSignature?: boolean;
  children?: React.ReactNode;
}

export default function DocumentPreviewRenderer({
  proposalMarkdown,
  paperTheme,
  fontStyle,
  namaKegiatan,
  namaRW,
  namaKetua,
  namaSekretaris,
  namaBendahara,
  namaRWKetua,
  eventLogo,
  showStamp,
  useMockData,
  showLetterhead = true,
  showSignature = true,
  children,
}: DocumentPreviewRendererProps) {
  const getPaperClass = () => {
    let base = "relative p-8 sm:p-14 shadow-md max-w-[813px] min-h-[1247px] mx-auto select-text overflow-hidden transition-all duration-300 z-10 break-after-page flex flex-col justify-between print:min-h-0 print:shadow-none print:border-none print:p-0 print:mb-0 print:break-after-page ";
    
    if (paperTheme === "classic") {
      base += "bg-white border-t-[8px] border-t-red-600 border border-slate-200 text-slate-900";
    } else if (paperTheme === "creamy") {
      base += "bg-[#FCF9F2] border-t-[8px] border-t-amber-800 border border-amber-900/15 text-stone-900";
    } else if (paperTheme === "minimal") {
      base += "bg-slate-50 border-t-[8px] border-t-slate-800 border border-slate-300 text-slate-900";
    } else if (paperTheme === "green-gold") {
      base += "bg-emerald-50/10 border-4 border-double border-emerald-600 text-emerald-950";
    }
    
    if (fontStyle === "poppins") {
      base += " font-sans text-[11px] sm:text-[12px] tracking-wide leading-relaxed";
    } else if (fontStyle === "arial") {
      base += " font-sans text-[11px] sm:text-[12px] tracking-normal leading-relaxed";
    } else if (fontStyle === "mono") {
      base += " font-mono text-[10px] sm:text-[11px] tracking-tight leading-normal";
    }
    
    return base;
  };

  const renderRightLogoAndDivider = (dividerColorClass: string = "border-slate-300") => {
    return (
      <div className={`flex items-center shrink-0 pl-3 ml-3 border-l-2 ${dividerColorClass} h-12`}>
        {eventLogo ? (
          <img src={eventLogo} alt="Logo Event" className="w-12 h-12 object-contain" />
        ) : (
          <div className="w-11 h-11 rounded border border-red-200 bg-red-50 flex flex-col items-center justify-center text-red-600 font-extrabold select-none p-0.5 leading-none shadow-3xs shrink-0">
            <span className="text-[7.5px] font-serif font-black tracking-tighter uppercase">HUT RI</span>
            <span className="text-xs font-sans font-black tracking-tighter mt-0.5">81</span>
          </div>
        )}
      </div>
    );
  };

  const renderLetterhead = () => {
    if (!showLetterhead) return null;
    let dividerColor = "border-slate-900/40";
    if (paperTheme === "classic") {
        return (
            <div className="flex justify-between items-center border-b-[3px] border-double border-slate-900 pb-3 mb-6">
                <div className="w-12 h-12 shrink-0" />
                <div className="text-center flex-1 px-3">
                    <h2 className="text-[12px] sm:text-sm font-black tracking-wider uppercase font-serif text-slate-950">{namaKegiatan}</h2>
                    <h3 className="text-[10px] sm:text-xs font-bold uppercase font-serif text-slate-800">{namaRW.toUpperCase()}</h3>
                    <p className="text-[8px] sm:text-[9px] text-slate-500 italic font-serif mt-0.5">Sekretariat: RT 04 Ngabean, Kota Semarang, Jawa Tengah</p>
                </div>
                {renderRightLogoAndDivider("border-slate-900/40")}
            </div>
        );
    }
    if (paperTheme === "creamy") {
        return (
            <div className="flex justify-between items-center border-b-[3px] border-double border-amber-900 pb-3 mb-6">
                <div className="w-12 h-12 shrink-0" />
                <div className="text-center flex-1 px-3">
                    <h2 className="text-[12px] sm:text-sm font-black tracking-wider uppercase font-serif text-amber-950">{namaKegiatan}</h2>
                    <h3 className="text-[10px] sm:text-xs font-bold uppercase font-serif text-amber-900">{namaRW.toUpperCase()}</h3>
                    <p className="text-[8px] sm:text-[9px] text-amber-800/70 italic font-serif mt-0.5 font-bold">PANITIA PERINGATAN KEMERDEKAAN RI KE-81</p>
                </div>
                {renderRightLogoAndDivider("border-amber-900/30")}
            </div>
        );
    }
    if (paperTheme === "minimal") {
        return (
            <div className="flex justify-between items-end border-b border-slate-300 pb-4 mb-6">
                <div className="text-left flex-1">
                    <div className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest font-sans">Dokumen Resmi Pertanggungjawaban</div>
                    <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900 uppercase font-sans mt-0.5">{namaKegiatan}</h2>
                    <p className="text-[9px] sm:text-[10px] text-slate-600 font-sans mt-0.5 font-semibold">{namaRW}, Semarang, Jawa Tengah</p>
                </div>
                {renderRightLogoAndDivider("border-slate-300")}
            </div>
        );
    }
    // Default/Green Gold
    return (
        <div className="flex justify-between items-center border-b-2 border-emerald-800 pb-3 mb-6">
            <div className="text-center flex-1 px-3">
                <h2 className="text-[12px] sm:text-sm font-black tracking-wider uppercase font-serif text-emerald-950">{namaKegiatan}</h2>
                <h3 className="text-[10px] sm:text-xs font-bold uppercase font-serif text-emerald-900">{namaRW.toUpperCase()}</h3>
            </div>
            {renderRightLogoAndDivider("border-emerald-800/30")}
        </div>
    );
  };

  const renderSignatureGrid = () => {
    if (!showSignature) return null;
    return (
      <div className="mt-10 pt-8 border-t border-slate-200/50 space-y-6">
        <div className="grid grid-cols-2 gap-y-10 text-center text-slate-900">
          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Ketua Panitia</p>
            <p className="font-bold underline text-[11px] text-slate-800">{namaKetua}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Sekretaris</p>
            <p className="font-bold underline text-[11px] text-slate-800">{namaSekretaris}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Bendahara</p>
            <p className="font-bold underline text-[11px] text-slate-800">{namaBendahara}</p>
          </div>
          <div className="space-y-1 relative">
            <p className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Mengetahui, Ketua RW</p>
            <div className="h-14 flex items-center justify-center relative">
                {showStamp && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-dashed border-indigo-600/60 flex items-center justify-center rotate-[-12deg] pointer-events-none select-none z-0 shadow-xs">
                    <div className="w-[72px] h-[72px] rounded-full border border-double border-indigo-600/50 flex flex-col items-center justify-center text-[5px] font-sans font-bold text-indigo-600/70 text-center leading-none">
                      <span className="uppercase text-[4px]">PANITIA HUT-RI</span>
                      <Award className="w-3.5 h-3.5 text-indigo-600/80 my-0.5" />
                      <span className="uppercase text-[4.5px] tracking-tight">{namaRW.toUpperCase()} NGABEAN</span>
                    </div>
                  </div>
                )}
            </div>
            <p className="font-bold underline text-[11px] text-slate-800">{namaRWKetua}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
        <div id="printable-lpj-paper" className={getPaperClass()}>
          <div>
            {renderLetterhead()}
            <div className="prose prose-sm max-w-none text-slate-900">
              {children}
            </div>
            {renderSignatureGrid()}
          </div>
          <div className="text-[10px] text-slate-400 text-center mt-6">Dokumen Sistem Manajemen Event RW 04 Ngabean</div>
        </div>
    </>
  );
}
