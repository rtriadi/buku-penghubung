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
  const [schoolHasTime, setSchoolHasTime] = useState(false);
  const [schoolIsFulldayOnly, setSchoolIsFulldayOnly] = useState(false);
  const [schoolOrder, setSchoolOrder] = useState(1);
  const [searchCategoryOpen, setSearchCategoryOpen] = useState(false);
  const [searchCategoryQuery, setSearchCategoryQuery] = useState('');

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
    setSchoolHasTime(false);
    setSchoolIsFulldayOnly(false);
    setSchoolOrder(schoolActs.length + 1);
    setSearchCategoryOpen(false);
    setSearchCategoryQuery('');
    setShowSchoolModal(true);
  }

  function openEditSchoolModal(act: SchoolActivity) {
    setEditingSchoolId(act.id);
    setSchoolLabel(act.label);
    setSchoolEmoji(act.emoji || '📝');
    setSchoolCategory(act.category);
    setSchoolHasTime(act.hasTime || false);
    setSchoolIsFulldayOnly(act.isFulldayOnly || false);
    setSchoolOrder(act.order || 1);
    setSearchCategoryOpen(false);
    setSearchCategoryQuery('');
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
          hasTime: schoolHasTime,
          isFulldayOnly: schoolIsFulldayOnly,
          order: schoolOrder,
        });
      } else {
        await createSchoolActivity({
          label: schoolLabel,
          emoji: schoolEmoji,
          category: schoolCategory,
          hasTime: schoolHasTime,
          isFulldayOnly: schoolIsFulldayOnly,
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
                        {(() => {
                          const catId = act.category || 'belajar';
                          const isIbadah = catId === 'ibadah';
                          const isMakan = catId === 'makan';
                          const isIstirahat = catId === 'istirahat';
                          const isKehadiran = catId === 'kehadiran';
                          const isBelajar = catId === 'belajar';

                          let bg = '#F2F4F4';
                          let fg = '#5D6D7E';
                          let label = catId;

                          if (isIbadah) {
                            bg = '#E8F8EF';
                            fg = '#1E8449';
                            label = 'Ibadah & Karakter';
                          } else if (isMakan) {
                            bg = '#FEF9E7';
                            fg = '#D35400';
                            label = 'Kegiatan Makan';
                          } else if (isIstirahat) {
                            bg = '#EBF5FB';
                            fg = '#2980B9';
                            label = 'Istirahat / Tidur';
                          } else if (isKehadiran) {
                            bg = '#EAECEE';
                            fg = '#2C3E50';
                            label = 'Kehadiran';
                          } else if (isBelajar) {
                            bg = '#EBF5FB';
                            fg = '#2980B9';
                            label = 'Belajar & Bermain';
                          } else {
                            bg = '#F2F4F4';
                            fg = '#5D6D7E';
                            label = catId.charAt(0).toUpperCase() + catId.slice(1).replace(/_/g, ' ');
                          }

                          return (
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                              <span className="badge" style={{
                                fontSize: '0.65rem',
                                background: bg,
                                color: fg,
                                fontWeight: 800,
                              }}>
                                {label.toUpperCase()}
                              </span>
                              {act.hasTime && (
                                <span className="badge" style={{
                                  fontSize: '0.65rem',
                                  background: '#EBF5FB',
                                  color: '#2980B9',
                                  fontWeight: 800,
                                }}>
                                  🕒 DENGAN JAM
                                </span>
                              )}
                              {act.isFulldayOnly && (
                                <span className="badge" style={{
                                  fontSize: '0.65rem',
                                  background: '#FEF9E7',
                                  color: '#D35400',
                                  fontWeight: 800,
                                }}>
                                  🌅 KHUSUS FULLDAY
                                </span>
                              )}
                            </div>
                          );
                        })()}
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

              <div style={{ position: 'relative', zIndex: searchCategoryOpen ? 120 : 1 }}>
                <label className="input-label">📂 Kategori Aktivitas</label>
                <div
                  onClick={() => !saving && setSearchCategoryOpen(!searchCategoryOpen)}
                  className="input"
                  style={{
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: saving ? '#F8F9FA' : 'white',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: searchCategoryOpen ? '2px solid var(--primary)' : '2px solid #E8ECF0',
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#2C3E50',
                    boxShadow: searchCategoryOpen ? '0 0 0 4px rgba(39, 174, 96, 0.1)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                    {(() => {
                      const DEFAULT_CATEGORIES = [
                        { id: 'kehadiran', label: 'Kehadiran (Absensi)' },
                        { id: 'ibadah', label: 'Ibadah & Karakter' },
                        { id: 'makan', label: 'Kegiatan Makan' },
                        { id: 'belajar', label: 'Belajar & Bermain' },
                        { id: 'istirahat', label: 'Istirahat / Tidur' },
                      ];
                      const uniqueDbCategories = Array.from(new Set(schoolActs.map(act => act.category)))
                        .filter(cat => cat && !DEFAULT_CATEGORIES.some(c => c.id === cat));
                      const allCats = [
                        ...DEFAULT_CATEGORIES,
                        ...uniqueDbCategories.map(cat => ({
                          id: cat,
                          label: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ')
                        }))
                      ];
                      const selected = allCats.find(c => c.id === schoolCategory);
                      return selected ? `📂 ${selected.label}` : `📂 ${schoolCategory}`;
                    })()}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#AEB6BF', flexShrink: 0 }}>▼</span>
                </div>

                {searchCategoryOpen && (
                  <>
                    <div 
                      style={{ position: 'fixed', inset: 0, zIndex: 110 }} 
                      onClick={() => { setSearchCategoryOpen(false); setSearchCategoryQuery(''); }}
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
                      maxHeight: '220px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}>
                      <input
                        type="text"
                        placeholder="🔍 Cari atau tambah kategori..."
                        value={searchCategoryQuery}
                        onChange={e => setSearchCategoryQuery(e.target.value)}
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
                        {(() => {
                          const DEFAULT_CATEGORIES = [
                            { id: 'kehadiran', label: 'Kehadiran (Absensi)' },
                            { id: 'ibadah', label: 'Ibadah & Karakter' },
                            { id: 'makan', label: 'Kegiatan Makan' },
                            { id: 'belajar', label: 'Belajar & Bermain' },
                            { id: 'istirahat', label: 'Istirahat / Tidur' },
                          ];
                          const uniqueDbCategories = Array.from(new Set(schoolActs.map(act => act.category)))
                            .filter(cat => cat && !DEFAULT_CATEGORIES.some(c => c.id === cat));
                          const allCats = [
                            ...DEFAULT_CATEGORIES,
                            ...uniqueDbCategories.map(cat => ({
                              id: cat,
                              label: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ')
                            }))
                          ];

                          const query = searchCategoryQuery.trim().toLowerCase();
                          const filtered = allCats.filter(c => 
                            c.label.toLowerCase().includes(query) || 
                            c.id.toLowerCase().includes(query)
                          );

                          const hasExactMatch = allCats.some(c => 
                            c.label.toLowerCase() === query || 
                            c.id.toLowerCase() === query
                          );

                          return (
                            <>
                              {filtered.map(c => (
                                <div
                                  key={c.id}
                                  onClick={() => {
                                    setSchoolCategory(c.id);
                                    setSearchCategoryOpen(false);
                                    setSearchCategoryQuery('');
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
                                    background: c.id === schoolCategory ? 'var(--bg-cream)' : 'transparent',
                                    transition: 'background 0.2s',
                                  }}
                                  className="student-option"
                                >
                                  <span>📂 {c.label}</span>
                                </div>
                              ))}
                              
                              {query && !hasExactMatch && (
                                <div
                                  onClick={() => {
                                    const newId = query.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
                                    const finalId = newId || `cat_${Date.now()}`;
                                    setSchoolCategory(finalId);
                                    setSearchCategoryOpen(false);
                                    setSearchCategoryQuery('');
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
                                    fontWeight: 800,
                                    color: '#1E8449',
                                    background: '#E8F8EF',
                                    transition: 'background 0.2s',
                                  }}
                                  className="student-option"
                                >
                                  <span>➕ Tambah Kategori &quot;{searchCategoryQuery}&quot;</span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8F9FA', padding: '12px', borderRadius: '12px', border: '1px solid #E8ECF0', marginTop: '-10px', marginBottom: '6px' }}>
                <input
                  type="checkbox"
                  id="schoolHasTime"
                  checked={schoolHasTime}
                  onChange={e => setSchoolHasTime(e.target.checked)}
                  disabled={saving}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="schoolHasTime" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.85rem', color: '#2C3E50', cursor: 'pointer' }}>
                  Butuh Input Jam Kegiatan (contoh: Jam Hadir/Pulang)
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FEF9E7', padding: '12px', borderRadius: '12px', border: '1px solid #F9E79F', marginTop: '-10px', marginBottom: '6px' }}>
                <input
                  type="checkbox"
                  id="schoolIsFulldayOnly"
                  checked={schoolIsFulldayOnly}
                  onChange={e => setSchoolIsFulldayOnly(e.target.checked)}
                  disabled={saving}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="schoolIsFulldayOnly" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.85rem', color: '#D35400', cursor: 'pointer' }}>
                  🌅 Hanya untuk Siswa Program Fullday (Sembunyikan untuk Halfday)
                </label>
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
