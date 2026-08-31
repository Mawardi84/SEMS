export type ActivityStatus = 
  | 'RENCANA' 
  | 'BERJALAN' 
  | 'SELESAI' 
  | 'DITAMBAHKAN' 
  | 'DITIADAKAN' 
  | 'DIALIHKAN' 
  | 'DIGABUNGKAN'
  | 'Perencanaan' 
  | 'Persiapan' 
  | 'Pelaksanaan' 
  | 'Selesai';

export type ChangeType = 
  | 'DITAMBAHKAN' 
  | 'DITIADAKAN' 
  | 'PERUBAHAN NILAI' 
  | 'DIGABUNGKAN';

export type ApprovalStatus = 
  | 'DRAFT' 
  | 'DIAJUKAN' 
  | 'DISETUJUI' 
  | 'DITOLAK' 
  | 'CANCELLED';

export interface BudgetChange {
  id: string;
  changeNumber: string; // e.g. "PA-2026-001"
  date: string;
  activityId: string;
  activityCode?: string;
  activityName: string;
  seksi: string;
  changeType: ChangeType;
  initialAmount: number;     // Nilai sebelum perubahan
  changeAmount: number;      // Nilai nominal perubahan (+/-)
  revisedAmount: number;     // Nilai setelah perubahan
  reason: string;
  decisionBasis: string;
  meetingMinutesId?: string; // Tautan ke Notulensi Rapat
  meetingMinutesNumber?: string;
  proposedBy: string;
  approvedBy?: string;
  approvalDate?: string;
  status: ApprovalStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetReallocation {
  id: string;
  reallocationNumber: string; // e.g. "RA-2026-001"
  date: string;
  sourceActivityId: string;
  sourceActivityName: string;
  sourceSeksi: string;
  targetActivityId: string;
  targetActivityName: string;
  targetSeksi: string;
  availableAmount: number;   // Dana tersedia di sumber saat transaksi
  amount: number;            // Nilai yang dialihkan
  remainingAmount: number;   // Sisa dana di sumber setelah pengalihan
  reason: string;
  decisionBasis?: string;
  meetingMinutesId?: string; // Tautan ke Notulensi Rapat
  meetingMinutesNumber?: string;
  proposedBy?: string;
  approvedBy?: string;
  approvalDate?: string;
  status: ApprovalStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditTrailRecord {
  id: string;
  timestamp: string;
  entityType: 'RAB' | 'PERUBAHAN' | 'REALOKASI' | 'REALISASI' | 'NOTULENSI' | 'LPJ';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'CANCEL';
  actor: string;
  previousState?: string;
  newState: string;
  reason: string;
  details?: string;
}

export type AuditTrail = AuditTrailRecord;

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
  activityCode?: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
  status: ActivityStatus;
}

export interface RKBAItem {
  id: string;
  activityCode?: string;
  kegiatanId?: string;
  name: string;
  seksi: string;
  qty: number;
  unit: string;
  price: number;
  total: number;
  fundingSource: 'Kas Utama' | 'Donasi Warga' | 'Iuran RT' | 'Sponsorship' | 'Kas Donatur' | string;
  status: 'Draft' | 'Disetujui' | 'Ditolak' | 'Belanja' | 'DITAMBAHKAN' | 'DITIADAKAN' | 'DIALIHKAN' | 'DIGABUNGKAN';
  activityStatus?: ActivityStatus;
  isLockedBaseline?: boolean;
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
  activityId?: string;
  activityName?: string;
  seksi?: string;
  vendor?: string;
  proofNumber?: string;
  paymentMethod?: 'Tunai' | 'Transfer' | 'QRIS' | 'Lainnya';
  proofStatus?: 'Lengkap' | 'Belum Lengkap' | 'Tanpa Bukti';
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
  minutesNumber?: string; // e.g. "NR-2026-001"
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
  linkedBudgetChanges?: string[]; // IDs of BudgetChange linked
  linkedReallocations?: string[]; // IDs of BudgetReallocation linked
  createdAt: string;
}

export interface DigitalDocument {
  id: string;
  title: string;
  category: 'Surat' | 'Proposal' | 'Kuitansi' | 'SK Panitia' | 'Struktur Organisasi' | 'Dokumentasi' | 'Lainnya';
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

export type LPJRole = 'KETUA_PANITIA' | 'SEKRETARIS' | 'BENDAHARA' | 'RW' | 'LAINNYA';

export type LPJStatus = 
  | 'DRAFT' 
  | 'DIPERIKSA' 
  | 'SIAP_DISAMPAIKAN' 
  | 'DISAMPAIKAN' 
  | 'DISETUJUI' 
  | 'DIARSIPKAN';

export type LPJSectionType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export interface LPJSection {
  id: string;
  lpjId?: string;
  sectionType: LPJSectionType;
  sectionCode: string; // e.g. "A", "B", "C"
  sectionTitle: string;
  responsibleRole: LPJRole;
  presenterRole: LPJRole;
  presenterUserId?: string;
  presenterNameSnapshot: string;
  sequence: number;
  status: 'DRAFT' | 'DIPERIKSA' | 'SIAP' | 'SELESAI';
  notes?: string;
  contentDraft?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LPJMaster {
  id: string;
  docNumber: string; // e.g. "LPJ-HUT81-RW04-2026"
  title: string;
  eventDate: string;
  status: LPJStatus;
  isReconciled: boolean;
  reconciliationNotes?: string;
  sections: LPJSection[];
  ketuaNameSnapshot: string;
  sekretarisNameSnapshot: string;
  bendaharaNameSnapshot: string;
  rwNameSnapshot: string;
  approvalDate?: string;
  approvedByRW?: string;
  speechScripts?: {
    ketua?: string;
    sekretaris?: string;
    bendahara?: string;
  };
  meetingMinutesId?: string;
  createdAt: string;
  updatedAt: string;
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
  budgetChanges?: BudgetChange[];
  budgetReallocations?: BudgetReallocation[];
  auditTrails?: AuditTrailRecord[];
  lpj?: LPJMaster;
}
