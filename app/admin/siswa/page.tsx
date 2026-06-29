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
  updateUser,
  bulkUpdateStudents
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

  // Bulk edit states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkClassId, setBulkClassId] = useState('');
  const [bulkStatus, setBulkStatus] = useState<'' | 'active' | 'alumni'>('');
  const [bulkSaving, setBulkSaving] = useState(false);

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
  const [status, setStatus] = useState<'active' | 'alumni'>('active');
  const [program, setProgram] = useState<'fullday' | 'halfday'>('fullday');
  const [searchParentOpen, setSearchParentOpen] = useState(false);
  const [searchParentQuery, setSearchParentQuery] = useState('');
  const [searchClassOpen, setSearchClassOpen] = useState(false);
  const [searchClassQuery, setSearchClassQuery] = useState('');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [bulkClassDropdownOpen, setBulkClassDropdownOpen] = useState(false);
  const [bulkStatusDropdownOpen, setBulkStatusDropdownOpen] = useState(false);

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
    setSelectedIds([]);
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
    setStatus('active');
    setProgram('fullday');
    setSearchParentOpen(false);
    setSearchParentQuery('');
    setSearchClassOpen(false);
    setSearchClassQuery('');
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
    setStatus(student.status || 'active');
    setProgram(student.program || 'fullday');
    setSearchParentOpen(false);
    setSearchParentQuery('');
    setSearchClassOpen(false);
    setSearchClassQuery('');
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
      status,
      program,
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

  function toggleSelectAll() {
    if (selectedIds.length === students.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map(s => s.id));
    }
  }

  function toggleSelectStudent(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function handleDelete(id: string) {
    if (confirm('Apakah Anda yakin ingin menghapus siswa ini? Data laporan harian siswa juga tidak akan dapat diakses.')) {
      try {
        setLoading(true);
        await deleteStudent(id);
        
        // Clear student link on any parent, keeping other children if they exist
        const linkedParents = parents.filter(u => u.studentId === id);
        await Promise.all(
          linkedParents.map(async (p) => {
            const otherStudents = students.filter(s => s.parentId === p.id && s.id !== id);
            const nextStudentId = otherStudents.length > 0 ? otherStudents[0].id : null;
            await updateUser(p.id, { studentId: nextStudentId as any });
          })
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
        <div>
          <p style={{ fontSize: '0.875rem', color: '#7f8c8d', margin: 0 }}>
            Kelola data siswa PAUD Darul Khairat. Pasangkan siswa dengan kelas dan orang tua / wali.
          </p>
          {isMobile && students.length > 0 && (
            <button
              onClick={toggleSelectAll}
              style={{
                background: 'none',
                border: 'none',
                color: '#27AE60',
                fontWeight: 800,
                fontSize: '0.85rem',
                padding: '6px 0',
                cursor: 'pointer',
                textDecoration: 'underline',
                marginTop: '6px'
              }}
            >
              {selectedIds.length === students.length ? '☑️ Batal Pilih Semua' : '⏹️ Pilih Semua Siswa'}
            </button>
          )}
        </div>
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
                <div 
                  key={student.id} 
                  className="card" 
                  style={{ 
                    padding: '16px', 
                    border: selectedIds.includes(student.id) ? '1.5px solid #27AE60' : '1.5px solid #E8ECF0', 
                    borderRadius: '16px', 
                    marginBottom: 0,
                    position: 'relative',
                    background: selectedIds.includes(student.id) ? '#E8F8F5' : 'white',
                  }}
                >
                  <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(student.id)}
                      onChange={() => toggleSelectStudent(student.id)}
                      style={{ cursor: 'pointer', width: '20px', height: '20px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', paddingRight: '24px' }}>
                    <span style={{ fontSize: '2.5rem' }}>{student.avatarEmoji}</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#2C3E50', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {student.name}
                        {student.status === 'alumni' ? (
                          <span style={{ fontSize: '0.65rem', background: '#FDEDEC', color: '#C0392B', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Alumni</span>
                        ) : (
                          <span style={{ fontSize: '0.65rem', background: '#D5F5E3', color: '#1E8449', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Aktif</span>
                        )}
                      </h4>
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
                    <div>
                      🏫 <strong>Kelas:</strong> {getClassName(student.classId)}{' '}
                      <span style={{
                        fontSize: '0.7rem',
                        background: student.program === 'halfday' ? '#EBF5FB' : '#FEF9E7',
                        color: student.program === 'halfday' ? '#2980B9' : '#D35400',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        fontWeight: 'bold',
                      }}>
                        {student.program === 'halfday' ? '🌤️ Halfday' : '🌅 Fullday'}
                      </span>
                    </div>
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
                  <th style={{ padding: '16px 20px', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={students.length > 0 && selectedIds.length === students.length}
                      onChange={toggleSelectAll}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </th>
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
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#AEB6BF', fontWeight: 700 }}>
                      Belum ada data siswa terdaftar
                    </td>
                  </tr>
                ) : (
                  students.map((student, idx) => (
                    <tr key={student.id} style={{
                      borderBottom: idx === students.length - 1 ? 'none' : '1px solid #E8ECF0',
                      background: selectedIds.includes(student.id) ? '#E8F8F5' : idx % 2 === 0 ? '#FAFAFA' : 'white',
                    }}>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(student.id)}
                          onChange={() => toggleSelectStudent(student.id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 800, color: '#2C3E50', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.8rem' }}>{student.avatarEmoji}</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {student.name}
                            {student.status === 'alumni' ? (
                              <span style={{ fontSize: '0.75rem', background: '#FDEDEC', color: '#C0392B', padding: '2px 8px', borderRadius: '999px', fontWeight: 'bold' }}>Alumni</span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', background: '#D5F5E3', color: '#1E8449', padding: '2px 8px', borderRadius: '999px', fontWeight: 'bold' }}>Aktif</span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#7f8c8d', background: '#F0F3F4', padding: '2px 6px', borderRadius: '4px' }}>
                            Panggilan: {student.nickname}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#34495E' }}>
                        <div>{getClassName(student.classId)}</div>
                        <span style={{
                          fontSize: '0.75rem',
                          background: student.program === 'halfday' ? '#EBF5FB' : '#FEF9E7',
                          color: student.program === 'halfday' ? '#2980B9' : '#D35400',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontWeight: 'bold',
                          marginTop: '4px',
                          display: 'inline-block'
                        }}>
                          {student.program === 'halfday' ? '🌤️ Halfday' : '🌅 Fullday'}
                        </span>
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
              {editingId ? '✏️ Edit Data Siswa' : '👶 Tambah Siswa Baru'}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label className="input-label">👶 Nama Lengkap Anak</label>
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

              <div style={{ position: 'relative', zIndex: statusDropdownOpen ? 120 : 1 }}>
                <label className="input-label">📌 Status Siswa</label>
                <div
                  onClick={() => !saving && setStatusDropdownOpen(!statusDropdownOpen)}
                  className="input"
                  style={{
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: saving ? '#F8F9FA' : 'white',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: statusDropdownOpen ? '2px solid var(--primary)' : '2px solid #E8ECF0',
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#2C3E50',
                    boxShadow: statusDropdownOpen ? '0 0 0 4px rgba(39, 174, 96, 0.1)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>{status === 'active' ? '🟢 Aktif (Belajar)' : '🔴 Alumni (Lulus)'}</span>
                  <span style={{ fontSize: '0.8rem', color: '#AEB6BF' }}>▼</span>
                </div>

                {statusDropdownOpen && (
                  <>
                    <div 
                      style={{ position: 'fixed', inset: 0, zIndex: 110 }} 
                      onClick={() => setStatusDropdownOpen(false)}
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
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}>
                      <div
                        onClick={() => {
                          setStatus('active');
                          setStatusDropdownOpen(false);
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontFamily: 'Nunito, sans-serif',
                          fontWeight: status === 'active' ? 800 : 600,
                          color: status === 'active' ? 'var(--primary)' : '#2C3E50',
                          background: status === 'active' ? 'var(--bg-cream)' : 'transparent',
                          transition: 'background 0.2s',
                        }}
                      >
                        🟢 Aktif (Belajar)
                      </div>
                      <div
                        onClick={() => {
                          setStatus('alumni');
                          setStatusDropdownOpen(false);
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontFamily: 'Nunito, sans-serif',
                          fontWeight: status === 'alumni' ? 800 : 600,
                          color: status === 'alumni' ? 'var(--primary)' : '#2C3E50',
                          background: status === 'alumni' ? 'var(--bg-cream)' : 'transparent',
                          transition: 'background 0.2s',
                        }}
                      >
                        🔴 Alumni (Lulus)
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="input-label">☀️ Program Sekolah</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setProgram('fullday')}
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '14px',
                      border: program === 'fullday' ? '2px solid var(--primary)' : '2px solid #E8ECF0',
                      background: program === 'fullday' ? 'var(--bg-cream)' : 'white',
                      fontWeight: program === 'fullday' ? 800 : 600,
                      color: program === 'fullday' ? 'var(--primary)' : '#2C3E50',
                      cursor: 'pointer',
                      fontFamily: 'Nunito, sans-serif',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    🌅 Fullday
                  </button>
                  <button
                    type="button"
                    onClick={() => setProgram('halfday')}
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '14px',
                      border: program === 'halfday' ? '2px solid var(--primary)' : '2px solid #E8ECF0',
                      background: program === 'halfday' ? 'var(--bg-cream)' : 'white',
                      fontWeight: program === 'halfday' ? 800 : 600,
                      color: program === 'halfday' ? 'var(--primary)' : '#2C3E50',
                      cursor: 'pointer',
                      fontFamily: 'Nunito, sans-serif',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    🌤️ Halfday
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ flex: 1, position: 'relative', zIndex: searchClassOpen ? 120 : 1 }}>
                  <label className="input-label">🏫 Kelas</label>
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
                          : '-- Pilih Kelas --';
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

                <div style={{ flex: 1, position: 'relative', zIndex: searchParentOpen ? 120 : 1 }}>
                  <label className="input-label">👨‍👩 Orang Tua / Wali</label>
                  <div
                    onClick={() => !saving && setSearchParentOpen(!searchParentOpen)}
                    className="input"
                    style={{
                      cursor: saving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: saving ? '#F8F9FA' : 'white',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      border: searchParentOpen ? '2px solid var(--primary)' : '2px solid #E8ECF0',
                      fontFamily: 'Nunito, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: '#2C3E50',
                      boxShadow: searchParentOpen ? '0 0 0 4px rgba(39, 174, 96, 0.1)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                      {(() => {
                        const selectedParent = parents.find(p => p.id === parentId);
                        return selectedParent 
                          ? `👨‍👩 ${selectedParent.name}` 
                          : '-- Hubungkan Nanti --';
                      })()}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#AEB6BF', flexShrink: 0 }}>▼</span>
                  </div>

                  {searchParentOpen && (
                    <>
                      <div 
                        style={{ position: 'fixed', inset: 0, zIndex: 110 }} 
                        onClick={() => { setSearchParentOpen(false); setSearchParentQuery(''); }}
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
                          placeholder="🔍 Cari nama wali..."
                          value={searchParentQuery}
                          onChange={e => setSearchParentQuery(e.target.value)}
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
                              setParentId('');
                              setSearchParentOpen(false);
                              setSearchParentQuery('');
                            }}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontFamily: 'Nunito, sans-serif',
                              fontWeight: 700,
                              color: '#E74C3C',
                              background: parentId === '' ? '#FDEDEC' : 'transparent',
                              transition: 'background 0.2s',
                            }}
                            className="student-option"
                          >
                            -- Kosongkan / Hubungkan Nanti --
                          </div>
                          {parents
                            .filter(p => p.name.toLowerCase().includes(searchParentQuery.toLowerCase()))
                            .map(p => (
                              <div
                                key={p.id}
                                onClick={() => {
                                  setParentId(p.id);
                                  setSearchParentOpen(false);
                                  setSearchParentQuery('');
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
                                  background: p.id === parentId ? 'var(--bg-cream)' : 'transparent',
                                  transition: 'background 0.2s',
                                }}
                                className="student-option"
                              >
                                <span>👨‍👩 {p.name}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}
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

      {/* Floating Bulk Edit Bar */}
      {selectedIds.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '16px',
          right: '16px',
          margin: '0 auto',
          background: 'rgba(30, 41, 59, 0.96)',
          backdropFilter: 'blur(12px)',
          padding: '14px 20px',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 90,
          color: 'white',
          maxWidth: '480px',
          justifyContent: 'space-between',
          border: '1.5px solid rgba(255,255,255,0.08)'
        }} className="animate-fade-in-up">
          <div style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}>
            Dipilih: <span style={{ color: '#2ECC71', fontSize: '1rem', fontWeight: 900 }}>{selectedIds.length}</span> siswa
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setBulkClassId('');
                setBulkStatus('');
                setShowBulkModal(true);
              }}
              style={{
                background: '#27AE60',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(39,174,96,0.3)'
              }}
            >
              ⚙️ Edit Masal
            </button>
            <button
              onClick={() => setSelectedIds([])}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#ECF0F1',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Modal Edit Masal (Bulk Edit Modal) */}
      {showBulkModal && (
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
            <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 950, fontSize: '1.25rem', color: '#2C3E50', margin: '0 0 8px 0' }}>
              ⚙️ Edit Masal ({selectedIds.length} Siswa)
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#7f8c8d', marginBottom: '20px' }}>
              Perbarui kelas dan status untuk seluruh siswa yang dipilih sekaligus.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ position: 'relative', zIndex: bulkClassDropdownOpen ? 120 : 1 }}>
                <label className="input-label">🏫 Pilih Kelas Baru</label>
                <div
                  onClick={() => !bulkSaving && setBulkClassDropdownOpen(!bulkClassDropdownOpen)}
                  className="input"
                  style={{
                    cursor: bulkSaving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: bulkSaving ? '#F8F9FA' : 'white',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: bulkClassDropdownOpen ? '2px solid var(--primary)' : '2px solid #E8ECF0',
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#2C3E50',
                    boxShadow: bulkClassDropdownOpen ? '0 0 0 4px rgba(39, 174, 96, 0.1)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>
                    {bulkClassId 
                      ? `🏫 Kelas: ${classes.find(c => c.id === bulkClassId)?.name}` 
                      : '-- Tetap (Tidak Berubah) --'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#AEB6BF' }}>▼</span>
                </div>

                {bulkClassDropdownOpen && (
                  <>
                    <div 
                      style={{ position: 'fixed', inset: 0, zIndex: 110 }} 
                      onClick={() => setBulkClassDropdownOpen(false)}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      borderRadius: '16px',
                      border: '1.5px solid #AED6F1',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      padding: '8px',
                      zIndex: 120,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}>
                      <div
                        onClick={() => {
                          setBulkClassId('');
                          setBulkClassDropdownOpen(false);
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontFamily: 'Nunito, sans-serif',
                          fontWeight: bulkClassId === '' ? 800 : 600,
                          color: bulkClassId === '' ? 'var(--primary)' : '#2C3E50',
                          background: bulkClassId === '' ? 'var(--bg-cream)' : 'transparent',
                          transition: 'background 0.2s',
                        }}
                      >
                        -- Tetap (Tidak Berubah) --
                      </div>
                      {classes.map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setBulkClassId(c.id);
                            setBulkClassDropdownOpen(false);
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontFamily: 'Nunito, sans-serif',
                            fontWeight: bulkClassId === c.id ? 800 : 600,
                            color: bulkClassId === c.id ? 'var(--primary)' : '#2C3E50',
                            background: bulkClassId === c.id ? 'var(--bg-cream)' : 'transparent',
                            transition: 'background 0.2s',
                          }}
                        >
                          🏫 Kelas: {c.name}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div style={{ position: 'relative', zIndex: bulkStatusDropdownOpen ? 120 : 1 }}>
                <label className="input-label">📌 Pilih Status Baru</label>
                <div
                  onClick={() => !bulkSaving && setBulkStatusDropdownOpen(!bulkStatusDropdownOpen)}
                  className="input"
                  style={{
                    cursor: bulkSaving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: bulkSaving ? '#F8F9FA' : 'white',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: bulkStatusDropdownOpen ? '2px solid var(--primary)' : '2px solid #E8ECF0',
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#2C3E50',
                    boxShadow: bulkStatusDropdownOpen ? '0 0 0 4px rgba(39, 174, 96, 0.1)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>
                    {bulkStatus === '' && '-- Tetap (Tidak Berubah) --'}
                    {bulkStatus === 'active' && '🟢 Aktif (Belajar)'}
                    {bulkStatus === 'alumni' && '🔴 Alumni (Lulus)'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#AEB6BF' }}>▼</span>
                </div>

                {bulkStatusDropdownOpen && (
                  <>
                    <div 
                      style={{ position: 'fixed', inset: 0, zIndex: 110 }} 
                      onClick={() => setBulkStatusDropdownOpen(false)}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      borderRadius: '16px',
                      border: '1.5px solid #AED6F1',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      padding: '8px',
                      zIndex: 120,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}>
                      <div
                        onClick={() => {
                          setBulkStatus('');
                          setBulkStatusDropdownOpen(false);
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontFamily: 'Nunito, sans-serif',
                          fontWeight: bulkStatus === '' ? 800 : 600,
                          color: bulkStatus === '' ? 'var(--primary)' : '#2C3E50',
                          background: bulkStatus === '' ? 'var(--bg-cream)' : 'transparent',
                          transition: 'background 0.2s',
                        }}
                      >
                        -- Tetap (Tidak Berubah) --
                      </div>
                      <div
                        onClick={() => {
                          setBulkStatus('active');
                          setBulkStatusDropdownOpen(false);
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontFamily: 'Nunito, sans-serif',
                          fontWeight: bulkStatus === 'active' ? 800 : 600,
                          color: bulkStatus === 'active' ? 'var(--primary)' : '#2C3E50',
                          background: bulkStatus === 'active' ? 'var(--bg-cream)' : 'transparent',
                          transition: 'background 0.2s',
                        }}
                      >
                        🟢 Aktif (Belajar)
                      </div>
                      <div
                        onClick={() => {
                          setBulkStatus('alumni');
                          setBulkStatusDropdownOpen(false);
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontFamily: 'Nunito, sans-serif',
                          fontWeight: bulkStatus === 'alumni' ? 800 : 600,
                          color: bulkStatus === 'alumni' ? 'var(--primary)' : '#2C3E50',
                          background: bulkStatus === 'alumni' ? 'var(--bg-cream)' : 'transparent',
                          transition: 'background 0.2s',
                        }}
                      >
                        🔴 Alumni (Lulus)
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="btn btn-outline"
                  disabled={bulkSaving}
                  style={{ flex: 1, padding: '12px' }}
                >
                  Batal
                </button>
                <button
                  onClick={async () => {
                    if (!bulkClassId && !bulkStatus) {
                      alert('Silakan pilih kelas baru atau status baru yang ingin diubah.');
                      return;
                    }
                    try {
                      setBulkSaving(true);
                      await bulkUpdateStudents(selectedIds, {
                        classId: bulkClassId || undefined,
                        status: bulkStatus || undefined
                      });
                      setSelectedIds([]);
                      setShowBulkModal(false);
                      await refreshList();
                      alert('Berhasil mengedit data siswa secara masal!');
                    } catch (err) {
                      console.error('Error bulk updating students:', err);
                      alert('Gagal memperbarui data siswa secara masal.');
                    } finally {
                      setBulkSaving(false);
                    }
                  }}
                  className="btn btn-primary"
                  disabled={bulkSaving || (!bulkClassId && !bulkStatus)}
                  style={{ 
                    flex: 1, 
                    padding: '12px',
                    background: 'linear-gradient(135deg, #27AE60, #2ECC71)',
                    border: 'none',
                    color: 'white',
                  }}
                >
                  {bulkSaving ? 'Memproses...' : 'Simpan Masal 💾'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
