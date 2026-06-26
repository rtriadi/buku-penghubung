// app/parent/rekap/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  getStudentById,
  getDailyLogs,
  getHomeLogs,
  getActiveSchoolActivities,
  getActiveHomeActivities,
  getClasses,
  getUserById
} from '@/lib/db';
import { formatDateIndonesia, formatDateShort, downloadPDF } from '@/lib/utils';
import type { DailyLog, HomeLog, Student, SchoolActivity, HomeActivity } from '@/lib/types';

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

  // Month and Year filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [teacherName, setTeacherName] = useState('Wali Kelas');
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  const dates = getDatesInMonth(selectedYear, selectedMonth);

  // Filter to dates that have data
  const activeDates = student ? dates.filter(d => {
    const log = dailyLogs.find(l => l.studentId === student.id && l.date === d);
    const homeLog = homeLogs.find(l => l.studentId === student.id && l.date === d);
    return log || homeLog;
  }) : [];

  const pdfPages: string[][] = [];
  if (activeDates.length > 0) {
    // Page 1 gets up to 8 items
    pdfPages.push(activeDates.slice(0, 8));
    // Subsequent pages get 12 items each
    let index = 8;
    while (index < activeDates.length) {
      pdfPages.push(activeDates.slice(index, index + 12));
      index += 12;
    }
  } else {
    // Fallback if no logs
    pdfPages.push([]);
  }

  const [activeChildId, setActiveChildId] = useState<string | null>(null);

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

  useEffect(() => {
    setMounted(true);
    if (activeChildId) {
      loadRekapData(activeChildId);
    } else {
      if (user) {
        const storedId = localStorage.getItem('buku_penghubung_active_child_id');
        if (storedId) {
          setActiveChildId(storedId);
        } else if (user.studentId) {
          setActiveChildId(user.studentId);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
  }, [user, activeChildId]);

  useEffect(() => {
    async function fetchTeacher() {
      if (student?.classId) {
        try {
          const allClasses = await getClasses();
          const studentClass = allClasses.find(c => c.id === student.classId);
          if (studentClass?.teacherId) {
            const res = await fetch(`/api/profile?id=${studentClass.teacherId}`);
            if (res.ok) {
              const data = await res.json();
              if (data.name) {
                setTeacherName(data.name);
                return;
              }
            }
          }
        } catch (e) {
          console.error('Error loading teacher profile:', e);
        }
      }
      setTeacherName('Wali Kelas');
    }
    if (student) {
      fetchTeacher();
    }
  }, [student]);

  async function loadRekapData(childId: string) {
    setLoading(true);
    try {
      const [st, sa, ha, dl, hl] = await Promise.all([
        getStudentById(childId),
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
      const monthStr = MONTHS[selectedMonth];
      await downloadPDF(
        'parent-report',
        `Laporan-${student.nickname}-${monthStr}-${selectedYear}.pdf`,
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
          📊 Rekap Bulanan {student.nickname}
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '20px' }}>Laporan harian penuh per bulan</p>
      </div>

      {/* Filters Row */}
      <div className="animate-fade-in-up delay-100" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ position: 'relative' }}>
          <label className="input-label">📅 Pilih Bulan</label>
          <div
            onClick={() => {
              setMonthDropdownOpen(!monthDropdownOpen);
              setYearDropdownOpen(false);
            }}
            className="input"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'white',
              padding: '8px 12px',
              borderRadius: '12px',
              border: '1.5px solid #E8ECF0',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#2C3E50',
              minHeight: '46px',
            }}
          >
            <span>{MONTHS[selectedMonth]}</span>
            <span style={{ fontSize: '0.8rem', color: '#AEB6BF' }}>▼</span>
          </div>

          {monthDropdownOpen && (
            <>
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
                onClick={() => setMonthDropdownOpen(false)}
              />
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #E8ECF0',
                boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                marginTop: '6px',
                padding: '6px',
                zIndex: 100,
                maxHeight: '240px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}>
                {MONTHS.map((m, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedMonth(idx);
                      setMonthDropdownOpen(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontFamily: 'Nunito, sans-serif',
                      fontWeight: idx === selectedMonth ? 800 : 600,
                      color: idx === selectedMonth ? 'var(--accent-blue)' : '#2C3E50',
                      background: idx === selectedMonth ? '#EBF5FB' : 'transparent',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (idx !== selectedMonth) e.currentTarget.style.background = '#F2F4F4';
                    }}
                    onMouseLeave={(e) => {
                      if (idx !== selectedMonth) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {m}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <label className="input-label">🗓️ Tahun</label>
          <div
            onClick={() => {
              setYearDropdownOpen(!yearDropdownOpen);
              setMonthDropdownOpen(false);
            }}
            className="input"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'white',
              padding: '8px 12px',
              borderRadius: '12px',
              border: '1.5px solid #E8ECF0',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#2C3E50',
              minHeight: '46px',
            }}
          >
            <span>{selectedYear}</span>
            <span style={{ fontSize: '0.8rem', color: '#AEB6BF' }}>▼</span>
          </div>

          {yearDropdownOpen && (
            <>
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
                onClick={() => setYearDropdownOpen(false)}
              />
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #E8ECF0',
                boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                marginTop: '6px',
                padding: '6px',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}>
                {[2025, 2026, 2027].map(y => (
                  <div
                    key={y}
                    onClick={() => {
                      setSelectedYear(y);
                      setYearDropdownOpen(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontFamily: 'Nunito, sans-serif',
                      fontWeight: y === selectedYear ? 800 : 600,
                      color: y === selectedYear ? 'var(--accent-blue)' : '#2C3E50',
                      background: y === selectedYear ? '#EBF5FB' : 'transparent',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (y !== selectedYear) e.currentTarget.style.background = '#F2F4F4';
                    }}
                    onMouseLeave={(e) => {
                      if (y !== selectedYear) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {y}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
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
            <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Kelas A • Laporan Bulanan {MONTHS[selectedMonth]} {selectedYear}</div>
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

            // Only render days that are not in the future
            const targetDate = new Date(date);
            const todayDate = new Date();
            todayDate.setHours(23, 59, 59, 999); // Allow today
            if (targetDate > todayDate) return null;

            return (
              <div key={date} className="card animate-fade-in-up" style={{ padding: '16px', animationDelay: `${(idx % 6) * 50}ms` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{
                    fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#2C3E50',
                  }}>
                    📅 {formatDateIndonesia(date)}
                  </span>
                  {!log && !homeLog && (
                    <span className="badge badge-yellow" style={{ background: '#FEF9E7', color: '#D35400' }}>Belum Ada Data</span>
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
          marginBottom: '30px',
          fontFamily: 'Nunito, sans-serif',
          fontWeight: 700,
          fontSize: '1rem',
          padding: '16px',
          borderRadius: '16px',
          cursor: 'pointer',
        }}
      >
        {isDownloading ? '⏳ Mempersiapkan PDF Bulanan...' : '📥 Unduh Laporan PDF'}
      </button>

      {/* Hidden PDF (Landscape A4: 1123px width) */}
      <div id="parent-report" style={{
        position: 'fixed', left: '-9999px', top: 0,
        width: '1123px',
        fontFamily: 'Arial, sans-serif',
      }}>
        {pdfPages.map((pageDates, pageIdx) => (
          <div key={pageIdx} className="pdf-page" style={{
            width: '1123px', height: '794px', background: 'white', padding: '40px',
            boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div>
              {pageIdx === 0 ? (
                <>
                  <div style={{ textAlign: 'center', borderBottom: '3px solid #3498DB', paddingBottom: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                      <img 
                        src="/logo-darul-khairat.png" 
                        alt="Logo Darul Khairat" 
                        style={{ width: '70px', height: '70px', objectFit: 'contain' }}
                      />
                    </div>
                    <h1 style={{ fontSize: '18pt', fontWeight: 'bold', color: '#1A5276', margin: 0 }}>PAUD Islam Terpadu Darul Khairat</h1>
                    <h2 style={{ fontSize: '13pt', color: '#3498DB', margin: '4px 0 0' }}>Buku Penghubung Online — Laporan Bulanan Anak</h2>
                    <p style={{ fontSize: '9.5pt', color: '#7f8c8d', margin: '4px 0 0' }}>Periode: {MONTHS[selectedMonth]} {selectedYear}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px', padding: '10px 14px', background: '#D6EAF8', borderRadius: '8px', fontSize: '10pt' }}>
                    <div>
                      <strong>Nama Siswa:</strong> {student.name}<br />
                      <strong>Avatar:</strong> {student.avatarEmoji}
                    </div>
                    <div>
                      <strong>Wali Murid:</strong> {user?.name}<br />
                      <strong>Kelas:</strong> Kelas A
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #3498DB', paddingBottom: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img 
                      src="/logo-darul-khairat.png" 
                      alt="Logo" 
                      style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                    />
                    <span style={{ fontFamily: 'Arial', fontWeight: 'bold', fontSize: '11pt', color: '#1A5276' }}>
                      Laporan Bulanan {student.name} ({MONTHS[selectedMonth]} {selectedYear})
                    </span>
                  </div>
                  <span style={{ fontSize: '9pt', color: '#7f8c8d' }}>Kelas A</span>
                </div>
              )}

              {pageDates.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                  <thead>
                    <tr style={{ background: '#2980B9', color: 'white' }}>
                      <th style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'left', width: '160px' }}>Tanggal</th>
                      <th style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'left' }}>Kegiatan Sekolah</th>
                      <th style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'left' }}>Aktivitas Rumah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageDates.map(date => {
                      const log = getLog(student.id, date);
                      const homeLog = getHome(student.id, date);

                      const schoolActsDone = schoolActivities
                        .filter(a => log?.schoolActivities?.[a.id])
                        .map(a => {
                          const val = log?.schoolActivities?.[a.id];
                          return a.hasTime && typeof val === 'string' ? `${a.label} (${val})` : a.label;
                        })
                        .join(', ');

                      const homeActsDone = homeActivities
                        .filter(a => homeLog?.homeActivities?.[a.id])
                        .map(a => {
                          const val = homeLog?.homeActivities?.[a.id];
                          return a.hasTime && typeof val === 'string' ? `${a.label} (${val})` : a.label;
                        })
                        .join(', ');

                      return (
                        <tr key={date}>
                          <td style={{ padding: '5px 8px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                            {formatDateIndonesia(date)}
                          </td>
                          <td style={{ padding: '5px 8px', border: '1px solid #ddd' }}>
                            <div>{schoolActsDone || '—'}</div>
                            {log?.teacherNote && (
                              <div style={{ marginTop: '3px', fontSize: '7pt', color: '#7f8c8d', fontStyle: 'italic' }}>
                                Catatan Guru: "{log.teacherNote}"
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '5px 8px', border: '1px solid #ddd' }}>
                            <div>{homeActsDone || '—'}</div>
                            {homeLog?.parentNote && (
                              <div style={{ marginTop: '3px', fontSize: '7pt', color: '#7f8c8d', fontStyle: 'italic' }}>
                                Catatan Orang Tua: "{homeLog.parentNote}"
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#AEB6BF', fontSize: '10pt', border: '1px dashed #ccc', borderRadius: '8px' }}>
                  Belum ada data aktivitas yang dicatat untuk bulan ini.
                </div>
              )}
            </div>

            {pageIdx === pdfPages.length - 1 ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 80px', marginTop: '20px', marginBottom: '15px' }}>
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
                      {user?.name || 'Orang Tua / Wali'}
                    </div>
                    <div style={{ fontSize: '8pt', color: '#7f8c8d' }}>Orang Tua / Wali</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8pt', color: '#7f8c8d' }}>
                  <span>PAUD IT Darul Khairat</span>
                  <span>Halaman {pageIdx + 1} dari {pdfPages.length}</span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8pt', color: '#7f8c8d' }}>
                <span>PAUD IT Darul Khairat</span>
                <span>Halaman {pageIdx + 1} dari {pdfPages.length}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
