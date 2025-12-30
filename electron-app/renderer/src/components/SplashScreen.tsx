import { useEffect, useState } from 'react';
import './SplashScreen.css';
import logoImage from '../assets/logo.png';

interface SplashScreenProps {
  onFinish?: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Simula um tempo mínimo de exibição do splash screen
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        onFinish?.();
      }, 500); // Tempo da animação de fade out
    }, 1500); // Tempo mínimo de exibição

    return () => clearTimeout(timer);
  }, [onFinish]);

  // Não renderiza nada após o fade-out para garantir que não bloqueie cliques
  if (fadeOut) {
    console.log('✅ SplashScreen removido do DOM (fadeOut)');
    return null;
  }
  
  console.log('🖼️ SplashScreen visível');

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="splash-logo-container">
          <img 
            src={logoImage} 
            alt="Beauty Express" 
            className="splash-logo"
          />
        </div>
        <h1 className="splash-title">Beauty Express</h1>
        <p className="splash-subtitle">Sistema de Gestão para Salões de Beleza</p>
        <div className="splash-loader">
          <div className="splash-loader-bar"></div>
        </div>
      </div>
    </div>
  );
}

