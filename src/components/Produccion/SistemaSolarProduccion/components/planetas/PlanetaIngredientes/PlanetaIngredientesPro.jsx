import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PLANETAS_CONFIG } from '../../../data/planetasConfig';
import styles from './PlanetaIngredientesPro.module.css';

const PlanetaIngredientesPro = ({ 
  onClick,
  estadisticas = {},
  estado = 'normal', // normal, alertaBajo, seleccionado
  orbita = 2, // 1, 2, 3 para diferentes órbitas
  responsive = 'desktop',
  efectosActivos = true,
  className = '',
  'aria-label': ariaLabel,
  // Props que NO deben pasarse al DOM - los destructuramos para eliminarlos
  isSelected: _isSelected,
  hasAlert: _hasAlert,
  anguloActual: _anguloActual,
  indiceEnOrbita: _indiceEnOrbita,
  totalEnOrbita: _totalEnOrbita,
  estadoIngredientes: _estadoIngredientes,
  // Solo props válidas para DOM
  ...domProps
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(estado === 'seleccionado');
  const [particulasActivas, setParticulasActivas] = useState(efectosActivos);

  const config = PLANETAS_CONFIG.ingredientes;

  // Efecto para cambios de estado
  useEffect(() => {
    setIsSelected(estado === 'seleccionado');
  }, [estado]);

  // Efecto para controlar partículas basado en performance
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e) => {
      setParticulasActivas(efectosActivos && !e.matches);
    };
    
    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [efectosActivos]);

  // Obtener clases CSS dinámicas
  const getPlanetaClasses = () => {
    const baseClasses = [
      styles.planetaIngredientes,
      styles[`orbita${orbita}`], // orbita1, orbita2, orbita3
      className
    ];

    if (estado === 'alertaBajo') baseClasses.push(styles.alertaBajo);
    if (isSelected) baseClasses.push(styles.seleccionado);

    return baseClasses.filter(Boolean).join(' ');
  };

  // Handlers de eventos
  const handleClick = (e) => {
    e.preventDefault();
    if (onClick) {
      onClick('ingredientes', { estado, estadisticas, orbita });
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  // Datos para aria-label
  const defaultAriaLabel = `${config.nombre} - ${estadisticas.cantidad || 0} elementos disponibles. ${
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
      data-testid="planeta-ingredientes"
      data-orbita={orbita}
      data-estado={estado}
      {...domProps}
    >
      {/* Anillo de órbita de partículas */}
      {efectosActivos && particulasActivas && (
        <div className={styles.anilloParticulas} aria-hidden="true">
          {[...Array(config.efectos.particulas.cantidad)].map((_, index) => (
            <div
              key={`particula-${index}`}
              className={styles.particula}
              style={{
                animationDelay: `${index * 0.6}s`,
                transform: `rotate(${index * (360 / config.efectos.particulas.cantidad)}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Estela orbital */}
      {efectosActivos && (
        <div 
          className={styles.estela}
          aria-hidden="true"
        />
      )}

      {/* Núcleo del planeta */}
      <div className={styles.nucleo}>
        {/* Icono principal */}
        <div 
          className={styles.icono}
          role="img"
          aria-label={`Icono de ${config.nombre}`}
        >
          {config.icono}
        </div>
        
        {/* Estadísticas opcionales */}
        {estadisticas.cantidad !== undefined && (
          <div className={styles.estadisticas}>
            <div 
              className={styles.numero}
              aria-label={`${estadisticas.cantidad} elementos`}
            >
              {estadisticas.cantidad}
            </div>
          </div>
        )}
      </div>

      {/* Efecto de brillo orgánico */}
      {efectosActivos && (
        <div 
          className={styles.brilloOrganico}
          aria-hidden="true"
        />
      )}

      {/* Efecto de respiración natural */}
      {efectosActivos && estado === 'normal' && (
        <div 
          className={styles.respiracion} 
          aria-hidden="true"
        />
      )}

      {/* Indicador de alerta */}
      {estado === 'alertaBajo' && (
        <div 
          className={styles.indicadorAlerta}
          role="alert"
          aria-label="Nivel bajo - requiere atención"
        >
          <div className={styles.pulsoAlerta} aria-hidden="true" />
        </div>
      )}

      {/* Efecto de selección */}
      {isSelected && (
        <div 
          className={styles.efectoSeleccion}
          aria-hidden="true"
        >
          <div className={styles.anilloSeleccion} />
        </div>
      )}

      {/* Biomasa flotante (efecto especial en hover) */}
      {efectosActivos && isHovered && particulasActivas && (
        <div 
          className={styles.biomasaFlotante}
          aria-hidden="true"
        >
          {[...Array(4)].map((_, index) => (
            <div
              key={`biomasa-${index}`}
              className={styles.biomasaParticula}
              style={{
                animationDelay: `${index * 0.4}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Configuración por defecto para diferentes órbitas
PlanetaIngredientesPro.defaultProps = {
  orbita: 2,
  estado: 'normal',
  efectosActivos: true,
  responsive: 'desktop'
};

// PropTypes para desarrollo
if (process.env.NODE_ENV === 'development') {
  PlanetaIngredientesPro.propTypes = {
    onClick: PropTypes.func,
    estadisticas: PropTypes.shape({
      cantidad: PropTypes.number,
      tipo: PropTypes.string,
      estado: PropTypes.string
    }),
    estado: PropTypes.oneOf(['normal', 'alertaBajo', 'seleccionado']),
    orbita: PropTypes.oneOf([1, 2, 3]),
    responsive: PropTypes.oneOf(['mobile', 'tablet', 'desktop']),
    efectosActivos: PropTypes.bool,
    className: PropTypes.string,
    'aria-label': PropTypes.string
  };
}

export default PlanetaIngredientesPro;
