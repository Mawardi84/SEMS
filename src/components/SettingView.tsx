import React, { useState } from "react";
import { 
  Settings, 
  Save, 
  CheckCircle2,
  Upload,
  Mail,
  Trophy,
  Award,
  Star,
  Shield,
  Heart,
  Flag,
  Image as ImageIcon,
  Download,
  Database,
  FileText,
  RefreshCw
} from "lucide-react";
import { SystemSetting, SEMSData } from "../types";
import { initialData } from "../data/initialData";

interface SettingViewProps {
  settings: SystemSetting;
  onSaveSettings: (settings: SystemSetting) => Promise<void>;
  semsData: SEMSData;
  onImportSuccess: (importedData: SEMSData) => Promise<void>;
}

export default function SettingView({ settings, onSaveSettings, semsData, onImportSuccess }: SettingViewProps) {
  const [rtListStr, setRtListStr] = useState(settings.rtList.join(", "));
  const [seksiListStr, setSeksiListStr] = useState(settings.seksiList.join(", "));
  const [targetIuran, setTargetIuran] = useState(settings.targetIuranPerRT);
  const [paguBudgets, setPaguBudgets] = useState<Record<string, number>>({ ...settings.paguAnggaranSeksi });
  
  // Kop Surat States
  const [kopLine1, setKopLine1] = useState(settings.kopLine1 || "PANITIA PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81");
  const [kopLine2, setKopLine2] = useState(settings.kopLine2 || "RUKUN WARGA 04 KELURAHAN NGABEAN");
  const [kopLine3, setKopLine3] = useState(settings.kopLine3 || "Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah");
  const [kopLine4, setKopLine4] = useState(settings.kopLine4 || "Sekretariat: Balai RW 04 Ngabean, Telp: +62 812-3456-7890 | Kode Pos: 50141");
  const [logoStyle, setLogoStyle] = useState(settings.logoStyle || "flag");
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || "");
  const [kopStyle, setKopStyle] = useState(settings.kopStyle || "classic-centered");

  // Master Stamp & Signatures States
  const [stempelUrl, setStempelUrl] = useState(settings.stempelUrl || "");
  const [signatureKetuaUrl, setSignatureKetuaUrl] = useState(settings.signatureKetuaUrl || "");
  const [signatureKetuaName, setSignatureKetuaName] = useState(settings.signatureKetuaName || "");
  const [signatureBendaharaUrl, setSignatureBendaharaUrl] = useState(settings.signatureBendaharaUrl || "");
  const [signatureBendaharaName, setSignatureBendaharaName] = useState(settings.signatureBendaharaName || "");
  const [signatureSekretarisUrl, setSignatureSekretarisUrl] = useState(settings.signatureSekretarisUrl || "");
  const [signatureSekretarisName, setSignatureSekretarisName] = useState(settings.signatureSekretarisName || "");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // States for backup and restore
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isRestoringMD, setIsRestoringMD] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pastedJson, setPastedJson] = useState("");

  // Handler for 1-click restore from Master Markdown file
  const handleRestoreFromMasterMD = async () => {
    if (!window.confirm("Apakah Anda yakin ingin memulihkan database dari file Master Markdown (DATA_MASTER_SEMS_RW04.md)? Semua data akan disinkronkan kembali ke database master.")) {
      return;
    }

    setIsRestoringMD(true);
    setImportError("");
    setImportSuccess(false);

    try {
      try {
        const response = await fetch("/api/sems/restore-from-md", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            await onImportSuccess(result.data);
            setImportSuccess(true);
            setRtListStr(result.data.settings?.rtList?.join(", ") || "");
            setSeksiListStr(result.data.settings?.seksiList?.join(", ") || "");
            setTargetIuran(result.data.settings?.targetIuranPerRT || 2000000);
            setPaguBudgets({ ...result.data.settings?.paguAnggaranSeksi });
            setTimeout(() => setImportSuccess(false), 5000);
            return;
          }
        }
      } catch (e) {
        console.warn("Backend offline, restoring initial master data locally:", e);
      }

      // Offline / Vercel fallback
      await onImportSuccess(initialData);
      setImportSuccess(true);
      setRtListStr(initialData.settings?.rtList?.join(", ") || "");
      setSeksiListStr(initialData.settings?.seksiList?.join(", ") || "");
      setTargetIuran(initialData.settings?.targetIuranPerRT || 2000000);
      setPaguBudgets({ ...initialData.settings?.paguAnggaranSeksi });
      setTimeout(() => setImportSuccess(false), 5000);
    } catch (err: any) {
      setImportError(err.message || "Gagal memulihkan dari Master Markdown.");
      setTimeout(() => setImportError(""), 6000);
    } finally {
      setIsRestoringMD(false);
    }
  };

  // Handler for exporting database as JSON
  const handleExportData = () => {
    setIsExporting(true);
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(semsData, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `sems_backup_rw04_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      console.error("Gagal mengekspor data:", error);
      alert("Gagal mengekspor data.");
    } finally {
      setIsExporting(false);
    }
  };

  // Handler for importing JSON backup file
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError("");
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // Validation: Must contain settings
        if (!parsed || typeof parsed !== "object" || !parsed.settings) {
          throw new Error("File JSON tidak sesuai format SEMS (tidak mengandung konfigurasi settings).");
        }

        // Sync with backend database if available
        try {
          const response = await fetch("/api/sems/sync-import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed)
          });
          if (response.ok) {
            await response.json();
          }
        } catch (syncErr) {
          console.warn("Backend offline, applying imported data locally:", syncErr);
        }

        await onImportSuccess(parsed);
        setImportSuccess(true);
        setRtListStr(parsed.settings.rtList?.join(", ") || "");
        setSeksiListStr(parsed.settings.seksiList?.join(", ") || "");
        setTargetIuran(parsed.settings.targetIuranPerRT || 2000000);
        setPaguBudgets({ ...parsed.settings.paguAnggaranSeksi });
        setKopLine1(parsed.settings.kopLine1 || "");
        setKopLine2(parsed.settings.kopLine2 || "");
        setKopLine3(parsed.settings.kopLine3 || "");
        setKopLine4(parsed.settings.kopLine4 || "");
        setLogoStyle(parsed.settings.logoStyle || "flag");
        setLogoUrl(parsed.settings.logoUrl || "");
        setKopStyle(parsed.settings.kopStyle || "classic-centered");
        setStempelUrl(parsed.settings.stempelUrl || "");
        setSignatureKetuaUrl(parsed.settings.signatureKetuaUrl || "");
        setSignatureKetuaName(parsed.settings.signatureKetuaName || "");
        setSignatureBendaharaUrl(parsed.settings.signatureBendaharaUrl || "");
        setSignatureBendaharaName(parsed.settings.signatureBendaharaName || "");
        setSignatureSekretarisUrl(parsed.settings.signatureSekretarisUrl || "");
        setSignatureSekretarisName(parsed.settings.signatureSekretarisName || "");
        setTimeout(() => setImportSuccess(false), 5000);
      } catch (err: any) {
        console.error("Gagal mengimpor data:", err);
        setImportError(err.message || "Pastikan file JSON valid dan sesuai format backup SEMS.");
        setTimeout(() => setImportError(""), 6000);
      } finally {
        setIsImporting(false);
        // Reset file input
        e.target.value = "";
      }
    };

    reader.onerror = () => {
      setImportError("Gagal membaca file.");
      setIsImporting(false);
    };

    reader.readAsText(file);
  };

  const handleImportPastedData = async () => {
    if (!pastedJson.trim()) {
      setImportError("Kolom teks JSON masih kosong.");
      return;
    }

    setIsImporting(true);
    setImportError("");
    setImportSuccess(false);

    try {
      const parsed = JSON.parse(pastedJson.trim());
      
      // Validation: Must contain settings
      if (!parsed || typeof parsed !== "object" || !parsed.settings) {
        throw new Error("Teks JSON tidak sesuai format SEMS (tidak mengandung konfigurasi settings).");
      }

      // Sync with backend database
      const response = await fetch("/api/sems/sync-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed)
      });

      if (!response.ok) {
        throw new Error("Gagal menyinkronkan data impor ke server.");
      }

      const result = await response.json();
      if (result.success) {
        await onImportSuccess(parsed);
        setImportSuccess(true);
        setPastedJson("");
        setShowPasteArea(false);
        setRtListStr(parsed.settings.rtList?.join(", ") || "");
        setSeksiListStr(parsed.settings.seksiList?.join(", ") || "");
        setTargetIuran(parsed.settings.targetIuranPerRT || 2000000);
        setPaguBudgets({ ...parsed.settings.paguAnggaranSeksi });
        setKopLine1(parsed.settings.kopLine1 || "");
        setKopLine2(parsed.settings.kopLine2 || "");
        setKopLine3(parsed.settings.kopLine3 || "");
        setKopLine4(parsed.settings.kopLine4 || "");
        setLogoStyle(parsed.settings.logoStyle || "flag");
        setLogoUrl(parsed.settings.logoUrl || "");
        setKopStyle(parsed.settings.kopStyle || "classic-centered");
        setStempelUrl(parsed.settings.stempelUrl || "");
        setSignatureKetuaUrl(parsed.settings.signatureKetuaUrl || "");
        setSignatureKetuaName(parsed.settings.signatureKetuaName || "");
        setSignatureBendaharaUrl(parsed.settings.signatureBendaharaUrl || "");
        setSignatureBendaharaName(parsed.settings.signatureBendaharaName || "");
        setSignatureSekretarisUrl(parsed.settings.signatureSekretarisUrl || "");
        setSignatureSekretarisName(parsed.settings.signatureSekretarisName || "");
        setTimeout(() => setImportSuccess(false), 5000);
      } else {
        throw new Error(result.error || "Gagal mengimpor ke server.");
      }
    } catch (err: any) {
      console.error("Gagal mengimpor data tempel:", err);
      setImportError(err.message || "Teks JSON tidak valid atau salah format.");
      setTimeout(() => setImportError(""), 6000);
    } finally {
      setIsImporting(false);
    }
  };

  // Parse comma list back to array
  const parseCommaList = (str: string): string[] => {
    return str.split(",").map(item => item.trim()).filter(item => item.length > 0);
  };

  const handlePaguChange = (seksi: string, value: number) => {
    setPaguBudgets(prev => ({
      ...prev,
      [seksi]: value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const updatedSeksiList = parseCommaList(seksiListStr);
    
    // Ensure every seksi in list has a pagu entry
    const finalPagu: Record<string, number> = {};
    updatedSeksiList.forEach(seksi => {
      finalPagu[seksi] = paguBudgets[seksi] || 1000000; // default 1jt if empty
    });

    const updatedSettings: SystemSetting = {
      ...settings,
      rtList: parseCommaList(rtListStr),
      seksiList: updatedSeksiList,
      targetIuranPerRT: Number(targetIuran),
      paguAnggaranSeksi: finalPagu,
      kopLine1,
      kopLine2,
      kopLine3,
      kopLine4,
      logoStyle,
      logoUrl,
      kopStyle,
      stempelUrl,
      signatureKetuaUrl,
      signatureKetuaName,
      signatureBendaharaUrl,
      signatureBendaharaName,
      signatureSekretarisUrl,
      signatureSekretarisName
    };

    try {
      await onSaveSettings(updatedSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      {/* Title with Settings context */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
            <Settings className="w-4 h-4 text-red-600" />
            Konfigurasi Sistem SEMS
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Atur parameter operasional panitia RW 04 Ngabean Semarang.
          </p>
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={handleSave} className="space-y-5">
          
          {/* Form Fields: General Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-3.5">
              <h3 className="text-[11px] font-extrabold text-slate-700 pb-1 border-b border-slate-200 uppercase tracking-wider">Struktur Wilayah & Seksi</h3>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Daftar Rukun Tetangga (RT)</label>
                <input
                  type="text"
                  value={rtListStr}
                  onChange={(e) => setRtListStr(e.target.value)}
                  placeholder="Pisahkan dengan koma, misal: RT 01, RT 02"
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50/50"
                  required
                />
                <span className="text-[9px] text-slate-400 mt-0.5 block">Daftar RT aktif yang berada di wilayah RW 04 Ngabean.</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Daftar Seksi Kepanitiaan</label>
                <input
                  type="text"
                  value={seksiListStr}
                  onChange={(e) => setSeksiListStr(e.target.value)}
                  placeholder="Pisahkan dengan koma, misal: Acara, Konsumsi"
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50/50"
                  required
                />
                <span className="text-[9px] text-slate-400 mt-0.5 block">Seksi kepanitiaan yang mengusulkan barang & anggaran (RKBA).</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Iuran Pokok per RT (Rp)</label>
                <input
                  type="number"
                  value={targetIuran}
                  onChange={(e) => setTargetIuran(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50/50"
                  required
                />
                <span className="text-[9px] text-slate-400 mt-0.5 block">Target iuran kas tunai yang wajib disetor oleh bendahara RT ke panitia RW.</span>
              </div>
            </div>

            <div className="space-y-3.5">
              <h3 className="text-[11px] font-extrabold text-slate-700 pb-1 border-b border-slate-200 uppercase tracking-wider">Batas Anggaran (Pagu) per Seksi</h3>
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2.5 max-h-64 overflow-y-auto">
                {parseCommaList(seksiListStr).map((seksi) => (
                  <div key={seksi} className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-bold text-slate-700 shrink-0">{seksi}</span>
                    <div className="flex items-center gap-2 max-w-xs w-36">
                      <span className="text-[10px] font-bold text-slate-400 font-mono">Rp</span>
                      <input
                        type="number"
                        value={paguBudgets[seksi] ?? 1000000}
                        onChange={(e) => handlePaguChange(seksi, Number(e.target.value))}
                        className="w-full text-xs text-right border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1 bg-white font-mono"
                      />
                    </div>
                  </div>
                ))}
                {parseCommaList(seksiListStr).length === 0 && (
                  <div className="text-center py-4 text-xs text-slate-400">
                    Tulis daftar seksi terlebih dahulu untuk mengatur pagu anggaran.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Master Kop Surat (Dokumen Resmi) Section */}
          <div className="border-t border-slate-200 pt-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-600" />
                  Master Kepala Surat (Kop Surat Resmi)
                </h3>
                <p className="text-[10px] text-slate-500">
                  Ubah di sini untuk mengintegrasikan & memperbarui kop surat secara otomatis pada semua dokumen sistem (Undangan, Proposal, Notulensi, LPJ, dll).
                </p>
              </div>
              <span className="text-[9px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 self-start sm:self-center">
                INTEGRASI OTOMATIS
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Form Config (Kiri) - 7 cols */}
              <div className="lg:col-span-7 space-y-3">
                
                {/* Text Line Config */}
                <div className="grid grid-cols-1 gap-2.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Baris 1: Nama Instansi/Kepanitiaan (Utama)</label>
                    <input
                      type="text"
                      value={kopLine1}
                      onChange={(e) => setKopLine1(e.target.value)}
                      placeholder="Contoh: PANITIA PERINGATAN HARI ULANG TAHUN KEMERDEKAAN RI KE-81"
                      className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Baris 2: Nama Organisasi/Wilayah (Sub-Utama)</label>
                    <input
                      type="text"
                      value={kopLine2}
                      onChange={(e) => setKopLine2(e.target.value)}
                      placeholder="Contoh: RUKUN WARGA 04 KELURAHAN NGABEAN"
                      className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50/50"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Baris 3: Lokasi/Kecamatan/Kota</label>
                      <input
                        type="text"
                        value={kopLine3}
                        onChange={(e) => setKopLine3(e.target.value)}
                        placeholder="Contoh: Kecamatan Semarang Barat, Kota Semarang"
                        className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50/50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Baris 4: Alamat Sekretariat & Kontak</label>
                      <input
                        type="text"
                        value={kopLine4}
                        onChange={(e) => setKopLine4(e.target.value)}
                        placeholder="Contoh: Sekretariat: Balai RW 04 Ngabean, Telp: +62 812-3456-7890"
                        className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1.5 bg-slate-50/50"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Layout and Logo Config */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  
                  {/* Style Layout Selector */}
                  <div className="space-y-2">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Desain & Layout Kop</label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        { id: "classic-centered", name: "Klasik Formal Tengah", desc: "Logo di kiri, garis ganda tebal tipis klasik." },
                        { id: "modern-left", name: "Modern Rata Kiri", desc: "Sejajar rata kiri dengan garis modern tipis." },
                        { id: "elegant-badge", name: "Aksen Merah Atas", desc: "Aksen bar merah tebal di atas kepala surat." },
                        { id: "double-logo", name: "Simetris Logo Ganda", desc: "Dua logo di kiri dan kanan (Symmetric)." },
                        { id: "bold-banner", name: "Blok Banner Merah", desc: "Latar merah solid dengan teks kontras tinggi." }
                      ].map(style => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setKopStyle(style.id)}
                          className={`flex items-start gap-2 p-1.5 rounded-lg border text-left transition-all ${
                            kopStyle === style.id
                              ? "bg-red-50 border-red-500 text-red-900 shadow-2xs"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full border-3 shrink-0 mt-0.5 flex items-center justify-center ${
                            kopStyle === style.id ? "border-red-600 bg-red-600" : "border-slate-300 bg-white"
                          }`} />
                          <div>
                            <span className="text-[10.5px] font-bold leading-tight block">{style.name}</span>
                            <span className="text-[8.5px] text-slate-500 block leading-normal">{style.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logo Options */}
                  <div className="space-y-2">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Jenis & Ikon Logo</label>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { id: "flag", name: "Bendera", icon: Flag },
                        { id: "trophy", name: "Piala", icon: Trophy },
                        { id: "award", name: "Bintang", icon: Award },
                        { id: "shield", name: "Perisai", icon: Shield },
                        { id: "heart", name: "Sosial", icon: Heart },
                        { id: "mail", name: "Surat", icon: Mail },
                        { id: "custom", name: "Kustom", icon: ImageIcon },
                        { id: "none", name: "Tanpa Logo", icon: Settings }
                      ].map(item => {
                        const IconComponent = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setLogoStyle(item.id)}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all text-center ${
                              logoStyle === item.id
                                ? "bg-red-50/80 border-red-500 text-red-600"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <IconComponent className="w-3.5 h-3.5 mb-0.5 shrink-0" />
                            <span className="text-[8px] font-bold truncate w-full">{item.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Logo Uploader / Link */}
                    <div className="space-y-1.5 border-t border-slate-200/60 pt-2.5">
                      {logoStyle === "custom" ? (
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-bold text-slate-400 uppercase block">Sumber Logo Gambar Kustom</label>
                          <div className="flex gap-2">
                            <div className="flex-1 border-2 border-dashed border-slate-200 hover:border-red-500 rounded-lg p-2 bg-white transition-all text-center flex flex-col items-center justify-center cursor-pointer relative min-h-[60px]">
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
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              />
                              <Upload className="w-4 h-4 text-slate-400 mb-0.5" />
                              <span className="text-[9px] font-bold text-slate-700">Unggah Gambar</span>
                            </div>

                            {logoUrl && (
                              <div className="flex flex-col items-center justify-center p-1.5 bg-red-50/50 rounded-lg border border-red-100 text-center shrink-0 w-20">
                                <div className="w-7 h-7 bg-white rounded border border-slate-100 p-0.5 flex items-center justify-center overflow-hidden">
                                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setLogoUrl("")}
                                  className="text-[8px] text-red-600 hover:underline mt-1 font-bold uppercase"
                                >
                                  Hapus
                                </button>
                              </div>
                            )}
                          </div>
                          <div>
                            <input
                              type="text"
                              value={logoUrl}
                              onChange={(e) => setLogoUrl(e.target.value)}
                              placeholder="Atau tempel URL gambar di sini..."
                              className="w-full text-[10px] border border-slate-200 focus:border-red-500 focus:outline-none rounded p-1 bg-slate-50/50"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-[8.5px] text-slate-400 italic font-medium leading-tight">
                          Menggunakan simbol bawaan sistem untuk mempercepat pembuatan kop surat resmi.
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>

              {/* Live Preview (Kanan) - 5 cols */}
              <div className="lg:col-span-5 flex flex-col h-full justify-start space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Pratinjau Master Kop Surat</span>
                  <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase">LIVE PREVIEW</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-3xs relative overflow-hidden min-h-[160px] flex flex-col justify-center">
                  {(() => {
                    const style = kopStyle || "classic-centered";
                    
                    const renderLogoPreview = (isRight = false) => {
                      if (logoStyle === 'none') return null;
                      return (
                        <div className="w-9 h-9 shrink-0">
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
                                if (lstyle === "mail") return <Mail className="w-4 h-4" />;
                                if (lstyle === "trophy") return <Trophy className="w-4 h-4" />;
                                if (lstyle === "award") return <Award className="w-4 h-4" />;
                                if (lstyle === "star") return <Star className="w-4 h-4" />;
                                if (lstyle === "shield") return <Shield className="w-4 h-4" />;
                                if (lstyle === "heart") return <Heart className="w-4 h-4" />;
                                return <Flag className="w-4 h-4" />;
                              })()
                            )}
                          </div>
                        </div>
                      );
                    };

                    // 1. MODERN LEFT LAYOUT
                    if (style === "modern-left") {
                      return (
                        <div className="flex items-center gap-2.5 text-left p-1 border-b border-slate-300 pb-2">
                          {logoStyle !== 'none' && renderLogoPreview(false)}
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <h2 className="text-[8px] font-bold uppercase tracking-wider text-red-600 truncate">
                              {kopLine1}
                            </h2>
                            <h1 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-800 leading-none truncate">
                              {kopLine2}
                            </h1>
                            <p className="text-[7.5px] text-slate-500 italic leading-tight truncate">
                              {kopLine3}
                            </p>
                            <p className="text-[7px] text-slate-400 leading-tight truncate">
                              {kopLine4}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    // 2. BOLD BANNER LAYOUT
                    if (style === "bold-banner") {
                      return (
                        <div className="bg-red-700 text-white p-2.5 rounded-lg flex items-center gap-2.5 relative overflow-hidden">
                          {logoStyle !== 'none' && (
                            <div className="shrink-0 bg-white/15 p-0.5 rounded-md">
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-700 overflow-hidden">
                                {logoStyle === 'custom' && logoUrl ? (
                                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" referrerPolicy="no-referrer" />
                                ) : (
                                  (() => {
                                    const lstyle = logoStyle || "flag";
                                    if (lstyle === "mail") return <Mail className="w-3.5 h-3.5 text-red-600" />;
                                    if (lstyle === "trophy") return <Trophy className="w-3.5 h-3.5 text-red-600" />;
                                    if (lstyle === "award") return <Award className="w-3.5 h-3.5 text-red-600" />;
                                    if (lstyle === "star") return <Star className="w-3.5 h-3.5 text-red-600" />;
                                    if (lstyle === "shield") return <Shield className="w-3.5 h-3.5 text-red-600" />;
                                    if (lstyle === "heart") return <Heart className="w-3.5 h-3.5 text-red-600" />;
                                    return <Flag className="w-3.5 h-3.5 text-red-600" />;
                                  })()
                                )}
                              </div>
                            </div>
                          )}
                          <div className="space-y-0.5 text-left flex-1 min-w-0">
                            <h2 className="text-[7.5px] font-bold uppercase tracking-widest text-red-100 truncate">
                              {kopLine1}
                            </h2>
                            <h1 className="text-[10px] font-extrabold uppercase tracking-wide text-white leading-none truncate">
                              {kopLine2}
                            </h1>
                            <p className="text-[7.5px] text-red-50/90 italic leading-tight truncate">
                              {kopLine3}
                            </p>
                            <p className="text-[7px] text-red-100/80 leading-tight truncate">
                              {kopLine4}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    // 3. ELEGANT BADGE LAYOUT
                    if (style === "elegant-badge") {
                      return (
                        <div className="text-center space-y-0.5 pb-1.5 border-b-2 border-double border-slate-800 border-t-4 border-red-600 pt-2.5 relative">
                          {logoStyle !== 'none' && (
                            <div className="absolute top-2.5 left-1">
                              {renderLogoPreview(false)}
                            </div>
                          )}
                          <div className="px-8">
                            <h2 className="text-[8px] font-bold uppercase tracking-wider text-red-600 truncate">
                              {kopLine1}
                            </h2>
                            <h1 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-800 leading-none truncate">
                              {kopLine2}
                            </h1>
                            <p className="text-[7.5px] text-slate-500 italic truncate">
                              {kopLine3}
                            </p>
                            <p className="text-[7px] text-slate-400 tracking-wide truncate">
                              {kopLine4}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    // 4. DOUBLE LOGO SYMMETRIC
                    if (style === "double-logo") {
                      return (
                        <div className="text-center space-y-0.5 pb-1.5 border-b-2 border-double border-slate-800 relative">
                          {logoStyle !== 'none' && (
                            <>
                              <div className="absolute top-2 left-1">
                                {renderLogoPreview(false)}
                              </div>
                              <div className="absolute top-2 right-1">
                                {renderLogoPreview(true)}
                              </div>
                            </>
                          )}
                          <div className="px-10">
                            <h2 className="text-[8px] font-bold uppercase tracking-wider text-red-600 truncate">
                              {kopLine1}
                            </h2>
                            <h1 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-800 leading-none truncate">
                              {kopLine2}
                            </h1>
                            <p className="text-[7.5px] text-slate-500 italic truncate">
                              {kopLine3}
                            </p>
                            <p className="text-[7px] text-slate-400 tracking-wide truncate">
                              {kopLine4}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    // 5. STANDARD CLASSIC CENTERED
                    return (
                      <div className="text-center space-y-0.5 pb-1.5 border-b-2 border-double border-slate-800 relative">
                        {logoStyle !== 'none' && (
                          <div className="absolute top-2 left-1">
                            {renderLogoPreview(false)}
                          </div>
                        )}
                        <div className="px-10">
                          <h2 className="text-[8px] font-bold uppercase tracking-wider text-red-600 truncate">
                            {kopLine1}
                          </h2>
                          <h1 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-800 leading-none truncate">
                            {kopLine2}
                          </h1>
                          <p className="text-[7.5px] text-slate-500 italic truncate">
                            {kopLine3}
                          </p>
                          <p className="text-[7px] text-slate-400 tracking-wide truncate">
                            {kopLine4}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[10px] text-slate-600 leading-normal">
                  <span className="font-bold text-slate-700 block mb-0.5">💡 Cara Kerja Master Kop Surat</span>
                  Desain dan logo yang Anda konfigurasikan di sini akan menjadi **standar kepala surat utama** di seluruh wilayah RW 04 Ngabean. Dokumen baru akan langsung otomatis menggunakan kop ini tanpa perlu disesuaikan manual.
                </div>
              </div>
            </div>
          </div>

          {/* Master Tanda Tangan & Stempel Resmi Section */}
          <div className="border-t border-slate-200 pt-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-red-600" />
                  Master Tanda Tangan & Stempel Resmi
                </h3>
                <p className="text-[10px] text-slate-500">
                  Unggah gambar tanda tangan digital dan stempel resmi organisasi untuk disematkan langsung pada dokumen surat secara otomatis.
                </p>
              </div>
              <span className="text-[9px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 self-start sm:self-center">
                TANDA TANGAN & STEMPEL
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. Stempel Resmi */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between space-y-3.5">
                <div className="space-y-1">
                  <span className="text-[9.5px] font-extrabold text-red-600 uppercase tracking-widest block">1. Stempel Resmi RW 04</span>
                  <span className="text-[9px] text-slate-400 block">Stempel panitia/RW untuk validasi dokumen.</span>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center min-h-[110px] border-2 border-dashed border-slate-200 hover:border-red-500 rounded-xl p-2.5 bg-slate-50/30 transition-all text-center relative group">
                  {stempelUrl ? (
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <img 
                        src={stempelUrl} 
                        alt="Stempel Resmi" 
                        className="max-w-full max-h-full object-contain mix-blend-multiply" 
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setStempelUrl("")}
                        className="absolute -top-2 -right-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-full p-1 shadow-2xs cursor-pointer z-20"
                      >
                        <span className="text-[9px] font-extrabold px-1">X</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) setStempelUrl(event.target.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-red-500 mb-1" />
                      <span className="text-[10px] font-bold text-slate-700">Unggah Gambar</span>
                      <span className="text-[8px] text-slate-400">Transparan PNG disarankan</span>
                    </>
                  )}
                </div>
                
                <div className="h-9"></div> {/* Spacer to align with text fields */}
              </div>

              {/* 2. Tanda Tangan Ketua */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between space-y-3.5">
                <div className="space-y-1">
                  <span className="text-[9.5px] font-extrabold text-slate-700 uppercase tracking-widest block">2. Tanda Tangan Ketua</span>
                  <span className="text-[9px] text-slate-400 block">Tanda tangan Ketua Panitia / RW.</span>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center min-h-[110px] border-2 border-dashed border-slate-200 hover:border-red-500 rounded-xl p-2.5 bg-slate-50/30 transition-all text-center relative group">
                  {signatureKetuaUrl ? (
                    <div className="relative w-24 h-16 flex items-center justify-center">
                      <img 
                        src={signatureKetuaUrl} 
                        alt="Tanda Tangan Ketua" 
                        className="max-w-full max-h-full object-contain mix-blend-multiply" 
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setSignatureKetuaUrl("")}
                        className="absolute -top-2 -right-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-full p-1 shadow-2xs cursor-pointer z-20"
                      >
                        <span className="text-[9px] font-extrabold px-1">X</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) setSignatureKetuaUrl(event.target.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-red-500 mb-1" />
                      <span className="text-[10px] font-bold text-slate-700">Unggah Gambar</span>
                      <span className="text-[8px] text-slate-400">Pindai tanda tangan di kertas putih</span>
                    </>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Nama Ketua</label>
                  <input
                    type="text"
                    value={signatureKetuaName}
                    onChange={(e) => setSignatureKetuaName(e.target.value)}
                    placeholder="Contoh: Fx. Mawardi"
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded px-2 py-1 bg-white"
                  />
                </div>
              </div>

              {/* 3. Tanda Tangan Bendahara */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between space-y-3.5">
                <div className="space-y-1">
                  <span className="text-[9.5px] font-extrabold text-slate-700 uppercase tracking-widest block">3. Tanda Tangan Bendahara</span>
                  <span className="text-[9px] text-slate-400 block">Tanda tangan Bendahara Panitia.</span>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center min-h-[110px] border-2 border-dashed border-slate-200 hover:border-red-500 rounded-xl p-2.5 bg-slate-50/30 transition-all text-center relative group">
                  {signatureBendaharaUrl ? (
                    <div className="relative w-24 h-16 flex items-center justify-center">
                      <img 
                        src={signatureBendaharaUrl} 
                        alt="Tanda Tangan Bendahara" 
                        className="max-w-full max-h-full object-contain mix-blend-multiply" 
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setSignatureBendaharaUrl("")}
                        className="absolute -top-2 -right-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-full p-1 shadow-2xs cursor-pointer z-20"
                      >
                        <span className="text-[9px] font-extrabold px-1">X</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) setSignatureBendaharaUrl(event.target.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-red-500 mb-1" />
                      <span className="text-[10px] font-bold text-slate-700">Unggah Gambar</span>
                      <span className="text-[8px] text-slate-400">Pindai tanda tangan di kertas putih</span>
                    </>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Nama Bendahara</label>
                  <input
                    type="text"
                    value={signatureBendaharaName}
                    onChange={(e) => setSignatureBendaharaName(e.target.value)}
                    placeholder="Contoh: Heri Prasetyo"
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded px-2 py-1 bg-white"
                  />
                </div>
              </div>

              {/* 4. Tanda Tangan Sekretaris */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between space-y-3.5">
                <div className="space-y-1">
                  <span className="text-[9.5px] font-extrabold text-slate-700 uppercase tracking-widest block">4. Tanda Tangan Sekretaris</span>
                  <span className="text-[9px] text-slate-400 block">Tanda tangan Sekretaris Panitia.</span>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center min-h-[110px] border-2 border-dashed border-slate-200 hover:border-red-500 rounded-xl p-2.5 bg-slate-50/30 transition-all text-center relative group">
                  {signatureSekretarisUrl ? (
                    <div className="relative w-24 h-16 flex items-center justify-center">
                      <img 
                        src={signatureSekretarisUrl} 
                        alt="Tanda Tangan Sekretaris" 
                        className="max-w-full max-h-full object-contain mix-blend-multiply" 
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setSignatureSekretarisUrl("")}
                        className="absolute -top-2 -right-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-full p-1 shadow-2xs cursor-pointer z-20"
                      >
                        <span className="text-[9px] font-extrabold px-1">X</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) setSignatureSekretarisUrl(event.target.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-red-500 mb-1" />
                      <span className="text-[10px] font-bold text-slate-700">Unggah Gambar</span>
                      <span className="text-[8px] text-slate-400">Pindai tanda tangan di kertas putih</span>
                    </>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Nama Sekretaris</label>
                  <input
                    type="text"
                    value={signatureSekretarisName}
                    onChange={(e) => setSignatureSekretarisName(e.target.value)}
                    placeholder="Contoh: Tri Setiawan"
                    className="w-full text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded px-2 py-1 bg-white"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Error/Success Prompt and Submit Button */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-bold uppercase tracking-wide animate-bounce">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Konfigurasi SEMS Berhasil Disimpan!</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              id="btn-save-settings"
              disabled={isSaving}
              className="flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold px-3.5 py-2 rounded shadow-xs transition-all duration-200 disabled:opacity-50 uppercase tracking-wide"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? "Menyimpan..." : "Simpan Konfigurasi"}
            </button>
          </div>

        </form>

        {/* Section: Migrasi & Backup Data */}
        <div className="mt-8 border-t border-slate-200 pt-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Database className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Migrasi & Cadangan Data (Ekspor / Impor JSON)
            </h3>
          </div>
          
          <p className="text-xs text-slate-500 leading-relaxed">
            Fitur ini sangat berguna jika Anda telah melakukan pengisian data atau konfigurasi di komputer lokal (<strong>localhost</strong>) dan ingin memindahkannya ke sini (atau sebaliknya) secara instan tanpa perlu mengetik ulang dari awal.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            
            {/* CARD 1: EKSPOR DATA */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  1. Ekspor Data (Unduh Cadangan)
                </span>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Unduh seluruh database kepanitiaan saat ini ke dalam satu file format <code>.json</code> yang aman di komputer Anda.
                </p>
              </div>

              {/* Data Summary Stats */}
              <div className="bg-white rounded-lg p-2.5 border border-slate-200/60 grid grid-cols-3 gap-2 text-center">
                <div className="p-1">
                  <span className="block text-xs font-bold text-slate-800 font-mono">
                    {semsData?.panitia?.length || 0}
                  </span>
                  <span className="text-[9px] text-slate-400 block uppercase font-semibold">Panitia</span>
                </div>
                <div className="p-1 border-x border-slate-100">
                  <span className="block text-xs font-bold text-slate-800 font-mono">
                    {semsData?.rkba?.length || 0}
                  </span>
                  <span className="text-[9px] text-slate-400 block uppercase font-semibold">RKBA</span>
                </div>
                <div className="p-1">
                  <span className="block text-xs font-bold text-slate-800 font-mono">
                    {semsData?.keuangan?.length || 0}
                  </span>
                  <span className="text-[9px] text-slate-400 block uppercase font-semibold">Transaksi</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportData}
                disabled={isExporting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
              >
                <Download className="w-3.5 h-3.5" />
                {isExporting ? "Mengekspor..." : "Unduh File Cadangan (.json)"}
              </button>
            </div>

            {/* CARD 2: IMPOR DATA */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  2. Impor Data (Pulihkan dari File)
                </span>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Pilih file cadangan JSON yang telah Anda unduh dari komputer lokal Anda untuk dipulihkan sepenuhnya di platform ini.
                </p>
              </div>

              {/* Status Feedback */}
              <div className="min-h-[46px] flex flex-col justify-center">
                {importSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 text-center text-[10px] text-emerald-800 font-bold leading-normal">
                    ✓ Sukses! Seluruh data kepanitiaan berhasil diimpor & disinkronisasikan.
                  </div>
                )}
                {importError && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-2 text-center text-[10px] text-red-800 font-bold leading-normal">
                    ⚠ Gagal: {importError}
                  </div>
                )}
                {!importSuccess && !importError && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 text-center text-[9px] text-amber-800 leading-normal font-semibold">
                    ⚠ PERINGATAN: Proses impor akan menimpa dan mengganti seluruh data saat ini!
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    disabled={isImporting || isRestoringMD}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    disabled={isImporting || isRestoringMD}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-3xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isImporting ? "Mengimpor..." : "Pilih & Unggah File (.json)"}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowPasteArea(!showPasteArea)}
                    className="text-[10px] text-slate-500 hover:text-slate-800 font-bold underline transition-colors cursor-pointer"
                  >
                    {showPasteArea ? "Tutup Tempel Teks" : "Atau Tempel Teks db.json"}
                  </button>
                </div>

                {showPasteArea && (
                  <div className="space-y-2 pt-1 border-t border-slate-200 mt-2">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">
                      Tempel Isi file db.json Anda di bawah:
                    </label>
                    <textarea
                      rows={4}
                      value={pastedJson}
                      onChange={(e) => setPastedJson(e.target.value)}
                      placeholder='Contoh: { "settings": { ... }, "panitia": [], ... }'
                      className="w-full bg-white text-[10px] font-mono border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleImportPastedData}
                      disabled={isImporting || !pastedJson.trim()}
                      className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold text-xs py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      Kirim & Pulihkan Data
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* CARD 3: Master Markdown Auto-Recovery & Backup System */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4.5 rounded-xl border border-indigo-900 text-white space-y-3.5 shadow-sm mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    Master Backup Markdown & Pemulihan Instan
                    <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-2 py-0.5 rounded-full font-mono border border-emerald-400/30 font-semibold">
                      Resilient Engine
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    File master <code>DATA_MASTER_SEMS_RW04.md</code> tersimpan di dalam sistem. Jika file database sewaktu-waktu terhapus, server akan otomatis memulihkan data dari file Markdown ini tanpa perlu upload ulang.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleRestoreFromMasterMD}
                disabled={isRestoringMD || isImporting}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-white font-bold text-xs py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRestoringMD ? 'animate-spin' : ''}`} />
                {isRestoringMD ? "Sedang Memulihkan Database..." : "Pulihkan Instan dari Master Markdown (.md)"}
              </button>

              <a
                href="/api/sems/download-backup-md"
                download="DATA_MASTER_SEMS_RW04.md"
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-center"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                Unduh Master File Markdown (.md)
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
