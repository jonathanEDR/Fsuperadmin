import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PLANETAS_CONFIG } from '../../../data/planetasConfig';
import styles from './PlanetaCatalogoPro.module.css';

const PlanetaCatalogoPro = ({ 
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
  estadoCatalogo: _estadoCatalogo,
  // Solo props válidas para DOM
  ...domProps
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(estado === 'seleccionado');
  const [particulasActivas, setParticulasActivas] = useState(efectosActivos);

  const config = PLANETAS_CONFIG?.catalogo || {
    color: 'var(--planeta-catalogo-primary)',
    size: 'var(--planeta-size-medium)',
    effects: { particulas: { cantidad: 12 }, glow: true }
  };

  // 🎨 Clases CSS dinámicas
  const getPlanetaClasses = () => {
    const baseClasses = [
      styles.planetaCatalogoPro,
      styles[`orbita${orbita}`],
      styles[responsive],
      className
    ];

    if (isHovered) baseClasses.push(styles.hover);
    if (isSelected) baseClasses.push(styles.selected);
    if (estado === 'alertaBajo') baseClasses.push(styles.alertaBajo);
    if (particulasActivas) baseClasses.push(styles.conParticulas);

    return baseClasses.filter(Boolean).join(' ');
  };

  // 🎯 Manejadores de eventos
  const handleClick = () => {
    setIsSelected(!isSelected);
    if (onClick) {
      onClick('catalogo', { estadisticas, estado });
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
  const defaultAriaLabel = `Planeta Catálogo. ${
    estado === 'alertaBajo' ? 'Nivel bajo, requiere atención.' : 
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
      data-testid="planeta-catalogo"
      data-orbita={orbita}
      data-estado={estado}
      {...domProps}
    >
      {/* Anillo de catálogo */}
      {efectosActivos && particulasActivas && (
        <div className={styles.anilloCatalogo} aria-hidden="true">
          {[...Array(config.effects?.particulas?.cantidad || 8)].map((_, index) => (
            <div
              key={`catalogo-item-${index}`}
              className={styles.catalogoItem}
              style={{
                animationDelay: `${index * 0.8}s`,
                transform: `rotate(${index * (360 / (config.effects?.particulas?.cantidad || 8))}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Núcleo del planeta */}
      <div className={styles.nucleo}>
        <div className={styles.superficie}>
          {/* Icono de catálogo */}
          <div className={styles.iconoCatalogo}>
            <svg viewBox="0 0 24 24" className={styles.iconoSvg}>
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" fill="currentColor"/>
            </svg>
          </div>
        </div>

        {/* Atmósfera con efecto glow */}
        <div className={styles.atmosfera} />
      </div>

      {/* Estadísticas flotantes */}
      {(estadisticas.total > 0) && (
        <div className={styles.estadisticasFloating}>
          <span className={styles.contador}>{estadisticas.total}</span>
        </div>
      )}

      {/* Indicador de estado */}
      <div className={styles.indicadorEstado} data-estado={estado} />
    </div>
  );
};

// 🔧 Valores por defecto
PlanetaCatalogoPro.defaultProps = {
  onClick: null,
  estadisticas: {},
  estado: 'normal',
  orbita: 3,
  responsive: 'desktop',
  efectosActivos: true
};

// PropTypes para desarrollo
if (process.env.NODE_ENV === 'development') {
  PlanetaCatalogoPro.propTypes = {
    onClick: PropTypes.func,
    estadisticas: PropTypes.shape({
      total: PropTypes.number,
      activos: PropTypes.number,
      inactivos: PropTypes.number
    }),
    estado: PropTypes.oneOf(['normal', 'alertaBajo', 'seleccionado']),
    orbita: PropTypes.oneOf([1, 2, 3]),
    responsive: PropTypes.oneOf(['mobile', 'tablet', 'desktop']),
    efectosActivos: PropTypes.bool,
    className: PropTypes.string,
    'aria-label': PropTypes.string
  };
}

export default PlanetaCatalogoPro;
