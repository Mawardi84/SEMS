export interface SystemSetting {
  id: string;
  rtList: string[];
  seksiList: string[];
  targetIuranPerRT: number;
  paguAnggaranSeksi: Record<string, number>;
  sheetId: string;
  sheetApiKey: string;
  themeColor: string;
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

export interface NaturaItem {
  id: string;
  donorName: string;
  rt: string;
  item: string;
  qty: number;
  unit: string;
  estimatedValue: number;
  allocation: string; // Target Seksi or Kegiatan
  date: string;
  notes: string;
}

export interface KeuanganTransaction {
  id: string;
  type: 'Masuk' | 'Keluar';
  date: string;
  category: 'Iuran RT' | 'Donasi Tunai' | 'Sponsorship' | 'RKBA Belanja' | 'Operasional';
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
  naturaCount: number;
  wargaCount: number;
}

export interface SEMSData {
  settings: SystemSetting;
  panitia: Panitia[];
  kegiatan: Kegiatan[];
  rkba: RKBAItem[];
  natura: NaturaItem[];
  keuangan: KeuanganTransaction[];
  tasks: SeksiTask[];
}
