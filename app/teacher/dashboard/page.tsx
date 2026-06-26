// app/teacher/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStudentsByClass, getDailyLog, getActiveSchoolActivities, getDailyLogs } from '@/lib/db';
import { useAuth } from '@/lib/auth-context';
import { CLASS_NAME } from '@/lib/constants';
import { formatDateIndonesia, getTodayISO } from '@/lib/utils';
import type { DailyLog, Student, SchoolActivity } from '@/lib/types';

function countActivitiesDone(log: DailyLog | undefined): number {
  if (!log) return 0;
  return Object.values(log.schoolActivities).filter(Boolean).length;
}

function getStatusInfo(log: DailyLog | undefined, total: number) {
  if (!log) return { label: 'Belum Diisi', emoji: '❌', color: '#E74C3C', bg: '#FADBD8' };
  const done = countActivitiesDone(log);
  if (done === total) return { label: 'Lengkap', emoji: '✅', color: '#1E8449', bg: '#D5F5E3' };
  if (done > 0) return { label: `${done}/${total} kegiatan`, emoji: '🔄', color: '#D35400', bg: '#FDEBD0' };
  return { label: 'Belum Diisi', emoji: '❌', color: '#E74C3C', bg: '#FADBD8' };
}

function StudentCard({
  student,
  log,
  activities,
}: {
  student: Student;
  log: DailyLog | undefined;
  activities: SchoolActivity[];
}) {
  const total = activities.length;
  const done = countActivitiesDone(log);
  const status = getStatusInfo(log, total);
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const kondisi = log?.healthStatus?.kondisi;
  const kondisiEmoji = kondisi === 'sehat' ? '😊' : kondisi === 'kurang_sehat' ? '😐' : kondisi === 'sakit' ? '🤒' : '❓';

  return (
    <Link href={`/teacher/laporan/${student.id}`} style={{ textDecoration: 'none' }}>
      <div className="card card-interactive animate-fade-in-up" style={{ padding: '18px', marginBottom: '0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
          {/* Avatar */}
          <div style={{
            width: '58px',
            height: '58px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #D5F5E3, #A9DFBF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(39,174,96,0.2)',
          }}>
            {student.avatarEmoji}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 800,
                fontSize: '1rem',
                color: '#2C3E50',
              }}>
                {student.nickname}
              </span>
              <span style={{ fontSize: '1rem' }}>{kondisiEmoji}</span>
              <span className="badge" style={{
                background: status.bg,
                color: status.color,
                marginLeft: 'auto',
              }}>
                {status.emoji} {status.label}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#7f8c8d', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {student.name}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#7f8c8d', fontWeight: 600 }}>Kegiatan Hari Ini</span>
            <span style={{ fontSize: '0.75rem', fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: progress === 100 ? '#27AE60' : '#5D6D7E' }}>
              {done}/{total}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ transform: `scaleX(${progress / 100})` }} />
          </div>
        </div>

        {/* Teacher note preview */}
        {log?.teacherNote && (
          <div style={{
            marginTop: '10px',
            padding: '8px 12px',
            background: '#F8F9FA',
            borderRadius: '10px',
            fontSize: '0.75rem',
            color: '#5D6D7E',
            border: '1px solid rgba(39, 174, 96, 0.2)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            📝 {log.teacherNote}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const today = getTodayISO();
  const [mounted, setMounted] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<SchoolActivity[]>([]);
  const [logs, setLogs] = useState<{ [studentId: string]: DailyLog }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (user) {
      if (user.classId) {
        loadDashboardData();
      } else {
        setLoading(false);
      }
    }
  }, [user]);

  async function loadDashboardData() {
    if (!user?.classId) return;
    setLoading(true);
    try {
      // 1. Fetch active school activities and students in class
      const [acts, stList] = await Promise.all([
        getActiveSchoolActivities(),
        getStudentsByClass(user.classId)
      ]);

      // 2. Fetch logs for today for active students in class
      const activeStudents = stList.filter(s => s.status !== 'alumni');
      const logsMap: { [studentId: string]: DailyLog } = {};
      await Promise.all(
        activeStudents.map(async (student) => {
          const log = await getDailyLog(student.id, today);
          if (log) {
            logsMap[student.id] = log;
          }
        })
      );

      setActivities(acts);
      setStudents(activeStudents);
      setLogs(logsMap);
    } catch (err) {
      console.error('Error loading teacher dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', background: 'var(--bg-cream)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', animation: 'spin-slow 1s linear infinite', marginBottom: '16px', display: 'inline-block' }}>⏳</div>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: 'var(--primary)' }}>Memuat data kelas...</p>
        </div>
      </div>
    );
  }

  const totalHadir = students.filter(s => logs[s.id]?.schoolActivities?.hadir).length;
  const totalLengkap = students.filter(s => logs[s.id] && countActivitiesDone(logs[s.id]) === activities.length).length;
  const totalSakit = students.filter(s => logs[s.id]?.healthStatus?.kondisi === 'sakit').length;

  return (
    <div className="page-content">
      {/* Date Header */}
      <div className="animate-fade-in-up" style={{ marginBottom: '20px' }}>
        <h1 style={{
          fontFamily: 'Nunito, sans-serif',
          fontWeight: 900,
          fontSize: '1.4rem',
          color: '#2C3E50',
          marginBottom: '4px',
        }}>
          {user?.classId ? user.classId.toUpperCase().replace('-', ' ') : 'Belum Ada Kelas'} 📚
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
          📅 {formatDateIndonesia(today)}
        </p>
      </div>

      {!user?.classId ? (
        <div className="animate-fade-in-up" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid rgba(0,0,0,0.04)',
          textAlign: 'center',
          marginTop: '20px',
        }}>
          <span style={{ fontSize: '4rem', marginBottom: '16px' }}>🏫</span>
          <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1.2rem', color: '#2C3E50', marginBottom: '8px' }}>
            Belum Memiliki Kelas
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#7f8c8d', maxWidth: '320px', lineHeight: '1.5' }}>
            Akun Guru Anda belum terhubung dengan kelas manapun. Silakan hubungi <strong>Admin Sekolah</strong> untuk mengaitkan kelas Anda.
          </p>
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="animate-fade-in-up delay-100" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
            <div className="stat-card">
              <div className="stat-number">{totalHadir}</div>
              <div className="stat-label">✅ Hadir</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ color: '#F39C12' }}>{totalLengkap}</div>
              <div className="stat-label">📋 Lengkap</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ color: totalSakit > 0 ? '#E74C3C' : '#27AE60' }}>{totalSakit}</div>
              <div className="stat-label">🤒 Sakit</div>
            </div>
          </div>

          {/* Student List */}
          <div className="section-header animate-fade-in-up delay-200">
            <span style={{ fontSize: '1.5rem' }}>👧👦</span>
            <h2 className="section-title">Daftar Siswa</h2>
            <span style={{
              marginLeft: 'auto',
              background: '#E8F8EF',
              color: '#27AE60',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 800,
            }}>
              {students.length} siswa
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {students.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#AEB6BF', background: 'white', borderRadius: '20px' }}>
                Belum ada siswa terdaftar di kelas Anda. Hubungi admin sekolah.
              </div>
            ) : (
              students.map((student, i) => (
                <div key={student.id} className={`animate-fade-in-up delay-${Math.min((i + 2) * 100, 500)}`}>
                  <StudentCard
                    student={student}
                    log={logs[student.id]}
                    activities={activities}
                  />
                </div>
              ))
            )}
          </div>

          {/* Helpful Tip */}
          <div className="animate-fade-in-up" style={{
            marginTop: '24px',
            padding: '16px',
            background: 'linear-gradient(135deg, #EBF5FB, #D6EAF8)',
            borderRadius: '16px',
            border: '1px solid #AED6F1',
          }}>
            <p style={{
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#1A5276',
            }}>
              💡 Tips: Ketuk kartu siswa untuk mengisi laporan harian
            </p>
          </div>
        </>
      )}
    </div>
  );
}
