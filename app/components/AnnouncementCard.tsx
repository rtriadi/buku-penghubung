// app/components/AnnouncementCard.tsx
'use client';

import { useState } from 'react';
import type { Announcement } from '@/lib/types';

interface Props {
  announcement: Announcement;
  isRead: boolean;
  onMarkRead: (id: string) => void;
}

export default function AnnouncementCard({ announcement, isRead, onMarkRead }: Props) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div
      style={{
        background: isRead ? 'white' : 'rgba(243, 156, 18, 0.06)',
        borderRadius: '20px',
        padding: '18px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        border: `1.5px solid ${isRead ? 'rgba(0,0,0,0.06)' : 'rgba(243, 156, 18, 0.3)'}`,
        fontFamily: 'Nunito, sans-serif',
        transition: 'all 0.2s ease',
        marginBottom: '12px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}>
          {!isRead && (
            <span style={{
              display: 'inline-block',
              background: '#F39C12',
              color: 'white',
              fontSize: '0.6rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '20px',
              marginBottom: '6px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              🔔 Belum Dibaca
            </span>
          )}
          <h3 style={{
            margin: 0,
            fontSize: '0.95rem',
            fontWeight: 800,
            color: '#2C3E50',
            lineHeight: 1.3,
          }}>
            {announcement.title}
          </h3>
          <div style={{ fontSize: '0.72rem', color: '#5D6D7E', marginTop: '4px', fontWeight: 600 }}>
            📅 {formatDate(announcement.startDate)} — {formatDate(announcement.endDate)}
          </div>
        </div>
        {isRead && (
          <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>✅</span>
        )}
      </div>

      {/* Preview / expanded content */}
      {expanded ? (
        <div
          className="announcement-content"
          style={{
            marginBottom: '12px',
            borderTop: '1px solid rgba(0,0,0,0.06)',
            paddingTop: '12px',
          }}
          dangerouslySetInnerHTML={{ __html: announcement.content }}
        />
      ) : (
        <p style={{
          margin: '0 0 12px 0',
          fontSize: '0.82rem',
          color: '#5D6D7E',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {/* Strip HTML tags untuk preview */}
          {announcement.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: '1.5px solid #E8ECF0',
            borderRadius: '10px',
            padding: '7px 14px',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#5D6D7E',
            cursor: 'pointer',
            fontFamily: 'Nunito, sans-serif',
            transition: 'all 0.2s',
          }}
        >
          {expanded ? '🔼 Lebih Sedikit' : '📖 Baca Selengkapnya'}
        </button>

        {!isRead && (
          <button
            onClick={() => onMarkRead(announcement.id)}
            style={{
              background: 'linear-gradient(135deg, #1E8449 0%, #27AE60 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '7px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: 'white',
              cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif',
              boxShadow: '0 2px 8px rgba(39, 174, 96, 0.25)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
          >
            ✅ Tandai Dibaca
          </button>
        )}
      </div>
    </div>
  );
}
