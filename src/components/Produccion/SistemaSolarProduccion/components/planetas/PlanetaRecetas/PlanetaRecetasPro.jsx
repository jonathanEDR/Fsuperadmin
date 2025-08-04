import React from 'react';
import { usePlanetEffects } from '../../../hooks/usePlanetEffects';
import { PLANETAS_CONFIG } from '../../../data/planetasConfig';
import styles from './PlanetaRecetasPro.module.css';

/**
 * PlanetaRecetasPro - Componente profesional del planeta de recetas
 * Implementa el estilo culinario avanzado con efectos de cocción refinados
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onClick - Función ejecutada al hacer clic
 * @param {boolean} props.isSelected - Estado de selección del planeta
 * @param {boolean} props.hasAlert - Indica si hay alertas pendientes
 * @param {string} props.estadoRecetas - Estado actual: 'normal', 'cocinando', 'completado'
 * @param {boolean} props.disabled - Estado deshabilitado del planeta
 * @param {Object} props.estadisticas - Estadísticas del módulo de recetas
 */
const PlanetaRecetasPro = ({ 
  onClick, 
  isSelected = false, 
  hasAlert = false, 
  estadoRecetas = 'normal',
  disabled = false,
  estadisticas = null
}) => {
  // Configuración del planeta desde el config centralizado
  const planetConfig = PLANETAS_CONFIG.recetas;
  
  // Hook personalizado para efectos dinámicos
  const { efectos, isAnimating } = usePlanetEffects('recetas', estadoRecetas);

  /**
   * Maneja el clic en el planeta con validaciones
   */
  const handleClick = () => {
    if (disabled || !onClick) return;
    
    // Feedback haptico en dispositivos compatibles
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    onClick('recetas', { estadoRecetas, estadisticas });
  };

  /**
   * Maneja la navegación por teclado
   */
  const handleKeyDown = (event) => {
    if (disabled) return;
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  /**
   * Genera las clases CSS dinámicas basadas en el estado
   */
  const getClasesEstado = () => {
    const clases = [styles.planetaRecetasPro];
    
    if (isSelected) clases.push(styles.seleccionado);
    if (hasAlert) clases.push(styles.conAlerta);
    if (disabled) clases.push(styles.deshabilitado);
    
    // Estados culinarios específicos
    switch (estadoRecetas) {
      case 'cocinando':
        clases.push(styles.cocinando);
        break;
      case 'completado':
        clases.push(styles.completado);
        break;
      default:
        // Estado normal, sin clase adicional
        break;
    }
    
    return clases.join(' ');
  };

  /**
   * Calcula los estilos dinámicos basados en efectos y estadísticas
   */
  const getEstilosDinamicos = () => {
    const estilos = {
      background: planetConfig.gradient,
      ...efectos
    };

    // Ajustes dinámicos basados en estadísticas
    if (estadisticas) {
      const { recetasActivas = 0, recetasCompletadas = 0 } = estadisticas;
      
      // Intensidad de efectos basada en actividad
      if (recetasActivas > 0) {
        estilos.filter = `brightness(${1.1 + (recetasActivas * 0.05)}) saturate(${1.2 + (recetasActivas * 0.1)})`;
      }
    }

    return estilos;
  };

  return (
    <div
      className={getClasesEstado()}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={getEstilosDinamicos()}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={`Planeta Recetas - Estado: ${estadoRecetas}${hasAlert ? ' - Tiene alertas' : ''}${disabled ? ' - Deshabilitado' : ''}`}
      aria-pressed={isSelected}
      aria-disabled={disabled}
      data-planeta="recetas"
      data-estado={estadoRecetas}
    >
      {/* Efectos de cocción profesionales */}
      <div className={styles.efectosCoccionPro} aria-hidden="true">
        <div className={styles.ondaCalorPro}></div>
        <div className={styles.ondaCalorPro}></div>
        <div className={styles.ondaCalorPro}></div>
      </div>

      {/* Partículas doradas refinadas */}
      <div className={styles.particulasDoradasPro} aria-hidden="true">
        <div className={styles.particulaDoradaPro}></div>
        <div className={styles.particulaDoradaPro}></div>
        <div className={styles.particulaDoradaPro}></div>
        <div className={styles.particulaDoradaPro}></div>
        <div className={styles.particulaDoradaPro}></div>
      </div>

      {/* Vapor de cocción (solo cuando está cocinando) */}
      {estadoRecetas === 'cocinando' && (
        <div className={styles.vaporCoccionPro} aria-hidden="true">
          <div className={styles.vaporPro}></div>
          <div className={styles.vaporPro}></div>
          <div className={styles.vaporPro}></div>
        </div>
      )}

      {/* Icono del planeta con efectos profesionales */}
      <div className={styles.iconoPlanetaPro} aria-hidden="true">
        {planetConfig.icono}
      </div>

      {/* Efecto de completado (solo cuando está completado) */}
      {estadoRecetas === 'completado' && (
        <div className={styles.efectoCompletadoPro} aria-hidden="true">
          <div className={styles.anilloCompletadoPro}></div>
        </div>
      )}

      {/* Brillo especial refinado */}
      <div className={styles.brilloRecetasPro} aria-hidden="true"></div>

      {/* Indicador de estadísticas (si están disponibles) */}
      {estadisticas && estadisticas.recetasActivas > 0 && (
        <div 
          className={styles.indicadorEstadisticas}
          aria-label={`${estadisticas.recetasActivas} recetas activas`}
        >
          <span className={styles.numeroEstadisticas}>
            {estadisticas.recetasActivas}
          </span>
        </div>
      )}

      {/* Indicador de alerta profesional */}
      {hasAlert && (
        <div 
          className={styles.indicadorAlerta}
          aria-label="Tiene alertas pendientes"
        >
          <div className={styles.pulsoAlerta}></div>
        </div>
      )}
    </div>
  );
};

export default PlanetaRecetasPro;
