# Sprint 3: Pengoptimalan Dokumen & Peningkatan Kualitas

## 📋 Ringkasan
Fokus utama pada Sprint 3 adalah melakukan pembersihan kode (refactoring) untuk mengurangi duplikasi pada sistem *preview* dokumen dan meningkatkan efisiensi aplikasi.

## 🚀 Fitur & Perbaikan
- **Ekstraksi Renderer Dokumen**: Menggabungkan logika *rendering* dokumen (Proposal/LPJ) ke dalam `DocumentPreviewRenderer.tsx` untuk menghilangkan ~900 baris kode duplikat.
- **Code-Splitting**: Memecah komponen besar untuk mengurangi *bundle size* secara signifikan (~2MB).
- **Validasi Otomatis**: Menambahkan validasi data wajib (Nama Kegiatan, Ketua Panitia, Ketua RW) sebelum melakukan *export* PDF.
- **Peningkatan Visual**: Menambahkan fitur stempel digital pada dokumen untuk kesan formal.

## ✅ Verifikasi Manual
1. **Dokumen Proposal & Monitoring/LPJ**: Buka kedua menu tersebut.
2. **Generasi Draf**: Klik tombol *generate* (draf lokal).
3. **Pengecekan**: 
    - Pastikan Nama Panitia terisi otomatis di LPJ.
    - Pastikan panel rekonsiliasi RAB muncul dengan benar.
4. **Export**: Coba lakukan *export* PDF dan pastikan validasi berjalan (menampilkan *alert* jika data kurang).
