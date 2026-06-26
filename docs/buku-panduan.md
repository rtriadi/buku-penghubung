# Buku Panduan Lengkap: Buku Penghubung Online
**PAUD Islam Terpadu Darul Khairat**

Selamat datang di Buku Panduan Penggunaan Aplikasi Buku Penghubung Online. Aplikasi ini dirancang untuk memudahkan komunikasi, pemantauan aktivitas harian, serta perkembangan anak antara pihak sekolah (Administrator, Guru, Kepala Sekolah) dan orang tua (Wali Murid) secara praktis dan real-time.

---

## 📌 DAFTAR ISI
1. [Cara Mengakses & Login Aplikasi](#1-cara-mengakses--login-aplikasi)
2. [Panduan Peran: Administrator (Admin)](#2-panduan-peran-administrator-admin)
3. [Panduan Peran: Guru (Wali Kelas)](#3-panduan-peran-guru-wali-kelas)
4. [Panduan Peran: Orang Tua (Wali Murid)](#4-panduan-peran-orang-tua-wali-murid)
5. [Panduan Peran: Kepala Sekolah (Principal)](#5-panduan-peran-kepala-sekolah-principal)
6. [Penyelesaian Masalah (Troubleshooting)](#6-penyelesaian-masalah-troubleshooting)

---

## 1. CARA MENGAKSES & LOGIN APLIKASI

Aplikasi Buku Penghubung dapat diakses melalui browser di HP, Tablet, maupun Laptop/Komputer Anda.

### Langkah-langkah Login:
1. Buka browser (Google Chrome, Safari, atau Edge) dan akses link aplikasi:
   `https://bukupenghubung-dkgtlo.vercel.app`
2. Di halaman login:
   - Masukkan **Email Login** Anda yang telah terdaftar.
   - Masukkan **Password** Anda.
   - Centang opsi **Ingat akun saya di perangkat ini** jika Anda ingin tetap masuk dan tidak perlu mengulang proses login setiap kali membuka aplikasi di perangkat yang sama.
   - Klik tombol **Masuk 🚀**
3. Aplikasi akan mendeteksi peran Anda secara otomatis (Admin, Guru, Wali, atau Kepala Sekolah) dan mengarahkan Anda ke dashboard yang sesuai.

### 📲 Instalasi Aplikasi (PWA - Progressive Web App):
Aplikasi ini mendukung fitur PWA, artinya Anda dapat memasang aplikasi ini langsung di layar utama (home screen) HP atau laptop Anda layaknya aplikasi dari app store/play store:
* **Menggunakan Tombol di Halaman Login**: Saat membuka halaman login pada browser yang mendukung, klik tombol **📲 Pasang Aplikasi di HP Anda** untuk memunculkan konfirmasi instalasi.
* **Menggunakan Menu Browser**: Alternatif lainnya, klik ikon titik tiga di browser HP Anda dan pilih **Tambahkan ke Layar Utama** (Add to Home Screen), atau klik ikon instalasi di bagian kanan address bar jika menggunakan laptop.
* Setelah terinstal, aplikasi dapat dibuka secara instan dari layar utama perangkat Anda dengan tampilan penuh (tanpa bilah alamat browser).

---

## 2. PANDUAN PERAN: ADMINISTRATOR (ADMIN)
Administrator bertanggung jawab penuh atas manajemen master data sekolah, akun pengguna, dan pengaturan aktivitas.

### A. Dashboard Utama Admin
Setelah login, Admin akan melihat statistik ringkas jumlah kelas, guru, wali murid, dan siswa yang terdaftar di sekolah.

### B. Manajemen Kelas (`Manajemen Kelas`)
Digunakan untuk mengelola daftar kelas yang aktif di PAUD Darul Khairat.
* **Melihat Daftar Kelas**: Menampilkan nama kelas (contoh: Kelas Toddler, Kelas KB, Kelas A, Kelas B) beserta Wali Kelas yang ditugaskan.
* **Menambah/Mengedit Kelas**: 
  1. Klik tombol **Tambah Kelas Baru** atau klik **Edit** pada kelas yang ada.
  2. Masukkan nama kelas baru.
  3. Pilih Wali Kelas dari dropdown guru yang tersedia.
  4. Klik **Simpan**.

### C. Manajemen Guru (`Manajemen Guru`)
Digunakan untuk mendaftarkan akun guru dan mengatur jabatan Kepala Sekolah.
* **Mendaftarkan Guru Baru**:
  1. Klik tombol **➕ Daftarkan Guru Baru**.
  2. Masukkan Nama Lengkap Guru, Email, dan tentukan Kelas yang akan diajar.
  3. Masukkan password awal (default: `darulkhairat2026`).
  4. Klik **Daftarkan & Buat Akun**. Pop-up kredensial akan muncul untuk disalin dan dibagikan kepada guru bersangkutan.
* **Menetapkan Kepala Sekolah**:
  - Hanya ada **satu** Kepala Sekolah yang dapat aktif. Saat Anda mengedit data salah satu guru, Anda akan melihat tombol **Set Kepala Sekolah**. Klik tombol tersebut untuk menetapkan guru tersebut sebagai Kepala Sekolah.
* **Reset Password & Hapus**:
  - Anda dapat mereset password guru kembali ke default atau menghapus akun guru jika sudah tidak bertugas.

### D. Manajemen Wali Ortu (`Manajemen Wali Ortu`)
Digunakan untuk membuat akun login orang tua dan menghubungkannya dengan anak (siswa).
* **Menghubungkan Wali Baru**:
  1. Klik tombol **➕ Hubungkan Wali Baru**.
  2. Isi Nama Lengkap Wali dan alamat Email Login.
  3. Pilih siswa yang merupakan anak dari wali tersebut pada kolom **Hubungkan ke Siswa** (dropdown multi-select).
  4. Klik **Daftarkan & Buat Akun** dan salin info akunnya untuk diberikan ke orang tua.

### E. Manajemen Siswa (`Manajemen Siswa`)
Digunakan untuk menginput data siswa dan memperbarui status akademik mereka.
* **Menambah Siswa**: Masukkan nama lengkap, nama panggilan, tanggal lahir, pilih kelas, dan pasang emoji avatar yang disukai anak.
* **Manajemen Masal (Ubah Kelas & Status Alumni)**:
  - Anda dapat mencentang beberapa siswa sekaligus untuk memindahkan mereka ke kelas berikutnya secara masal atau mengubah status mereka menjadi **Alumni** setelah mereka lulus.

### F. Konfigurasi Aktivitas (`Aktivitas Harian`)
Mengatur poin-poin kegiatan yang harus dicentang oleh Guru (Aktivitas Sekolah) dan Wali Murid (Aktivitas Rumah).
* **Aktivitas Sekolah**: Contohnya Sholat Dhuha, Snack Pagi, Belajar, Makan Siang, Tidur Siang. Anda bisa mengaktifkan opsi **Butuh Jam** jika aktivitas tersebut memerlukan pencatatan waktu pelaksanaan.
* **Aktivitas Rumah**: Contohnya Mengaji, Sholat Maghrib, Mandi Sore, Tidur Malam.

---

## 3. PANDUAN PERAN: GURU (WALI KELAS)
Guru memiliki tugas utama mencatat aktivitas harian siswa di kelasnya selama jam sekolah.

### A. Dashboard Utama Guru
* Menampilkan daftar seluruh siswa yang ada di kelas Anda.
* Terdapat **Progress Bar** untuk setiap siswa yang menunjukkan persentase pengisian laporan hari ini (misal: 4/9 kegiatan terisi).
* Menampilkan status pengisian (Belum Diisi, Lengkap, atau Sebagian).

### B. Mengisi Laporan Harian (Daily Log)
1. Di Dashboard, klik kartu nama siswa yang ingin diisi laporannya.
2. Anda akan diarahkan ke halaman **Laporan Harian Siswa**.
3. **Aktivitas Sekolah**: Centang kegiatan yang diikuti anak. Jika kegiatan membutuhkan input waktu (seperti Jam Pulang), masukkan jam pelaksanaannya.
4. **Kondisi Kesehatan**: Pilih kondisi kesehatan anak hari ini (😊 Sehat, 😐 Kurang Sehat, atau 🤒 Sakit).
5. **Catatan Guru (Teacher Note)**: Tulis pesan personal kepada orang tua mengenai perkembangan anak hari ini (misalnya: *"Hafidz hari ini sangat lahap makan siangnya dan aktif membantu merapikan mainan"*).
6. Klik **Simpan Laporan**. Laporan langsung terkirim dan dapat dilihat oleh orang tua murid secara real-time.

### C. Rekap & Riwayat Kelas (`Rekap Laporan`)
* Membuka tab **Rekap** untuk melihat rangkuman kehadiran dan pengisian jurnal kelas Anda per tanggal tertentu.
* Anda dapat mengekspor rekap bulanan kelas untuk keperluan laporan ke Kepala Sekolah.

---

## 4. PANDUAN PERAN: ORANG TUA (WALI MURID)
Orang tua dapat memantau jurnal sekolah anak dan mengisi jurnal kegiatan anak saat di rumah.

### A. Dashboard Utama Wali Murid
* **Melihat Laporan Sekolah**: Orang tua dapat langsung melihat checklist kegiatan sekolah yang diisi oleh guru, jam tidur/pulang anak, kondisi kesehatan, serta pesan/catatan khusus dari Wali Kelas.
* **Mengisi Laporan Rumah (Home Log)**:
  1. Pada bagian **Aktivitas di Rumah**, centang kegiatan yang dilakukan anak di rumah (seperti Mengaji, Sholat, Belajar).
  2. **Catatan Orang Tua (Parent Note)**: Tulis pesan atau tanggapan untuk guru (misalnya: *"Hafidz di rumah sempat mengeluh pusing sedikit setelah mandi sore, mohon dipantau ya bu besok di sekolah"*).
  3. Klik **Simpan Aktivitas Rumah**. Catatan ini akan langsung muncul di dashboard guru esok harinya.

### B. Rekap Laporan Anak (`Rekap`)
* Orang tua dapat melihat riwayat perkembangan harian anak dari hari-hari sebelumnya.
* Terdapat tombol **Cetak Laporan** (ekspor PDF/Print) untuk mengunduh rekap jurnal perkembangan anak.

---

## 5. PANDUAN PERAN: KEPALA SEKOLAH (PRINCIPAL)
Kepala Sekolah memiliki wewenang untuk memantau perkembangan seluruh kelas tanpa mengubah data jurnal harian.

### A. Dashboard Utama Kepala Sekolah
* Menampilkan jumlah total siswa aktif dan alumni di sekolah.
* Menampilkan grafik/diagram ringkasan keaktifan kelas serta presentase kehadiran hari ini.

### B. Rekap Jurnal Seluruh Sekolah (`Rekap`)
* Kepala Sekolah dapat memfilter laporan berdasarkan **Kelas** dan **Tanggal**.
* Kepala Sekolah dapat menyaring tampilan siswa aktif maupun siswa yang sudah berstatus alumni.
* Membaca catatan guru dan catatan orang tua dari seluruh siswa untuk mengevaluasi kualitas kegiatan belajar mengajar serta komunikasi di sekolah.

---

## 6. PENYELESAIAN MASALAH (TROUBLESHOOTING)

### ⚠️ Lupa Password Akun Anda?
Hubungi Administrator sekolah untuk mereset password akun Anda kembali ke password default (`darulkhairat2026`). Setelah login dengan password default, Anda dapat mengganti password Anda secara mandiri di menu profil.

### ⚠️ Tombol "Simpan" Wali Murid Tidak Berfungsi / Memunculkan Error?
Jika saat mendaftarkan Wali Ortu baru muncul pesan error database, pastikan email orang tua tersebut belum pernah terdaftar sebelumnya di sistem. Jika Anda sebagai Admin menemui pesan error database aneh pada email tertentu yang bersih dari daftar user, silakan hubungi tim teknis untuk melakukan **Reindex** tabel `auth.users` di database Supabase.

---
*Dokumen ini dibuat untuk menunjang kelancaran KBM dan sinergi antara PAUD IT Darul Khairat dengan para Orang Tua/Wali Murid.*
