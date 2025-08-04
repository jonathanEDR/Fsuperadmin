import React from 'react';
import { usePlanetEffects } from '../../../hooks/usePlanetEffects';
import { PLANETAS_CONFIG } from '../../../data/planetasConfig';
import styles from './PlanetaMovimientos.module.css';

const PlanetaMovimientos = ({ 
  onClick, 
  tieneAlerta = false, 
  seleccionado = false,
  estadisticas = {},
  className = '' 
}) => {
  const config = PLANETAS_CONFIG.movimientos;
  const {
    effectsState,
    handleMouseEnter,
    handleMouseLeave
  } = usePlanetEffects('movimientos');

  const handleClick = () => {
    if (onClick) {
      onClick('movimientos');
    }
  };

  const planetaClasses = [
    styles.planetaMovimientos,
    config.className,
    className,
    tieneAlerta ? styles.conAlerta : '',
    seleccionado ? styles.seleccionado : '',
    effectsState?.isHovered ? styles.hover : ''
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={planetaClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        background: config.gradiente,
        color: config.colorTexto
      }}
      title={`${config.nombre} - ${config.descripcion}`}
      data-planeta="movimientos"
    >
      {/* Efectos de movimientos y flujo */}
      <div className={styles.efectosMovimientos}>
        <div className={styles.flujosDatos}></div>
        <div className={styles.transferencias}></div>
        <div className={styles.ondaMovimiento}></div>
      </div>

      {/* Icono principal */}
      <span className={styles.iconoPrincipal}>
        🔄
      </span>

      {/* Indicadores de estado */}
      {tieneAlerta && (
        <div className={styles.indicadorAlerta}>
          <span className={styles.iconoAlerta}>⚠️</span>
        </div>
      )}

      {/* Estadísticas dinámicas */}
      {estadisticas?.total && (
        <div className={styles.estadisticas}>
          <span className={styles.numeroMovimientos}>
            {estadisticas.total}
          </span>
        </div>
      )}

      {/* Efectos de estado */}
      {effectsState?.isActive && (
        <div className={styles.efectosActivos}>
          <div className={styles.anilloFlujo}></div>
          <div className={styles.pulsoMovimiento}></div>
        </div>
      )}

      {/* Atmósfera del planeta */}
      <div className={styles.atmosfera}></div>
      
      {/* Corona de transferencias */}
      <div className={styles.coronaFlujo}></div>
    </div>
  );
};

export default PlanetaMovimientos;
