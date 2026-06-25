// app/admin/wali/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  getUsers,
  getStudents,
  createUser,
  updateUser,
  deleteUser,
  updateStudent,
  resetPassword,
  DEFAULT_PASSWORD
} from '@/lib/db';
import type { User, Student, AccountCredentials } from '@/lib/types';

export default function AdminWaliPage() {
  const [mounted, setMounted] = useState(false);
  const [parents, setParents] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Generated credentials
  const [creds, setCreds] = useState<AccountCredentials | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [studentId, setStudentId] = useState('');

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
      const [us, st] = await Promise.all([
        getUsers(),
        getStudents()
      ]);
      setParents(us.filter(u => u.role === 'parent'));
      setStudents(st);
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
    setStudentId('');
    setShowModal(true);
  }

  function openEditModal(parent: User) {
    setEditingId(parent.id);
    setName(parent.name);
    setEmail(parent.email);
    setPassword(parent.password || DEFAULT_PASSWORD);
    setStudentId(parent.studentId || '');
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      setSaving(true);
      if (editingId) {
        // Update parent profile
        await updateUser(editingId, {
          name,
          email,
          studentId: studentId || null as any,
        });

        // Update student parent link
        if (studentId) {
          await updateStudent(studentId, { parentId: editingId });
        }

        await refreshList();
        setShowModal(false);
      } else {
        // Create new parent
        const { user: parentUser, credentials } = await createUser({
          name,
          email,
          role: 'parent',
          password,
          studentId: studentId || undefined,
        });

        // Update student parent link
        if (studentId) {
          await updateStudent(studentId, { parentId: parentUser.id });
        }

        setCreds(credentials);
        await refreshList();
        setShowModal(false);
        setShowCredsModal(true);
      }
    } catch (err: any) {
      console.error('Error saving parent:', err);
      alert(err.message || 'Gagal mendaftarkan wali baru.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Apakah Anda yakin ingin menghapus wali murid ini beserta seluruh data akunnya?')) {
      try {
        setLoading(true);
        await deleteUser(id);
        
        // Clear parentId from any linked students
        const linkedStudents = students.filter(s => s.parentId === id);
        await Promise.all(
          linkedStudents.map(s => updateStudent(s.id, { parentId: '' }))
        );

        await refreshList();
      } catch (err) {
        console.error('Error deleting parent:', err);
        alert('Gagal menghapus wali.');
        setLoading(false);
      }
    }
  }

  async function handleResetPassword(parent: User) {
    if (confirm(`Reset password untuk ${parent.name} ke password default: "${DEFAULT_PASSWORD}"?`)) {
      try {
        setLoading(true);
        await resetPassword(parent.id, DEFAULT_PASSWORD);
        alert(`Password untuk ${parent.name} berhasil di-reset ke "${DEFAULT_PASSWORD}".`);
        await refreshList();
      } catch (err: any) {
        console.error('Error resetting password:', err);
        alert(err.message || 'Gagal mereset password.');
        setLoading(false);
      }
    }
  }

  function getLinkedStudentName(parent: User): string {
    if (!parent.studentId) return 'Belum Dihubungkan';
    const student = students.find(s => s.id === parent.studentId);
    return student ? `${student.avatarEmoji} ${student.nickname}` : 'Siswa Tidak Ditemukan';
  }

  return (
    <>
      <div className="animate-fade-in-up">
      {/* Header Info */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <p style={{ fontSize: '0.875rem', color: '#7f8c8d', margin: 0 }}>
          Kelola data Orang Tua / Wali Murid PAUD Darul Khairat. Akun login dibuat otomatis dengan password default.
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
          ➕ Hubungkan Wali Baru
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#1E8449', fontFamily: 'Nunito, sans-serif' }}>
          <div style={{ fontSize: '2rem', animation: 'spin-slow 1s linear infinite', marginBottom: '12px' }}>⏳</div>
          <p style={{ fontWeight: 700 }}>Memuat data wali...</p>
        </div>
      ) : (
        /* Wali Content */
        isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {parents.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#AEB6BF', background: 'white', borderRadius: '20px' }}>
                Belum ada data wali murid terdaftar
              </div>
            ) : (
              parents.map(parent => (
                <div key={parent.id} className="card" style={{ padding: '16px', border: '1.5px solid #E8ECF0', borderRadius: '16px', marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#2C3E50' }}>👨‍👩 {parent.name}</h4>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      background: parent.studentId ? '#EBF5FB' : '#FDEDEC',
                      color: parent.studentId ? '#2980B9' : '#E74C3C',
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}>
                      Anak: {getLinkedStudentName(parent)}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', color: '#7f8c8d', fontFamily: 'monospace' }}>
                    📧 {parent.email}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F0F3F4', paddingTop: '12px' }}>
                    <button
                      onClick={() => handleResetPassword(parent)}
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
                      onClick={() => openEditModal(parent)}
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
                      onClick={() => handleDelete(parent.id)}
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
                  <th style={{ padding: '16px 20px', fontWeight: 800, color: '#5D6D7E' }}>Nama Orang Tua / Wali</th>
                  <th style={{ padding: '16px 20px', fontWeight: 800, color: '#5D6D7E' }}>📧 Email Login</th>
                  <th style={{ padding: '16px 20px', fontWeight: 800, color: '#5D6D7E' }}>👧 Anak / Siswa</th>
                  <th style={{ padding: '16px 20px', fontWeight: 800, color: '#5D6D7E', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {parents.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#AEB6BF', fontWeight: 700 }}>
                      Belum ada data wali murid terdaftar
                    </td>
                  </tr>
                ) : (
                  parents.map((parent, idx) => (
                    <tr key={parent.id} style={{
                      borderBottom: idx === parents.length - 1 ? 'none' : '1px solid #E8ECF0',
                      background: idx % 2 === 0 ? '#FAFAFA' : 'white',
                    }}>
                      <td style={{ padding: '16px 20px', fontWeight: 800, color: '#2C3E50' }}>
                        👨‍👩 {parent.name}
                      </td>
                      <td style={{ padding: '16px 20px', color: '#5D6D7E', fontFamily: 'monospace' }}>
                        {parent.email}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: parent.studentId ? '#EBF5FB' : '#FDEDEC',
                          color: parent.studentId ? '#2980B9' : '#E74C3C',
                          padding: '4px 10px',
                          borderRadius: '8px',
                        }}>
                          {getLinkedStudentName(parent)}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleResetPassword(parent)}
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
                            onClick={() => openEditModal(parent)}
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
                            onClick={() => handleDelete(parent.id)}
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
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 950, fontSize: '1.25rem', color: '#2C3E50', margin: '0 0 20px 0' }}>
              {editingId ? '✏️ Edit Data Wali' : '👨‍👩 Daftarkan Wali Baru'}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label className="input-label">👨‍👩 Nama Lengkap Wali</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Contoh: Bapak Ahmad"
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

              <div>
                <label className="input-label">👧 Hubungkan ke Siswa</label>
                <select
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  className="input"
                  disabled={saving}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">-- Pilih Siswa (Bisa dikosongkan) --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.avatarEmoji} {s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
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
              Akun Wali Berhasil Dibuat!
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#7f8c8d', lineHeight: 1.5, marginBottom: '24px' }}>
              Berikut adalah kredensial login untuk <strong>{creds.name}</strong>.
              Silakan salin dan berikan kepada orang tua bersangkutan.
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
