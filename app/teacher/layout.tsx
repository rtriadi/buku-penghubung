'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { SCHOOL_NAME, CLASS_NAME } from '@/lib/constants';
import { getGreeting } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/teacher/dashboard', emoji: '🏠', label: 'Beranda' },
  { href: '/teacher/rekap', emoji: '📊', label: 'Rekap' },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'teacher')) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-cream)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }} className="animate-pulse-soft">🕌</div>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: 'var(--primary)' }}>Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ minHeight: '100vh', background: 'var(--bg-cream)' }}>
      {/* Top Header */}
      <header className="top-header bg-islamic-pattern">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/logo-darul-khairat.png"
              alt="Logo Darul Khairat"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'white',
                padding: '3px',
                border: '1.5px solid rgba(255,255,255,0.2)',
                objectFit: 'contain',
              }}
            />
            <div>
              <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.95rem', color: 'white', lineHeight: 1.2 }}>
                {SCHOOL_NAME.split(' ').slice(0, 3).join(' ')}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
                {CLASS_NAME} • {getGreeting()}, Bu {user.name.split(' ')[1] || user.name.split(' ')[0]}! 👋
              </div>
            </div>
          </div>
          <button
            onClick={() => { logout(); router.replace('/login'); }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 12px',
              color: 'white',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.emoji}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        <button
          onClick={() => setShowProfileModal(true)}
          className="bottom-nav-item"
        >
          <span className="nav-icon">👤</span>
          <span>Profil</span>
        </button>
      </nav>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="modal-backdrop" onClick={() => setShowProfileModal(false)}>
          <div className="modal-container animate-fade-in-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h3 className="modal-title" style={{ fontSize: '1.1rem' }}>Profil Pengguna 👤</h3>
              <button 
                onClick={() => setShowProfileModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-medium)' }}
              >
                ×
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '24px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <img 
                  src="/logo-darul-khairat.png" 
                  alt="Logo Darul Khairat" 
                  style={{ width: '70px', height: '70px', objectFit: 'contain', borderRadius: '16px', background: 'white', padding: '6px', border: '1px solid #E8ECF0' }}
                />
              </div>
              <h2 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1.15rem', color: '#2C3E50', marginBottom: '4px' }}>
                {user.name}
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#27AE60', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
                👩‍🏫 {user.role === 'teacher' ? 'Guru Kelas A' : user.role}
              </p>
              <div style={{ background: '#F8F9FA', borderRadius: '12px', padding: '12px 14px', textAlign: 'left', marginBottom: '20px', border: '1px solid #F0F2F5' }}>
                <div style={{ fontSize: '0.72rem', color: '#AEB6BF', marginBottom: '2px' }}>📧 Email Akun</div>
                <div style={{ fontSize: '0.85rem', color: '#2C3E50', fontWeight: 700, wordBreak: 'break-all' }}>{user.email}</div>
                
                <div style={{ height: '1px', background: '#F0F2F5', margin: '8px 0' }} />
                
                <div style={{ fontSize: '0.72rem', color: '#AEB6BF', marginBottom: '2px' }}>🏫 Sekolah</div>
                <div style={{ fontSize: '0.85rem', color: '#2C3E50', fontWeight: 700 }}>PAUD IT Darul Khairat</div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '10px', fontSize: '0.85rem', borderRadius: '10px' }}
                >
                  Tutup
                </button>
                <button 
                  onClick={() => { logout(); router.replace('/login'); }}
                  className="btn btn-danger"
                  style={{ flex: 1, padding: '10px', fontSize: '0.85rem', borderRadius: '10px', background: '#E74C3C', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                >
                  Keluar 🚪
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
