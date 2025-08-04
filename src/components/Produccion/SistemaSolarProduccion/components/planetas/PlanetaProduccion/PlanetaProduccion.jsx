import React from 'react';
import { usePlanetEffects } from '../../../hooks/usePlanetEffects';
import { PLANETAS_CONFIG } from '../../../data/planetasConfig';
import styles from './PlanetaProduccion.module.css';

const PlanetaProduccion = ({ 
  onClick, 
  tieneAlerta = false, 
  seleccionado = false,
  estadisticas = {},
  className = '' 
}) => {
  const config = PLANETAS_CONFIG.produccion;
  const {
    effectsState,
    handleMouseEnter,
    handleMouseLeave
  } = usePlanetEffects('produccion');

  const handleClick = () => {
    if (onClick) {
      onClick('produccion');
    }
  };

  const planetaClasses = [
    styles.planetaProduccion,
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
      data-planeta="produccion"
    >
      {/* Efectos de partículas de producción */}
      <div className={styles.efectosProduccion}>
        <div className={styles.particulasVapor}></div>
        <div className={styles.maquinaria}></div>
        <div className={styles.energiaProduccion}></div>
      </div>

      {/* Icono principal */}
      <span className={styles.iconoPrincipal}>
        🏭
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
          <span className={styles.numeroProduccion}>
            {estadisticas.total}
          </span>
        </div>
      )}

      {/* Efectos de estado */}
      {effectsState?.isActive && (
        <div className={styles.efectosActivos}>
          <div className={styles.anilloEnergia}></div>
          <div className={styles.pulsoProduccion}></div>
        </div>
      )}

      {/* Atmósfera del planeta */}
      <div className={styles.atmosfera}></div>
      
      {/* Corona de producción */}
      <div className={styles.coronaProduccion}></div>
    </div>
  );
};

export default PlanetaProduccion;
