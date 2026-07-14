import React, { useState, useEffect } from "react";
import { 
  FolderOpen, 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Eye, 
  Download, 
  ExternalLink, 
  Cpu, 
  File, 
  Clock, 
  Sparkles, 
  Share2, 
  CheckCircle2, 
  X, 
  Info,
  ChevronRight,
  Clipboard,
  Check,
  Image,
  Link2,
  FolderPlus,
  QrCode
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { DigitalDocument, Panitia } from "../types";

export interface DriveLink {
  id: string;
  title: string;
  division: string;
  url: string;
  description: string;
  bgColor: string;
}

interface DigitalDocumentsViewProps {
  documents: DigitalDocument[];
  panitia: Panitia[];
  onSaveDocument: (action: 'add' | 'edit' | 'delete', data: DigitalDocument) => Promise<void>;
}

export default function DigitalDocumentsView({ documents, panitia, onSaveDocument }: DigitalDocumentsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Semua");
  const [selectedDoc, setSelectedDoc] = useState<DigitalDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // New sub-tab state for Galeri and Drive
  const [activeSubTab, setActiveSubTab] = useState<'berkas' | 'galeri' | 'drive'>('berkas');

  // New states for Drive Links
  const [driveLinks, setDriveLinks] = useState<DriveLink[]>(() => {
    const saved = localStorage.getItem("sems_drive_links");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing drive links, using defaults.");
      }
    }
    return [
      {
        id: "drive_1",
        title: "Google Drive Utama RW 04 Ngabean",
        division: "Sekretariat & RW",
        url: "https://drive.google.com/drive/folders/1sems_master_rw04_ngabean",
        description: "Pusat penyimpanan utama seluruh berkas administrasi, template surat, LPJ final, dan rekapitulasi data kepanitiaan.",
        bgColor: "from-blue-500/10 to-blue-600/10 text-blue-700 border-blue-100"
      },
      {
        id: "drive_2",
        title: "Folder Foto & Media Dokumentasi HUT 81",
        division: "Seksi Pubdekdok",
        url: "https://drive.google.com/drive/folders/1sems_dokumentasi_foto_hut81",
        description: "Folder unggahan foto resolusi tinggi dari setiap kegiatan rapat kerja, kerja bakti lingkungan, perlombaan RT, malam tirakatan, hingga panggung pentas seni.",
        bgColor: "from-purple-500/10 to-purple-600/10 text-purple-700 border-purple-100"
      },
      {
        id: "drive_3",
        title: "Folder Laporan Keuangan & Nota Belanja",
        division: "Bendahara",
        url: "https://drive.google.com/drive/folders/1sems_keuangan_nota_belanja",
        description: "Arsip scan nota belanja seksi, kuitansi keluar, bukti transfer donatur, draf anggaran belanja seksi, dan laporan arus kas panitia.",
        bgColor: "from-emerald-500/10 to-emerald-600/10 text-emerald-700 border-emerald-100"
      },
      {
        id: "drive_4",
        title: "Folder Proposal & Administrasi Undangan",
        division: "Sekretaris",
        url: "https://drive.google.com/drive/folders/1sems_surat_proposal_81",
        description: "Penyimpanan draf surat keluar resmi, surat pengantar iuran, surat permohonan izin keramaian, draf proposal sponsor, dan proposal kemitraan.",
        bgColor: "from-amber-500/10 to-amber-600/10 text-amber-700 border-amber-100"
      },
      {
        id: "drive_5",
        title: "Folder Desain Publikasi, Spanduk & Kaos",
        division: "Seksi Publikasi & Humas",
        url: "https://drive.google.com/drive/folders/1sems_desain_publikasi_media",
        description: "Penyimpanan master file desain banner panggung kemerdekaan, pamflet lomba digital, baliho selamat datang, dan desain kaos panitia.",
        bgColor: "from-rose-500/10 to-rose-600/10 text-rose-700 border-rose-100"
      }
    ];
  });

  // State to manage Drive Link Forms
  const [isDriveFormOpen, setIsDriveFormOpen] = useState(false);
  const [driveId, setDriveId] = useState("");
  const [driveTitle, setDriveTitle] = useState("");
  const [driveDivision, setDriveDivision] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [driveDescription, setDriveDescription] = useState("");

  useEffect(() => {
    localStorage.setItem("sems_drive_links", JSON.stringify(driveLinks));
  }, [driveLinks]);

  // Form states
  const [docId, setDocId] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState<DigitalDocument['category']>("Surat");
  const [docDescription, setDocDescription] = useState("");
  const [docFileUrl, setDocFileUrl] = useState("");
  const [docFileName, setDocFileName] = useState("");
  const [docFileSize, setDocFileSize] = useState("");
  const [docFileType, setDocFileType] = useState("application/pdf");
  const [docUploadedBy, setDocUploadedBy] = useState("Sekretariat");
  const [docNotes, setDocNotes] = useState("");

  // AI Assistant states
  const [aiTitle, setAiTitle] = useState("");
  const [aiCategory, setAiCategory] = useState<DigitalDocument['category']>("Surat");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Default sample documents to show if none are stored in DB
  const sampleDocs: DigitalDocument[] = [
    {
      id: "doc_seed_1",
      title: "SK Susunan Panitia HUT RI Ke-81 RW 04 Ngabean",
      category: "SK Panitia",
      description: "Surat Keputusan Resmi dari Ketua RW 04 Kelurahan Gunungpati mengenai susunan lengkap organisasi panitia pelaksana kemerdekaan.",
      fileUrl: "https://drive.google.com/file/d/1SEMS_SK_Panitia_RW04_XYZ/view?usp=sharing",
      fileName: "SK_Panitia_HUT_RI_81_RW04.pdf",
      fileSize: "1.4 MB",
      fileType: "application/pdf",
      uploadDate: "2026-07-01T10:00:00.000Z",
      uploadedBy: "Sekretaris",
      notes: "Dokumen fisik disimpan di lemari arsip Balai RW 04."
    },
    {
      id: "doc_seed_2",
      title: "Draf Proposal Sponsorship HUT RI Ke-81 Ngabean",
      category: "Proposal",
      description: "Draf proposal pengajuan dana sponsor utama, donatur korporat, dan kemitraan UMKM sekitar Kelurahan Gunungpati.",
      fileUrl: "https://drive.google.com/file/d/1SEMS_Proposal_Sponsor_RW04_ABC/view?usp=sharing",
      fileName: "Proposal_Sponsorship_Kemerdekaan_RI81_Ngabean.docx",
      fileSize: "3.2 MB",
      fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      uploadDate: "2026-07-03T14:30:00.000Z",
      uploadedBy: "Seksi Dana Usaha",
      notes: "Telah diajukan ke PT Sinar Murni dan BPR Gunungpati."
    },
    {
      id: "doc_seed_3",
      title: "Surat Edaran Iuran Warga Per RT 01-04 Ngabean",
      category: "Surat",
      description: "Surat pemberitahuan resmi dan permohonan iuran sukarela warga RW 04 Ngabean untuk membiayai perayaan kemerdekaan.",
      fileUrl: "https://drive.google.com/file/d/1SEMS_Surat_Edaran_Iuran_RW04/view?usp=sharing",
      fileName: "Surat_Edaran_Iuran_Warga_HUT_RI.pdf",
      fileSize: "850 KB",
      fileType: "application/pdf",
      uploadDate: "2026-07-04T08:15:00.000Z",
      uploadedBy: "Humas",
      notes: "Telah dicetak dan didistribusikan ke masing-masing Ketua RT 01 s.d. RT 04."
    },
    {
      id: "doc_seed_4",
      title: "Kuitansi Belanja Panggung Pentas Seni & Perlengkapan",
      category: "Kuitansi",
      description: "Arsip digital bukti pembayaran sewa panggung utama, sound system, terpal, lampu dekorasi kemerdekaan.",
      fileUrl: "https://drive.google.com/file/d/1SEMS_Nota_Panggung_Pentas_Seni/view?usp=sharing",
      fileName: "Kuitansi_Sewa_Panggung_Sound.jpg",
      fileSize: "2.1 MB",
      fileType: "image/jpeg",
      uploadDate: "2026-07-08T16:45:00.000Z",
      uploadedBy: "Perlengkapan",
      notes: "Realisasi pembayaran penuh dari anggaran kas seksi perlengkapan."
    },
    {
      id: "doc_seed_5",
      title: "Formulir Pendaftaran Lomba Kemerdekaan 2026",
      category: "Lainnya",
      description: "Lembar formulir pendaftaran peserta berbagai jenis lomba (tarik tambang, balap karung helm, futsal daster, panjat pinang).",
      fileUrl: "https://drive.google.com/file/d/1SEMS_Form_Lomba_Kemerdekaan/view?usp=sharing",
      fileName: "Formulir_Pendaftaran_Lomba_HUT_RI81.xlsx",
      fileSize: "180 KB",
      fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      uploadDate: "2026-07-05T11:20:00.000Z",
      uploadedBy: "Seksi Lomba",
      notes: "Diisi oleh perwakilan tiap tim RT."
    },
    {
      id: "doc_seed_6",
      title: "Foto Kerja Bakti Pemasangan Umbul-Umbul RW 04",
      category: "Dokumentasi",
      description: "Dokumentasi foto antusiasme warga RT 02 Ngabean bergotong-royong memasang bendera merah putih, lampu hias, dan gapura bambu dalam menyambut bulan kemerdekaan.",
      fileUrl: "https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80",
      fileName: "Kerja_Bakti_Pasang_Umbul.jpg",
      fileSize: "1.7 MB",
      fileType: "image/jpeg",
      uploadDate: "2026-07-02T09:30:00.000Z",
      uploadedBy: "Seksi Humas",
      notes: "Foto resmi panitia untuk dipajang di LPJ. Lokasi gerbang utama RT 02."
    },
    {
      id: "doc_seed_7",
      title: "Foto Rapat Koordinasi Panitia Ke-2 di Balai RW",
      category: "Dokumentasi",
      description: "Dokumentasi foto jalannya rapat koordinasi kepanitiaan pleno kedua yang membahas pemetaan anggaran final dan mekanisme penyerahan kupon iuran warga.",
      fileUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
      fileName: "Rapat_Panitia_2_Balai_RW.jpg",
      fileSize: "2.4 MB",
      fileType: "image/jpeg",
      uploadDate: "2026-07-04T20:00:00.000Z",
      uploadedBy: "Seksi Dokumentasi",
      notes: "Dihadiri Ketua Panitia (Ahmad Rifqi) dan Sekretaris RW."
    },
    {
      id: "doc_seed_8",
      title: "Foto Survei Lapangan & Area Panggung Utama",
      category: "Dokumentasi",
      description: "Survei teknis lokasi pemasangan panggung pentas seni dan perlengkapan sound system utama di lapangan serbaguna RW 04 Ngabean agar aman dari jalur kabel tegangan tinggi.",
      fileUrl: "https://images.unsplash.com/photo-1505232458627-41db7a8927ac?auto=format&fit=crop&w=800&q=80",
      fileName: "Survei_Area_Panggung_Seni.jpg",
      fileSize: "1.9 MB",
      fileType: "image/jpeg",
      uploadDate: "2026-07-06T14:20:00.000Z",
      uploadedBy: "Perlengkapan",
      notes: "Diputuskan panggung menghadap ke barat dengan sirkulasi penonton optimal."
    }
  ];

  // Combine DB documents with default sample ones if no user documents exist
  const activeDocs = documents.length > 0 ? documents : sampleDocs;

  // Sync / create sample documents on DB if DB is completely empty (proactive sync)
  useEffect(() => {
    if (documents.length === 0) {
      const initSamples = async () => {
        for (const sample of sampleDocs) {
          await onSaveDocument('add', sample);
        }
      };
      initSamples().catch(e => console.error("Error seeding sample docs:", e));
    }
  }, [documents]);

  const categories = ["Semua", "Surat", "Proposal", "Kuitansi", "SK Panitia", "Dokumentasi", "Lainnya"];

  const filteredDocs = activeDocs.filter(doc => {
    const matchesCategory = activeCategory === "Semua" || doc.category === activeCategory;
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "text-red-500 bg-red-50";
    if (fileType.includes("sheet") || fileType.includes("excel") || fileType.includes("xls")) return "text-emerald-600 bg-emerald-50";
    if (fileType.includes("word") || fileType.includes("doc")) return "text-blue-500 bg-blue-50";
    if (fileType.includes("image") || fileType.includes("png") || fileType.includes("jpg")) return "text-amber-500 bg-amber-50";
    return "text-slate-500 bg-slate-50";
  };

  const handleOpenPreview = (doc: DigitalDocument) => {
    setSelectedDoc(doc);
    setIsPreviewOpen(true);
  };

  const handleOpenForm = (doc?: DigitalDocument) => {
    if (doc) {
      setDocId(doc.id);
      setDocTitle(doc.title);
      setDocCategory(doc.category);
      setDocDescription(doc.description);
      setDocFileUrl(doc.fileUrl || "");
      setDocFileName(doc.fileName);
      setDocFileSize(doc.fileSize || "1.0 MB");
      setDocFileType(doc.fileType);
      setDocUploadedBy(doc.uploadedBy);
      setDocNotes(doc.notes || "");
    } else {
      setDocId("");
      setDocTitle("");
      setDocCategory("Surat");
      setDocDescription("");
      setDocFileUrl("");
      setDocFileName("");
      setDocFileSize("1.2 MB");
      setDocFileType("application/pdf");
      setDocUploadedBy("Sekretariat");
      setDocNotes("");
    }
    setIsFormOpen(true);
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docFileName.trim()) {
      alert("Judul dokumen dan nama file wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    const data: DigitalDocument = {
      id: docId || 'doc_' + Date.now(),
      title: docTitle,
      category: docCategory,
      description: docDescription,
      fileUrl: docFileUrl || "https://drive.google.com/drive/my-drive",
      fileName: docFileName,
      fileSize: docFileSize || "1.0 MB",
      fileType: docFileType,
      uploadDate: new Date().toISOString(),
      uploadedBy: docUploadedBy,
      notes: docNotes
    };

    try {
      await onSaveDocument(docId ? 'edit' : 'add', data);
      setIsFormOpen(false);
    } catch (err: any) {
      alert("Gagal menyimpan dokumen: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (doc: DigitalDocument) => {
    if (confirm(`Apakah Anda yakin ingin menghapus dokumen "${doc.title}"?`)) {
      try {
        await onSaveDocument('delete', doc);
      } catch (err: any) {
        alert("Gagal menghapus dokumen: " + err.message);
      }
    }
  };

  // AI Assistant for Drafting Templates
  const handleGenerateAiTemplate = async () => {
    if (!aiTitle.trim()) {
      alert("Judul draf dokumen wajib diisi!");
      return;
    }
    setAiLoading(true);
    setAiResult("");
    try {
      const response = await fetch("/api/sems/generate-doc-template-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: aiTitle,
          category: aiCategory,
          prompt: aiPrompt
        })
      });
      if (!response.ok) {
        throw new Error("Gagal berkomunikasi dengan asisten AI.");
      }
      const data = await response.json();
      if (data.success) {
        setAiResult(data.template);
      } else {
        throw new Error(data.error || "Gagal membuat draf.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Simple Markdown parser to render generated template beautifully
  const renderMarkdownText = (markdownText: string) => {
    if (!markdownText) return null;
    const lines = markdownText.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed === "---") {
        return <hr key={idx} className="border-t border-slate-200 my-3" />;
      }
      if (trimmed.startsWith("# ")) {
        return <h1 key={idx} className="text-sm font-extrabold text-slate-900 border-b pb-1 mb-2 mt-4 uppercase tracking-wide">{trimmed.replace("# ", "")}</h1>;
      }
      if (trimmed.startsWith("## ")) {
        return <h2 key={idx} className="text-xs font-bold text-slate-800 mb-1.5 mt-3">{trimmed.replace("## ", "")}</h2>;
      }
      if (trimmed.startsWith("### ")) {
        return <h3 key={idx} className="text-[11px] font-bold text-slate-700 mb-1 mt-2.5">{trimmed.replace("### ", "")}</h3>;
      }
      if (trimmed.startsWith("- ")) {
        return <li key={idx} className="list-disc list-inside text-[11px] text-slate-600 pl-2 leading-relaxed">{trimmed.replace("- ", "")}</li>;
      }
      if (trimmed.startsWith("* ")) {
        return <li key={idx} className="list-disc list-inside text-[11px] text-slate-600 pl-2 leading-relaxed">{trimmed.replace("* ", "")}</li>;
      }
      return <p key={idx} className="text-[11px] text-slate-600 leading-relaxed min-h-[14px]">{trimmed}</p>;
    });
  };

  // Google Drive Link Handlers
  const handleOpenDriveForm = (drive?: DriveLink) => {
    if (drive) {
      setDriveId(drive.id);
      setDriveTitle(drive.title);
      setDriveDivision(drive.division);
      setDriveUrl(drive.url);
      setDriveDescription(drive.description);
    } else {
      setDriveId("");
      setDriveTitle("");
      setDriveDivision("Seksi Publikasi & Humas");
      setDriveUrl("");
      setDriveDescription("");
    }
    setIsDriveFormOpen(true);
  };

  const handleSaveDriveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveTitle.trim() || !driveUrl.trim()) {
      alert("Judul Tautan dan URL wajib diisi!");
      return;
    }

    if (driveId) {
      // Edit
      setDriveLinks(prev => prev.map(dl => dl.id === driveId ? {
        ...dl,
        title: driveTitle,
        division: driveDivision,
        url: driveUrl,
        description: driveDescription
      } : dl));
    } else {
      // Add
      const newDrive: DriveLink = {
        id: "drive_" + Date.now(),
        title: driveTitle,
        division: driveDivision,
        url: driveUrl,
        description: driveDescription,
        bgColor: "from-slate-500/10 to-slate-600/10 text-slate-700 border-slate-100"
      };
      setDriveLinks(prev => [...prev, newDrive]);
    }
    setIsDriveFormOpen(false);
  };

  const handleDeleteDriveLink = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus tautan drive "${name}"?`)) {
      setDriveLinks(prev => prev.filter(dl => dl.id !== id));
    }
  };

  // Gallery-specific documents
  const galleryDocs = activeDocs.filter(doc => doc.category === 'Dokumentasi');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-amber-500"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-50 rounded-xl text-red-600 shrink-0">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-extrabold text-slate-800 uppercase tracking-wide">Pusat Dokumentasi & Arsip</h1>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                Akses digital satu pintu untuk seluruh kelengkapan berkas administrasi panitia, galeri foto dokumentasi kegiatan, serta penyimpanan cloud Google Drive pembagian divisi.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setIsAiOpen(true)}
              className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-all duration-200 shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-purple-600 animate-pulse" />
              Tulis dengan AI
            </button>
            
            {activeSubTab === 'drive' ? (
              <button
                onClick={() => handleOpenDriveForm()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all duration-200 shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Link Drive
              </button>
            ) : (
              <button
                onClick={() => {
                  handleOpenForm();
                  if (activeSubTab === 'galeri') {
                    setDocCategory('Dokumentasi');
                    setDocFileType('image/jpeg');
                    setDocFileName('Foto_Kegiatan.jpg');
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all duration-200 shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {activeSubTab === 'galeri' ? 'Unggah Foto Galeri' : 'Unggah Dokumen'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex border-b border-slate-200 bg-white p-1 rounded-lg shadow-3xs">
        <button
          onClick={() => setActiveSubTab('berkas')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
            activeSubTab === 'berkas'
              ? 'bg-red-600 text-white shadow-xs font-extrabold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          Arsip Berkas Digital
        </button>
        <button
          onClick={() => setActiveSubTab('galeri')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
            activeSubTab === 'galeri'
              ? 'bg-red-600 text-white shadow-xs font-extrabold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Image className="w-4 h-4" />
          Galeri Dokumentasi
        </button>
        <button
          onClick={() => setActiveSubTab('drive')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
            activeSubTab === 'drive'
              ? 'bg-red-600 text-white shadow-xs font-extrabold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Link2 className="w-4 h-4" />
          Link Google Drive Panitia
        </button>
      </div>

      {/* RENDER ACTIVE SUB-TAB */}
      {activeSubTab === 'berkas' && (
        <>
          {/* Search and Filters Toolbar */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3.5 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari dokumen, deskripsi, atau file..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg pl-9 pr-4 py-2.5 bg-slate-50/50"
              />
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    activeCategory === cat 
                      ? "bg-red-600 text-white shadow-sm font-extrabold" 
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {cat === "Semua" ? "Semua Berkas" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Document Grid List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => {
                const sizeColor = getFileIcon(doc.fileType);
                return (
                  <div 
                    key={doc.id}
                    id={`doc-card-${doc.id}`}
                    className="bg-white rounded-xl border border-slate-200/80 shadow-3xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col h-full overflow-hidden group"
                  >
                    {/* Accent line based on category */}
                    <div className={`h-1 w-full ${
                      doc.category === 'SK Panitia' ? 'bg-indigo-500' :
                      doc.category === 'Proposal' ? 'bg-blue-500' :
                      doc.category === 'Surat' ? 'bg-amber-500' :
                      doc.category === 'Kuitansi' ? 'bg-emerald-500' :
                      doc.category === 'Dokumentasi' ? 'bg-purple-500' : 'bg-slate-400'
                    }`}></div>

                    {/* Body */}
                    <div className="p-5 flex-1 flex flex-col space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md ${
                          doc.category === 'SK Panitia' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          doc.category === 'Proposal' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          doc.category === 'Surat' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          doc.category === 'Kuitansi' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          doc.category === 'Dokumentasi' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}>
                          {doc.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(doc.uploadDate).toLocaleDateString('id-ID')}
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <h3 className="text-xs font-extrabold text-slate-800 leading-snug group-hover:text-red-600 transition-colors line-clamp-2">
                          {doc.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed text-justify line-clamp-3">
                          {doc.description}
                        </p>
                      </div>

                      {/* File Info */}
                      <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100/60 shrink-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-2 rounded ${sizeColor} shrink-0`}>
                            <File className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-700 truncate max-w-[130px] sm:max-w-[160px]">{doc.fileName}</p>
                            <p className="text-[9px] text-slate-400 font-mono leading-none mt-0.5">{doc.fileSize || "Unknown size"}</p>
                          </div>
                        </div>
                        {doc.fileUrl && (
                          <a 
                            href={doc.fileUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-1.5 hover:bg-white rounded text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-100 transition-all shadow-3xs"
                            title="Buka Tautan File"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="bg-slate-50/50 px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
                      <span className="text-[10px] text-slate-400">
                        Oleh: <strong className="text-slate-600 font-semibold">{doc.uploadedBy}</strong>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenPreview(doc)}
                          className="p-1.5 hover:bg-white rounded text-slate-500 hover:text-slate-800 border border-transparent hover:border-slate-100 transition-all flex items-center gap-1 text-[10px] font-bold shadow-3xs cursor-pointer animate-fade-in"
                          title="Lihat Detail & Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <div className="group/qr relative p-1.5 hover:bg-white rounded text-slate-500 hover:text-red-600 border border-transparent hover:border-slate-100 transition-all cursor-pointer">
                          <QrCode className="w-3.5 h-3.5" />
                          <div className="absolute right-0 bottom-full mb-2 bg-white p-2 border border-slate-200 rounded shadow-lg hidden group-hover/qr:block z-20">
                            <QRCodeCanvas value={doc.fileUrl || "https://example.com"} size={80} />
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenForm(doc)}
                          className="p-1.5 hover:bg-white rounded text-blue-500 hover:text-blue-700 border border-transparent hover:border-slate-100 transition-all flex items-center gap-1 text-[10px] font-bold shadow-3xs cursor-pointer"
                          title="Edit Dokumen"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          className="p-1.5 hover:bg-white rounded text-red-500 hover:text-red-700 border border-transparent hover:border-slate-100 transition-all flex items-center gap-1 text-[10px] font-bold shadow-3xs cursor-pointer"
                          title="Hapus Dokumen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full bg-white rounded-xl border border-slate-200 p-16 text-center space-y-3.5 shadow-3xs">
                <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Dokumen tidak ditemukan</p>
                  <p className="text-[11px] text-slate-400">Gunakan kata kunci pencarian lain atau klik "Unggah Dokumen" untuk menambahkan berkas baru.</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeSubTab === 'galeri' && (
        <div className="space-y-6">
          {/* Quick Info bar */}
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs">
            <div className="flex items-center gap-2.5">
              <Image className="w-5 h-5 text-red-600 shrink-0" />
              <div className="text-xs text-red-800 font-medium">
                Seksi Dokumentasi aktif mengunggah foto-foto kegiatan panitia secara cloud ke folder Google Drive utama.
              </div>
            </div>
            {driveLinks.find(d => d.id === 'drive_2') && (
              <a
                href={driveLinks.find(d => d.id === 'drive_2')?.url}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Drive Foto Utama
              </a>
            )}
          </div>

          {/* Photo Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {galleryDocs.length > 0 ? (
              galleryDocs.map((doc) => {
                const photoUrl = doc.fileUrl && (doc.fileUrl.startsWith('http') || doc.fileUrl.startsWith('data:'))
                  ? doc.fileUrl 
                  : "https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80";
                
                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-3xs hover:shadow-md transition-all duration-300 group flex flex-col h-full"
                  >
                    {/* Visual Container */}
                    <div className="relative h-48 overflow-hidden bg-slate-100 shrink-0 cursor-pointer" onClick={() => handleOpenPreview(doc)}>
                      <img 
                        src={photoUrl} 
                        alt={doc.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                      <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-red-600 text-white text-[9px] font-extrabold uppercase tracking-wider rounded-md shadow-sm">
                        {doc.uploadedBy || "Seksi Pubdekdok"}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-4.5 flex-1 flex flex-col justify-between space-y-3.5">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(doc.uploadDate).toLocaleDateString('id-ID')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{doc.fileSize || "Unknown Size"}</span>
                        </div>
                        <h4 
                          className="text-xs font-bold text-slate-800 hover:text-red-600 transition-colors line-clamp-1 cursor-pointer"
                          onClick={() => handleOpenPreview(doc)}
                        >
                          {doc.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3 text-justify">
                          {doc.description}
                        </p>
                      </div>

                      {/* Footer actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => handleOpenPreview(doc)}
                          className="text-[10px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Lihat Foto
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenForm(doc)}
                            className="p-1.5 hover:bg-slate-100 rounded text-blue-500 hover:text-blue-700 transition-colors cursor-pointer"
                            title="Edit Caption / File"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc)}
                            className="p-1.5 hover:bg-slate-100 rounded text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                            title="Hapus Foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full bg-white rounded-xl border border-slate-200 p-16 text-center space-y-3.5 shadow-3xs">
                <Image className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Galeri foto kosong</p>
                  <p className="text-[11px] text-slate-400">Belum ada dokumentasi terunggah. Klik "Unggah Foto Galeri" untuk membagikan dokumentasi perdana.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'drive' && (
        <div className="space-y-6 animate-fade-in">
          {/* Intro description */}
          <div className="bg-gradient-to-r from-amber-500/5 to-yellow-500/5 border border-amber-200/60 p-4 rounded-xl flex items-start gap-3 shadow-3xs">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800">Manajemen Tautan Google Drive Bersama</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Di bawah ini adalah tautan folder Google Drive resmi yang digunakan oleh masing-masing seksi panitia untuk berkolaborasi secara real-time. Anda dapat menyalin tautan, membuka folder tujuan, atau menambahkan folder baru sesuai kebutuhan koordinasi divisi.
              </p>
            </div>
          </div>

          {/* Drive Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {driveLinks.map((link) => (
              <div
                key={link.id}
                className="bg-white rounded-xl border border-slate-200 shadow-3xs hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between h-full space-y-4 relative group"
              >
                {/* Visual Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                      {link.division}
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-800 group-hover:text-red-600 transition-colors pt-2.5">
                      {link.title}
                    </h4>
                  </div>
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-500 leading-relaxed text-justify flex-1">
                  {link.description}
                </p>

                {/* Folder URL display */}
                <div className="p-2 bg-slate-50 border border-slate-100 rounded font-mono text-[9px] text-slate-400 truncate flex items-center justify-between">
                  <span className="truncate">{link.url}</span>
                  <button
                    onClick={() => handleCopyLink(link.url)}
                    className="p-1 hover:bg-white border border-transparent hover:border-slate-200 rounded shrink-0 ml-2"
                    title="Salin Tautan"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Clipboard className="w-3 h-3 text-slate-400" />}
                  </button>
                </div>

                {/* Card controls */}
                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenDriveForm(link)}
                      className="p-1.5 hover:bg-slate-50 rounded text-blue-500 hover:text-blue-700 transition-colors text-xs"
                      title="Edit Link"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDriveLink(link.id, link.title)}
                      className="p-1.5 hover:bg-slate-50 rounded text-red-500 hover:text-red-700 transition-colors text-xs"
                      title="Hapus Link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded flex items-center gap-1 shadow-2xs transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Buka Drive
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Drive Form Modal */}
          {isDriveFormOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 overflow-y-auto">
              <form
                onSubmit={handleSaveDriveLink}
                className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl flex flex-col max-h-[85vh]"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    {driveId ? "Edit Informasi Tautan Drive" : "Tambah Tautan Google Drive Baru"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsDriveFormOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form fields */}
                <div className="p-5 space-y-4 font-sans text-xs flex-1 overflow-y-auto">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Folder / Judul Drive</label>
                    <input
                      type="text"
                      placeholder="Contoh: Google Drive Seksi Humas"
                      value={driveTitle}
                      onChange={(e) => setDriveTitle(e.target.value)}
                      className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2 bg-slate-50/50"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Seksi / Divisi Penanggung Jawab</label>
                    <select
                      value={driveDivision}
                      onChange={(e) => setDriveDivision(e.target.value)}
                      className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2 bg-slate-50/50"
                    >
                      <option value="Sekretariat & RW">Sekretariat & RW</option>
                      <option value="Bendahara">Bendahara</option>
                      <option value="Seksi Lomba">Seksi Lomba</option>
                      <option value="Seksi Pubdekdok">Seksi Pubdekdok</option>
                      <option value="Seksi Humas">Seksi Humas</option>
                      <option value="Seksi Perlengkapan">Seksi Perlengkapan</option>
                      <option value="Seksi Konsumsi">Seksi Konsumsi</option>
                      <option value="Seksi Keamanan">Seksi Keamanan</option>
                      <option value="Seksi Lainnya">Seksi Lainnya</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">URL Google Drive Folder</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/drive/folders/..."
                      value={driveUrl}
                      onChange={(e) => setDriveUrl(e.target.value)}
                      className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2 bg-slate-50/50"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Keterangan / Fungsi Folder</label>
                    <textarea
                      rows={3}
                      placeholder="Tuliskan keterangan mengenai jenis berkas yang wajib diunggah ke folder ini..."
                      value={driveDescription}
                      onChange={(e) => setDriveDescription(e.target.value)}
                      className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg p-3 bg-slate-50/50 resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsDriveFormOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    {driveId ? "Simpan Perubahan" : "Tambah Tautan"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* AI Drafting Modal/Drawer */}
      {isAiOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] animate-fade-in">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Cpu className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Asisten AI Pembuat Draf Surat</h3>
                  <p className="text-[10px] text-slate-400">Tulis template surat/administrasi formal RW secara otomatis didukung Gemini AI</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAiOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Judul Dokumen / Acara</label>
                  <input
                    type="text"
                    placeholder="Contoh: Undangan Rapat Kerja Panitia II"
                    value={aiTitle}
                    onChange={(e) => setAiTitle(e.target.value)}
                    className="w-full text-xs border border-slate-200 focus:border-purple-500 focus:outline-none rounded-lg px-3 py-2 bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kategori Berkas</label>
                  <select
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value as DigitalDocument['category'])}
                    className="w-full text-xs border border-slate-200 focus:border-purple-500 focus:outline-none rounded-lg px-3 py-2 bg-slate-50/50"
                  >
                    <option value="Surat">Surat Resmi</option>
                    <option value="Proposal">Draf Proposal</option>
                    <option value="SK Panitia">SK Kepanitiaan</option>
                    <option value="Kuitansi">Format Kuitansi</option>
                    <option value="Lainnya">Lain-lain</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Keterangan / Inti Isi Surat</label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan poin penting yang ingin disampaikan. Contoh: Rapat koordinasi tanggal 15 Juli 2026 jam 19.30 membahas detail lomba RT. Semua ketua seksi wajib membawa draf anggaran."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:border-purple-500 focus:outline-none rounded-lg p-3 bg-slate-50/50 resize-none leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateAiTemplate}
                disabled={aiLoading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {aiLoading ? "Menghubungkan ke Gemini AI..." : "Rumuskan Draf Dokumen Formal"}
              </button>

              {aiResult && (
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center bg-slate-100 p-2 rounded-t-lg px-3">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                      Hasil Rumusan Asisten AI
                    </span>
                    <button
                      onClick={() => handleCopyLink(aiResult)}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Disalin!</span>
                        </>
                      ) : (
                        <>
                          <Clipboard className="w-3.5 h-3.5" />
                          <span>Salin Teks</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-b-lg overflow-y-auto max-h-60 space-y-2 text-justify select-text border-t-0">
                    {renderMarkdownText(aiResult)}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (aiResult) {
                    // Populate to upload form
                    setDocTitle(aiTitle);
                    setDocCategory(aiCategory);
                    setDocDescription(`Draf dibuat oleh AI: ${aiTitle}`);
                    setDocFileName(`${aiTitle.toLowerCase().replace(/\s+/g, '_')}_draft.md`);
                    setDocFileType("text/markdown");
                    setDocNotes(aiResult);
                    setIsAiOpen(false);
                    setIsFormOpen(true);
                  } else {
                    setIsAiOpen(false);
                  }
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                {aiResult ? "Gunakan sebagai Berkas Unggahan" : "Tutup"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form 
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] animate-fade-in"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                {docId ? "Edit Informasi Arsip" : "Unggah Referensi Dokumen Baru"}
              </h3>
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Form */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Judul Berkas / Dokumen</label>
                <input
                  type="text"
                  placeholder="Contoh: SK Panitia HUT RI Ke-81 RW 04 Ngabean"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2 bg-slate-50/50 font-medium text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kategori Berkas</label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as DigitalDocument['category'])}
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2 bg-slate-50/50"
                  >
                    <option value="Surat">Surat Resmi</option>
                    <option value="Proposal">Draf Proposal</option>
                    <option value="Kuitansi">Kuitansi / Bukti Pembayaran</option>
                    <option value="SK Panitia">SK Kepanitiaan</option>
                    <option value="Dokumentasi">Dokumentasi Foto</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pengunggah (PIC)</label>
                  <select
                    value={docUploadedBy}
                    onChange={(e) => setDocUploadedBy(e.target.value)}
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2 bg-slate-50/50"
                  >
                    <option value="Sekretariat">Sekretariat RW 04</option>
                    <option value="Ketua Panitia">Ketua Panitia</option>
                    <option value="Bendahara">Bendahara</option>
                    {panitia.map((p) => (
                      <option key={p.id} value={p.name}>{p.name} ({p.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Berikan ringkasan informasi atau tujuan berkas digital ini..."
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg p-3 bg-slate-50/50 resize-none leading-relaxed"
                />
              </div>

              {/* Simulated Drag & Drop and File Input */}
              <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 flex flex-col items-center justify-center space-y-2 relative group hover:border-red-400 hover:bg-red-50/10 transition-all">
                <FolderOpen className="w-8 h-8 text-slate-400 group-hover:text-red-500 transition-colors" />
                <div className="text-center">
                  <p className="text-[11px] font-bold text-slate-600">Tarik dan letakkan file Anda di sini, atau pilih file</p>
                  <p className="text-[9px] text-slate-400">PDF, Word, Excel, JPG, atau PNG (Ukuran maks: 10MB)</p>
                </div>
                {/* Simulated file name entry */}
                <div className="w-full max-w-sm pt-2">
                  <input
                    type="text"
                    placeholder="Masukkan nama berkas fisik (Contoh: Kuitansi_Konsumsi.pdf)"
                    value={docFileName}
                    onChange={(e) => setDocFileName(e.target.value)}
                    className="w-full text-[11px] text-center font-mono border border-slate-200 focus:border-red-500 focus:outline-none rounded px-2.5 py-1.5 bg-white text-slate-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipe MIME Berkas</label>
                  <select
                    value={docFileType}
                    onChange={(e) => setDocFileType(e.target.value)}
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2 bg-slate-50/50"
                  >
                    <option value="application/pdf">Dokumen PDF (.pdf)</option>
                    <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">Word Document (.docx)</option>
                    <option value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">Excel Spreadsheet (.xlsx)</option>
                    <option value="image/jpeg">Gambar JPEG (.jpg/.jpeg)</option>
                    <option value="image/png">Gambar PNG (.png)</option>
                    <option value="text/markdown">Markdown File (.md)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ukuran File Simulasi</label>
                  <input
                    type="text"
                    placeholder="Contoh: 1.2 MB"
                    value={docFileSize}
                    onChange={(e) => setDocFileSize(e.target.value)}
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tautan Google Drive / Dropbox (Opsional)</label>
                <div className="relative">
                  <ExternalLink className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://drive.google.com/file/d/..."
                    value={docFileUrl}
                    onChange={(e) => setDocFileUrl(e.target.value)}
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg pl-9 pr-4 py-2 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Isi Catatan / Catatan Internal Dokumen</label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan isi teks penuh dari draf surat atau catatan internal mengenai lokasi penyimpanan kuitansi fisik..."
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg p-3 bg-slate-50/50 resize-none font-mono text-[10px] leading-relaxed"
                />
              </div>
            </div>

            {/* Footer Form */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-bold rounded-lg transition-all duration-200 shadow-sm flex items-center gap-1 cursor-pointer"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Dokumen"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Document Detail & Preview Modal */}
      {isPreviewOpen && selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] animate-fade-in">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${getFileIcon(selectedDoc.fileType)} shrink-0`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">{selectedDoc.title}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">ID Dokumen: {selectedDoc.id} • Diunggah {new Date(selectedDoc.uploadDate).toLocaleString('id-ID')}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Content Info */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans text-xs">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3.5">
                <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Info className="w-4 h-4 text-slate-400" />
                  Rincian Informasi Arsip
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-slate-600">
                  <p><strong>Kategori:</strong> {selectedDoc.category}</p>
                  <p><strong>Ukuran Berkas:</strong> {selectedDoc.fileSize || "1.2 MB"}</p>
                  <p><strong>Format File:</strong> {selectedDoc.fileType}</p>
                  <p><strong>PIC Pengunggah:</strong> {selectedDoc.uploadedBy}</p>
                  <p className="sm:col-span-2 mt-1"><strong>Deskripsi:</strong> {selectedDoc.description}</p>
                </div>
              </div>

              {/* Simulated Document Preview Area */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900/5 flex flex-col">
                <div className="bg-slate-100 p-3 border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
                  <span className="text-[10px] font-mono text-slate-600 font-bold flex items-center gap-1.5">
                    <File className="w-3.5 h-3.5 text-slate-500" />
                    PRATINJAU DOKUMEN: {selectedDoc.fileName}
                  </span>
                  {selectedDoc.fileUrl && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyLink(selectedDoc.fileUrl || "")}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Tautan Disalin!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Bagikan Link</span>
                          </>
                        )}
                      </button>
                      <a
                        href={selectedDoc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-bold border border-slate-200 rounded flex items-center gap-1 shadow-2xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Buka Dokumen
                      </a>
                    </div>
                  )}
                </div>

                {/* Simulated Sheet of Paper for Content */}
                <div className="p-8 bg-white overflow-y-auto max-h-72 border-t-0 border-b-0">
                  {selectedDoc.notes ? (
                    <div className="space-y-2 text-justify select-text select-all font-mono leading-relaxed text-[11px] text-slate-700">
                      {selectedDoc.notes.includes("#") || selectedDoc.notes.includes("-") ? (
                        <div className="font-sans space-y-2">
                          {renderMarkdownText(selectedDoc.notes)}
                        </div>
                      ) : (
                        <p className="whitespace-pre-line">{selectedDoc.notes}</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400 space-y-2">
                      <File className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-[11px] font-bold">Tidak ada konten pratinjau teks penuh.</p>
                      <p className="text-[10px]">Silakan klik tombol "Buka Dokumen" di atas untuk meninjau berkas asli di cloud drive Anda.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Preview */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
