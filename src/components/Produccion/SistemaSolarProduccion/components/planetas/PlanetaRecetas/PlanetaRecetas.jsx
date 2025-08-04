import React from 'react';
import { usePlanetEffects } from '../../../hooks/usePlanetEffects';
import { PLANETAS_CONFIG } from '../../../data/planetasConfig';
import styles from './PlanetaRecetas.module.css';

const PlanetaRecetas = ({ 
  onClick, 
  isSelected = false, 
  hasAlert = false, 
  estadoRecetas = 'normal' // 'normal', 'cocinando', 'completado'
}) => {
  const planetConfig = PLANETAS_CONFIG.recetas;
  const { efectos } = usePlanetEffects('recetas', estadoRecetas);

  const handleClick = () => {
    if (onClick) {
      onClick('recetas');
    }
  };

  const getEstadoClass = () => {
    switch (estadoRecetas) {
      case 'cocinando':
        return styles.cocinando;
      case 'completado':
        return styles.completado;
      default:
        return '';
    }
  };

  return (
    <div
      className={`
        ${styles.planetaRecetas}
        ${isSelected ? styles.seleccionado : ''}
        ${hasAlert ? styles.conAlerta : ''}
        ${getEstadoClass()}
      `}
      onClick={handleClick}
      style={{
        background: planetConfig.gradient,
        ...efectos
      }}
    >
      {/* Efectos de cocción */}
      <div className={styles.efectosCoccion}>
        <div className={styles.ondaCalor}></div>
        <div className={styles.ondaCalor}></div>
        <div className={styles.ondaCalor}></div>
      </div>

      {/* Partículas doradas */}
      <div className={styles.particulasDoradas}>
        <div className={styles.particula}></div>
        <div className={styles.particula}></div>
        <div className={styles.particula}></div>
        <div className={styles.particula}></div>
        <div className={styles.particula}></div>
      </div>

      {/* Vapor de cocción */}
      {estadoRecetas === 'cocinando' && (
        <div className={styles.vaporCoccion}>
          <div className={styles.vapor}></div>
          <div className={styles.vapor}></div>
          <div className={styles.vapor}></div>
        </div>
      )}

      {/* Icono del planeta */}
      <div className={styles.iconoPlaneta}>
        {planetConfig.icono}
      </div>

      {/* Efecto de completado */}
      {estadoRecetas === 'completado' && (
        <div className={styles.efectoCompletado}>
          <div className={styles.anilloCompletado}></div>
        </div>
      )}

      {/* Brillo especial para recetas */}
      <div className={styles.brilloRecetas}></div>
    </div>
  );
};

export default PlanetaRecetas;
