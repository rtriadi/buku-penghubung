// app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const [role, setRole] = useState<'teacher' | 'parent' | 'admin' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        router.replace('/admin');
      } else if (user.role === 'teacher') {
        router.replace('/teacher/dashboard');
      } else {
        router.replace('/parent/dashboard');
      }
    }
  }, [user, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!role) { setError('Pilih peran Anda terlebih dahulu'); return; }
    setIsLoading(true);
    setError('');
    
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || 'Login gagal');
      setIsLoading(false);
    } else {
      // Role checking: ensure logging in matches selected role
      const stored = localStorage.getItem('buku_penghubung_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.role !== role) {
          setError(`Email ini terdaftar sebagai ${u.role === 'teacher' ? 'Guru' : u.role === 'admin' ? 'Admin' : 'Orang Tua'}. Silakan pilih peran yang sesuai.`);
          localStorage.removeItem('buku_penghubung_user');
          setIsLoading(false);
        }
      }
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #1E8449 0%, #27AE60 40%, #2ECC71 70%, #A9DFBF 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Floating decorations */}
      <div style={{ position: 'absolute', top: '5%', left: '5%', fontSize: '3rem', opacity: 0.2, pointerEvents: 'none', zIndex: 1 }} className="animate-float">🌙</div>
      <div style={{ position: 'absolute', top: '10%', right: '8%', fontSize: '2rem', opacity: 0.25, pointerEvents: 'none', zIndex: 1 }} className="animate-float-slow delay-200">⭐</div>
      <div style={{ position: 'absolute', top: '20%', left: '15%', fontSize: '1.5rem', opacity: 0.2, pointerEvents: 'none', zIndex: 1 }} className="animate-float delay-300">✨</div>
      <div style={{ position: 'absolute', bottom: '25%', right: '5%', fontSize: '2.5rem', opacity: 0.2, pointerEvents: 'none', zIndex: 1 }} className="animate-float-slow delay-100">🌟</div>
      <div style={{ position: 'absolute', bottom: '15%', left: '8%', fontSize: '2rem', opacity: 0.2, pointerEvents: 'none', zIndex: 1 }} className="animate-float delay-400">☁️</div>
      <div style={{ position: 'absolute', top: '40%', right: '3%', fontSize: '1.5rem', opacity: 0.15, pointerEvents: 'none', zIndex: 1 }} className="animate-float delay-500">🌿</div>

      {/* Islamic pattern overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M40 0L52 12L80 0L80 12L52 40L80 68L80 80L52 68L40 80L28 68L0 80L0 68L28 40L0 12L0 0L28 12Z' fill='none' stroke='%23ffffff' stroke-width='0.8' opacity='0.08'/%3E%3C/svg%3E")`,
        backgroundSize: '80px 80px',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Login Card */}
      <div className="animate-fade-in-up" style={{
        background: 'rgba(255,255,255,0.97)',
        borderRadius: '24px',
        padding: '20px 24px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* School Header */}
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '8px',
          }} className="animate-float">
            <img
              src="/logo-darul-khairat.png"
              alt="Logo Darul Khairat"
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'contain',
                borderRadius: '14px',
                boxShadow: '0 6px 18px rgba(39, 174, 96, 0.12)',
                background: '#fff',
                padding: '4px',
                border: '1.5px solid #E8ECF0',
              }}
            />
          </div>
          <h1 style={{
            fontFamily: 'Nunito, sans-serif',
            fontSize: '1.3rem',
            fontWeight: 900,
            color: '#1E8449',
            lineHeight: 1.2,
            marginBottom: '2px',
          }}>
            Buku Penghubung
          </h1>
          <p style={{
            fontFamily: 'Nunito, sans-serif',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#27AE60',
            marginBottom: '2px',
          }}>
            PAUD Islam Terpadu Darul Khairat
          </p>
          <p style={{ fontSize: '0.7rem', color: '#7f8c8d', fontStyle: 'italic' }}>
            Bismillahirrahmanirrahim 🤲
          </p>
        </div>

        {/* Role Selector */}
        <div style={{ marginBottom: '14px' }}>
          <p style={{
            textAlign: 'center',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            fontSize: '0.8rem',
            color: '#5D6D7E',
            marginBottom: '8px',
          }}>
            Saya adalah...
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { value: 'admin' as const, label: 'Admin', emoji: '⚙️', desc: 'Kelola data' },
              { value: 'teacher' as const, label: 'Guru', emoji: '👩‍🏫', desc: 'Laporan harian' },
              { value: 'parent' as const, label: 'Orang Tua', emoji: '👨‍👩', desc: 'Pantau anak' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setRole(opt.value); setError(''); }}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: '12px',
                  border: role === opt.value ? '2.5px solid #27AE60' : '1.5px solid #E8ECF0',
                  background: role === opt.value ? 'linear-gradient(135deg, #D5F5E3, #A9DFBF)' : '#F8F9FA',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                  boxShadow: role === opt.value ? '0 4px 10px rgba(39,174,96,0.15)' : 'none',
                  transform: role === opt.value ? 'translateY(-1px)' : 'none',
                }}
              >
                <div style={{ fontSize: '1.25rem', marginBottom: '2px' }}>{opt.emoji}</div>
                <div style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  color: role === opt.value ? '#1E8449' : '#2C3E50',
                }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: '0.6rem', color: '#7f8c8d', marginTop: '1px' }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label className="input-label" style={{ marginBottom: '4px', fontSize: '0.8rem' }}>📧 Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={role === 'admin' ? "admin@dkhairat.sch.id" : role === 'teacher' ? "guru@dkhairat.sch.id" : "orangtua@gmail.com"}
              className="input"
              style={{ padding: '10px 12px', fontSize: '0.9rem' }}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: '4px', fontSize: '0.8rem' }}>🔒 Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="input"
              style={{ padding: '10px 12px', fontSize: '0.9rem' }}
              required
              autoComplete="current-password"
              minLength={4}
            />
          </div>

          {error && (
            <div style={{
              background: '#FADBD8',
              color: '#C0392B',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              fontFamily: 'Nunito, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !role}
            className="btn btn-primary btn-full"
            style={{ marginTop: '4px', padding: '10px', fontSize: '0.95rem', borderRadius: '12px' }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                <span style={{ animation: 'spin-slow 1s linear infinite', display: 'inline-block' }}>⏳</span>
                Masuk...
              </span>
            ) : (
              <span>Masuk Sekarang 🚀</span>
            )}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          fontSize: '0.65rem',
          color: '#AEB6BF',
          marginTop: '8px',
          fontStyle: 'italic',
          marginBottom: 0,
        }}>
          Kesulitan login? Hubungi admin sekolah
        </p>
      </div>

      {/* Footer */}
      <footer style={{
        marginTop: '20px',
        fontSize: '0.75rem',
        color: 'rgba(255, 255, 255, 0.8)',
        fontFamily: 'Nunito, sans-serif',
        fontWeight: 700,
        zIndex: 10,
        textAlign: 'center',
        textShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }}>
        developed by Rahmat Triadi, S.Kom.
      </footer>
    </div>
  );
}
