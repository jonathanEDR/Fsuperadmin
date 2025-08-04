import React from 'react';
import { usePlanetEffects } from '../../../hooks/usePlanetEffects';
import { PLANETAS_CONFIG } from '../../../data/planetasConfig';
import styles from './PlanetaMovimientosPro.module.css';

/**
 * PlanetaMovimientosPro - Componente profesional del planeta de movimientos
 * Implementa el estilo dinámico fluido con efectos de flujo de datos avanzados
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onClick - Función ejecutada al hacer clic
 * @param {boolean} props.isSelected - Estado de selección del planeta
 * @param {boolean} props.hasAlert - Indica si hay alertas pendientes
 * @param {string} props.estadoMovimientos - Estado actual: 'normal', 'transfiriendo', 'sincronizando', 'completado'
 * @param {boolean} props.disabled - Estado deshabilitado del planeta
 * @param {Object} props.estadisticas - Estadísticas del módulo de movimientos
 * @param {number} props.actividadRed - Nivel de actividad de red (0-100)
 */
const PlanetaMovimientosPro = ({ 
  onClick, 
  isSelected = false, 
  hasAlert = false, 
  estadoMovimientos = 'normal',
  disabled = false,
  estadisticas = null,
  actividadRed = 0
}) => {
  // Configuración del planeta desde el config centralizado
  const planetConfig = PLANETAS_CONFIG.movimientos;
  
  // Hook personalizado para efectos dinámicos
  const { efectos, isAnimating } = usePlanetEffects('movimientos', estadoMovimientos);

  /**
   * Maneja el clic en el planeta con validaciones
   */
  const handleClick = () => {
    if (disabled || !onClick) return;
    
    // Feedback haptico en dispositivos compatibles
    if (navigator.vibrate) {
      navigator.vibrate([20, 5, 20, 5, 20]); // Patrón dinámico
    }
    
    onClick('movimientos', { 
      estadoMovimientos, 
      estadisticas, 
      actividadRed 
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
    const clases = [styles.planetaMovimientosPro];
    
    if (isSelected) clases.push(styles.seleccionado);
    if (hasAlert) clases.push(styles.conAlerta);
    if (disabled) clases.push(styles.deshabilitado);
    
    // Estados de movimiento específicos
    switch (estadoMovimientos) {
      case 'transfiriendo':
        clases.push(styles.transfiriendo);
        break;
      case 'sincronizando':
        clases.push(styles.sincronizando);
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
   * Calcula los estilos dinámicos basados en efectos y actividad de red
   */
  const getEstilosDinamicos = () => {
    const estilos = {
      background: planetConfig.gradient,
      ...efectos
    };

    // Ajustes dinámicos basados en actividad de red
    if (actividadRed > 0) {
      const intensidad = Math.min(actividadRed / 100, 1);
      estilos.filter = `brightness(${1.1 + (intensidad * 0.3)}) saturate(${1.2 + (intensidad * 0.2)})`;
    }

    return estilos;
  };

  /**
   * Determina si debe mostrar efectos de transferencia activa
   */
  const mostrarTransferenciaActiva = () => {
    return estadoMovimientos === 'transfiriendo' || actividadRed > 30;
  };

  /**
   * Determina si debe mostrar efectos de sincronización
   */
  const mostrarSincronizacion = () => {
    return estadoMovimientos === 'sincronizando' || actividadRed > 60;
  };

  return (
    <div
      className={getClasesEstado()}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={getEstilosDinamicos()}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={`Planeta Movimientos - Estado: ${estadoMovimientos} - Actividad: ${actividadRed}%${hasAlert ? ' - Tiene alertas' : ''}${disabled ? ' - Deshabilitado' : ''}`}
      aria-pressed={isSelected}
      aria-disabled={disabled}
      data-planeta="movimientos"
      data-estado={estadoMovimientos}
      data-actividad={actividadRed}
    >
      {/* Flujos de datos profesionales */}
      <div className={styles.flujosDatosPro} aria-hidden="true">
        <div className={styles.lineaFlujoPro}></div>
        <div className={styles.lineaFlujoPro}></div>
        <div className={styles.lineaFlujoPro}></div>
        <div className={styles.lineaFlujoPro}></div>
      </div>

      {/* Transferencias visuales mejoradas */}
      {mostrarTransferenciaActiva() && (
        <div className={styles.transferenciasVisualesPro} aria-hidden="true">
          <div className={styles.paqueteDatosPro}></div>
          <div className={styles.paqueteDatosPro}></div>
          <div className={styles.paqueteDatosPro}></div>
        </div>
      )}

      {/* Efectos de conexión avanzados */}
      {mostrarSincronizacion() && (
        <div className={styles.efectosConexionPro} aria-hidden="true">
          <div className={styles.redConexionPro}></div>
          <div className={styles.redConexionPro}></div>
          <div className={styles.redConexionPro}></div>
        </div>
      )}

      {/* Icono del planeta con efectos dinámicos */}
      <div className={styles.iconoPlanetaDinamicoPro} aria-hidden="true">
        {planetConfig.icono}
      </div>

      {/* Indicadores de actividad refinados */}
      {actividadRed > 0 && (
        <div 
          className={styles.indicadoresActividadPro}
          aria-label={`Actividad de red: ${actividadRed}%`}
        >
          <div className={styles.puntosActividadPro}></div>
        </div>
      )}

      {/* Brillo dinámico refinado */}
      <div className={styles.brilloDinamicoPro} aria-hidden="true"></div>

      {/* Indicador de estadísticas (si están disponibles) */}
      {estadisticas && estadisticas.transferencias > 0 && (
        <div 
          className={styles.indicadorEstadisticasPro}
          aria-label={`${estadisticas.transferencias} transferencias activas`}
        >
          <span className={styles.numeroEstadisticasPro}>
            {estadisticas.transferencias}
          </span>
        </div>
      )}

      {/* Indicador de alerta profesional */}
      {hasAlert && (
        <div 
          className={styles.indicadorAlerta}
          aria-label="Tiene alertas de movimientos pendientes"
        >
          <div className={styles.pulsoAlerta}></div>
        </div>
      )}

      {/* Medidor de actividad de red */}
      {actividadRed > 0 && (
        <div 
          className={styles.medidorActividad}
          aria-label={`Actividad de red: ${actividadRed}%`}
          style={{
            '--actividad-red': `${actividadRed}%`
          }}
        >
          <div className={styles.barraActividad}></div>
        </div>
      )}
    </div>
  );
};

export default PlanetaMovimientosPro;
