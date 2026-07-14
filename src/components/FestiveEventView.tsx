 import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Ticket, 
  IdCard, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Play, 
  Printer, 
  Trash2, 
  Plus, 
  Check, 
  Layers, 
  Users, 
  Calendar, 
  MapPin, 
  Grid, 
  QrCode, 
  Flame, 
  Shuffle, 
  Award, 
  Download,
  Search,
  RefreshCw,
  Sliders,
  Image as ImageIcon,
  Maximize,
  Minimize,
  Tv,
  X
} from "lucide-react";
import { SEMSData, Panitia } from "../types";

interface FestiveEventViewProps {
  data: SEMSData;
  defaultTab?: "coupon" | "idcard" | "doorprize";
}

interface Winner {
  id: string;
  name: string;
  prize: string;
  poolType: string;
  timestamp: string;
}

// Cryptographically secure, unbiased random integer selection
const secureRandomInt = (max: number): number => {
  if (max <= 0) return 0;
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    const maxVal = 4294967296; // 2^32
    const limit = maxVal - (maxVal % max);
    while (true) {
      window.crypto.getRandomValues(array);
      if (array[0] < limit) {
        return array[0] % max;
      }
    }
  }
  return Math.floor(Math.random() * max);
};

export default function FestiveEventView({ data, defaultTab = "coupon" }: FestiveEventViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"coupon" | "idcard" | "doorprize">(defaultTab);

  // Keep activeSubTab in sync with defaultTab when defaultTab changes
  useEffect(() => {
    setActiveSubTab(defaultTab);
  }, [defaultTab]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundStyle, setSoundStyle] = useState<"arcade" | "suspense">("suspense");

  // --- KUPON JALAN SEHAT STATES ---
  const [couponTitle, setCouponTitle] = useState("KUPON JALAN SEHAT HUT RI KE 81 TAHUN 2026");
  const [couponOrganizer, setCouponOrganizer] = useState("NGABEAN RW 04");
  const [couponPrize, setCouponPrize] = useState("Indonesia Berdaulat,Adil dan Makmur");
  const [couponDate, setCouponDate] = useState("Minggu, 16 Agustus 2026");
  const [couponTime, setCouponTime] = useState("Pukul 06:00 WIB - Selesai");
  const [couponLocation, setCouponLocation] = useState("Start-Finish: Balai RW 04 Ngabean");
  const [startNum, setStartNum] = useState(1);
  const [couponCount, setCouponCount] = useState(24);
  const [couponTheme, setCouponTheme] = useState<"red-white" | "luxury-gold" | "cyber-festive" | "emerald-green">("red-white");
  const [customPrizeEnabled, setCustomPrizeEnabled] = useState(false);

  // --- ID CARD STATES ---
  const [idCardTheme, setIdCardTheme] = useState<"classic-red" | "modern-dark" | "patriotic-blue">("classic-red");
  const [selectedPanitiaIds, setSelectedPanitiaIds] = useState<string[]>([]);
  const [customAttendeesRaw, setCustomAttendeesRaw] = useState("");
  const [showQrCode, setShowQrCode] = useState(true);
  const [idCardTitle, setIdCardTitle] = useState("PANITIA PELAKSANA");
  const [idCardLogoType, setIdCardLogoType] = useState<"preset" | "upload">("preset");
  const [idCardLogoPreset, setIdCardLogoPreset] = useState<"hutri" | "garuda" | "karangtaruna" | "none">("hutri");
  const [idCardCustomLogo, setIdCardCustomLogo] = useState<string | null>(null);
  const [idCardCustomImage, setIdCardCustomImage] = useState<string | null>(null);

  // --- DOORPRIZE STATES ---
  const [doorprizePoolType, setDoorprizePoolType] = useState<"panitia" | "coupon-range" | "custom-list">("coupon-range");
  const [drawRangeStart, setDrawRangeStart] = useState(1);
  const [drawRangeEnd, setDrawRangeEnd] = useState(100);
  const [customNamesRaw, setCustomNamesRaw] = useState(
    "Budi Santoso\nSiti Rahma\nEko Prasetyo\nDewi Lestari\nJoko Susilo\nSri Wahyuni\nAndi Wijaya\nMegawati\nSusilo Bambang"
  );
  const [selectedPrize, setSelectedPrize] = useState("Sepeda Lipat Kemerdekaan");
  const [customPrizeInput, setCustomPrizeInput] = useState("");
  const [prizesList, setPrizesList] = useState<string[]>([
    "Sepeda Lipat Kemerdekaan",
    "TV LED 32 Inch",
    "Kulkas 1 Pintu",
    "Kompor Gas Rinnai",
    "Magic Com Yong Ma",
    "Kipas Angin Miyako",
    "Setrika Philips",
    "Dispenser Cosmos",
    "Paket Sembako Premium",
    "Blender Sharp"
  ]);
  const [winners, setWinners] = useState<Winner[]>(() => {
    try {
      const saved = localStorage.getItem("sems_doorprize_winners");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Raffle animation states
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShuffleName, setCurrentShuffleName] = useState<string>("SIAP DIUNDI");
  const [winnerResult, setWinnerResult] = useState<string | null>(null);
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; color: string; size: number; delay: number }[]>([]);
  const [drawOnlyNumber, setDrawOnlyNumber] = useState<boolean>(false);
  const [doorprizeTheme, setDoorprizeTheme] = useState<"patriot-red" | "luxury-gold" | "cyber-neon" | "retro-arcade">("patriot-red");
  const [drawDuration, setDrawDuration] = useState<number>(8); // Default 8 seconds
  const [autoSyncRange, setAutoSyncRange] = useState<boolean>(true);

  // Synchronize raffle range with printed coupons automatically if enabled
  useEffect(() => {
    if (autoSyncRange) {
      setDrawRangeStart(startNum);
      setDrawRangeEnd(startNum + couponCount - 1);
    }
  }, [startNum, couponCount, autoSyncRange]);

  // Print States
  const [printMode, setPrintMode] = useState<"coupon" | "idcard" | null>(null);

  // Projector (Fullscreen Overlay) State
  const [projectorMode, setProjectorMode] = useState(false);

  // Ref for Audio Context
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sync winners to localStorage
  useEffect(() => {
    localStorage.setItem("sems_doorprize_winners", JSON.stringify(winners));
  }, [winners]);

  // Init selections for Panitia
  useEffect(() => {
    if (data.panitia && data.panitia.length > 0) {
      setSelectedPanitiaIds(data.panitia.map(p => p.id));
    }
  }, [data.panitia]);

  // Web Audio Procedural Tones for arcade-like or suspense-filled feel
  const playSound = (type: "tick" | "slowdown" | "fanfare", progress?: number) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      if (soundStyle === "suspense") {
        // --- SUSPENSE / HOROR / MENEGANGKAN MODE (Heartbeat & Cinematic Drama) ---
        if (type === "tick") {
          // Double thump heartbeat effect
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.type = "sine";
          // Beat 1: "Lub" at 58Hz
          osc1.frequency.setValueAtTime(58, ctx.currentTime);
          gain1.gain.setValueAtTime(0.3, ctx.currentTime);
          gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
          osc1.start();
          osc1.stop(ctx.currentTime + 0.08);

          // Beat 2: "Dub" at 46Hz after 45ms
          setTimeout(() => {
            try {
              if (!soundEnabled || !audioCtxRef.current) return;
              const osc2 = audioCtxRef.current.createOscillator();
              const gain2 = audioCtxRef.current.createGain();
              osc2.connect(gain2);
              gain2.connect(audioCtxRef.current.destination);
              osc2.type = "sine";
              osc2.frequency.setValueAtTime(46, audioCtxRef.current.currentTime);
              gain2.gain.setValueAtTime(0.24, audioCtxRef.current.currentTime);
              gain2.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.08);
              osc2.start();
              osc2.stop(audioCtxRef.current.currentTime + 0.08);
            } catch (e) {}
          }, 45);

        } else if (type === "slowdown") {
          // Slowing down heartbeat + rising creepy tension slide
          // Heavy, isolated bass thud
          const kick = ctx.createOscillator();
          const kickGain = ctx.createGain();
          kick.connect(kickGain);
          kickGain.connect(ctx.destination);
          kick.type = "sine";
          kick.frequency.setValueAtTime(50, ctx.currentTime);
          kickGain.gain.setValueAtTime(0.35, ctx.currentTime);
          kickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          kick.start();
          kick.stop(ctx.currentTime + 0.15);

          // Dynamic pitch rising with progress
          const prog = progress || 0.7;
          const targetPitch = 300 + prog * 1500; // rises from 1200Hz to 1800Hz
          
          const riser = ctx.createOscillator();
          const riserGain = ctx.createGain();
          riser.connect(riserGain);
          riserGain.connect(ctx.destination);
          riser.type = "triangle";
          riser.frequency.setValueAtTime(targetPitch - 100, ctx.currentTime);
          riser.frequency.exponentialRampToValueAtTime(targetPitch + 150, ctx.currentTime + 0.2);
          
          riserGain.gain.setValueAtTime(0.06, ctx.currentTime);
          riserGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          riser.start();
          riser.stop(ctx.currentTime + 0.2);

        } else if (type === "fanfare") {
          // Huge epic release: Sub-bass crash + beautiful, sparkling major chords
          const sub = ctx.createOscillator();
          const subGain = ctx.createGain();
          sub.connect(subGain);
          subGain.connect(ctx.destination);
          sub.type = "triangle";
          sub.frequency.setValueAtTime(95, ctx.currentTime);
          sub.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.95);
          subGain.gain.setValueAtTime(0.45, ctx.currentTime);
          subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.95);
          sub.start();
          sub.stop(ctx.currentTime + 0.95);

          // Sparkling arpeggiated G-Major / C-Major epic lift
          const chordFreqs = [196.00, 261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
          chordFreqs.forEach((f, idx) => {
            setTimeout(() => {
              try {
                if (!soundEnabled || !audioCtxRef.current) return;
                const o = audioCtxRef.current.createOscillator();
                const g = audioCtxRef.current.createGain();
                o.connect(g);
                g.connect(audioCtxRef.current.destination);
                o.type = idx % 2 === 0 ? "sawtooth" : "sine";
                o.frequency.setValueAtTime(f, audioCtxRef.current.currentTime);
                o.frequency.linearRampToValueAtTime(f * 1.005, audioCtxRef.current.currentTime + 2.0);
                
                // Louder on the final highlight
                const volume = idx === chordFreqs.length - 1 ? 0.14 : 0.08;
                g.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 2.2);
                o.start();
                o.stop(audioCtxRef.current.currentTime + 2.2);
              } catch (e) {}
            }, idx * 65);
          });
        }
      } else {
        // --- RETRO ARCADE MODE (Original) ---
        if (type === "tick") {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
          osc.start();
          osc.stop(ctx.currentTime + 0.05);
        } else if (type === "slowdown") {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "triangle";
          osc.frequency.setValueAtTime(400, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        } else if (type === "fanfare") {
          const freqs = [261.63, 329.63, 392.00, 523.25]; // C major chord
          freqs.forEach((f, idx) => {
            setTimeout(() => {
              try {
                if (!soundEnabled || !audioCtxRef.current) return;
                const osc = audioCtxRef.current.createOscillator();
                const gain = audioCtxRef.current.createGain();
                osc.connect(gain);
                gain.connect(audioCtxRef.current.destination);
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(f, audioCtxRef.current.currentTime);
                osc.frequency.exponentialRampToValueAtTime(f * 2, audioCtxRef.current.currentTime + 0.5);
                gain.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.6);
                osc.start();
                osc.stop(audioCtxRef.current.currentTime + 0.6);
              } catch (e) {}
            }, idx * 80);
          });
        }
      }
    } catch (e) {
      console.warn("Web Audio API not supported or blocked: ", e);
    }
  };

  // Doorprize Engine Raffle Roller
  const handleDrawDoorprize = () => {
    if (isDrawing) return;
    setWinnerResult(null);
    setConfetti([]);

    // 1. Gather contestants pool
    let contestants: string[] = [];
    if (doorprizePoolType === "panitia") {
      if (drawOnlyNumber) {
        contestants = data.panitia.map((p, idx) => `#${String(idx + 1).padStart(3, "0")}`);
      } else {
        contestants = data.panitia.map(p => `${p.name} (${p.role})`);
      }
    } else if (doorprizePoolType === "coupon-range") {
      const start = Math.min(drawRangeStart, drawRangeEnd);
      const end = Math.max(drawRangeStart, drawRangeEnd);
      for (let i = start; i <= end; i++) {
        if (drawOnlyNumber) {
          contestants.push(`${String(i).padStart(3, "0")}`);
        } else {
          contestants.push(`Nomor Kupon #${String(i).padStart(3, "0")}`);
        }
      }
    } else {
      const rawLines = customNamesRaw
        .split("\n")
        .map(n => n.trim())
        .filter(n => n.length > 0);

      if (drawOnlyNumber) {
        contestants = rawLines.map((n, idx) => {
          const match = n.match(/\d+/);
          return match ? match[0].slice(0, 3).padStart(3, "0") : `#${String(idx + 1).padStart(3, "0")}`;
        });
      } else {
        contestants = rawLines;
      }
    }

    if (contestants.length === 0) {
      alert("Harap masukkan atau pastikan peserta undian tersedia!");
      return;
    }

    setIsDrawing(true);
    let speed = 40; // Initial interval speed in ms
    let duration = drawDuration * 1000; // total animation time from state
    let elapsed = 0;
    let index = 0;

    const runShuffle = () => {
      index = secureRandomInt(contestants.length);
      setCurrentShuffleName(contestants[index]);
      
      elapsed += speed;

      if (elapsed < duration * 0.6) {
        // Fast shuffle
        playSound("tick", elapsed / duration);
        setTimeout(runShuffle, speed);
      } else if (elapsed < duration) {
        // Gradual deceleration
        speed += 30;
        playSound("slowdown", elapsed / duration);
        setTimeout(runShuffle, speed);
      } else {
        // Final Winner chosen
        const finalWinner = contestants[index];
        setCurrentShuffleName(finalWinner);
        setWinnerResult(finalWinner);
        setIsDrawing(false);
        playSound("fanfare", 1.0);

        // Record Winner
        const newWinner: Winner = {
          id: "win_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
          name: finalWinner,
          prize: selectedPrize,
          poolType: doorprizePoolType === "panitia" ? "Panitia" : doorprizePoolType === "coupon-range" ? "Kupon Jalan Sehat" : "Daftar Custom",
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
        };
        setWinners(prev => [newWinner, ...prev]);

        // Burst Confetti!
        const colors = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#EC4899", "#8B5CF6", "#FFF"];
        const particles = Array.from({ length: 140 }).map((_, i) => ({
          id: i,
          x: Math.random() * 100, // random start horizontal
          y: Math.random() * 100, // random start vertical
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 10 + 6,
          delay: Math.random() * 0.5
        }));
        setConfetti(particles);
      }
    };

    setTimeout(runShuffle, speed);
  };

  const handleAddPrize = () => {
    if (customPrizeInput.trim() === "") return;
    const item = customPrizeInput.trim();
    if (!prizesList.includes(item)) {
      setPrizesList(prev => [...prev, item]);
      setSelectedPrize(item);
    }
    setCustomPrizeInput("");
  };

  const handleDeletePrize = (itemToDelete: string) => {
    setPrizesList(prev => {
      const updated = prev.filter(p => p !== itemToDelete);
      if (selectedPrize === itemToDelete && updated.length > 0) {
        setSelectedPrize(updated[0]);
      }
      return updated;
    });
  };

  const handleClearWinners = () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua daftar riwayat pemenang undian?")) {
      setWinners([]);
    }
  };

  const handleNextPrize = () => {
    if (prizesList.length <= 1) return;
    const currentIdx = prizesList.indexOf(selectedPrize);
    const nextIdx = (currentIdx + 1) % prizesList.length;
    setSelectedPrize(prizesList[nextIdx]);
    if (!isDrawing) {
      setCurrentShuffleName(drawOnlyNumber ? "000" : "SIAP DIUNDI");
      setWinnerResult(null);
    }
  };

  const handlePrevPrize = () => {
    if (prizesList.length <= 1) return;
    const currentIdx = prizesList.indexOf(selectedPrize);
    const prevIdx = (currentIdx - 1 + prizesList.length) % prizesList.length;
    setSelectedPrize(prizesList[prevIdx]);
    if (!isDrawing) {
      setCurrentShuffleName(drawOnlyNumber ? "000" : "SIAP DIUNDI");
      setWinnerResult(null);
    }
  };

  // Keyboard shortcut listener for Projector Mode (Spacebar to Draw, Escape to Exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!projectorMode) return;
      if (e.code === "Space" || e.key === " ") {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
          return;
        }
        e.preventDefault();
        if (!isDrawing) {
          handleDrawDoorprize();
        }
      } else if (e.key === "Escape") {
        setProjectorMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [projectorMode, isDrawing, handleDrawDoorprize]);

  // Helper function to build range arrays
  const getCouponList = () => {
    const list = [];
    const max = Math.min(couponCount, 1000); // safety cap raised to 1000
    for (let i = 0; i < max; i++) {
      list.push(startNum + i);
    }
    return list;
  };

  // QR mock generator styling helper
  const getBarcodeLines = (num: number) => {
    const seed = num % 7;
    const widths = [
      "w-0.5", "w-1", "w-1.5", "w-0.5", "w-2", "w-0.5", "w-1"
    ];
    const lines = [];
    for (let i = 0; i < 24; i++) {
      const idx = (seed + i) % widths.length;
      lines.push(
        <div key={i} className={`h-full bg-black ${widths[idx]} ${i % 3 === 0 ? "opacity-30" : "opacity-100"}`} />
      );
    }
    return lines;
  };

  // Print Handler
  const handleTriggerPrint = (mode: "coupon" | "idcard") => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
      setPrintMode(null);
    }, 300);
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Confetti Overlays */}
      {confetti.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          {confetti.map((p) => (
            <motion.div
              key={p.id}
              initial={{ y: -50, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
              animate={{ 
                y: "110vh", 
                x: `${p.x + (Math.random() * 20 - 10)}vw`,
                opacity: 0,
                rotate: 720
              }}
              transition={{ 
                duration: Math.random() * 2.5 + 2, 
                delay: p.delay,
                ease: "linear"
              }}
              style={{
                backgroundColor: p.color,
                width: p.size,
                height: p.size,
                borderRadius: Math.random() > 0.5 ? "50%" : "2px"
              }}
              className="absolute shadow-xs"
            />
          ))}
        </div>
      )}

      {/* Main UI Header with beautiful design details */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden print:hidden">
        {/* Subtle decorative colors */}
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-red-600 to-amber-500"></div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider rounded-full border border-red-200">
              {activeSubTab === "coupon"
                ? "CETAK ATRIBUT • KUPON"
                : activeSubTab === "idcard"
                ? "CETAK ATRIBUT • ID CARD"
                : "PERAYAAN • UNDIAN"}
            </span>
            <div className="flex items-center gap-1.5 text-amber-500 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight">
            {activeSubTab === "coupon"
              ? "Cetak Kupon Jalan Sehat"
              : activeSubTab === "idcard"
              ? "Cetak ID Card Panitia"
              : "Undian Doorprize Digital"}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
            {activeSubTab === "coupon"
              ? "Sistem pembuatan dan pencetakan kupon jalan sehat massal otomatis dengan format layout siap print, nomor urut seri, dan barcode pengaman."
              : activeSubTab === "idcard"
              ? "Format desain ID Card resmi panitia pelaksana HUT RI Ke-81 Ngabean Semarang yang siap dicetak masal lengkap dengan barcode QR."
              : "Mesin pengundian doorprize warga dan panitia yang aman dan bebas bias, didukung algoritma kriptografis acak riil, musik pendukung, dan log pemenang."}
          </p>
        </div>

        {/* Audio Toggle button */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            soundEnabled
              ? "bg-slate-900 text-white border-slate-950 hover:bg-slate-800"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Suara Aktif</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-slate-400" />
              <span>Suara Mati</span>
            </>
          )}
        </button>
      </div>

      {/* ======================= TAB 1: KUPON JALAN SEHAT ======================= */}
      {activeSubTab === "coupon" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Controls Panel (4 Columns) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-3xs space-y-5 print:hidden">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-red-600" />
              <span>Pengaturan Kupon</span>
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Judul Utama</label>
                <input 
                  type="text" 
                  value={couponTitle}
                  onChange={(e) => setCouponTitle(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 px-3 py-2 border border-slate-200 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                  placeholder="Judul Kupon"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Penyelenggara</label>
                <input 
                  type="text" 
                  value={couponOrganizer}
                  onChange={(e) => setCouponOrganizer(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 px-3 py-2 border border-slate-200 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                  placeholder="Keterangan RT/RW"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tema HUT RI</label>
                <textarea 
                  rows={2}
                  value={couponPrize}
                  onChange={(e) => setCouponPrize(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 px-3 py-2 border border-slate-200 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none resize-none"
                  placeholder="Ketik tema HUT RI..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tanggal Acara</label>
                  <input 
                    type="text" 
                    value={couponDate}
                    onChange={(e) => setCouponDate(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 px-3 py-2 border border-slate-200 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                    placeholder="Contoh: Minggu, 16 Agustus 2026"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Waktu Acara</label>
                  <input 
                    type="text" 
                    value={couponTime}
                    onChange={(e) => setCouponTime(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 px-3 py-2 border border-slate-200 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                    placeholder="Contoh: Pukul 06:00 WIB"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Lokasi Acara</label>
                <input 
                  type="text" 
                  value={couponLocation}
                  onChange={(e) => setCouponLocation(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 px-3 py-2 border border-slate-200 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                  placeholder="Contoh: Balai RW 04 Ngabean"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Mulai Seri No.</label>
                  <input 
                    type="number" 
                    value={startNum}
                    onChange={(e) => setStartNum(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-xs font-bold text-slate-800 px-3 py-2 border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Jumlah Kupon</label>
                  <input 
                    type="number" 
                    value={couponCount}
                    onChange={(e) => setCouponCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                    className="w-full text-xs font-bold text-slate-800 px-3 py-2 border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                    max={1000}
                  />
                  <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">Max: 1000 kupon</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tema Desain Kupon</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "red-white", label: "Classic Red", color: "bg-red-600" },
                    { id: "luxury-gold", label: "Lux Gold", color: "bg-amber-500" },
                    { id: "cyber-festive", label: "Cyber Modern", color: "bg-slate-900" },
                    { id: "emerald-green", label: "Emerald Green", color: "bg-emerald-600" }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setCouponTheme(t.id as any)}
                      className={`p-2 rounded-xl border text-[11px] font-bold flex items-center gap-2 cursor-pointer transition-all ${
                        couponTheme === t.id
                          ? "border-slate-800 bg-slate-50 text-slate-900 ring-2 ring-slate-800"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${t.color} shrink-0`} />
                      <span className="truncate">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleTriggerPrint("coupon")}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-red-900/10 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Lembar Kupon</span>
                </button>
                <span className="text-[10px] text-slate-400 font-medium leading-tight mt-1 text-center block">
                  Optimalkan cetak menggunakan kertas F4 / Folio dengan grid kupon teratur.
                </span>
              </div>
            </div>
          </div>

          {/* Grid Preview (8 Columns) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Real Print Guide Banner */}
            <div className="bg-slate-900 text-slate-100 p-4 rounded-3xl border border-slate-800 shadow-sm flex items-center justify-between gap-4 print:hidden">
              <div className="flex items-center gap-3">
                <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700 text-amber-400">
                  <Grid className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Pratinjau Lembar Cetak Kupon</h4>
                  <p className="text-[11px] text-slate-400 leading-none">Menampilkan grid kupon jalan sehat dengan double stub (Sobekan Kotak & Sobekan Warga).</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                F4/FOLIO GRID MODE
              </span>
            </div>

            {/* Coupons container */}
            <div 
              id="print-area"
              className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${printMode === "coupon" ? "print-coupon-grid" : ""}`}
            >
              {getCouponList().map((num) => {
                const formattedNum = String(num).padStart(3, "0");
                
                // Theme details mappings
                const themes = {
                  "red-white": {
                    border: "border-red-200",
                    bgHeader: "bg-red-600 text-white",
                    accentText: "text-red-600",
                    stubHeader: "bg-red-700 text-red-50 text-center",
                    dividerDot: "border-red-200"
                  },
                  "luxury-gold": {
                    border: "border-amber-200",
                    bgHeader: "bg-amber-600 text-white",
                    accentText: "text-amber-700",
                    stubHeader: "bg-amber-700 text-amber-50 text-center",
                    dividerDot: "border-amber-200"
                  },
                  "cyber-festive": {
                    border: "border-slate-300",
                    bgHeader: "bg-slate-900 text-white",
                    accentText: "text-slate-900",
                    stubHeader: "bg-slate-800 text-slate-200 text-center",
                    dividerDot: "border-slate-300"
                  },
                  "emerald-green": {
                    border: "border-emerald-200",
                    bgHeader: "bg-emerald-600 text-white",
                    accentText: "text-emerald-700",
                    stubHeader: "bg-emerald-700 text-emerald-50 text-center",
                    dividerDot: "border-emerald-200"
                  }
                };

                const activeTheme = themes[couponTheme] || themes["red-white"];

                return (
                  <div 
                    key={num}
                    className={`bg-white rounded-2xl border-2 ${activeTheme.border} shadow-3xs flex overflow-hidden min-h-[175px] h-full page-break-avoid select-none relative`}
                  >
                    {/* LEFT STUB (RAPAT/KOTAK UNDIAN) - 30% width */}
                    <div className="w-[32%] border-r-2 border-dashed border-slate-300 flex flex-col justify-between relative bg-slate-50/50">
                      
                      {/* Sobek half circle decoration (cut lines) */}
                      <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-4 bg-slate-50 border-2 border-transparent border-l-slate-300 rounded-full z-10 print:bg-white" />

                      <div className={`p-2 text-center ${activeTheme.stubHeader} font-black text-[9px] uppercase tracking-wider py-1.5`}>
                        STUB UNDIAN
                      </div>

                      <div className="p-2 flex-1 flex flex-col items-center justify-center text-center space-y-1.5">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none">SERIAL NUMBER</span>
                        <h2 className={`text-xl font-black ${activeTheme.accentText} font-mono tracking-wider leading-none`}>
                          {formattedNum}
                        </h2>
                        <div className="h-6 flex items-center justify-center gap-0.5 overflow-hidden">
                          {getBarcodeLines(num)}
                        </div>
                        <span className="text-[7px] text-slate-400 font-bold font-mono">MASUKKAN KOTAK</span>
                      </div>

                      <div className="p-1 border-t border-slate-100 text-[6.5px] text-slate-400 font-mono text-center truncate">
                        RW04-NGABEAN-HUT81
                      </div>
                    </div>

                    {/* RIGHT MAIN TICKET (PESERTA COUPOUN) - 68% width */}
                    <div className="flex-1 flex flex-col justify-between">
                      {/* Header bar */}
                      <div className={`px-3 py-1.5 ${activeTheme.bgHeader} flex items-center justify-between`}>
                        <div className="flex items-center gap-1">
                          <Ticket className="w-3.5 h-3.5 text-white/90" />
                          <span className="text-[10px] font-black uppercase tracking-wider leading-none">
                            {couponTitle}
                          </span>
                        </div>
                        <span className="text-[10px] font-black font-mono bg-white text-slate-900 px-1.5 py-0.5 rounded shadow-3xs">
                          {formattedNum}
                        </span>
                      </div>

                      {/* Content block */}
                      <div className="p-3 flex-1 flex flex-col justify-center space-y-1 bg-white">
                        <div className="flex justify-between items-start">
                          <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            PENYELENGGARA: {couponOrganizer}
                          </p>
                        </div>

                        <div className="pt-0.5">
                          <p className="text-[9px] font-black text-slate-700 uppercase leading-snug">
                            Tema HUT RI:
                          </p>
                          <p className={`text-[9.5px] font-black leading-tight ${activeTheme.accentText} uppercase tracking-wide line-clamp-2`}>
                            {couponPrize}
                          </p>
                        </div>

                        {/* Location Details inside Ticket */}
                        <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-slate-100 text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                            <span className="text-[7.5px] font-bold leading-none">{couponDate}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                            <span className="text-[7.5px] font-bold leading-none truncate">{couponLocation}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer bar */}
                      <div className="px-3 py-1 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[7px] text-slate-400 font-mono">
                        <span>Pukul: {couponTime}</span>
                        <span className="text-right font-bold">Harap bawa kupon saat acara</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ======================= TAB 2: ID CARD PANITIA ======================= */}
      {activeSubTab === "idcard" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Controls column (4 Columns) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-3xs space-y-5 print:hidden">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-red-600" />
              <span>Pengaturan ID Card</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Judul ID Card</label>
                <input 
                  type="text" 
                  value={idCardTitle}
                  onChange={(e) => setIdCardTitle(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500"
                  placeholder="Keterangan Atas ID Card"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tema Desain ID Card</label>
                <div className="space-y-1.5">
                  {[
                    { id: "classic-red", label: "Classic Red Patriotic", color: "bg-red-600" },
                    { id: "modern-dark", label: "Cyber Punk Dark Slate", color: "bg-slate-900" },
                    { id: "patriotic-blue", label: "Elegant Deep Blue", color: "bg-blue-800" }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setIdCardTheme(t.id as any)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold flex items-center gap-3 cursor-pointer transition-all ${
                        idCardTheme === t.id
                          ? "border-slate-800 bg-slate-50 text-slate-900 ring-2 ring-slate-800"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${t.color} shrink-0`} />
                      <span className="truncate">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Feature Logo Placeholder (Twibbon Style) */}
              <div className="space-y-3 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-200/60">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Logo Placeholder Header</span>
                
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setIdCardLogoType("preset")}
                    className={`flex-1 py-1.5 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                      idCardLogoType === "preset"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Preset Logo
                  </button>
                  <button
                    onClick={() => setIdCardLogoType("upload")}
                    className={`flex-1 py-1.5 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                      idCardLogoType === "upload"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Unggah Logo Custom
                  </button>
                </div>

                {idCardLogoType === "preset" ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "hutri", label: "Logo HUT RI", badge: "🇲🇨" },
                      { id: "garuda", label: "Garuda Emas", badge: "🦅" },
                      { id: "karangtaruna", label: "Krg Taruna", badge: "🛡️" },
                      { id: "none", label: "Tanpa Logo", badge: "❌" }
                    ].map((logoOpt) => (
                      <button
                        key={logoOpt.id}
                        type="button"
                        onClick={() => setIdCardLogoPreset(logoOpt.id as any)}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                          idCardLogoPreset === logoOpt.id
                            ? "border-slate-800 bg-white ring-2 ring-slate-800/80"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{logoOpt.badge}</span>
                          <span className="text-[10px] font-black text-slate-800 leading-none">{logoOpt.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {idCardCustomLogo ? (
                        <div className="relative w-10 h-10 border border-slate-200 rounded-lg overflow-hidden shrink-0 bg-white">
                          <img src={idCardCustomLogo} alt="Custom Logo" className="w-full h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setIdCardCustomLogo(null)}
                            className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold"
                          >
                            Hapus
                          </button>
                        </div>
                      ) : (
                        <div className="w-10 h-10 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 shrink-0 bg-white">
                          <Plus className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setIdCardCustomLogo(event.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                          id="idcard_logo_uploader"
                        />
                        <label
                          htmlFor="idcard_logo_uploader"
                          className="inline-block bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                        >
                          Pilih File Logo
                        </label>
                        <p className="text-[9px] text-slate-400 font-medium mt-1 leading-none">Format PNG/JPG, disarankan persegi.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Feature Gambar Bebas Placeholder (Gambar Bebas / Ornamen) */}
              <div className="space-y-3 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-200/60">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Desain Gambar Bebas / Ornamen</span>
                
                <p className="text-[9.5px] font-medium text-slate-500 leading-normal">
                  Unggah gambar kustom atau logo ornamen untuk ditampilkan di bagian tengah kartu ID Card. Jika kosong, akan menampilkan placeholder gambar yang cantik.
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-100">
                    {idCardCustomImage ? (
                      <div className="relative w-12 h-16 border border-slate-200 rounded-lg overflow-hidden shrink-0 bg-white shadow-xs">
                        <img src={idCardCustomImage} alt="Custom Artwork" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setIdCardCustomImage(null)}
                          className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-opacity cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <div className="w-12 h-16 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 shrink-0 bg-slate-50">
                        <ImageIcon className="w-5 h-5 opacity-60" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setIdCardCustomImage(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="idcard_image_uploader"
                      />
                      <label
                        htmlFor="idcard_image_uploader"
                        className="inline-block bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                      >
                        Pilih Gambar
                      </label>
                      <p className="text-[9px] text-slate-400 font-medium mt-1 leading-tight">Format PNG/JPG, disarankan vertikal atau persegi.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pilih Panitia</label>
                  <button 
                    onClick={() => {
                      if (selectedPanitiaIds.length === data.panitia.length) {
                        setSelectedPanitiaIds([]);
                      } else {
                        setSelectedPanitiaIds(data.panitia.map(p => p.id));
                      }
                    }}
                    className="text-[10px] text-red-600 hover:text-red-700 font-extrabold uppercase tracking-wider"
                  >
                    Select All
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-2xl p-2.5 space-y-1.5 bg-slate-50/50">
                  {data.panitia && data.panitia.length > 0 ? (
                    data.panitia.map((p) => {
                      const isSelected = selectedPanitiaIds.includes(p.id);
                      return (
                        <label 
                          key={p.id}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200/50 hover:border-slate-300 cursor-pointer text-xs"
                        >
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedPanitiaIds(prev => prev.filter(id => id !== p.id));
                              } else {
                                setSelectedPanitiaIds(prev => [...prev, p.id]);
                              }
                            }}
                            className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                          />
                          <div className="leading-none flex-1 truncate">
                            <span className="font-extrabold text-slate-800 block truncate">{p.name}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{p.role}</span>
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400 font-medium">
                      Belum ada data Panitia di Data Master. Silakan tambahkan dahulu.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <input 
                  type="checkbox" 
                  id="show_qrcode" 
                  checked={showQrCode}
                  onChange={(e) => setShowQrCode(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 h-4.5 w-4.5"
                />
                <label htmlFor="show_qrcode" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                  Cetak QR Code Otomatis
                </label>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleTriggerPrint("idcard")}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-red-900/10 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Lembar ID Card</span>
                </button>
              </div>
            </div>
          </div>

          {/* ID Cards Preview (8 Columns) */}
          <div className="lg:col-span-8 space-y-4">
            
            <div className="bg-slate-950 text-white p-4 rounded-3xl border border-slate-800 shadow-sm flex items-center justify-between gap-4 print:hidden">
              <div className="flex items-center gap-3">
                <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 text-red-500">
                  <IdCard className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-100">Pratinjau Lembar ID Card Panitia</h4>
                  <p className="text-[11px] text-slate-400 leading-none">Menampilkan mockup ID Card resmi panitia RW 04 Ngabean.</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
                READY TO PRINT
              </span>
            </div>

            {/* List to print */}
            <div 
              id="print-area"
              className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 ${printMode === "idcard" ? "print-idcard-grid" : ""}`}
            >
              {selectedPanitiaIds.length > 0 ? (
                data.panitia
                  .filter(p => selectedPanitiaIds.includes(p.id))
                  .map((p) => {
                    
                    // Design Themes
                    const cardThemes = {
                      "classic-red": {
                        railBg: "bg-gradient-to-b from-red-600 to-red-800",
                        railText: "text-white",
                        bodyBg: "bg-white",
                        bodyGradient: "from-red-50/45 to-white",
                        outlineTextStroke: "[-webkit-text-stroke:1px_rgba(220,38,38,0.06)]",
                        largeSolidText: "text-red-700/10",
                        titleBoxBg: "bg-red-950 border-red-800/40 text-white",
                        titleBoxText: "text-white",
                        nameText: "text-slate-800",
                        subTitleText: "text-amber-400",
                        logoRingColor: "border-red-500 bg-white",
                        badgeBg: "bg-red-600 text-white border-red-700",
                        lineColor: "bg-red-200/50",
                        footerBg: "bg-red-50/50 border-red-100",
                        footerText: "text-red-600",
                        accentBorder: "border-red-600/20",
                        bottomStripe: "bg-red-600"
                      },
                      "modern-dark": {
                        railBg: "bg-gradient-to-b from-slate-900 to-slate-950",
                        railText: "text-white/90",
                        bodyBg: "bg-slate-950",
                        bodyGradient: "from-slate-900 via-slate-950 to-slate-950",
                        outlineTextStroke: "[-webkit-text-stroke:1px_rgba(255,255,255,0.05)]",
                        largeSolidText: "text-slate-800/20",
                        titleBoxBg: "bg-slate-900/95 border-slate-800 text-white",
                        titleBoxText: "text-white",
                        nameText: "text-white",
                        subTitleText: "text-amber-400",
                        logoRingColor: "border-slate-700 bg-slate-900",
                        badgeBg: "bg-amber-400 text-slate-950 border-amber-500",
                        lineColor: "bg-slate-800/80",
                        footerBg: "bg-slate-900/60 border-slate-800",
                        footerText: "text-slate-300",
                        accentBorder: "border-slate-850",
                        bottomStripe: "bg-amber-400"
                      },
                      "patriotic-blue": {
                        railBg: "bg-gradient-to-b from-blue-800 to-blue-950",
                        railText: "text-white",
                        bodyBg: "bg-white",
                        bodyGradient: "from-blue-50/45 to-white",
                        outlineTextStroke: "[-webkit-text-stroke:1px_rgba(30,58,138,0.06)]",
                        largeSolidText: "text-blue-900/10",
                        titleBoxBg: "bg-blue-950 border-blue-900/40 text-white",
                        titleBoxText: "text-white",
                        nameText: "text-slate-800",
                        subTitleText: "text-amber-400",
                        logoRingColor: "border-blue-500 bg-white",
                        badgeBg: "bg-blue-800 text-white border-blue-900",
                        lineColor: "bg-blue-200/50",
                        footerBg: "bg-blue-50/50 border-blue-100",
                        footerText: "text-blue-700",
                        accentBorder: "border-blue-600/20",
                        bottomStripe: "bg-red-600"
                      }
                    };

                    const styleConfig = cardThemes[idCardTheme] || cardThemes["classic-red"];

                    return (
                      <div 
                        key={p.id}
                        className="bg-white w-[235px] h-[360px] mx-auto rounded-2xl border-2 border-slate-200 shadow-md flex overflow-hidden relative page-break-avoid animate-in fade-in zoom-in duration-300"
                      >
                        {/* Hanging strap slot punch mockup */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-slate-300 rounded-full z-10 print:hidden" />

                        {/* Left Side Rail (Strap Vertical Rail - Waving Flag Ribbon Ornament) */}
                        <div className="w-[42px] h-full flex flex-col justify-between py-6 items-center border-r border-slate-950/15 relative z-10 shrink-0 overflow-hidden bg-slate-50">
                          {/* Beautiful Vertical Red & White Flag Ribbon background */}
                          <div className="absolute inset-0 flex">
                            {/* Left half: Red ribbon segment with gradient wave highlights */}
                            <div className="w-1/2 h-full bg-gradient-to-b from-red-600 via-red-500 to-red-700 relative overflow-hidden">
                              {/* Diagonal fabric lines texture overlay */}
                              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.06)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.06)_50%,rgba(0,0,0,0.06)_75%,transparent_75%,transparent)] bg-[size:6px_6px] opacity-15" />
                              {/* Ribbon shading shadow */}
                              <div className="absolute inset-y-0 right-0 w-[4px] bg-gradient-to-l from-black/15 to-transparent" />
                            </div>
                            {/* Right half: White ribbon segment with soft shadows */}
                            <div className="w-1/2 h-full bg-gradient-to-b from-slate-100 via-white to-slate-200 relative overflow-hidden">
                              {/* Diagonal fabric lines texture overlay */}
                              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.03)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.03)_50%,rgba(0,0,0,0.03)_75%,transparent_75%,transparent)] bg-[size:6px_6px] opacity-15" />
                              {/* Ribbon shading shadow */}
                              <div className="absolute inset-y-0 left-0 w-[4px] bg-gradient-to-r from-black/5 to-transparent" />
                            </div>
                          </div>

                          {/* Wavy Shadow overlay to simulate real ribbon folds/depth */}
                          <div className="absolute inset-0 pointer-events-none z-1 opacity-25 bg-[linear-gradient(135deg,rgba(0,0,0,0.08)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.08)_50%,rgba(0,0,0,0.08)_75%,transparent_75%,transparent)] bg-[size:35px_35px]" />
                          
                          {/* Elegant gold stitch borders on both left & right edges of the ribbon */}
                          <div className="absolute left-0.5 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-amber-400 via-amber-300 to-amber-500 opacity-90 z-2 animate-pulse" />
                          <div className="absolute right-0.5 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-amber-400 via-amber-300 to-amber-500 opacity-90 z-2 animate-pulse" />

                          {/* Top Golden Pin Badge */}
                          <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border border-amber-200 flex items-center justify-center shadow-md shrink-0 relative z-10 transition-transform hover:scale-110">
                            <span className="text-[9px] text-amber-950 leading-none font-black drop-shadow-3xs">★</span>
                          </div>
                          
                          {/* Vertical Name Text inside a high-contrast premium glassmorphism capsule */}
                          <div className="flex-1 flex items-center justify-center min-h-0 py-2 relative z-10 w-full px-1">
                            <div className="bg-slate-950/85 backdrop-blur-md border border-white/20 px-1 py-4.5 rounded-full flex items-center justify-center shadow-lg w-full max-h-[175px]">
                              <div className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-black uppercase tracking-[0.25em] text-white leading-none whitespace-nowrap truncate max-h-[145px] drop-shadow-sm font-sans">
                                {p.name}
                              </div>
                            </div>
                          </div>

                          {/* Bottom Golden Pin Badge */}
                          <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border border-amber-200 flex items-center justify-center shadow-md shrink-0 relative z-10 transition-transform hover:scale-110">
                            <span className="text-[9px] text-amber-950 leading-none font-black drop-shadow-3xs">★</span>
                          </div>
                        </div>

                        {/* Right Main Body */}
                        <div className={`flex-1 h-full flex flex-col justify-between p-3.5 relative overflow-hidden bg-gradient-to-b ${styleConfig.bodyGradient} ${styleConfig.bodyBg}`}>
                          
                          {/* Modern Dot Matrix Grid background */}
                          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:12px_12px] opacity-25 pointer-events-none" />

                          {/* Contemporary Abstract Curves (Reference Image wave lines) */}
                          <div className="absolute top-6 -right-4 w-28 h-28 rounded-full border border-slate-400/10 pointer-events-none z-0" />
                          <div className="absolute top-2 -right-8 w-36 h-36 rounded-full border border-slate-400/10 pointer-events-none z-0" />
                          <div className="absolute top-[-10px] -right-12 w-44 h-44 rounded-full border border-slate-400/5 pointer-events-none z-0" />
                          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full border border-slate-400/10 pointer-events-none z-0" />

                          {/* Twibbon Corner Ribbon (Patriotic Red and White) */}
                          <div className="absolute -top-1 -right-1 w-10 h-10 overflow-hidden pointer-events-none z-10">
                            <div className="absolute top-2 right-[-15px] w-14 h-3.5 bg-gradient-to-r from-red-600 via-white to-red-600 rotate-[45deg] shadow-xs" />
                          </div>

                          {/* Hollow Repeating Background Text (PANITIA/CREW) */}
                          <div className="absolute inset-0 flex flex-col justify-center items-center gap-4 select-none pointer-events-none z-0 overflow-hidden pt-10">
                            <span className={`text-[36px] font-black tracking-widest uppercase text-transparent ${styleConfig.outlineTextStroke}`}>
                              {p.role}
                            </span>
                            <span className={`text-[36px] font-black tracking-widest uppercase text-transparent ${styleConfig.outlineTextStroke}`}>
                              {p.role}
                            </span>
                            <span className={`text-[36px] font-black tracking-widest uppercase text-transparent ${styleConfig.outlineTextStroke}`}>
                              {p.role}
                            </span>
                          </div>

                          {/* Top Event Header Capsule */}
                          <div className={`${styleConfig.titleBoxBg} text-center p-2 rounded-xl shadow-xs border border-white/10 flex items-center gap-2 relative z-10 w-full`}>
                            {/* Logo Placement Inside Header Capsule */}
                            {(idCardLogoPreset !== "none" || (idCardLogoType === "upload" && idCardCustomLogo)) && (
                              <div className={`w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-sm border ${styleConfig.logoRingColor}`}>
                                {idCardLogoType === "upload" && idCardCustomLogo ? (
                                  <img src={idCardCustomLogo} alt="Logo" className="w-full h-full object-contain" />
                                ) : idCardLogoPreset === "hutri" ? (
                                  <div className="text-white text-[9px] font-black leading-none bg-red-600 w-full h-full rounded flex items-center justify-center border border-white/20 shadow-inner">81</div>
                                ) : idCardLogoPreset === "garuda" ? (
                                  <span className="text-xs">🦅</span>
                                ) : idCardLogoPreset === "karangtaruna" ? (
                                  <span className="text-xs">🛡️</span>
                                ) : null}
                              </div>
                            )}
                            <div className="text-left flex-1 min-w-0">
                              <span className={`text-[6.5px] font-black tracking-[0.15em] block uppercase leading-none mb-0.5 ${styleConfig.subTitleText}`}>
                                HUT RI KE-81
                              </span>
                              <h4 className={`text-[9.5px] font-black uppercase tracking-wider leading-tight truncate ${styleConfig.titleBoxText}`}>
                                {idCardTitle}
                              </h4>
                            </div>
                          </div>

                           {/* Beautiful Contemporary Gambar Bebas / Ornament Frame */}
                           <div className="w-full py-1.5 relative z-10 my-auto flex flex-col items-center gap-2">
                             {/* The Decorative Frame */}
                             <div className="w-[84px] h-[112px] rounded-xl border border-slate-200/55 bg-white/75 backdrop-blur-xs flex flex-col items-center justify-center relative overflow-hidden shadow-xs shrink-0 transition-all hover:scale-105 duration-200">
                               {idCardCustomImage ? (
                                 <img src={idCardCustomImage} alt="Custom Ornament" className="w-full h-full object-cover" />
                               ) : (
                                 <div className="w-full h-full relative flex flex-col items-center justify-center p-3 text-center select-none bg-slate-50/50">
                                   {/* A clean dashed placeholder container */}
                                   <div className="absolute inset-1.5 rounded-lg border border-dashed border-slate-300/80 flex flex-col items-center justify-center p-1">
                                     <ImageIcon className="w-6 h-6 stroke-[1.2] text-slate-400/80 mb-1" />
                                     <span className="text-[6px] font-black text-slate-400 tracking-wider uppercase leading-none">GAMBAR BEBAS</span>
                                     <span className="text-[5px] font-mono text-slate-300 mt-1 leading-none">TEMPEL DISINI</span>
                                   </div>
                                 </div>
                               )}
                             </div>
 
                             {/* Clean Minimal Typography for Person Name */}
                             <div className="text-center w-full px-1">
                               <h3 className={`text-[12px] font-black leading-tight tracking-wider uppercase font-sans ${styleConfig.nameText} truncate max-w-full drop-shadow-3xs`}>
                                 {p.name}
                               </h3>
                             </div>
                           </div>

                          {/* Solid Role Title & Bottom Bar info */}
                          <div className="w-full relative z-10 flex flex-col items-center">
                            
                            {/* Giant Solid Role Text at Bottom */}
                            <div className={`text-[21px] font-black uppercase tracking-widest ${styleConfig.largeSolidText} select-none leading-none mb-2 text-center`}>
                              {p.role}
                            </div>

                            {/* Sleek footer capsule with Instagram logo / QR Code */}
                            <div className={`w-full py-1.5 px-2.5 rounded-xl flex items-center justify-between gap-2 border ${styleConfig.footerBg}`}>
                              <div className="flex items-center gap-1.5">
                                <svg className={`w-2.5 h-2.5 ${styleConfig.footerText} shrink-0`} fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                </svg>
                                <span className={`text-[7px] font-mono font-black uppercase tracking-wider ${styleConfig.footerText}`}>
                                  @rw04_ngabean
                                </span>
                              </div>

                              {showQrCode ? (
                                <div className="bg-white p-0.5 border border-slate-200 rounded shadow-3xs flex items-center justify-center shrink-0">
                                  <QrCode className="w-4 h-4 text-slate-800" />
                                </div>
                              ) : (
                                <span className={`text-[6.5px] font-mono font-black ${styleConfig.footerText}`}>
                                  #NGBN2026
                                </span>
                              )}
                            </div>

                          </div>

                        </div>

                      </div>
                    );
                  })
              ) : (
                <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 font-medium">
                  Belum ada panitia dipilih dari panel pengaturan di sebelah kiri.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ======================= TAB 3: UNDIAN DOORPRIZE DIGITAL ======================= */}
      {activeSubTab === "doorprize" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Controls Column (5 Columns) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-3xs space-y-5 print:hidden">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-red-600" />
              <span>Konfigurasi Mesin Undian</span>
            </h3>

            <div className="space-y-4">
              
              {/* Pool type selector */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Sumber Data Undian (Contestant Pool)</label>
                <div className="space-y-1.5">
                  {[
                    { id: "coupon-range", label: "Nomor Kupon Jalan Sehat", icon: Ticket },
                    { id: "panitia", label: "Daftar Panitia Active", icon: Users },
                    { id: "custom-list", label: "Ketik Nama Custom (Warga/RT)", icon: Sparkles }
                  ].map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setDoorprizePoolType(p.id as any)}
                        className={`w-full p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2.5 cursor-pointer transition-all ${
                          doorprizePoolType === p.id
                            ? "border-red-600 bg-red-50 text-red-900 ring-1 ring-red-500"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pool Range Inputs */}
              {doorprizePoolType === "coupon-range" && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Batasan Kupon Jalan Sehat</span>
                    
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoSyncRange}
                        onChange={(e) => setAutoSyncRange(e.target.checked)}
                        className="w-3 h-3 text-red-600 border-slate-300 rounded focus:ring-red-500 cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">🔄 SINKRON</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Mulai No</label>
                      <input 
                        type="number" 
                        value={drawRangeStart}
                        onChange={(e) => {
                          if (!autoSyncRange) {
                            setDrawRangeStart(Math.max(1, parseInt(e.target.value) || 1));
                          }
                        }}
                        disabled={autoSyncRange}
                        className={`w-full text-xs font-bold px-3 py-2 border rounded-xl focus:outline-none transition-all ${
                          autoSyncRange 
                            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
                            : "bg-white text-slate-800 border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Sampai No</label>
                      <input 
                        type="number" 
                        value={drawRangeEnd}
                        onChange={(e) => {
                          if (!autoSyncRange) {
                            setDrawRangeEnd(Math.max(1, parseInt(e.target.value) || 1));
                          }
                        }}
                        disabled={autoSyncRange}
                        className={`w-full text-xs font-bold px-3 py-2 border rounded-xl focus:outline-none transition-all ${
                          autoSyncRange 
                            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
                            : "bg-white text-slate-800 border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        }`}
                      />
                    </div>
                  </div>

                  <span className="text-[9.5px] text-slate-500 block leading-normal pt-0.5">
                    {autoSyncRange ? (
                      <span className="text-emerald-700 font-bold">
                        ✓ Sinkronisasi aktif dengan kupon cetak ({startNum} s.d {startNum + couponCount - 1}).
                      </span>
                    ) : (
                      "Rentang kupon diatur manual. Ubah nomor di atas untuk menyesuaikan."
                    )}
                  </span>
                </div>
              )}

              {/* Custom Names Text Area */}
              {doorprizePoolType === "custom-list" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Daftar Nama Peserta (1 baris = 1 nama)</label>
                  <textarea
                    rows={4}
                    value={customNamesRaw}
                    onChange={(e) => setCustomNamesRaw(e.target.value)}
                    className="w-full text-xs font-mono text-slate-800 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500"
                    placeholder="Masukkan nama terpisah baris..."
                  />
                </div>
              )}

              {/* Format Pemanggilan Option */}
              <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/50 space-y-2">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest block">Format Undian</span>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={drawOnlyNumber}
                    onChange={(e) => {
                      setDrawOnlyNumber(e.target.checked);
                      if (!isDrawing) {
                        setCurrentShuffleName(e.target.checked ? "000" : "SIAP DIUNDI");
                        setWinnerResult(null);
                      }
                    }}
                    className="rounded text-red-600 focus:ring-red-500 h-4 w-4 mt-0.5 border-amber-300"
                  />
                  <div className="leading-tight">
                    <span className="text-xs font-black text-slate-800 block">Panggil Nomor Peserta Saja</span>
                    <span className="text-[10px] text-slate-500 leading-normal block">Mengabaikan teks panjang, fokus mengacak & memanggil format nomor/angka saja.</span>
                  </div>
                </label>
              </div>

              {/* Doorprize Selector and Custom Input */}
              <div className="space-y-3 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-200/60">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Hadiah yang Diundi</span>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Pilih dari Daftar Hadiah</label>
                    <select
                      value={selectedPrize}
                      onChange={(e) => setSelectedPrize(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 px-3 py-2 border border-slate-200 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none bg-white cursor-pointer"
                    >
                      {prizesList.map((prizeItem) => (
                        <option key={prizeItem} value={prizeItem}>
                          {prizeItem}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Tambah Hadiah Kustom</label>
                    <div className="flex gap-1.5">
                      <input 
                        type="text" 
                        value={customPrizeInput}
                        onChange={(e) => setCustomPrizeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddPrize();
                          }
                        }}
                        className="flex-1 text-xs font-bold text-slate-800 px-3 py-2 border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none bg-white"
                        placeholder="Contoh: Blender Miyako"
                      />
                      <button
                        type="button"
                        onClick={handleAddPrize}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>

                  {/* Badges list with scroll */}
                  {prizesList.length > 0 && (
                    <div className="pt-2">
                      <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Daftar Semua Hadiah ({prizesList.length})</label>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-white border border-slate-100 rounded-xl">
                        {prizesList.map((prizeItem) => (
                          <div 
                            key={prizeItem}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9.5px] font-bold transition-all border ${
                              selectedPrize === prizeItem 
                                ? "bg-red-50 text-red-700 border-red-200/60" 
                                : "bg-slate-50 text-slate-600 border-slate-150 hover:bg-slate-100"
                            }`}
                          >
                            <span 
                              className="cursor-pointer flex-1 truncate max-w-[120px]"
                              onClick={() => setSelectedPrize(prizeItem)}
                              title="Klik untuk memilih hadiah ini"
                            >
                              🎁 {prizeItem}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeletePrize(prizeItem)}
                              className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer pl-0.5 font-bold"
                              title="Hapus hadiah"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Doorprize Theme Selection */}
              <div className="space-y-2 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-200/60">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pilih Tema Mesin Undian</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "patriot-red", label: "Merah Putih", desc: "Patriotik Semarak", color: "from-red-600 to-red-800" },
                    { id: "luxury-gold", label: "Emas Premium", desc: "Mewah & Elegan", color: "from-amber-400 to-amber-600" },
                    { id: "cyber-neon", label: "Cyber Neon", desc: "Teknologi Modern", color: "from-cyan-400 to-cyan-600" },
                    { id: "retro-arcade", label: "Retro Arcade", desc: "Gaya Game Klasik", color: "from-fuchsia-500 to-pink-600" }
                  ].map((themeOpt) => (
                    <button
                      key={themeOpt.id}
                      onClick={() => setDoorprizeTheme(themeOpt.id as any)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        doorprizeTheme === themeOpt.id
                          ? "border-slate-800 bg-white shadow-xs ring-2 ring-slate-800/80"
                          : "border-slate-200/80 bg-white hover:bg-slate-50/80"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${themeOpt.color} shrink-0`} />
                        <span className="text-xs font-black text-slate-800 leading-none">{themeOpt.label}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold leading-none block">{themeOpt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Doorprize Sound Effect Style Selection */}
              <div className="space-y-2 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-200/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Gaya Efek Suara</span>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`text-[8.5px] font-black px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                      soundEnabled 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                        : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    {soundEnabled ? "🔊 Suara Nyala" : "🔇 Senyap"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "suspense", label: "Drama Suspense", desc: "Menegangkan & Epik", icon: "🎬" },
                    { id: "arcade", label: "Retro Arcade", desc: "Ceria & Klasik", icon: "👾" }
                  ].map((styleOpt) => (
                    <button
                      key={styleOpt.id}
                      type="button"
                      onClick={() => {
                        setSoundStyle(styleOpt.id as any);
                        if (!soundEnabled) setSoundEnabled(true);
                      }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        soundStyle === styleOpt.id
                          ? "border-red-600 bg-white shadow-xs ring-2 ring-red-500/20"
                          : "border-slate-200/80 bg-white hover:bg-slate-50/80"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs shrink-0">{styleOpt.icon}</span>
                        <span className="text-xs font-black text-slate-800 leading-none">{styleOpt.label}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold leading-none block">{styleOpt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Doorprize Duration Selection */}
              <div className="space-y-2 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-200/60 animate-in fade-in duration-200">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">⏳ Durasi Pengundian ({drawDuration} Detik)</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {[3, 5, 8, 12, 16].map((seconds) => (
                    <button
                      key={seconds}
                      type="button"
                      onClick={() => setDrawDuration(seconds)}
                      className={`py-2 rounded-xl border text-center cursor-pointer transition-all ${
                        drawDuration === seconds
                          ? "border-red-600 bg-red-50 text-red-700 font-black ring-2 ring-red-500/10 scale-[1.03]"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 font-bold"
                      }`}
                    >
                      <span className="text-xs">{seconds}s</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[8px] text-slate-400/80 font-bold pt-1 uppercase tracking-wider">
                  <span>Kilat (3s)</span>
                  <span>Tensi Maksimal (16s)</span>
                </div>
              </div>

            </div>
          </div>

          {/* Interactive Screen Column (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Projector Trigger Bar */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white p-4.5 rounded-3xl border border-slate-800 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 ring-4 ring-red-500/5 animate-pulse">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <span>TAMPILAN LAYAR PENUH / PROYEKTOR</span>
                    <span className="px-1.5 py-0.5 bg-red-600 text-[8px] rounded font-black text-white leading-none">REKOMENDASI</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Sembunyikan semua menu dan konfigurasi untuk ditampilkan di panggung / layar LCD proyektor.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProjectorMode(true)}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-black text-[10.5px] uppercase tracking-widest py-2.5 px-5 rounded-xl shadow-lg shadow-red-950/40 transition-all hover:scale-103 active:scale-97 cursor-pointer flex items-center justify-center gap-2 shrink-0 border border-red-500/30"
              >
                <Maximize className="w-4 h-4" />
                <span>Mulai Mode Proyektor</span>
              </button>
            </div>
            
            {/* Raffle Board Display */}
            {(() => {
              const dThemes = {
                "patriot-red": {
                  bg: "from-slate-950 via-slate-900 to-red-950",
                  border: "border-slate-800/80",
                  glow: "bg-red-600/10",
                  glare: "from-red-600 via-white to-red-600",
                  indicator: "bg-red-600",
                  badge: "bg-red-500/10 border-red-500/20 text-red-400",
                  accentText: "text-red-400",
                  barColor: "bg-red-500",
                  shufflerBorder: "border-slate-800",
                  buttonColor: "bg-red-600 hover:bg-red-500 shadow-red-950/50",
                },
                "luxury-gold": {
                  bg: "from-slate-950 via-slate-900 to-amber-950",
                  border: "border-amber-900/30",
                  glow: "bg-amber-500/10",
                  glare: "from-amber-500 via-yellow-100 to-amber-500",
                  indicator: "bg-amber-500",
                  badge: "bg-amber-500/10 border-amber-500/20 text-amber-400",
                  accentText: "text-amber-400",
                  barColor: "bg-amber-500",
                  shufflerBorder: "border-amber-900/50",
                  buttonColor: "bg-amber-600 hover:bg-amber-500 shadow-amber-950/50",
                },
                "cyber-neon": {
                  bg: "from-slate-950 via-slate-900 to-cyan-950",
                  border: "border-cyan-900/30",
                  glow: "bg-cyan-500/10",
                  glare: "from-cyan-500 via-purple-300 to-cyan-500",
                  indicator: "bg-cyan-400",
                  badge: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
                  accentText: "text-cyan-400",
                  barColor: "bg-cyan-400",
                  shufflerBorder: "border-cyan-800/60",
                  buttonColor: "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950/50",
                },
                "retro-arcade": {
                  bg: "from-slate-950 via-slate-900 to-fuchsia-950",
                  border: "border-fuchsia-900/30",
                  glow: "bg-fuchsia-500/10",
                  glare: "from-fuchsia-500 via-pink-200 to-fuchsia-500",
                  indicator: "bg-fuchsia-500",
                  badge: "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400",
                  accentText: "text-fuchsia-400",
                  barColor: "bg-fuchsia-500",
                  shufflerBorder: "border-fuchsia-800/60",
                  buttonColor: "bg-fuchsia-600 hover:bg-fuchsia-500 shadow-fuchsia-950/50",
                }
              };
              const activeDTheme = dThemes[doorprizeTheme] || dThemes["patriot-red"];

              return (
                <div className={`bg-gradient-to-br ${activeDTheme.bg} rounded-3xl p-6 md:p-8 text-center text-white border ${activeDTheme.border} shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[350px]`}>
                  
                  {/* Top ambient glare & flags */}
                  <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${activeDTheme.glare}`} />
                  <div className="absolute top-3 left-4 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 ${activeDTheme.indicator} rounded-full animate-pulse`} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                      DOORPRIZE DIGITAL SELEKTOR
                    </span>
                  </div>

                  {/* Center Screen */}
                  <div className="my-auto py-8 space-y-6 relative">
                    {/* Highlight Circle Background */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 ${activeDTheme.glow} rounded-full blur-[40px] pointer-events-none`} />

                    {/* Subtitle with active prize */}
                    <div className="space-y-1 relative z-10">
                      <span className={`inline-block px-3 py-1 ${activeDTheme.badge} text-[10px] font-black uppercase tracking-[0.2em] rounded-full`}>
                        MEMPEREBUTKAN: {selectedPrize}
                      </span>
                      <h3 className={`text-lg sm:text-2xl font-black ${activeDTheme.accentText} uppercase tracking-tight`}>
                        🎰 SIAP DIACAK SEKARANG!
                      </h3>
                    </div>

                    {/* Main Shuffler Container with glowing border */}
                    <div className={`bg-slate-950/80 border-2 ${activeDTheme.shufflerBorder} p-6 rounded-2xl max-w-md mx-auto shadow-inner relative overflow-hidden`}>
                      <div className={`absolute top-0 bottom-0 left-0 w-1 ${activeDTheme.barColor}`} />
                      <div className={`absolute top-0 bottom-0 right-0 w-1 ${activeDTheme.barColor}`} />
                      
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2 font-mono">
                        {isDrawing ? "MENGACAK PESERTA..." : "PILIH PEMENANG"}
                      </span>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentShuffleName}
                          initial={{ y: isDrawing ? 15 : 0, opacity: isDrawing ? 0.4 : 1 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: isDrawing ? -15 : 0, opacity: 0.4 }}
                          transition={{ duration: 0.05 }}
                          className={`font-black uppercase px-2 py-2 leading-none transition-all ${
                            drawOnlyNumber 
                              ? "text-4xl sm:text-7xl font-mono tracking-widest text-amber-400" 
                              : "text-xl sm:text-3xl tracking-tight text-white"
                          } ${
                            winnerResult 
                              ? "text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-300 to-yellow-400 animate-pulse" 
                              : ""
                          }`}
                        >
                          {currentShuffleName}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Bottom buttons & status */}
                  <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                    <div className="space-y-1">
                      <div className="text-[9.5px] text-slate-400 font-mono leading-none">
                        POOL: <span className="font-bold text-white uppercase">
                          {doorprizePoolType === "coupon-range" 
                            ? `KUPON JALAN SEHAT (${drawRangeStart} - ${drawRangeEnd})` 
                            : doorprizePoolType === "panitia" 
                            ? "DAFTAR PANITIA AKTIF" 
                            : "DAFTAR NAMA KUSTOM"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[8.5px] text-emerald-400 font-mono font-bold leading-none uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                        <span>🛡️ ACAK KRIPTOGRAFIS AKTIF (BEBAS BIAS)</span>
                      </div>
                    </div>

                    <button
                      onClick={handleDrawDoorprize}
                      disabled={isDrawing}
                      className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg cursor-pointer select-none transition-all ${
                        isDrawing
                          ? "bg-slate-800 text-slate-400 border border-slate-700 shadow-none cursor-not-allowed"
                          : `${activeDTheme.buttonColor} text-white hover:scale-103 active:scale-98`
                      }`}
                    >
                      {isDrawing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                          <span>SEDANG DIUNDI</span>
                        </>
                      ) : (
                        <>
                          <Shuffle className="w-4 h-4" />
                          <span>MULAI UNDIAN</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              );
            })()}

            {/* Winner History logs */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-3xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Daftar Riwayat Pemenang ({winners.length})</span>
                </h3>
                {winners.length > 0 && (
                  <button
                    onClick={handleClearWinners}
                    className="text-[10px] text-slate-400 hover:text-red-600 font-extrabold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Semua</span>
                  </button>
                )}
              </div>

              {winners.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-600 font-medium">
                    <thead>
                      <tr className="border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5">Waktu</th>
                        <th className="py-2.5">Nama / Nomor Pemenang</th>
                        <th className="py-2.5">Hadiah</th>
                        <th className="py-2.5">Sumber Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {winners.map((win, idx) => (
                        <tr 
                          key={win.id} 
                          className={`border-b border-slate-100/50 ${idx === 0 ? "bg-amber-50/40" : ""}`}
                        >
                          <td className="py-2.5 font-mono text-slate-400">{win.timestamp}</td>
                          <td className="py-2.5">
                            <span className="font-extrabold text-slate-800 uppercase block">{win.name}</span>
                          </td>
                          <td className="py-2.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-100 text-[10.5px] font-bold text-amber-800 uppercase">
                              🎁 {win.prize}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-400 font-mono text-[10px]">{win.poolType}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400 font-medium">
                  Belum ada riwayat undian dilakukan. Tekan tombol "Mulai Undian" di atas untuk mencari pemenang pertama!
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* IMMERSIVE PROJECTOR / FULLSCREEN MODE OVERLAY */}
      {projectorMode && (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col justify-between p-6 sm:p-10 text-white overflow-y-auto overflow-x-hidden font-sans select-none animate-in fade-in zoom-in-95 duration-300">
          {/* Background ambient glow according to theme */}
          {(() => {
            const dThemes = {
              "patriot-red": {
                bg: "from-slate-950 via-slate-900 to-red-950",
                glow: "bg-red-600/15",
                glare: "from-red-600 via-white to-red-600",
                shufflerBorder: "border-red-900/40",
                barColor: "bg-red-500",
                buttonColor: "bg-red-600 hover:bg-red-500 shadow-red-950/50",
              },
              "luxury-gold": {
                bg: "from-slate-950 via-slate-900 to-amber-950",
                glow: "bg-amber-500/15",
                glare: "from-amber-500 via-yellow-100 to-amber-500",
                shufflerBorder: "border-amber-900/50",
                barColor: "bg-amber-500",
                buttonColor: "bg-amber-600 hover:bg-amber-500 shadow-amber-950/50",
              },
              "cyber-neon": {
                bg: "from-slate-950 via-slate-900 to-cyan-950",
                glow: "bg-cyan-500/15",
                glare: "from-cyan-500 via-purple-300 to-cyan-500",
                shufflerBorder: "border-cyan-800/60",
                barColor: "bg-cyan-400",
                buttonColor: "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950/50",
              },
              "retro-arcade": {
                bg: "from-slate-950 via-slate-900 to-fuchsia-950",
                glow: "bg-fuchsia-500/15",
                glare: "from-fuchsia-500 via-pink-200 to-fuchsia-500",
                shufflerBorder: "border-fuchsia-800/60",
                barColor: "bg-fuchsia-500",
                buttonColor: "bg-fuchsia-600 hover:bg-fuchsia-500 shadow-fuchsia-950/50",
              }
            };
            const activeDTheme = dThemes[doorprizeTheme] || dThemes["patriot-red"];

            return (
              <>
                <div className={`absolute inset-0 bg-gradient-to-b ${activeDTheme.bg} pointer-events-none`} />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] ${activeDTheme.glow} rounded-full blur-[120px] pointer-events-none opacity-80`} />

                {/* TOP HEADER CONTROLS BAR */}
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-600 animate-ping shrink-0" />
                    <div>
                      <h2 className="text-xs sm:text-sm font-black tracking-[0.2em] uppercase text-white/95">
                        UNDIAN DIGITAL MAKSIMAL
                      </h2>
                      <p className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                        RT/RW 04 Ngabean Semarang • HUT RI Ke-81
                      </p>
                    </div>
                  </div>

                  {/* Center: Interactive controls */}
                  <div className="flex flex-wrap items-center gap-2 md:absolute md:left-1/2 md:-translate-x-1/2 z-20">
                    {/* Sound Switch */}
                    <button
                      type="button"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                        soundEnabled 
                          ? "bg-slate-900/90 text-white border-slate-800 hover:bg-slate-800" 
                          : "bg-white/10 text-slate-300 border-white/5 hover:bg-white/15"
                      }`}
                    >
                      {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{soundEnabled ? "Suara Aktif" : "Senyap"}</span>
                    </button>

                    {/* Sound Style if sound is active */}
                    {soundEnabled && (
                      <button
                        type="button"
                        onClick={() => setSoundStyle(soundStyle === "suspense" ? "arcade" : "suspense")}
                        className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>🎭 {soundStyle === "suspense" ? "Drama Suspense" : "Retro Arcade"}</span>
                      </button>
                    )}

                    {/* Themes */}
                    <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                      {[
                        { id: "patriot-red", color: "bg-red-600", label: "Merah Putih" },
                        { id: "luxury-gold", color: "bg-amber-500", label: "Emas" },
                        { id: "cyber-neon", color: "bg-cyan-400", label: "Cyber" },
                        { id: "retro-arcade", color: "bg-fuchsia-500", label: "Arcade" }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setDoorprizeTheme(t.id as any)}
                          className={`w-5 h-5 rounded-lg ${t.color} border border-white/10 transition-all cursor-pointer flex items-center justify-center`}
                          title={`Ubah Tema: ${t.label}`}
                        >
                          {doorprizeTheme === t.id && (
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Exit button */}
                  <button
                    type="button"
                    onClick={() => setProjectorMode(false)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 border border-red-500/30 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all hover:scale-103 active:scale-97 cursor-pointer flex items-center gap-2 self-end md:self-auto"
                  >
                    <Minimize className="w-4 h-4" />
                    <span>KELUAR (ESC)</span>
                  </button>
                </div>

                {/* CENTRAL CONTENT AREA */}
                <div className="relative z-10 flex-1 flex flex-col justify-center items-center my-6 max-w-4xl w-full mx-auto">
                  
                  {/* PRIZE TOGGLER CONTAINER */}
                  <div className="text-center mb-6 max-w-xl">
                    <span className="text-[10px] font-black tracking-[0.25em] text-slate-400 uppercase block mb-1">
                      HADIAH YANG SEDANG DIUNDI
                    </span>
                    <div className="inline-flex items-center gap-4 bg-slate-900/90 border border-slate-800/80 px-5 py-2.5 rounded-full shadow-2xl">
                      <button
                        type="button"
                        onClick={handlePrevPrize}
                        disabled={isDrawing}
                        className={`text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-black p-1.5 hover:bg-white/5 rounded-full ${isDrawing ? "opacity-35 cursor-not-allowed" : ""}`}
                      >
                        ◀
                      </button>
                      
                      <span className="text-base sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-400 uppercase tracking-tight flex items-center gap-2">
                        🎁 {selectedPrize}
                      </span>

                      <button
                        type="button"
                        onClick={handleNextPrize}
                        disabled={isDrawing}
                        className={`text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-black p-1.5 hover:bg-white/5 rounded-full ${isDrawing ? "opacity-35 cursor-not-allowed" : ""}`}
                      >
                        ▶
                      </button>
                    </div>
                  </div>

                  {/* MASSIVE DISPLAY CONTAINER */}
                  <div className={`w-full bg-slate-950/90 border-4 ${activeDTheme.shufflerBorder} p-8 md:p-14 rounded-[36px] shadow-3xl text-center relative overflow-hidden flex flex-col justify-center items-center min-h-[280px] md:min-h-[360px]`}>
                    
                    {/* Glowing Accent Lines */}
                    <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${activeDTheme.glare}`} />
                    <div className={`absolute bottom-0 inset-x-0 h-1.5 bg-gradient-to-r ${activeDTheme.glare}`} />
                    <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${activeDTheme.barColor}`} />
                    <div className={`absolute top-0 bottom-0 right-0 w-1.5 ${activeDTheme.barColor}`} />

                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-4 font-mono animate-pulse">
                      {isDrawing ? "🔄 SEDANG MENGACAK..." : "🎯 SIAP DIUNDI! TEKAN TOMBOL ATAU SPASI"}
                    </span>

                    {/* MASSIVE SHUFFLE NAME */}
                    <div className="my-auto py-2">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentShuffleName}
                          initial={{ y: isDrawing ? 25 : 0, opacity: isDrawing ? 0.35 : 1, scale: isDrawing ? 0.95 : 1 }}
                          animate={{ y: 0, opacity: 1, scale: 1 }}
                          exit={{ y: isDrawing ? -25 : 0, opacity: 0.35, scale: 0.95 }}
                          transition={{ duration: 0.05 }}
                          className={`font-black uppercase tracking-tight select-none transition-all leading-none ${
                            drawOnlyNumber 
                              ? "text-7xl sm:text-8xl md:text-9xl font-mono text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]" 
                              : "text-3xl sm:text-5xl md:text-6xl text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.15)]"
                          } ${
                            winnerResult 
                              ? "text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-300 to-yellow-400 scale-[1.05] drop-shadow-[0_0_35px_rgba(16,185,129,0.5)] animate-bounce" 
                              : ""
                          }`}
                        >
                          {currentShuffleName}
                        </motion.div>
                      </AnimatePresence>

                      {/* Celebration Banner */}
                      {winnerResult && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-6 inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-black text-xs sm:text-sm uppercase tracking-widest px-6 py-2.5 rounded-full shadow-lg"
                        >
                          <Award className="w-5 h-5 text-emerald-400 animate-spin" />
                          <span>PEMENANG {selectedPrize}! Selamat! 🎉</span>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* LARGE CONTROLLER TRIGGER */}
                  <div className="mt-8 text-center w-full max-w-sm">
                    <button
                      type="button"
                      onClick={handleDrawDoorprize}
                      disabled={isDrawing}
                      className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3.5 shadow-2xl transition-all cursor-pointer ${
                        isDrawing
                          ? "bg-slate-900 text-slate-550 border border-slate-800 cursor-not-allowed shadow-none"
                          : `${activeDTheme.buttonColor} text-white hover:scale-103 active:scale-97 ring-4 ring-white/10`
                      }`}
                    >
                      {isDrawing ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin text-slate-500" />
                          <span>MENGACAK UNDIAN</span>
                        </>
                      ) : (
                        <>
                          <Shuffle className="w-5 h-5 text-white animate-bounce" />
                          <span>ACAK SEKARANG (SPASI)</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>

                {/* BOTTOM COMPACT WINNERS LOG */}
                <div className="relative z-10 w-full shrink-0 pt-4 border-t border-white/10">
                  <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-[11px] font-mono text-slate-400">
                      <span className="font-black text-slate-500">POOL:</span>{" "}
                      <span className="font-bold text-white uppercase bg-slate-900/80 px-2 py-1 border border-slate-800 rounded">
                        {doorprizePoolType === "coupon-range" 
                          ? `KUPON JALAN SEHAT (${drawRangeStart} - ${drawRangeEnd})` 
                          : doorprizePoolType === "panitia" 
                          ? "DAFTAR PANITIA AKTIF" 
                          : "DAFTAR CUSTOM"}
                      </span>
                    </div>

                    {/* Live winners scrolling */}
                    <div className="flex-1 flex items-center gap-3 md:justify-end overflow-hidden">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest shrink-0 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>PEMENANG TERBARU:</span>
                      </span>
                      
                      {winners.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar max-w-lg">
                          {winners.slice(0, 5).map((win) => (
                            <div 
                              key={win.id}
                              className="bg-slate-900/90 border border-slate-800/80 px-3 py-1 rounded-xl flex items-center gap-2 shrink-0 animate-in slide-in-from-right-10 duration-200"
                            >
                              <span className="text-[9px] text-slate-400 font-mono">{win.timestamp}</span>
                              <span className="text-[10px] font-black text-white uppercase">{win.name}</span>
                              <span className="text-[9px] font-bold text-amber-400 border border-amber-500/10 bg-amber-500/5 px-1.5 py-0.5 rounded uppercase max-w-[100px] truncate">
                                🎁 {win.prize}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 font-mono">Belum ada pemenang terdaftar.</span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Styled Printable rules for CSS injection */}
      <style>{`
        @page {
          size: 215mm 330mm;
          margin: 12mm 10mm;
        }
        @media print {
          /* Force colors and backgrounds to print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            background-color: #fff !important;
            color: #000 !important;
            font-size: 11pt;
          }
          header, sidebar, aside, nav, button, .print\\:hidden, div[class*="print:hidden"] {
            display: none !important;
          }
          html, body, #root, .flex-1, main, .main-content-area {
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            position: static !important;
            max-height: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Ensure that parent container of print-area does not squeeze or style as grid columns on print */
          .lg\\:col-span-8, .grid, .lg\\:grid-cols-12 {
            display: block !important;
            width: 100% !important;
            max-width: none !important;
          }
          #print-area {
            position: static !important;
            display: grid !important;
            width: 100% !important;
            background: transparent !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-coupon-grid {
            grid-template-cols: 1fr 1fr !important;
            gap: 8mm !important;
            width: 100% !important;
          }
          .print-idcard-grid {
            grid-template-cols: 1fr 1fr 1fr !important;
            gap: 6mm !important;
            width: 100% !important;
          }
          .page-break-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

    </div>
  );
}
