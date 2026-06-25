---
name: Buku Penghubung Online Design System
description: Sistem desain visual hangat, Islami, dan edukatif untuk PAUD IT Darul Khairat
colors:
  primary: "#27AE60"
  primary-light: "#2ECC71"
  primary-dark: "#1E8449"
  secondary: "#F39C12"
  secondary-light: "#F9CA24"
  bg-cream: "#FDFAF6"
  bg-card: "#FFFFFF"
  text-dark: "#2C3E50"
  text-medium: "#5D6D7E"
  text-light: "#AEB6BF"
  accent-blue: "#3498DB"
  accent-coral: "#E74C3C"
typography:
  display:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontWeight: 900
    lineHeight: 1.2
  body:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
  card:
    backgroundColor: "{colors.bg-card}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: Buku Penghubung Online

## 1. Overview

**Creative North Star: "The Nurturing Garden (Taman Pengasuhan)"**

Buku Penghubung Online adalah cerminan dari sebuah taman pengasuhan yang hangat, Islami, dan penuh kasih sayang. Desain sistem ini dibuat khusus untuk memfasilitasi kolaborasi erat antara pihak sekolah (guru) dan keluarga (orang tua) dalam memantau tumbuh kembang serta pembiasaan karakter baik anak secara real-time. Antarmuka dirancang dengan pendekatan mobile-first untuk memudahkan akses cepat di tengah kesibukan harian.

Sistem ini secara tegas menolak estetika dashboard bisnis yang dingin (sterile enterprise) dan portal anak-anak yang bising serta tidak ramah aksesibilitas (chaotic kid portals). Sebaliknya, sistem ini mengedepankan ritme visual yang tenang, ramah, Islami, dan intuitif.

**Key Characteristics:**
* **Islamic Aesthetics**: Penggunaan motif geometris Islami yang halus, sapaan Islami yang hangat, serta dominasi warna hijau emerald yang meneduhkan.
* **Warm Natural Palette**: Latar belakang krem lembut yang mengurangi kelelahan mata, dikombinasikan dengan aksen warna organik.
* **Tactile Interactions**: Tombol-tombol kartu yang besar, melengkung lembut, dan responsif terhadap sentuhan untuk mendukung pengisian satu tangan.
* **Clear Structure**: Tipografi tebal dan kontras yang sangat tinggi untuk memastikan keterbacaan yang maksimal bagi semua kalangan orang tua dan guru.

## 2. Colors

Warna-warna yang digunakan terinspirasi dari alam, melambangkan pertumbuhan, kehangatan, dan spiritualitas Islami.

### Primary
* **Islamic Green** (#27AE60 / oklch(63% 0.17 142)): Warna utama yang melambangkan spiritualitas, kedamaian, dan pertumbuhan anak. Digunakan sebagai warna jangkar pada header, tombol utama, dan elemen sukses.
* **Emerald Light** (#2ECC71): Digunakan untuk memberikan highlight positif, status aktif, dan aksen cerah.
* **Forest Dark** (#1E8449): Digunakan untuk teks kontras tinggi di atas warna terang dan keadaan hover/aktif tombol utama.

### Secondary
* **Warm Amber** (#F39C12): Melambangkan kehangatan matahari pagi dan keceriaan anak. Digunakan untuk aktivitas rumah, perhatian khusus, dan tombol sekunder.
* **Sunlight Gold** (#F9CA24): Digunakan sebagai warna aksen pendukung untuk menambah keceriaan tanpa mengganggu kontras.

### Neutral
* **Cream Velvet** (#FDFAF6): Warna latar belakang utama seluruh aplikasi. Memberikan kesan hangat, premium, dan tidak silau seperti putih murni.
* **Pure Paper** (#FFFFFF): Digunakan khusus sebagai latar belakang kartu/kontainer di atas latar belakang krem untuk menciptakan kedalaman visual.
* **Slate Blue Text** (#2C3E50): Warna utama untuk semua teks penting dan judul demi menjaga rasio kontras yang sangat aman (≥ 4.5:1).
* **Muted Grey** (#5D6D7E): Digunakan untuk sub-teks, deskripsi, dan label sekunder.

### Named Rules
**The Emerald Anchor Rule.** Warna hijau Islami (`--primary`) harus menjadi warna dominan yang memandu mata pengguna. Gunakan warna aksen seperti merah coral (`--accent-coral`) atau amber (`--secondary`) hanya untuk kontras informasi tertentu (misal: sakit, peringatan, atau aktivitas rumah).

## 3. Typography

Sistem tipografi menggunakan kombinasi dua font Google Fonts yang dioptimalkan untuk keterbacaan tinggi pada layar mobile.

**Display Font:** Nunito (dengan fallback system-ui, sans-serif)
**Body Font:** Poppins (dengan fallback system-ui, sans-serif)

**Character:** Nunito yang membulat tebal memberikan kesan bersahabat dan penuh energi anak-anak pada judul-judul menu, sementara Poppins yang geometris rapi memberikan kejelasan mutlak pada isi teks laporan dan instruksi.

### Hierarchy
* **Display / Title Large** (Weight 900, Size 1.3rem - 1.5rem, Line-height 1.2): Digunakan untuk nama sekolah pada header, judul halaman utama, dan angka statistik penting.
* **Headline / Title Medium** (Weight 800, Size 1.1rem - 1.2rem, Line-height 1.3): Digunakan untuk judul kartu, nama menu navigasi, dan judul section.
* **Body Text** (Weight 400/500, Size 0.9rem - 1rem, Line-height 1.5): Digunakan untuk seluruh isi catatan guru, deskripsi aktivitas, dan formulir input. Batasi panjang baris maksimal 65ch untuk kenyamanan membaca.
* **Label / Caption** (Weight 700, Size 0.7rem - 0.75rem, Line-height 1.2): Digunakan untuk teks penjelas kecil, indikator badge, dan waktu log.

### Named Rules
**The No-Condensed Rule.** Dilarang menggunakan font yang terlalu rapat atau mempersempit letter-spacing di bawah `-0.02em` pada judul display. Nunito harus dibiarkan mengalir dengan tracking alaminya agar tetap terbaca ramah dan lapang.

## 4. Elevation

Kedalaman visual dalam aplikasi ini tidak mengandalkan bayangan yang dramatis atau efek kaca (glassmorphic) yang berlebihan, melainkan menggunakan kontras tonal antara kartu putih bersih (`--bg-card` #FFFFFF) di atas latar belakang krem lembut (`--bg-cream` #FDFAF6) dengan bayangan yang sangat tipis dan halus.

### Shadow Vocabulary
* **Soft Ambient Shadow** (`box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)`): Digunakan pada kartu aktivitas dan kontainer informasi dalam keadaan diam (rest).
* **Interactive Hover Shadow** (`box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12)`): Digunakan saat kartu atau tombol disentuh/diarahkan kursor untuk memberikan feedback tactile yang responsif.

### Named Rules
**The Flat-By-Default Rule.** Semua kartu dan kontainer harus terlihat datar dan menyatu dengan halaman saat diam. Bayangan hanya menebal dan mengangkat kartu (transform translateY(-2px)) sebagai respon aktif terhadap interaksi pengguna (hover/focus).

## 5. Components

### Buttons
* **Shape:** Lengkungan sudut yang ramah anak dengan radius medium (16px / 1rem).
* **Primary Button:** Menggunakan gradien dari `primary` ke `primary-light` dengan teks putih tebal. Padding internal aman sebesar 12px 24px untuk memudahkan ketukan jempol.
* **Hover / Active State:** Sedikit menggelap ke `primary-dark`, terangkat dengan transform translateY(-1px), dan bayangan menyebar lembut untuk feedback interaksi.

### Cards / Containers
* **Corner Style:** Radius besar (24px / 1.5rem) untuk memberikan siluet yang lembut, ramah, dan aman.
* **Internal Padding:** Spacing longgar (20px) untuk memberikan ruang bernapas pada konten mobile.
* **Border:** Garis tepi ultra tipis (`1px solid rgba(0, 0, 0, 0.06)`) untuk mempertegas batas kartu secara elegan tanpa terlihat kaku.

### Inputs / Fields
* **Style:** Latar belakang putih bersih, sudut melengkung 16px, dengan border abu-abu terang 2px (`#E8ECF0`).
* **Focus State:** Berubah menjadi border hijau utama (`--primary`) dengan efek bayangan luar tipis (glow) berwarna hijau transparan 10%.

### Navigation (Bottom Nav & Sidebar)
* **Bottom Nav (Mobile)**: Latar belakang putih dengan transparansi 95% dan efek blur di belakang (`backdrop-filter: blur(12px)`). Menu aktif menggunakan warna hijau utama (`--primary`) dengan ikon yang membesar 15% secara dinamis.
* **Sidebar (Desktop/Admin)**: Sisi kiri berwarna hijau gelap kokoh dengan teks putih-emas, memberikan navigasi administratif yang rapi dan terstruktur.

## 6. Do's and Don'ts

### Do:
* **Do** gunakan rasio kontras teks minimal 4.5:1 menggunakan warna teks utama `#2C3E50` di atas latar belakang krem `#FDFAF6`.
* **Do** pastikan target klik/ketuk pada tombol atau kartu minimal berukuran 44x44 piksel untuk mendukung aksesibilitas mobile yang nyaman.
* **Do** gunakan emoji yang relevan dan ceria sebagai penanda visual yang cepat dikenali oleh guru dan orang tua.
* **Do** pertahankan batas lebar kontainer maksimal 480px di desktop agar tampilan aplikasi PWA tetap konsisten seperti di ponsel.

### Don't:
* **Don't** gunakan bayangan hitam pekat yang tebal atau efek kaca (glassmorphism) yang mencolok secara dekoratif karena merusak nuansa hangat alami sekolah.
* **Don't** gunakan teks gradien atau dekorasi garis tepi tebal berwarna-warni di sisi kiri kartu (side-stripe borders > 1px) yang terkesan murahan.
* **Don't** gunakan spasi yang terlalu padat antar elemen formulir di ponsel; selalu berikan ruang bernapas minimal 16px (`--spacing-md`) agar tidak membingungkan pengguna.
* **Don't** hilangkan doa atau sapaan Islami yang hangat karena hal tersebut merupakan bagian penting dari kepribadian brand PAUD IT Darul Khairat.
