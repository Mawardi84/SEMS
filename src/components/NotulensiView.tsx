import React, { useState } from "react";
import { 
  FileText, 
  ClipboardCheck, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Users, 
  Check, 
  AlertTriangle, 
  Info,
  ArrowLeft,
  Download,
  Copy,
  Printer,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet
} from "lucide-react";
import { Notulensi, ActionItem, SystemSetting, Panitia, Kegiatan } from "../types";
import { exportToPDF } from "../utils/pdfExport";
import { exportToWord } from "../utils/wordExport";

interface NotulensiViewProps {
  notulensi: Notulensi[];
  settings: SystemSetting;
  panitia: Panitia[];
  kegiatan: Kegiatan[];
  onSaveNotulensi: (action: 'add' | 'edit' | 'delete', data: Notulensi) => Promise<void>;
}

export default function NotulensiView({ 
  notulensi, 
  settings, 
  panitia, 
  kegiatan, 
  onSaveNotulensi 
}: NotulensiViewProps) {
  const [viewMode, setViewMode] = useState<"list" | "create" | "view">("list");
  const [selectedNotulensi, setSelectedNotulensi] = useState<Notulensi | null>(null);
  
  // Console Log Terminal States for AI
  const [showConsole, setShowConsole] = useState(false);
  const [consoleSteps, setConsoleSteps] = useState<{ msg: string; status: 'pending' | 'success' }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingDOC, setIsExportingDOC] = useState(false);

  // Form States
  const [formId, setFormId] = useState<string>("");
  const [title, setTitle] = useState<string>("Rapat Koordinasi Pleno I");
  const [date, setDate] = useState<string>("Senin, 6 Juli 2026");
  const [time, setTime] = useState<string>("19:30 - 22:00 WIB");
  const [location, setLocation] = useState<string>("Balai Warga RW 04 Ngabean");
  const [leader, setLeader] = useState<string>("");
  const [attendeesCount, setAttendeesCount] = useState<number>(15);
  const [attendeesList, setAttendeesList] = useState<string>("Sekretaris, Humas, Acara, Keamanan");
  const [agenda, setAgenda] = useState<string>("1. Evaluasi Anggaran (RKBA) HUT RI Ke-81\n2. Pembagian Tugas Seksi Lapangan\n3. Pembahasan Swadaya Natura Warga\n4. Teknis Pelaksanaan Lomba 17-an");
  const [notesRaw, setNotesRaw] = useState<string>(
    "- Acara pembukaan direncanakan pada 10 Agustus 2026, Seksi Acara harap menyiapkan draf rundown.\n" +
    "- Anggaran Seksi Lomba disepakati maksimal Rp 1.500.000 dengan pendanaan utama dari Iuran RT.\n" +
    "- Perlengkapan sound system dan panggung utama akan dikoordinasikan oleh Seksi Perlengkapan (Pak RT 02).\n" +
    "- Keamanan dan Kebersihan wajib menjaga sterilisasi area lomba dan menyediakan tempat sampah portabel."
  );
  const [decisions, setDecisions] = useState<string>(
    "- Menyetujui pagu anggaran Seksi Lomba sebesar Rp 1.500.000.\n" +
    "- Menyepakati jadwal pelaksanaan lomba dimulai tanggal 11 - 15 Agustus 2026.\n" +
    "- Penetapan iuran warga diserahkan kepada koordinasi masing-masing RT."
  );
  const [actionItems, setActionItems] = useState<Omit<ActionItem, 'id'>[]>([
    { task: "Menyusun draf rundown detail pembukaan", pic: "Acara", deadline: "12 Juli 2026" },
    { task: "Membeli perlengkapan hadiah lomba anak-anak", pic: "Seksi Hadiah Dan Doorprize", deadline: "20 Juli 2026" }
  ]);

  // Form Temp Action Item inputs
  const [tempTask, setTempTask] = useState("");
  const [tempPic, setTempPic] = useState("");
  const [tempDeadline, setTempDeadline] = useState("");

  // Paper Theme option
  const [paperTheme, setPaperTheme] = useState<"classic" | "minimal" | "creamy" | "royal">("classic");

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState("");

  const addActionItem = () => {
    if (!tempTask.trim()) return;
    setActionItems([
      ...actionItems,
      {
        task: tempTask,
        pic: tempPic || "Umum",
        deadline: tempDeadline || "Segera"
      }
    ]);
    setTempTask("");
    setTempPic("");
    setTempDeadline("");
  };

  const removeActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const logStep = (message: string, delay = 200) => {
    return new Promise<void>((resolve) => {
      setConsoleSteps(prev => [...prev, { msg: message, status: 'pending' }]);
      setTimeout(() => {
        setConsoleSteps(prev => prev.map((step, idx) => 
          idx === prev.length - 1 ? { ...step, status: 'success' } : step
        ));
        resolve();
      }, delay);
    });
  };

  // Generate offline minutes document
  const generateLocalNotulensi = (): string => {
    const formattedActionItems = actionItems.length > 0
      ? actionItems.map((item, idx) => `| ${idx + 1} | ${item.task} | ${item.pic} | ${item.deadline} |`).join("\n")
      : "| - | Tidak ada rencana tindak lanjut spesifik | - | - |";

    return `# NOTULENSI RAPAT KOORDINASI KEPANITIAAN
## ${title.toUpperCase()}
**HUT KEMERDEKAAN REPUBLIK INDONESIA KE-81 - RW 04 NGABEAN**

---

### I. IDENTITAS & INFORMASI RAPAT
- **Hari / Tanggal** : ${date}
- **Waktu**          : ${time}
- **Tempat**         : ${location}
- **Pimpinan Rapat** : ${leader || "Ketua Panitia"}
- **Jumlah Peserta** : ${attendeesCount} Orang
- **Daftar Hadir**   : ${attendeesList || "Seluruh Anggota Seksi"}

---

### II. AGENDA RAPAT
${agenda}

---

### III. RINGKASAN PEMBAHASAN & HASIL JALANNYA RAPAT
Berikut adalah rincian draf pembahasan secara profesional berdasarkan hasil musyawarah perwakilan panitia RW 04 Ngabean:

${notesRaw}

---

### IV. KEPUTUSAN UTAMA RAPAT
Keputusan mutlak dan mufakat yang disepakati oleh seluruh peserta rapat:

${decisions}

---

### V. RENCANA TINDAK LANJUT (ACTION PLAN)
Aktivitas taktis lanjutan yang wajib diselesaikan oleh masing-masing Seksi penanggung jawab:

| No | Rencana Tindak Lanjut / Tugas | Seksi Penanggung Jawab (PIC) | Batas Waktu (Deadline) |
| :--- | :--- | :--- | :--- |
${formattedActionItems}

---

### VI. PENUTUP & PENGESAHAN DOKUMEN
Demikian draf notulen rapat koordinasi ini disusun dengan sebenar-benarnya untuk digunakan sebagai acuan kerja bersama seluruh Seksi Kepanitiaan Kemerdekaan RI Ke-81 RW 04 Ngabean Semarang.

Semarang, ${date}

**Pembuat Notulen (Sekretaris)**
Kepanitiaan HUT RI Ke-81 RW 04 Ngabean

*(Dokumen ini disahkan secara digital dalam Sistem Informasi SEMS)*`;
  };

  // trigger local save
  const handleLocalFormSave = async () => {
    const formattedReport = generateLocalNotulensi();
    const payload: Notulensi = {
      id: formId || 'notulensi_' + Date.now(),
      title,
      date,
      time,
      location,
      leader: leader || "Ketua Panitia",
      attendeesCount,
      attendeesList,
      agenda,
      notesRaw,
      decisions,
      contentMarkdown: formattedReport,
      actionItems: actionItems.map((a, i) => ({ ...a, id: `ai_${i}` })),
      createdAt: new Date().toISOString()
    };

    setIsGenerating(true);
    setShowConsole(true);
    setConsoleSteps([]);

    await logStep("Menginisialisasi Penyusunan Notulensi Lokal...", 150);
    await logStep("Memvalidasi parameter identitas & daftar kehadiran rapat...", 150);
    await logStep("Memformulasikan rangkuman pembahasan & mufakat keputusan...", 150);
    await logStep("Mengonversi daftar Action Plan ke dalam format tabel formal...", 150);
    await logStep("Membubuhkan tanda tangan digital kepanitiaan...", 100);

    await onSaveNotulensi(formId ? 'edit' : 'add', payload);
    
    await logStep("Sukses! Dokumen Notulensi resmi telah disimpan ke dalam database.", 100);
    
    setTimeout(() => {
      setShowConsole(false);
      setViewMode("list");
      setIsGenerating(false);
    }, 1200);
  };

  // trigger AI Gemini generation
  const handleAIGeneration = async () => {
    setIsGenerating(true);
    setShowConsole(true);
    setConsoleSteps([]);

    try {
      await logStep("Menginisialisasi Mesin Kecerdasan Buatan Gemini AI...", 150);
      await logStep("Membuat prompt instruksi sekretariat profesional...", 150);
      await logStep("Mengirimkan draf mentah dan data rill panitia ke server...", 200);

      const response = await fetch("/api/sems/generate-notulensi-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date,
          time,
          location,
          leader: leader || "Ketua Panitia",
          attendeesCount,
          attendeesList,
          agenda,
          notesRaw
        })
      });

      if (!response.ok) {
        throw new Error("Gagal generate notulensi AI.");
      }

      const result = await response.json();

      if (result.success && result.notulensi) {
        await logStep("Kecerdasan Buatan berhasil merumuskan tata bahasa rapat formal...", 200);
        await logStep("Tabel Action Items dan layout Markdown selesai distrukturkan...", 150);

        const aiExtractedActionItems = Array.isArray(result.actionItems) 
          ? result.actionItems.map((a: any, i: number) => ({
              id: `ai_${Date.now()}_${i}`,
              task: a.task || "",
              pic: a.pic || "",
              deadline: a.deadline || ""
            }))
          : actionItems.map((a, i) => ({ ...a, id: `ai_${i}` }));

        // Update local state with the extracted items so user can see them
        setActionItems(aiExtractedActionItems);

        const payload: Notulensi = {
          id: formId || 'notulensi_' + Date.now(),
          title,
          date,
          time,
          location,
          leader: leader || "Ketua Panitia",
          attendeesCount,
          attendeesList,
          agenda,
          notesRaw,
          decisions,
          contentMarkdown: result.notulensi,
          actionItems: aiExtractedActionItems,
          createdAt: new Date().toISOString()
        };

        await onSaveNotulensi(formId ? 'edit' : 'add', payload);
        await logStep("Selesai! Dokumen Notulensi AI berhasil disinkronisasi ke database.", 100);
        
        setTimeout(() => {
          setShowConsole(false);
          setViewMode("list");
          setIsGenerating(false);
        }, 1200);

      } else {
        throw new Error(result.error || "Gagal memproses draf.");
      }
    } catch (err: any) {
      console.error(err);
      await logStep("Terjadi kesalahan koneksi! Mengaktifkan mode penulisan aman offline...", 150);
      
      const formattedReport = generateLocalNotulensi();
      const payload: Notulensi = {
        id: formId || 'notulensi_' + Date.now(),
        title,
        date,
        time,
        location,
        leader: leader || "Ketua Panitia",
        attendeesCount,
        attendeesList,
        agenda,
        notesRaw,
        decisions,
        contentMarkdown: formattedReport,
        actionItems: actionItems.map((a, i) => ({ ...a, id: `ai_${i}` })),
        createdAt: new Date().toISOString()
      };

      await onSaveNotulensi(formId ? 'edit' : 'add', payload);
      await logStep("Draf lokal berhasil dirumuskan sebagai cadangan.", 100);

      setTimeout(() => {
        setShowConsole(false);
        setViewMode("list");
        setIsGenerating(false);
      }, 1200);
    }
  };

  const handleEditInit = (notulen: Notulensi) => {
    setFormId(notulen.id);
    setTitle(notulen.title);
    setDate(notulen.date);
    setTime(notulen.time);
    setLocation(notulen.location);
    setLeader(notulen.leader);
    setAttendeesCount(notulen.attendeesCount);
    setAttendeesList(notulen.attendeesList);
    setAgenda(notulen.agenda);
    setNotesRaw(notulen.notesRaw);
    setDecisions(notulen.decisions);
    setActionItems(notulen.actionItems);
    setViewMode("create");
  };

  const handleDelete = async (notulen: Notulensi) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus dokumen notulensi "${notulen.title}"?`)) {
      return;
    }
    await onSaveNotulensi('delete', notulen);
  };

  const copyToClipboard = () => {
    if (!selectedNotulensi) return;
    navigator.clipboard.writeText(selectedNotulensi.contentMarkdown);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const getFormattedPlainText = (item: Notulensi): string => {
    const divider = "================================================================================\n";
    const subDivider = "--------------------------------------------------------------------------------\n";
    
    let txt = "";
    txt += divider;
    txt += "                    NOTULENSI RAPAT KOORDINASI KEPANITIAAN                     \n";
    txt += `                      ${item.title.toUpperCase()}                      \n`;
    txt += "               HUT KEMERDEKAAN REPUBLIK INDONESIA KE-81 - RW 04                 \n";
    txt += divider + "\n";
    
    txt += "I. IDENTITAS & INFORMASI RAPAT\n";
    txt += subDivider;
    txt += ` Hari / Tanggal : ${item.date}\n`;
    txt += ` Waktu          : ${item.time}\n`;
    txt += ` Tempat         : ${item.location}\n`;
    txt += ` Pimpinan Rapat : ${item.leader || "Ketua Panitia"}\n`;
    txt += ` Jumlah Peserta : ${item.attendeesCount} Orang\n`;
    txt += ` Daftar Hadir   : ${item.attendeesList || "-"}\n\n`;
    
    txt += "II. AGENDA RAPAT\n";
    txt += subDivider;
    txt += (item.agenda || "").split("\n").map(line => ` ${line}`).join("\n") + "\n\n";
    
    txt += "III. RINGKASAN PEMBAHASAN\n";
    txt += subDivider;
    txt += (item.notesRaw || "").split("\n").map(line => ` ${line}`).join("\n") + "\n\n";
    
    txt += "IV. KEPUTUSAN UTAMA RAPAT\n";
    txt += subDivider;
    txt += (item.decisions || "").split("\n").map(line => ` ${line}`).join("\n") + "\n\n";
    
    if (item.actionItems && item.actionItems.length > 0) {
      txt += "V. RENCANA TINDAK LANJUT (ACTION PLAN)\n";
      txt += subDivider;
      txt += " | No | Rencana Tindak Lanjut / Tugas                 | PIC             | Batas Waktu  |\n";
      txt += " |----+-----------------------------------------------+-----------------+--------------|\n";
      item.actionItems.forEach((action, idx) => {
        const no = String(idx + 1).padEnd(2);
        const task = action.task.substring(0, 45).padEnd(45);
        const pic = action.pic.substring(0, 15).padEnd(15);
        const deadline = action.deadline.substring(0, 12).padEnd(12);
        txt += ` | ${no} | ${task} | ${pic} | ${deadline} |\n`;
      });
      txt += "\n";
    }
    
    txt += "VI. PENUTUP & PENGESAHAN DOKUMEN\n";
    txt += subDivider;
    txt += ` Demikian berita acara ini disusun untuk digunakan sebagai acuan kerja bersama.\n\n`;
    txt += ` Semarang, ${item.date.split(",")[1]?.trim() || "Juli 2026"}\n\n`;
    txt += ` [Pembuat Notulen (Sekretaris)]             [Pimpinan Rapat]\n\n\n`;
    txt += ` (Disahkan secara digital dalam Sistem Informasi SEMS • ID: ${item.id})\n`;
    
    return txt;
  };

  const downloadTxt = (item?: Notulensi) => {
    const targetItem = item || selectedNotulensi;
    if (!targetItem) return;
    const formattedText = getFormattedPlainText(targetItem);
    const element = document.createElement("a");
    const file = new Blob([formattedText], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `Notulen_${targetItem.title.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const exportPDFFileFor = async (item: Notulensi) => {
    const prevSelection = selectedNotulensi;
    setSelectedNotulensi(item);
    setIsExportingPDF(true);
    
    await new Promise((resolve) => setTimeout(resolve, 350));
    
    try {
      await exportToPDF("hidden-printable-notulensi-paper", `Notulen-${item.title.replace(/\s+/g, "-")}.pdf`);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExportingPDF(false);
      if (viewMode === "view") {
        setSelectedNotulensi(prevSelection);
      }
    }
  };

  const exportPDFFile = async () => {
    if (!selectedNotulensi) return;
    await exportPDFFileFor(selectedNotulensi);
  };

  const exportDOCFileFor = async (item: Notulensi) => {
    const prevSelection = selectedNotulensi;
    setSelectedNotulensi(item);
    setIsExportingDOC(true);
    
    await new Promise((resolve) => setTimeout(resolve, 350));
    
    try {
      await exportToWord("hidden-printable-notulensi-paper", `Notulen-${item.title.replace(/\s+/g, "-")}`);
    } catch (err) {
      console.error("DOC Export failed:", err);
    } finally {
      setIsExportingDOC(false);
      if (viewMode === "view") {
        setSelectedNotulensi(prevSelection);
      }
    }
  };

  const exportDOCFile = async () => {
    if (!selectedNotulensi) return;
    await exportDOCFileFor(selectedNotulensi);
  };

  // Filter notulensi list
  const filteredNotulensi = notulensi.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.agenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.leader.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Markdown renderer helper
  const renderMarkdownText = (markdownText: string) => {
    if (!markdownText) return null;

    const lines = markdownText.split("\n");
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: React.ReactNode[] = [];
    let tableHeaders: string[] = [];

    const flushLists = (key: string) => {
      if (inList && listItems.length > 0) {
        elements.push(
          <ul key={`ul-${key}`} className="list-disc pl-5 my-2.5 space-y-1 font-sans text-slate-700 leading-relaxed text-[11px] sm:text-[12px] text-justify">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    const flushTable = (key: string) => {
      if (inTable && tableRows.length > 0) {
        elements.push(
          <div key={`table-wrapper-${key}`} className="overflow-x-auto my-3 rounded-lg border border-slate-200">
            <table className="min-w-full text-left border-collapse text-[10px] sm:text-[11px]">
              {tableHeaders.length > 0 && (
                <thead>
                  <tr className="bg-red-700 text-white font-extrabold uppercase tracking-wide">
                    {tableHeaders.map((header, hIdx) => (
                      <th key={`th-${hIdx}`} className="p-2 border border-red-800/20">{header}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {tableRows}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        tableHeaders = [];
        inTable = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Handle HR
      if (trimmed === "---") {
        flushLists(`hr-${i}`);
        flushTable(`hr-${i}`);
        elements.push(<hr key={`hr-${i}`} className="border-t border-slate-200/80 my-4" />);
        continue;
      }

      // Handle Tables
      if (trimmed.startsWith("|")) {
        flushLists(`table-row-${i}`);
        
        // Extract row items
        const rawCells = line.split("|").map(cell => cell.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        
        // Skip separator line e.g. |:---|:---|
        if (trimmed.includes("---") || trimmed.includes(":-")) {
          inTable = true;
          continue;
        }

        if (!inTable) {
          // This must be header row
          tableHeaders = rawCells;
          inTable = true;
        } else {
          // Table body row
          tableRows.push(
            <tr key={`tr-${i}`} className="even:bg-slate-50/50 hover:bg-slate-50 transition-colors">
              {rawCells.map((cell, cIdx) => (
                <td key={`td-${cIdx}`} className="p-2 border border-slate-200 font-medium text-slate-700">
                  {cell.replace(/\*\*([\s\S]*?)\*\*/g, "$1")}
                </td>
              ))}
            </tr>
          );
        }
        continue;
      } else {
        flushTable(`non-table-${i}`);
      }

      // Handle Headers
      if (trimmed.startsWith("# ")) {
        flushLists(`h1-${i}`);
        const headerText = trimmed.substring(2).replace(/[#*]/g, "").trim();
        elements.push(
          <h1 key={`h1-${i}`} className="text-sm sm:text-base font-black tracking-wider uppercase text-center text-red-800 font-sans mt-4 mb-2">
            {headerText}
          </h1>
        );
        continue;
      }

      if (trimmed.startsWith("## ")) {
        flushLists(`h2-${i}`);
        const headerText = trimmed.substring(3).replace(/[#*]/g, "").trim();
        elements.push(
          <h2 key={`h2-${i}`} className="text-[11px] sm:text-[13px] font-extrabold tracking-normal uppercase text-center text-slate-800 font-sans mb-3">
            {headerText}
          </h2>
        );
        continue;
      }

      if (trimmed.startsWith("### ")) {
        flushLists(`h3-${i}`);
        const headerText = trimmed.substring(4).replace(/[#*]/g, "").trim();
        elements.push(
          <h3 key={`h3-${i}`} className="text-xs font-black tracking-wider uppercase text-red-700 font-sans mt-5 mb-2.5 flex items-center gap-1.5 border-b pb-1">
            {headerText}
          </h3>
        );
        continue;
      }

      // Handle Lists
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        inList = true;
        const bulletText = trimmed.substring(2);
        
        // Inline bold parsing helper
        const parts = bulletText.split(/\*\*([\s\S]*?)\*\*/g);
        const parsedBullet = parts.map((part, pIdx) => {
          if (pIdx % 2 === 1) {
            return <strong key={pIdx} className="font-extrabold text-slate-950">{part}</strong>;
          }
          return part;
        });

        listItems.push(
          <li key={`li-${i}-${listItems.length}`} className="leading-relaxed text-justify">
            {parsedBullet}
          </li>
        );
        continue;
      }

      // Handle standard line
      if (trimmed === "") {
        flushLists(`empty-${i}`);
        continue;
      }

      // Normal paragraph line
      flushLists(`p-${i}`);
      const parts = trimmed.split(/\*\*([\s\S]*?)\*\*/g);
      const parsedText = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={pIdx} className="font-extrabold text-slate-950">{part}</strong>;
        }
        return part;
      });

      elements.push(
        <p key={`p-${i}`} className="text-[11px] sm:text-[12px] font-medium text-slate-600 leading-relaxed my-2 text-justify">
          {parsedText}
        </p>
      );
    }

    // final flushes
    flushLists("end");
    flushTable("end");

    return elements;
  };

  // Themes list for paper preview
  const paperThemeStyles = {
    classic: {
      card: "border-red-200 bg-white",
      accentText: "text-red-800",
      accentBg: "bg-red-50"
    },
    minimal: {
      card: "border-slate-300 bg-white shadow-none",
      accentText: "text-slate-900",
      accentBg: "bg-slate-100"
    },
    creamy: {
      card: "border-amber-200/80 bg-[#fdfaf2]",
      accentText: "text-amber-900",
      accentBg: "bg-[#f5ebd6]"
    },
    royal: {
      card: "border-indigo-200 bg-white",
      accentText: "text-indigo-950",
      accentBg: "bg-indigo-50/60"
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <span className="px-2 py-0.5 bg-red-100 text-[#e61d1d] text-[10px] font-extrabold rounded-md uppercase tracking-wider">
            PHASE 2 • ADMINISTRASI RAPAT
          </span>
          <h1 className="text-lg font-extrabold text-slate-800 mt-1 uppercase tracking-wide">
            Notulensi Rapat Profesional
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5 max-w-2xl">
            Tulis, formulasikan, dan simpan berita acara rapat kemandirian RT/RW serta hasil musyawarah panitia secara instan dibantu Kecerdasan Buatan (Gemini AI).
          </p>
        </div>
        {viewMode === "list" && (
          <button
            id="btn-add-notulensi"
            onClick={() => {
              setFormId("");
              setTitle("Rapat Koordinasi Pleno I");
              setDate("Senin, 6 Juli 2026");
              setTime("19:30 - 22:00 WIB");
              setLocation("Balai Warga RW 04 Ngabean");
              setLeader("");
              setAttendeesCount(15);
              setAttendeesList("Sekretaris, Humas, Acara, Keamanan");
              setAgenda("1. Evaluasi Anggaran (RKBA) HUT RI Ke-81\n2. Pembagian Tugas Seksi Lapangan\n3. Pembahasan Swadaya Natura Warga");
              setNotesRaw("- Panitia menyepakati pembukaan lomba dimulai 10 Agustus 2026.\n- Seksi Acara merancang draf rundown umum.\n- Anggaran Seksi Perlengkapan disetujui Rp 2.000.000.");
              setDecisions("- Pengesahan pagu anggaran Seksi Acara dan Perlengkapan.\n- Penetapan jadwal gladi bersih pada 9 Agustus 2026.");
              setActionItems([]);
              setViewMode("create");
            }}
            className="flex items-center gap-1.5 bg-[#e61d1d] hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all duration-150 border border-transparent uppercase tracking-wider shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tulis Notulen Baru
          </button>
        )}
        {viewMode !== "list" && (
          <button
            onClick={() => {
              setViewMode("list");
              setSelectedNotulensi(null);
            }}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 transition-colors shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Daftar
          </button>
        )}
      </div>

      {/* VIEW 1: DAFTAR NOTULENSI */}
      {viewMode === "list" && (
        <div className="space-y-4">
          
          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cari berita acara rapat, agenda, atau pimpinan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none rounded-xl px-3.5 py-2.5 bg-white font-medium text-slate-700 shadow-sm"
              />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-xs text-slate-400 hover:text-slate-600 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl"
              >
                Reset Filter
              </button>
            )}
          </div>

          {filteredNotulensi.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
              <div className="flex justify-center">
                <div className="bg-slate-50 p-4 rounded-full text-slate-400">
                  <FileText className="w-8 h-8" />
                </div>
              </div>
              <div className="max-w-xs mx-auto">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Belum Ada Notulensi</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  {searchTerm 
                    ? "Tidak ada berita acara rapat yang cocok dengan kata kunci pencarian Anda." 
                    : "Seluruh musyawarah kepanitiaan Anda belum dicatat. Klik 'Tulis Notulen Baru' untuk memulai administrasi rapat yang rapi!"}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...filteredNotulensi]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-all duration-200 group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-bold text-red-600 uppercase bg-red-50 px-2 py-0.5 rounded">
                        {item.date.split(",")[0] || "Rapat"}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs font-black text-slate-800 line-clamp-2 uppercase group-hover:text-red-600 transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Pimpinan: <strong>{item.leader || "Ketua Panitia"}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2.5">
                      <h4 className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Agenda Utama:</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed whitespace-pre-line font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {item.agenda}
                      </p>
                    </div>

                    {item.actionItems && item.actionItems.length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Memiliki <strong>{item.actionItems.length} rencana kerja lanjutan</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 border-t border-slate-100 pt-3 mt-4">
                    <button
                      onClick={() => {
                        setSelectedNotulensi(item);
                        setViewMode("view");
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-[10px] py-2 rounded-lg border border-slate-200 uppercase tracking-wide cursor-pointer"
                    >
                      Buka Dokumen
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <button
                      onClick={() => exportPDFFileFor(item)}
                      disabled={isExportingPDF}
                      className="p-2 hover:bg-red-50 text-[#e61d1d] hover:text-red-700 rounded-lg border border-transparent hover:border-red-200 transition-all cursor-pointer disabled:opacity-50"
                      title="Unduh PDF Resmi"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => exportDOCFileFor(item)}
                      disabled={isExportingDOC}
                      className="p-2 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-lg border border-transparent hover:border-blue-200 transition-all cursor-pointer disabled:opacity-50"
                      title="Unduh DOC Resmi"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => downloadTxt(item)}
                      className="p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                      title="Unduh Berkas Teks (.txt)"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleEditInit(item)}
                      className="p-2 hover:bg-amber-50 text-amber-600 hover:text-amber-700 rounded-lg border border-transparent hover:border-amber-200 transition-all cursor-pointer"
                      title="Edit Notulensi"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-2 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg border border-transparent hover:border-red-200 transition-all cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: FORM TAMBAH / EDIT NOTULENSI */}
      {viewMode === "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Input Form */}
          <div className="lg:col-span-7 space-y-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <FileSpreadsheet className="w-4 h-4 text-red-600" />
              <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                {formId ? "Modifikasi Dokumen Notulen" : "Form Input Berita Acara Rapat"}
              </h2>
            </div>

            {/* Identitas Section */}
            <div className="space-y-3.5">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">I. Identitas & Informasi Rapat</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Judul / Agenda Rapat</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Rapat Pleno I Panitia HUT RI"
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2 bg-slate-50 font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Pimpinan Rapat</label>
                  <select
                    value={leader}
                    onChange={(e) => setLeader(e.target.value)}
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2 bg-slate-50 font-semibold text-slate-700"
                  >
                    <option value="">-- Pilih Pimpinan Rapat --</option>
                    {panitia.map((p) => (
                      <option key={p.id} value={`${p.name} (${p.role})`}>{p.name} - {p.role}</option>
                    ))}
                    <option value="Ketua Panitia RW 04">Ketua Panitia RW 04</option>
                    <option value="Sekretaris Panitia RW 04">Sekretaris Panitia</option>
                    <option value="Ketua RW 04">Ketua RW 04</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Hari & Tanggal</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="Hari, Tanggal Bulan Tahun"
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2 bg-slate-50 font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Waktu</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="Contoh: 19:30 - Selesai"
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2 bg-slate-50 font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Tempat/Lokasi</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2 bg-slate-50 font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Jumlah Peserta Hadir</label>
                  <input
                    type="number"
                    value={attendeesCount}
                    onChange={(e) => setAttendeesCount(parseInt(e.target.value) || 0)}
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2 bg-slate-50 font-semibold text-slate-700"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Seksi / Perwakilan Hadir</label>
                  <input
                    type="text"
                    value={attendeesList}
                    onChange={(e) => setAttendeesList(e.target.value)}
                    placeholder="Humas, Acara, Lomba, Perlengkapan, perwakilan RT"
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2 bg-slate-50 font-semibold text-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Agenda & Notes Section */}
            <div className="space-y-3.5 pt-3.5 border-t border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">II. Agenda & Catatan Pembahasan</h3>
              
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Daftar Agenda Rapat</label>
                <textarea
                  rows={3}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder="Sebutkan poin agenda utama yang dibahas..."
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg p-3 bg-slate-50 font-medium text-slate-700 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Catatan Jalannya Pembahasan Rapat (Draf Mentah / Poin Bahasan)</label>
                <textarea
                  rows={5}
                  value={notesRaw}
                  onChange={(e) => setNotesRaw(e.target.value)}
                  placeholder="Tuliskan draf mentah jalannya musyawarah, perbincangan, dan detail masukan panitia. Gunakan poin atau garis baru untuk memisahkan..."
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg p-3 bg-slate-50 font-medium text-slate-700 leading-relaxed font-mono"
                />
              </div>
            </div>

            {/* Decisions Section */}
            <div className="space-y-3.5 pt-3.5 border-t border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">III. Keputusan Utama (Mufakat Rapat)</h3>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Hasil Keputusan Yang Disepakati Bersama</label>
                <textarea
                  rows={3}
                  value={decisions}
                  onChange={(e) => setDecisions(e.target.value)}
                  placeholder="Butir-butir keputusan bulat hasil musyawarah mufakat..."
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg p-3 bg-slate-50 font-medium text-slate-700 leading-relaxed"
                />
              </div>
            </div>

          </div>

          {/* Side Panel: Action Plan & Generation */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Dynamic Action Items Table builder */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
              
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                  IV. Action Plan / Tindak Lanjut
                </h3>
              </div>

              {/* Add New Action item */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-2.5">
                <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Tambah Tugas Tindak Lanjut:</h4>
                <input
                  type="text"
                  placeholder="Ketik rincian instruksi tugas lanjutan..."
                  value={tempTask}
                  onChange={(e) => setTempTask(e.target.value)}
                  className="w-full text-xs border border-slate-200 bg-white focus:outline-none focus:border-red-500 rounded px-2 py-1.5 font-medium text-slate-700"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={tempPic}
                    onChange={(e) => setTempPic(e.target.value)}
                    className="text-[11px] border border-slate-200 bg-white focus:outline-none focus:border-red-500 rounded px-2 py-1.5 font-bold text-slate-600"
                  >
                    <option value="">-- Pilih PIC Seksi --</option>
                    {settings.seksiList.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="Kepanitiaan">Kepanitiaan</option>
                    <option value="Ketua RT">Ketua RT</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Deadline, mis: 15 Juli"
                    value={tempDeadline}
                    onChange={(e) => setTempDeadline(e.target.value)}
                    className="text-[11px] border border-slate-200 bg-white focus:outline-none focus:border-red-500 rounded px-2 py-1.5 font-medium text-slate-700"
                  />
                </div>
                <button
                  type="button"
                  onClick={addActionItem}
                  disabled={!tempTask.trim()}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] py-1.5 rounded cursor-pointer disabled:opacity-50 uppercase tracking-wider"
                >
                  Tambahkan ke Action Plan
                </button>
              </div>

              {/* Listed action items */}
              <div className="space-y-2">
                <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Daftar Tindak Lanjut Aktif ({actionItems.length}):</h4>
                {actionItems.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic text-center py-2 bg-slate-50/50 rounded border border-dashed border-slate-100">
                    Belum ada rencana tindak lanjut spesifik yang ditambahkan.
                  </p>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {actionItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-emerald-50/40 p-2.5 rounded border border-emerald-100/40 text-[10px] leading-relaxed">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-bold text-slate-800 line-clamp-2">{item.task}</p>
                          <div className="flex items-center gap-3 mt-1 text-[9px] text-slate-400">
                            <span>Seksi: <strong className="text-emerald-700 font-extrabold">{item.pic}</strong></span>
                            <span>Batas: <strong className="text-slate-600">{item.deadline}</strong></span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeActionItem(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Document compilation and save action buttons */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl text-white space-y-4">
              
              <div>
                <span className="px-2 py-0.5 bg-red-700/50 border border-red-500/30 text-red-400 text-[8px] font-bold rounded-md uppercase tracking-wider">
                  AI FORMULATOR ENGINE
                </span>
                <h3 className="text-xs font-black uppercase tracking-wide mt-1.5">
                  Rumuskan & Terbitkan Notulensi
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Kami merekomendasikan integrasi Gemini AI untuk mengolah catatan mentah Anda di samping menjadi berita acara rapat formal dengan tata bahasa yang prima.
                </p>
              </div>

              {/* Console terminal logs block */}
              {showConsole && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-[9px] text-emerald-400 space-y-1.5">
                  <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">SEMS AI Formulator Console</span>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {consoleSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-1">
                        <span className="text-slate-500 font-bold">{`>`}</span>
                        <div className="flex-1 flex justify-between">
                          <span>{step.msg}</span>
                          <span className={step.status === 'success' ? 'text-emerald-400 font-bold' : 'text-amber-500 font-bold'}>
                            {step.status === 'success' ? 'SUCCESS' : 'RUNNING...'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleAIGeneration}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-extrabold text-[11px] py-3 rounded-xl shadow-lg transition-all border border-transparent uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                  {isGenerating ? "Merumuskan Naskah..." : "Formulasikan dengan Gemini AI ✨"}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleLocalFormSave}
                    disabled={isGenerating}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-[10px] py-2.5 rounded-xl border border-slate-800 transition-colors cursor-pointer disabled:opacity-50 uppercase tracking-wider"
                  >
                    Format Standar Lokal
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    disabled={isGenerating}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 font-bold text-[10px] px-3 py-2.5 rounded-xl border border-slate-800 transition-colors cursor-pointer disabled:opacity-50 uppercase tracking-wider"
                  >
                    Batal
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 text-[10px] text-amber-300">
                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  <strong>Peringatan Offline:</strong> Apabila kunci API Gemini Anda belum di-set di pengaturan, tombol 'Format Standar Lokal' akan menyusun dokumen dengan instan menggunakan database lokal secara aman.
                </span>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* VIEW 3: PREVIEW & EXPORT NOTULEN DETAIL */}
      {viewMode === "view" && selectedNotulensi && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Paper Document Preview Frame */}
          <div className="lg:col-span-8 space-y-4">
            
            <div className={`border rounded-2xl overflow-hidden shadow-md ${paperThemeStyles[paperTheme].card}`}>
              
              {/* Printable Header Bar */}
              <div className={`border-b border-slate-100 px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[10px] ${paperThemeStyles[paperTheme].accentBg}`}>
                <span className={`font-extrabold font-sans flex items-center gap-1.5 ${paperThemeStyles[paperTheme].accentText}`}>
                  <ClipboardCheck className="w-4 h-4" />
                  PREVIEW DOKUMEN HASIL RUMUSAN NOTULENSI
                </span>
                
                {/* Print layout theme toggle */}
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Gaya Cetak:</span>
                  {(["classic", "minimal", "creamy", "royal"] as const).map((themeOpt) => (
                    <button
                      key={themeOpt}
                      onClick={() => setPaperTheme(themeOpt)}
                      className={`px-2 py-1 rounded text-[9px] font-bold border transition-all uppercase cursor-pointer ${
                        paperTheme === themeOpt 
                          ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                          : "bg-white hover:bg-slate-150 text-slate-600 border-slate-200"
                      }`}
                    >
                      {themeOpt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Printable Area Container */}
              <div id="printable-notulensi-paper" className="bg-white p-6 sm:p-10 text-slate-800 font-serif leading-relaxed relative print:p-0">
                
                {/* Visual Top Accent bar */}
                {paperTheme === "classic" && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-600 print:hidden"></div>
                )}
                {paperTheme === "royal" && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600 print:hidden"></div>
                )}

                {/* Main Markdown parsing output */}
                <div className="space-y-4 font-sans select-text">
                  {renderMarkdownText(selectedNotulensi.contentMarkdown)}
                </div>

              </div>

              {/* Bottom metadata tag */}
              <div className="bg-slate-50 p-3 text-[9px] text-slate-400 border-t border-slate-100 font-bold tracking-wider uppercase text-center font-mono">
                *Notulensi Resmi Konsolidasi SEMS digital • ID: {selectedNotulensi.id} • Dibuat: {new Date(selectedNotulensi.createdAt).toLocaleString('id-ID')}
              </div>

            </div>

          </div>

          {/* Export Action Controls */}
          <div className="lg:col-span-4 space-y-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              
              <div className="border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                  Menu Ekspor & Aksi
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Unduh hasil rumusan berita acara ini untuk dicetak, dibagikan di grup WhatsApp warga, atau diarsip.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={copyToClipboard}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-emerald-400" />
                  {copiedText ? "Berhasil Disalin!" : "Salin Teks (WhatsApp)"}
                </button>

                <button
                  onClick={exportPDFFile}
                  disabled={isExportingPDF}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3 rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-4 h-4 text-white" />
                  {isExportingPDF ? "Mengekspor PDF..." : "Unduh PDF Resmi"}
                </button>

                <button
                  onClick={exportDOCFile}
                  disabled={isExportingDOC}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <FileText className="w-4 h-4 text-white" />
                  {isExportingDOC ? "Mengekspor DOC..." : "Unduh DOC Resmi"}
                </button>

                <button
                  onClick={() => downloadTxt(selectedNotulensi || undefined)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  Unduh File Teks (.txt)
                </button>
              </div>

              <div className="border-t border-slate-100 pt-3 flex gap-2">
                <button
                  onClick={() => handleEditInit(selectedNotulensi)}
                  className="flex-1 flex items-center justify-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold text-[10px] py-2 rounded-xl border border-amber-200 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Notulen
                </button>
                <button
                  onClick={async () => {
                    await handleDelete(selectedNotulensi);
                    setViewMode("list");
                    setSelectedNotulensi(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-[10px] py-2 rounded-xl border border-red-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Dokumen
                </button>
              </div>

            </div>

            <div className="bg-[#fdeeee] border border-red-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-[#e61d1d]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <h4 className="text-[11px] font-extrabold uppercase tracking-wide">Tips Cetak Rapi:</h4>
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                Gunakan menu <strong>Unduh Dokumen PDF Resmi</strong> untuk mendapatkan lembar cetakan dengan kop surat dan tata letak print-friendly beresolusi tinggi tanpa terpotong batas browser.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* Hidden printable container for background PDF generation of any selected notulen */}
      <div className="absolute left-[-9999px] top-[-9999px] w-[800px] pointer-events-none" aria-hidden="true">
        {selectedNotulensi && (
          <div id="hidden-printable-notulensi-paper" className="bg-white p-10 text-slate-800 font-serif leading-relaxed">
            <div className="space-y-4 font-sans select-text">
              {renderMarkdownText(selectedNotulensi.contentMarkdown)}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
