// app/teacher/rekap/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getStudentsByClass,
  getDailyLogs,
  getHomeLogs,
  getActiveSchoolActivities,
  getActiveHomeActivities
} from '@/lib/db';
import { useAuth } from '@/lib/auth-context';
import { CLASS_NAME } from '@/lib/constants';
import { formatDateIndonesia, formatDateShort, getLastNDates, downloadPDF } from '@/lib/utils';
import type { DailyLog, HomeLog, Student, SchoolActivity, HomeActivity } from '@/lib/types';

function getLog(logs: DailyLog[], studentId: string, date: string) {
  return logs.find(l => l.studentId === studentId && l.date === date);
}

function getHomeLog(logs: HomeLog[], studentId: string, date: string) {
  return logs.find(l => l.studentId === studentId && l.date === date);
}

function ActivityDot({ done }: { done: boolean }) {
  return (
    <div style={{
      width: '10px', height: '10px', borderRadius: '50%',
      background: done ? '#27AE60' : '#E8ECF0',
      flexShrink: 0,
    }} />
  );
}

export default function TeacherRekapPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolActivities, setSchoolActivities] = useState<SchoolActivity[]>([]);
  const [homeActivities, setHomeActivities] = useState<HomeActivity[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [homeLogs, setHomeLogs] = useState<HomeLog[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const dates = getLastNDates(7);
  const student = students.find(s => s.id === selectedStudentId);

  useEffect(() => {
    setMounted(true);
    if (user?.classId) {
      loadRekapData();
    }
  }, [user]);

  async function loadRekapData() {
    if (!user?.classId) return;
    setLoading(true);
    try {
      const [stList, sa, ha, dl, hl] = await Promise.all([
        getStudentsByClass(user.classId),
        getActiveSchoolActivities(),
        getActiveHomeActivities(),
        getDailyLogs(),
        getHomeLogs()
      ]);

      setStudents(stList);
      setSchoolActivities(sa);
      setHomeActivities(ha);
      setDailyLogs(dl);
      setHomeLogs(hl);

      if (stList.length > 0) {
        setSelectedStudentId(stList[0].id);
      }
    } catch (err) {
      console.error('Error loading rekap data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!student) return;
    setIsDownloading(true);
    try {
      await downloadPDF('report-template', `Laporan-${student.nickname}-${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.pdf`);
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
          <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: 'var(--primary)' }}>Memuat data rekap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="animate-fade-in-up">
        <h1 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1.4rem', color: '#2C3E50', marginBottom: '4px' }}>
          📊 Rekap Mingguan
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '20px' }}>
          Laporan 7 hari terakhir siswa kelas {user?.classId?.toUpperCase().replace('-', ' ')}
        </p>
      </div>

      {/* Student Selector */}
      <div className="animate-fade-in-up delay-100" style={{ marginBottom: '20px' }}>
        <label className="input-label">👧 Pilih Siswa</label>
        <select
          value={selectedStudentId}
          onChange={e => setSelectedStudentId(e.target.value)}
          className="input"
          style={{ cursor: 'pointer' }}
        >
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.avatarEmoji} {s.name}</option>
          ))}
        </select>
      </div>

      {students.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#AEB6BF', background: 'white', borderRadius: '20px' }}>
          Belum ada data siswa di kelas Anda.
        </div>
      ) : student ? (
        <>
          {/* Student Info Card */}
          <div className="card animate-fade-in-up delay-200" style={{ padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #D5F5E3, #A9DFBF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
              }}>
                {student.avatarEmoji}
              </div>
              <div>
                <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '1rem' }}>{student.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
                  Kelas {user?.classId?.toUpperCase().replace('-', ' ')} • Lahir: {student.birthdate}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Table */}
          <div className="animate-fade-in-up delay-300" style={{ marginBottom: '20px' }}>
            <div className="section-header">
              <span style={{ fontSize: '1.4rem' }}>📅</span>
              <h2 className="section-title">Kegiatan Sekolah</h2>
            </div>
            <div style={{ overflowX: 'auto', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', background: 'white' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #1E8449, #27AE60)' }}>
                    <th style={{ padding: '10px 12px', color: 'white', fontFamily: 'Nunito, sans-serif', textAlign: 'left', whiteSpace: 'nowrap', borderRadius: '16px 0 0 0' }}>
                      Kegiatan
                    </th>
                    {dates.map((d, i) => (
                      <th key={d} style={{
                        padding: '10px 8px', color: 'white', fontFamily: 'Nunito, sans-serif',
                        textAlign: 'center', whiteSpace: 'nowrap',
                        borderRadius: i === dates.length - 1 ? '0 16px 0 0' : undefined,
                      }}>
                        {formatDateShort(d)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schoolActivities.map((activity, idx) => (
                    <tr key={activity.id} style={{ background: idx % 2 === 0 ? '#FAFAFA' : 'white' }}>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#2C3E50', fontWeight: 600 }}>
                        {activity.emoji} {activity.label}
                      </td>
                      {dates.map(d => {
                        const log = getLog(dailyLogs, student.id, d);
                        const done = log?.schoolActivities?.[activity.id] ?? false;
                        return (
                          <td key={d} style={{ padding: '10px 8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <ActivityDot done={done} />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Home Activities Summary */}
          <div className="animate-fade-in-up delay-400" style={{ marginBottom: '20px' }}>
            <div className="section-header">
              <span style={{ fontSize: '1.4rem' }}>🏠</span>
              <h2 className="section-title">Aktivitas Rumah</h2>
            </div>
            <div style={{ overflowX: 'auto', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', background: 'white' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #2980B9, #3498DB)' }}>
                    <th style={{ padding: '10px 12px', color: 'white', fontFamily: 'Nunito, sans-serif', textAlign: 'left', whiteSpace: 'nowrap', borderRadius: '16px 0 0 0' }}>
                      Aktivitas
                    </th>
                    {dates.map((d, i) => (
                      <th key={d} style={{
                        padding: '10px 8px', color: 'white', fontFamily: 'Nunito, sans-serif',
                        textAlign: 'center', whiteSpace: 'nowrap',
                        borderRadius: i === dates.length - 1 ? '0 16px 0 0' : undefined,
                      }}>
                        {formatDateShort(d)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {homeActivities.map((activity, idx) => (
                    <tr key={activity.id} style={{ background: idx % 2 === 0 ? '#FAFAFA' : 'white' }}>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#2C3E50', fontWeight: 600 }}>
                        {activity.emoji} {activity.label}
                      </td>
                      {dates.map(d => {
                        const log = getHomeLog(homeLogs, student.id, d);
                        const val = log?.homeActivities?.[activity.id];
                        const done = val === true || (typeof val === 'string' && val.length > 0);
                        return (
                          <td key={d} style={{ padding: '10px 8px', textAlign: 'center' }}>
                            {activity.hasTime && typeof val === 'string' && val ? (
                              <span style={{ fontSize: '0.65rem', color: '#3498DB', fontWeight: 700 }}>{val}</span>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <ActivityDot done={done} />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div className="animate-fade-in-up delay-500" style={{ marginBottom: '24px' }}>
            <div className="section-header">
              <span style={{ fontSize: '1.4rem' }}>📝</span>
              <h2 className="section-title">Catatan Guru & Orang Tua</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {dates.map(d => {
                const log = getLog(dailyLogs, student.id, d);
                const homeLog = getHomeLog(homeLogs, student.id, d);
                if (!log?.teacherNote && !homeLog?.parentNote) return null;
                return (
                  <div key={d} className="card" style={{ padding: '14px' }}>
                    <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: '#7f8c8d', marginBottom: '8px' }}>
                      📅 {formatDateIndonesia(d)}
                    </div>
                    {log?.teacherNote && (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ color: '#27AE60', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>Guru:</span>
                        <span style={{ fontSize: '0.8rem', color: '#2C3E50' }}>{log.teacherNote}</span>
                      </div>
                    )}
                    {homeLog?.parentNote && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: '#3498DB', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>Ortu:</span>
                        <span style={{ fontSize: '0.8rem', color: '#2C3E50' }}>{homeLog.parentNote}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn btn-secondary btn-lg btn-full"
          >
            {isDownloading ? '⏳ Mempersiapkan PDF...' : '📥 Unduh Laporan PDF'}
          </button>

          {/* Hidden PDF Template */}
          <div id="report-template" style={{
            position: 'fixed', left: '-9999px', top: 0,
            width: '794px', background: 'white', padding: '40px',
            fontFamily: 'Arial, sans-serif',
          }}>
            <div style={{ textAlign: 'center', borderBottom: '3px solid #27AE60', paddingBottom: '20px', marginBottom: '24px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🕌</div>
              <h1 style={{ fontSize: '16pt', fontWeight: 'bold', color: '#1E8449', margin: 0 }}>PAUD Islam Terpadu Darul Khairat</h1>
              <h2 style={{ fontSize: '13pt', color: '#27AE60', margin: '4px 0 0' }}>Buku Penghubung Online</h2>
              <p style={{ fontSize: '10pt', color: '#7f8c8d', margin: '4px 0 0' }}>Laporan Harian Siswa — Minggu Ini</p>
            </div>
            <div style={{ marginBottom: '20px', padding: '12px', background: '#D5F5E3', borderRadius: '8px' }}>
              <strong>Nama Siswa:</strong> {student.name}<br />
              <strong>Kelas:</strong> {user?.classId?.toUpperCase().replace('-', ' ')}<br />
              <strong>Periode:</strong> {formatDateShort(dates[0])} — {formatDateShort(dates[dates.length - 1])}
            </div>
            <h3 style={{ fontSize: '12pt', color: '#1E8449', marginBottom: '10px' }}>Kegiatan Sekolah</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: '#27AE60', color: 'white' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Kegiatan</th>
                  {dates.map(d => <th key={d} style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>{formatDateShort(d)}</th>)}
                </tr>
              </thead>
              <tbody>
                {schoolActivities.map((act, idx) => (
                  <tr key={act.id} style={{ background: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{act.label}</td>
                    {dates.map(d => {
                      const log = getLog(dailyLogs, student.id, d);
                      return <td key={d} style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd', color: log?.schoolActivities?.[act.id] ? '#27AE60' : '#E74C3C' }}>
                        {log?.schoolActivities?.[act.id] ? '✓' : '—'}
                      </td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 style={{ fontSize: '12pt', color: '#3498DB', marginBottom: '10px' }}>Aktivitas Rumah</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: '#3498DB', color: 'white' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Aktivitas</th>
                  {dates.map(d => <th key={d} style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>{formatDateShort(d)}</th>)}
                </tr>
              </thead>
              <tbody>
                {homeActivities.map((act, idx) => (
                  <tr key={act.id} style={{ background: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{act.label}</td>
                    {dates.map(d => {
                      const log = getHomeLog(homeLogs, student.id, d);
                      const val = log?.homeActivities?.[act.id];
                      return <td key={d} style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd', color: '#3498DB' }}>
                        {typeof val === 'string' ? val : val ? '✓' : '—'}
                      </td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #333', paddingTop: '4px', width: '160px', marginTop: '48px' }}>Wali Kelas</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #333', paddingTop: '4px', width: '160px', marginTop: '48px' }}>Orang Tua / Wali</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: '30px', textAlign: 'center', color: '#AEB6BF' }}>
          Siswa tidak ditemukan.
        </div>
      )}
    </div>
  );
}
