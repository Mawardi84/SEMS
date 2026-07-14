# Audit Proposal View

## 🎯 Goal
Melakukan investigasi dan perbaikan pada fitur Preview Dokumen Proposal yang gagal terender di `ProposalView.tsx`.

## 🔍 Audit Checklist
- [x] Verifikasi penggunaan komponen `<DocumentPreviewRenderer />` di dalam `ProposalView.tsx`. (Hasil: Terimport, tapi belum terintegrasi)
- [x] Analisis Data Flow. (Hasil: `proposalMarkdown` bisa kosong, menyebabkan error render)
- [x] Debugging Fungsi Render. (Hasil: `renderPaperContent` di `ProposalView.tsx` memiliki struktur multi-halaman yang tidak kompatibel langsung dengan `DocumentPreviewRenderer`)

## 🛠️ Kesimpulan & Tindakan
- **Masalah**: `ProposalView.tsx` menggunakan logika *page-splitting* manual yang berbenturan dengan arsitektur `DocumentPreviewRenderer`.
- **Saran**: Lakukan refaktorisasi `DocumentPreviewRenderer` agar bisa menerima `proposalMarkdown` multi-halaman (dipisah dengan `---`) dan menangani *page breaks* secara internal, sehingga `ProposalView.tsx` bisa menggunakan renderer tersebut dengan lebih bersih.
- **Tindakan Lanjutan**: Implementasi refaktorisasi `DocumentPreviewRenderer` untuk mendukung multi-halaman.
