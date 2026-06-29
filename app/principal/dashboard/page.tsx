// app/principal/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  getClasses, 
  getStudentsByClass, 
  getDailyLog, 
  getHomeLog, 
  getActiveSchoolActivities,
  getActiveHomeActivities
} from '@/lib/db';
import { KONDISI_OPTIONS } from '@/lib/constants';
import { formatDateIndonesia, getTodayISO } from '@/lib/utils';
import type { DailyLog, HomeLog, Student, SchoolActivity, HomeActivity, ClassInfo } from '@/lib/types';

export default function PrincipalDashboard() {
  const [mounted, setMounted] = useState(false);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolActivities, setSchoolActivities] = useState<SchoolActivity[]>([]);
  const [homeActivities, setHomeActivities] = useState<HomeActivity[]>([]);
  const [dailyLogs, setDailyLogs] = useState<{ [studentId: string]: DailyLog }>({});
  const [homeLogs, setHomeLogs] = useState<{ [studentId: string]: HomeLog }>({});
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<'school' | 'home'>('school');

  // Custom Dropdown States
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [searchClassQuery, setSearchClassQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'alumni'>('active');

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
      loadDashboardData();
    }
  }, [selectedClassId, selectedDate]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [acts, hacts, stList] = await Promise.all([
        getActiveSchoolActivities(),
        getActiveHomeActivities(),
        getStudentsByClass(selectedClassId)
      ]);

      const dLogsMap: { [studentId: string]: DailyLog } = {};
      const hLogsMap: { [studentId: string]: HomeLog } = {};

      await Promise.all(
        stList.map(async (student) => {
          const [dLog, hLog] = await Promise.all([
            getDailyLog(student.id, selectedDate),
            getHomeLog(student.id, selectedDate)
          ]);
          if (dLog) dLogsMap[student.id] = dLog;
          if (hLog) hLogsMap[student.id] = hLog;
        })
      );

      setSchoolActivities(acts);
      setHomeActivities(hacts);
      setStudents(stList);
      setDailyLogs(dLogsMap);
      setHomeLogs(hLogsMap);
    } catch (err) {
      console.error('Error loading principal dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  const filteredStudents = students.filter(s => {
    if (statusFilter === 'active') return s.status !== 'alumni';
    if (statusFilter === 'alumni') return s.status === 'alumni';
    return true;
  });

  const totalStudents = filteredStudents.length;
  const totalHadir = filteredStudents.filter(s => dailyLogs[s.id]?.schoolActivities?.hadir).length;
  const totalSakit = filteredStudents.filter(s => dailyLogs[s.id]?.healthStatus?.kondisi === 'sakit').length;
  const totalIzin = filteredStudents.filter(s => dailyLogs[s.id]?.schoolActivities && !dailyLogs[s.id]?.schoolActivities?.hadir && dailyLogs[s.id]?.healthStatus?.kondisi !== 'sakit').length;

  const selectedClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="page-content" style={{ paddingBottom: '90px' }}>
      {/* Page Header */}
      <div className="animate-fade-in-up" style={{ marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1.4rem', color: '#2C3E50', marginBottom: '4px' }}>
          🏫 Dasbor Kepala Sekolah
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>Pantauan kehadiran & aktivitas harian siswa</p>
      </div>

      {/* Class and Date Selectors */}
      <div className="card animate-fade-in-up delay-100" style={{ padding: '16px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', overflow: 'visible', position: 'relative', zIndex: 20 }}>
        <div style={{ position: 'relative', zIndex: classDropdownOpen ? 30 : 1 }}>
          <label className="input-label" style={{ fontWeight: 800, color: 'var(--text-dark)' }}>📚 Pilih Kelas</label>
          <div
            onClick={() => setClassDropdownOpen(!classDropdownOpen)}
            className="input"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'white',
              padding: '10px 12px',
              borderRadius: '12px',
              border: classDropdownOpen ? '1.5px solid #8E44AD' : '1.5px solid #E8ECF0',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#2C3E50',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
              {selectedClass ? `🏫 ${selectedClass.name}` : 'Pilih Kelas'}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#AEB6BF', flexShrink: 0 }}>▼</span>
          </div>

          {classDropdownOpen && (
            <>
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
                onClick={() => { setClassDropdownOpen(false); setSearchClassQuery(''); }}
              />
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                minWidth: '220px',
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #E8ECF0',
                boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                marginTop: '6px',
                padding: '8px',
                zIndex: 100,
                maxHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <input
                  type="text"
                  placeholder="🔍 Cari kelas..."
                  value={searchClassQuery}
                  onChange={e => setSearchClassQuery(e.target.value)}
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
                  {classes.length === 0 ? (
                    <div style={{ padding: '8px', textAlign: 'center', color: '#AEB6BF', fontSize: '0.85rem' }}>
                      Tidak ada kelas
                    </div>
                  ) : (
                    classes
                      .filter(c => c.name.toLowerCase().includes(searchClassQuery.toLowerCase()))
                      .map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedClassId(c.id);
                            setClassDropdownOpen(false);
                            setSearchClassQuery('');
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
                            background: c.id === selectedClassId ? 'var(--bg-cream)' : 'transparent',
                            transition: 'background 0.2s',
                          }}
                        >
                          <span>🏫 {c.name}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <div>
          <label className="input-label" style={{ fontWeight: 800, color: 'var(--text-dark)' }}>📅 Tanggal Laporan</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="input"
            style={{ cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 700, height: '42px', padding: '10px 12px' }}
            max={getTodayISO()}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', animation: 'spin-slow 1s linear infinite', marginBottom: '12px', display: 'inline-block' }}>⏳</div>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#8E44AD' }}>Memuat data dasbor...</p>
          </div>
        </div>
      ) : classes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <span style={{ fontSize: '3rem' }}>🏫</span>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#7f8c8d', marginTop: '12px' }}>Belum ada data kelas yang terdaftar.</p>
        </div>
      ) : (
        <>
          {/* Summary Stats Row */}
          <div className="animate-fade-in-up delay-100" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
            <div className="stat-card" style={{ borderLeft: '4px solid #8E44AD', padding: '10px' }}>
              <div className="stat-number" style={{ fontSize: '1.4rem', color: '#8E44AD' }}>{totalStudents}</div>
              <div className="stat-label" style={{ fontSize: '0.65rem' }}>Total Siswa</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #27AE60', padding: '10px' }}>
              <div className="stat-number" style={{ fontSize: '1.4rem', color: '#27AE60' }}>{totalHadir}</div>
              <div className="stat-label" style={{ fontSize: '0.65rem' }}>Hadir</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #F39C12', padding: '10px' }}>
              <div className="stat-number" style={{ fontSize: '1.4rem', color: '#F39C12' }}>{totalIzin}</div>
              <div className="stat-label" style={{ fontSize: '0.65rem' }}>Izin/Absen</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #E74C3C', padding: '10px' }}>
              <div className="stat-number" style={{ fontSize: '1.4rem', color: '#E74C3C' }}>{totalSakit}</div>
              <div className="stat-label" style={{ fontSize: '0.65rem' }}>Sakit</div>
            </div>
          </div>

          {/* Student Grid */}
          <div className="section-header animate-fade-in-up delay-200" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.3rem' }}>👧👦</span>
              <h2 className="section-title">Daftar Siswa ({selectedClass?.name})</h2>
            </div>
            
            {/* Status Filter Tabs */}
            <div style={{
              display: 'flex',
              background: '#F0F3F4',
              borderRadius: '12px',
              padding: '3px',
              gap: '2px',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
            }}>
              {[
                { value: 'all', label: 'Semua' },
                { value: 'active', label: 'Aktif' },
                { value: 'alumni', label: 'Alumni' }
              ].map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value as any)}
                  style={{
                    border: 'none',
                    background: statusFilter === tab.value ? 'white' : 'transparent',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    color: statusFilter === tab.value ? '#2C3E50' : '#7F8C8D',
                    boxShadow: statusFilter === tab.value ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="card" style={{ padding: '30px 20px', textAlign: 'center', color: '#AEB6BF' }}>
              <span style={{ fontSize: '2.5rem' }}>👥</span>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, marginTop: '8px', fontSize: '0.9rem' }}>
                Tidak ada siswa {statusFilter === 'active' ? 'aktif' : statusFilter === 'alumni' ? 'alumni' : ''} di kelas ini
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredStudents.map((student, idx) => {
                const dLog = dailyLogs[student.id];
                const hLog = homeLogs[student.id];
                const schoolDone = dLog ? Object.values(dLog.schoolActivities).filter(Boolean).length : 0;
                const homeDone = hLog ? Object.values(hLog.homeActivities).filter(v => v === true || (typeof v === 'string' && v !== '')).length : 0;
                
                const hasSchoolLog = !!dLog;
                const hasHomeLog = !!hLog;

                const isHadir = dLog?.schoolActivities?.hadir;
                const kondisi = dLog?.healthStatus?.kondisi;
                const kondisiEmoji = kondisi === 'sehat' ? '😊' : kondisi === 'kurang_sehat' ? '😐' : kondisi === 'sakit' ? '🤒' : '❓';

                return (
                  <div 
                    key={student.id}
                    onClick={() => { setSelectedStudent(student); setActiveTab('school'); }}
                    className="card card-interactive animate-fade-in-up"
                    style={{ 
                      padding: '16px', 
                      cursor: 'pointer',
                      animationDelay: `${idx * 50}ms`,
                      borderLeft: isHadir ? '5px solid #27AE60' : hasSchoolLog ? '5px solid #E74C3C' : '5px solid #AEB6BF'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '52px', height: '52px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #F5EEF8, #D7BDE2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0
                      }}>
                        {student.avatarEmoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#2C3E50' }}>
                            {student.nickname}
                          </span>
                          {student.status === 'alumni' && (
                            <span className="badge" style={{ background: '#FDEDEC', color: '#C0392B', fontSize: '0.65rem' }}>Alumni</span>
                          )}
                          {hasSchoolLog && <span style={{ fontSize: '0.9rem' }}>{kondisiEmoji}</span>}
                          
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                            {hasSchoolLog && (
                              <span className="badge" style={{ background: '#E8F8F5', color: '#117A65', fontSize: '0.65rem' }}>
                                🏫 Guru ({schoolDone}/{student.program === 'halfday' ? schoolActivities.filter(a => !a.isFulldayOnly).length : schoolActivities.length})
                              </span>
                            )}
                            {hasHomeLog && (
                              <span className="badge" style={{ background: '#F4ECF7', color: '#6C3483', fontSize: '0.65rem' }}>
                                🏡 Ortu ({homeDone}/{homeActivities.length})
                              </span>
                            )}
                            {!hasSchoolLog && !hasHomeLog && (
                              <span className="badge" style={{ background: '#F2F4F4', color: '#7F8C8D', fontSize: '0.65rem' }}>
                                Belum Ada Laporan
                              </span>
                            )}
                          </div>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#7F8C8D', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {student.name}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Details Modal */}
      {selectedStudent && (
        <div className="modal-backdrop" onClick={() => setSelectedStudent(null)}>
          <div 
            className="modal-container animate-fade-in-up" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: '480px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #F0F2F5', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2.2rem' }}>{selectedStudent.avatarEmoji}</span>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '1.05rem', color: '#2C3E50', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {selectedStudent.name}
                    {selectedStudent.status === 'alumni' && (
                      <span className="badge" style={{ background: '#FDEDEC', color: '#C0392B', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px' }}>Alumni</span>
                    )}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#7F8C8D' }}>{selectedClass?.name} • Laporan {formatDateIndonesia(selectedDate)}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.6rem', cursor: 'pointer', color: '#AEB6BF' }}
              >
                ×
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #F0F2F5', flexShrink: 0 }}>
              <button 
                onClick={() => setActiveTab('school')}
                style={{ 
                  flex: 1, padding: '12px', border: 'none', background: 'none',
                  fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.85rem',
                  color: activeTab === 'school' ? '#8E44AD' : '#7F8C8D',
                  borderBottom: activeTab === 'school' ? '3px solid #8E44AD' : 'none',
                  cursor: 'pointer'
                }}
              >
                🏫 Laporan Guru
              </button>
              <button 
                onClick={() => setActiveTab('home')}
                style={{ 
                  flex: 1, padding: '12px', border: 'none', background: 'none',
                  fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.85rem',
                  color: activeTab === 'home' ? '#8E44AD' : '#7F8C8D',
                  borderBottom: activeTab === 'home' ? '3px solid #8E44AD' : 'none',
                  cursor: 'pointer'
                }}
              >
                🏡 Laporan Orang Tua
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {activeTab === 'school' ? (
                <div>
                  {dailyLogs[selectedStudent.id] ? (
                    <>
                      {/* Attendance & Health */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ flex: 1, padding: '10px', background: dailyLogs[selectedStudent.id].schoolActivities.hadir ? '#E8F8F5' : '#FADBD8', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: '#7F8C8D', display: 'block' }}>Kehadiran</span>
                          <strong style={{ fontSize: '0.85rem', color: dailyLogs[selectedStudent.id].schoolActivities.hadir ? '#117A65' : '#C0392B' }}>
                            {dailyLogs[selectedStudent.id].schoolActivities.hadir ? '✅ Hadir' : '❌ Absen'}
                          </strong>
                        </div>
                        <div style={{ flex: 1, padding: '10px', background: '#FEF9E7', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: '#7F8C8D', display: 'block' }}>Kondisi</span>
                          <strong style={{ fontSize: '0.85rem', color: '#D35400' }}>
                            {KONDISI_OPTIONS.find(o => o.value === dailyLogs[selectedStudent.id].healthStatus.kondisi)?.emoji} {KONDISI_OPTIONS.find(o => o.value === dailyLogs[selectedStudent.id].healthStatus.kondisi)?.label}
                          </strong>
                        </div>
                        {dailyLogs[selectedStudent.id].healthStatus.suhu && (
                          <div style={{ flex: 1, padding: '10px', background: '#F4F6F6', borderRadius: '10px', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: '#7F8C8D', display: 'block' }}>Suhu</span>
                            <strong style={{ fontSize: '0.85rem', color: '#2C3E50' }}>
                              🌡️ {dailyLogs[selectedStudent.id].healthStatus.suhu}°C
                            </strong>
                          </div>
                        )}
                      </div>

                      {/* Activities Checklist */}
                      <h4 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.85rem', color: '#2C3E50', marginBottom: '8px' }}>📋 Kegiatan Diikuti:</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                        {schoolActivities.filter(act => !(selectedStudent?.program === 'halfday' && act.isFulldayOnly)).map(act => {
                          const done = dailyLogs[selectedStudent.id]?.schoolActivities?.[act.id];
                          const isDone = done === true || (typeof done === 'string' && done !== '');
                          const timeStr = typeof done === 'string' ? done : '';
                          return (
                            <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: isDone ? '#E8F8F5' : '#F9EBEA', borderRadius: '8px', fontSize: '0.8rem' }}>
                              <span>{act.emoji}</span>
                              <span style={{ flex: 1, fontWeight: 700, color: isDone ? '#117A65' : '#78281F', textDecoration: isDone ? 'none' : 'line-through' }}>
                                {act.label}
                                {act.hasTime && isDone && timeStr && ` (Pukul ${timeStr})`}
                              </span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isDone ? '#117A65' : '#C0392B' }}>{isDone ? 'Diikuti' : 'Absen'}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Health Catatan */}
                      {dailyLogs[selectedStudent.id].healthStatus.catatan && (
                        <div style={{ background: '#FEF9E7', padding: '10px 12px', borderRadius: '10px', borderLeft: '3px solid #F1C40F', fontSize: '0.78rem', color: '#7D6608', marginBottom: '12px' }}>
                          <strong>Catatan Kesehatan:</strong> {dailyLogs[selectedStudent.id].healthStatus.catatan}
                        </div>
                      )}

                      {/* Teacher Note */}
                      {dailyLogs[selectedStudent.id].teacherNote && (
                        <div style={{ background: '#EAF2F8', padding: '12px', borderRadius: '10px', borderLeft: '3px solid #2980B9', fontSize: '0.8rem', color: '#2471A3' }}>
                          <strong style={{ display: 'block', marginBottom: '4px' }}>💬 Catatan Guru:</strong>
                          <p style={{ margin: 0, lineHeight: 1.4 }}>{dailyLogs[selectedStudent.id].teacherNote}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: '#AEB6BF' }}>
                      <span style={{ fontSize: '2.5rem' }}>⏳</span>
                      <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, marginTop: '8px', fontSize: '0.85rem' }}>Laporan belum diisi oleh Guru</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {homeLogs[selectedStudent.id] ? (
                    <>
                      {/* Activities Checklist */}
                      <h4 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.85rem', color: '#2C3E50', marginBottom: '8px' }}>🏠 Aktivitas Di Rumah:</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                        {homeActivities.map(act => {
                          const val = homeLogs[selectedStudent.id].homeActivities[act.id];
                          const isChecked = val === true || (act.hasTime && typeof val === 'string' && val !== '' && val !== undefined);
                          
                          return (
                            <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: isChecked ? '#F4ECF7' : '#F2F4F4', borderRadius: '8px', fontSize: '0.8rem' }}>
                              <span>{act.emoji}</span>
                              <span style={{ flex: 1, fontWeight: 700, color: isChecked ? '#6C3483' : '#7F8C8D' }}>
                                {act.label}
                                {act.hasTime && isChecked && typeof val === 'string' && ` (Pukul ${val})`}
                              </span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isChecked ? '#8E44AD' : '#7F8C8D' }}>{isChecked ? 'Dilakukan' : 'Tidak'}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Parent Note */}
                      {homeLogs[selectedStudent.id].parentNote && (
                        <div style={{ background: '#FAF5FF', padding: '12px', borderRadius: '10px', borderLeft: '3px solid #9B59B6', fontSize: '0.8rem', color: '#6C3483' }}>
                          <strong style={{ display: 'block', marginBottom: '4px' }}>💬 Catatan Orang Tua:</strong>
                          <p style={{ margin: 0, lineHeight: 1.4 }}>{homeLogs[selectedStudent.id].parentNote}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: '#AEB6BF' }}>
                      <span style={{ fontSize: '2.5rem' }}>⏳</span>
                      <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, marginTop: '8px', fontSize: '0.85rem' }}>Laporan belum diisi oleh Orang Tua</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #F0F2F5', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="btn btn-outline"
                style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
