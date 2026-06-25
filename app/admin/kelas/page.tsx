// app/admin/kelas/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  getClasses,
  getUsers,
  getStudents,
  createClass,
  updateClass,
  deleteClass
} from '@/lib/db';
import type { ClassInfo, User, Student } from '@/lib/types';

export default function AdminKelasPage() {
  const [mounted, setMounted] = useState(false);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [teacherId, setTeacherId] = useState('');

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
      const [cl, us, st] = await Promise.all([
        getClasses(),
        getUsers(),
        getStudents()
      ]);
      setClasses(cl);
      setTeachers(us.filter(u => u.role === 'teacher'));
      setAllStudents(st);
    } catch (err) {
      console.error('Error refreshing classes:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  function openAddModal() {
    setEditingId(null);
    setName('');
    setTeacherId('');
    setShowModal(true);
  }

  function openEditModal(cls: ClassInfo) {
    setEditingId(cls.id);
    setName(cls.name);
    setTeacherId(cls.teacherId);
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      if (editingId) {
        await updateClass(editingId, { name, teacherId });
      } else {
        await createClass({ name, teacherId });
      }
      await refreshList();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data kelas.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Apakah Anda yakin ingin menghapus kelas ini? Siswa di kelas ini harus dipindahkan secara manual.')) {
      try {
        setLoading(true);
        await deleteClass(id);
        await refreshList();
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus kelas.');
        setLoading(false);
      }
    }
  }

  function getTeacherName(tId: string): string {
    if (!tId) return 'Belum Ada Guru Wali';
    const teacher = teachers.find(t => t.id === tId);
    return teacher ? `👩‍🏫 ${teacher.name}` : 'Guru Tidak Ditemukan';
  }

  function getStudentCount(clsId: string): number {
    return allStudents.filter(s => s.classId === clsId).length;
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
          Kelola kelas di PAUD Darul Khairat. Tentukan Guru Wali Kelas untuk masing-masing kelas.
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
          ➕ Tambah Kelas Baru
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#1E8449', fontFamily: 'Nunito, sans-serif' }}>
          <div style={{ fontSize: '2rem', animation: 'spin-slow 1s linear infinite', marginBottom: '12px' }}>⏳</div>
          <p style={{ fontWeight: 700 }}>Memuat data kelas...</p>
        </div>
      ) : (
        /* Classes Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {classes.length === 0 ? (
            <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: '#AEB6BF', background: 'white', borderRadius: '20px' }}>
              Belum ada kelas terdaftar
            </div>
          ) : (
            classes.map(cls => {
              const studentCount = getStudentCount(cls.id);
              return (
                <div key={cls.id} className="card" style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  marginBottom: 0,
                  border: '1.5px solid #E8ECF0',
                  borderRadius: '20px',
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1.15rem', color: '#2C3E50', margin: 0 }}>
                        🏫 {cls.name}
                      </h3>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: '#27AE60',
                        background: '#E8F8EF',
                        padding: '4px 8px',
                        borderRadius: '20px',
                      }}>
                        {studentCount} Siswa
                      </span>
                    </div>

                    <div style={{
                      background: '#F8F9FA',
                      borderRadius: '12px',
                      padding: '10px 12px',
                      marginBottom: '16px',
                      border: '1px solid #E8ECF0',
                    }}>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: '#7F8C8D', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                        Guru Wali Kelas
                      </span>
                      <strong style={{ fontSize: '0.8rem', color: cls.teacherId ? '#2C3E50' : '#E74C3C' }}>
                        {getTeacherName(cls.teacherId)}
                      </strong>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F0F3F4', paddingTop: '12px' }}>
                    <button
                      onClick={() => openEditModal(cls)}
                      style={{
                        flex: 1,
                        background: '#F8F9FA',
                        border: '1px solid #E8ECF0',
                        borderRadius: '10px',
                        padding: '8px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#5D6D7E',
                        transition: 'all 0.2s',
                      }}
                    >
                      ✏️ Edit Wali
                    </button>
                    <button
                      onClick={() => handleDelete(cls.id)}
                      style={{
                        background: '#FDEDEC',
                        border: '1px solid #FADBD8',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: '#E74C3C',
                        transition: 'all 0.2s',
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
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
              {editingId ? '✏️ Edit Data Kelas' : '🏫 Tambah Kelas Baru'}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label className="input-label">🏫 Nama Kelas</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Contoh: Kelas A (TK A), Kelas B (TK B)"
                  className="input"
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label className="input-label">👩‍🏫 Guru Wali Kelas</label>
                <select
                  value={teacherId}
                  onChange={e => setTeacherId(e.target.value)}
                  className="input"
                  disabled={saving}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">-- Belum Ada Wali Kelas --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
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
                  {saving ? 'Menyimpan...' : 'Simpan Kelas 💾'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
