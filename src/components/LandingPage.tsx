import React from 'react';
import { ArrowRight, Sparkles, Compass, MapPin, Calendar, Award, ShieldCheck, Users } from 'lucide-react';
import { motion } from 'motion/react';
import inspiringBg from '../assets/images/inspiring_independence_bg_1783965067217.jpg';
import hutRiLogo from '../assets/images/hut_ri_81_logo_1783967923469.jpg';

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-4 md:p-12 text-white font-sans selection:bg-red-600 selection:text-white relative overflow-hidden"
      style={{ backgroundImage: `url(${inspiringBg})` }}
    >
      {/* Immersive Dark overlay with high-contrast gradient vignette for cinematic look */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/90 to-red-950/80 mix-blend-multiply z-0"></div>
      
      {/* Dynamic ambient lights & glows representing Javanese warmth and modern cyber-festivity */}
      <div className="absolute top-10 left-10 w-[450px] h-[450px] bg-red-600/15 rounded-full blur-[150px] pointer-events-none z-0 animate-pulse duration-[8s]"></div>
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
      
      {/* Decorative vertical ribbon stripe on the extreme right */}
      <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-red-600 via-white to-red-600 opacity-40 hidden md:block z-10"></div>

      {/* Main Content Container - Perfect Split Grid Layout */}
      <div className="relative z-10 max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        
        {/* Left Column: Patriotic Title & Cultural Context (lg:col-span-7) */}
        <motion.div 
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="lg:col-span-7 space-y-8 flex flex-col items-start text-left"
        >
          {/* Brand Header with App & Village Identity */}
          <div className="flex items-center gap-4 bg-white/5 p-2 pr-5 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center text-white font-black text-xs border border-red-500/30 shadow-lg shadow-red-900/40">
              RW 04
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-white leading-tight">SEMS RW 04</h2>
              <p className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest leading-none mt-1">
                KAMPUNG NGABEAN • SEMARANG
              </p>
            </div>
          </div>

          {/* Title Segment */}
          <div className="space-y-4">
            {/* Immersive Tech Badge */}
            <div className="inline-flex items-center gap-2.5 bg-red-500/10 border border-red-500/30 backdrop-blur-md px-3.5 py-1.5 rounded-full">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[10px] font-black tracking-[0.12em] text-red-200 uppercase">
                EVENT MANAGEMENT SYSTEM (SEMS)
              </span>
            </div>
            
            <p className="text-red-500 font-extrabold tracking-[0.25em] uppercase text-xs sm:text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Dirgahayu Republik Indonesia Ke-81</span>
            </p>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-none uppercase">
              INDONESIA BERDAULAT <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-300 to-yellow-400 drop-shadow-sm">
                ADIL DAN MAKMUR
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-amber-200/90 font-bold italic tracking-wide font-serif">
              "Kedaulatan dalam Keberagaman, Keadilan dalam Persatuan, Kemakmuran untuk Semua"
            </p>
            
            <div className="h-1.5 w-28 bg-gradient-to-r from-red-600 via-amber-500 to-transparent rounded-full"></div>
          </div>

          {/* Context Paragraph integrating application and community details */}
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            Selamat datang di <strong className="text-white font-bold">SEMS RW 04</strong>, platform tata kelola digital terintegrasi untuk menyongsong perayaan kemerdekaan RI Ke-81 di lingkungan <strong className="text-red-400 font-bold">RW 04 Kelurahan Ngabean, Kecamatan Gunungpati, Kota Semarang</strong>. Akses program kerja, transparansi anggaran, and administrasi panitia jadi lebih efisien.
          </p>

          {/* Cultural & Digital System Highlights Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
            <div className="flex items-start gap-3 bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 hover:border-red-500/20 transition-all duration-300 group shadow-sm">
              <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20 group-hover:bg-red-500/20 transition-colors">
                <Compass className="w-5 h-5 text-red-400 shrink-0 group-hover:rotate-45 transition-transform duration-500" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wide">Daulat & Swadaya</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Membangun kemandirian warga melalui musyawarah mufakat & gotong-royong nyata.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 hover:border-amber-500/20 transition-all duration-300 group shadow-sm">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                <Award className="w-5 h-5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wide">Modernisasi Desa</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Kolaborasi administrasi, notulensi, dan lapor kas secara online.</p>
              </div>
            </div>
          </div>

          {/* Location & Time Quick Indicators */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-xs text-slate-400 border-t border-white/5 w-full max-w-xl">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="font-semibold text-slate-300">Gunungpati, Kota Semarang</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-slate-300">Agustus 2026</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-300">Panitia Bersama RW 04</span>
            </div>
          </div>

          {/* CTA Trigger */}
          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onEnter}
              className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-8 py-4.5 rounded-2xl font-black text-base shadow-[0_10px_25px_rgba(220,38,38,0.35)] hover:shadow-[0_15px_30px_rgba(220,38,38,0.5)] transition-all overflow-hidden border border-red-500/20 cursor-pointer"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" style={{ backgroundSize: '200% auto' }}></span>
              <span>MASUK KE DASHBOARD EXECUTIVE</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </motion.button>
          </div>
        </motion.div>

        {/* Right Column: Beautiful, Transparent Logo directly imported (lg:col-span-5) */}
        <motion.div 
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          className="lg:col-span-5 flex flex-col items-center justify-center w-full relative"
        >
          {/* Transparent Floating Logo without background box for seamless blending */}
          <div className="relative group flex flex-col items-center justify-center select-none w-full max-w-sm sm:max-w-md">
            
            {/* Soft ambient light radiating behind the logo */}
            <div className="absolute w-64 h-64 bg-gradient-to-tr from-red-600/30 to-amber-500/20 rounded-full filter blur-[90px] -z-10 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>

            {/* Floating Image Container with clean shadow */}
            <div className="relative transform group-hover:-translate-y-2.5 transition-transform duration-500 flex flex-col items-center justify-center max-w-[240px] sm:max-w-[280px]">
              <img 
                src={hutRiLogo} 
                alt="Logo Resmi HUT RI Ke-81" 
                className="w-full h-auto object-contain drop-shadow-[0_20px_40px_rgba(239,68,68,0.35)]"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Elegant text caption directly beneath the clean logo */}
            <div className="mt-8 flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-amber-300 transition-all duration-300">
              <ShieldCheck className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>LOGO RESMI NASIONAL</span>
            </div>
            
            {/* Tiny details caption */}
            <div className="mt-3 text-[9px] text-slate-400 font-mono text-center tracking-wide">
              Dirancang dengan semangat gotong royong warga RW 04 Ngabean
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}

