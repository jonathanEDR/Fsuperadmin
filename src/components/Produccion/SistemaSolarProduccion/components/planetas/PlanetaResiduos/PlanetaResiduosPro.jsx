import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PLANETAS_CONFIG } from '../../../data/planetasConfig';
import styles from './PlanetaResiduosPro.module.css';

const PlanetaResiduosPro = ({ 
  onClick,
  estadisticas = {},
  estado = 'normal', // normal, alertaBajo, seleccionado
  orbita = 3, // 1, 2, 3 para diferentes órbitas
  responsive = 'desktop',
  efectosActivos = true,
  className = '',
  'aria-label': ariaLabel,
  // Props que NO deben pasarse al DOM
  isSelected: _isSelected,
  hasAlert: _hasAlert,
  anguloActual: _anguloActual,
  indiceEnOrbita: _indiceEnOrbita,
  totalEnOrbita: _totalEnOrbita,
  estadoResiduos: _estadoResiduos,
  // Solo props válidas para DOM
  ...domProps
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(estado === 'seleccionado');
  const [efectosReciclaje, setEfectosReciclaje] = useState(efectosActivos);

  const config = PLANETAS_CONFIG?.residuos || {
    color: 'var(--planeta-residuos-primary)',
    size: 'var(--planeta-size-medium)',
    effects: { particulas: { cantidad: 10 }, glow: true }
  };

  // 🎨 Clases CSS dinámicas
  const getPlanetaClasses = () => {
    const baseClasses = [
      styles.planetaResiduosPro,
      styles[`orbita${orbita}`],
      styles[responsive],
      className
    ];

    if (isHovered) baseClasses.push(styles.hover);
    if (isSelected) baseClasses.push(styles.selected);
    if (estado === 'alertaBajo') baseClasses.push(styles.alertaBajo);
    if (efectosReciclaje) baseClasses.push(styles.conEfectos);

    return baseClasses.filter(Boolean).join(' ');
  };

  // 🎯 Manejadores de eventos
  const handleClick = () => {
    setIsSelected(!isSelected);
    if (onClick) {
      onClick('residuos', { estadisticas, estado });
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  // ♿ Accesibilidad
  const defaultAriaLabel = `Planeta Residuos. ${
    estado === 'alertaBajo' ? 'Nivel alto, requiere gestión.' : 
    estado === 'seleccionado' ? 'Seleccionado actualmente.' : 
    'Estado normal.'
  } Órbita ${orbita}.`;

  return (
    <div 
      className={getPlanetaClasses()}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel || defaultAriaLabel}
      aria-pressed={isSelected}
      data-testid="planeta-residuos"
      data-orbita={orbita}
      data-estado={estado}
      {...domProps}
    >
      {/* Anillo de reciclaje */}
      {efectosActivos && efectosReciclaje && (
        <div className={styles.anilloReciclaje} aria-hidden="true">
          {[...Array(config.effects?.particulas?.cantidad || 6)].map((_, index) => (
            <div
              key={`residuo-${index}`}
              className={styles.particulaResiduos}
              style={{
                animationDelay: `${index * 1.2}s`,
                transform: `rotate(${index * (360 / (config.effects?.particulas?.cantidad || 6))}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Núcleo del planeta */}
      <div className={styles.nucleo}>
        <div className={styles.superficie}>
          {/* Icono de reciclaje */}
          <div className={styles.iconoReciclaje}>
            <svg viewBox="0 0 24 24" className={styles.iconoSvg}>
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
              <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.6"/>
            </svg>
          </div>

          {/* Efectos de sostenibilidad */}
          <div className={styles.efectosSostenibilidad}>
            <div className={styles.ondaVerde}></div>
            <div className={styles.ondaVerde}></div>
            <div className={styles.ondaVerde}></div>
          </div>
        </div>

        {/* Atmósfera ecológica */}
        <div className={styles.atmosfera} />
      </div>

      {/* Estadísticas flotantes */}
      {(estadisticas.total > 0) && (
        <div className={styles.estadisticasFloating}>
          <span className={styles.contador}>{estadisticas.total}</span>
          <span className={styles.etiqueta}>Residuos</span>
        </div>
      )}

      {/* Indicador de impacto ambiental */}
      <div className={styles.indicadorImpacto} data-estado={estado}>
        <div className={styles.barraImpacto}></div>
      </div>

      {/* Efectos de transformación */}
      {isHovered && (
        <div className={styles.efectosTransformacion}>
          <div className={styles.espiral}></div>
          <div className={styles.particulas}></div>
        </div>
      )}
    </div>
  );
};

// 🔧 Valores por defecto
PlanetaResiduosPro.defaultProps = {
  onClick: null,
  estadisticas: {},
  estado: 'normal',
  orbita: 3,
  responsive: 'desktop',
  efectosActivos: true
};

// PropTypes para desarrollo
if (process.env.NODE_ENV === 'development') {
  PlanetaResiduosPro.propTypes = {
    onClick: PropTypes.func,
    estadisticas: PropTypes.shape({
      total: PropTypes.number,
      reciclados: PropTypes.number,
      pendientes: PropTypes.number
    }),
    estado: PropTypes.oneOf(['normal', 'alertaBajo', 'seleccionado']),
    orbita: PropTypes.oneOf([1, 2, 3]),
    responsive: PropTypes.oneOf(['mobile', 'tablet', 'desktop']),
    efectosActivos: PropTypes.bool,
    className: PropTypes.string,
    'aria-label': PropTypes.string
  };
}

export default PlanetaResiduosPro;
