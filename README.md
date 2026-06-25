# Buku Penghubung Online (PAUD IT Darul Khairat)

Aplikasi Buku Penghubung Online adalah platform komunikasi harian antara Guru dan Orang Tua/Wali Murid PAUD Islam Terpadu Darul Khairat. Aplikasi ini dirancang untuk mencatat, melacak, dan merangkum aktivitas harian anak baik di sekolah maupun di rumah secara real-time dan aman.

## 🌟 Fitur Utama

1. **Autentikasi & Role Multi-User**:
   * **Admin**: Mengelola data guru, kelas, siswa, wali murid, dan aktivitas.
   * **Guru**: Mengisi laporan kegiatan sekolah anak, status kesehatan, dan catatan perkembangan harian.
   * **Orang Tua**: Memantau perkembangan harian anak di sekolah dan melaporkan aktivitas anak di rumah (ibadah, tidur malam, PR, dll).

2. **Desain Visual Presisi (Golden Ratio)**:
   * Tata letak tipografi, spasi, padding, dan visual grid dirancang menggunakan proporsi **Rasio Emas ($\Phi \approx 1.618$)** agar tulisan nyaman dibaca dan dioperasikan pada berbagai jenis ukuran layar (Desktop hingga HP kecil).
   * Desain modern bernuansa Islami dan warna alam hangat (*warm natural green & blue*).

3. **Pengisian Tanggal Terlewat (Backdated Logs)**:
   * Guru dan Orang Tua dapat memilih tanggal tertentu via selektor kalender (Date Picker) untuk mengisi atau memperbarui laporan aktivitas harian yang terlewat secara instan.

4. **Rekap Bulanan Penuh**:
   * Menampilkan rangkuman seluruh aktivitas sekolah dan rumah secara kronologis dari tanggal 1 hingga akhir bulan.
   * Dilengkapi filter dropdown Bulan dan Tahun yang fleksibel.

5. **Unduh PDF Landscape**:
   * Laporan bulanan dapat diekspor menjadi dokumen PDF berorientasi **Landscape (A4)** agar muat secara horizontal tanpa terpotong.
   * Kolom tanda tangan di bawah lembar PDF otomatis mencantumkan nama Wali Kelas (Guru) dan nama Orang Tua secara dinamis berdasarkan data siswa.

6. **Pilihan Avatar Lucu**:
   * Menyediakan 30 variasi emoji avatar unik untuk profil siswa.

7. **Profil & Keamanan Akun**:
   * Integrasi Profile Modal pada navigasi bawah untuk melihat info detail akun dan tombol logout yang aman (tidak ter-logout secara tidak sengaja).

---

## 🛠️ Tech Stack

* **Frontend**: [Next.js (App Router)](https://nextjs.org/) & React 19
* **Styling**: Vanilla CSS (dengan desain sistem token Golden Ratio) & TailwindCSS
* **Database & Auth**: [Supabase](https://supabase.com/) (dengan PostgreSQL & Row Level Security aktif)
* **Ekspor Dokumen**: [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/)

---

## 🚀 Memulai (Setup Lokal)

### 1. Clone Repositori
```bash
git clone <url-repository-anda>
cd buku-penghubung
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Buat berkas `.env.local` di direktori utama (root) proyek dan isi nilai berikut:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### 4. Setup Database Supabase
Jalankan file SQL skema di SQL Editor Supabase secara berurutan:
1. `docs/supabase-schema.sql` (Skema awal & relasi)
2. `docs/supabase-schema-update.sql` (Skema pelengkap, RLS Policy, & data seeding akun uji coba)

### 5. Jalankan Server Development
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

### 6. Build Produksi
```bash
npm run build
```

---

## 👥 Akun Uji Coba (Seed Data)
Setelah menjalankan seeding dari SQL update, Anda bisa masuk menggunakan data berikut:

* **Admin**:
  * Email: `admin@darulkhairat.com`
  * Password: `admin123`
* **Guru (Bu Fatimah)**:
  * Email: `guru@darulkhairat.com`
  * Password: `guru123` (atau reset default `dkhairat2024`)
* **Orang Tua (Bapak Ahmad - Wali dari Zaid)**:
  * Email: `ortu@darulkhairat.com`
  * Password: `ortu123` (atau reset default `dkhairat2024`)
