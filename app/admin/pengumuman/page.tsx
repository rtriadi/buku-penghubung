// app/admin/pengumuman/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllAnnouncements, deleteAnnouncement, updateAnnouncement } from '@/lib/db';
import type { Announcement } from '@/lib/types';

export default function AdminPengumumanPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllAnnouncements();
      setAnnouncements(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const today = new Date().toISOString().split('T')[0];

  const getStatus = (a: Announcement) => {
    if (!a.isActive) return { label: 'Nonaktif', color: '#AEB6BF', bg: '#F5F6FA' };
    if (a.endDate < today) return { label: 'Expired', color: '#E74C3C', bg: '#FEF0EF' };
    if (a.startDate > today) return { label: 'Terjadwal', color: '#F39C12', bg: '#FEF9EF' };
    return { label: 'Aktif', color: '#27AE60', bg: '#EAFAF1' };
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Yakin hapus pengumuman "${title}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setDeletingId(id);
    await deleteAnnouncement(id);
    setDeletingId(null);
    load();
  };

  const handleToggleActive = async (a: Announcement) => {
    setTogglingId(a.id);
    await updateAnnouncement(a.id, { isActive: !a.isActive });
    setTogglingId(null);
    load();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#2C3E50' }}>
            📢 Pengumuman / Informasi
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#5D6D7E' }}>
            Kelola pengumuman yang ditampilkan ke seluruh pengguna
          </p>
        </div>
        <Link
          href="/admin/pengumuman/baru"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 20px',
            background: 'linear-gradient(135deg, #1E8449 0%, #27AE60 100%)',
            color: 'white',
            borderRadius: '14px',
            fontWeight: 800,
            fontSize: '0.88rem',
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(39,174,96,0.25)',
            transition: 'all 0.2s',
          }}
        >
          ➕ Buat Pengumuman
        </Link>
      </div>

      {/* Table Card */}
      <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#AEB6BF' }}>
            <div style={{ fontSize: '2rem', animation: 'spin-slow 1s linear infinite' }}>⏳</div>
            <p style={{ marginTop: '12px', fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}>Memuat data...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#AEB6BF' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
            <p style={{ fontWeight: 700, color: '#5D6D7E', fontFamily: 'Nunito, sans-serif' }}>Belum ada pengumuman</p>
            <Link href="/admin/pengumuman/baru" style={{ color: '#27AE60', fontWeight: 800, textDecoration: 'none', fontSize: '0.9rem' }}>
              + Buat pengumuman pertama
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFB' }}>
                  {['Judul', 'Periode', 'Status', 'Aksi'].map(col => (
                    <th key={col} style={{
                      padding: '14px 16px',
                      textAlign: 'left',
                      fontWeight: 800,
                      color: '#5D6D7E',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: '1px solid #F0F2F5',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {announcements.map((a, i) => {
                  const status = getStatus(a);
                  return (
                    <tr key={a.id} style={{
                      borderBottom: i < announcements.length - 1 ? '1px solid #F0F2F5' : 'none',
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFBFC'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#2C3E50', marginBottom: '3px' }}>{a.title}</div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#5D6D7E',
                          maxWidth: '280px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {a.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 80)}...
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.8rem', color: '#2C3E50', fontWeight: 600 }}>
                          {formatDate(a.startDate)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#AEB6BF' }}>
                          s/d {formatDate(a.endDate)}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          background: status.bg,
                          color: status.color,
                          fontWeight: 800,
                          fontSize: '0.73rem',
                        }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {/* Toggle aktif/nonaktif */}
                          <button
                            onClick={() => handleToggleActive(a)}
                            disabled={togglingId === a.id}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: 'none',
                              background: a.isActive ? '#FEF0EF' : '#EAFAF1',
                              color: a.isActive ? '#E74C3C' : '#27AE60',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              fontFamily: 'Nunito, sans-serif',
                            }}
                          >
                            {togglingId === a.id ? '⏳' : a.isActive ? '🔴 Nonaktifkan' : '🟢 Aktifkan'}
                          </button>

                          {/* Edit */}
                          <Link
                            href={`/admin/pengumuman/${a.id}/edit`}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              background: '#EBF5FB',
                              color: '#2980B9',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              textDecoration: 'none',
                              display: 'inline-block',
                            }}
                          >
                            ✏️ Edit
                          </Link>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(a.id, a.title)}
                            disabled={deletingId === a.id}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#FEF0EF',
                              color: '#E74C3C',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              fontFamily: 'Nunito, sans-serif',
                            }}
                          >
                            {deletingId === a.id ? '⏳' : '🗑️ Hapus'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
