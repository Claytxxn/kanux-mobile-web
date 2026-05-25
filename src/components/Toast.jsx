import React, { useEffect } from 'react';

const toastStyle = {
  position: 'fixed',
  top: 20,
  left: '50%',
  transform: 'translateX(-50%)',
  background: '#323232',
  color: '#fff',
  padding: '12px 24px',
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  zIndex: 9999,
  opacity: 0.95,
  transition: 'opacity 0.3s',
};

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return <div style={toastStyle}>{message}</div>;
};

export default Toast;