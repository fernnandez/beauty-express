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
      console.log('🔍 Verificando banco de dados...');
      
      if (window.electronAPI) {
        try {
          const isReady = await window.electronAPI.db.isReady();
          console.log('✅ Banco de dados pronto:', isReady);
          if (isReady) {
            // Aguarda um pouco mais para garantir que tudo está carregado
            setTimeout(() => {
              console.log('🎉 Escondendo splash screen');
              setShowSplash(false);
            }, 500);
          } else {
            // Se não estiver pronto, espera um pouco mais
            setTimeout(() => {
              console.log('⏳ Timeout - escondendo splash mesmo sem confirmação');
              setShowSplash(false);
            }, 3000);
          }
        } catch (error) {
          console.error('❌ Erro ao verificar banco de dados:', error);
          // Mesmo com erro, esconde o splash após um tempo
          setTimeout(() => {
            console.log('⚠️ Escondendo splash após erro');
            setShowSplash(false);
          }, 2000);
        }
      } else {
        console.warn('⚠️ electronAPI não disponível, escondendo splash após timeout');
        // Se não houver electronAPI, esconde após um tempo padrão
        setTimeout(() => {
          setShowSplash(false);
        }, 2000);
      }
    };

    // Timeout de segurança - sempre esconde o splash após 5 segundos
    const safetyTimeout = setTimeout(() => {
      console.log('⏰ Timeout de segurança - forçando esconder splash');
      setShowSplash(false);
    }, 5000);

    checkDbReady();

    return () => {
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Não renderiza nada até o splash terminar para evitar problemas de z-index
  if (showSplash) {
    console.log('🖼️ Renderizando SplashScreen');
    return <SplashScreen onFinish={() => {
      console.log('✅ SplashScreen onFinish chamado');
      setShowSplash(false);
    }} />;
  }

  console.log('✅ Renderizando App principal');
  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
