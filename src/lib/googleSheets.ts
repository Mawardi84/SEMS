import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signOut
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";
import { SEMSData, Panitia, Kegiatan, RKBAItem, NaturaItem, KeuanganTransaction, SeksiTask, SystemSetting } from "../types";

// Safe initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google OAuth provider with required sheets/drive scopes
export const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/spreadsheets");
provider.addScope("https://www.googleapis.com/auth/drive.file");

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // If user is logged in but token is not in memory (e.g., page refreshed),
        // we will need them to trigger sign-in again to acquire the token.
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Gagal mengambil access token dari Google Sign-In.");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Auth sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Sign Out
export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getAccessToken = () => cachedAccessToken;

// Google Drive & Sheets API Operations

// Helper to make Google API requests
async function googleApiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Silakan masuk dengan Google terlebih dahulu.");
  }

  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(endpoint, { ...options, headers });
  if (!response.ok) {
    const errText = await response.text();
    console.error(`Google API Error [${response.status}]:`, errText);
    throw new Error(`Google API Error: ${response.statusText} (${response.status})`);
  }

  return response.json();
}

// 1. Create a New Spreadsheet
export const createGoogleSpreadsheet = async (title: string): Promise<{ id: string; url: string }> => {
  const endpoint = "https://sheets.googleapis.com/v4/spreadsheets";
  const body = {
    properties: {
      title: title
    },
    sheets: [
      { properties: { title: "Pengaturan" } },
      { properties: { title: "Panitia" } },
      { properties: { title: "Kegiatan" } },
      { properties: { title: "RKBA" } },
      { properties: { title: "Natura" } },
      { properties: { title: "Keuangan" } },
      { properties: { title: "Tasks" } }
    ]
  };

  const data = await googleApiFetch(endpoint, {
    method: "POST",
    body: JSON.stringify(body)
  });

  return {
    id: data.spreadsheetId,
    url: data.spreadsheetUrl
  };
};

// 2. Export SEMS Data to Google Sheet
export const exportDataToGoogleSheet = async (spreadsheetId: string, semsData: SEMSData): Promise<void> => {
  // Format each sheet's values
  
  // A. Pengaturan Sheet
  const settingRows = [
    ["Parameter", "Nilai / Daftar (Pisahkan dengan Koma)"],
    ["id", semsData.settings.id],
    ["rtList", semsData.settings.rtList.join(", ")],
    ["seksiList", semsData.settings.seksiList.join(", ")],
    ["targetIuranPerRT", semsData.settings.targetIuranPerRT],
    ["themeColor", semsData.settings.themeColor]
  ];
  // Add Pagu per Seksi
  Object.entries(semsData.settings.paguAnggaranSeksi).forEach(([seksi, pagu]) => {
    settingRows.push([`Pagu - ${seksi}`, pagu]);
  });

  // B. Panitia Sheet
  const panitiaRows = [
    ["ID", "Nama", "Peran / Jabatan", "No Telepon", "RT", "Seksi"],
    ...semsData.panitia.map(p => [p.id, p.name, p.role, p.phone, p.rt, p.seksi])
  ];

  // C. Kegiatan Sheet
  const kegiatanRows = [
    ["ID", "Nama Kegiatan", "Tanggal", "Waktu", "Lokasi", "Deskripsi", "Status"],
    ...semsData.kegiatan.map(k => [k.id, k.name, k.date, k.time, k.location, k.description, k.status])
  ];

  // D. RKBA Sheet
  const rkbaRows = [
    ["ID", "Nama Barang", "Seksi", "Qty", "Satuan", "Harga Satuan", "Total", "Sumber Dana", "Status", "Catatan", "Tanggal"],
    ...semsData.rkba.map(r => [r.id, r.name, r.seksi, r.qty, r.unit, r.price, r.total, r.fundingSource, r.status, r.notes, r.dateAdded])
  ];

  // E. Natura Sheet
  const naturaRows = [
    ["ID", "Nama Penyumbang", "RT", "Nama Barang", "Qty", "Satuan", "Estimasi Nilai", "Alokasi", "Tanggal", "Catatan"],
    ...semsData.natura.map(n => [n.id, n.donorName, n.rt, n.item, n.qty, n.unit, n.estimatedValue, n.allocation, n.date, n.notes])
  ];

  // F. Keuangan Sheet
  const keuanganRows = [
    ["ID", "Jenis (Masuk/Keluar)", "Tanggal", "Kategori", "Jumlah", "Catatan", "Ref ID"],
    ...semsData.keuangan.map(t => [t.id, t.type, t.date, t.category, t.amount, t.notes, t.refId || ""])
  ];

  // G. Tasks Sheet
  const tasksRows = [
    ["ID", "Seksi", "Nama Program Kerja", "Status (Belum/Proses/Selesai)", "Penanggungjawab", "Batas Waktu"],
    ...semsData.tasks.map(t => [t.id, t.seksi, t.taskName, t.status, t.assignedTo, t.deadline])
  ];

  const dataToSend = [
    { range: "Pengaturan!A1:B100", values: settingRows },
    { range: "Panitia!A1:F1000", values: panitiaRows },
    { range: "Kegiatan!A1:G1000", values: kegiatanRows },
    { range: "RKBA!A1:K2000", values: rkbaRows },
    { range: "Natura!A1:J1000", values: naturaRows },
    { range: "Keuangan!A1:G3000", values: keuanganRows },
    { range: "Tasks!A1:F1000", values: tasksRows }
  ];

  // Clear existing ranges to prevent old data residue
  const clearPromises = [
    "Pengaturan!A1:Z200",
    "Panitia!A1:Z2000",
    "Kegiatan!A1:Z2000",
    "RKBA!A1:Z3000",
    "Natura!A1:Z2000",
    "Keuangan!A1:Z5000",
    "Tasks!A1:Z2000"
  ].map(range => {
    return googleApiFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`, {
      method: "POST"
    });
  });

  await Promise.all(clearPromises);

  // Send batch update
  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  await googleApiFetch(endpoint, {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "RAW",
      data: dataToSend
    })
  });
};

// 3. Import SEMS Data from Google Sheet
export const importDataFromGoogleSheet = async (spreadsheetId: string): Promise<SEMSData> => {
  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=Pengaturan!A1:B100&ranges=Panitia!A1:F1000&ranges=Kegiatan!A1:G1000&ranges=RKBA!A1:K2000&ranges=Natura!A1:J1000&ranges=Keuangan!A1:G3000&ranges=Tasks!A1:F1000`;
  
  const response = await googleApiFetch(endpoint);
  const valueRanges = response.valueRanges;

  if (!valueRanges || valueRanges.length < 7) {
    throw new Error("Struktur file spreadsheet tidak sesuai. Pastikan spreadsheet dibuat dengan tombol 'Buat Baru' agar memiliki tab yang lengkap.");
  }

  // Parse values safely
  const getValues = (index: number) => valueRanges[index]?.values || [];

  // A. Parse Pengaturan
  const settingsRows = getValues(0);
  const settingsObj: any = {
    id: "rw04_sems_config",
    rtList: [],
    seksiList: [],
    targetIuranPerRT: 0,
    paguAnggaranSeksi: {},
    sheetId: spreadsheetId,
    sheetApiKey: "",
    themeColor: "red"
  };

  settingsRows.forEach((row: string[]) => {
    if (!row || row.length < 2) return;
    const param = row[0];
    const value = row[1];

    if (param === "id") settingsObj.id = value;
    else if (param === "rtList") settingsObj.rtList = value.split(",").map(s => s.trim()).filter(s => s.length > 0);
    else if (param === "seksiList") settingsObj.seksiList = value.split(",").map(s => s.trim()).filter(s => s.length > 0);
    else if (param === "targetIuranPerRT") settingsObj.targetIuranPerRT = Number(value) || 0;
    else if (param === "themeColor") settingsObj.themeColor = value;
    else if (param.startsWith("Pagu - ")) {
      const seksiName = param.replace("Pagu - ", "");
      settingsObj.paguAnggaranSeksi[seksiName] = Number(value) || 0;
    }
  });

  // Ensure default seksi are covered if pagu is missing
  settingsObj.seksiList.forEach((seksi: string) => {
    if (settingsObj.paguAnggaranSeksi[seksi] === undefined) {
      settingsObj.paguAnggaranSeksi[seksi] = 1000000;
    }
  });

  // B. Parse Panitia
  const panitiaRows = getValues(1);
  const panitia: Panitia[] = [];
  if (panitiaRows.length > 1) {
    for (let i = 1; i < panitiaRows.length; i++) {
      const row = panitiaRows[i];
      if (!row || row.length < 2 || !row[1]) continue; // Skip empty names
      panitia.push({
        id: row[0] || `panitia_${Date.now()}_${i}`,
        name: row[1] || "",
        role: row[2] || "",
        phone: row[3] || "",
        rt: row[4] || "",
        seksi: row[5] || ""
      });
    }
  }

  // C. Parse Kegiatan
  const kegiatanRows = getValues(2);
  const kegiatan: Kegiatan[] = [];
  if (kegiatanRows.length > 1) {
    for (let i = 1; i < kegiatanRows.length; i++) {
      const row = kegiatanRows[i];
      if (!row || row.length < 2 || !row[1]) continue;
      kegiatan.push({
        id: row[0] || `kegiatan_${Date.now()}_${i}`,
        name: row[1] || "",
        date: row[2] || "",
        time: row[3] || "",
        location: row[4] || "",
        description: row[5] || "",
        status: (row[6] as any) || "Perencanaan"
      });
    }
  }

  // D. Parse RKBA
  const rkbaRows = getValues(3);
  const rkba: RKBAItem[] = [];
  if (rkbaRows.length > 1) {
    for (let i = 1; i < rkbaRows.length; i++) {
      const row = rkbaRows[i];
      if (!row || row.length < 2 || !row[1]) continue;
      const qty = Number(row[3]) || 0;
      const price = Number(row[5]) || 0;
      rkba.push({
        id: row[0] || `rkba_${Date.now()}_${i}`,
        name: row[1] || "",
        seksi: row[2] || "",
        qty: qty,
        unit: row[4] || "Pcs",
        price: price,
        total: qty * price,
        fundingSource: (row[7] as any) || "Kas Utama",
        status: (row[8] as any) || "Draft",
        notes: row[9] || "",
        dateAdded: row[10] || new Date().toISOString().split('T')[0]
      });
    }
  }

  // E. Parse Natura
  const naturaRows = getValues(4);
  const natura: NaturaItem[] = [];
  if (naturaRows.length > 1) {
    for (let i = 1; i < naturaRows.length; i++) {
      const row = naturaRows[i];
      if (!row || row.length < 2 || !row[1]) continue;
      natura.push({
        id: row[0] || `natura_${Date.now()}_${i}`,
        donorName: row[1] || "",
        rt: row[2] || "",
        item: row[3] || "",
        qty: Number(row[4]) || 0,
        unit: row[5] || "Pcs",
        estimatedValue: Number(row[6]) || 0,
        allocation: row[7] || "",
        date: row[8] || new Date().toISOString().split('T')[0],
        notes: row[9] || ""
      });
    }
  }

  // F. Parse Keuangan
  const keuanganRows = getValues(5);
  const keuangan: KeuanganTransaction[] = [];
  if (keuanganRows.length > 1) {
    for (let i = 1; i < keuanganRows.length; i++) {
      const row = keuanganRows[i];
      if (!row || row.length < 3) continue; // Ensure type and date exist
      keuangan.push({
        id: row[0] || `keuangan_${Date.now()}_${i}`,
        type: (row[1] as any) || "Masuk",
        date: row[2] || new Date().toISOString().split('T')[0],
        category: (row[3] as any) || "Operasional",
        amount: Number(row[4]) || 0,
        notes: row[5] || "",
        refId: row[6] || undefined
      });
    }
  }

  // G. Parse Tasks
  const tasksRows = getValues(6);
  const tasks: SeksiTask[] = [];
  if (tasksRows.length > 1) {
    for (let i = 1; i < tasksRows.length; i++) {
      const row = tasksRows[i];
      if (!row || row.length < 3 || !row[2]) continue;
      tasks.push({
        id: row[0] || `task_${Date.now()}_${i}`,
        seksi: row[1] || "",
        taskName: row[2] || "",
        status: (row[3] as any) || "Belum",
        assignedTo: row[4] || "",
        deadline: row[5] || ""
      });
    }
  }

  return {
    settings: settingsObj as SystemSetting,
    panitia,
    kegiatan,
    rkba,
    natura,
    keuangan,
    tasks
  };
};
