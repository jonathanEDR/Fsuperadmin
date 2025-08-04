import React, { useState, useEffect } from 'react';
import { SOL_CONFIG } from '../../data/planetasConfig';
import styles from './SolCentral.module.css';

const SolCentral = ({ 
  onClick, 
  estadisticas = {}, 
  responsive = 'desktop',
  efectosActivos = true,
  className = '' 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);
  const [coronaRotation, setCoronaRotation] = useState(0);

  // Efecto de rotación de corona
  useEffect(() => {
    if (!efectosActivos) return;
    
    const interval = setInterval(() => {
      setCoronaRotation(prev => (prev + 1) % 360);
    }, 100);

    return () => clearInterval(interval);
  }, [efectosActivos]);

  // Configuración responsiva
  const getResponsiveSize = () => {
    switch (responsive) {
      case 'mobile':
        return SOL_CONFIG.tamaños.mobile;
      case 'tablet':
        return SOL_CONFIG.tamaños.tablet;
      default:
        return SOL_CONFIG.tamaños.base;
    }
  };

  const size = getResponsiveSize();

  // Estilos dinámicos
  const solStyles = {
    width: `${size}px`,
    height: `${size}px`,
    background: SOL_CONFIG.efectos.gradiente,
    boxShadow: SOL_CONFIG.efectos.sombras.join(', '),
    transform: isHovered ? `scale(${SOL_CONFIG.tamaños.hover})` : 'scale(1)',
    filter: efectosActivos ? 'brightness(1.1)' : 'brightness(0.9)'
  };

  const coronaStyles = {
    width: SOL_CONFIG.efectos.corona.tamaño,
    height: SOL_CONFIG.efectos.corona.tamaño,
    background: SOL_CONFIG.efectos.corona.gradiente,
    transform: `rotate(${coronaRotation}deg) scale(1.1)`,
    opacity: isHovered ? 0.8 : 0.6
  };

  const handleClick = () => {
    if (onClick) {
      onClick('dashboard');
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div 
      className={`${styles.solCentral} ${className}`}
      style={solStyles}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label="Centro de control - Dashboard principal"
    >
      {/* Corona del sol */}
      {efectosActivos && (
        <div 
          className={styles.corona}
          style={coronaStyles}
        />
      )}

      {/* Núcleo del sol */}
      <div className={styles.nucleo}>
        {/* Icono del sol */}
        <div className={styles.icono}>
          ☀️
        </div>
        
        {/* Información de estadísticas (opcional) */}
        {estadisticas.total && (
          <div className={styles.estadisticas}>
            <div className={styles.numero}>
              {estadisticas.total}
            </div>
            <div className={styles.label}>
              Total
            </div>
          </div>
        )}
      </div>

      {/* Partículas de energía */}
      {efectosActivos && (
        <div className={styles.particulas}>
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className={styles.particula}
              style={{
                animationDelay: `${index * 0.5}s`,
                transform: `rotate(${index * 60}deg)`
              }}
            />
          ))}
        </div>
      )}

      {/* Efectos de pulso */}
      {isPulsing && efectosActivos && (
        <div className={styles.pulso} />
      )}

      {/* Brillo adicional en hover */}
      {isHovered && (
        <div className={styles.brilloHover} />
      )}
    </div>
  );
};

export default SolCentral;
