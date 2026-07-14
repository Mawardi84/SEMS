import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Printer, 
  Download, 
  Clipboard, 
  Check, 
  ArrowLeft, 
  Sparkles, 
  Cpu, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Users, 
  FileText, 
  Info, 
  Send,
  AlertTriangle,
  Flag,
  Trophy,
  Award,
  Star,
  Shield,
  Heart,
  Image as ImageIcon,
  Upload
} from "lucide-react";
import { UndanganRapat, Panitia, Kegiatan, SystemSetting } from "../types";
import { exportToPDF } from "../utils/pdfExport";
import { exportToDOC } from "../utils/docExport";
import ReactMarkdown from "react-markdown";

interface UndanganRapatViewProps {
  undangan: UndanganRapat[];
  panitia: Panitia[];
  kegiatan: Kegiatan[];
  settings: SystemSetting;
  onSaveUndangan: (action: 'add' | 'edit' | 'delete', data: UndanganRapat) => Promise<void>;
}

export default function UndanganRapatView({ 
  undangan, 
  panitia, 
  kegiatan, 
  settings,
  onSaveUndangan 
}: UndanganRapatViewProps) {
  const [viewMode, setViewMode] = useState<"list" | "create" | "view">("list");
  const [selectedUndangan, setSelectedUndangan] = useState<UndanganRapat | null>(null);
  
  // Console Log Terminal States for AI
  const [showConsole, setShowConsole] = useState(false);
  const [consoleSteps, setConsoleSteps] = useState<{ msg: string; status: 'pending' | 'success' }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingDOC, setIsExportingDOC] = useState(false);

  // Form States
  const [formId, setFormId] = useState<string>("");
  const [letterNumber, setLetterNumber] = useState<string>("001/PAN-HUT81/RW04/VII/2026");
  const [subject, setSubject] = useState<string>("Undangan Rapat Koordinasi Panitia");
  const [date, setDate] = useState<string>("Sabtu, 11 Juli 2026");
  const [time, setTime] = useState<string>("19:30 WIB - Selesai");
  const [location, setLocation] = useState<string>("Balai RW 04 Ngabean");
  const [agenda, setAgenda] = useState<string>("1. Koordinasi teknis pelaksanaan lomba\n2. Finalisasi anggaran belanja seksi\n3. Pembagian jadwal piket lapangan");
  const [notes, setNotes] = useState<string>("Mengingat pentingnya acara ini, seluruh koordinator seksi wajib hadir tepat waktu dan membawa draf usulan RKBA masing-masing.");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([
    "Seluruh Koordinator Seksi Panitia",
    "Pengurus RW 04 Ngabean"
  ]);
  const [signatoryName, setSignatoryName] = useState<string>("");
  const [signatoryRole, setSignatoryRole] = useState<string>("Ketua Panitia");
  const [signatoryName2, setSignatoryName2] = useState<string>("");
  const [signatoryRole2, setSignatoryRole2] = useState<string>("Sekretaris Panitia");
  const [signatoryName3, setSignatoryName3] = useState<string>("");
  const [signatoryRole3, setSignatoryRole3] = useState<string>("Bendahara Panitia");

  // Kop Surat States
  const [useMasterKop, setUseMasterKop] = useState<boolean>(true);
  const [kopLine1, setKopLine1] = useState<string>("");
  const [kopLine2, setKopLine2] = useState<string>("");
  const [kopLine3, setKopLine3] = useState<string>("");
  const [kopLine4, setKopLine4] = useState<string>("");
  const [logoStyle, setLogoStyle] = useState<string>("flag");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [kopStyle, setKopStyle] = useState<string>("classic-centered");
  const [showKopEditor, setShowKopEditor] = useState<boolean>(false);

  // Show / Hide Signature & Stamp in Letter
  const [showKetuaSignature, setShowKetuaSignature] = useState<boolean>(true);
  const [showBendaharaSignature, setShowBendaharaSignature] = useState<boolean>(false);
  const [showSekretarisSignature, setShowSekretarisSignature] = useState<boolean>(true);
  const [showStempel, setShowStempel] = useState<boolean>(true);

  // Panitia/Invitees selection filter search
  const [panitiaSearchTerm, setPanitiaSearchTerm] = useState<string>("");

  // Paper Theme option
  const [paperTheme, setPaperTheme] = useState<"classic" | "minimal" | "creamy" | "royal">("classic");

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState("");

  // AI Prompt Templates
  const [aiTemplate, setAiTemplate] = useState<string>("koordinasi_lomba");
  const [customPrompt, setCustomPrompt] = useState<string>("");

  // List of preset recipients
  const presetRecipients = [
    "Seluruh Ketua RT (RT 01 - RT 04) RW 04",
    "Seluruh Koordinator Seksi Panitia",
    "Pengurus RW 04 Ngabean",
    "Tokoh Masyarakat RW 04",
    "Perwakilan Pemuda / Karang Taruna",
    "Seksi Perlengkapan & Keamanan"
  ];

  const activeKopLine1 = useMasterKop ? (settings?.kopLine1 || "PANITIA PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81") : (kopLine1 || "PANITIA PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81");
  const activeKopLine2 = useMasterKop ? (settings?.kopLine2 || "RUKUN WARGA 04 KELURAHAN NGABEAN") : (kopLine2 || "RUKUN WARGA 04 KELURAHAN NGABEAN");
  const activeKopLine3 = useMasterKop ? (settings?.kopLine3 || "Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah") : (kopLine3 || "Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah");
  const activeKopLine4 = useMasterKop ? (settings?.kopLine4 || "Sekretariat: Balai RW 04 Ngabean, Telp: +62 812-3456-7890 | Kode Pos: 50141") : (kopLine4 || "Sekretariat: Balai RW 04 Ngabean, Telp: +62 812-3456-7890 | Kode Pos: 50141");
  const activeLogoStyle = useMasterKop ? (settings?.logoStyle || "flag") : (logoStyle || "flag");
  const activeLogoUrl = useMasterKop ? (settings?.logoUrl || "") : (logoUrl || "");
  const activeKopStyle = useMasterKop ? (settings?.kopStyle || "classic-centered") : (kopStyle || "classic-centered");

  const viewKopLine1 = selectedUndangan?.useMasterKop !== false ? (settings?.kopLine1 || "PANITIA PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81") : (selectedUndangan.kopLine1 || "PANITIA PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81");
  const viewKopLine2 = selectedUndangan?.useMasterKop !== false ? (settings?.kopLine2 || "RUKUN WARGA 04 KELURAHAN NGABEAN") : (selectedUndangan.kopLine2 || "RUKUN WARGA 04 KELURAHAN NGABEAN");
  const viewKopLine3 = selectedUndangan?.useMasterKop !== false ? (settings?.kopLine3 || "Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah") : (selectedUndangan.kopLine3 || "Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah");
  const viewKopLine4 = selectedUndangan?.useMasterKop !== false ? (settings?.kopLine4 || "Sekretariat: Balai RW 04 Ngabean, Telp: +62 812-3456-7890 | Kode Pos: 50141") : (selectedUndangan.kopLine4 || "Sekretariat: Balai RW 04 Ngabean, Telp: +62 812-3456-7890 | Kode Pos: 50141");
  const viewLogoStyle = selectedUndangan?.useMasterKop !== false ? (settings?.logoStyle || "flag") : (selectedUndangan.logoStyle || "flag");
  const viewLogoUrl = selectedUndangan?.useMasterKop !== false ? (settings?.logoUrl || "") : (selectedUndangan.logoUrl || "");
  const viewKopStyle = selectedUndangan?.useMasterKop !== false ? (settings?.kopStyle || "classic-centered") : (selectedUndangan.kopStyle || "classic-centered");

  // Sync default signatories from panitia list on first load
  useEffect(() => {
    if (panitia && panitia.length > 0) {
      const ketua = panitia.find(p => p.role.toLowerCase().includes("ketua"));
      const sekretaris = panitia.find(p => p.role.toLowerCase().includes("sekretaris"));
      const rw = panitia.find(p => p.role.toLowerCase().includes("rw"));

      if (ketua && !signatoryName) {
        setSignatoryName(ketua.name);
        setSignatoryRole(ketua.role);
      }
      if (sekretaris && !signatoryName2) {
        setSignatoryName2(sekretaris.name);
        setSignatoryRole2(sekretaris.role);
      } else if (rw && !signatoryName2) {
        setSignatoryName2(rw.name);
        setSignatoryRole2("Ketua RW 04 (Mengetahui)");
      }
    }
  }, [panitia]);

  const toggleRecipient = (recipient: string) => {
    if (selectedRecipients.includes(recipient)) {
      setSelectedRecipients(selectedRecipients.filter(r => r !== recipient));
    } else {
      setSelectedRecipients([...selectedRecipients, recipient]);
    }
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

  // Generate local / fallback letter text
  const generateLocalLetter = (): string => {
    const recipientText = selectedRecipients.length > 0 
      ? selectedRecipients.map(r => `- ${r}`).join("\n")
      : "- Bapak/Ibu/Saudara/i Anggota Panitia";

    return `### PANITIA PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81
**RUKUN WARGA 04 NGABEAN, SEMARANG BARAT**
*Alamat: Balai RW 04 Ngabean, Semarang Barat, Jawa Tengah*

---

<table>
  <tr><td><b>Nomor</b></td><td style="padding: 0 5px;">:</td><td>${letterNumber}</td></tr>
  <tr><td><b>Sifat</b></td><td style="padding: 0 5px;">:</td><td>Penting / Segera</td></tr>
  <tr><td><b>Lampiran</b></td><td style="padding: 0 5px;">:</td><td>-</td></tr>
  <tr><td><b>Perihal</b></td><td style="padding: 0 5px;">:</td><td>${subject}</td></tr>
</table>

Semarang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}

**Kepada Yth.**  
${recipientText}  
di Tempat

**Dengan hormat,**

Sehubungan dengan persiapan menyambut Hari Ulang Tahun (HUT) Kemerdekaan Republik Indonesia Ke-81 tingkat RW 04 Ngabean, kami mengharapkan kehadiran Bapak/Ibu/Saudara/i Pengurus dan Panitia dalam rapat koordinasi yang akan diselenggarakan pada:

- **Hari / Tanggal** : ${date}
- **Waktu**          : ${time}
- **Tempat**         : ${location}
- **Agenda Rapat**   : 
${agenda.split('\n').map(a => `  ${a}`).join('\n')}

**Catatan**: ${notes || "-"}

Mengingat sangat pentingnya koordinasi demi kelancaran agenda HUT RI ke-81 ini, kehadiran Bapak/Ibu/Saudara/i tepat waktu sangat kami harapkan.

Demikian undangan ini kami sampaikan, atas perhatian dan kehadiran serta kerjasamanya diucapkan terima kasih.

**Hormat Kami,**

| **${signatoryRole}** | **${signatoryRole2 || "Sekretaris Panitia"}** |
| :--- | :--- |
| | |
| | |
| **${signatoryName || "Ketua Panitia"}** | **${signatoryName2 || "Sekretaris Panitia"}** |
`;
  };

  // Generate Letter using Gemini AI on backend
  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setShowConsole(true);
    setConsoleSteps([]);

    try {
      await logStep("Menginisialisasi modul kecerdasan buatan Gemini AI...", 400);
      await logStep("Membaca parameter surat undangan & penerima...", 300);
      await logStep("Menyusun struktur KOP Surat Resmi RW 04 Ngabean...", 400);
      await logStep("Menghubungi server Gemini 2.5 Flash API...", 500);

      // Map template choices to instructions
      let agendaText = agenda;
      let subjectText = subject;

      if (aiTemplate === "koordinasi_lomba") {
        subjectText = "Undangan Rapat Koordinasi Teknis Lomba HUT RI Ke-81";
        agendaText = "1. Penyusunan draf aturan main masing-masing cabang lomba\n2. Penentuan penanggung jawab (PIC) lomba lapangan\n3. Pengumpulan list kebutuhan alat, konsumsi, & hadiah utama";
      } else if (aiTemplate === "pleno_anggaran") {
        subjectText = "Undangan Rapat Pleno I Rencana Anggaran (RKBA)";
        agendaText = "1. Pembahasan batas operasional belanja seksi panitia\n2. Sinkronisasi target sumbangan warga & donatur luar\n3. Pengesahan alokasi dana operasional utama";
      } else if (aiTemplate === "evaluasi_malam_tirakatan") {
        subjectText = "Undangan Rapat Evaluasi & Persiapan Malam Tirakatan";
        agendaText = "1. Pembahasan panggung utama dan sewa sarpras\n2. Susunan pengisi acara pentas seni warga\n3. Detail konsumsi nasi tumpeng per RT";
      }

      const response = await fetch("/api/sems/generate-undangan-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          letterNumber,
          subject: subjectText,
          date,
          time,
          location,
          agenda: agendaText,
          notes: notes + (customPrompt ? `\nCatatan Tambahan AI: ${customPrompt}` : ""),
          recipients: selectedRecipients,
          signatoryName,
          signatoryRole,
          signatoryName2,
          signatoryRole2,
          signatoryName3,
          signatoryRole3
        })
      });

      if (!response.ok) {
        throw new Error("Gagal menyusun surat dengan AI. Menggunakan generator lokal...");
      }

      const result = await response.json();
      
      if (result.success) {
        await logStep("Menyusun kalimat formal baku Bahasa Indonesia (EYD)...", 400);
        await logStep("Draf surat undangan resmi berhasil digenerate oleh AI!", 300);
        
        setSubject(subjectText);
        setAgenda(agendaText);
        
        // Open modal or display generated letter
        const newUndangan: UndanganRapat = {
          id: formId || "undangan_" + Date.now(),
          letterNumber,
          subject: subjectText,
          date,
          time,
          location,
          agenda: agendaText,
          notes,
          recipients: selectedRecipients,
          signatoryName,
          signatoryRole,
          signatoryName2,
          signatoryRole2,
          signatoryName3,
          signatoryRole3,
          createdAt: new Date().toISOString(),
          contentMarkdown: result.contentMarkdown,
          kopLine1,
          kopLine2,
          kopLine3,
          kopLine4,
          logoStyle,
          logoUrl,
          kopStyle,
          showKetuaSignature,
          showBendaharaSignature,
          showSekretarisSignature,
          showStempel
        };

        setSelectedUndangan(newUndangan);
        setViewMode("view");
        setShowConsole(false);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      console.error(err);
      await logStep("Koneksi API dibatasi. Mengalihkan ke generator lokal standar...", 500);
      
      const fallbackMarkdown = generateLocalLetter();
      const fallbackUndangan: UndanganRapat = {
        id: formId || "undangan_" + Date.now(),
        letterNumber,
        subject,
        date,
        time,
        location,
        agenda,
        notes,
        recipients: selectedRecipients,
        signatoryName,
        signatoryRole,
        signatoryName2,
        signatoryRole2,
        signatoryName3,
        signatoryRole3,
        createdAt: new Date().toISOString(),
        contentMarkdown: fallbackMarkdown,
        kopLine1,
        kopLine2,
        kopLine3,
        kopLine4,
        logoStyle,
        logoUrl,
        kopStyle,
        showKetuaSignature,
        showBendaharaSignature,
        showSekretarisSignature,
        showStempel
      };

      setSelectedUndangan(fallbackUndangan);
      setViewMode("view");
      setShowConsole(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenForm = (existing?: UndanganRapat) => {
    if (existing) {
      setFormId(existing.id);
      setLetterNumber(existing.letterNumber);
      setSubject(existing.subject);
      setDate(existing.date);
      setTime(existing.time);
      setLocation(existing.location);
      setAgenda(existing.agenda);
      setNotes(existing.notes || "");
      setSelectedRecipients(existing.recipients || []);
      setSignatoryName(existing.signatoryName);
      setSignatoryRole(existing.signatoryRole);
      setSignatoryName2(existing.signatoryName2 || "");
      setSignatoryRole2(existing.signatoryRole2 || "");
      setSignatoryName3(existing.signatoryName3 || "");
      setSignatoryRole3(existing.signatoryRole3 || "Bendahara Panitia");
      
      setShowKetuaSignature(existing.showKetuaSignature !== false);
      setShowBendaharaSignature(existing.showBendaharaSignature === true);
      setShowSekretarisSignature(existing.showSekretarisSignature !== false);
      setShowStempel(existing.showStempel !== false);
      
      const isUsingMaster = existing.useMasterKop !== false;
      setUseMasterKop(isUsingMaster);
      setKopLine1(existing.kopLine1 || settings?.kopLine1 || "PANITIA PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81");
      setKopLine2(existing.kopLine2 || settings?.kopLine2 || "RUKUN WARGA 04 KELURAHAN NGABEAN");
      setKopLine3(existing.kopLine3 || settings?.kopLine3 || "Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah");
      setKopLine4(existing.kopLine4 || settings?.kopLine4 || "Sekretariat: Balai RW 04 Ngabean, Telp: +62 812-3456-7890 | Kode Pos: 50141");
      setLogoStyle(existing.logoStyle || settings?.logoStyle || "flag");
      setLogoUrl(existing.logoUrl || settings?.logoUrl || "");
      setKopStyle(existing.kopStyle || settings?.kopStyle || "classic-centered");
    } else {
      setFormId("");
      const index = undangan.length + 1;
      setLetterNumber(`00${index}/PAN-HUT81/RW04/VII/2026`);
      setSubject("Undangan Rapat Koordinasi Panitia");
      setDate("Sabtu, 11 Juli 2026");
      setTime("19:30 WIB - Selesai");
      setLocation("Balai RW 04 Ngabean");
      setAgenda("1. Koordinasi teknis pelaksanaan lomba\n2. Finalisasi anggaran belanja seksi\n3. Pembagian jadwal piket lapangan");
      setNotes("Mengingat pentingnya acara ini, seluruh koordinator seksi wajib hadir tepat waktu.");
      setSelectedRecipients([
        "Seluruh Koordinator Seksi Panitia",
        "Pengurus RW 04 Ngabean"
      ]);
      setUseMasterKop(true);
      setKopLine1(settings?.kopLine1 || "PANITIA PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81");
      setKopLine2(settings?.kopLine2 || "RUKUN WARGA 04 KELURAHAN NGABEAN");
      setKopLine3(settings?.kopLine3 || "Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah");
      setKopLine4(settings?.kopLine4 || "Sekretariat: Balai RW 04 Ngabean, Telp: +62 812-3456-7890 | Kode Pos: 50141");
      setLogoStyle(settings?.logoStyle || "flag");
      setLogoUrl(settings?.logoUrl || "");
      setKopStyle(settings?.kopStyle || "classic-centered");
      
      setShowKetuaSignature(true);
      setShowBendaharaSignature(false);
      setShowSekretarisSignature(true);
      setShowStempel(true);
      
      // Auto-fill from panitia
      if (panitia && panitia.length > 0) {
        const ketua = panitia.find(p => p.role.toLowerCase().includes("ketua"));
        const sekretaris = panitia.find(p => p.role.toLowerCase().includes("sekretaris"));
        const bendahara = panitia.find(p => p.role.toLowerCase().includes("bendahara"));
        if (ketua) {
          setSignatoryName(ketua.name);
          setSignatoryRole(ketua.role);
        } else if (settings?.signatureKetuaName) {
          setSignatoryName(settings.signatureKetuaName);
          setSignatoryRole("Ketua Panitia");
        }
        if (sekretaris) {
          setSignatoryName2(sekretaris.name);
          setSignatoryRole2(sekretaris.role);
        } else if (settings?.signatureSekretarisName) {
          setSignatoryName2(settings.signatureSekretarisName);
          setSignatoryRole2("Sekretaris Panitia");
        }
        if (bendahara) {
          setSignatoryName3(bendahara.name);
          setSignatoryRole3(bendahara.role);
        } else if (settings?.signatureBendaharaName) {
          setSignatoryName3(settings.signatureBendaharaName);
          setSignatoryRole3("Bendahara Panitia");
        }
      } else {
        setSignatoryName(settings?.signatureKetuaName || "Fx. Mawardi");
        setSignatoryRole("Ketua Panitia");
        setSignatoryName2(settings?.signatureSekretarisName || "Tri Setiawan");
        setSignatoryRole2("Sekretaris Panitia");
        setSignatoryName3(settings?.signatureBendaharaName || "Heri Prasetyo");
        setSignatoryRole3("Bendahara Panitia");
      }
    }
    setViewMode("create");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const markdown = selectedUndangan?.contentMarkdown || generateLocalLetter();
    
    const dataToSave: UndanganRapat = {
      id: formId || "undangan_" + Date.now(),
      letterNumber,
      subject,
      date,
      time,
      location,
      agenda,
      notes,
      recipients: selectedRecipients,
      signatoryName,
      signatoryRole,
      signatoryName2,
      signatoryRole2,
      signatoryName3,
      signatoryRole3,
      createdAt: new Date().toISOString(),
      contentMarkdown: markdown,
      useMasterKop,
      kopLine1: useMasterKop ? "" : kopLine1,
      kopLine2: useMasterKop ? "" : kopLine2,
      kopLine3: useMasterKop ? "" : kopLine3,
      kopLine4: useMasterKop ? "" : kopLine4,
      logoStyle: useMasterKop ? "" : logoStyle,
      logoUrl: useMasterKop ? "" : logoUrl,
      kopStyle: useMasterKop ? "" : kopStyle,
      showKetuaSignature,
      showBendaharaSignature,
      showSekretarisSignature,
      showStempel
    };

    setIsGenerating(true);
    await onSaveUndangan(formId ? 'edit' : 'add', dataToSave);
    setIsGenerating(false);
    setViewMode("list");
  };

  const handleDelete = async (item: UndanganRapat) => {
    if (confirm(`Apakah Anda yakin ingin menghapus surat undangan "${item.subject}"?`)) {
      await onSaveUndangan('delete', item);
    }
  };

  const handleCopy = () => {
    if (!selectedUndangan?.contentMarkdown) return;
    navigator.clipboard.writeText(selectedUndangan.contentMarkdown);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePDFExport = async () => {
    setIsExportingPDF(true);
    try {
      await exportToPDF("undangan-render-area", `Surat_Undangan_${selectedUndangan?.letterNumber.replace(/\//g, "-")}.pdf`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleDOCExport = async () => {
    if (!selectedUndangan) return;
    setIsExportingDOC(true);
    try {
      exportToDOC(selectedUndangan, settings, `Surat_Undangan_${selectedUndangan.letterNumber.replace(/\//g, "-")}.doc`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsExportingDOC(false);
    }
  };

  const filteredUndangan = undangan.filter(u => 
    u.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.letterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto selection:bg-red-600 selection:text-white">
      
      {/* HEADER BANNER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-3xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shadow-3xs">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-extrabold text-slate-800 uppercase tracking-wide">Surat Undangan Rapat</h1>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                Buat, sunting, dan cetak surat undangan rapat resmi panitia HUT RI secara instan dan rapi menggunakan asisten draf AI terintegrasi Gemini.
              </p>
            </div>
          </div>
          {viewMode === "list" && (
            <button
              onClick={() => handleOpenForm()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all duration-200 shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Buat Undangan Rapat
            </button>
          )}
        </div>
      </div>

      {/* VIEW MODES */}
      {viewMode === "list" && (
        <div className="space-y-5">
          {/* Filter and search bar */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Cari perihal, nomor surat, atau tempat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg pl-3 pr-4 py-2.5 bg-slate-50/50"
              />
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Total: <strong>{filteredUndangan.length}</strong> Undangan Terarsip
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUndangan.length > 0 ? (
              filteredUndangan.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200/80 shadow-3xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col h-full overflow-hidden group"
                >
                  {/* National Red Ribbon Accent */}
                  <div className="h-1 bg-gradient-to-r from-red-600 to-red-500 w-full"></div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[9px] font-extrabold text-red-600 bg-red-50 px-2.5 py-1 rounded border border-red-100 uppercase tracking-wider">
                          NO: {item.letterNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.createdAt).toLocaleDateString('id-ID')}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-xs font-bold text-slate-800 leading-snug group-hover:text-red-600 transition-colors line-clamp-2">
                          {item.subject}
                        </h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                          Agenda: {item.agenda.replace(/\n/g, ', ')}
                        </p>
                      </div>
                    </div>

                    {/* Quick Info list */}
                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold truncate">{item.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{item.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Controls */}
                  <div className="bg-slate-50/50 px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
                    <span className="text-[9px] text-slate-400 font-medium truncate max-w-[120px]">
                      Penerima: {item.recipients.join(", ")}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedUndangan(item);
                          setViewMode("view");
                        }}
                        className="p-1.5 hover:bg-white rounded text-slate-500 hover:text-slate-800 border border-transparent hover:border-slate-100 transition-all flex items-center gap-1 text-[10px] font-bold shadow-3xs cursor-pointer"
                        title="Buka / Cetak Surat"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenForm(item)}
                        className="p-1.5 hover:bg-white rounded text-blue-500 hover:text-blue-700 border border-transparent hover:border-slate-100 transition-all flex items-center gap-1 text-[10px] font-bold shadow-3xs cursor-pointer"
                        title="Edit Undangan"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1.5 hover:bg-white rounded text-red-500 hover:text-red-700 border border-transparent hover:border-slate-100 transition-all flex items-center gap-1 text-[10px] font-bold shadow-3xs cursor-pointer"
                        title="Hapus Undangan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white rounded-xl border border-slate-200 p-16 text-center space-y-3.5 shadow-3xs">
                <Mail className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Undangan tidak ditemukan</p>
                  <p className="text-[11px] text-slate-400">Belum ada surat undangan rapat yang dibuat. Klik "Buat Undangan Rapat" untuk mulai merancang.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === "create" && (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form left inputs */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
            <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-red-600" />
              Kelengkapan Identitas Surat Undangan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nomor Surat Resmi</label>
                <input
                  type="text"
                  placeholder="Contoh: 001/PAN-HUT81/RW04/VII/2026"
                  value={letterNumber}
                  onChange={(e) => setLetterNumber(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3.5 py-2.5 bg-slate-50/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Perihal / Subjek Undangan</label>
                <input
                  type="text"
                  placeholder="Contoh: Undangan Rapat Koordinasi Panitia"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3.5 py-2.5 bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hari & Tanggal Rapat</label>
                <input
                  type="text"
                  placeholder="Sabtu, 11 Juli 2026"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3.5 py-2.5 bg-slate-50/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Waktu Pelaksanaan</label>
                <input
                  type="text"
                  placeholder="19:30 WIB - Selesai"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3.5 py-2.5 bg-slate-50/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tempat / Ruangan</label>
                <input
                  type="text"
                  placeholder="Balai RW 04 Ngabean"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3.5 py-2.5 bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Agenda Utama (Satu Baris Per Agenda)</label>
              <textarea
                rows={4}
                placeholder="Tuliskan butir agenda rapat..."
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg p-3 bg-slate-50/50 font-sans leading-relaxed resize-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catatan Tambahan (Bawah Surat)</label>
              <textarea
                rows={2}
                placeholder="Contoh: Seluruh koordinator seksi wajib membawa draf usulan anggaran..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg p-3 bg-slate-50/50 font-sans leading-relaxed resize-none"
              />
            </div>

            {/* Target Recipients Checkboxes */}
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Daftar Penerima Surat Undangan</label>
                {selectedRecipients.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => setSelectedRecipients([])}
                    className="text-[10px] font-bold text-red-600 hover:text-red-700 transition-colors uppercase tracking-wider"
                  >
                    Kosongkan Semua ({selectedRecipients.length})
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Panel Kiri: Preset Grup Penerima */}
                <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 space-y-2.5">
                  <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block border-b border-slate-200/60 pb-1.5">Preset Grup Penerima</span>
                  <div className="grid grid-cols-1 gap-2 max-h-[190px] overflow-y-auto pr-1">
                    {presetRecipients.map(r => (
                      <label key={r} className="flex items-start gap-2.5 p-2 bg-white rounded-lg hover:bg-red-50/20 border border-slate-150 transition-all cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedRecipients.includes(r)}
                          onChange={() => toggleRecipient(r)}
                          className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-[10.5px] font-medium text-slate-700 leading-snug">{r}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Panel Kanan: Pilih Personil Panitia Individu */}
                <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5 gap-2">
                    <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block shrink-0">Personil Panitia Individu</span>
                    <input 
                      type="text"
                      placeholder="Cari nama / seksi..."
                      value={panitiaSearchTerm}
                      onChange={(e) => setPanitiaSearchTerm(e.target.value)}
                      className="text-[10px] border border-slate-200 rounded px-2 py-0.5 bg-white w-32 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                    {(panitia || []).filter(p => 
                      p.name.toLowerCase().includes(panitiaSearchTerm.toLowerCase()) || 
                      p.role.toLowerCase().includes(panitiaSearchTerm.toLowerCase())
                    ).map(p => {
                      const formattedName = `${p.name} (${p.role})`;
                      const isChecked = selectedRecipients.includes(formattedName);
                      return (
                        <label key={p.id} className="flex items-start gap-2.5 p-2 bg-white rounded-lg hover:bg-red-50/20 border border-slate-150 transition-all cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleRecipient(formattedName)}
                            className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                          />
                          <div className="text-[10.5px] leading-snug">
                            <span className="font-bold text-slate-700 block">{p.name}</span>
                            <span className="text-[9px] text-slate-500 block">{p.role}</span>
                          </div>
                        </label>
                      );
                    })}

                    {/* Empty search results state */}
                    {(panitia || []).filter(p => 
                      p.name.toLowerCase().includes(panitiaSearchTerm.toLowerCase()) || 
                      p.role.toLowerCase().includes(panitiaSearchTerm.toLowerCase())
                    ).length === 0 && (
                      <div className="text-center py-6 text-[10px] text-slate-400">
                        {panitiaSearchTerm ? "Tidak ditemukan panitia..." : "Belum ada personil panitia."}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Kop Surat Customizer Section */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sesuaikan Kop Surat Resmi</label>
                <button
                  type="button"
                  onClick={() => setShowKopEditor(!showKopEditor)}
                  className="text-[10px] font-extrabold text-red-600 hover:text-red-700 underline focus:outline-none cursor-pointer"
                >
                  {showKopEditor ? "Sembunyikan Pengaturan" : "Ubah Kop Surat"}
                </button>
              </div>
              
              {showKopEditor && (
                <div className="space-y-3.5 p-4 bg-slate-50 rounded-xl border border-slate-200/60 animate-fade-in">
                  {/* Live Kop Surat Preview Panel */}
                  <div className="space-y-2 border-b border-slate-200/60 pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Pratinjau Langsung Kepala Surat (Kop)</span>
                      <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase">Live Preview</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs relative overflow-hidden">
                      {(() => {
                        const style = kopStyle || "classic-centered";
                        
                        const renderLogoPreview = (isRight = false) => {
                          if (logoStyle === 'none') return null;
                          return (
                            <div className="w-10 h-10 shrink-0">
                              <div className={`w-full h-full rounded-full border flex items-center justify-center bg-red-50 text-red-600 overflow-hidden ${
                                isRight ? "border-amber-400 text-amber-600 bg-amber-50" : "border-red-400 text-red-600 bg-red-50"
                              }`}>
                                {logoStyle === 'custom' && logoUrl ? (
                                  <img 
                                    src={logoUrl} 
                                    alt="Logo" 
                                    className="w-full h-full object-contain p-0.5"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      (e.target as any).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  (() => {
                                    const lstyle = isRight ? "star" : (logoStyle || "flag");
                                    if (lstyle === "mail") return <Mail className="w-5 h-5" />;
                                    if (lstyle === "trophy") return <Trophy className="w-5 h-5" />;
                                    if (lstyle === "award") return <Award className="w-5 h-5" />;
                                    if (lstyle === "star") return <Star className="w-5 h-5" />;
                                    if (lstyle === "shield") return <Shield className="w-5 h-5" />;
                                    if (lstyle === "heart") return <Heart className="w-5 h-5" />;
                                    return <Flag className="w-5 h-5" />;
                                  })()
                                )}
                              </div>
                            </div>
                          );
                        };

                        // 1. MODERN LEFT LAYOUT
                        if (style === "modern-left") {
                          return (
                            <div className="flex items-center gap-3 text-left">
                              {logoStyle !== 'none' && renderLogoPreview(false)}
                              <div className="space-y-0.5 flex-1 min-w-0">
                                <h2 className="text-[9px] font-bold uppercase tracking-wider text-red-600 truncate">
                                  {kopLine1 || "PANITIA PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81"}
                                </h2>
                                <h1 className="text-xs font-extrabold uppercase tracking-wide text-slate-800 leading-none truncate">
                                  {kopLine2 || "RUKUN WARGA 04 KELURAHAN NGABEAN"}
                                </h1>
                                <p className="text-[8.5px] text-slate-500 italic font-medium leading-tight truncate">
                                  {kopLine3 || "Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah"}
                                </p>
                                <p className="text-[8px] text-slate-400 tracking-wide leading-tight truncate">
                                  {kopLine4 || "Sekretariat: Balai RW 04 Ngabean, Telp: +62 812-3456-7890 | Kode Pos: 50141"}
                                </p>
                              </div>
                            </div>
                          );
                        }

                        // 2. BOLD BANNER LAYOUT
                        if (style === "bold-banner") {
                          return (
                            <div className="bg-red-700 text-white p-3 rounded-lg flex items-center gap-3 relative overflow-hidden">
                              {logoStyle !== 'none' && (
                                <div className="shrink-0 bg-white/10 p-1 rounded-lg">
                                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-red-700 overflow-hidden">
                                    {logoStyle === 'custom' && logoUrl ? (
                                      <img 
                                        src={logoUrl} 
                                        alt="Logo" 
                                        className="w-full h-full object-contain p-0.5"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      (() => {
                                        const lstyle = logoStyle || "flag";
                                        if (lstyle === "mail") return <Mail className="w-4 h-4 text-red-600" />;
                                        if (lstyle === "trophy") return <Trophy className="w-4 h-4 text-red-600" />;
                                        if (lstyle === "award") return <Award className="w-4 h-4 text-red-600" />;
                                        if (lstyle === "star") return <Star className="w-4 h-4 text-red-600" />;
                                        if (lstyle === "shield") return <Shield className="w-4 h-4 text-red-600" />;
                                        if (lstyle === "heart") return <Heart className="w-4 h-4 text-red-600" />;
                                        return <Flag className="w-4 h-4 text-red-600" />;
                                      })()
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              <div className="space-y-0.5 text-left flex-1 min-w-0">
                                <h2 className="text-[8px] font-bold uppercase tracking-widest text-red-100 truncate">
                                  {kopLine1 || "PANITIA PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81"}
                                </h2>
                                <h1 className="text-xs font-extrabold uppercase tracking-wide text-white leading-none truncate">
                                  {kopLine2 || "RUKUN WARGA 04 KELURAHAN NGABEAN"}
                                </h1>
                                <p className="text-[8.5px] text-red-50/90 italic font-medium leading-tight truncate">
                                  {kopLine3 || "Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah"}
                                </p>
                                <p className="text-[8px] text-red-100/80 tracking-wide leading-tight truncate">
                                  {kopLine4 || "Sekretariat: Balai RW 04 Ngabean, Telp: +62 812-3456-7890 | Kode Pos: 50141"}
                                </p>
                              </div>
                            </div>
                          );
                        }

                        // 3. ELEGANT BADGE LAYOUT
                        if (style === "elegant-badge") {
                          return (
                            <div className="text-center space-y-1 pb-1 border-b-2 border-double border-slate-800 border-t-4 border-red-600 pt-2 relative">
                              {logoStyle !== 'none' && (
                                <div className="absolute top-2 left-2">
                                  {renderLogoPreview(false)}
                                </div>
                              )}

                              <div className="px-10">
                                <h2 className="text-[9px] font-bold uppercase tracking-wider text-red-600 truncate">
                                  {kopLine1 || "PANITIA PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81"}
                                </h2>
                                <h1 className="text-xs font-extrabold uppercase tracking-wide text-slate-800 leading-none truncate">
                                  {kopLine2 || "RUKUN WARGA 04 KELURAHAN NGABEAN"}
                                </h1>
                                <p className="text-[8.5px] text-slate-500 italic font-medium truncate">
                                  {kopLine3 || "Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah"}
                                </p>
                                <p className="text-[8px] text-slate-400 tracking-wide truncate">
                                  {kopLine4 || "Sekretariat: Balai RW 04 Ngabean, Telp: +62 812-3456-7890 | Kode Pos: 50141"}
                                </p>
                              </div>
                            </div>
                          );
                        }

                        // 4. DOUBLE LOGO SYMMETRIC
                        if (style === "double-logo") {
                          return (
                            <div className="text-center space-y-1 pb-1 border-b-2 border-double border-slate-800 relative">
                              {logoStyle !== 'none' && (
                                <>
                                  <div className="absolute top-2 left-2">
                                    {renderLogoPreview(false)}
                                  </div>
                                  <div className="absolute top-2 right-2">
                                    {renderLogoPreview(true)}
                                  </div>
                                </>
                              )}

                              <div className="px-14">
                                <h2 className="text-[9px] font-bold uppercase tracking-wider text-red-600 truncate">
                                  {kopLine1 || "PANITIA PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81"}
                                </h2>
                                <h1 className="text-xs font-extrabold uppercase tracking-wide text-slate-800 leading-none truncate">
                                  {kopLine2 || "RUKUN WARGA 04 KELURAHAN NGABEAN"}
                                </h1>
                                <p className="text-[8.5px] text-slate-500 italic font-medium truncate">
                                  {kopLine3 || "Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah"}
                                </p>
                                <p className="text-[8px] text-slate-400 tracking-wide truncate">
                                  {kopLine4 || "Sekretariat: Balai RW 04 Ngabean, Telp: +62 812-3456-7890 | Kode Pos: 50141"}
                                </p>
                              </div>
                            </div>
                          );
                        }

                        // 5. STANDARD CLASSIC CENTERED
                        return (
                          <div className="text-center space-y-1 pb-1 border-b-2 border-double border-slate-800 relative">
                            {logoStyle !== 'none' && (
                              <div className="absolute top-2 left-2">
                                {renderLogoPreview(false)}
                              </div>
                            )}

                            <div className="px-10">
                              <h2 className="text-[9px] font-bold uppercase tracking-wider text-red-600 truncate">
                                {kopLine1 || "PANITIA PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81"}
                              </h2>
                              <h1 className="text-xs font-extrabold uppercase tracking-wide text-slate-800 leading-none truncate">
                                {kopLine2 || "RUKUN WARGA 04 KELURAHAN NGABEAN"}
                              </h1>
                              <p className="text-[8.5px] text-slate-500 italic font-medium truncate">
                                {kopLine3 || "Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah"}
                              </p>
                              <p className="text-[8px] text-slate-400 tracking-wide truncate">
                                {kopLine4 || "Sekretariat: Balai RW 04 Ngabean, Telp: +62 812-3456-7890 | Kode Pos: 50141"}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Baris 1 (Nama Organisasi / Panitia)</label>
                    <input
                      type="text"
                      value={kopLine1}
                      onChange={(e) => setKopLine1(e.target.value)}
                      className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2 bg-white"
                      placeholder="Contoh: PANITIA PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Baris 2 (Nama Wilayah / Lembaga)</label>
                    <input
                      type="text"
                      value={kopLine2}
                      onChange={(e) => setKopLine2(e.target.value)}
                      className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2 bg-white"
                      placeholder="Contoh: RUKUN WARGA 04 KELURAHAN NGABEAN"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Baris 3 (Alamat / Kota)</label>
                    <input
                      type="text"
                      value={kopLine3}
                      onChange={(e) => setKopLine3(e.target.value)}
                      className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2 bg-white"
                      placeholder="Contoh: Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Baris 4 (Kontak / Kode Pos)</label>
                    <input
                      type="text"
                      value={kopLine4}
                      onChange={(e) => setKopLine4(e.target.value)}
                      className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2 bg-white"
                      placeholder="Contoh: Sekretariat: Balai RW 04 Ngabean, Telp: +62 812-3456-7890 | Kode Pos: 50141"
                    />
                  </div>

                  {/* Kop Style Layout Selection */}
                  <div className="space-y-2 border-t border-slate-200/60 pt-3">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">Desain Tata Letak Kop Surat</label>
                    <div className="grid grid-cols-1 gap-2.5">
                      {[
                        { 
                          id: "classic-centered", 
                          name: "Klasik Terpusat", 
                          desc: "Format standar, teks di tengah dengan garis ganda tebal tipis dibawah." 
                        },
                        { 
                          id: "modern-left", 
                          name: "Modern Rata Kiri", 
                          desc: "Teks rata kiri sejajar logo, menggunakan garis pembatas modern tipis." 
                        },
                        { 
                          id: "elegant-badge", 
                          name: "Aksen Merah Atas", 
                          desc: "Klasik dengan aksen pita merah tebal di bagian atas kepala surat." 
                        },
                        { 
                          id: "double-logo", 
                          name: "Simetris Logo Ganda", 
                          desc: "Dua logo di kiri dan kanan surat untuk kepanitiaan formal ganda." 
                        },
                        { 
                          id: "bold-banner", 
                          name: "Blok Banner Modern", 
                          desc: "Blok warna solid modern dengan teks kontras tinggi putih/terang." 
                        }
                      ].map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setKopStyle(item.id)}
                          className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            kopStyle === item.id
                              ? "bg-red-50/70 border-red-500 text-red-900 shadow-3xs"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <div className={`w-3.5 h-3.5 rounded-full border-3 flex items-center justify-center ${
                              kopStyle === item.id ? "border-red-600 bg-red-600" : "border-slate-300 bg-white"
                            }`} />
                            <span className="text-xs font-bold leading-tight">{item.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 leading-normal pl-5">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logo Style Selection */}
                  <div className="space-y-2 border-t border-slate-200/60 pt-3">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">Logo / Lambang Kop Surat</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {[
                        { id: "flag", name: "Bendera", icon: Flag },
                        { id: "mail", name: "Surat", icon: Mail },
                        { id: "trophy", name: "Piala", icon: Trophy },
                        { id: "award", name: "Award", icon: Award },
                        { id: "star", name: "Bintang", icon: Star },
                        { id: "shield", name: "Perisai", icon: Shield },
                        { id: "heart", name: "Hati", icon: Heart },
                        { id: "custom", name: "Gambar URL", icon: ImageIcon },
                        { id: "none", name: "Tanpa Logo", icon: AlertTriangle }
                      ].map(item => {
                        const IconComponent = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setLogoStyle(item.id)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                              logoStyle === item.id
                                ? "bg-red-50 border-red-500 text-red-600 font-bold"
                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                            }`}
                          >
                            <IconComponent className="w-4 h-4 mb-1" />
                            <span className="text-[8.5px] leading-none">{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Drag and Drop File Upload / Custom Logo Inputs */}
                  <div className="space-y-2.5 border-t border-slate-200/60 pt-3">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">Sumber Logo Kustom</label>
                    
                    <div className="flex flex-col md:flex-row gap-3">
                      {/* Upload Box */}
                      <div className="flex-1 border-2 border-dashed border-slate-200 hover:border-red-500 rounded-xl p-3.5 bg-white transition-all text-center flex flex-col items-center justify-center cursor-pointer relative group min-h-[90px]">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setLogoUrl(event.target.result as string);
                                  setLogoStyle("custom");
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-red-500 mb-1 transition-colors" />
                        <span className="text-[10.5px] font-bold text-slate-700">Unggah File Gambar</span>
                        <span className="text-[8.5px] text-slate-400">Pilih atau seret logo Anda</span>
                      </div>

                      {/* Active Custom Logo Indicator */}
                      {logoUrl && (
                        <div className="flex flex-col items-center justify-center p-2.5 bg-red-50/50 rounded-xl border border-red-100 min-w-[110px] text-center animate-fade-in">
                          <span className="text-[8px] font-bold text-red-500 uppercase tracking-wider mb-1">Logo Saat Ini</span>
                          <div className="w-10 h-10 bg-white rounded-lg border border-slate-100 p-1 flex items-center justify-center overflow-hidden shadow-2xs">
                            <img 
                              src={logoUrl} 
                              alt="Logo" 
                              className="w-full h-full object-contain" 
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as any).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&h=80&q=80";
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setLogoUrl("");
                              if (logoStyle === "custom") {
                                setLogoStyle("flag"); // Revert back to flag
                              }
                            }}
                            className="mt-1.5 text-[9px] text-red-600 hover:text-red-700 underline font-bold cursor-pointer"
                          >
                            Hapus Logo
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Atau masukkan Tautan Logo (URL)</label>
                        {logoUrl && logoStyle === 'custom' && (
                          <span className="text-[8px] text-emerald-600 font-bold">Kustom Aktif</span>
                        )}
                      </div>
                      <input
                        type="url"
                        value={logoUrl.startsWith("data:") ? "" : logoUrl}
                        onChange={(e) => {
                          setLogoUrl(e.target.value);
                          if (e.target.value) {
                            setLogoStyle("custom");
                          }
                        }}
                        className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2 bg-white"
                        placeholder="Masukkan URL logo (misal: https://domain.com/logo.png)..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tanda Tangan & Stempel Resmi selection */}
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Konfigurasi Penandatangan & Stempel Dokumen</label>
                  <p className="text-[9px] text-slate-400">Pilih tanda tangan peranan dan stempel resmi yang ingin dimunculkan dalam surat undangan ini.</p>
                </div>
                <span className="text-[9px] font-extrabold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider self-start sm:self-center">
                  VALIDASI OTOMATIS
                </span>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <label className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl hover:bg-slate-100/70 border border-slate-150 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showStempel}
                    onChange={(e) => setShowStempel(e.target.checked)}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <div className="text-left">
                    <span className="text-[10.5px] font-extrabold text-slate-700 block leading-none mb-0.5">Stempel Resmi</span>
                    <span className="text-[8px] text-slate-400 block leading-none">Bubuhkan stempel RW</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl hover:bg-slate-100/70 border border-slate-150 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showKetuaSignature}
                    onChange={(e) => setShowKetuaSignature(e.target.checked)}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <div className="text-left">
                    <span className="text-[10.5px] font-extrabold text-slate-700 block leading-none mb-0.5">1. Ketua</span>
                    <span className="text-[8px] text-slate-400 block leading-none">Tanda tangan Ketua</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl hover:bg-slate-100/70 border border-slate-150 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSekretarisSignature}
                    onChange={(e) => setShowSekretarisSignature(e.target.checked)}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <div className="text-left">
                    <span className="text-[10.5px] font-extrabold text-slate-700 block leading-none mb-0.5">2. Sekretaris</span>
                    <span className="text-[8px] text-slate-400 block leading-none">Tanda tangan Sekretaris</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl hover:bg-slate-100/70 border border-slate-150 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBendaharaSignature}
                    onChange={(e) => setShowBendaharaSignature(e.target.checked)}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <div className="text-left">
                    <span className="text-[10.5px] font-extrabold text-slate-700 block leading-none mb-0.5">3. Bendahara</span>
                    <span className="text-[8px] text-slate-400 block leading-none">Tanda tangan Bendahara</span>
                  </div>
                </label>
              </div>

              {/* Dynamic Signatory Inputs based on active checkboxes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Ketua Inputs */}
                {showKetuaSignature && (
                  <div className="space-y-2.5 p-3.5 bg-slate-50/50 rounded-xl border border-slate-150">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
                      <span className="text-[9px] font-extrabold text-slate-600 uppercase tracking-wider">1. Ketua Panitia</span>
                      {settings?.signatureKetuaUrl && <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider">Tanda Tangan Tersedia</span>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Nama Lengkap</label>
                      <input
                        type="text"
                        placeholder="Nama Ketua Panitia"
                        value={signatoryName}
                        onChange={(e) => setSignatoryName(e.target.value)}
                        className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-2.5 py-1.5 bg-white"
                        required={showKetuaSignature}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Jabatan Dokumen</label>
                      <input
                        type="text"
                        placeholder="Jabatan (Ketua Panitia)"
                        value={signatoryRole}
                        onChange={(e) => setSignatoryRole(e.target.value)}
                        className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-2.5 py-1.5 bg-white"
                        required={showKetuaSignature}
                      />
                    </div>
                  </div>
                )}

                {/* Sekretaris Inputs */}
                {showSekretarisSignature && (
                  <div className="space-y-2.5 p-3.5 bg-slate-50/50 rounded-xl border border-slate-150">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
                      <span className="text-[9px] font-extrabold text-slate-600 uppercase tracking-wider">2. Sekretaris Panitia</span>
                      {settings?.signatureSekretarisUrl && <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider">Tanda Tangan Tersedia</span>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Nama Lengkap</label>
                      <input
                        type="text"
                        placeholder="Nama Sekretaris Panitia"
                        value={signatoryName2}
                        onChange={(e) => setSignatoryName2(e.target.value)}
                        className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-2.5 py-1.5 bg-white"
                        required={showSekretarisSignature}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Jabatan Dokumen</label>
                      <input
                        type="text"
                        placeholder="Jabatan (Sekretaris Panitia)"
                        value={signatoryRole2}
                        onChange={(e) => setSignatoryRole2(e.target.value)}
                        className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-2.5 py-1.5 bg-white"
                        required={showSekretarisSignature}
                      />
                    </div>
                  </div>
                )}

                {/* Bendahara Inputs */}
                {showBendaharaSignature && (
                  <div className="space-y-2.5 p-3.5 bg-slate-50/50 rounded-xl border border-slate-150">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
                      <span className="text-[9px] font-extrabold text-slate-600 uppercase tracking-wider">3. Bendahara Panitia</span>
                      {settings?.signatureBendaharaUrl && <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider">Tanda Tangan Tersedia</span>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Nama Lengkap</label>
                      <input
                        type="text"
                        placeholder="Nama Bendahara Panitia"
                        value={signatoryName3}
                        onChange={(e) => setSignatoryName3(e.target.value)}
                        className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-2.5 py-1.5 bg-white"
                        required={showBendaharaSignature}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Jabatan Dokumen</label>
                      <input
                        type="text"
                        placeholder="Jabatan (Bendahara Panitia)"
                        value={signatoryRole3}
                        onChange={(e) => setSignatoryRole3(e.target.value)}
                        className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-2.5 py-1.5 bg-white"
                        required={showBendaharaSignature}
                      />
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="border-t border-slate-100 pt-4 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Kembali ke Daftar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Simpan & Rekap Manual
              </button>
            </div>
          </div>

          {/* Form right AI Drafting Panel */}
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-2xl border border-indigo-800 p-6 text-white shadow-md space-y-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-300">Asisten Draf AI Gemini</h3>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Ketik instruksi atau pilih agenda rapat panitia. AI akan merumuskan draf surat dinas yang sangat rapi, berwibawa, dan lengkap dengan KOP resmi.
              </p>

              <div className="space-y-4 pt-2 text-xs font-sans">
                {/* Template Preset Selector */}
                <div className="space-y-1.5 text-slate-300">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pilih Template Agenda Rapat</label>
                  <select
                    value={aiTemplate}
                    onChange={(e) => setAiTemplate(e.target.value)}
                    className="w-full text-xs border border-indigo-700 focus:border-indigo-400 focus:outline-none rounded-lg px-3 py-2 bg-slate-800 text-white"
                  >
                    <option value="koordinasi_lomba">Rapat Koordinasi Teknis Lomba</option>
                    <option value="pleno_anggaran">Rapat Pleno I Rencana Anggaran (RKBA)</option>
                    <option value="evaluasi_malam_tirakatan">Rapat Evaluasi Malam Tirakatan & Pentas Seni</option>
                  </select>
                </div>

                {/* Event reference dropdown */}
                <div className="space-y-1.5 text-slate-300">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sandingkan dengan Jadwal Kegiatan</label>
                  <select
                    onChange={(e) => {
                      const selected = kegiatan.find(k => k.id === e.target.value);
                      if (selected) {
                        setDate(selected.date);
                        setTime(selected.time);
                        setLocation(selected.location);
                        setSubject(`Undangan Rapat Persiapan: ${selected.name}`);
                      }
                    }}
                    className="w-full text-xs border border-indigo-700 focus:border-indigo-400 focus:outline-none rounded-lg px-3 py-2 bg-slate-800 text-white"
                  >
                    <option value="">-- Pilih Jadwal HUT RI --</option>
                    {kegiatan.map(k => (
                      <option key={k.id} value={k.id}>{k.name} ({k.date})</option>
                    ))}
                  </select>
                </div>

                {/* Instruction textbox */}
                <div className="space-y-1.5 text-slate-300">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Instruksi Kustom Tambahan AI (Opsional)</label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Sampaikan ke peserta rapat agar membawa rincian anggaran belanja seksi masing-masing."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full text-xs border border-indigo-700 focus:border-indigo-400 focus:outline-none rounded-lg p-2.5 bg-slate-800 text-white leading-relaxed resize-none"
                  />
                </div>

                {/* Gemini AI Trigger Button */}
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Cpu className="w-4 h-4 animate-pulse" />
                  {isGenerating ? "Menyusun Surat..." : "Tulis Surat Resmi dengan AI"}
                </button>
              </div>
            </div>

            {/* AI Console Logger */}
            {showConsole && (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 font-mono text-[10px] text-slate-300 space-y-2.5 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="font-semibold text-slate-400">PROSES DRAF SURAT AI</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowConsole(false)} 
                    className="text-slate-500 hover:text-slate-300"
                  >
                    Tutup Log
                  </button>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto leading-relaxed">
                  {consoleSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className={step.status === 'success' ? "text-emerald-500" : "text-amber-500"}>
                        {step.status === 'success' ? "✔" : "⚡"}
                      </span>
                      <span>{step.msg}</span>
                    </div>
                  ))}
                  {isGenerating && (
                    <div className="flex items-center gap-1 text-slate-500 italic pl-5">
                      <span>Proses berlanjut...</span>
                      <span className="animate-ping">.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </form>
      )}

      {viewMode === "view" && selectedUndangan && (
        <div className="space-y-6">
          
          {/* Top view actions */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
            <button
              onClick={() => setViewMode("list")}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Daftar
            </button>

            {/* Paper themes */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {(["classic", "minimal", "creamy", "royal"] as const).map(theme => (
                <button
                  key={theme}
                  onClick={() => setPaperTheme(theme)}
                  className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded transition-all cursor-pointer ${
                    paperTheme === theme 
                      ? "bg-white text-slate-800 shadow-2xs font-extrabold" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>

            {/* Action Group */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                title="Salin Isi Surat"
              >
                {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Clipboard className="w-4 h-4" />}
                {copiedText ? "Tersalin!" : "Salin Teks"}
              </button>
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                title="Cetak Surat Undangan"
              >
                <Printer className="w-4 h-4" />
                Cetak
              </button>
              <button
                onClick={handlePDFExport}
                disabled={isExportingPDF}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-2xs disabled:opacity-55"
                title="Ekspor PDF Resmi"
              >
                <Download className="w-4 h-4" />
                {isExportingPDF ? "Mengekspor..." : "Unduh PDF"}
              </button>
              <button
                onClick={handleDOCExport}
                disabled={isExportingDOC}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-2xs disabled:opacity-55"
                title="Ekspor Microsoft Word (.doc) Resmi"
              >
                <FileText className="w-4 h-4" />
                {isExportingDOC ? "Mengekspor..." : "Unduh Word"}
              </button>
            </div>
          </div>

          {/* Core Official A4 Letter Display Sheet */}
          <div className="bg-slate-100 p-1 sm:p-6 rounded-2xl flex justify-center no-print shadow-inner overflow-x-auto">
            <div 
              id="undangan-render-area"
              className={`w-[794px] min-h-[1123px] bg-white p-12 shadow-2xl font-serif text-sm relative shrink-0 leading-relaxed border transition-all duration-300 ${
                paperTheme === 'creamy' ? 'bg-[#FAF6EE] text-[#423D33] border-[#EADFC9]' :
                paperTheme === 'royal' ? 'bg-amber-50/50 text-slate-800 border-amber-200/50' :
                paperTheme === 'minimal' ? 'font-sans text-[#2C3E50] border-slate-100 p-16' :
                'text-[#1E293B] border-slate-200'
              }`}
            >
              
              {/* Kop Surat (Header) for Classic Style */}
              {paperTheme !== 'minimal' && (() => {
                const isMaster = selectedUndangan.useMasterKop !== false;
                const kLine1 = isMaster ? (settings?.kopLine1 || "PANITIA PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81") : (selectedUndangan.kopLine1 || "PANITIA PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81");
                const kLine2 = isMaster ? (settings?.kopLine2 || "RUKUN WARGA 04 KELURAHAN NGABEAN") : (selectedUndangan.kopLine2 || "RUKUN WARGA 04 KELURAHAN NGABEAN");
                const kLine3 = isMaster ? (settings?.kopLine3 || "Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah") : (selectedUndangan.kopLine3 || "Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah");
                const kLine4 = isMaster ? (settings?.kopLine4 || "Sekretariat: Balai RW 04 Ngabean, Telp: +62 812-3456-7890 | Kode Pos: 50141") : (selectedUndangan.kopLine4 || "Sekretariat: Balai RW 04 Ngabean, Telp: +62 812-3456-7890 | Kode Pos: 50141");
                const kLogoStyle = isMaster ? (settings?.logoStyle || "flag") : (selectedUndangan.logoStyle || "flag");
                const kLogoUrl = isMaster ? (settings?.logoUrl || "") : (selectedUndangan.logoUrl || "");
                const style = isMaster ? (settings?.kopStyle || "classic-centered") : (selectedUndangan.kopStyle || "classic-centered");
                
                const renderLogo = (isRight = false) => {
                  if (kLogoStyle === 'none') return null;
                  return (
                    <div className="w-16 h-16 opacity-95">
                      <div className={`w-full h-full rounded-full border-2 flex items-center justify-center bg-red-50 text-red-600 overflow-hidden ${
                        isRight ? "border-amber-600 text-amber-600 bg-amber-50" : "border-red-600 text-red-600 bg-red-50"
                      }`}>
                        {kLogoStyle === 'custom' && kLogoUrl ? (
                          <img 
                            src={kLogoUrl} 
                            alt="Logo Resmi" 
                            className="w-full h-full object-contain p-1"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as any).style.display = 'none';
                            }}
                          />
                        ) : (
                          (() => {
                            const lstyle = isRight ? "star" : (kLogoStyle || "flag");
                            if (lstyle === "mail") return <Mail className="w-7 h-7" />;
                            if (lstyle === "trophy") return <Trophy className="w-7 h-7" />;
                            if (lstyle === "award") return <Award className="w-7 h-7" />;
                            if (lstyle === "star") return <Star className="w-7 h-7" />;
                            if (lstyle === "shield") return <Shield className="w-7 h-7" />;
                            if (lstyle === "heart") return <Heart className="w-7 h-7" />;
                            return <Flag className="w-7 h-7" />;
                          })()
                        )}
                      </div>
                    </div>
                  );
                };

                // 1. MODERN LEFT LAYOUT
                if (style === "modern-left") {
                  return (
                    <div className="flex items-center gap-6 border-b-2 border-slate-400 pb-5 mb-6 text-left">
                      {kLogoStyle !== 'none' && (
                        <div className="shrink-0">
                          {renderLogo(false)}
                        </div>
                      )}
                      <div className="space-y-1 flex-1">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-red-600">
                          {kLine1}
                        </h2>
                        <h1 className="text-base font-extrabold uppercase tracking-wide text-slate-800 leading-none">
                          {kLine2}
                        </h1>
                        <p className="text-[10.5px] font-sans text-slate-500 italic font-medium leading-tight">
                          {kLine3}
                        </p>
                        <p className="text-[9.5px] font-sans text-slate-400 tracking-wide leading-tight">
                          {kLine4}
                        </p>
                      </div>
                    </div>
                  );
                }

                // 2. BOLD BANNER LAYOUT
                if (style === "bold-banner") {
                  return (
                    <div className="bg-red-700 text-white p-5 rounded-xl mb-6 flex items-center gap-5 relative overflow-hidden shadow-sm">
                      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full pointer-events-none transform scale-150 rotate-45" />
                      
                      {kLogoStyle !== 'none' && (
                        <div className="shrink-0 bg-white/10 p-2 rounded-xl">
                          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-red-700 overflow-hidden">
                            {kLogoStyle === 'custom' && kLogoUrl ? (
                              <img 
                                src={kLogoUrl} 
                                alt="Logo Resmi" 
                                className="w-full h-full object-contain p-1"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as any).style.display = 'none';
                                }}
                              />
                            ) : (
                              (() => {
                                const lstyle = kLogoStyle || "flag";
                                if (lstyle === "mail") return <Mail className="w-6 h-6 text-red-600" />;
                                if (lstyle === "trophy") return <Trophy className="w-6 h-6 text-red-600" />;
                                if (lstyle === "award") return <Award className="w-6 h-6 text-red-600" />;
                                if (lstyle === "star") return <Star className="w-6 h-6 text-red-600" />;
                                if (lstyle === "shield") return <Shield className="w-6 h-6 text-red-600" />;
                                if (lstyle === "heart") return <Heart className="w-6 h-6 text-red-600" />;
                                return <Flag className="w-6 h-6 text-red-600" />;
                              })()
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-0.5 text-left flex-1">
                        <h2 className="text-[11px] font-bold uppercase tracking-widest text-red-100">
                          {kLine1}
                        </h2>
                        <h1 className="text-base font-extrabold uppercase tracking-wide text-white leading-none">
                          {kLine2}
                        </h1>
                        <p className="text-[10px] font-sans text-red-50/90 italic font-medium leading-tight">
                          {kLine3}
                        </p>
                        <p className="text-[9px] font-sans text-red-100/80 tracking-wide leading-tight">
                          {kLine4}
                        </p>
                      </div>
                    </div>
                  );
                }

                // 3. ELEGANT BADGE LAYOUT
                if (style === "elegant-badge") {
                  return (
                    <div className="text-center space-y-1.5 border-b-4 border-double border-slate-800 pb-5 mb-6 border-t-8 border-red-600 pt-5 relative">
                      {kLogoStyle !== 'none' && (
                        <div className="absolute top-8 left-10 w-16 h-16 opacity-90 hidden sm:block">
                          {renderLogo(false)}
                        </div>
                      )}

                      <h2 className="text-sm font-bold uppercase tracking-wider text-red-600">
                        {kLine1}
                      </h2>
                      <h1 className="text-lg font-extrabold uppercase tracking-wide text-slate-800 leading-none">
                        {kLine2}
                      </h1>
                      <p className="text-[11px] font-sans text-slate-500 italic font-medium">
                        {kLine3}
                      </p>
                      <p className="text-[10px] font-sans text-slate-400 tracking-wide">
                        {kLine4}
                      </p>
                    </div>
                  );
                }

                // 4. DOUBLE LOGO SYMMETRIC
                if (style === "double-logo") {
                  return (
                    <div className="text-center space-y-1.5 border-b-4 border-double border-slate-800 pb-5 mb-6 relative">
                      {kLogoStyle !== 'none' && (
                        <>
                          <div className="absolute top-10 left-10 w-16 h-16 opacity-90 hidden sm:block">
                            {renderLogo(false)}
                          </div>
                          <div className="absolute top-10 right-10 w-16 h-16 opacity-90 hidden sm:block">
                            {renderLogo(true)}
                          </div>
                        </>
                      )}

                      <div className="px-24">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-red-600">
                          {kLine1}
                        </h2>
                        <h1 className="text-lg font-extrabold uppercase tracking-wide text-slate-800 leading-none">
                          {kLine2}
                        </h1>
                        <p className="text-[11px] font-sans text-slate-500 italic font-medium">
                          {kLine3}
                        </p>
                        <p className="text-[10px] font-sans text-slate-400 tracking-wide">
                          {kLine4}
                        </p>
                      </div>
                    </div>
                  );
                }

                // 5. STANDARD CLASSIC CENTERED
                return (
                  <div className="text-center space-y-1.5 border-b-4 border-double border-slate-800 pb-5 mb-6 relative">
                    {kLogoStyle !== 'none' && (
                      <div className="absolute top-10 left-10 w-16 h-16 opacity-90 hidden sm:block">
                        {renderLogo(false)}
                      </div>
                    )}

                    <h2 className="text-sm font-bold uppercase tracking-wider text-red-600">
                      {kLine1}
                    </h2>
                    <h1 className="text-lg font-extrabold uppercase tracking-wide text-slate-800 leading-none">
                      {kLine2}
                    </h1>
                    <p className="text-[11px] font-sans text-slate-500 italic font-medium">
                      {kLine3}
                    </p>
                    <p className="text-[10px] font-sans text-slate-400 tracking-wide">
                      {kLine4}
                    </p>
                  </div>
                );
              })()}

              {/* Document Content */}
              <div className="space-y-6 font-sans text-xs sm:text-sm leading-relaxed px-2">
                <ReactMarkdown>
                  {(() => {
                    const md = selectedUndangan.contentMarkdown || "";
                    const keywords = ["**Hormat Kami,**", "Hormat Kami,", "Hormat kami,", "**Hormat kami,**"];
                    for (const kw of keywords) {
                      const idx = md.indexOf(kw);
                      if (idx !== -1) {
                        return md.substring(0, idx).trim();
                      }
                    }
                    return md;
                  })()}
                </ReactMarkdown>

                {/* Beautiful Real Signature & Stamp Overlay Block */}
                <div className="mt-12 space-y-3 select-none border-t border-slate-100 pt-6">
                  <p className="font-bold text-slate-800 text-xs sm:text-sm">Hormat Kami,</p>
                  
                  <div className={`relative grid gap-6 pt-3 text-center text-xs sm:text-sm ${
                    (() => {
                      let count = 0;
                      if (selectedUndangan.showKetuaSignature !== false) count++;
                      if (selectedUndangan.showSekretarisSignature !== false) count++;
                      if (selectedUndangan.showBendaharaSignature === true) count++;
                      
                      if (count === 1) return "grid-cols-1 max-w-xs mx-auto";
                      if (count === 2) return "grid-cols-2 max-w-xl mx-auto";
                      return "grid-cols-3";
                    })()
                  }`}>
                    
                    {/* 1. Ketua Section */}
                    {selectedUndangan.showKetuaSignature !== false && (
                      <div className="flex flex-col items-center justify-between min-h-[110px] relative">
                        <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[9.5px] block">
                          {selectedUndangan.signatoryRole || "Ketua Panitia"}
                        </span>
                        
                        {/* Signature Image */}
                        <div className="h-14 flex items-center justify-center relative w-full my-1">
                          {settings?.signatureKetuaUrl ? (
                            <img 
                              src={settings.signatureKetuaUrl} 
                              alt="Tanda Tangan Ketua" 
                              className="max-h-full max-w-[110px] object-contain mix-blend-multiply" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-8"></div>
                          )}
                        </div>
                        
                        <span className="font-extrabold text-slate-800 border-b border-slate-800 pb-0.5 px-3 inline-block leading-none">
                          {selectedUndangan.signatoryName || settings?.signatureKetuaName || "Fx. Mawardi"}
                        </span>
                      </div>
                    )}

                    {/* 2. Sekretaris Section */}
                    {selectedUndangan.showSekretarisSignature !== false && (
                      <div className="flex flex-col items-center justify-between min-h-[110px] relative">
                        <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[9.5px] block">
                          {selectedUndangan.signatoryRole2 || "Sekretaris Panitia"}
                        </span>
                        
                        {/* Signature Image */}
                        <div className="h-14 flex items-center justify-center relative w-full my-1">
                          {settings?.signatureSekretarisUrl ? (
                            <img 
                              src={settings.signatureSekretarisUrl} 
                              alt="Tanda Tangan Sekretaris" 
                              className="max-h-full max-w-[110px] object-contain mix-blend-multiply" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-8"></div>
                          )}
                        </div>
                        
                        <span className="font-extrabold text-slate-800 border-b border-slate-800 pb-0.5 px-3 inline-block leading-none">
                          {selectedUndangan.signatoryName2 || settings?.signatureSekretarisName || "Tri Setiawan"}
                        </span>
                      </div>
                    )}

                    {/* 3. Bendahara Section */}
                    {selectedUndangan.showBendaharaSignature === true && (
                      <div className="flex flex-col items-center justify-between min-h-[110px] relative">
                        <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[9.5px] block">
                          {selectedUndangan.signatoryRole3 || "Bendahara Panitia"}
                        </span>
                        
                        {/* Signature Image */}
                        <div className="h-14 flex items-center justify-center relative w-full my-1">
                          {settings?.signatureBendaharaUrl ? (
                            <img 
                              src={settings.signatureBendaharaUrl} 
                              alt="Tanda Tangan Bendahara" 
                              className="max-h-full max-w-[110px] object-contain mix-blend-multiply" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-8"></div>
                          )}
                        </div>
                        
                        <span className="font-extrabold text-slate-800 border-b border-slate-800 pb-0.5 px-3 inline-block leading-none">
                          {selectedUndangan.signatoryName3 || settings?.signatureBendaharaName || "Heri Prasetyo"}
                        </span>
                      </div>
                    )}

                    {/* Overlapping Stamp (Stempel Resmi) */}
                    {selectedUndangan.showStempel !== false && settings?.stempelUrl && (
                      <div className="absolute top-1/2 left-[25%] -translate-y-1/2 -translate-x-1/2 w-24 h-24 pointer-events-none select-none z-10 rotate-12 opacity-85 mix-blend-multiply">
                        <img 
                          src={settings.stempelUrl} 
                          alt="Stempel Panitia" 
                          className="w-full h-full object-contain" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                  </div>
                </div>
              </div>

              {/* Official Seal Watermark (Decorative) */}
              <div className="absolute bottom-24 right-20 w-32 h-32 border-4 border-dashed border-red-500/10 rounded-full flex items-center justify-center text-red-500/15 uppercase font-bold text-[10px] tracking-widest rotate-12 select-none pointer-events-none">
                RW 04 Ngabean
              </div>

              {/* Bottom National Pride footer */}
              <div className="absolute bottom-6 left-12 right-12 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                Panitia HUT RI Ke-81 RW 04 Ngabean Semarang • Sistem Administrasi Surat Digital
              </div>
            </div>
          </div>

          {/* PDF Preview warning inside iframe */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 shadow-3xs text-xs text-amber-800 leading-relaxed no-print">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-extrabold uppercase tracking-wide">Tips Cetak & PDF:</strong> Untuk hasil cetak beresolusi tinggi yang rapi dalam 1 halaman penuh, pastikan Anda mengatur margin ke "None" atau "Default" dan aktifkan "Background graphics" pada menu dialog printer Anda.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
