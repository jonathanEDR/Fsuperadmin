import React from 'react';
import { usePlanetEffects } from '../../../hooks/usePlanetEffects';
import { PLANETAS_CONFIG } from '../../../data/planetasConfig';
import styles from './PlanetaProduccionPro.module.css';

/**
 * PlanetaProduccionPro - Componente profesional del planeta de producción
 * Implementa el estilo industrial moderno con efectos mecánicos avanzados
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onClick - Función ejecutada al hacer clic
 * @param {boolean} props.isSelected - Estado de selección del planeta
 * @param {boolean} props.hasAlert - Indica si hay alertas pendientes
 * @param {string} props.estadoProduccion - Estado actual: 'normal', 'produciendo', 'completado', 'mantenimiento'
 * @param {boolean} props.disabled - Estado deshabilitado del planeta
 * @param {Object} props.estadisticas - Estadísticas del módulo de producción
 * @param {number} props.nivelProduccion - Nivel de producción (0-100)
 */
const PlanetaProduccionPro = ({ 
  onClick, 
  isSelected = false, 
  hasAlert = false, 
  estadoProduccion = 'normal',
  disabled = false,
  estadisticas = null,
  nivelProduccion = 0
}) => {
  // Configuración del planeta desde el config centralizado
  const planetConfig = PLANETAS_CONFIG.produccion;
  
  // Hook personalizado para efectos dinámicos
  const { efectos, isAnimating } = usePlanetEffects('produccion', estadoProduccion);

  /**
   * Maneja el clic en el planeta con validaciones
   */
  const handleClick = () => {
    if (disabled || !onClick) return;
    
    // Feedback haptico en dispositivos compatibles
    if (navigator.vibrate) {
      navigator.vibrate([30, 10, 30]); // Patrón industrial
    }
    
    onClick('produccion', { 
      estadoProduccion, 
      estadisticas, 
      nivelProduccion 
    });
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
    const clases = [styles.planetaProduccionPro];
    
    if (isSelected) clases.push(styles.seleccionado);
    if (hasAlert) clases.push(styles.conAlerta);
    if (disabled) clases.push(styles.deshabilitado);
    
    // Estados de producción específicos
    switch (estadoProduccion) {
      case 'produciendo':
        clases.push(styles.produciendo);
        break;
      case 'completado':
        clases.push(styles.completado);
        break;
      case 'mantenimiento':
        clases.push(styles.mantenimiento);
        break;
      default:
        // Estado normal, sin clase adicional
        break;
    }
    
    return clases.join(' ');
  };

  /**
   * Calcula los estilos dinámicos basados en efectos y nivel de producción
   */
  const getEstilosDinamicos = () => {
    const estilos = {
      background: planetConfig.gradient,
      ...efectos
    };

    // Ajustes dinámicos basados en nivel de producción
    if (nivelProduccion > 0) {
      const intensidad = Math.min(nivelProduccion / 100, 1);
      estilos.filter = `brightness(${1.1 + (intensidad * 0.3)}) saturate(${1.2 + (intensidad * 0.2)})`;
    }

    return estilos;
  };

  /**
   * Calcula el progreso de producción para la barra de progreso
   */
  const getProgresoProduccion = () => {
    if (estadisticas && estadisticas.progresoActual) {
      return Math.min(estadisticas.progresoActual, 100);
    }
    return nivelProduccion;
  };

  /**
   * Determina si debe mostrar efectos de maquinaria activa
   */
  const mostrarMaquinariaActiva = () => {
    return estadoProduccion === 'produciendo' || nivelProduccion > 50;
  };

  return (
    <div
      className={getClasesEstado()}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={getEstilosDinamicos()}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={`Planeta Producción - Estado: ${estadoProduccion} - Nivel: ${nivelProduccion}%${hasAlert ? ' - Tiene alertas' : ''}${disabled ? ' - Deshabilitado' : ''}`}
      aria-pressed={isSelected}
      aria-disabled={disabled}
      data-planeta="produccion"
      data-estado={estadoProduccion}
      data-nivel={nivelProduccion}
    >
      {/* Efectos mecánicos profesionales */}
      <div className={styles.efectosMecanicosPro} aria-hidden="true">
        <div className={styles.engranajeMetalicoPro}></div>
        <div className={styles.engranajeMetalicoPro}></div>
        <div className={styles.engranajeMetalicoPro}></div>
        <div className={styles.engranajeMetalicoPro}></div>
      </div>

      {/* Indicadores de progreso elegantes */}
      {(estadoProduccion === 'produciendo' || nivelProduccion > 0) && (
        <div className={styles.indicadoresProgresoPro} aria-hidden="true">
          <div className={styles.barraProgresoPro}>
            <div 
              className={styles.progresoActivoPro}
              style={{
                width: `${getProgresoProduccion()}%`
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Vapor industrial (solo cuando está produciendo) */}
      {estadoProduccion === 'produciendo' && (
        <div className={styles.vaporIndustrialPro} aria-hidden="true">
          <div className={styles.chimeneavaporPro}></div>
          <div className={styles.chimeneavaporPro}></div>
          <div className={styles.chimeneavaporPro}></div>
        </div>
      )}

      {/* Icono del planeta con efectos industriales */}
      <div className={styles.iconoPlanetaIndustrialPro} aria-hidden="true">
        {planetConfig.icono}
      </div>

      {/* Efecto de maquinaria activa (solo cuando está en funcionamiento) */}
      {mostrarMaquinariaActiva() && (
        <div className={styles.efectoMaquinariaPro} aria-hidden="true"></div>
      )}

      {/* Brillo metálico refinado */}
      <div className={styles.brilloMetalicoPro} aria-hidden="true"></div>

      {/* Indicador de estadísticas (si están disponibles) */}
      {estadisticas && estadisticas.ordenesActivas > 0 && (
        <div 
          className={styles.indicadorEstadisticasPro}
          aria-label={`${estadisticas.ordenesActivas} órdenes de producción activas`}
        >
          <span className={styles.numeroEstadisticasPro}>
            {estadisticas.ordenesActivas}
          </span>
        </div>
      )}

      {/* Indicador de alerta profesional */}
      {hasAlert && (
        <div 
          className={styles.indicadorAlerta}
          aria-label="Tiene alertas de producción pendientes"
        >
          <div className={styles.pulsoAlerta}></div>
        </div>
      )}

      {/* Indicador de nivel de producción */}
      {nivelProduccion > 0 && (
        <div 
          className={styles.indicadorNivel}
          aria-label={`Nivel de producción: ${nivelProduccion}%`}
          style={{
            '--nivel-produccion': `${nivelProduccion}%`
          }}
        >
          <div className={styles.barritaNivel}></div>
        </div>
      )}
    </div>
  );
};

export default PlanetaProduccionPro;
