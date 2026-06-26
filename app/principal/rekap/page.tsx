// app/principal/rekap/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  getClasses,
  getStudentsByClass,
  getDailyLogs,
  getHomeLogs,
  getActiveSchoolActivities,
  getActiveHomeActivities,
  getUserById
} from '@/lib/db';
import { formatDateIndonesia, formatDateShort, downloadPDF } from '@/lib/utils';
import type { DailyLog, HomeLog, Student, SchoolActivity, HomeActivity, ClassInfo } from '@/lib/types';

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
      background: done ? '#8E44AD' : '#E8ECF0',
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

export default function PrincipalRekapPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  const [schoolActivities, setSchoolActivities] = useState<SchoolActivity[]>([]);
  const [homeActivities, setHomeActivities] = useState<HomeActivity[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [homeLogs, setHomeLogs] = useState<HomeLog[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  // Month and Year Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [teacherName, setTeacherName] = useState('Wali Kelas');
  const [parentName, setParentName] = useState('Orang Tua / Wali');

  // Autocomplete Search States
  const [searchSelectOpen, setSearchSelectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dates = getDatesInMonth(selectedYear, selectedMonth);
  
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const student = students.find(s => s.id === selectedStudentId);

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setMounted(true);
    async function loadClasses() {
      try {
        const cls = await getClasses();
        setClasses(cls);
        if (cls.length > 0) {
          setSelectedClassId(cls[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading classes:', err);
        setLoading(false);
      }
    }
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadClassData();
    }
  }, [selectedClassId]);

  async function loadClassData() {
    setLoading(true);
    try {
      const [stList, sa, ha, dl, hl] = await Promise.all([
        getStudentsByClass(selectedClassId),
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
      } else {
        setSelectedStudentId('');
      }
    } catch (err) {
      console.error('Error loading principal rekap data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Fetch Parent and Teacher names for signatures
  useEffect(() => {
    async function fetchDetails() {
      if (selectedClass?.teacherId) {
        try {
          const teacher = await getUserById(selectedClass.teacherId);
          if (teacher) setTeacherName(teacher.name);
          else setTeacherName('Wali Kelas');
        } catch (e) {
          console.error(e);
          setTeacherName('Wali Kelas');
        }
      } else {
        setTeacherName('Wali Kelas');
      }

      if (student?.parentId) {
        try {
          const parent = await getUserById(student.parentId);
          if (parent) setParentName(parent.name);
          else setParentName('Orang Tua / Wali');
        } catch (e) {
          console.error(e);
          setParentName('Orang Tua / Wali');
        }
      } else {
        setParentName('Orang Tua / Wali');
      }
    }

    if (selectedClassId || selectedStudentId) {
      fetchDetails();
    }
  }, [selectedClass, student, selectedClassId, selectedStudentId]);

  async function handleDownload() {
    if (!student) return;
    setIsDownloading(true);
    try {
      const monthStr = MONTHS[selectedMonth];
      await downloadPDF(
        'principal-report-template',
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
          <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#8E44AD' }}>Memuat data rekap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ paddingBottom: '90px' }}>
      <div className="animate-fade-in-up">
        <h1 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1.4rem', color: '#2C3E50', marginBottom: '4px' }}>
          📊 Rekap Bulanan Siswa
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '20px' }}>
          Laporan rekapitulasi harian kelas & siswa per bulan
        </p>
      </div>

      {classes.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#AEB6BF', background: 'white', borderRadius: '20px' }}>
          Belum ada kelas terdaftar.
        </div>
      ) : (
        <>
          {/* Filters card */}
          <div className="card animate-fade-in-up delay-100" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="input-label">🏫 Pilih Kelas</label>
                <select
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  className="input"
                  style={{ cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ position: 'relative' }}>
                <label className="input-label">👧 Pilih Siswa</label>
                <div
                  onClick={() => setSearchSelectOpen(!searchSelectOpen)}
                  className="input"
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'white',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1.5px solid #E8ECF0',
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: '#2C3E50',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                    {student ? `${student.avatarEmoji} ${student.name}${student.status === 'alumni' ? ' (Alumni)' : ''}` : 'Pilih Siswa'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#AEB6BF', flexShrink: 0 }}>▼</span>
                </div>

                {searchSelectOpen && (
                  <>
                    <div 
                      style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
                      onClick={() => { setSearchSelectOpen(false); setSearchQuery(''); }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      minWidth: '260px',
                      background: 'white',
                      borderRadius: '16px',
                      border: '1px solid #E8ECF0',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                      marginTop: '6px',
                      padding: '8px',
                      zIndex: 100,
                      maxHeight: '240px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}>
                      <input
                        type="text"
                        placeholder="🔍 Cari nama siswa..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="input"
                        style={{
                          padding: '8px 10px',
                          fontSize: '0.85rem',
                          borderRadius: '8px',
                          border: '1.5px solid #E8ECF0',
                          width: '100%',
                        }}
                        autoFocus
                      />
                      <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map(s => (
                            <div
                              key={s.id}
                              onClick={() => {
                                setSelectedStudentId(s.id);
                                setSearchSelectOpen(false);
                                setSearchQuery('');
                              }}
                              style={{
                                padding: '10px 12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.85rem',
                                fontFamily: 'Nunito, sans-serif',
                                fontWeight: 700,
                                color: '#2C3E50',
                                background: s.id === selectedStudentId ? 'var(--bg-cream)' : 'transparent',
                                transition: 'background 0.2s',
                              }}
                            >
                              <span style={{ fontSize: '1.2rem' }}>{s.avatarEmoji}</span>
                              <span>{s.name}</span>
                              {s.status === 'alumni' && (
                                <span style={{ fontSize: '0.7rem', background: '#FDEDEC', color: '#C0392B', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto', fontWeight: 'bold' }}>Alumni</span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '12px', textAlign: 'center', color: '#AEB6BF', fontSize: '0.8rem' }}>
                            Siswa tidak ditemukan 😕
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
          </div>

          {students.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#AEB6BF', background: 'white', borderRadius: '20px' }}>
              Tidak ada siswa di kelas ini.
            </div>
          ) : student ? (
            <>
              {/* Student Summary Table */}
              <div className="animate-fade-in-up delay-200" style={{ marginBottom: '20px' }}>
                <div className="section-header">
                  <span style={{ fontSize: '1.4rem' }}>🏫</span>
                  <h2 className="section-title">Kegiatan Sekolah ({student.name})</h2>
                </div>
                <div style={{ overflowX: 'auto', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', background: 'white' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(135deg, #5B2C6F, #8E44AD)' }}>
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
                        <tr key={activity.id} style={{ background: idx % 2 === 0 ? '#FAF5FF' : 'white' }}>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#2C3E50', fontWeight: 600 }}>
                            {activity.emoji} {activity.label}
                          </td>
                          {dates.map(d => {
                            const log = getLog(dailyLogs, student.id, d);
                            const val = log?.schoolActivities?.[activity.id];
                            const done = val === true || (typeof val === 'string' && val.length > 0);
                            return (
                              <td key={d} style={{ padding: '10px 8px', textAlign: 'center' }}>
                                {activity.hasTime && typeof val === 'string' && val ? (
                                  <span style={{ fontSize: '0.65rem', color: '#8E44AD', fontWeight: 700 }}>{val}</span>
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

              {/* Home Activities Summary */}
              <div className="animate-fade-in-up delay-300" style={{ marginBottom: '20px' }}>
                <div className="section-header">
                  <span style={{ fontSize: '1.4rem' }}>🏡</span>
                  <h2 className="section-title">Aktivitas Rumah ({student.name})</h2>
                </div>
                <div style={{ overflowX: 'auto', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', background: 'white' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(135deg, #2E86C1, #3498DB)' }}>
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
                        <tr key={activity.id} style={{ background: idx % 2 === 0 ? '#F4F9FD' : 'white' }}>
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
                                  <span style={{ fontSize: '0.65rem', color: '#2E86C1', fontWeight: 700 }}>{val}</span>
                                ) : (
                                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <div style={{
                                      width: '10px', height: '10px', borderRadius: '50%',
                                      background: done ? '#2E86C1' : '#E8ECF0',
                                      flexShrink: 0,
                                    }} />
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
              <div className="animate-fade-in-up delay-400" style={{ marginBottom: '24px' }}>
                <div className="section-header">
                  <span style={{ fontSize: '1.4rem' }}>📝</span>
                  <h2 className="section-title">Catatan Harian Catatan</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {dates.map(d => {
                    const log = getLog(dailyLogs, student.id, d);
                    const hLog = getHomeLog(homeLogs, student.id, d);
                    if (!log?.teacherNote && !hLog?.parentNote) return null;
                    return (
                      <div key={d} className="card" style={{ padding: '14px' }}>
                        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: '#7f8c8d', marginBottom: '8px' }}>
                          📅 {formatDateIndonesia(d)}
                        </div>
                        {log?.teacherNote && (
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ color: '#8E44AD', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>Guru:</span>
                            <span style={{ fontSize: '0.8rem', color: '#2C3E50' }}>{log.teacherNote}</span>
                          </div>
                        )}
                        {hLog?.parentNote && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#2980B9', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>Ortu:</span>
                            <span style={{ fontSize: '0.8rem', color: '#2C3E50' }}>{hLog.parentNote}</span>
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
                className="btn btn-primary btn-lg btn-full"
                style={{
                  background: 'linear-gradient(135deg, #5B2C6F, #8E44AD)',
                  color: 'white',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(142,68,173,0.35)',
                  marginBottom: '30px',
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 700,
                  fontSize: '1rem',
                  padding: '16px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                }}
              >
                {isDownloading ? '⏳ Mempersiapkan PDF Bulanan (Landscape)...' : '📥 Unduh Laporan PDF (Landscape)'}
              </button>

              {/* Hidden PDF Template (Landscape A4: 1123px width) */}
              <div id="principal-report-template" style={{
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
                    <div style={{ textAlign: 'center', borderBottom: '3px solid #8E44AD', paddingBottom: '16px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                        <img 
                          src="/logo-darul-khairat.png" 
                          alt="Logo Darul Khairat" 
                          style={{ width: '70px', height: '70px', objectFit: 'contain' }}
                        />
                      </div>
                      <h1 style={{ fontSize: '18pt', fontWeight: 'bold', color: '#5B2C6F', margin: 0 }}>PAUD Islam Terpadu Darul Khairat</h1>
                      <h2 style={{ fontSize: '13pt', color: '#8E44AD', margin: '4px 0 0' }}>Buku Penghubung Online — Laporan Bulanan (Kegiatan Sekolah)</h2>
                      <p style={{ fontSize: '9.5pt', color: '#7f8c8d', margin: '4px 0 0' }}>Periode: {MONTHS[selectedMonth]} {selectedYear}</p>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px', padding: '10px 14px', background: '#F4ECF7', borderRadius: '8px', fontSize: '10pt' }}>
                      <div>
                        <strong>Nama Siswa:</strong> {student.name}<br />
                        <strong>Avatar Siswa:</strong> {student.avatarEmoji}
                      </div>
                      <div>
                        <strong>Kelas:</strong> {selectedClass?.name || '—'}<br />
                        <strong>Tanggal Lahir:</strong> {student.birthdate}
                      </div>
                    </div>

                    <h3 style={{ fontSize: '12pt', color: '#5B2C6F', marginBottom: '8px', borderBottom: '1.5px solid #8E44AD', paddingBottom: '4px' }}>Kegiatan Sekolah</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7pt' }}>
                      <thead>
                        <tr style={{ background: '#8E44AD', color: 'white' }}>
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
                              const val = log?.schoolActivities?.[act.id];
                              const done = val === true || (typeof val === 'string' && val.length > 0);
                              return (
                                <td key={d} style={{ padding: '5px 1px', textAlign: 'center', border: '1px solid #ddd', color: done ? '#8E44AD' : '#ddd', fontSize: act.hasTime && typeof val === 'string' && val ? '6pt' : '7pt', fontWeight: done ? 'bold' : 'normal' }}>
                                  {act.hasTime && typeof val === 'string' && val ? val : done ? '✓' : '—'}
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
                        <strong>Kelas:</strong> {selectedClass?.name || '—'}
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
                          {teacherName}
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
        </>
      )}
    </div>
  );
}
