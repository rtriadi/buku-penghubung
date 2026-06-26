// app/components/AnnouncementPopup.tsx
'use client';

import { useState } from 'react';
import type { Announcement } from '@/lib/types';
import { markAnnouncementRead } from '@/lib/db';

interface Props {
  announcements: Announcement[];
  userId: string;
  onClose: () => void;
  onRead: (id: string) => void;
  role?: string;
}

export default function AnnouncementPopup({ announcements, userId, onClose, onRead, role }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [marking, setMarking] = useState(false);

  const getHeaderGradient = () => {
    if (role === 'principal') {
      return 'linear-gradient(135deg, #5B2C6F 0%, #8E44AD 100%)';
    }
    if (role === 'parent') {
      return 'linear-gradient(135deg, #1A5276 0%, #2980B9 100%)';
    }
    return 'linear-gradient(135deg, #1E8449 0%, #27AE60 100%)';
  };

  const getButtonGradient = () => {
    if (role === 'principal') {
      return 'linear-gradient(135deg, #5B2C6F 0%, #8E44AD 100%)';
    }
    if (role === 'parent') {
      return 'linear-gradient(135deg, #1A5276 0%, #2980B9 100%)';
    }
    return 'linear-gradient(135deg, #1E8449 0%, #27AE60 100%)';
  };

  const getButtonShadow = () => {
    if (role === 'principal') {
      return '0 4px 12px rgba(142, 68, 173, 0.25)';
    }
    if (role === 'parent') {
      return '0 4px 12px rgba(41, 128, 185, 0.25)';
    }
    return '0 4px 12px rgba(39, 174, 96, 0.25)';
  };

  if (announcements.length === 0) return null;

  const current = announcements[currentIndex];
  const isLast = currentIndex === announcements.length - 1;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleMarkRead = async () => {
    setMarking(true);
    await markAnnouncementRead(current.id, userId);
    onRead(current.id);
    setMarking(false);
    if (isLast) {
      onClose();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        fontFamily: 'Nunito, sans-serif',
        animation: 'announceFadeIn 0.3s ease-out',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '28px',
          width: '100%',
          maxWidth: '420px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          animation: 'announceScaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Header */}
        <div style={{
          background: getHeaderGradient(),
          padding: '24px 20px 20px',
          color: 'white',
          textAlign: 'center',
          position: 'relative',
          flexShrink: 0,
        }}>
          {/* Counter badge */}
          {announcements.length > 1 && (
            <div style={{
              position: 'absolute',
              top: '14px',
              left: '16px',
              background: 'rgba(255,255,255,0.25)',
              borderRadius: '20px',
              padding: '3px 10px',
              fontSize: '0.7rem',
              fontWeight: 800,
            }}>
              {currentIndex + 1} / {announcements.length}
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
          >
            ✕
          </button>

          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📢</div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, lineHeight: 1.3 }}>
            {current.title}
          </h2>
          <div style={{ fontSize: '0.72rem', opacity: 0.9, marginTop: '6px', fontWeight: 600 }}>
            📅 {formatDate(current.startDate)} — {formatDate(current.endDate)}
          </div>
        </div>

        {/* Content — scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
          }}
        >
          <div
            className="announcement-content"
            dangerouslySetInnerHTML={{ __html: current.content }}
          />
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          gap: '10px',
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: '14px',
              border: '1.5px solid #E8ECF0',
              background: '#F7FAFC',
              color: '#5D6D7E',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            🔔 Nanti
          </button>
          <button
            onClick={handleMarkRead}
            disabled={marking}
            style={{
              flex: 2,
              padding: '11px',
              borderRadius: '14px',
              border: 'none',
              background: getButtonGradient(),
              color: 'white',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: marking ? 'not-allowed' : 'pointer',
              fontFamily: 'Nunito, sans-serif',
              boxShadow: getButtonShadow(),
              transition: 'all 0.2s',
              opacity: marking ? 0.7 : 1,
            }}
            onMouseEnter={(e) => { if (!marking) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
          >
            {marking ? '⏳ Menyimpan...' : isLast ? '✅ Sudah Dibaca' : '✅ Dibaca & Lanjut'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes announceFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes announceScaleUp { from { opacity: 0; transform: scale(0.88) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}
