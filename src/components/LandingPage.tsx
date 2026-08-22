import React from 'react';
import { ArrowRight, Sparkles, Compass, MapPin, Calendar, Award, ShieldCheck, Users } from 'lucide-react';
import { motion } from 'motion/react';
import inspiringBg from '../assets/images/inspiring_independence_bg_1783965067217.jpg';
import HutRi81Logo from './HutRi81Logo';

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-4 md:p-12 text-white font-sans selection:bg-red-700 selection:text-white relative overflow-hidden"
      style={{ backgroundImage: `url(${inspiringBg})` }}
    >
      {/* Elegant, sophisticated overlay - Deep maroon to rich crimson */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/95 to-red-950/90 z-0"></div>
      
      {/* Subtle, premium lighting effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
      
      {/* Delicate vertical accent line */}
      <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent hidden lg:block z-10"></div>

      {/* Main Content Container - Refined Split Layout */}
      <div className="relative z-10 max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center px-4 sm:px-8">
        
        {/* Left Column: Elegant Typography & Context (lg:col-span-7) */}
        <motion.div 
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="lg:col-span-7 space-y-10 flex flex-col items-start text-left"
        >
          {/* Refined Brand Header */}
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md pl-2 pr-6 py-2 rounded-full border border-white/10 shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-b from-red-600 to-red-800 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-inner">
              RW 04
            </div>
            <div className="flex flex-col">
              <h2 className="text-xs font-semibold tracking-[0.2em] text-white/90 uppercase">Sistem Tata Kelola</h2>
              <p className="text-[10px] text-amber-400/90 font-medium tracking-widest mt-0.5 uppercase">
                Ngabean • Semarang
              </p>
            </div>
          </div>

          {/* Title Segment */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium tracking-[0.2em] text-slate-300 uppercase">
                Peringatan Kemerdekaan Ke-81
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              Indonesia <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-200 to-white">
                Maju & Sejahtera
              </span>
            </h1>
            
            <div className="h-px w-32 bg-gradient-to-r from-red-500 to-transparent"></div>
            
            <p className="text-lg sm:text-xl text-slate-300 font-light leading-relaxed max-w-xl">
              Platform administrasi eksekutif terpadu untuk kepanitiaan HUT RI Ke-81. Menghadirkan transparansi, efisiensi, dan sinergi dalam setiap tahap perencanaan hingga pelaporan.
            </p>
          </div>

          {/* Elegant Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
            <div className="flex flex-col gap-4 bg-white/[0.03] backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:bg-white/[0.05] transition-colors duration-300">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <Compass className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white tracking-wide">Transparansi Data</h4>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed font-light">Pemantauan anggaran dan program kerja secara real-time dan terstruktur.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 bg-white/[0.03] backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:bg-white/[0.05] transition-colors duration-300">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white tracking-wide">Laporan Otomatis</h4>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed font-light">Sistem pintar untuk generasi notulensi dan Laporan Pertanggungjawaban.</p>
              </div>
            </div>
          </div>

          {/* Minimalist CTA */}
          <div className="pt-4 flex items-center gap-6">
            <button
              onClick={onEnter}
              className="group relative inline-flex items-center justify-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-full font-semibold text-sm hover:bg-slate-100 transition-all duration-300 cursor-pointer shadow-[0_0_40px_rgba(255,255,255,0.1)]"
            >
              <span>Akses Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
            
            <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-400 tracking-wider">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                <span>Akses Terbatas</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Premium Visual Presentation (lg:col-span-5) */}
        <motion.div 
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
          className="lg:col-span-5 flex flex-col items-center justify-center w-full relative mt-10 lg:mt-0"
        >
          <div className="relative group flex flex-col items-center justify-center w-full max-w-md">
            
            {/* Elegant glowing backdrop */}
            <div className="absolute w-[120%] h-[120%] bg-gradient-to-tr from-red-600/20 via-transparent to-amber-500/10 rounded-full filter blur-[60px] -z-10 transition-opacity duration-700 opacity-70 group-hover:opacity-100"></div>

            {/* Empty Container / Placeholder as requested */}
            <div className="relative z-10 p-2 sm:p-4 w-full max-w-lg min-h-[160px] flex items-center justify-center">
              {/* Logo dikosongkan sementara */}
            </div>

            {/* Premium status indicator */}
            <div className="mt-12 flex flex-col items-center gap-3">
              <div className="flex items-center gap-3 px-5 py-2 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-medium tracking-[0.2em] text-slate-300 uppercase">
                  Sistem Beroperasi
                </span>
              </div>
              <p className="text-[10px] text-slate-500 tracking-widest uppercase">
                Versi 2.0 • Agustus 2026
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}

