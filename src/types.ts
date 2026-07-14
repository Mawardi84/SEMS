export interface SystemSetting {
  id: string;
  rtList: string[];
  seksiList: string[];
  targetIuranPerRT: number;
  paguAnggaranSeksi: Record<string, number>;
  sheetId: string;
  sheetApiKey: string;
  themeColor: string;
  kopLine1?: string;
  kopLine2?: string;
  kopLine3?: string;
  kopLine4?: string;
  logoStyle?: string;
  logoUrl?: string;
  kopStyle?: string;
  stempelUrl?: string;
  signatureKetuaUrl?: string;
  signatureKetuaName?: string;
  signatureBendaharaUrl?: string;
  signatureBendaharaName?: string;
  signatureSekretarisUrl?: string;
  signatureSekretarisName?: string;
}

export interface Panitia {
  id: string;
  name: string;
  role: string;
  phone: string;
  rt: string;
  seksi: string;
}

export interface Kegiatan {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
  status: 'Perencanaan' | 'Persiapan' | 'Pelaksanaan' | 'Selesai';
}

export interface RKBAItem {
  id: string;
  name: string;
  seksi: string;
  qty: number;
  unit: string;
  price: number;
  total: number;
  fundingSource: 'Kas Utama' | 'Donasi Warga' | 'Iuran RT' | 'Sponsorship';
  status: 'Draft' | 'Disetujui' | 'Ditolak' | 'Belanja';
  notes: string;
  dateAdded: string;
}

export interface KeuanganTransaction {
  id: string;
  type: 'Masuk' | 'Keluar';
  date: string;
  category: string;
  amount: number;
  notes: string;
  refId?: string; // Links to RKBA ID or Natura ID if any
}

export interface SeksiTask {
  id: string;
  seksi: string;
  taskName: string;
  status: 'Belum' | 'Proses' | 'Selesai';
  assignedTo: string;
  deadline: string;
}

export interface RTContribution {
  rt: string;
  iuranCollected: number;
  targetIuran: number;
  wargaCount: number;
}

export interface ActionItem {
  id: string;
  task: string;
  pic: string;
  deadline: string;
}

export interface Notulensi {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  leader: string;
  attendeesCount: number;
  attendeesList: string;
  agenda: string;
  notesRaw: string;
  contentMarkdown: string;
  decisions: string;
  actionItems: ActionItem[];
  createdAt: string;
}

export interface DigitalDocument {
  id: string;
  title: string;
  category: 'Surat' | 'Proposal' | 'Kuitansi' | 'SK Panitia' | 'Dokumentasi' | 'Lainnya';
  description: string;
  fileUrl?: string;
  fileName: string;
  fileSize?: string;
  fileType: string;
  uploadDate: string;
  uploadedBy: string;
  notes?: string;
}

export interface UndanganRapat {
  id: string;
  letterNumber: string;
  subject: string;
  date: string;
  time: string;
  location: string;
  agenda: string;
  notes?: string;
  recipients: string[];
  signatoryName: string;
  signatoryRole: string;
  signatoryName2?: string;
  signatoryRole2?: string;
  signatoryName3?: string;
  signatoryRole3?: string;
  createdAt: string;
  contentMarkdown?: string;
  kopLine1?: string;
  kopLine2?: string;
  kopLine3?: string;
  kopLine4?: string;
  logoStyle?: string;
  logoUrl?: string;
  kopStyle?: string;
  useMasterKop?: boolean;
  showKetuaSignature?: boolean;
  showBendaharaSignature?: boolean;
  showSekretarisSignature?: boolean;
  showStempel?: boolean;
}

export interface SEMSData {
  settings: SystemSetting;
  panitia: Panitia[];
  kegiatan: Kegiatan[];
  rkba: RKBAItem[];
  keuangan: KeuanganTransaction[];
  tasks: SeksiTask[];
  notulensi: Notulensi[];
  documents?: DigitalDocument[];
  undangan?: UndanganRapat[];
}
