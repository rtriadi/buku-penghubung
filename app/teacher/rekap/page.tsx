// app/teacher/rekap/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  getStudentsByClass,
  getDailyLogs,
  getHomeLogs,
  getActiveSchoolActivities,
  getActiveHomeActivities,
  getUserById
} from '@/lib/db';
import { useAuth } from '@/lib/auth-context';
import { CLASS_NAME } from '@/lib/constants';
import { formatDateIndonesia, formatDateShort, downloadPDF } from '@/lib/utils';
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

function getDatesInMonth(year: number, month: number): string[] {
  const datesList: string[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    datesList.push(`${yyyy}-${mm}-${dd}`);
    date.setDate(date.getDate() + 1);
  }
  return datesList;
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

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

  // Month and Year Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [parentName, setParentName] = useState('Orang Tua / Wali');

  const dates = getDatesInMonth(selectedYear, selectedMonth);
  const student = students.find(s => s.id === selectedStudentId);

  useEffect(() => {
    setMounted(true);
    if (user?.classId) {
      loadRekapData();
    }
  }, [user]);

  useEffect(() => {
    async function fetchParent() {
      if (student?.parentId) {
        try {
          const res = await fetch(`/api/profile?id=${student.parentId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.name) {
              setParentName(data.name);
              return;
            }
          }
        } catch (e) {
          console.error('Error fetching parent profile:', e);
        }
      }
      setParentName('Orang Tua / Wali');
    }
    if (student) {
      fetchParent();
    }
  }, [student]);

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
      const monthStr = MONTHS[selectedMonth];
      await downloadPDF(
        'report-template',
        `Rekap-${student.nickname}-${monthStr}-${selectedYear}.pdf`,
        'landscape'
      );
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
          📊 Rekap Bulanan Siswa
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '20px' }}>
          Laporan aktivitas kelas {user?.classId?.toUpperCase().replace('-', ' ')} per bulan
        </p>
      </div>

      {/* Filter Row */}
      <div className="animate-fade-in-up delay-100" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div>
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
        <div>
          <label className="input-label">📅 Pilih Bulan</label>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="input"
            style={{ cursor: 'pointer' }}
          >
            {MONTHS.map((m, idx) => (
              <option key={idx} value={idx}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="input-label">🗓️ Tahun</label>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="input"
            style={{ cursor: 'pointer' }}
          >
            {[2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
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
                  Kelas {user?.classId?.toUpperCase().replace('-', ' ')} • Periode: {MONTHS[selectedMonth]} {selectedYear}
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
            style={{ marginBottom: '30px' }}
          >
            {isDownloading ? '⏳ Mempersiapkan PDF Bulanan (Landscape)...' : '📥 Unduh Laporan PDF (Landscape)'}
          </button>

          {/* Hidden PDF Template (Landscape A4: 1123px width) */}
          <div id="report-template" style={{
            position: 'fixed', left: '-9999px', top: 0,
            width: '1123px',
            fontFamily: 'Arial, sans-serif',
          }}>
            {/* PAGE 1: School Activities */}
            <div className="pdf-page" style={{
              width: '1123px', height: '794px', background: 'white', padding: '40px',
              boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ textAlign: 'center', borderBottom: '3px solid #27AE60', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <img 
                      src="/logo-darul-khairat.png" 
                      alt="Logo Darul Khairat" 
                      style={{ width: '70px', height: '70px', objectFit: 'contain' }}
                    />
                  </div>
                  <h1 style={{ fontSize: '18pt', fontWeight: 'bold', color: '#1E8449', margin: 0 }}>PAUD Islam Terpadu Darul Khairat</h1>
                  <h2 style={{ fontSize: '13pt', color: '#27AE60', margin: '4px 0 0' }}>Buku Penghubung Online — Laporan Bulanan (Kegiatan Sekolah)</h2>
                  <p style={{ fontSize: '9.5pt', color: '#7f8c8d', margin: '4px 0 0' }}>Periode: {MONTHS[selectedMonth]} {selectedYear}</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px', padding: '10px 14px', background: '#D5F5E3', borderRadius: '8px', fontSize: '10pt' }}>
                  <div>
                    <strong>Nama Siswa:</strong> {student.name}<br />
                    <strong>Avatar Siswa:</strong> {student.avatarEmoji}
                  </div>
                  <div>
                    <strong>Kelas:</strong> {user?.classId?.toUpperCase().replace('-', ' ')}<br />
                    <strong>Tanggal Lahir:</strong> {student.birthdate}
                  </div>
                </div>

                <h3 style={{ fontSize: '12pt', color: '#1E8449', marginBottom: '8px', borderBottom: '1.5px solid #27AE60', paddingBottom: '4px' }}>Kegiatan Sekolah</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7pt' }}>
                  <thead>
                    <tr style={{ background: '#27AE60', color: 'white' }}>
                      <th style={{ padding: '6px 4px', textAlign: 'left', border: '1px solid #ddd', width: '140px' }}>Kegiatan</th>
                      {dates.map(d => <th key={d} style={{ padding: '6px 1px', textAlign: 'center', border: '1px solid #ddd' }}>{d.split('-')[2]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {schoolActivities.map((act, idx) => (
                      <tr key={act.id} style={{ background: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                        <td style={{ padding: '5px 4px', border: '1px solid #ddd', fontWeight: 'bold' }}>{act.label}</td>
                        {dates.map(d => {
                          const log = getLog(dailyLogs, student.id, d);
                          const done = log?.schoolActivities?.[act.id] ?? false;
                          return (
                            <td key={d} style={{ padding: '5px 1px', textAlign: 'center', border: '1px solid #ddd', color: done ? '#27AE60' : '#ddd', fontWeight: done ? 'bold' : 'normal' }}>
                              {done ? '✓' : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8pt', color: '#7f8c8d' }}>
                <span>PAUD IT Darul Khairat</span>
                <span>Halaman 1 dari 2</span>
              </div>
            </div>

            {/* PAGE 2: Home Activities & Signatures */}
            <div className="pdf-page" style={{
              width: '1123px', height: '794px', background: 'white', padding: '40px',
              boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ textAlign: 'center', borderBottom: '3px solid #3498DB', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <img 
                      src="/logo-darul-khairat.png" 
                      alt="Logo Darul Khairat" 
                      style={{ width: '70px', height: '70px', objectFit: 'contain' }}
                    />
                  </div>
                  <h1 style={{ fontSize: '18pt', fontWeight: 'bold', color: '#1A5276', margin: 0 }}>PAUD Islam Terpadu Darul Khairat</h1>
                  <h2 style={{ fontSize: '13pt', color: '#3498DB', margin: '4px 0 0' }}>Buku Penghubung Online — Laporan Bulanan (Aktivitas Rumah)</h2>
                  <p style={{ fontSize: '9.5pt', color: '#7f8c8d', margin: '4px 0 0' }}>Periode: {MONTHS[selectedMonth]} {selectedYear}</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px', padding: '10px 14px', background: '#D6EAF8', borderRadius: '8px', fontSize: '10pt' }}>
                  <div>
                    <strong>Nama Siswa:</strong> {student.name}<br />
                    <strong>Avatar Siswa:</strong> {student.avatarEmoji}
                  </div>
                  <div>
                    <strong>Wali Murid:</strong> {parentName}<br />
                    <strong>Kelas:</strong> {user?.classId?.toUpperCase().replace('-', ' ')}
                  </div>
                </div>

                <h3 style={{ fontSize: '12pt', color: '#3498DB', marginBottom: '8px', borderBottom: '1.5px solid #3498DB', paddingBottom: '4px' }}>Aktivitas Rumah</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7pt', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ background: '#3498DB', color: 'white' }}>
                      <th style={{ padding: '6px 4px', textAlign: 'left', border: '1px solid #ddd', width: '140px' }}>Aktivitas</th>
                      {dates.map(d => <th key={d} style={{ padding: '6px 1px', textAlign: 'center', border: '1px solid #ddd' }}>{d.split('-')[2]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {homeActivities.map((act, idx) => (
                      <tr key={act.id} style={{ background: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                        <td style={{ padding: '5px 4px', border: '1px solid #ddd', fontWeight: 'bold' }}>{act.label}</td>
                        {dates.map(d => {
                          const log = getHomeLog(homeLogs, student.id, d);
                          const val = log?.homeActivities?.[act.id];
                          const done = val === true || (typeof val === 'string' && val.length > 0);
                          return (
                            <td key={d} style={{ padding: '5px 1px', textAlign: 'center', border: '1px solid #ddd', color: done ? '#2980B9' : '#ddd', fontSize: act.hasTime && typeof val === 'string' && val ? '6pt' : '7pt' }}>
                              {act.hasTime && typeof val === 'string' && val ? val : done ? '✓' : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                {/* Landscape Signatures Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 80px', marginBottom: '15px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '9pt', color: '#555', marginBottom: '40px' }}>Mengetahui,</div>
                    <div style={{ borderTop: '1px solid #333', paddingTop: '4px', width: '200px', fontWeight: 'bold', fontSize: '9.5pt', color: '#2C3E50' }}>
                      {user?.name || 'Wali Kelas'}
                    </div>
                    <div style={{ fontSize: '8pt', color: '#7f8c8d' }}>Wali Kelas</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '9pt', color: '#555', marginBottom: '40px' }}>Menyetujui,</div>
                    <div style={{ borderTop: '1px solid #333', paddingTop: '4px', width: '200px', fontWeight: 'bold', fontSize: '9.5pt', color: '#2C3E50' }}>
                      {parentName}
                    </div>
                    <div style={{ fontSize: '8pt', color: '#7f8c8d' }}>Orang Tua / Wali</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8pt', color: '#7f8c8d' }}>
                  <span>PAUD IT Darul Khairat</span>
                  <span>Halaman 2 dari 2</span>
                </div>
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
