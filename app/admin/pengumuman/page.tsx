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
  const [isMobile, setIsMobile] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllAnnouncements();
      setAnnouncements(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: '16px',
        marginBottom: '24px'
      }}>
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
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 18px',
            background: 'linear-gradient(135deg, #27AE60, #2ECC71)',
            color: 'white',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '0.85rem',
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(39,174,96,0.2)',
            whiteSpace: 'nowrap',
            width: isMobile ? '100%' : 'auto',
            transition: 'all 0.2s',
            textAlign: 'center',
          }}
        >
          ➕ Buat Pengumuman Baru
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#1E8449', fontFamily: 'Nunito, sans-serif' }}>
          <div style={{ fontSize: '2rem', animation: 'spin-slow 1s linear infinite', marginBottom: '12px' }}>⏳</div>
          <p style={{ fontWeight: 700 }}>Memuat data...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#AEB6BF', background: 'white', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', border: '1px solid #E8ECF0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
          <p style={{ fontWeight: 700, color: '#5D6D7E', fontFamily: 'Nunito, sans-serif', marginBottom: '8px' }}>Belum ada pengumuman</p>
          <Link href="/admin/pengumuman/baru" style={{ color: '#27AE60', fontWeight: 800, textDecoration: 'none', fontSize: '0.9rem' }}>
            + Buat pengumuman pertama
          </Link>
        </div>
      ) : isMobile ? (
        /* Mobile layout: stack of cards */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {announcements.map(a => {
            const status = getStatus(a);
            return (
              <div 
                key={a.id} 
                className="card" 
                style={{ 
                  padding: '16px', 
                  border: '1.5px solid #E8ECF0', 
                  borderRadius: '16px', 
                  marginBottom: 0,
                  background: 'white',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#2C3E50', lineHeight: 1.3 }}>
                    {a.title}
                  </h4>
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: status.bg,
                    color: status.color,
                    fontWeight: 800,
                    fontSize: '0.68rem',
                    flexShrink: 0,
                  }}>
                    {status.label}
                  </span>
                </div>

                <p style={{ 
                  fontSize: '0.78rem', 
                  color: '#7F8C8D', 
                  marginBottom: '12px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.4,
                }}>
                  {a.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
                </p>

                <div style={{
                  background: '#F8F9FA',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '0.78rem',
                  color: '#5D6D7E',
                  marginBottom: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}>
                  <div>📅 <strong>Mulai:</strong> {formatDate(a.startDate)}</div>
                  <div>⌛ <strong>Selesai:</strong> {formatDate(a.endDate)}</div>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F0F3F4', paddingTop: '12px' }}>
                  <button
                    onClick={() => handleToggleActive(a)}
                    disabled={togglingId === a.id}
                    style={{
                      flex: 1,
                      minWidth: '90px',
                      background: a.isActive ? '#FDEDEC' : '#E8F8F5',
                      border: `1px solid ${a.isActive ? '#FADBD8' : '#A9DFBF'}`,
                      borderRadius: '8px',
                      padding: '8px',
                      cursor: togglingId === a.id ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem',
                      color: a.isActive ? '#C0392B' : '#1E8449',
                      fontWeight: 700,
                    }}
                  >
                    {togglingId === a.id ? '⏳' : a.isActive ? '🔴 Nonaktif' : '🟢 Aktifkan'}
                  </button>

                  <Link
                    href={`/admin/pengumuman/${a.id}/edit`}
                    style={{
                      flex: 1,
                      minWidth: '70px',
                      background: '#F8F9FA',
                      border: '1px solid #E8ECF0',
                      borderRadius: '8px',
                      padding: '8px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: '#5D6D7E',
                      fontWeight: 700,
                      textAlign: 'center',
                      textDecoration: 'none',
                    }}
                  >
                    ✏️ Edit
                  </Link>

                  <button
                    onClick={() => handleDelete(a.id, a.title)}
                    disabled={deletingId === a.id}
                    style={{
                      background: '#FDEDEC',
                      border: '1px solid #FADBD8',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      cursor: deletingId === a.id ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem',
                      color: '#E74C3C',
                    }}
                  >
                    {deletingId === a.id ? '⏳' : '🗑️'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop layout: table inside card */
        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #E8ECF0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E8ECF0' }}>
                  {['Judul', 'Periode Pengumuman', 'Status', 'Aksi'].map(col => (
                    <th key={col} style={{
                      padding: '16px 20px',
                      fontWeight: 800,
                      color: '#5D6D7E',
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
                      borderBottom: i === announcements.length - 1 ? 'none' : '1px solid #E8ECF0',
                      background: i % 2 === 0 ? '#FAFAFA' : 'white',
                    }}>
                      <td style={{ padding: '16px 20px', fontWeight: 800, color: '#2C3E50' }}>
                        <div>{a.title}</div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#7F8C8D',
                          fontWeight: 'normal',
                          maxWidth: '350px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: '3px',
                        }}>
                          {a.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', color: '#5D6D7E', fontSize: '0.85rem' }}>
                        <div><strong>Mulai:</strong> {formatDate(a.startDate)}</div>
                        <div style={{ marginTop: '2px' }}><strong>Selesai:</strong> {formatDate(a.endDate)}</div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: status.bg,
                          color: status.color,
                          fontWeight: 800,
                          fontSize: '0.75rem',
                        }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleToggleActive(a)}
                            disabled={togglingId === a.id}
                            style={{
                              background: a.isActive ? '#FDEDEC' : '#E8F8F5',
                              border: `1px solid ${a.isActive ? '#FADBD8' : '#A9DFBF'}`,
                              borderRadius: '8px',
                              padding: '6px 10px',
                              cursor: togglingId === a.id ? 'not-allowed' : 'pointer',
                              fontSize: '0.8rem',
                              color: a.isActive ? '#C0392B' : '#1E8449',
                              fontWeight: 700,
                              fontFamily: 'Nunito, sans-serif',
                            }}
                          >
                            {togglingId === a.id ? '⏳' : a.isActive ? '🔴 Nonaktifkan' : '🟢 Aktifkan'}
                          </button>
                          <Link
                            href={`/admin/pengumuman/${a.id}/edit`}
                            style={{
                              background: '#F8F9FA',
                              border: '1px solid #E8ECF0',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              color: '#2C3E50',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'inline-block',
                            }}
                          >
                            ✏️ Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(a.id, a.title)}
                            disabled={deletingId === a.id}
                            style={{
                              background: '#FDEDEC',
                              border: '1px solid #FADBD8',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              cursor: deletingId === a.id ? 'not-allowed' : 'pointer',
                              fontSize: '0.8rem',
                              color: '#E74C3C',
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
        </div>
      )}
    </div>
  );
}
