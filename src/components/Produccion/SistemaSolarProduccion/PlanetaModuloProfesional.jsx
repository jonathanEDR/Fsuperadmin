import React from 'react';

// Importar versiones profesionales
import PlanetaIngredientesPro from './components/planetas/PlanetaIngredientes/PlanetaIngredientesPro';
import PlanetaRecetasPro from './components/planetas/PlanetaRecetas/PlanetaRecetasPro';
import PlanetaProduccionPro from './components/planetas/PlanetaProduccion/PlanetaProduccionPro';
import PlanetaMovimientosPro from './components/planetas/PlanetaMovimientos/PlanetaMovimientosPro';
import PlanetaCatalogoPro from './components/planetas/PlanetaCatalogo/PlanetaCatalogoPro';
import PlanetaResiduosPro from './components/planetas/PlanetaResiduos/PlanetaResiduosPro';

// Importar versiones originales para planetas que aún no han sido actualizados
import PlanetaMateriales from './components/planetas/PlanetaMateriales/PlanetaMateriales';
import PlanetaResiduos from './components/planetas/PlanetaResiduos/PlanetaResiduos';

// Importar el componente original como fallback
import PlanetaModuloOriginal from './PlanetaModulo';

/**
 * PlanetaModuloProfesional - Selector inteligente de planetas
 * 
 * Este componente reemplaza automáticamente los planetas con sus versiones profesionales
 * cuando están disponibles, manteniendo compatibilidad con las versiones originales.
 * 
 * ✅ PLANETAS PROFESIONALES DISPONIBLES:
 * - ingredientes → PlanetaIngredientesPro
 * - recetas → PlanetaRecetasPro  
 * - produccion → PlanetaProduccionPro
 * - movimientos → PlanetaMovimientosPro
 * 
 * 🚧 PLANETAS EN VERSIÓN ORIGINAL:
 * - materiales → PlanetaMateriales
 * - residuos → PlanetaResiduos
 */

const PlanetaModuloProfesional = ({ 
  tipo,
  configuracion,
  estadisticas = {},
  alertas = [],
  onHover,
  onClick,
  seleccionado = false,
  className = "",
  ...propsAdicionales
}) => {

  // Mapear estadísticas al formato esperado por las versiones profesionales
  const mapearEstadisticas = (tipo, estadisticas) => {
    const stats = estadisticas || {};
    
    switch (tipo) {
      case 'ingredientes':
        return {
          cantidad: stats.ingredientes || 0,
          stock_bajo: stats.ingredientesStockBajo || 0,
          estado: stats.estadoIngredientes || 'normal'
        };
      case 'recetas':
        return {
          activas: stats.recetasActivas || 0,
          completadas: stats.recetasCompletadas || 0,
          estado: stats.estadoRecetas || 'normal'
        };
      case 'produccion':
        return {
          ordenesActivas: stats.enProduccion || 0,
          progreso: stats.progresoProduccion || 0,
          estado: stats.estadoProduccion || 'normal'
        };
      case 'movimientos':
        return {
          transferencias: stats.totalMovimientos || 0,
          estado: stats.estadoMovimientos || 'normal'
        };
      case 'catalogo':
        return {
          total: stats.totalProductos || 0,
          activos: stats.productosActivos || 0,
          inactivos: stats.productosInactivos || 0,
          estado: stats.estadoCatalogo || 'normal'
        };
      case 'residuos':
        return {
          total: stats.totalResiduos || 0,
          reciclados: stats.residuosReciclados || 0,
          pendientes: stats.residuosPendientes || 0,
          estado: stats.estadoResiduos || 'normal'
        };
      default:
        return stats;
    }
  };

  // Verificar si hay alertas para este módulo
  const tieneAlertas = alertas.some(alerta => 
    alerta.modulo === tipo && alerta.activa
  );

  // Estadísticas mapeadas
  const estadisticasMapeadas = mapearEstadisticas(tipo, estadisticas);

  // Props comunes para todos los planetas profesionales
  const propsComunes = {
    onClick: (planetaId, data) => {
      if (onHover) onHover(planetaId);
      if (onClick) onClick(planetaId, data);
    },
    isSelected: seleccionado,
    hasAlert: tieneAlertas,
    disabled: false,
    estadisticas: estadisticasMapeadas,
    className,
    ...propsAdicionales
  };

  // Seleccionar el componente apropiado basado en el tipo
  switch (tipo) {
    case 'ingredientes':
      return (
        <PlanetaIngredientesPro
          {...propsComunes}
          estadoIngredientes={estadisticasMapeadas.estado}
        />
      );

    case 'recetas':
      return (
        <PlanetaRecetasPro
          {...propsComunes}
          estadoRecetas={estadisticasMapeadas.estado}
        />
      );

    case 'produccion':
      return (
        <PlanetaProduccionPro
          {...propsComunes}
          estadoProduccion={estadisticasMapeadas.estado}
          nivelProduccion={estadisticasMapeadas.progreso || 0}
        />
      );

    case 'movimientos':
      return (
        <PlanetaMovimientosPro
          {...propsComunes}
          estadoMovimientos={estadisticasMapeadas.estado}
          actividadRed={75} // Valor por defecto, puede ser dinámico
        />
      );

    case 'catalogo':
      return (
        <PlanetaCatalogoPro
          {...propsComunes}
          estadoCatalogo={estadisticasMapeadas.estado}
        />
      );

    case 'materiales':
      // Usar versión original hasta que tengamos la profesional
      return (
        <PlanetaMateriales
          onClick={(planetaId) => propsComunes.onClick(planetaId)}
          tieneAlerta={tieneAlertas}
          seleccionado={seleccionado}
          estadisticas={estadisticasMapeadas}
          className={className}
        />
      );

    case 'residuos':
      return (
        <PlanetaResiduosPro
          {...propsComunes}
          estadoResiduos={estadisticasMapeadas.estado}
        />
      );

    default:
      // Fallback al componente original para tipos no reconocidos
      console.warn(`🚧 Planeta tipo "${tipo}" no tiene versión profesional, usando original`);
      return (
        <PlanetaModuloOriginal
          tipo={tipo}
          configuracion={configuracion}
          estadisticas={estadisticas}
          alertas={alertas}
          onHover={onHover}
          onClick={onClick}
          seleccionado={seleccionado}
          className={className}
          {...propsAdicionales}
        />
      );
  }
};

export default PlanetaModuloProfesional;
