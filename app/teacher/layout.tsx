'use client';

import { useEffect } from 'react';
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
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem',
            }}>
              🕌
            </div>
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
          onClick={() => { logout(); router.replace('/login'); }}
          className="bottom-nav-item"
        >
          <span className="nav-icon">👤</span>
          <span>Profil</span>
        </button>
      </nav>
    </div>
  );
}
