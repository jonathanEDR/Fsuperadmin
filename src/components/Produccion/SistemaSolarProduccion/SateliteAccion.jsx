import React, { useState } from 'react';
import { SATELITES_CONFIG } from './sistemaSolarConfig';

const SateliteAccion = ({ 
  id,
  planetaPadre,
  configuracion,
  onClick,
  visible = true,
  className = ""
}) => {
  const [estaEnHover, setEstaEnHover] = useState(false);
  
  // Encontrar configuración del satélite
  const sateliteConfig = SATELITES_CONFIG.find(s => s.id === id);
  if (!sateliteConfig || !visible) return null;

  // Tamaño responsive del satélite
  const tamañoSatelite = configuracion.planetaTamaño.small * 0.6;
  
  const handleClick = () => {
    if (onClick) {
      onClick(sateliteConfig);
    }
  };

  return (
    <div
      className={`absolute cursor-pointer transition-all duration-200 ${className}`}
      style={{
        width: tamañoSatelite,
        height: tamañoSatelite,
        transform: estaEnHover ? 'scale(1.2)' : 'scale(1)',
      }}
      onClick={handleClick}
      onMouseEnter={() => setEstaEnHover(true)}
      onMouseLeave={() => setEstaEnHover(false)}
    >
      {/* Cuerpo del satélite */}
      <div
        className="w-full h-full rounded-full border-2 shadow-lg flex items-center justify-center transition-all duration-200"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${sateliteConfig.color}, ${sateliteConfig.color}dd)`,
          borderColor: sateliteConfig.color,
          boxShadow: estaEnHover 
            ? `0 0 ${tamañoSatelite}px ${sateliteConfig.color}60`
            : `0 2px 4px rgba(0,0,0,0.1)`
        }}
      >
        <span style={{ fontSize: tamañoSatelite * 0.4 }}>
          {sateliteConfig.icono}
        </span>
      </div>
      
      {/* Tooltip */}
      {estaEnHover && configuracion.mostrarTexto && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-50">
          {sateliteConfig.nombre}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-t-gray-900"></div>
        </div>
      )}
      
      {/* Pulso de actividad */}
      <div 
        className="absolute inset-0 rounded-full animate-ping opacity-30"
        style={{ 
          backgroundColor: sateliteConfig.color,
          animationDuration: '2s',
          animationDelay: `${Math.random() * 2}s`
        }}
      />
    </div>
  );
};

export default SateliteAccion;
