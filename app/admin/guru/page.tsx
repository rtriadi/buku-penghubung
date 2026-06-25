// app/admin/guru/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  generateEmailFromName,
  DEFAULT_PASSWORD
} from '@/lib/db';
import type { User, AccountCredentials } from '@/lib/types';

export default function AdminGuruPage() {
  const [mounted, setMounted] = useState(false);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Generated credentials state
  const [creds, setCreds] = useState<AccountCredentials | null>(null);

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
      const us = await getUsers();
      setTeachers(us.filter(u => u.role === 'teacher'));
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
    setShowModal(true);
  }

  function openEditModal(teacher: User) {
    setEditingId(teacher.id);
    setName(teacher.name);
    setEmail(teacher.email);
    setPassword(teacher.password || DEFAULT_PASSWORD);
    setClassId(teacher.classId || '');
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
      alert(err.message || 'Gagal mendaftarkan guru baru.');
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

  return (
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
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#2C3E50' }}>👩‍🏫 {teacher.name}</h4>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      background: teacher.classId ? '#EBF5FB' : '#FDEDEC',
                      color: teacher.classId ? '#2980B9' : '#E74C3C',
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}>
                      {teacher.classId ? teacher.classId.toUpperCase() : 'Belum Ada Kelas'}
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
                      </td>
                      <td style={{ padding: '16px 20px', color: '#5D6D7E', fontFamily: 'monospace' }}>
                        {teacher.email}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: teacher.classId ? '#EBF5FB' : '#FDEDEC',
                          color: teacher.classId ? '#2980B9' : '#E74C3C',
                          padding: '4px 10px',
                          borderRadius: '8px',
                        }}>
                          {teacher.classId ? teacher.classId.toUpperCase() : 'Belum Ditugaskan'}
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

              <div>
                <label className="input-label">🏫 Tugas Kelas</label>
                <select
                  value={classId}
                  onChange={e => setClassId(e.target.value)}
                  className="input"
                  disabled={saving}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">-- Pilih Kelas (Bisa dikosongkan) --</option>
                  <option value="kelas-a">Kelas A (TK A)</option>
                  <option value="kelas-b">Kelas B (TK B)</option>
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
    </div>
  );
}
