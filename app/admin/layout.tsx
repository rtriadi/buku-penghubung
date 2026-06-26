// app/admin/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  // Profile editing states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (showProfileModal && user) {
      setProfileName(user.name);
      setProfilePassword('');
      setProfileError('');
      setProfileSuccess('');
    }
  }, [showProfileModal, user]);
  
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

  // Redirect unauthorized or logged out users to login page
  useEffect(() => {
    if (mounted && !isLoading && (!user || user.role !== 'admin')) {
      router.replace('/login');
    }
  }, [user, isLoading, router, mounted]);

  if (!mounted || isLoading || !user || user.role !== 'admin') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-cream)',
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
    { href: '/admin/siswa', label: 'Manajemen Siswa', emoji: '👶' },
    { href: '/admin/guru', label: 'Manajemen Guru', emoji: '👩‍🏫' },
    { href: '/admin/wali', label: 'Manajemen Wali', emoji: '👨‍👩' },
    { href: '/admin/aktivitas', label: 'Aktivitas Harian', emoji: '⚙️' },
    { href: '/admin/kelas', label: 'Manajemen Kelas', emoji: '🏫' },
    { href: '/admin/pengumuman', label: 'Pengumuman', emoji: '📢' },
  ];

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-cream)',
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
        background: 'var(--role-admin-dark)', // Islamic Green Primary
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
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
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
          <div
            onClick={() => setShowProfileModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0)',
              transition: 'all 0.2s ease',
              width: '100%',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0)'}
            title="Klik untuk ubah profil"
          >
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
                flexShrink: 0,
              }}
            />
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <span style={{ fontSize: '0.7rem', opacity: 0.7, display: 'block' }}>Administrator ✏️</span>
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

      {/* Profile Modal */}
      {showProfileModal && user && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out',
        }}>
          {/* Modal Container */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            width: '90%',
            maxWidth: '440px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid #E8ECF0',
            overflow: 'hidden',
            animation: 'scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            fontFamily: 'Nunito, sans-serif',
          }}>
            {/* Header with Islamic Green Gradient */}
            <div style={{
              background: 'linear-gradient(135deg, var(--role-admin-dark) 0%, var(--role-admin) 100%)',
              padding: '24px',
              color: 'white',
              position: 'relative',
              textAlign: 'center',
            }}>
              <button
                onClick={() => setShowProfileModal(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                ✕
              </button>
              
              {/* Profile Avatar Area */}
              <div style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                background: 'white',
                margin: '0 auto 12px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                border: '3px solid rgba(255,255,255,0.4)',
              }}>
                <img
                  src="/logo-darul-khairat.png"
                  alt="Avatar"
                  style={{
                    width: '54px',
                    height: '54px',
                    objectFit: 'contain',
                  }}
                />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Profil Administrator</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>{user.email}</p>
            </div>

            {/* Modal Body Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setProfileError('');
                setProfileSuccess('');
                setProfileLoading(true);

                try {
                  const res = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: user.id,
                      name: profileName.trim(),
                      password: profilePassword ? profilePassword : undefined,
                    }),
                  });

                  const data = await res.json();
                  if (!res.ok || data.error) {
                    throw new Error(data.error || 'Gagal memperbarui profil');
                  }

                  // Refresh auth-context state so UI updates instantly
                  await refreshUser();
                  setProfileSuccess('Profil berhasil diperbarui! 🎉');
                  setProfilePassword(''); // clear password input field
                } catch (err: any) {
                  setProfileError(err.message || 'Terjadi kesalahan saat menyimpan.');
                } finally {
                  setProfileLoading(false);
                }
              }}
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Form Field: Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#4A5568',
                  marginBottom: '6px',
                }}>
                  📛 Nama Lengkap
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #CBD5E0',
                    fontSize: '0.9rem',
                    color: '#2D3748',
                    fontFamily: 'Nunito, sans-serif',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#27AE60'}
                  onBlur={(e) => e.target.style.borderColor = '#CBD5E0'}
                />
              </div>

              {/* Form Field: Password */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#4A5568',
                  marginBottom: '6px',
                }}>
                  🔒 Ubah Password (opsional)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    placeholder="Kosongkan jika tidak ingin mengubah"
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '12px 42px 12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E0',
                      fontSize: '0.9rem',
                      color: '#2D3748',
                      fontFamily: 'Nunito, sans-serif',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#27AE60'}
                    onBlur={(e) => e.target.style.borderColor = '#CBD5E0'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      padding: 0,
                      color: '#A0AEC0',
                    }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <small style={{ display: 'block', marginTop: '4px', fontSize: '0.7rem', color: '#718096' }}>
                  Password minimal harus 6 karakter.
                </small>
              </div>

              {/* Notifications */}
              {profileError && (
                <div style={{
                  background: '#FED7D7',
                  color: '#C53030',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  ⚠️ {profileError}
                </div>
              )}

              {profileSuccess && (
                <div style={{
                  background: '#C6F6D5',
                  color: '#22543D',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  {profileSuccess}
                </div>
              )}

              {/* Submit / Cancel Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '8px',
              }}>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1.5px solid #E2E8F0',
                    background: '#F7FAFC',
                    color: '#4A5568',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    fontFamily: 'Nunito, sans-serif',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#EDF2F7'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#F7FAFC'}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, var(--role-admin-dark) 0%, var(--role-admin) 100%)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: profileLoading ? 'not-allowed' : 'pointer',
                    fontFamily: 'Nunito, sans-serif',
                    boxShadow: '0 4px 12px rgba(30, 132, 73, 0.2)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!profileLoading) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(39, 174, 96, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!profileLoading) {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(39, 174, 96, 0.2)';
                    }
                  }}
                >
                  {profileLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span style={{ animation: 'spin-slow 1s linear infinite', display: 'inline-block' }}>⏳</span>
                      Menyimpan...
                    </span>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
