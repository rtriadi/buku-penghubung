// app/parent/rekap/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  getStudentById,
  getDailyLogs,
  getHomeLogs,
  getActiveSchoolActivities,
  getActiveHomeActivities
} from '@/lib/db';
import { formatDateIndonesia, formatDateShort, getLastNDates, downloadPDF } from '@/lib/utils';
import type { DailyLog, HomeLog, Student, SchoolActivity, HomeActivity } from '@/lib/types';

export default function ParentRekapPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [schoolActivities, setSchoolActivities] = useState<SchoolActivity[]>([]);
  const [homeActivities, setHomeActivities] = useState<HomeActivity[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [homeLogs, setHomeLogs] = useState<HomeLog[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const dates = getLastNDates(7);

  useEffect(() => {
    setMounted(true);
    if (user?.studentId) {
      loadRekapData();
    }
  }, [user]);

  async function loadRekapData() {
    if (!user?.studentId) return;
    setLoading(true);
    try {
      const [st, sa, ha, dl, hl] = await Promise.all([
        getStudentById(user.studentId),
        getActiveSchoolActivities(),
        getActiveHomeActivities(),
        getDailyLogs(),
        getHomeLogs()
      ]);

      if (st) {
        setStudent(st);
      }
      setSchoolActivities(sa);
      setHomeActivities(ha);
      setDailyLogs(dl);
      setHomeLogs(hl);
    } catch (err) {
      console.error('Error loading parent rekap data:', err);
    } finally {
      setLoading(false);
    }
  }

  function getLog(studentId: string, date: string): DailyLog | undefined {
    return dailyLogs.find(l => l.studentId === studentId && l.date === date);
  }

  function getHome(studentId: string, date: string): HomeLog | undefined {
    return homeLogs.find(l => l.studentId === studentId && l.date === date);
  }

  async function handleDownload() {
    if (!student) return;
    setIsDownloading(true);
    try {
      await downloadPDF('parent-report', `Laporan-${student.nickname}-${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Gagal mendownload PDF.');
    } finally {
      setIsDownloading(false);
    }
  }

  if (!mounted) return null;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', background: 'var(--bg-cream)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', animation: 'spin-slow 1s linear infinite', marginBottom: '16px' }}>⏳</div>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: 'var(--accent-blue)' }}>Memuat rekap laporan...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>😕</div>
        <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, marginTop: '12px' }}>Data anak tidak ditemukan. Hubungi admin.</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="animate-fade-in-up">
        <h1 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1.4rem', color: '#2C3E50', marginBottom: '4px' }}>
          📊 Rekap {student.nickname}
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '20px' }}>Laporan 7 hari terakhir</p>
      </div>

      {/* Student Info */}
      <div className="card animate-fade-in-up delay-100" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #D6EAF8, #AED6F1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
          }}>
            {student.avatarEmoji}
          </div>
          <div>
            <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '1rem' }}>{student.name}</div>
            <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Kelas A • Buku Penghubung 7 Hari</div>
          </div>
        </div>
      </div>

      {/* Daily Timeline */}
      <div className="animate-fade-in-up delay-200" style={{ marginBottom: '24px' }}>
        <div className="section-header">
          <span style={{ fontSize: '1.4rem' }}>📅</span>
          <h2 className="section-title">Rangkuman Harian</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {dates.map((date, idx) => {
            const log = getLog(student.id, date);
            const homeLog = getHome(student.id, date);
            const schoolDone = log ? Object.values(log.schoolActivities).filter(Boolean).length : 0;
            const homeDone = homeLog ? Object.values(homeLog.homeActivities).filter(v => v === true || (typeof v === 'string' && v !== '')).length : 0;

            return (
              <div key={date} className="card animate-fade-in-up" style={{ padding: '16px', animationDelay: `${(idx + 2) * 80}ms` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{
                    fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#2C3E50',
                  }}>
                    📅 {formatDateIndonesia(date)}
                  </span>
                  {!log && !homeLog && (
                    <span className="badge badge-yellow">Belum Ada Data</span>
                  )}
                </div>

                {log && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#7f8c8d', fontWeight: 600 }}>🏫 Kegiatan Sekolah</span>
                      <span style={{
                        fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.75rem',
                        color: schoolDone === schoolActivities.length ? '#27AE60' : '#7f8c8d',
                      }}>
                        {schoolDone}/{schoolActivities.length}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ transform: `scaleX(${schoolActivities.length > 0 ? (schoolDone / schoolActivities.length) : 0})` }} />
                    </div>
                    {log.teacherNote && (
                      <div style={{
                        marginTop: '8px', padding: '8px 10px',
                        background: '#F4F9FD', borderRadius: '8px',
                        fontSize: '0.78rem', color: '#2C3E50',
                        border: '1px solid rgba(52, 152, 219, 0.25)',
                      }}>
                        <strong style={{ color: '#1A5276' }}>Guru:</strong> {log.teacherNote}
                      </div>
                    )}
                  </div>
                )}

                {homeLog && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#7f8c8d', fontWeight: 600 }}>🏠 Aktivitas Rumah</span>
                      <span style={{
                        fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.75rem',
                        color: homeDone === homeActivities.length ? '#3498DB' : '#7f8c8d',
                      }}>
                        {homeDone}/{homeActivities.length}
                      </span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', background: '#D6EAF8', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '3px',
                        background: 'linear-gradient(90deg, #2980B9, #3498DB)',
                        width: '100%',
                        transform: `scaleX(${homeActivities.length > 0 ? (homeDone / homeActivities.length) : 0})`,
                        transformOrigin: 'left',
                        transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                      }} />
                    </div>
                    {homeLog.parentNote && (
                      <div style={{
                        marginTop: '8px', padding: '8px 10px',
                        background: '#FAF5FF', borderRadius: '8px',
                        fontSize: '0.78rem', color: '#2C3E50',
                        border: '1px solid rgba(155, 89, 182, 0.25)',
                      }}>
                        <strong style={{ color: '#6C3483' }}>Catatan Anda:</strong> {homeLog.parentNote}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Download PDF */}
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="btn btn-lg btn-full"
        style={{
          background: 'linear-gradient(135deg, #1A5276, #3498DB)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 16px rgba(52,152,219,0.35)',
          marginBottom: '20px',
          fontFamily: 'Nunito, sans-serif',
          fontWeight: 700,
          fontSize: '1rem',
          padding: '16px',
          borderRadius: '16px',
          cursor: 'pointer',
        }}
      >
        {isDownloading ? '⏳ Mempersiapkan...' : '📥 Unduh Laporan PDF'}
      </button>

      {/* Hidden PDF */}
      <div id="parent-report" style={{
        position: 'fixed', left: '-9999px', top: 0,
        width: '794px', background: 'white', padding: '40px',
        fontFamily: 'Arial, sans-serif',
      }}>
        <div style={{ textAlign: 'center', borderBottom: '3px solid #3498DB', paddingBottom: '20px', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '16pt', fontWeight: 'bold', color: '#1A5276', margin: 0 }}>PAUD Islam Terpadu Darul Khairat</h1>
          <h2 style={{ fontSize: '13pt', color: '#3498DB', margin: '4px 0 0' }}>Buku Penghubung Online — Laporan Orang Tua</h2>
        </div>
        <div style={{ marginBottom: '20px', padding: '12px', background: '#D6EAF8', borderRadius: '8px', fontSize: '11pt' }}>
          <strong>Nama Siswa:</strong> {student.name} &nbsp;|&nbsp;
          <strong>Kelas:</strong> A &nbsp;|&nbsp;
          <strong>Periode:</strong> {formatDateShort(dates[0])} — {formatDateShort(dates[dates.length - 1])}
        </div>

        {dates.map(date => {
          const log = getLog(student.id, date);
          const homeLog = getHome(student.id, date);
          if (!log && !homeLog) return null;
          return (
            <div key={date} style={{ marginBottom: '20px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ background: '#2980B9', color: 'white', padding: '8px 12px', fontWeight: 'bold', fontSize: '10pt' }}>
                {formatDateIndonesia(date)}
              </div>
              <div style={{ padding: '12px', fontSize: '9pt' }}>
                {log && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Kegiatan Sekolah:</strong>{' '}
                    {schoolActivities.filter(a => log.schoolActivities[a.id]).map(a => a.label).join(', ') || '—'}
                    {log.teacherNote && <div style={{ marginTop: '4px', color: '#555' }}><em>Catatan Guru: {log.teacherNote}</em></div>}
                  </div>
                )}
                {homeLog && (
                  <div>
                    <strong>Aktivitas Rumah:</strong>{' '}
                    {homeActivities.filter(a => homeLog.homeActivities[a.id]).map(a => {
                      const v = homeLog.homeActivities[a.id];
                      return a.hasTime && typeof v === 'string' ? `${a.label} (${v})` : a.label;
                    }).join(', ') || '—'}
                    {homeLog.parentNote && <div style={{ marginTop: '4px', color: '#555' }}><em>Catatan Ortu: {homeLog.parentNote}</em></div>}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
          <div><div style={{ borderTop: '1px solid #333', paddingTop: '4px', width: '160px', marginTop: '48px' }}>Wali Kelas</div></div>
          <div><div style={{ borderTop: '1px solid #333', paddingTop: '4px', width: '160px', marginTop: '48px' }}>Orang Tua / Wali</div></div>
        </div>
      </div>
    </div>
  );
}
