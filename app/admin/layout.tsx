// app/admin/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  // Mobile responsiveness states
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // run initially
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  if (!mounted || isLoading || !user || user.role !== 'admin') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f6f9',
        fontFamily: 'Nunito, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', animation: 'spin-slow 1s linear infinite', marginBottom: '16px' }}>⏳</div>
          <p style={{ fontWeight: 700, color: '#2C3E50' }}>Memuat Halaman Admin...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { href: '/admin', label: 'Dashboard', emoji: '📊' },
    { href: '/admin/siswa', label: 'Manajemen Siswa', emoji: '👦' },
    { href: '/admin/guru', label: 'Manajemen Guru', emoji: '👩‍🏫' },
    { href: '/admin/wali', label: 'Manajemen Wali Ortu', emoji: '👨‍👩' },
    { href: '/admin/aktivitas', label: 'Aktivitas Harian', emoji: '⚙️' },
    { href: '/admin/kelas', label: 'Manajemen Kelas', emoji: '🏫' },
  ];

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#f4f6f9',
      fontFamily: 'Nunito, sans-serif',
    }}>
      {/* Backdrop for mobile drawer */}
      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(3px)',
            zIndex: 9,
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: '#1E8449', // Islamic Green Primary
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 10px rgba(0,0,0,0.05)',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 10,
        transform: isMobile ? (isSidebarOpen ? 'translateX(0)' : 'translateX(-260px)') : 'none',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/logo-darul-khairat.png"
              alt="Logo"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'white',
                padding: '2px',
                objectFit: 'contain',
              }}
            />
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 900, margin: 0 }}>DK IT Admin</h2>
              <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Buku Penghubung</span>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {menuItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{item.emoji}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Footer info */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/logo-darul-khairat.png"
              alt="Logo Darul Khairat"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'white',
                padding: '2px',
                border: '1.5px solid rgba(255,255,255,0.2)',
                objectFit: 'contain',
              }}
            />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>Administrator</span>
            </div>
          </div>
          <button
            onClick={() => { logout(); router.push('/login'); }}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.8rem',
              transition: 'background 0.2s',
            }}
          >
            🚪 Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        marginLeft: isMobile ? 0 : '260px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
      }}>
        {/* Top Header Bar */}
        <header style={{
          height: '70px',
          background: 'white',
          borderBottom: '1px solid #E8ECF0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 16px' : '0 30px',
          position: 'sticky',
          top: 0,
          zIndex: 5,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isMobile && (
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                style={{
                  background: '#F0F3F5',
                  border: 'none',
                  borderRadius: '10px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  color: '#2C3E50',
                }}
              >
                ☰
              </button>
            )}
            <h1 style={{
              fontSize: isMobile ? '1rem' : '1.2rem',
              fontWeight: 800,
              color: '#2C3E50',
              margin: 0,
            }}>
              {menuItems.find(item => item.href === pathname)?.label || 'Panel Admin'}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '0.75rem',
              background: '#E8F8EF',
              color: '#1E8449',
              padding: '6px 12px',
              borderRadius: '20px',
              fontWeight: 800,
            }}>
              {isMobile ? '🕌 PAUD' : '🕌 PAUD Darul Khairat'}
            </span>
          </div>
        </header>

        {/* Content Body */}
        <main style={{ flex: 1, padding: isMobile ? '16px' : '30px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
