'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { SCHOOL_NAME } from '@/lib/constants';
import { getGreeting } from '@/lib/utils';
import { getStudentById, getStudentsByParent } from '@/lib/db';
import { getActiveAnnouncements, getMyAnnouncementReads } from '@/lib/db';
import type { Student, Announcement } from '@/lib/types';
import AnnouncementBell from '@/app/components/AnnouncementBell';
import AnnouncementPopup from '@/app/components/AnnouncementPopup';

const NAV_ITEMS = [
  { href: '/parent/dashboard', emoji: '🏠', label: 'Beranda', isBell: false },
  { href: '/parent/rekap', emoji: '📊', label: 'Rekap', isBell: false },
  { href: '/pengumuman', emoji: '🔔', label: 'Pengumuman', isBell: true },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [students, setStudents] = useState<Student[]>([]);
  const [activeChild, setActiveChild] = useState<Student | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeAnnouncements, setActiveAnnouncements] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [showAnnouncementPopup, setShowAnnouncementPopup] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'parent')) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function loadStudents() {
      if (user) {
        setStudentLoading(true);
        try {
          const list = await getStudentsByParent(user.id);
          const activeList = list.filter(s => s.status !== 'alumni');
          setStudents(activeList);
          
          if (activeList.length > 0) {
            const storedChildId = localStorage.getItem('buku_penghubung_active_child_id');
            const foundChild = activeList.find(s => s.id === storedChildId);
            const initialChild = foundChild || activeList[0];
            setActiveChild(initialChild);
            localStorage.setItem('buku_penghubung_active_child_id', initialChild.id);
          } else {
            // Fallback to single student link
            if (user.studentId) {
              const fallbackStudent = await getStudentById(user.studentId);
              if (fallbackStudent && fallbackStudent.status !== 'alumni') {
                setStudents([fallbackStudent]);
                setActiveChild(fallbackStudent);
                localStorage.setItem('buku_penghubung_active_child_id', fallbackStudent.id);
              }
            }
          }
        } catch (err) {
          console.error('Error loading parent students:', err);
        } finally {
          setStudentLoading(false);
        }
      } else {
        setStudentLoading(false);
      }
    }
    if (user) {
      loadStudents();
    }
  }, [user]);

  useEffect(() => {
    async function loadAnnouncements() {
      if (!user) return;
      try {
        const [announcements, reads] = await Promise.all([
          getActiveAnnouncements(),
          getMyAnnouncementReads(user.id),
        ]);
        setActiveAnnouncements(announcements);
        setReadIds(reads);
        const unread = announcements.filter(a => !reads.includes(a.id));
        if (unread.length > 0) {
          const sessionKey = `announcement_shown_${user.id}`;
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, '1');
            setShowAnnouncementPopup(true);
          }
        }
      } catch (err) {
        console.error('loadAnnouncements error:', err);
      }
    }
    if (user) loadAnnouncements();
  }, [user]);

  if (isLoading || studentLoading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-cream)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', animation: 'spin-slow 1s linear infinite', marginBottom: '16px', display: 'inline-block' }}>⏳</div>
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
                {activeChild ? `Orang Tua ${activeChild.nickname}` : 'Buku Penghubung'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
                {getGreeting()}, {user.name.split(' ')[0]}! 👋
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {students.length > 1 && (
              <select
                value={activeChild?.id || ''}
                onChange={(e) => {
                  const child = students.find(s => s.id === e.target.value);
                  if (child) {
                    setActiveChild(child);
                    localStorage.setItem('buku_penghubung_active_child_id', child.id);
                    window.dispatchEvent(new Event('activeChildChanged'));
                  }
                }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {students.map(s => (
                  <option key={s.id} value={s.id} style={{ color: 'var(--text-dark)' }}>
                    👶 {s.nickname}
                  </option>
                ))}
              </select>
            )}
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
            <span className="nav-icon">
              {item.isBell ? (
                <AnnouncementBell
                  unreadCount={activeAnnouncements.filter(a => !readIds.includes(a.id)).length}
                  isActive={pathname.startsWith(item.href)}
                />
              ) : (
                item.emoji
              )}
            </span>
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
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #D6EAF8, #2980B9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  boxShadow: '0 4px 12px rgba(41, 128, 185, 0.2)'
                }}>
                  👨‍👩
                </div>
              </div>
              <h2 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1.15rem', color: '#2C3E50', marginBottom: '4px' }}>
                {user.name}
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--accent-blue)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
                👨‍👩 Orang Tua {activeChild?.nickname ? `Wali ${activeChild.nickname}` : 'Wali'}
              </p>
              <div style={{ background: '#F8F9FA', borderRadius: '12px', padding: '12px 14px', textAlign: 'left', marginBottom: '20px', border: '1px solid #F0F2F5' }}>
                <div style={{ fontSize: '0.72rem', color: '#AEB6BF', marginBottom: '2px' }}>📧 Email Akun</div>
                <div style={{ fontSize: '0.85rem', color: '#2C3E50', fontWeight: 700, wordBreak: 'break-all' }}>{user.email}</div>
                
                {students.length > 0 ? (
                  <>
                    <div style={{ height: '1px', background: '#F0F2F5', margin: '8px 0' }} />
                    <div style={{ fontSize: '0.72rem', color: '#AEB6BF', marginBottom: '4px' }}>👶 Daftar Anak</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {students.map(s => (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: s.id === activeChild?.id ? '#EBF5FB' : 'transparent', padding: '6px 8px', borderRadius: '8px' }}>
                          <span style={{ fontSize: '0.85rem', color: '#2C3E50', fontWeight: s.id === activeChild?.id ? 800 : 500 }}>
                            {s.avatarEmoji} {s.name}
                          </span>
                          {s.id === activeChild?.id && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', fontWeight: 'bold' }}>Aktif</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  activeChild && (
                    <>
                      <div style={{ height: '1px', background: '#F0F2F5', margin: '8px 0' }} />
                      <div style={{ fontSize: '0.72rem', color: '#AEB6BF', marginBottom: '2px' }}>👶 Siswa Pantauan</div>
                      <div style={{ fontSize: '0.85rem', color: '#2C3E50', fontWeight: 700 }}>{activeChild.name}</div>
                    </>
                  )
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

      {/* Announcement Popup */}
      {showAnnouncementPopup && user && (
        <AnnouncementPopup
          announcements={activeAnnouncements.filter(a => !readIds.includes(a.id))}
          userId={user.id}
          onClose={() => setShowAnnouncementPopup(false)}
          onRead={(id) => setReadIds(prev => [...prev, id])}
          role={user.role}
        />
      )}
    </div>
  );
}
