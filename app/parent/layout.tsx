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
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem',
            }}>
              {student?.avatarEmoji ?? '👶'}
            </div>
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
            onClick={() => { logout(); router.replace('/login'); }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none', borderRadius: '10px',
              padding: '8px 12px', color: 'white',
              fontFamily: 'Nunito, sans-serif', fontWeight: 700,
              fontSize: '0.8rem', cursor: 'pointer',
            }}
          >
            Keluar
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
