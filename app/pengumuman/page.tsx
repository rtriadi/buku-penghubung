// app/pengumuman/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
  getActiveAnnouncements,
  getMyAnnouncementReads,
  markAnnouncementRead,
  markAllAnnouncementsRead,
} from '@/lib/db';
import type { Announcement } from '@/lib/types';
import AnnouncementCard from '@/app/components/AnnouncementCard';

export default function PengumumanPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
    if (!isLoading && user?.role === 'admin') {
      router.replace('/admin/pengumuman');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      try {
        const [data, reads] = await Promise.all([
          getActiveAnnouncements(),
          getMyAnnouncementReads(user.id),
        ]);
        setAnnouncements(data);
        setReadIds(reads);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (user) load();
  }, [user]);

  const handleMarkRead = async (id: string) => {
    if (!user) return;
    await markAnnouncementRead(id, user.id);
    setReadIds(prev => [...prev, id]);
  };

  const handleMarkAll = async () => {
    if (!user) return;
    setMarkingAll(true);
    await markAllAnnouncementsRead(user.id);
    setReadIds(announcements.map(a => a.id));
    setMarkingAll(false);
  };

  const unreadAnnouncements = announcements.filter(a => !readIds.includes(a.id));
  const readAnnouncements = announcements.filter(a => readIds.includes(a.id));

  const getHeaderGradient = () => {
    if (!user) return 'linear-gradient(135deg, #1E8449 0%, #27AE60 100%)';
    if (user.role === 'principal') {
      return 'linear-gradient(135deg, #5B2C6F 0%, #8E44AD 50%, #BB8FCE 100%)';
    }
    if (user.role === 'parent') {
      return 'linear-gradient(135deg, #1A5276 0%, #2980B9 50%, #3498DB 100%)';
    }
    return 'linear-gradient(135deg, #1E8449 0%, #27AE60 100%)';
  };

  if (isLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-cream, #FDFAF6)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', animation: 'spin-slow 1s linear infinite', marginBottom: '12px' }}>⏳</div>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#5D6D7E' }}>Memuat pengumuman...</p>
        </div>
      </div>
    );
  }

  const roleColor = user?.role === 'principal' ? '#8E44AD' : user?.role === 'parent' ? '#2980B9' : '#1E8449';
  const roleBorder = user?.role === 'principal' ? 'rgba(142, 68, 173, 0.4)' : user?.role === 'parent' ? 'rgba(41, 128, 185, 0.4)' : 'rgba(39, 174, 96, 0.4)';
  const roleBg = user?.role === 'principal' ? 'rgba(142, 68, 173, 0.08)' : user?.role === 'parent' ? 'rgba(41, 128, 185, 0.08)' : 'rgba(39, 174, 96, 0.08)';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-cream, #FDFAF6)',
      fontFamily: 'Nunito, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: getHeaderGradient(),
        padding: '24px 20px 28px',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        boxShadow: user?.role === 'principal' 
          ? '0 4px 20px rgba(142, 68, 173, 0.2)' 
          : user?.role === 'parent' 
          ? '0 4px 20px rgba(41, 128, 185, 0.2)' 
          : '0 4px 20px rgba(39, 174, 96, 0.2)',
      }}>
        {/* Back button */}
        <button
          onClick={() => {
            if (user) {
              if (user.role === 'parent') router.push('/parent/dashboard');
              else if (user.role === 'teacher') router.push('/teacher/dashboard');
              else if (user.role === 'principal') router.push('/principal/dashboard');
              else router.push('/');
            } else {
              router.push('/');
            }
          }}
          style={{
            position: 'absolute',
            top: '20px',
            left: '16px',
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '12px',
            padding: '8px 12px',
            color: 'white',
            fontWeight: 800,
            fontSize: '0.78rem',
            cursor: 'pointer',
            fontFamily: 'Nunito, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'translateX(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <span>⬅️</span>
          <span>Kembali</span>
        </button>

        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📢</div>
        <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, fontFamily: 'Nunito, sans-serif' }}>
          Pengumuman Sekolah
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
          PAUD IT Darul Khairat
        </p>
      </div>

      <div style={{ padding: '16px 16px 100px', maxWidth: '600px', margin: '0 auto' }}>

        {/* Tandai Semua button */}
        {unreadAnnouncements.length > 0 && (
          <div style={{ marginBottom: '20px', marginTop: '4px' }}>
            <button
              onClick={handleMarkAll}
              disabled={markingAll}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '14px',
                border: `1.5px solid ${roleBorder}`,
                background: roleBg,
                color: roleColor,
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: markingAll ? 'not-allowed' : 'pointer',
                fontFamily: 'Nunito, sans-serif',
                transition: 'all 0.2s',
              }}
            >
              {markingAll ? '⏳ Memproses...' : `✅ Tandai Semua Sudah Dibaca (${unreadAnnouncements.length})`}
            </button>
          </div>
        )}

        {/* Unread section */}
        {unreadAnnouncements.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#F39C12',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '12px',
            }}>
              🔔 Belum Dibaca ({unreadAnnouncements.length})
            </div>
            {unreadAnnouncements.map(a => (
              <AnnouncementCard
                key={a.id}
                announcement={a}
                isRead={false}
                onMarkRead={handleMarkRead}
                role={user?.role}
              />
            ))}
          </div>
        )}

        {/* Read section */}
        {readAnnouncements.length > 0 && (
          <div>
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#AEB6BF',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '12px',
            }}>
              ✅ Sudah Dibaca ({readAnnouncements.length})
            </div>
            {readAnnouncements.map(a => (
              <AnnouncementCard
                key={a.id}
                announcement={a}
                isRead={true}
                onMarkRead={handleMarkRead}
                role={user?.role}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {announcements.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#AEB6BF',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📭</div>
            <h3 style={{ fontWeight: 800, color: '#5D6D7E', marginBottom: '8px', fontFamily: 'Nunito, sans-serif' }}>
              Tidak Ada Pengumuman
            </h3>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
              Belum ada pengumuman aktif dari sekolah saat ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
