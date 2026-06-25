'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { SCHOOL_NAME } from '@/lib/constants';
import { getGreeting } from '@/lib/utils';
import { getStudentById } from '@/lib/db';
import type { Student } from '@/lib/types';

const NAV_ITEMS = [
  { href: '/parent/dashboard', emoji: '🏠', label: 'Beranda' },
  { href: '/parent/rekap', emoji: '📊', label: 'Rekap' },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [student, setStudent] = useState<Student | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'parent')) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function loadStudent() {
      if (user?.studentId) {
        setStudentLoading(true);
        try {
          const st = await getStudentById(user.studentId);
          if (st) {
            setStudent(st);
          }
        } catch (err) {
          console.error('Error loading student in layout:', err);
        } finally {
          setStudentLoading(false);
        }
      } else {
        setStudentLoading(false);
      }
    }
    if (user) {
      loadStudent();
    }
  }, [user]);

  if (isLoading || studentLoading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-cream)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }} className="animate-pulse-soft">🏡</div>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: 'var(--accent-blue)' }}>Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ minHeight: '100vh', background: 'var(--bg-cream)' }}>
      {/* Top Header — Blue theme for parents */}
      <header style={{
        background: 'linear-gradient(135deg, #1A5276 0%, #2980B9 50%, #3498DB 100%)',
        padding: '16px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 2px 12px rgba(52, 152, 219, 0.3)',
      }}>
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
                {student ? `Orang Tua ${student.nickname}` : 'Buku Penghubung'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
                {getGreeting()}, {user.name.split(' ')[0]}! 👋
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowProfileModal(true)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none', borderRadius: '10px',
              padding: '8px 12px', color: 'white',
              fontFamily: 'Nunito, sans-serif', fontWeight: 700,
              fontSize: '0.8rem', cursor: 'pointer',
            }}
          >
            Profil
          </button>
        </div>
      </header>

      <main>{children}</main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
            style={{ '--tw-text-opacity': 1 } as React.CSSProperties}
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
              <p style={{ fontSize: '0.78rem', color: 'var(--accent-blue)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
                👨‍👩 Orang Tua {student?.nickname ? `Wali ${student.nickname}` : 'Wali'}
              </p>
              <div style={{ background: '#F8F9FA', borderRadius: '12px', padding: '12px 14px', textAlign: 'left', marginBottom: '20px', border: '1px solid #F0F2F5' }}>
                <div style={{ fontSize: '0.72rem', color: '#AEB6BF', marginBottom: '2px' }}>📧 Email Akun</div>
                <div style={{ fontSize: '0.85rem', color: '#2C3E50', fontWeight: 700, wordBreak: 'break-all' }}>{user.email}</div>
                
                {student && (
                  <>
                    <div style={{ height: '1px', background: '#F0F2F5', margin: '8px 0' }} />
                    <div style={{ fontSize: '0.72rem', color: '#AEB6BF', marginBottom: '2px' }}>👶 Siswa Pantauan</div>
                    <div style={{ fontSize: '0.85rem', color: '#2C3E50', fontWeight: 700 }}>{student.name}</div>
                  </>
                )}
                
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
