import React, { useState, useEffect } from 'react';
import { PLANETAS_CONFIG } from '../../../data/planetasConfig';
import styles from './PlanetaMateriales.module.css';

const PlanetaMateriales = ({ 
  onClick,
  estadisticas = {},
  estado = 'normal', // normal, mantenimiento, activo
  responsive = 'desktop',
  efectosActivos = true,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(estado === 'seleccionado');
  const [chispasActivas, setChispasActivas] = useState(efectosActivos);
  const [engranajeRotation, setEngranajeRotation] = useState(0);

  const config = PLANETAS_CONFIG.materiales;

  // Efecto para rotación de engranajes
  useEffect(() => {
    if (!efectosActivos) return;
    
    const interval = setInterval(() => {
      setEngranajeRotation(prev => (prev + 2) % 360);
    }, 100);

    return () => clearInterval(interval);
  }, [efectosActivos]);

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
    boxShadow: config.efectos.brilloMetalico.sombra,
    transform: isHovered 
      ? `scale(${config.tamaños.hover}) rotateY(-10deg)` 
      : isSelected 
        ? `scale(${config.tamaños.seleccionado})` 
        : 'scale(1)',
    filter: `brightness(${config.estados[estado]?.brillo || 1}) saturate(${config.estados[estado]?.saturacion || 1}) ${config.estados[estado]?.filtro || ''}`
  };

  const handleClick = () => {
    if (onClick) {
      onClick('materiales');
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
      className={`${styles.planetaMateriales} ${className} ${estado === 'mantenimiento' ? styles.mantenimiento : ''} ${estado === 'activo' ? styles.activo : ''} ${isSelected ? styles.seleccionado : ''}`}
      style={planetaStyles}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={`${config.nombre} - ${estadisticas.cantidad || 0} elementos`}
    >
      {/* Anillo de engranajes */}
      {efectosActivos && (
        <div className={styles.anilloEngranajes}>
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className={styles.engranaje}
              style={{
                transform: `rotate(${index * 90 + engranajeRotation}deg)`,
                animationDelay: `${index * 0.2}s`
              }}
            >
              ⚙️
            </div>
          ))}
        </div>
      )}

      {/* Chispas metálicas */}
      {efectosActivos && chispasActivas && (
        <div className={styles.chispasMetalicas}>
          {[...Array(config.efectos.chispas.cantidad)].map((_, index) => (
            <div
              key={index}
              className={styles.chispa}
              style={{
                backgroundColor: config.efectos.chispas.color,
                animationDelay: `${index * 0.8}s`,
                transform: `rotate(${index * 120}deg)`
              }}
            />
          ))}
        </div>
      )}

      {/* Estela industrial */}
      {efectosActivos && (
        <div 
          className={styles.estelaIndustrial}
          style={{
            background: `linear-gradient(90deg, rgba(59, 130, 246, 0.6), transparent)`,
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

      {/* Efecto de brillo metálico */}
      {efectosActivos && (
        <div 
          className={styles.brilloMetalico}
          style={{
            boxShadow: config.efectos.brilloMetalico.sombra,
            opacity: isHovered ? 0.9 : 0.7
          }}
        />
      )}

      {/* Reflejo metálico */}
      {efectosActivos && (
        <div className={styles.reflejoMetalico} />
      )}

      {/* Indicador de mantenimiento */}
      {estado === 'mantenimiento' && (
        <div className={styles.indicadorMantenimiento}>
          <div className={styles.iconoMantenimiento}>🔧</div>
          <div className={styles.pulsoMantenimiento} />
        </div>
      )}

      {/* Indicador de actividad */}
      {estado === 'activo' && (
        <div className={styles.indicadorActivo}>
          <div className={styles.pulsoActivo} />
        </div>
      )}

      {/* Efecto de selección */}
      {isSelected && (
        <div className={styles.efectoSeleccion}>
          <div className={styles.anilloSeleccion} />
        </div>
      )}

      {/* Vapor industrial (efecto especial) */}
      {efectosActivos && isHovered && (
        <div className={styles.vaporIndustrial}>
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className={styles.vaporParticula}
              style={{
                animationDelay: `${index * 0.5}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Efectos de forja en hover */}
      {efectosActivos && isHovered && (
        <div className={styles.efectoForja}>
          <div className={styles.forjaGlow} />
          <div className={styles.forjaChispas}>
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className={styles.forjaChispa}
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanetaMateriales;
