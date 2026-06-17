import React from 'react';

// Função utilitária para formatar o tempo relativo
function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000); // diferença em segundos

  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const StatusAvatar = ({ avatarUrl, isOnline, lastSeen }) => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <div style={{ position: 'relative', marginRight: 8 }}>
      <img
        src={avatarUrl}
        alt="Avatar"
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          objectFit: 'cover',
        }}
      />
      <span
        style={{
          position: 'absolute',
          bottom: 2,
          right: 2,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: isOnline ? '#4caf50' : '#bdbdbd',
          border: '2px solid white',
          boxSizing: 'border-box',
        }}
      />
    </div>
    <span style={{ fontSize: 12, color: '#888' }}>
      {isOnline ? 'agora' : formatRelativeTime(lastSeen)}
    </span>
  </div>
);

export default StatusAvatar;

<StatusAvatar
  avatarUrl="https://exemplo.com/avatar.jpg"
  isOnline={true}
  lastSeen={usuario.lastSeenTimestamp}
/>