// app/teacher/laporan/[studentId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getStudentById, getDailyLog, upsertDailyLog, getActiveSchoolActivities } from '@/lib/db';
import { KONDISI_OPTIONS, ACTIVITY_CATEGORIES } from '@/lib/constants';
import { getTodayISO, formatDateIndonesia } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import type { HealthCondition, Student, SchoolActivity } from '@/lib/types';

function Toast({ message, type, show }: { message: string; type: 'success' | 'error'; show: boolean }) {
  return (
    <div className={`toast toast-${type} ${show ? 'show' : ''}`}>
      {type === 'success' ? '✅' : '⚠️'} {message}
    </div>
  );
}

export default function LaporanPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const studentId = params.studentId as string;

  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [student, setStudent] = useState<Student | null>(null);
  const [schoolActivities, setSchoolActivities] = useState<SchoolActivity[]>([]);
  const [activities, setActivities] = useState<Record<string, boolean>>({});
  const [teacherNote, setTeacherNote] = useState('');
  const [kondisi, setKondisi] = useState<HealthCondition>('sehat');
  const [suhu, setSuhu] = useState<string>('36.5');
  const [healthNote, setHealthNote] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [st, acts, log] = await Promise.all([
          getStudentById(studentId),
          getActiveSchoolActivities(),
          getDailyLog(studentId, selectedDate)
        ]);

        if (st) {
          setStudent(st);
        }
        setSchoolActivities(acts);

        if (log) {
          setActivities(log.schoolActivities || {});
          setTeacherNote(log.teacherNote || '');
          setKondisi(log.healthStatus?.kondisi || 'sehat');
          setSuhu(log.healthStatus?.suhu?.toString() || '36.5');
          setHealthNote(log.healthStatus?.catatan || '');
        } else {
          // Set default empty checkboxes for active activities
          const initialActs: Record<string, boolean> = {};
          acts.forEach(a => {
            initialActs[a.id] = false;
          });
          setActivities(initialActs);
          setTeacherNote('');
          setKondisi('sehat');
          setSuhu('36.5');
          setHealthNote('');
        }
      } catch (err) {
        console.error('Error loading laporan data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [studentId, selectedDate]);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }

  function toggleActivity(id: string) {
    setActivities(prev => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleSave() {
    if (!user) {
      showToast('Sesi Anda berakhir. Silakan login kembali.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await upsertDailyLog({
        studentId,
        date: selectedDate,
        schoolActivities: activities,
        teacherNote,
        healthStatus: {
          suhu: parseFloat(suhu) || undefined,
          kondisi,
          catatan: healthNote,
        },
        createdBy: user.id,
      });
      showToast('Laporan berhasil disimpan! 🎉', 'success');
      setTimeout(() => router.push('/teacher/dashboard'), 1500);
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
          <div style={{ fontSize: '3rem', animation: 'spin-slow 1s linear infinite', marginBottom: '16px' }}>⏳</div>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: 'var(--primary)' }}>Memuat form laporan...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>😕</div>
        <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>Siswa tidak ditemukan</p>
        <button className="btn btn-outline" onClick={() => router.back()} style={{ marginTop: '16px' }}>← Kembali</button>
      </div>
    );
  }

  const doneCounts = Object.values(activities).filter(Boolean).length;
  const totalCounts = schoolActivities.length;

  return (
    <>
      <Toast {...toast} />

      {/* Student Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1E8449, #27AE60)',
        padding: '20px 20px 32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Back button */}
        <button
          onClick={() => router.back()}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '10px',
            padding: '8px 14px',
            color: 'white',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← Kembali
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}>
            {student.avatarEmoji}
          </div>
          <div>
            <h1 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1.3rem', color: 'white', lineHeight: 1.2 }}>
              {student.nickname}
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>{student.name}</p>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
              📅 {formatDateIndonesia(selectedDate)}
            </p>
          </div>
          {/* Progress circle */}
          <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: doneCounts === totalCounts ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: '3px solid rgba(255,255,255,0.5)',
            }}>
              <span style={{
                fontFamily: 'Nunito, sans-serif', fontWeight: 900,
                fontSize: '1rem',
                color: doneCounts === totalCounts ? '#27AE60' : 'white',
              }}>
                {doneCounts}
              </span>
              <span style={{ fontSize: '0.55rem', color: doneCounts === totalCounts ? '#27AE60' : 'rgba(255,255,255,0.8)' }}>/{totalCounts}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content" style={{ paddingTop: '20px' }}>
        {/* Date Selector Row */}
        <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="input-label" style={{ margin: 0, fontWeight: 800, color: 'var(--text-dark)' }}>
            📅 Tanggal Laporan:
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

        {/* Activities by Category */}
        {ACTIVITY_CATEGORIES.map(cat => {
          const catActivities = schoolActivities.filter(a => a.category === cat.id);
          if (catActivities.length === 0) return null;

          return (
            <div key={cat.id} style={{ marginBottom: '24px' }}>
              <div className="section-header">
                <span className="category-pill" style={{
                  background: cat.color + '20',
                  color: cat.color,
                }}>
                  ● {cat.label}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {catActivities.map(activity => (
                  <button
                    key={activity.id}
                    onClick={() => toggleActivity(activity.id)}
                    className={`activity-item ${activities[activity.id] ? 'checked' : ''}`}
                    style={{ width: '100%', textAlign: 'left', border: 'none' }}
                  >
                    <span className="activity-emoji">{activity.emoji}</span>
                    <span style={{
                      fontFamily: 'Nunito, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: activities[activity.id] ? '#1E8449' : '#2C3E50',
                      flex: 1,
                    }}>
                      {activity.label}
                    </span>
                    <span className="checkmark">
                      {activities[activity.id] && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <div className="divider" />

        {/* Health Status */}
        <div style={{ marginBottom: '24px' }}>
          <div className="section-header">
            <span style={{ fontSize: '1.5rem' }}>🏥</span>
            <h2 className="section-title">Kondisi Kesehatan</h2>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            {KONDISI_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setKondisi(opt.value)}
                className={`kondisi-btn ${kondisi === opt.value ? 'active' : ''}`}
                style={{
                  borderColor: kondisi === opt.value ? opt.color : 'transparent',
                  background: kondisi === opt.value ? opt.bg : '#F8F9FA',
                }}
              >
                <span className="kondisi-emoji">{opt.emoji}</span>
                <span style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: kondisi === opt.value ? opt.color : '#5D6D7E',
                }}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label className="input-label">🌡️ Suhu Tubuh (°C) — opsional</label>
            <input
              type="number"
              step="0.1"
              min="35"
              max="42"
              value={suhu}
              onChange={e => setSuhu(e.target.value)}
              placeholder="36.5"
              className="input"
            />
          </div>

          {kondisi !== 'sehat' && (
            <div>
              <label className="input-label">📝 Catatan Kesehatan</label>
              <textarea
                value={healthNote}
                onChange={e => setHealthNote(e.target.value)}
                placeholder="Jelaskan kondisi anak..."
                className="input textarea"
              />
            </div>
          )}
        </div>

        <div className="divider" />

        {/* Teacher Notes */}
        <div style={{ marginBottom: '24px' }}>
          <div className="section-header">
            <span style={{ fontSize: '1.5rem' }}>📝</span>
            <h2 className="section-title">Catatan Guru</h2>
          </div>
          <textarea
            value={teacherNote}
            onChange={e => setTeacherNote(e.target.value)}
            placeholder={`Tulis catatan untuk orang tua ${student.nickname}...\n\nContoh: ${student.nickname} hari ini sangat aktif dan bersemangat! 😊`}
            className="input textarea"
            style={{ minHeight: '120px' }}
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-primary btn-lg btn-full"
        >
          {isSaving ? '⏳ Menyimpan...' : '💾 Simpan Laporan'}
        </button>

        <p style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#AEB6BF',
          marginTop: '12px',
          fontStyle: 'italic',
        }}>
          Laporan akan terlihat oleh orang tua {student.nickname}
        </p>
      </div>
    </>
  );
}
