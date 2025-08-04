import React, { useState, useEffect } from 'react';
import { PLANETAS_CONFIG } from '../../../data/planetasConfig';
import styles from './PlanetaIngredientes.module.css';

const PlanetaIngredientes = ({ 
  onClick,
  estadisticas = {},
  estado = 'normal', // normal, alertaBajo, seleccionado
  responsive = 'desktop',
  efectosActivos = true,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(estado === 'seleccionado');
  const [particulasActivas, setParticulasActivas] = useState(efectosActivos);

  const config = PLANETAS_CONFIG.ingredientes;

  // Efecto para cambios de estado
  useEffect(() => {
    setIsSelected(estado === 'seleccionado');
  }, [estado]);

  // Configuración responsiva
  const getResponsiveSize = () => {
    const orbita = config.orbita;
    switch (responsive) {
      case 'mobile':
        return orbita === 1 ? 45 : orbita === 2 ? 38 : 33;
      case 'tablet':
        return orbita === 1 ? 50 : orbita === 2 ? 42 : 37;
      default:
        return config.tamaños.base;
    }
  };

  const size = getResponsiveSize();

  // Estilos dinámicos basados en configuración
  const planetaStyles = {
    width: `${size}px`,
    height: `${size}px`,
    background: config.gradiente,
    boxShadow: config.efectos.brilloOrganico.sombra,
    transform: isHovered 
      ? `scale(${config.tamaños.hover}) rotateY(15deg)` 
      : isSelected 
        ? `scale(${config.tamaños.seleccionado})` 
        : 'scale(1)',
    filter: `brightness(${config.estados[estado]?.brillo || 1}) saturate(${config.estados[estado]?.saturacion || 1})`
  };

  const handleClick = () => {
    if (onClick) {
      onClick('ingredientes');
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
      className={`${styles.planetaIngredientes} ${className} ${estado === 'alertaBajo' ? styles.alertaBajo : ''} ${isSelected ? styles.seleccionado : ''}`}
      style={planetaStyles}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={`${config.nombre} - ${estadisticas.cantidad || 0} elementos`}
    >
      {/* Anillo de órbita de partículas */}
      {efectosActivos && particulasActivas && (
        <div className={styles.anilloParticulas}>
          {[...Array(config.efectos.particulas.cantidad)].map((_, index) => (
            <div
              key={index}
              className={styles.particula}
              style={{
                backgroundColor: config.efectos.particulas.color,
                animationDelay: `${index * 0.7}s`,
                transform: `rotate(${index * (360 / config.efectos.particulas.cantidad)}deg)`
              }}
            />
          ))}
        </div>
      )}

      {/* Estela orbital */}
      {efectosActivos && (
        <div 
          className={styles.estela}
          style={{
            background: `linear-gradient(90deg, ${config.efectos.estela.color}, transparent)`,
            width: config.efectos.estela.longitud
          }}
        />
      )}

      {/* Núcleo del planeta */}
      <div className={styles.nucleo}>
        {/* Icono principal */}
        <div className={styles.icono}>
          {config.icono}
        </div>
        
        {/* Estadísticas opcionales */}
        {estadisticas.cantidad !== undefined && (
          <div className={styles.estadisticas}>
            <div className={styles.numero}>
              {estadisticas.cantidad}
            </div>
          </div>
        )}
      </div>

      {/* Efecto de brillo orgánico */}
      {efectosActivos && (
        <div 
          className={styles.brilloOrganico}
          style={{
            boxShadow: config.efectos.brilloOrganico.sombra,
            opacity: isHovered ? 0.8 : 0.6
          }}
        />
      )}

      {/* Efecto de respiración natural */}
      {efectosActivos && estado === 'normal' && (
        <div className={styles.respiracion} />
      )}

      {/* Indicador de alerta */}
      {estado === 'alertaBajo' && (
        <div className={styles.indicadorAlerta}>
          <div className={styles.pulsoAlerta} />
        </div>
      )}

      {/* Efecto de selección */}
      {isSelected && (
        <div className={styles.efectoSeleccion}>
          <div className={styles.anilloSeleccion} />
        </div>
      )}

      {/* Biomasa flotante (efecto especial) */}
      {efectosActivos && isHovered && (
        <div className={styles.biomasaFlotante}>
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className={styles.biomasaParticula}
              style={{
                animationDelay: `${index * 0.3}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlanetaIngredientes;
