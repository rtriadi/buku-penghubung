// app/admin/guru/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  getUsers,
  getClasses,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  generateEmailFromName,
  promoteToPrincipal,
  setTeacherAdmin,
  DEFAULT_PASSWORD
} from '@/lib/db';
import type { User, AccountCredentials, ClassInfo } from '@/lib/types';

export default function AdminGuruPage() {
  const [mounted, setMounted] = useState(false);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchClassOpen, setSearchClassOpen] = useState(false);
  const [searchClassQuery, setSearchClassQuery] = useState('');
  
  // Generated credentials state
  const [creds, setCreds] = useState<AccountCredentials | null>(null);

  const [currentPrincipal, setCurrentPrincipal] = useState<User | null>(null);
  const [currentTeacherAdmin, setCurrentTeacherAdmin] = useState<User | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [classId, setClassId] = useState('');

  useEffect(() => {
    setMounted(true);
    refreshList();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function refreshList() {
    setLoading(true);
    try {
      const [us, cls] = await Promise.all([
        getUsers(),
        getClasses()
      ]);
      // We list both standard teachers and the promoted teacher-admin (excluding main admin)
      setTeachers(us.filter(u => u.role === 'teacher' || (u.role === 'admin' && u.email !== 'admin@darulkhairat.com')));
      
      const principal = us.find(u => u.role === 'principal');
      setCurrentPrincipal(principal || null);

      const teacherAdmin = us.find(u => u.role === 'admin' && u.email !== 'admin@darulkhairat.com');
      setCurrentTeacherAdmin(teacherAdmin || null);

      setClasses(cls);
    } catch (err) {
      console.error('Error refreshing list:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  function openAddModal() {
    setEditingId(null);
    setName('');
    setEmail('');
    setPassword(DEFAULT_PASSWORD);
    setClassId('');
    setSearchClassOpen(false);
    setSearchClassQuery('');
    setShowModal(true);
  }

  function openEditModal(teacher: User) {
    setEditingId(teacher.id);
    setName(teacher.name);
    setEmail(teacher.email);
    setPassword(teacher.password || DEFAULT_PASSWORD);
    setClassId(teacher.classId || '');
    setSearchClassOpen(false);
    setSearchClassQuery('');
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      if (editingId) {
        // Update teacher profile
        await updateUser(editingId, {
          name,
          email: email || generateEmailFromName(name),
          classId: classId || null as any,
        });
        await refreshList();
        setShowModal(false);
      } else {
        // Create new Teacher via secure server API
        const generatedEmail = email.trim() || generateEmailFromName(name);
        const result = await createUser({
          name,
          email: generatedEmail,
          role: 'teacher',
          password,
          classId: classId || undefined,
        });
        
        setCreds(result.credentials);
        await refreshList();
        setShowModal(false);
        setShowCredsModal(true); // Show credentials modal for copying
      }
    } catch (err: any) {
      console.error('Error saving teacher:', err);
      let errMsg = 'Gagal mendaftarkan guru baru.';
      if (err instanceof Error) {
        errMsg = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errMsg = err.message || JSON.stringify(err);
      } else if (typeof err === 'string') {
        errMsg = err;
      }
      alert(errMsg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Apakah Anda yakin ingin menghapus guru ini beserta seluruh data akunnya?')) {
      try {
        setLoading(true);
        await deleteUser(id);
        await refreshList();
      } catch (err) {
        console.error('Error deleting teacher:', err);
        alert('Gagal menghapus guru.');
        setLoading(false);
      }
    }
  }

  async function handleResetPassword(teacher: User) {
    if (confirm(`Reset password untuk ${teacher.name} ke password default: "${DEFAULT_PASSWORD}"?`)) {
      try {
        setLoading(true);
        await resetPassword(teacher.id, DEFAULT_PASSWORD);
        alert(`Password untuk ${teacher.name} berhasil di-reset ke "${DEFAULT_PASSWORD}".`);
        await refreshList();
      } catch (err: any) {
        console.error('Error resetting password:', err);
        alert(err.message || 'Gagal mereset password.');
        setLoading(false);
      }
    }
  }

  async function handleSetPrincipal() {
    if (!editingId) return;
    const teacherToPromote = teachers.find(t => t.id === editingId);
    if (!teacherToPromote) return;

    const confirmMsg = `Apakah Anda yakin ingin menjadikan ${teacherToPromote.name} sebagai Kepala Sekolah? Kepala sekolah yang menjabat saat ini (jika ada) akan diturunkan menjadi Guru biasa.`;
    
    if (confirm(confirmMsg)) {
      try {
        setSaving(true);
        await promoteToPrincipal(editingId);
        alert(`Berhasil menetapkan ${teacherToPromote.name} sebagai Kepala Sekolah!`);
        setShowModal(false);
        await refreshList();
      } catch (err: any) {
        console.error('Error promoting to principal:', err);
        alert(err.message || 'Gagal menetapkan kepala sekolah.');
      } finally {
        setSaving(false);
      }
    }
  }

  async function handleSetTeacherAdmin(demote = false) {
    if (!editingId) return;
    const teacherToPromote = teachers.find(t => t.id === editingId);
    if (!teacherToPromote) return;

    let confirmMsg = '';
    if (demote) {
      confirmMsg = `Apakah Anda yakin ingin melepas status Admin dari ${teacherToPromote.name}? Guru ini akan dikembalikan menjadi Guru biasa.`;
    } else {
      confirmMsg = `Apakah Anda yakin ingin menjadikan ${teacherToPromote.name} sebagai Admin dari pihak Guru? Guru ini akan memiliki hak akses penuh layaknya Admin. Guru Admin sebelumnya (jika ada) akan dikembalikan menjadi Guru biasa.`;
    }
    
    if (confirm(confirmMsg)) {
      try {
        setSaving(true);
        await setTeacherAdmin(demote ? null : editingId);
        alert(demote ? `Berhasil melepas status Admin!` : `Berhasil menetapkan ${teacherToPromote.name} sebagai Admin Guru!`);
        setShowModal(false);
        await refreshList();
      } catch (err: any) {
        console.error('Error setting teacher admin:', err);
        alert(err.message || 'Gagal mengubah status admin.');
      } finally {
        setSaving(false);
      }
    }
  }

  return (
    <>
      <div className="animate-fade-in-up">
      {/* Header action */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <p style={{ fontSize: '0.875rem', color: '#7f8c8d', margin: 0 }}>
          Kelola data guru pengajar PAUD Darul Khairat. Akun login guru dibuat otomatis saat guru didaftarkan.
        </p>
        <button
          onClick={openAddModal}
          disabled={loading}
          style={{
            background: 'linear-gradient(135deg, #27AE60, #2ECC71)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 18px',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: '0.85rem',
            boxShadow: '0 4px 12px rgba(39,174,96,0.2)',
            whiteSpace: 'nowrap',
            width: isMobile ? '100%' : 'auto',
          }}
        >
          ➕ Daftarkan Guru Baru
        </button>
      </div>

      {/* Current Principal Info Card */}
      {currentPrincipal ? (
        <div style={{
          background: '#FAF5FF',
          border: '1.5px solid #F3E5F5',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(142,68,173,0.05)',
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#8E44AD', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontFamily: 'Nunito, sans-serif' }}>
              🎓 Kepala Sekolah Saat Ini
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#2C3E50' }}>
              {currentPrincipal.name}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#7F8C8D' }}>
              {currentPrincipal.email}
            </div>
          </div>
          <span style={{ fontSize: '2rem' }}>🎓</span>
        </div>
      ) : (
        <div style={{
          background: '#FDEDEC',
          border: '1.5px solid #FADBD8',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
          color: '#C0392B',
          fontSize: '0.85rem',
          fontWeight: 700
        }}>
          ⚠️ Belum ada Kepala Sekolah yang ditetapkan. Silakan edit salah satu guru untuk menjadikannya Kepala Sekolah.
        </div>
      )}

      {/* Current Teacher Admin Info Card */}
      {currentTeacherAdmin && (
        <div style={{
          background: '#E8F8F5',
          border: '1.5px solid #D1F2EB',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(22,160,133,0.05)',
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#16A085', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontFamily: 'Nunito, sans-serif' }}>
              🔑 Admin Guru Saat Ini (Wewenang Penuh)
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#2C3E50' }}>
              {currentTeacherAdmin.name}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#7F8C8D' }}>
              {currentTeacherAdmin.email}
            </div>
          </div>
          <span style={{ fontSize: '2rem' }}>🔑</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#1E8449', fontFamily: 'Nunito, sans-serif' }}>
          <div style={{ fontSize: '2rem', animation: 'spin-slow 1s linear infinite', marginBottom: '12px' }}>⏳</div>
          <p style={{ fontWeight: 700 }}>Memuat data guru...</p>
        </div>
      ) : (
        /* Teachers Content */
        isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {teachers.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#AEB6BF', background: 'white', borderRadius: '20px' }}>
                Belum ada data guru terdaftar
              </div>
            ) : (
              teachers.map(teacher => (
                <div key={teacher.id} className="card" style={{ padding: '16px', border: '1.5px solid #E8ECF0', borderRadius: '16px', marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#2C3E50', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      👩‍🏫 {teacher.name}
                      {teacher.role === 'admin' && (
                        <span style={{ fontSize: '0.65rem', background: '#E8F8F5', color: '#16A085', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Admin Guru</span>
                      )}
                    </h4>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      background: teacher.role === 'admin' ? '#E8F8F5' : teacher.classId ? '#EBF5FB' : '#FDEDEC',
                      color: teacher.role === 'admin' ? '#16A085' : teacher.classId ? '#2980B9' : '#E74C3C',
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}>
                      {teacher.role === 'admin' ? 'Hak Akses Admin' : teacher.classId ? (classes.find(c => c.id === teacher.classId)?.name || teacher.classId.toUpperCase()) : 'Belum Ada Kelas'}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', color: '#7f8c8d', fontFamily: 'monospace' }}>
                    📧 {teacher.email}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F0F3F4', paddingTop: '12px' }}>
                    <button
                      onClick={() => handleResetPassword(teacher)}
                      style={{
                        flex: 1,
                        background: '#FEF9E7',
                        border: '1px solid #F9CA24',
                        borderRadius: '8px',
                        padding: '8px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: '#D35400',
                        fontWeight: 700,
                      }}
                    >
                      🔑 Reset PW
                    </button>
                    <button
                      onClick={() => openEditModal(teacher)}
                      style={{
                        flex: 1,
                        background: '#F8F9FA',
                        border: '1px solid #E8ECF0',
                        borderRadius: '8px',
                        padding: '8px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: '#5D6D7E',
                        fontWeight: 700,
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(teacher.id)}
                      style={{
                        background: '#FDEDEC',
                        border: '1px solid #FADBD8',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: '#E74C3C',
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            border: '1px solid #E8ECF0',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E8ECF0' }}>
                  <th style={{ padding: '16px 20px', fontWeight: 800, color: '#5D6D7E' }}>Nama Lengkap</th>
                  <th style={{ padding: '16px 20px', fontWeight: 800, color: '#5D6D7E' }}>📧 Email Login</th>
                  <th style={{ padding: '16px 20px', fontWeight: 800, color: '#5D6D7E' }}>🏫 Kelas</th>
                  <th style={{ padding: '16px 20px', fontWeight: 800, color: '#5D6D7E', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#AEB6BF', fontWeight: 700 }}>
                      Belum ada data guru terdaftar
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher, idx) => (
                    <tr key={teacher.id} style={{
                      borderBottom: idx === teachers.length - 1 ? 'none' : '1px solid #E8ECF0',
                      background: idx % 2 === 0 ? '#FAFAFA' : 'white',
                    }}>
                      <td style={{ padding: '16px 20px', fontWeight: 800, color: '#2C3E50' }}>
                        👩‍🏫 {teacher.name}
                        {teacher.role === 'admin' && (
                          <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: '#E8F8F5', color: '#16A085', padding: '2px 8px', borderRadius: '999px', fontWeight: 'bold' }}>Admin Guru</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', color: '#5D6D7E', fontFamily: 'monospace' }}>
                        {teacher.email}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: teacher.role === 'admin' ? '#E8F8F5' : teacher.classId ? '#EBF5FB' : '#FDEDEC',
                          color: teacher.role === 'admin' ? '#16A085' : teacher.classId ? '#2980B9' : '#E74C3C',
                          padding: '4px 10px',
                          borderRadius: '8px',
                        }}>
                          {teacher.role === 'admin' ? 'Hak Akses Admin' : teacher.classId ? (classes.find(c => c.id === teacher.classId)?.name || teacher.classId.toUpperCase()) : 'Belum Ditugaskan'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleResetPassword(teacher)}
                            title="Reset Password"
                            style={{
                              background: '#FEF9E7',
                              border: '1px solid #F9CA24',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              color: '#D35400',
                              fontWeight: 700,
                            }}
                          >
                            🔑 Reset
                          </button>
                          <button
                            onClick={() => openEditModal(teacher)}
                            style={{
                              background: '#F8F9FA',
                              border: '1px solid #E8ECF0',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(teacher.id)}
                            style={{
                              background: '#FDEDEC',
                              border: '1px solid #FADBD8',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              color: '#E74C3C',
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      )}
      </div>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '28px',
            width: '100%',
            maxWidth: '450px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          }}>
            <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 950, fontSize: '1.25rem', color: '#2C3E50', margin: '0 0 20px 0' }}>
              {editingId ? '✏️ Edit Data Guru' : '👩‍🏫 Daftarkan Guru Baru'}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label className="input-label">👩‍🏫 Nama Guru</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Contoh: Bu Fatimah Azzahra"
                  className="input"
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label className="input-label">📧 Email Login (opsional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Kosongkan untuk otomatis generate"
                  className="input"
                  disabled={saving || !!editingId}
                />
                {!editingId && (
                  <span style={{ fontSize: '0.7rem', color: '#7f8c8d', display: 'block', marginTop: '4px' }}>
                    Jika kosong, email otomatis di-generate: <code>nama.guru@dkhairat.sch.id</code>
                  </span>
                )}
              </div>

              {!editingId && (
                <div>
                  <label className="input-label">🔒 Password Default</label>
                  <input
                    type="text"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input"
                    required
                    disabled={saving}
                  />
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <label className="input-label">🏫 Tugas Kelas</label>
                <div
                  onClick={() => !saving && setSearchClassOpen(!searchClassOpen)}
                  className="input"
                  style={{
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: saving ? '#F8F9FA' : 'white',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: searchClassOpen ? '2px solid var(--primary)' : '2px solid #E8ECF0',
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#2C3E50',
                    boxShadow: searchClassOpen ? '0 0 0 4px rgba(39, 174, 96, 0.1)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                    {(() => {
                      const selectedClass = classes.find(c => c.id === classId);
                      return selectedClass 
                        ? `🏫 ${selectedClass.name}` 
                        : '-- Pilih Kelas (Bisa dikosongkan) --';
                    })()}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#AEB6BF', flexShrink: 0 }}>▼</span>
                </div>

                {searchClassOpen && (
                  <>
                    <div 
                      style={{ position: 'fixed', inset: 0, zIndex: 110 }} 
                      onClick={() => { setSearchClassOpen(false); setSearchClassQuery(''); }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: 0,
                      right: 0,
                      background: 'white',
                      borderRadius: '16px',
                      border: '1.5px solid #AED6F1',
                      boxShadow: '0 -10px 25px rgba(0,0,0,0.1)',
                      padding: '8px',
                      zIndex: 120,
                      maxHeight: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}>
                      <input
                        type="text"
                        placeholder="🔍 Cari nama kelas..."
                        value={searchClassQuery}
                        onChange={e => setSearchClassQuery(e.target.value)}
                        className="input"
                        style={{
                          padding: '8px 10px',
                          fontSize: '0.85rem',
                          borderRadius: '10px',
                          border: '1.5px solid #E8ECF0',
                          width: '100%',
                        }}
                        autoFocus
                      />
                      <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div
                          onClick={() => {
                            setClassId('');
                            setSearchClassOpen(false);
                            setSearchClassQuery('');
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontFamily: 'Nunito, sans-serif',
                            fontWeight: 700,
                            color: '#E74C3C',
                            background: classId === '' ? '#FDEDEC' : 'transparent',
                            transition: 'background 0.2s',
                          }}
                          className="student-option"
                        >
                          -- Pilih Kelas (Bisa dikosongkan) --
                        </div>
                        {classes
                          .filter(c => c.name.toLowerCase().includes(searchClassQuery.toLowerCase()))
                          .map(c => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setClassId(c.id);
                                setSearchClassOpen(false);
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
                                background: c.id === classId ? 'var(--bg-cream)' : 'transparent',
                                transition: 'background 0.2s',
                              }}
                              className="student-option"
                            >
                              <span>🏫 {c.name}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {editingId && (
                <div style={{
                  marginTop: '16px',
                  borderTop: '1px solid #F0F2F5',
                  paddingTop: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <button
                    type="button"
                    onClick={handleSetPrincipal}
                    disabled={saving}
                    style={{
                      background: 'linear-gradient(135deg, #7D3C98, #8E44AD)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(142,68,173,0.2)'
                    }}
                  >
                    🎓 Jadikan Kepala Sekolah
                  </button>

                  {(() => {
                    const selectedTeacher = teachers.find(t => t.id === editingId);
                    if (!selectedTeacher) return null;
                    const isCurrentlyAdmin = selectedTeacher.role === 'admin';
                    
                    return isCurrentlyAdmin ? (
                      <button
                        type="button"
                        onClick={() => handleSetTeacherAdmin(true)}
                        disabled={saving}
                        style={{
                          background: 'linear-gradient(135deg, #E67E22, #D35400)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 12px rgba(230,126,34,0.2)'
                        }}
                      >
                        ⚠️ Kembalikan Menjadi Guru Biasa
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetTeacherAdmin(false)}
                        disabled={saving}
                        style={{
                          background: 'linear-gradient(135deg, #2980B9, #3498DB)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 12px rgba(41,128,185,0.2)'
                        }}
                      >
                        🔑 Jadikan Admin Guru
                      </button>
                    );
                  })()}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline"
                  disabled={saving}
                  style={{ flex: 1, padding: '12px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ flex: 1, padding: '12px' }}
                >
                  {saving ? 'Proses...' : (editingId ? 'Simpan Perubahan 💾' : 'Daftarkan & Buat Akun 🚀')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredsModal && creds && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '28px',
            padding: '32px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            textAlign: 'center',
          }} className="animate-fade-in-up">
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🎉</div>
            <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 950, fontSize: '1.4rem', color: '#1E8449', margin: '0 0 10px 0' }}>
              Akun Guru Berhasil Dibuat!
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#7f8c8d', lineHeight: 1.5, marginBottom: '24px' }}>
              Berikut adalah kredensial login untuk <strong>{creds.name}</strong>.
              Silakan salin dan berikan kepada guru bersangkutan.
            </p>

            <div style={{
              background: '#F4F6F9',
              borderRadius: '16px',
              padding: '16px 20px',
              textAlign: 'left',
              marginBottom: '24px',
              border: '1px dashed #BDC3C7',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
            }}>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ color: '#7F8C8D', display: 'block', fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'Nunito, sans-serif' }}>📧 EMAIL LOGIN</span>
                <strong style={{ color: '#2C3E50' }}>{creds.email}</strong>
              </div>
              <div>
                <span style={{ color: '#7F8C8D', display: 'block', fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'Nunito, sans-serif' }}>🔒 PASSWORD LOGIN</span>
                <strong style={{ color: '#E74C3C' }}>{creds.password}</strong>
              </div>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(`Akun Buku Penghubung Darul Khairat\nEmail: ${creds.email}\nPassword: ${creds.password}`);
                alert('Kredensial berhasil disalin ke clipboard!');
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: '#1E8449',
                color: 'white',
                border: 'none',
                fontWeight: 800,
                cursor: 'pointer',
                marginBottom: '10px',
                transition: 'background 0.2s',
              }}
            >
              📋 Salin Kredensial Ke Clipboard
            </button>
            <button
              onClick={() => setShowCredsModal(false)}
              className="btn btn-outline"
              style={{ width: '100%', padding: '12px' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
