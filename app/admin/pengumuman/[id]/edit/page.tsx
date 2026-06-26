// app/admin/pengumuman/[id]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getAllAnnouncements, updateAnnouncement } from '@/lib/db';
import type { Announcement } from '@/lib/types';
import AnnouncementForm from '../../_components/AnnouncementForm';

export default function EditPengumumanPage({ params }: { params: { id: string } }) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const all = await getAllAnnouncements();
      const found = all.find(a => a.id === params.id);
      setAnnouncement(found || null);
      setLoading(false);
    }
    load();
  }, [params.id]);

  const handleSubmit = async (data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    await updateAnnouncement(params.id, data);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', fontFamily: 'Nunito, sans-serif' }}>
        <div style={{ fontSize: '2rem', animation: 'spin-slow 1s linear infinite' }}>⏳</div>
        <p style={{ color: '#5D6D7E', fontWeight: 700, marginTop: '12px' }}>Memuat data pengumuman...</p>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', fontFamily: 'Nunito, sans-serif' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
        <p style={{ color: '#E74C3C', fontWeight: 700 }}>Pengumuman tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#2C3E50' }}>
          ✏️ Edit Pengumuman
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#5D6D7E' }}>
          {announcement.title}
        </p>
      </div>
      <AnnouncementForm
        initialData={announcement}
        onSubmit={handleSubmit}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}
