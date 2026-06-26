// app/admin/pengumuman/_components/AnnouncementForm.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Announcement } from '@/lib/types';

interface Props {
  initialData?: Partial<Announcement>;
  onSubmit: (data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<void>;
  submitLabel?: string;
}

export default function AnnouncementForm({ initialData, onSubmit, submitLabel = 'Simpan Pengumuman' }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [startDate, setStartDate] = useState(initialData?.startDate || '');
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [isActive, setIsActive] = useState(initialData?.isActive !== false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editorReady, setEditorReady] = useState(false);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);

  // Load Quill dynamically (SSR-safe)
  useEffect(() => {
    let isMounted = true;
    async function loadQuill() {
      try {
        const { default: Quill } = await import('quill');

        // Load Quill Snow CSS from CDN (prevents SSR issues with CSS imports)
        if (!document.head.querySelector('link[href*="quill.snow"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdn.quilljs.com/1.3.7/quill.snow.css';
          document.head.appendChild(link);
        }

        if (!editorContainerRef.current || quillRef.current || !isMounted) return;

        const q = new Quill(editorContainerRef.current, {
          theme: 'snow',
          placeholder: 'Tulis isi pengumuman di sini... (bisa bold, italic, list, dll)',
          modules: {
            toolbar: [
              [{ header: [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['blockquote'],
              ['clean'],
            ],
          },
        });

        if (initialData?.content) {
          q.root.innerHTML = initialData.content;
        }

        quillRef.current = q;
        if (isMounted) setEditorReady(true);
      } catch (err) {
        console.error('Failed to load Quill:', err);
      }
    }

    loadQuill();
    return () => { isMounted = false; };
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) return setError('Judul tidak boleh kosong');
    if (!startDate) return setError('Tanggal mulai wajib diisi');
    if (!endDate) return setError('Tanggal selesai wajib diisi');
    if (new Date(endDate) < new Date(startDate)) return setError('Tanggal selesai tidak boleh sebelum tanggal mulai');

    const rawContent = quillRef.current?.root?.innerHTML || '';
    const textContent = rawContent.replace(/<[^>]+>/g, '').trim();
    if (!textContent || textContent === '<br>') return setError('Isi pengumuman tidak boleh kosong');

    setLoading(true);
    try {
      await onSubmit({ title: title.trim(), content: rawContent, startDate, endDate, isActive });
      router.push('/admin/pengumuman');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1.5px solid #E8ECF0',
    fontSize: '0.9rem',
    color: '#2C3E50',
    fontFamily: 'Nunito, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    background: 'white',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.82rem',
    fontWeight: 800,
    color: '#5D6D7E',
    marginBottom: '7px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: 'Nunito, sans-serif' }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
      }}>

        {/* Judul */}
        <div>
          <label style={labelStyle}>📌 Judul Pengumuman *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Masukkan judul pengumuman..."
            maxLength={100}
            required
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = '#27AE60'; }}
            onBlur={e => { e.target.style.borderColor = '#E8ECF0'; }}
          />
          <div style={{ fontSize: '0.72rem', color: '#AEB6BF', marginTop: '4px', textAlign: 'right' }}>
            {title.length}/100
          </div>
        </div>

        {/* Tanggal */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>📅 Tanggal Mulai *</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#27AE60'; }}
              onBlur={e => { e.target.style.borderColor = '#E8ECF0'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>📅 Tanggal Selesai *</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={e => setEndDate(e.target.value)}
              required
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#27AE60'; }}
              onBlur={e => { e.target.style.borderColor = '#E8ECF0'; }}
            />
          </div>
        </div>

        {/* Status Toggle */}
        <div>
          <label style={labelStyle}>⚙️ Status</label>
          <div
            onClick={() => setIsActive(!isActive)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsActive(!isActive); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              padding: '12px 18px',
              borderRadius: '12px',
              border: `1.5px solid ${isActive ? 'rgba(39,174,96,0.4)' : '#E8ECF0'}`,
              background: isActive ? 'rgba(39,174,96,0.06)' : '#F8FAFB',
              transition: 'all 0.2s',
              userSelect: 'none',
            }}
          >
            {/* Toggle switch */}
            <div style={{
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              background: isActive ? '#27AE60' : '#CBD5E0',
              position: 'relative',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute',
                top: '2px',
                left: isActive ? '22px' : '2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                transition: 'left 0.2s',
              }} />
            </div>
            <span style={{
              fontWeight: 800,
              fontSize: '0.88rem',
              color: isActive ? '#1E8449' : '#AEB6BF',
            }}>
              {isActive ? '🟢 Aktif — Pengumuman akan tampil ke pengguna' : '⚫ Nonaktif — Pengumuman tidak tampil'}
            </span>
          </div>
        </div>

        {/* Rich Text Editor */}
        <div>
          <label style={labelStyle}>📝 Isi Pengumuman *</label>
          <div style={{
            border: '1.5px solid #E8ECF0',
            borderRadius: '12px',
            overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}>
            <div
              ref={editorContainerRef}
              style={{ minHeight: '200px', fontFamily: 'Nunito, sans-serif' }}
            />
          </div>
          {!editorReady && (
            <div style={{ fontSize: '0.72rem', color: '#AEB6BF', marginTop: '6px' }}>
              ⏳ Memuat editor...
            </div>
          )}
          {editorReady && (
            <p style={{ fontSize: '0.72rem', color: '#AEB6BF', marginTop: '6px' }}>
              Gunakan toolbar di atas untuk format teks (bold, italic, list, heading, dll)
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#FEF0EF',
            color: '#C0392B',
            padding: '12px 16px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => router.push('/admin/pengumuman')}
            style={{
              padding: '12px 24px',
              borderRadius: '14px',
              border: '1.5px solid #E8ECF0',
              background: '#F7FAFC',
              color: '#5D6D7E',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 28px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #1E8449 0%, #27AE60 100%)',
              color: 'white',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Nunito, sans-serif',
              boxShadow: '0 4px 12px rgba(39,174,96,0.25)',
              transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '⏳ Menyimpan...' : `💾 ${submitLabel}`}
          </button>
        </div>
      </div>
    </form>
  );
}
