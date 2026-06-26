// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { getStudents, getUsers, getClasses, getActiveSchoolActivities, getActiveHomeActivities } from '@/lib/db';
import Link from 'next/link';

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalSiswa: 0,
    totalGuru: 0,
    totalWali: 0,
    totalKelas: 0,
    totalActSekolah: 0,
    totalActRumah: 0,
  });

  useEffect(() => {
    setMounted(true);

    async function loadStats() {
      try {
        const [st, us, cl, sa, ha] = await Promise.all([
          getStudents(),
          getUsers(),
          getClasses(),
          getActiveSchoolActivities(),
          getActiveHomeActivities()
        ]);

        setStats({
          totalSiswa: st.length,
          totalGuru: us.filter(u => u.role === 'teacher').length,
          totalWali: us.filter(u => u.role === 'parent').length,
          totalKelas: cl.length,
          totalActSekolah: sa.length,
          totalActRumah: ha.length,
        });
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (!mounted) return null;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        fontFamily: 'Nunito, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', animation: 'spin-slow 1s linear infinite', marginBottom: '12px' }}>⏳</div>
          <p style={{ fontWeight: 700, color: '#1E8449' }}>Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Siswa', value: stats.totalSiswa, emoji: '👶', color: '#3498DB', bg: '#EBF5FB' },
    { label: 'Total Guru', value: stats.totalGuru, emoji: '👩‍🏫', color: '#1ABC9C', bg: '#E8F8F5' },
    { label: 'Wali / Orang Tua', value: stats.totalWali, emoji: '👨‍👩', color: '#9B59B6', bg: '#F5EEF8' },
    { label: 'Total Kelas', value: stats.totalKelas, emoji: '🏫', color: '#F1C40F', bg: '#FEF9E7' },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1E8449, #27AE60)',
        borderRadius: '24px',
        padding: '30px',
        color: 'white',
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(30,132,73,0.15)',
      }}>
        <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '1.6rem', fontWeight: 900, margin: '0 0 8px 0' }}>
          Assalamu'alaikum, Admin! 👋
        </h2>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem', lineHeight: 1.5 }}>
          Selamat datang di Panel Kontrol Buku Penghubung Online PAUD Islam Terpadu Darul Khairat.
          Seluruh data di bawah ini terhubung langsung secara real-time ke database Supabase Anda.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '30px',
      }}>
        {statCards.map((stat, idx) => (
          <div key={idx} style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            border: '1px solid #E8ECF0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#7f8c8d', fontWeight: 700 }}>{stat.label}</span>
              <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#2C3E50', margin: '4px 0 0 0', fontFamily: 'Nunito, sans-serif' }}>
                {stat.value}
              </h3>
            </div>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: stat.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
            }}>
              {stat.emoji}
            </div>
          </div>
        ))}
      </div>

      {/* Main Sections Links */}
      <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#2C3E50', marginBottom: '16px' }}>
        Akses Cepat Pengaturan
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
      }}>
        {/* Quick link cards */}
        {[
          {
            title: '⚙️ Kelola Aktivitas Harian',
            desc: 'Tambah, edit, reorder, atau nonaktifkan daftar kegiatan sekolah & rumah agar form guru dan wali terupdate otomatis secara dinamis.',
            link: '/admin/aktivitas',
            detail: `${stats.totalActSekolah} kegiatan sekolah, ${stats.totalActRumah} kegiatan rumah aktif`,
            color: '#1E8449',
          },
          {
            title: '👩‍🏫 Manajemen Akun Guru',
            desc: 'Daftar guru pengajar. Akun login guru dibuat otomatis dengan password default saat guru didaftarkan ke sistem.',
            link: '/admin/guru',
            detail: `Total ${stats.totalGuru} akun guru aktif`,
            color: '#1ABC9C',
          },
          {
            title: '👨‍👩 Manajemen Wali',
            desc: 'Kelola data wali. Akun orang tua otomatis dibuat saat data diinput untuk dapat login dan memantau tumbuh kembang anak.',
            link: '/admin/wali',
            detail: `Total ${stats.totalWali} akun wali aktif`,
            color: '#9B59B6',
          },
          {
            title: '👶 Manajemen Data Siswa',
            desc: 'Tambah siswa baru, pasangkan dengan kelas, serta hubungkan ke wali yang bertanggung jawab.',
            link: '/admin/siswa',
            detail: `Terdaftar ${stats.totalSiswa} anak di sistem`,
            color: '#3498DB',
          },
        ].map((sec, i) => (
          <Link key={i} href={sec.link} style={{ textDecoration: 'none' }}>
            <div className="card card-interactive" style={{
              padding: '24px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              marginBottom: 0,
            }}>
              <div>
                <h4 style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  color: '#2C3E50',
                  margin: '0 0 10px 0',
                }}>
                  {sec.title}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#7f8c8d', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  {sec.desc}
                </p>
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: sec.color,
                fontWeight: 800,
                background: sec.color + '12',
                padding: '6px 12px',
                borderRadius: '8px',
                display: 'inline-block',
                alignSelf: 'flex-start',
              }}>
                {sec.detail}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
