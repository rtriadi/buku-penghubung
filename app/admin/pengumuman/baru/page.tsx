// app/admin/pengumuman/baru/page.tsx
'use client';

import { useAuth } from '@/lib/auth-context';
import { createAnnouncement } from '@/lib/db';
import type { Announcement } from '@/lib/types';
import AnnouncementForm from '../_components/AnnouncementForm';

export default function BuatPengumumanPage() {
  const { user } = useAuth();

  const handleSubmit = async (data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    await createAnnouncement({ ...data, createdBy: user?.id });
  };

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#2C3E50' }}>
          ➕ Buat Pengumuman Baru
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#5D6D7E' }}>
          Isi form berikut untuk membuat pengumuman baru yang akan tampil ke semua pengguna
        </p>
      </div>
      <AnnouncementForm onSubmit={handleSubmit} submitLabel="Publikasikan Pengumuman" />
    </div>
  );
}
