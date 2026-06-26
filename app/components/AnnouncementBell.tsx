// app/components/AnnouncementBell.tsx
'use client';

interface Props {
  unreadCount: number;
  isActive?: boolean;
}

export default function AnnouncementBell({ unreadCount, isActive }: Props) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <span
        style={{
          fontSize: '1.4rem',
          lineHeight: 1,
          display: 'block',
          animation: unreadCount > 0 ? 'bellShake 2.5s ease-in-out infinite' : 'none',
        }}
      >
        🔔
      </span>
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute',
          top: '-7px',
          right: '-9px',
          background: '#E74C3C',
          color: 'white',
          borderRadius: '50%',
          minWidth: '16px',
          height: '16px',
          fontSize: '0.58rem',
          fontWeight: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1.5px solid white',
          fontFamily: 'Nunito, sans-serif',
          letterSpacing: '-0.5px',
          animation: 'badgePulse 2s ease-in-out infinite',
          lineHeight: 1,
          padding: '0 2px',
        }}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      <style>{`
        @keyframes bellShake {
          0%, 85%, 100% { transform: rotate(0deg); }
          88% { transform: rotate(-14deg); }
          92% { transform: rotate(14deg); }
          96% { transform: rotate(-8deg); }
          98% { transform: rotate(4deg); }
        }
        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
    </span>
  );
}
