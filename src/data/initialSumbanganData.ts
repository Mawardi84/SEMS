import { SumbanganRecord } from '../types';

export const initialSumbanganData: SumbanganRecord[] = [
  // 1. Iuran Swadaya 4 RT (Rp 8.000.000) - Diterima via Talangan Pamsimas 18 Juli 2026
  {
    id: 'smb-rt-01',
    donorType: 'RT',
    donorName: 'Swadaya Warga RT 01 Ngabean',
    category: 'Dana Tunai',
    amount: 2000000,
    date: '2026-07-18',
    receiptNumber: 'KWT-RT01-0726',
    receivedBy: 'Dias Ayu',
    contactPerson: 'Pengurus RT 01',
    notes: 'Sumbangan iuran swadaya RT 01 (Pelunasan dana talangan Pamsimas)',
    status: 'Terverifikasi'
  },
  {
    id: 'smb-rt-02',
    donorType: 'RT',
    donorName: 'Swadaya Warga RT 02 Ngabean',
    category: 'Dana Tunai',
    amount: 2000000,
    date: '2026-07-18',
    receiptNumber: 'KWT-RT02-0726',
    receivedBy: 'Dias Ayu',
    contactPerson: 'Pengurus RT 02',
    notes: 'Sumbangan iuran swadaya RT 02 (Pelunasan dana talangan Pamsimas)',
    status: 'Terverifikasi'
  },
  {
    id: 'smb-rt-03',
    donorType: 'RT',
    donorName: 'Swadaya Warga RT 03 Ngabean',
    category: 'Dana Tunai',
    amount: 2000000,
    date: '2026-07-18',
    receiptNumber: 'KWT-RT03-0726',
    receivedBy: 'Dias Ayu',
    contactPerson: 'Pengurus RT 03',
    notes: 'Sumbangan iuran swadaya RT 03 (Pelunasan dana talangan Pamsimas)',
    status: 'Terverifikasi'
  },
  {
    id: 'smb-rt-04',
    donorType: 'RT',
    donorName: 'Swadaya Warga RT 04 Ngabean',
    category: 'Dana Tunai',
    amount: 2000000,
    date: '2026-07-18',
    receiptNumber: 'KWT-RT04-0726',
    receivedBy: 'Dias Ayu',
    contactPerson: 'Pengurus RT 04',
    notes: 'Sumbangan iuran swadaya RT 04 (Pelunasan dana talangan Pamsimas)',
    status: 'Terverifikasi'
  },

  // 2. Hibah Sukarela Pamsimas RW 04 (Rp 2.000.000) - Diterima 18 Juli 2026
  {
    id: 'smb-pms-01',
    donorType: 'Pamsimas',
    donorName: 'Pengelola Pamsimas Tirta Mandiri RW 04',
    category: 'Dana Tunai',
    amount: 2000000,
    date: '2026-07-18',
    receiptNumber: 'KWT-PMS-0726',
    receivedBy: 'Dias Ayu',
    contactPerson: 'Bpk. Pengelola Pamsimas',
    notes: 'Hibah murni / sumbangan sukarela pengelola Pamsimas untuk perayaan HUT RI Ke-81',
    status: 'Terverifikasi'
  },

  // 3. Sponsor Resmi (Prettywear, Selo Agung, Apotek Gunungpati, BnD Shop, Ngrembel Asri, UMKM)
  {
    id: 'smb-sp-01',
    donorType: 'Sponsor Resmi',
    donorName: 'Prettywear (Sponsor Utama)',
    category: 'Dana Tunai',
    amount: 2000000,
    itemDescription: 'Cash Sponsorship Rp 2.000.000 + Hadiah Utama 1 Unit Mesin Cuci 2 Tabung',
    date: '2026-08-06',
    receiptNumber: 'KWT-PW-0826',
    receivedBy: 'Dias Ayu',
    contactPerson: 'Manajemen Prettywear',
    notes: 'Sponsorship utama tunai + Mesin Cuci Doorprize Jalan Sehat (BKM-BD-03)',
    status: 'Terverifikasi'
  },
  {
    id: 'smb-sp-02',
    donorType: 'Sponsor Resmi',
    donorName: 'Selo Agung',
    category: 'Dana Tunai',
    amount: 500000,
    date: '2026-08-12',
    receiptNumber: 'KWT-SA-0826',
    receivedBy: 'Dias Ayu',
    contactPerson: 'Pimpinan Selo Agung',
    notes: 'Sponsorship tunai operasional panggung & hadiah (BKM-BD-04)',
    status: 'Terverifikasi'
  },
  {
    id: 'smb-sp-03',
    donorType: 'Sponsor Resmi',
    donorName: 'Apotek Gunungpati',
    category: 'Dana Tunai',
    amount: 300000,
    date: '2026-08-24',
    receiptNumber: 'KWT-AG-0826',
    receivedBy: 'Dias Ayu',
    contactPerson: 'Pengelola Apotek',
    notes: 'Sponsorship tunai pendukung jalan sehat (BKM-BD-07)',
    status: 'Terverifikasi'
  },
  {
    id: 'smb-sp-04',
    donorType: 'Sponsor Resmi',
    donorName: 'BnD Shop',
    category: 'Barang / Doorprize',
    amount: 0,
    itemDescription: 'Voucher Doorprize & Paket Souvenir Pemenang Lomba',
    date: '2026-08-15',
    receiptNumber: 'KWT-BND-0826',
    receivedBy: 'Dias Ayu',
    contactPerson: 'Owner BnD Shop',
    notes: 'Sponsor resmi paket hadiah lomba & voucher doorprize',
    status: 'Terverifikasi'
  },
  {
    id: 'smb-sp-05',
    donorType: 'Sponsor Resmi',
    donorName: 'Ngrembel Asri',
    category: 'Jasa / Hibah',
    amount: 0,
    itemDescription: 'Voucher Fasilitas Rekreasi & Tiket Masuk Wisata',
    date: '2026-08-18',
    receiptNumber: 'KWT-NGA-0826',
    receivedBy: 'Dias Ayu',
    contactPerson: 'Manajemen Ngrembel Asri',
    notes: 'Sponsor resmi tiket doorprize wisata warga',
    status: 'Terverifikasi'
  },
  {
    id: 'smb-sp-06',
    donorType: 'UMKM',
    donorName: 'UMKM Kuliner Warga RW 04',
    category: 'Logistik / Konsumsi',
    amount: 0,
    itemDescription: 'Paket Konsumsi Bazar & Voucher Produk Makanan Ringan',
    date: '2026-08-23',
    receiptNumber: 'KWT-UMKM-0826',
    receivedBy: 'Dias Ayu',
    contactPerson: 'Koordinator UMKM RW 04',
    notes: 'Partisipasi bazar UMKM & konsumsi panitia lapangan',
    status: 'Terverifikasi'
  },

  // 4. Donatur Dermawan & Simpatisan Warga
  {
    id: 'smb-dn-01',
    donorType: 'Donatur Warga',
    donorName: 'Mas Agung',
    category: 'Transfer Bank',
    amount: 300000,
    date: '2026-07-20',
    receiptNumber: 'KWT-DN-001',
    receivedBy: 'Dias Ayu',
    contactPerson: 'Mas Agung',
    notes: 'Donasi transfer bank kas dana usaha kepanitiaan (BKM-BD-01)',
    status: 'Terverifikasi'
  },
  {
    id: 'smb-dn-02',
    donorType: 'Donatur Warga',
    donorName: 'Jihan',
    category: 'Dana Tunai',
    amount: 200000,
    date: '2026-08-09',
    receiptNumber: 'KWT-DN-002',
    receivedBy: 'Dias Ayu',
    contactPerson: 'Mbak Jihan',
    notes: 'Donasi tunai simpatisan warga (BKM-BD-02)',
    status: 'Terverifikasi'
  },
  {
    id: 'smb-dn-03',
    donorType: 'Donatur Warga',
    donorName: 'Mas Adi',
    category: 'Dana Tunai',
    amount: 200000,
    date: '2026-08-12',
    receiptNumber: 'KWT-DN-003',
    receivedBy: 'Dias Ayu',
    contactPerson: 'Mas Adi',
    notes: 'Donasi tunai pendukung acara malam tirakatan (BKM-BD-05)',
    status: 'Terverifikasi'
  },
  {
    id: 'smb-dn-04',
    donorType: 'Donatur Warga',
    donorName: 'Warung Satinah',
    category: 'Dana Tunai',
    amount: 200000,
    date: '2026-08-24',
    receiptNumber: 'KWT-DN-004',
    receivedBy: 'Dias Ayu',
    contactPerson: 'Ibu Satinah',
    notes: 'Donasi tunai pelaku usaha lingkungan RW 04 (BKM-BD-06)',
    status: 'Terverifikasi'
  },
  {
    id: 'smb-dn-05',
    donorType: 'Donatur Warga',
    donorName: 'Jarwo Motor',
    category: 'Dana Tunai',
    amount: 100000,
    date: '2026-08-24',
    receiptNumber: 'KWT-DN-005',
    receivedBy: 'Dias Ayu',
    contactPerson: 'Bpk. Jarwo',
    notes: 'Donasi tunai simpatisan bengkel warga RW 04 (BKM-BD-08)',
    status: 'Terverifikasi'
  },

  // 5. Kembalian Uang Tarling (Efisiensi Buku Kas 1 disetorkan ke Kas Donasi)
  {
    id: 'smb-trl-01',
    donorType: 'Pengembalian Efisiensi',
    donorName: 'Kembalian Uang Tarling (Sisa Buku 1)',
    category: 'Pengembalian Dana',
    amount: 200000,
    date: '2026-08-24',
    receiptNumber: 'KWT-TRL-0826',
    receivedBy: 'Dias Ayu',
    contactPerson: 'Grup Tarling / Seksi Acara',
    notes: 'Kembalian efisiensi honor pentas seni Tarling dari Kas 1 dialihkan ke Kas Donasi (BKM-BD-09)',
    status: 'Terverifikasi'
  }
];
