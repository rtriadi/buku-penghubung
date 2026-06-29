// app/parent/dashboard/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  getStudentById,
  getStudentsByParent,
  getDailyLog,
  getHomeLog,
  upsertHomeLog,
  getActiveSchoolActivities,
  getActiveHomeActivities
} from '@/lib/db';
import { KONDISI_OPTIONS } from '@/lib/constants';
import { getTodayISO, formatDateIndonesia } from '@/lib/utils';
import type { DailyLog, Student, SchoolActivity, HomeActivity } from '@/lib/types';

function Toast({ message, type, show }: { message: string; type: 'success' | 'error'; show: boolean }) {
  return (
    <div className={`toast toast-${type} ${show ? 'show' : ''}`}>
      {type === 'success' ? '✅' : '⚠️'} {message}
    </div>
  );
}

export default function ParentDashboard() {
  const { user } = useAuth();
  
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [student, setStudent] = useState<Student | null>(null);
  const [schoolActivities, setSchoolActivities] = useState<SchoolActivity[]>([]);
  const [activeHomeActivities, setActiveHomeActivities] = useState<HomeActivity[]>([]);
  const [schoolLog, setSchoolLog] = useState<DailyLog | null>(null);
  
  const [homeActivities, setHomeActivities] = useState<Record<string, boolean | string>>({});
  const [parentNote, setParentNote] = useState('');
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });
  const [activeChildId, setActiveChildId] = useState<string | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Draft Recovery & Unsaved Changes states
  const initialStateRef = useRef<{
    date: string;
    homeActivities: Record<string, boolean | string>;
    parentNote: string;
  } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [draftData, setDraftData] = useState<any | null>(null);

  const isStateEqual = (a: any, b: any) => {
    if (!a || !b) return false;
    return (
      a.date === b.date &&
      a.parentNote === b.parentNote &&
      JSON.stringify(a.homeActivities) === JSON.stringify(b.homeActivities)
    );
  };

  // Load all children for this parent
  useEffect(() => {
    async function loadParentStudents() {
      if (user) {
        try {
          const list = await getStudentsByParent(user.id);
          const activeList = list.filter(s => s.status !== 'alumni');
          setStudents(activeList);
        } catch (err) {
          console.error('Error loading parent students in dashboard:', err);
        }
      }
    }
    loadParentStudents();
  }, [user]);

  useEffect(() => {
    // Set initial child ID from localStorage
    const storedId = localStorage.getItem('buku_penghubung_active_child_id');
    setActiveChildId(storedId || user?.studentId || null);

    const handleChildChanged = () => {
      const newId = localStorage.getItem('buku_penghubung_active_child_id');
      setActiveChildId(newId || user?.studentId || null);
    };

    window.addEventListener('activeChildChanged', handleChildChanged);
    return () => {
      window.removeEventListener('activeChildChanged', handleChildChanged);
    };
  }, [user]);

  const switchToNextChild = () => {
    if (students.length <= 1) return;
    const currentIndex = students.findIndex(s => s.id === activeChildId);
    if (currentIndex === -1) return;

    if (isDirty) {
      if (!confirm('Anda memiliki perubahan yang belum disimpan untuk anak ini. Apakah Anda yakin ingin beralih? (Perubahan akan tersimpan sebagai draf)')) {
        return;
      }
    }

    const nextIndex = (currentIndex + 1) % students.length;
    const nextChild = students[nextIndex];
    
    setActiveChildId(nextChild.id);
    localStorage.setItem('buku_penghubung_active_child_id', nextChild.id);
    window.dispatchEvent(new Event('activeChildChanged'));
  };

  const switchToPrevChild = () => {
    if (students.length <= 1) return;
    const currentIndex = students.findIndex(s => s.id === activeChildId);
    if (currentIndex === -1) return;

    if (isDirty) {
      if (!confirm('Anda memiliki perubahan yang belum disimpan untuk anak ini. Apakah Anda yakin ingin beralih? (Perubahan akan tersimpan sebagai draf)')) {
        return;
      }
    }

    const prevIndex = (currentIndex - 1 + students.length) % students.length;
    const prevChild = students[prevIndex];
    
    setActiveChildId(prevChild.id);
    localStorage.setItem('buku_penghubung_active_child_id', prevChild.id);
    window.dispatchEvent(new Event('activeChildChanged'));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      switchToNextChild();
    } else if (distance < -minSwipeDistance) {
      switchToPrevChild();
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

  useEffect(() => {
    setMounted(true);
    
    async function loadData() {
      if (!activeChildId) {
        if (user) {
          const storedId = localStorage.getItem('buku_penghubung_active_child_id');
          if (storedId) {
            setActiveChildId(storedId);
            return;
          }
          if (user.studentId) {
            setActiveChildId(user.studentId);
            return;
          }
        }
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [st, sa, ha, sLog, hLog] = await Promise.all([
          getStudentById(activeChildId),
          getActiveSchoolActivities(),
          getActiveHomeActivities(),
          getDailyLog(activeChildId, selectedDate),
          getHomeLog(activeChildId, selectedDate)
        ]);

        if (st) {
          setStudent(st);
        }
        let filteredSa = sa;
        if (st && st.program === 'halfday') {
          filteredSa = sa.filter(a => a.id !== 'sholat_ashar');
        }
        setSchoolActivities(filteredSa);
        setActiveHomeActivities(ha);
        setSchoolLog(sLog || null);

        const initialActs: Record<string, boolean | string> = {};
        ha.forEach(a => {
          initialActs[a.id] = false;
        });

        const loadedHomeActivities = hLog?.homeActivities || initialActs;
        const loadedParentNote = hLog?.parentNote || '';

        setHomeActivities(loadedHomeActivities);
        setParentNote(loadedParentNote);

        const dbState = {
          date: selectedDate,
          homeActivities: loadedHomeActivities,
          parentNote: loadedParentNote,
        };
        initialStateRef.current = dbState;

        // Check if there is an unsaved draft in sessionStorage
        const draftKey = `parent_laporan_draft_${activeChildId}_${selectedDate}`;
        const savedDraft = sessionStorage.getItem(draftKey);
        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft);
            if (!isStateEqual(parsed, dbState)) {
              setDraftData(parsed);
              setShowDraftBanner(true);
            } else {
              sessionStorage.removeItem(draftKey);
            }
          } catch (e) {
            console.error('Error parsing draft:', e);
          }
        } else {
          setShowDraftBanner(false);
          setDraftData(null);
        }
      } catch (err) {
        console.error('Error loading parent dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, selectedDate, activeChildId]);

  // Save draft to sessionStorage on change
  useEffect(() => {
    if (loading || isSaving || !initialStateRef.current || !activeChildId) return;

    const currentState = {
      date: selectedDate,
      homeActivities,
      parentNote,
    };

    const dirty = !isStateEqual(currentState, initialStateRef.current);
    setIsDirty(dirty);

    if (typeof window !== 'undefined') {
      (window as any).isFormDirty = dirty;
    }

    const draftKey = `parent_laporan_draft_${activeChildId}_${selectedDate}`;
    if (dirty) {
      sessionStorage.setItem(draftKey, JSON.stringify(currentState));
    } else {
      sessionStorage.removeItem(draftKey);
    }
  }, [selectedDate, homeActivities, parentNote, loading, isSaving, activeChildId]);

  // Clean dirty flag on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).isFormDirty = false;
      }
    };
  }, []);

  // beforeunload event listener
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  const handleRestoreDraft = () => {
    if (!draftData) return;
    setHomeActivities(draftData.homeActivities);
    setParentNote(draftData.parentNote);
    setShowDraftBanner(false);
    setDraftData(null);
  };

  const handleDiscardDraft = () => {
    const draftKey = `parent_laporan_draft_${activeChildId}_${selectedDate}`;
    sessionStorage.removeItem(draftKey);
    setShowDraftBanner(false);
    setDraftData(null);
  };

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }

  function toggleHomeActivity(id: string, hasTime?: boolean) {
    setHomeActivities(prev => {
      if (hasTime) {
        // Toggle time input visibility, default to empty string
        return { ...prev, [id]: prev[id] ? false : '' };
      }
      return { ...prev, [id]: !prev[id] };
    });
  }

  // Update time for home activities
  function setActivityTime(id: string, time: string) {
    setHomeActivities(prev => ({ ...prev, [id]: time }));
  }

  async function handleSave() {
    if (!student || !user) return;
    setIsSaving(true);
    try {
      await upsertHomeLog({
        studentId: student.id,
        date: selectedDate,
        homeActivities,
        parentNote,
        createdBy: user.id,
      });

      // Clear draft in sessionStorage
      const draftKey = `parent_laporan_draft_${student.id}_${selectedDate}`;
      sessionStorage.removeItem(draftKey);
      if (typeof window !== 'undefined') {
        (window as any).isFormDirty = false;
      }
      setIsDirty(false);
      
      // Set the saved state as the new initial state so it is no longer dirty
      initialStateRef.current = {
        date: selectedDate,
        homeActivities,
        parentNote,
      };

      showToast('Laporan rumah berhasil disimpan! 🏡', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan. Coba lagi.', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-cream)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', animation: 'spin-slow 1s linear infinite', marginBottom: '16px', display: 'inline-block' }}>⏳</div>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: 'var(--accent-blue)' }}>Memuat laporan anak...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>😕</div>
        <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>Data anak tidak ditemukan. Hubungi admin sekolah.</p>
      </div>
    );
  }

  const schoolDone = schoolLog ? Object.values(schoolLog.schoolActivities).filter(Boolean).length : 0;
  const kondisiData = schoolLog ? KONDISI_OPTIONS.find(o => o.value === schoolLog.healthStatus.kondisi) : null;

  return (
    <>
      <Toast {...toast} />

      {/* Child Info Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1A5276, #2980B9, #3498DB)',
        padding: '0 20px 24px',
        position: 'relative',
      }}>
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="card" 
          style={{
            padding: '20px 14px',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '20px',
            position: 'relative',
            touchAction: 'pan-y',
          }}
        >
          {students.length > 1 && (
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '16px',
              padding: '0 8px',
              borderBottom: '1px solid rgba(255,255,255,0.15)',
              paddingBottom: '12px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}>
              <style>{`
                .child-tabs-container::-webkit-scrollbar { display: none; }
              `}</style>
              <div className="child-tabs-container" style={{ display: 'flex', gap: '8px' }}>
                {students.map(s => {
                  const isActive = s.id === activeChildId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (isDirty) {
                          if (!confirm('Anda memiliki perubahan yang belum disimpan untuk anak ini. Apakah Anda yakin ingin beralih? (Perubahan akan tersimpan sebagai draf)')) {
                            return;
                          }
                        }
                        setActiveChildId(s.id);
                        localStorage.setItem('buku_penghubung_active_child_id', s.id);
                        window.dispatchEvent(new Event('activeChildChanged'));
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: isActive ? 'white' : 'rgba(255,255,255,0.15)',
                        border: 'none',
                        color: isActive ? '#1A5276' : 'white',
                        fontFamily: 'Nunito, sans-serif',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      <span>{s.avatarEmoji}</span>
                      <span>{s.nickname}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', padding: '0 8px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '20px',
              background: 'rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              flexShrink: 0,
            }}>
              {student.avatarEmoji}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1.2rem', color: 'white', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                {student.nickname}
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.name}</p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                📅 {mounted ? formatDateIndonesia(selectedDate) : '—'}
              </p>
            </div>
            {kondisiData && (
              <div style={{
                background: kondisiData.bg,
                padding: '8px 12px',
                borderRadius: '12px',
                textAlign: 'center',
                flexShrink: 0,
              }}>
                <div style={{ fontSize: '1.5rem' }}>{kondisiData.emoji}</div>
                <div style={{ fontSize: '0.65rem', fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: kondisiData.color }}>
                  {kondisiData.label}
                </div>
              </div>
            )}
          </div>

          {/* School Progress */}
          {schoolLog ? (
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px', margin: '0 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                  🏫 Kegiatan Sekolah
                </span>
                <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.8rem', color: 'white' }}>
                  {schoolDone}/{schoolActivities.length}
                </span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '3px',
                  background: 'rgba(255,255,255,0.9)',
                  width: '100%',
                  transform: `scaleX(${schoolActivities.length > 0 ? (schoolDone / schoolActivities.length) : 0})`,
                  transformOrigin: 'left',
                  transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                }} />
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '12px', padding: '12px',
              textAlign: 'center',
              fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)',
              margin: '0 8px',
            }}>
              ⏳ Laporan sekolah belum diisi guru pada tanggal ini
            </div>
          )}
        </div>
      </div>

      <div className="page-content" style={{ paddingTop: '24px' }}>
        {/* Draft Recovery Banner */}
        {showDraftBanner && (
          <div style={{
            background: '#FEF9E7',
            border: '1.5px solid #F9E79F',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }} className="animate-fade-in-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.5rem' }}>📝</span>
              <div>
                <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.85rem', color: '#B7950B' }}>
                  Draf Belum Disimpan Ditemukan
                </div>
                <div style={{ fontSize: '0.75rem', color: '#7D6608' }}>
                  Ada draf laporan rumah untuk tanggal ini yang belum disimpan.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={handleRestoreDraft}
                className="btn"
                style={{
                  background: '#F1C40F',
                  color: '#7D6608',
                  border: 'none',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Pulihkan
              </button>
              <button
                onClick={handleDiscardDraft}
                className="btn btn-outline"
                style={{
                  borderColor: '#F9E79F',
                  color: '#7D6608',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Abaikan
              </button>
            </div>
          </div>
        )}
        {/* Date Selector Row */}
        <div className="card animate-fade-in-up" style={{ padding: '16px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="input-label" style={{ margin: 0, fontWeight: 800, color: 'var(--text-dark)' }}>
            📅 Tanggal Laporan Rumah:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="input"
            style={{ cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}
            max={getTodayISO()}
          />
        </div>

        {/* Teacher's Report (read-only) */}
        {schoolLog && (
          <div className="animate-fade-in-up" style={{ marginBottom: '24px' }}>
            <div className="section-header">
              <span style={{ fontSize: '1.4rem' }}>🏫</span>
              <h2 className="section-title">Laporan Guru Tanggal Ini</h2>
            </div>

            <div className="card" style={{ padding: '16px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {schoolActivities.map(act => {
                  const done = schoolLog.schoolActivities[act.id];
                  const isDone = done === true || (typeof done === 'string' && done !== '');
                  const timeStr = typeof done === 'string' ? done : '';
                  return (
                    <div key={act.id} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '999px',
                      background: isDone ? '#D5F5E3' : '#F2F3F4',
                      border: `1px solid ${isDone ? '#A9DFBF' : '#E8ECF0'}`,
                    }}>
                      <span style={{ fontSize: '1rem' }}>{act.emoji}</span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontFamily: 'Nunito, sans-serif',
                        fontWeight: 700,
                        color: isDone ? '#1E8449' : '#AEB6BF',
                        textDecoration: isDone ? 'none' : 'line-through',
                      }}>
                        {act.label} {timeStr ? `(${timeStr})` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>

              {schoolLog.healthStatus && (
                <div style={{ marginTop: '12px', padding: '10px 14px', background: '#FEF9E7', borderRadius: '12px', border: '1px solid #F9CA24' }}>
                  <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: '#D35400' }}>
                    🌡️ Kesehatan: {KONDISI_OPTIONS.find(o => o.value === schoolLog.healthStatus.kondisi)?.emoji} {KONDISI_OPTIONS.find(o => o.value === schoolLog.healthStatus.kondisi)?.label}
                    {schoolLog.healthStatus.suhu ? ` — ${schoolLog.healthStatus.suhu}°C` : ''}
                  </span>
                  {schoolLog.healthStatus.catatan && (
                    <div style={{ fontSize: '0.8rem', marginTop: '6px', color: '#7f8c8d', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '6px' }}>
                      Catatan: {schoolLog.healthStatus.catatan}
                    </div>
                  )}
                </div>
              )}

              {schoolLog.teacherNote && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#F4F9FD', borderRadius: '12px', border: '1px solid rgba(52, 152, 219, 0.25)' }}>
                  <p style={{ fontSize: '0.8rem', fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#1A5276', marginBottom: '4px' }}>
                    💬 Catatan Guru:
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#2C3E50', lineHeight: 1.5 }}>{schoolLog.teacherNote}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Home Activity Form */}
        <div className="animate-fade-in-up delay-200" style={{ marginBottom: '24px' }}>
          <div className="section-header">
            <span style={{ fontSize: '1.4rem' }}>🏠</span>
            <h2 className="section-title">Aktivitas di Rumah</h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#7f8c8d', marginBottom: '16px' }}>
            Ceritakan kegiatan {student.nickname} di rumah pada tanggal ini 😊
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '20px',
            ['--activity-active-color' as any]: '#2980B9',
            ['--activity-active-color-light' as any]: '#3498DB',
            ['--activity-active-bg' as any]: 'linear-gradient(135deg, #EBF5FB, #AED6F1)',
            ['--activity-active-shadow' as any]: 'rgba(41, 128, 185, 0.25)',
            ['--activity-hover-bg' as any]: '#F4F9FD',
          }}>
            {activeHomeActivities.map(activity => {
              const val = homeActivities[activity.id];
              const isChecked = val === true || (activity.hasTime && typeof val === 'string' && val !== '' && val !== undefined);

              return (
                <div key={activity.id}>
                  <button
                    onClick={() => toggleHomeActivity(activity.id, activity.hasTime)}
                    className={`activity-item ${isChecked ? 'checked' : ''}`}
                    style={{ width: '100%', textAlign: 'left', border: 'none' }}
                  >
                    <span className="activity-emoji">{activity.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: 'Nunito, sans-serif',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: isChecked ? '#1E8449' : '#2C3E50',
                      }}>
                        {activity.label}
                      </div>
                      {activity.hasTime && isChecked && (
                        <div style={{ fontSize: '0.75rem', color: '#1A5276', marginTop: '2px', fontWeight: 'bold' }}>
                          Jam tidur: {typeof val === 'string' ? val : '—'}
                        </div>
                      )}
                    </div>
                    <span className="checkmark">
                      {isChecked && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  </button>

                  {/* Time input */}
                  {activity.hasTime && val !== false && val !== undefined && (
                    <div style={{ 
                      marginTop: '10px', 
                      paddingLeft: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }} className="animate-fade-in-up">
                      <span style={{ fontSize: '1rem' }}>⏰</span>
                      <label style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: 800, 
                        color: 'var(--text-medium)', 
                        fontFamily: 'Nunito, sans-serif' 
                      }}>
                        Pukul:
                      </label>
                      <input
                        type="time"
                        value={typeof val === 'string' ? val : ''}
                        onChange={e => setActivityTime(activity.id, e.target.value)}
                        className="input"
                        style={{ 
                          maxWidth: '130px', 
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1.5px solid #AED6F1',
                          background: '#F4F9FD',
                          fontFamily: 'Nunito, sans-serif',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: '#1A5276',
                          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Parent Note */}
          <div style={{ marginBottom: '20px' }}>
            <label className="input-label">💬 Catatan untuk Guru</label>
            <textarea
              value={parentNote}
              onChange={e => setParentNote(e.target.value)}
              placeholder={`Ceritakan hal menarik tentang ${student.nickname} pada tanggal ini...\n\nContoh: ${student.nickname} malam ini belajar sendiri tanpa disuruh! 🌟`}
              className="input textarea"
              style={{ minHeight: '110px' }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-full btn-lg"
            style={{
              background: 'linear-gradient(135deg, #1A5276, #3498DB)',
              color: 'white',
              boxShadow: '0 4px 16px rgba(52,152,219,0.35)',
              border: 'none',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              fontSize: '1rem',
              padding: '16px',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {isSaving ? '⏳ Menyimpan...' : '💾 Kirim Laporan Rumah'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#AEB6BF', marginTop: '12px', fontStyle: 'italic' }}>
            Guru akan melihat laporan ini besok pagi 👀
          </p>
        </div>
      </div>
    </>
  );
}
