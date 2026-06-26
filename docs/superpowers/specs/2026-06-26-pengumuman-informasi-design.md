# Design Spec: Fitur Pengumuman / Informasi
**Date:** 2026-06-26
**Status:** Approved
**Author:** Brainstorming Session

---

## Overview

Fitur Pengumuman/Informasi memungkinkan admin sekolah membuat dan mengelola pengumuman penting yang bisa dilihat oleh semua pengguna aplikasi (guru, orang tua, kepala sekolah), kecuali admin itu sendiri. Pengumuman ditampilkan sebagai popup saat pertama login dan bisa diakses kapan saja melalui tab Pengumuman di bottom navigation.

---

## Keputusan Desain (dari Interview)

| Pertanyaan | Keputusan |
|---|---|
| Siapa penerima notifikasi? | Semua role kecuali admin (teacher, parent, principal) |
| Cara tampil saat buka app? | Popup muncul **sekali saat pertama login** per session |
| Mekanisme tandai dibaca? | Dua-duanya: per pengumuman & "Tandai Semua Sudah Dibaca" |
| Rich text editor? | **Quill.js** (via react-quill atau quill langsung) |
| Logika expired? | **Keduanya** — expired by tanggal selesai + admin bisa nonaktifkan manual |
| Posisi ikon lonceng? | Di **bottom navigation** (tab baru khusus Pengumuman) |

---

## Arsitektur

### Database Schema (Supabase)

**Tabel: `announcements`**
```sql
CREATE TABLE announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,  -- HTML dari Quill.js
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Tabel: `announcement_reads`**
```sql
CREATE TABLE announcement_reads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);
```

**Row Level Security:**
- `announcements`: semua user terautentikasi bisa SELECT; hanya admin (lewat service role) bisa INSERT/UPDATE/DELETE
- `announcement_reads`: user hanya bisa SELECT/INSERT row miliknya sendiri

### Logika Pengumuman Aktif
Pengumuman ditampilkan ke user jika:
1. `is_active = true`
2. `start_date <= CURRENT_DATE`
3. `end_date >= CURRENT_DATE`

### Logika Popup Login
- Setelah login berhasil, cek apakah ada pengumuman aktif yang belum ada di `announcement_reads` untuk user tersebut
- Jika ada → tampilkan popup modal
- Setelah popup ditutup (atau tombol "Nanti" diklik) → simpan flag `announced_shown_<sessionId>` di `sessionStorage` supaya tidak muncul lagi di session yang sama
- Popup hanya tampil untuk role: teacher, parent, principal (tidak untuk admin)

---

## Komponen & File

### Tipe Data Baru (lib/types.ts)
```typescript
export interface Announcement {
  id: string;
  title: string;
  content: string; // HTML string from Quill
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AnnouncementRead {
  id: string;
  announcementId: string;
  userId: string;
  readAt: string;
}
```

### Database Functions (lib/db.ts, tambahan)
- `getActiveAnnouncements()`: ambil semua pengumuman aktif & dalam rentang tanggal
- `getAnnouncementsAdmin()`: admin — ambil semua pengumuman (termasuk nonaktif)
- `createAnnouncement(data)`: buat pengumuman baru
- `updateAnnouncement(id, data)`: update pengumuman
- `deleteAnnouncement(id)`: hapus pengumuman
- `getAnnouncementReads(userId)`: ambil semua announcement_id yang sudah dibaca user ini
- `markAnnouncementRead(announcementId, userId)`: insert ke announcement_reads
- `markAllAnnouncementsRead(userId)`: bulk insert untuk semua pengumuman aktif yang belum dibaca

### Admin Pages
- `app/admin/pengumuman/page.tsx` — tabel daftar semua pengumuman + CRUD
- `app/admin/pengumuman/baru/page.tsx` — form buat pengumuman baru
- `app/admin/pengumuman/[id]/edit/page.tsx` — form edit pengumuman

### User Pages (shared across teacher, parent, principal)
- `app/pengumuman/page.tsx` — halaman list pengumuman (dengan context auth, redirect berdasarkan role)

### Komponen Reusable
- `app/components/AnnouncementBell.tsx` — ikon lonceng dengan badge merah
- `app/components/AnnouncementPopup.tsx` — modal popup pengumuman pertama login
- `app/components/AnnouncementCard.tsx` — kartu pengumuman dalam list

### Modifikasi Layout
- `app/teacher/layout.tsx` — tambah tab lonceng di bottom nav + integrasi AnnouncementPopup
- `app/parent/layout.tsx` — tambah tab lonceng di bottom nav + integrasi AnnouncementPopup
- `app/principal/layout.tsx` — tambah tab lonceng di bottom nav + integrasi AnnouncementPopup
- `app/admin/layout.tsx` — tambah menu "Pengumuman" di sidebar admin

---

## Design UI (Tema PAUD Darul Khairat)

### Warna Badge & Notifikasi
- Badge merah: `#E74C3C` (accent-coral dari design system)
- Background pengumuman baru: highlight amber lembut `rgba(243, 156, 18, 0.08)`
- Border-left pengumuman penting: amber `#F39C12`

### Popup Modal
- Header gradient hijau Islami: `linear-gradient(135deg, #1E8449 0%, #27AE60 100%)`
- Emoji 📢 di bagian atas
- Konten HTML dari Quill dirender dengan `dangerouslySetInnerHTML`
- Dua tombol: "Tandai Sudah Dibaca ✅" (primary hijau) dan "Nanti 🔔" (outline)

### Tab Lonceng Bottom Nav
- Ikon: 🔔
- Badge merah bulat kecil dengan angka count di pojok kanan atas ikon
- Animasi pulse jika ada notif baru (CSS animation)

### Halaman List Pengumuman (user)
- Header: "📢 Pengumuman Sekolah"
- Banner kecil: "Tandai Semua Sudah Dibaca" di bagian atas
- Kartu pengumuman: tanggal periode, judul bold, preview isi, status dibaca/belum
- Pengumuman belum dibaca: highlight background amber ringan
- Tombol "Baca Selengkapnya" → expand inline atau modal detail

---

## Validasi Form Admin
- Judul: required, max 100 karakter
- Tanggal mulai: required
- Tanggal selesai: required, harus >= tanggal mulai
- Isi: required (Quill tidak boleh kosong)
- Status: toggle aktif/nonaktif

---

## Dependencies Baru
- `quill` atau `react-quill` (untuk rich text editor di admin form)
- Karena Next.js 13+ App Router, perlu dynamic import dengan `ssr: false` untuk Quill

---

## Verifikasi
1. Admin bisa buat, edit, hapus, toggle status pengumuman
2. Pengumuman expired (melewati end_date atau dinonaktifkan) tidak muncul di sisi user
3. Popup muncul sekali per session setelah login untuk role non-admin jika ada pengumuman belum dibaca
4. Badge lonceng menunjukkan jumlah pengumuman aktif yang belum dibaca (real-time setelah aksi tandai)
5. Tandai individual ✅ dan tandai semua ✅ keduanya berfungsi dan badge berkurang
6. Quill editor di form admin bisa bold, italic, underline, list dengan benar
