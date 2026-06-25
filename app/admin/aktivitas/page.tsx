// app/admin/aktivitas/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  getSchoolActivities,
  getHomeActivities,
  createSchoolActivity,
  updateSchoolActivity,
  deleteSchoolActivity,
  createHomeActivity,
  updateHomeActivity,
  deleteHomeActivity
} from '@/lib/db';
import type { SchoolActivity, HomeActivity, ActivityCategory } from '@/lib/types';

export default function AdminAktivitasPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'school' | 'home'>('school');
  const [schoolActs, setSchoolActs] = useState<SchoolActivity[]>([]);
  const [homeActs, setHomeActs] = useState<HomeActivity[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [showHomeModal, setShowHomeModal] = useState(false);
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [editingHomeId, setEditingHomeId] = useState<string | null>(null);

  // School Form Fields
  const [schoolLabel, setSchoolLabel] = useState('');
  const [schoolEmoji, setSchoolEmoji] = useState('📝');
  const [schoolCategory, setSchoolCategory] = useState<ActivityCategory>('belajar');
  const [schoolOrder, setSchoolOrder] = useState(1);

  // Home Form Fields
  const [homeLabel, setHomeLabel] = useState('');
  const [homeEmoji, setHomeEmoji] = useState('📖');
  const [homeHasTime, setHomeHasTime] = useState(false);
  const [homeOrder, setHomeOrder] = useState(1);

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
      const [sa, ha] = await Promise.all([
        getSchoolActivities(),
        getHomeActivities()
      ]);
      setSchoolActs(sa);
      setHomeActs(ha);
    } catch (err) {
      console.error('Error refreshing activities:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  // --- School Actions ---
  function openAddSchoolModal() {
    setEditingSchoolId(null);
    setSchoolLabel('');
    setSchoolEmoji('📝');
    setSchoolCategory('belajar');
    setSchoolOrder(schoolActs.length + 1);
    setShowSchoolModal(true);
  }

  function openEditSchoolModal(act: SchoolActivity) {
    setEditingSchoolId(act.id);
    setSchoolLabel(act.label);
    setSchoolEmoji(act.emoji || '📝');
    setSchoolCategory(act.category);
    setSchoolOrder(act.order || 1);
    setShowSchoolModal(true);
  }

  async function handleSaveSchool(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolLabel.trim()) return;

    try {
      setSaving(true);
      if (editingSchoolId) {
        await updateSchoolActivity(editingSchoolId, {
          label: schoolLabel,
          emoji: schoolEmoji,
          category: schoolCategory,
          order: schoolOrder,
        });
      } else {
        await createSchoolActivity({
          label: schoolLabel,
          emoji: schoolEmoji,
          category: schoolCategory,
          order: schoolOrder,
          isActive: true,
        });
      }
      await refreshList();
      setShowSchoolModal(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan aktivitas sekolah.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleSchoolActive(act: SchoolActivity) {
    try {
      setLoading(true);
      await updateSchoolActivity(act.id, { isActive: !act.isActive });
      await refreshList();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  async function handleDeleteSchool(id: string) {
    if (confirm('Hapus aktivitas sekolah ini? Data pengisian hari-hari sebelumnya yang menggunakan aktivitas ini mungkin akan terpengaruh.')) {
      try {
        setLoading(true);
        await deleteSchoolActivity(id);
        await refreshList();
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus aktivitas.');
        setLoading(false);
      }
    }
  }

  // --- Home Actions ---
  function openAddHomeModal() {
    setEditingHomeId(null);
    setHomeLabel('');
    setHomeEmoji('📖');
    setHomeHasTime(false);
    setHomeOrder(homeActs.length + 1);
    setShowHomeModal(true);
  }

  function openEditHomeModal(act: HomeActivity) {
    setEditingHomeId(act.id);
    setHomeLabel(act.label);
    setHomeEmoji(act.emoji || '📖');
    setHomeHasTime(act.hasTime || false);
    setHomeOrder(act.order || 1);
    setShowHomeModal(true);
  }

  async function handleSaveHome(e: React.FormEvent) {
    e.preventDefault();
    if (!homeLabel.trim()) return;

    try {
      setSaving(true);
      if (editingHomeId) {
        await updateHomeActivity(editingHomeId, {
          label: homeLabel,
          emoji: homeEmoji,
          hasTime: homeHasTime,
          order: homeOrder,
        });
      } else {
        await createHomeActivity({
          label: homeLabel,
          emoji: homeEmoji,
          hasTime: homeHasTime,
          order: homeOrder,
          isActive: true,
        });
      }
      await refreshList();
      setShowHomeModal(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan aktivitas rumah.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleHomeActive(act: HomeActivity) {
    try {
      setLoading(true);
      await updateHomeActivity(act.id, { isActive: !act.isActive });
      await refreshList();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  async function handleDeleteHome(id: string) {
    if (confirm('Hapus aktivitas rumah ini? Data pengisian wali murid sebelumnya mungkin terpengaruh.')) {
      try {
        setLoading(true);
        await deleteHomeActivity(id);
        await refreshList();
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus aktivitas.');
        setLoading(false);
      }
    }
  }

  return (
    <>
      <div className="animate-fade-in-up">
      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: 'white',
        padding: '6px',
        borderRadius: '16px',
        border: '1px solid #E8ECF0',
        marginBottom: '24px',
        gap: '6px',
      }}>
        <button
          onClick={() => setActiveTab('school')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.2s',
            background: activeTab === 'school' ? 'linear-gradient(135deg, #1E8449, #27AE60)' : 'transparent',
            color: activeTab === 'school' ? 'white' : '#5D6D7E',
            boxShadow: activeTab === 'school' ? '0 4px 12px rgba(30,132,73,0.15)' : 'none',
          }}
        >
          🏫 Aktivitas di Sekolah (Guru)
        </button>
        <button
          onClick={() => setActiveTab('home')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.2s',
            background: activeTab === 'home' ? 'linear-gradient(135deg, #1E8449, #27AE60)' : 'transparent',
            color: activeTab === 'home' ? 'white' : '#5D6D7E',
            boxShadow: activeTab === 'home' ? '0 4px 12px rgba(30,132,73,0.15)' : 'none',
          }}
        >
          🏠 Aktivitas di Rumah (Wali)
        </button>
      </div>

      {/* Header action info */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <p style={{ fontSize: '0.875rem', color: '#7f8c8d', margin: 0 }}>
          {activeTab === 'school'
            ? 'Atur daftar checklist harian yang wajib diisi oleh Guru untuk setiap siswa di kelas.'
            : 'Atur daftar checklist kegiatan mandiri anak di rumah yang diisi oleh Orang Tua / Wali.'}
        </p>
        <button
          onClick={activeTab === 'school' ? openAddSchoolModal : openAddHomeModal}
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
          ➕ Tambah {activeTab === 'school' ? 'Kegiatan Sekolah' : 'Kegiatan Rumah'}
        </button>
      </div>

      {/* Loading indicator */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#1E8449', fontFamily: 'Nunito, sans-serif' }}>
          <div style={{ fontSize: '2rem', animation: 'spin-slow 1s linear infinite', marginBottom: '12px' }}>⏳</div>
          <p style={{ fontWeight: 700 }}>Memuat data aktivitas...</p>
        </div>
      ) : (
        /* Dynamic Lists */
        activeTab === 'school' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {schoolActs.length === 0 ? (
              <div style={{ gridColumn: '1/-1', padding: '30px', textAlign: 'center', color: '#AEB6BF', background: 'white', borderRadius: '20px' }}>
                Belum ada aktivitas sekolah yang terdaftar
              </div>
            ) : (
              schoolActs.map(act => (
                <div key={act.id} className="card" style={{
                  padding: '18px',
                  border: '1.5px solid #E8ECF0',
                  borderRadius: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  marginBottom: 0,
                  opacity: act.isActive ? 1 : 0.6,
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '2.2rem' }}>{act.emoji}</span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#2C3E50' }}>{act.label}</h4>
                        <span className="badge badge-green" style={{
                          fontSize: '0.65rem',
                          background: act.category === 'ibadah' ? '#E8F8EF' : act.category === 'makan' ? '#FEF9E7' : act.category === 'istirahat' ? '#EBF5FB' : '#F2F4F4',
                          color: act.category === 'ibadah' ? '#1E8449' : act.category === 'makan' ? '#D35400' : act.category === 'istirahat' ? '#2980B9' : '#5D6D7E',
                        }}>
                          {act.category.toUpperCase()}
                        </span>
                      </div>
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        background: '#F0F3F5',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        color: '#7F8C8D',
                      }}>
                        Urutan #{act.order}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F0F3F4', paddingTop: '12px', marginTop: '10px' }}>
                    <button
                      onClick={() => toggleSchoolActive(act)}
                      style={{
                        flex: 1.5,
                        background: act.isActive ? '#E8F8EF' : '#F2F4F4',
                        border: act.isActive ? '1px solid #A9DFBF' : '1px solid #D5D8DC',
                        borderRadius: '8px',
                        padding: '8px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: act.isActive ? '#1E8449' : '#7F8C8D',
                        fontWeight: 800,
                      }}
                    >
                      {act.isActive ? '🟢 Aktif' : '⚫ Nonaktif'}
                    </button>
                    <button
                      onClick={() => openEditSchoolModal(act)}
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
                      onClick={() => handleDeleteSchool(act.id)}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {homeActs.length === 0 ? (
              <div style={{ gridColumn: '1/-1', padding: '30px', textAlign: 'center', color: '#AEB6BF', background: 'white', borderRadius: '20px' }}>
                Belum ada aktivitas rumah yang terdaftar
              </div>
            ) : (
              homeActs.map(act => (
                <div key={act.id} className="card" style={{
                  padding: '18px',
                  border: '1.5px solid #E8ECF0',
                  borderRadius: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  marginBottom: 0,
                  opacity: act.isActive ? 1 : 0.6,
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '2.2rem' }}>{act.emoji}</span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#2C3E50' }}>{act.label}</h4>
                        <span className="badge" style={{
                          fontSize: '0.65rem',
                          background: act.hasTime ? '#EBF5FB' : '#EAECEE',
                          color: act.hasTime ? '#2980B9' : '#5D6D7E',
                        }}>
                          {act.hasTime ? '🕒 DENGAN JAM' : '✅ CHECKBOX'}
                        </span>
                      </div>
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        background: '#F0F3F5',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        color: '#7F8C8D',
                      }}>
                        Urutan #{act.order}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F0F3F4', paddingTop: '12px', marginTop: '10px' }}>
                    <button
                      onClick={() => toggleHomeActive(act)}
                      style={{
                        flex: 1.5,
                        background: act.isActive ? '#E8F8EF' : '#F2F4F4',
                        border: act.isActive ? '1px solid #A9DFBF' : '1px solid #D5D8DC',
                        borderRadius: '8px',
                        padding: '8px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: act.isActive ? '#1E8449' : '#7F8C8D',
                        fontWeight: 800,
                      }}
                    >
                      {act.isActive ? '🟢 Aktif' : '⚫ Nonaktif'}
                    </button>
                    <button
                      onClick={() => openEditHomeModal(act)}
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
                      onClick={() => handleDeleteHome(act.id)}
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
        )
      )}
      </div>

      {/* Modal Sekolah */}
      {showSchoolModal && (
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
              {editingSchoolId ? '✏️ Edit Kegiatan Sekolah' : '🏫 Tambah Kegiatan Sekolah'}
            </h3>

            <form onSubmit={handleSaveSchool} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label className="input-label">📝 Nama Kegiatan</label>
                <input
                  type="text"
                  value={schoolLabel}
                  onChange={e => setSchoolLabel(e.target.value)}
                  placeholder="Contoh: Sholat Dhuha, Snack Pagi"
                  className="input"
                  required
                  disabled={saving}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">🦁 Emoji</label>
                  <input
                    type="text"
                    value={schoolEmoji}
                    onChange={e => setSchoolEmoji(e.target.value)}
                    placeholder="🕌"
                    className="input"
                    required
                    disabled={saving}
                  />
                </div>
                <div style={{ flex: 1.5 }}>
                  <label className="input-label">Urutan Tampilan</label>
                  <input
                    type="number"
                    value={schoolOrder}
                    onChange={e => setSchoolOrder(parseInt(e.target.value) || 1)}
                    className="input"
                    required
                    min={1}
                    disabled={saving}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">📂 Kategori Aktivitas</label>
                <select
                  value={schoolCategory}
                  onChange={e => setSchoolCategory(e.target.value as ActivityCategory)}
                  className="input"
                  disabled={saving}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="kehadiran">Kehadiran (Absensi)</option>
                  <option value="ibadah">Ibadah & Karakter</option>
                  <option value="makan">Kegiatan Makan</option>
                  <option value="belajar">Belajar & Bermain</option>
                  <option value="istirahat">Istirahat / Tidur</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowSchoolModal(false)}
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
                  {saving ? 'Menyimpan...' : 'Simpan Kegiatan 💾'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rumah */}
      {showHomeModal && (
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
              {editingHomeId ? '✏️ Edit Kegiatan Rumah' : '🏠 Tambah Kegiatan Rumah'}
            </h3>

            <form onSubmit={handleSaveHome} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label className="input-label">📝 Nama Kegiatan</label>
                <input
                  type="text"
                  value={homeLabel}
                  onChange={e => setHomeLabel(e.target.value)}
                  placeholder="Contoh: Mengaji Iqro, Mandi Sore"
                  className="input"
                  required
                  disabled={saving}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">🦁 Emoji</label>
                  <input
                    type="text"
                    value={homeEmoji}
                    onChange={e => setHomeEmoji(e.target.value)}
                    placeholder="📖"
                    className="input"
                    required
                    disabled={saving}
                  />
                </div>
                <div style={{ flex: 1.5 }}>
                  <label className="input-label">Urutan Tampilan</label>
                  <input
                    type="number"
                    value={homeOrder}
                    onChange={e => setHomeOrder(parseInt(e.target.value) || 1)}
                    className="input"
                    required
                    min={1}
                    disabled={saving}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8F9FA', padding: '12px', borderRadius: '12px', border: '1px solid #E8ECF0' }}>
                <input
                  type="checkbox"
                  id="homeHasTime"
                  checked={homeHasTime}
                  onChange={e => setHomeHasTime(e.target.checked)}
                  disabled={saving}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="homeHasTime" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.85rem', color: '#2C3E50', cursor: 'pointer' }}>
                  Butuh Input Jam Kegiatan (contoh: Jam Tidur)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowHomeModal(false)}
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
                  {saving ? 'Menyimpan...' : 'Simpan Kegiatan 💾'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
