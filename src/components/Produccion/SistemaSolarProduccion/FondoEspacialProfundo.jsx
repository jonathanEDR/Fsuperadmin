import React from 'react';
import styles from './fondoEspacial.module.css';

const FondoEspacialProfundo = ({ 
  activo = true, 
  intensidad = 'normal', // 'sutil', 'normal', 'intenso'
  mostrarViaLactea = true,
  mostrarAurora = true,
  className = "" 
}) => {
  if (!activo) return null;

  const intensidades = {
    sutil: { opacidad: 0.3, filtro: 'blur(2px)' },
    normal: { opacidad: 0.6, filtro: 'blur(1px)' },
    intenso: { opacidad: 0.9, filtro: 'none' }
  };

  const config = intensidades[intensidad] || intensidades.normal;

  return (
    <div 
      className={`${styles.fondoEspacialProfundo} ${className}`}
      style={{ 
        opacity: config.opacidad,
        filter: config.filtro 
      }}
    >
      {/* Fondo base profundo */}
      <div className={`${styles.capaFondo} absolute inset-0`} />
      
      {/* Nebulosa distante */}
      <div className={`${styles.capaNebulosaDistante} ${styles.capaFondo}`} />
      
      {/* Campo de estrellas ultra-lejanas */}
      <div className={`${styles.campoEstrellasUltra} ${styles.capaFondo}`} />
      
      {/* Vía láctea */}
      {mostrarViaLactea && (
        <div className={`${styles.viaLactea} ${styles.capaMedia}`} />
      )}
      
      {/* Aurora espacial */}
      {mostrarAurora && (
        <div className={`${styles.auroraEspacial} ${styles.capaMedia}`} />
      )}
      
      {/* Polvo cósmico avanzado */}
      <div className={`${styles.polvoCosmicoAvanzado} ${styles.capaMedia}`} />
      
      {/* Resplandor galáctico central */}
      <div className={`${styles.resplandorGalactico} ${styles.capaFrente}`} />
      
      {/* Gradientes adicionales de profundidad */}
      <div 
        className="absolute inset-0 capaFrente"
        style={{
          background: `
            radial-gradient(ellipse 100% 50% at 50% 0%, rgba(0, 20, 40, 0.4) 0%, transparent 60%),
            radial-gradient(ellipse 80% 80% at 0% 100%, rgba(20, 0, 40, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse 60% 100% at 100% 50%, rgba(40, 20, 60, 0.2) 0%, transparent 70%)
          `,
          opacity: 0.8
        }}
      />
      
      {/* Efecto de perspectiva 3D */}
      <div 
        className="absolute inset-0 capaFrente"
        style={{
          background: `
            linear-gradient(45deg, 
              transparent 0%, 
              rgba(0, 0, 0, 0.1) 25%, 
              transparent 50%, 
              rgba(0, 0, 0, 0.1) 75%, 
              transparent 100%
            )
          `,
          opacity: 0.3,
          animation: `${styles.ondularViaLactea} 40s ease-in-out infinite reverse`
        }}
      />
    </div>
  );
};

export default FondoEspacialProfundo;
