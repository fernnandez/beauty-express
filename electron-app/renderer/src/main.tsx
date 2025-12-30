import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SplashScreen } from './components/SplashScreen';
import './index.css';

// Verifica se electronAPI está disponível
if (typeof window !== 'undefined' && !window.electronAPI) {
  console.warn('⚠️ electronAPI não está disponível. Certifique-se de que o preload foi carregado.');
}

function Root() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Verifica se o banco de dados está pronto antes de esconder o splash
    const checkDbReady = async () => {
      if (window.electronAPI) {
        try {
          const isReady = await window.electronAPI.db.isReady();
          if (isReady) {
            // Aguarda um pouco mais para garantir que tudo está carregado
            setTimeout(() => {
              setShowSplash(false);
            }, 500);
          }
        } catch (error) {
          console.error('Erro ao verificar banco de dados:', error);
          // Mesmo com erro, esconde o splash após um tempo
          setTimeout(() => {
            setShowSplash(false);
          }, 2000);
        }
      } else {
        // Se não houver electronAPI, esconde após um tempo padrão
        setTimeout(() => {
          setShowSplash(false);
        }, 2000);
      }
    };

    checkDbReady();
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
