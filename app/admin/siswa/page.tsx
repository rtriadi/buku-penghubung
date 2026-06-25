// app/admin/siswa/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  getStudents,
  getUsers,
  getClasses,
  createStudent,
  updateStudent,
  deleteStudent,
  updateUser
} from '@/lib/db';
import { STUDENT_AVATAR_EMOJIS } from '@/lib/constants';
import type { Student, User, ClassInfo } from '@/lib/types';

export default function AdminSiswaPage() {
  const [mounted, setMounted] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [classId, setClassId] = useState('kelas-a');
  const [parentId, setParentId] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('🦁');
  const [birthdate, setBirthdate] = useState('2020-01-01');

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
      const [st, us, cl] = await Promise.all([
        getStudents(),
        getUsers(),
        getClasses()
      ]);
      setStudents(st);
      setParents(us.filter(u => u.role === 'parent'));
      setClasses(cl);
      if (cl.length > 0 && !classId) {
        setClassId(cl[0].id);
      }
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
    setNickname('');
    setClassId(classes[0]?.id || 'kelas-a');
    setParentId('');
    setAvatarEmoji('🦁');
    setBirthdate('2020-01-01');
    setShowModal(true);
  }

  function openEditModal(student: Student) {
    setEditingId(student.id);
    setName(student.name);
    setNickname(student.nickname);
    setClassId(student.classId);
    setParentId(student.parentId || '');
    setAvatarEmoji(student.avatarEmoji);
    setBirthdate(student.birthdate);
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !nickname.trim()) return;

    const studentData = {
      name,
      nickname,
      classId,
      parentId,
      avatarEmoji,
      birthdate,
    };

    try {
      setSaving(true);
      if (editingId) {
        await updateStudent(editingId, studentData);
        
        // Update reverse link on parent
        if (parentId) {
          await updateUser(parentId, { studentId: editingId });
        }
      } else {
        const newStudent = await createStudent(studentData);
        
        // Update reverse link on parent
        if (parentId) {
          await updateUser(parentId, { studentId: newStudent.id });
        }
      }

      await refreshList();
      setShowModal(false);
    } catch (err) {
      console.error('Error saving student:', err);
      alert('Gagal menyimpan data siswa. Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Apakah Anda yakin ingin menghapus siswa ini? Data laporan harian siswa juga tidak akan dapat diakses.')) {
      try {
        setLoading(true);
        await deleteStudent(id);
        
        // Clear student link on any parent
        const linkedParents = parents.filter(u => u.studentId === id);
        await Promise.all(
          linkedParents.map(p => updateUser(p.id, { studentId: null as any }))
        );

        await refreshList();
      } catch (err) {
        console.error('Error deleting student:', err);
        alert('Gagal menghapus data siswa.');
        setLoading(false);
      }
    }
  }

  function getParentName(pId?: string): string {
    if (!pId) return 'Belum Dihubungkan';
    const parent = parents.find(p => p.id === pId);
    return parent ? `👨‍👩 ${parent.name}` : 'Tidak Ditemukan';
  }

  function getClassName(cId: string): string {
    const cls = classes.find(c => c.id === cId);
    return cls ? cls.name : cId.toUpperCase();
  }

  return (
    <>
      <div className="animate-fade-in-up">
      {/* Action Header */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <p style={{ fontSize: '0.875rem', color: '#7f8c8d', margin: 0 }}>
          Kelola data siswa PAUD Darul Khairat. Pasangkan siswa dengan kelas dan orang tua / wali.
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
          ➕ Tambah Siswa Baru
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#1E8449', fontFamily: 'Nunito, sans-serif' }}>
          <div style={{ fontSize: '2rem', animation: 'spin-slow 1s linear infinite', marginBottom: '12px' }}>⏳</div>
          <p style={{ fontWeight: 700 }}>Memuat data siswa...</p>
        </div>
      ) : (
        /* Students Content */
        isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {students.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#AEB6BF', background: 'white', borderRadius: '20px' }}>
                Belum ada data siswa terdaftar
              </div>
            ) : (
              students.map(student => (
                <div key={student.id} className="card" style={{ padding: '16px', border: '1.5px solid #E8ECF0', borderRadius: '16px', marginBottom: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '2.5rem' }}>{student.avatarEmoji}</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#2C3E50' }}>{student.name}</h4>
                      <span style={{ fontSize: '0.75rem', color: '#7f8c8d', background: '#F0F3F4', padding: '2px 6px', borderRadius: '4px' }}>
                        Panggilan: {student.nickname}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{
                    background: '#F8F9FA',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    fontSize: '0.8rem',
                    color: '#5D6D7E',
                    marginBottom: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}>
                    <div>🏫 <strong>Kelas:</strong> {getClassName(student.classId)}</div>
                    <div>📅 <strong>Lahir:</strong> {student.birthdate}</div>
                    <div>👨‍👩 <strong>Wali:</strong> {getParentName(student.parentId)}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F0F3F4', paddingTop: '12px' }}>
                    <button
                      onClick={() => openEditModal(student)}
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
                      onClick={() => handleDelete(student.id)}
                      style={{
                        background: '#FDEDEC',
                        border: '1px solid #FADBD8',
                        borderRadius: '8px',
                        padding: '8px 16px',
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
                  <th style={{ padding: '16px 20px', fontWeight: 800, color: '#5D6D7E' }}>Nama Lengkap (Panggilan)</th>
                  <th style={{ padding: '16px 20px', fontWeight: 800, color: '#5D6D7E' }}>🏫 Kelas</th>
                  <th style={{ padding: '16px 20px', fontWeight: 800, color: '#5D6D7E' }}>👨‍👩 Orang Tua / Wali</th>
                  <th style={{ padding: '16px 20px', fontWeight: 800, color: '#5D6D7E' }}>📅 Lahir</th>
                  <th style={{ padding: '16px 20px', fontWeight: 800, color: '#5D6D7E', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#AEB6BF', fontWeight: 700 }}>
                      Belum ada data siswa terdaftar
                    </td>
                  </tr>
                ) : (
                  students.map((student, idx) => (
                    <tr key={student.id} style={{
                      borderBottom: idx === students.length - 1 ? 'none' : '1px solid #E8ECF0',
                      background: idx % 2 === 0 ? '#FAFAFA' : 'white',
                    }}>
                      <td style={{ padding: '16px 20px', fontWeight: 800, color: '#2C3E50', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.8rem' }}>{student.avatarEmoji}</span>
                        <div>
                          <div>{student.name}</div>
                          <span style={{ fontSize: '0.75rem', color: '#7f8c8d', background: '#F0F3F4', padding: '2px 6px', borderRadius: '4px' }}>
                            Panggilan: {student.nickname}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#34495E' }}>
                        {getClassName(student.classId)}
                      </td>
                      <td style={{ padding: '16px 20px', color: '#5D6D7E' }}>
                        {getParentName(student.parentId)}
                      </td>
                      <td style={{ padding: '16px 20px', color: '#7F8C8D', fontSize: '0.85rem' }}>
                        {student.birthdate}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openEditModal(student)}
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
                            onClick={() => handleDelete(student.id)}
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
            maxWidth: '500px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 950, fontSize: '1.25rem', color: '#2C3E50', margin: '0 0 20px 0' }}>
              {editingId ? '✏️ Edit Data Siswa' : '👦 Tambah Siswa Baru'}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label className="input-label">👧 Nama Lengkap Anak</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Contoh: Muhammad Zaid Al-Faruq"
                  className="input"
                  required
                  disabled={saving}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">💬 Panggilan</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder="Zaid"
                    className="input"
                    required
                    disabled={saving}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">📅 Tanggal Lahir</label>
                  <input
                    type="date"
                    value={birthdate}
                    onChange={e => setBirthdate(e.target.value)}
                    className="input"
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Emoji Picker Row */}
              <div>
                <label className="input-label">🦁 Pilih Avatar Emoji ({avatarEmoji})</label>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  padding: '10px',
                  background: '#F8F9FA',
                  borderRadius: '12px',
                  border: '1px solid #E8ECF0',
                  justifyContent: 'center',
                }}>
                  {STUDENT_AVATAR_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatarEmoji(emoji)}
                      disabled={saving}
                      style={{
                        fontSize: '1.8rem',
                        background: avatarEmoji === emoji ? '#A9DFBF' : 'transparent',
                        border: avatarEmoji === emoji ? '2px solid #27AE60' : '2px solid transparent',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.1s',
                        transform: avatarEmoji === emoji ? 'scale(1.1)' : 'none',
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">🏫 Kelas</label>
                  <select
                    value={classId}
                    onChange={e => setClassId(e.target.value)}
                    className="input"
                    disabled={saving}
                    style={{ cursor: 'pointer' }}
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label className="input-label">👨‍👩 Orang Tua / Wali</label>
                  <select
                    value={parentId}
                    onChange={e => setParentId(e.target.value)}
                    className="input"
                    disabled={saving}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">-- Hubungkan Nanti --</option>
                    {parents.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
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
                  {saving ? 'Menyimpan...' : 'Simpan Siswa 💾'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
