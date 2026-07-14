# Smart Event Management System - Project Blueprint

Blueprint ini dirancang sebagai panduan komprehensif (starter kit) untuk pengembangan Smart Event Management System (SEMS).

## 1. Goal
Membangun platform manajemen kegiatan yang terintegrasi, transparan, dan efisien untuk kebutuhan koordinasi komunitas atau organisasi, mencakup manajemen panitia, perencanaan anggaran (RKBA), keuangan, operasional tugas, notulensi rapat, dan administrasi surat-menyurat digital.

## 2. Sprint Plan
*   **Sprint 1: Core Foundation & Master Data**
    *   Definisi tipe data (`src/types.ts`).
    *   Implementasi `MasterDataView` (Manajemen Panitia, Kegiatan, Pengaturan Sistem).
    *   Setup `Sidebar` dan navigasi aplikasi.
*   **Sprint 2: Operational & Budgeting**
    *   Implementasi `RKBAView` (Rencana Anggaran) & `KeuanganView` (Transaksi Kas).
    *   Implementasi `MonitoringView` (Tugas per Seksi).
*   **Sprint 3: Administrative & Collaboration**
    *   Implementasi `NotulensiView` (Rapat, Keputusan, Action Items).
    *   Implementasi `ProposalView` & `UndanganRapatView` (Pembuatan Dokumen).
*   **Sprint 4: Document Management & Finalization**
    *   Implementasi `DigitalDocumentsView`.
    *   Integrasi export/preview (`PDFPreviewModal`, `LPJPreview`).

## 3. Scope & Data Model (`src/types.ts`)
Aplikasi dikelola berdasarkan interface `SEMSData`, yang mencakup entitas berikut:

| Modul | Deskripsi | Komponen Utama |
| :--- | :--- | :--- |
| **Settings** | Konfigurasi sistem | `SettingView` |
| **Panitia** | Pengurus & Peran | `MasterDataView`, `OrgChart` |
| **Kegiatan** | Jadwal & Status | `MasterDataView`, `DashboardView` |
| **RKBA** | Perencanaan Biaya | `RKBAView` |
| **Keuangan** | Transaksi Kas | `KeuanganView` |
| **Tasks** | Tugas & PIC | `MonitoringView` |
| **Notulensi** | Rapat & Keputusan | `NotulensiView` |
| **Documents**| Administrasi Digital | `DigitalDocumentsView` |
| **Undangan** | Surat-menyurat | `UndanganRapatView` |

## 5. Development Lifecycle (Step-by-Step)
1. **Initial Setup**:
    - Initialize React+Vite project.
    - Configure Tailwind CSS.
    - Install base dependencies (lucide-react, motion, etc.).
2. **Data Structure (Foundation)**:
    - Create `src/types.ts` defining all entities (`SEMSData`).
    - Define initial mock data in `src/data/`.
3. **Core UI/UX Structure**:
    - Build `LandingPage` with festive Hut RI theme.
    - Build `Sidebar` for navigation.
    - Setup `App.tsx` with routing (state-based view switching & landing page toggle).
4. **Iterative Feature Implementation (Sprint 1-4)**:
    - Implement each `View` component in `/src/components/`.
    - Connect components to local/cloud state.
5. **Persistence Setup**:
    - Implement Firebase/Cloud SQL integration.
    - Create API routes in `server.ts` to handle backend requests.
6. **Testing & Deployment**:
    - Run `lint_applet` and `compile_applet` frequently.
    - Deploy to Cloud Run.

---
*Blueprint ini mencerminkan struktur fungsional Smart Event Management System yang komprehensif.*
