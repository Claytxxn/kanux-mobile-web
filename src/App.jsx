import React, { useState, useCallback } from 'react';
import Toast from './components/Toast';

function App() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
  }, []);

  return (
    <>
      {/* ...existing code... */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

export default App;

// alert("Mensagem enviada");
showToast("Mensagem enviada");