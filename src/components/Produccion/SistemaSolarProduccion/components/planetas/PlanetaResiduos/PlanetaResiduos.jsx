import React from 'react';
import { usePlanetEffects } from '../../../hooks/usePlanetEffects';
import { PLANETAS_CONFIG } from '../../../data/planetasConfig';
import styles from './PlanetaResiduos.module.css';

const PlanetaResiduos = ({ 
  onClick, 
  tieneAlerta = false, 
  seleccionado = false,
  estadisticas = {},
  className = '' 
}) => {
  const config = PLANETAS_CONFIG.residuos;
  const {
    effectsState,
    handleMouseEnter,
    handleMouseLeave
  } = usePlanetEffects('residuos');

  const handleClick = () => {
    if (onClick) {
      onClick('residuos');
    }
  };

  const planetaClasses = [
    styles.planetaResiduos,
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
      data-planeta="residuos"
    >
      {/* Efectos de residuos y reciclaje */}
      <div className={styles.efectosResiduos}>
        <div className={styles.particulasReciclaje}></div>
        <div className={styles.decomposicion}></div>
        <div className={styles.energiaVerde}></div>
      </div>

      {/* Icono principal */}
      <span className={styles.iconoPrincipal}>
        ♻️
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
          <span className={styles.numeroResiduos}>
            {estadisticas.total}
          </span>
        </div>
      )}

      {/* Efectos de estado */}
      {effectsState?.isActive && (
        <div className={styles.efectosActivos}>
          <div className={styles.anilloReciclaje}></div>
          <div className={styles.pulsoVerde}></div>
        </div>
      )}

      {/* Atmósfera del planeta */}
      <div className={styles.atmosfera}></div>
      
      {/* Corona de reciclaje */}
      <div className={styles.coronaVerde}></div>
    </div>
  );
};

export default PlanetaResiduos;
