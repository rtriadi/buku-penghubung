// app/parent/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  getStudentById,
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

  useEffect(() => {
    setMounted(true);
    
    async function loadData() {
      if (!user?.studentId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [st, sa, ha, sLog, hLog] = await Promise.all([
          getStudentById(user.studentId),
          getActiveSchoolActivities(),
          getActiveHomeActivities(),
          getDailyLog(user.studentId, selectedDate),
          getHomeLog(user.studentId, selectedDate)
        ]);

        if (st) {
          setStudent(st);
        }
        setSchoolActivities(sa);
        setActiveHomeActivities(ha);
        setSchoolLog(sLog || null);

        if (hLog) {
          setHomeActivities(hLog.homeActivities || {});
          setParentNote(hLog.parentNote || '');
        } else {
          // Initialize empty checklist
          const initialActs: Record<string, boolean | string> = {};
          ha.forEach(a => {
            initialActs[a.id] = false;
          });
          setHomeActivities(initialActs);
          setParentNote('');
        }
      } catch (err) {
        console.error('Error loading parent dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, selectedDate]);

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
          <div style={{ fontSize: '3rem', animation: 'spin-slow 1s linear infinite', marginBottom: '16px' }}>🏡</div>
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
        <div className="card" style={{
          padding: '20px',
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '20px',
              background: 'rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}>
              {student.avatarEmoji}
            </div>
            <div>
              <h1 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1.2rem', color: 'white', lineHeight: 1.2 }}>
                {student.nickname}
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)' }}>{student.name}</p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                📅 {mounted ? formatDateIndonesia(selectedDate) : '—'}
              </p>
            </div>
            {kondisiData && (
              <div style={{
                marginLeft: 'auto',
                background: kondisiData.bg,
                padding: '8px 12px',
                borderRadius: '12px',
                textAlign: 'center',
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
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px' }}>
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
            }}>
              ⏳ Laporan sekolah belum diisi guru pada tanggal ini
            </div>
          )}
        </div>
      </div>

      <div className="page-content" style={{ paddingTop: '24px' }}>
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
                  return (
                    <div key={act.id} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '999px',
                      background: done ? '#D5F5E3' : '#F2F3F4',
                      border: `1px solid ${done ? '#A9DFBF' : '#E8ECF0'}`,
                    }}>
                      <span style={{ fontSize: '1rem' }}>{act.emoji}</span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontFamily: 'Nunito, sans-serif',
                        fontWeight: 700,
                        color: done ? '#1E8449' : '#AEB6BF',
                        textDecoration: done ? 'none' : 'line-through',
                      }}>
                        {act.label}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
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
                    <div style={{ marginTop: '8px', paddingLeft: '16px' }}>
                      <input
                        type="time"
                        value={typeof val === 'string' ? val : ''}
                        onChange={e => setActivityTime(activity.id, e.target.value)}
                        className="input"
                        style={{ maxWidth: '140px' }}
                        placeholder="20:00"
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
