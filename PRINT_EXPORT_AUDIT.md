# Audit: Implementasi Fitur Print & Export

## 🎯 Goal
Menambahkan fitur "Print Preview" dan "Export" pada tampilan dokumen Proposal untuk memudahkan pengguna.

## 🔍 Analisis
- Fitur `Export` (PDF) sudah ada namun perlu diintegrasikan kembali ke UI dengan jelas.
- Fitur `Print` perlu ditambahkan untuk mencetak langsung melalui *browser dialog*.
- Keduanya membutuhkan akses ke elemen dengan ID `printable-lpj-paper` yang sudah disiapkan di `DocumentPreviewRenderer.tsx`.

## 🛠️ Langkah Implementasi
1.  **Investigasi**: Memeriksa implementasi `exportToPDF` yang sudah ada di `ProposalView.tsx`.
2.  **UI Implementation**: Menambahkan tombol "Print" dan "Export PDF" di panel kontrol atau area atas preview dokumen.
3.  **Print Logic**: Menambahkan fungsi `window.print()` untuk fitur cetak.
4.  **Export Logic**: Menghubungkan tombol "Export" dengan fungsi `exportToPDF` yang sudah ada.
5.  **Styling**: Memastikan tombol-tombol tersebut tidak muncul saat diprint (menggunakan class `print:hidden` di Tailwind).

## ✅ Checklist Verifikasi
- [ ] Tombol "Print" muncul di UI.
- [ ] Tombol "Print" memicu dialog cetak browser.
- [ ] Tombol "Export" muncul di UI.
- [ ] Tombol "Export" mendownload dokumen PDF dengan benar.
- [ ] Tombol-tombol UI tidak terlihat di hasil cetak/PDF.
