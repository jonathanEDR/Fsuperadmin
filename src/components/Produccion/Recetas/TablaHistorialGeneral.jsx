import React, { useState } from 'react';
import { Utensils, FlaskConical, CheckCircle, HelpCircle, FileText, Clock, FlaskRound, RotateCcw, XCircle } from 'lucide-react';
import { recetaService } from '../../../services/recetaService';
import { formatearFecha as formatearFechaUtil } from '../../../utils/fechaHoraUtils';

const TablaHistorialGeneral = ({ recetas, onActualizar }) => {
  const [loading, setLoading] = useState(false);

  // Función para obtener info de fase
  const getFaseInfo = (fase) => {
    switch (fase) {
      case 'preparado':
        return { icon: <Utensils size={14} />, nombre: 'Preparado', color: 'text-blue-600 bg-blue-50' };
      case 'intermedio':
        return { icon: <FlaskConical size={14} />, nombre: 'Intermedio', color: 'text-yellow-600 bg-yellow-50' };
      case 'terminado':
        return { icon: <CheckCircle size={14} />, nombre: 'Terminado', color: 'text-green-600 bg-green-50' };
      default:
        return { icon: <HelpCircle size={14} />, nombre: 'Desconocido', color: 'text-gray-600 bg-gray-50' };
    }
  };

  // Formatear fecha usando utilidades robustas de Perú
  const formatearFecha = (fecha) => {
    if (!fecha) return 'En progreso';
    return formatearFechaUtil(fecha);
  };

  // Calcular duración usando zona horaria de Perú
  const calcularDuracion = (fechaInicio, fechaFinalizacion) => {
    if (!fechaInicio) return '';
    
    const inicio = new Date(fechaInicio);
    const fin = fechaFinalizacion ? new Date(fechaFinalizacion) : new Date();
    const duracion = fin - inicio;
    
    const dias = Math.floor(duracion / (1000 * 60 * 60 * 24));
    const horas = Math.floor((duracion % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((duracion % (1000 * 60 * 60)) / (1000 * 60));
    
    if (dias > 0) return `${dias}d ${horas}h`;
    if (horas > 0) return `${horas}h ${minutos}m`;
    return `${minutos}m`;
  };

  // Obtener estado del proceso con color
  const getEstadoInfo = (estado) => {
    switch (estado) {
      case 'en_proceso':
        return { label: 'En Proceso', color: 'bg-blue-100 text-blue-800' };
      case 'completado':
        return { label: 'Completado', color: 'bg-green-100 text-green-800' };
      case 'pausado':
        return { label: 'Pausado', color: 'bg-yellow-100 text-yellow-800' };
      default:
        return { label: 'Borrador', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Recopilar todas las fases de todas las recetas
  const obtenerTodasLasFases = () => {
    const todasLasFases = [];
    
    recetas.forEach(receta => {
      if (receta.historicoFases && receta.historicoFases.length > 0) {
        receta.historicoFases.forEach(fase => {
          todasLasFases.push({
            ...fase,
            recetaNombre: receta.nombre,
            recetaId: receta._id,
            estadoProceso: receta.estadoProceso,
            faseActualReceta: receta.categoria || receta.faseActual
          });
        });
      }
    });
    
    // Ordenar por fecha más reciente
    return todasLasFases.sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));
  };

  // Función para reiniciar una receta específica
  const handleReiniciarReceta = async (recetaId, recetaNombre) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de que quieres reiniciar la receta "${recetaNombre}" al estado preparado?\n\nEsta acción no se puede deshacer.`
    );
    
    if (!confirmacion) return;

    try {
      setLoading(true);
      await recetaService.reiniciarReceta(recetaId, 'Reinicio desde historial general');
      onActualizar(); // Callback para actualizar las recetas
      alert(`Receta "${recetaNombre}" reiniciada exitosamente`);
    } catch (error) {
      console.error('Error al reiniciar receta:', error);
      alert(`Error al reiniciar receta: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const todasLasFases = obtenerTodasLasFases();

  if (todasLasFases.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="text-gray-300 mb-4"><FileText size={48} /></div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Sin Historial de Fases
        </h3>
        <p className="text-gray-500">
          Cuando las recetas inicien su proceso de producción, aparecerá el historial aquí
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText size={20} className="text-gray-500" /> Historial General de Fases
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Registro completo de todas las transiciones de fase ({todasLasFases.length} entradas)
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fase
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Inicio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Fin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duración
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {todasLasFases.map((fase, index) => {
              const faseInfo = getFaseInfo(fase.fase);
              const estadoInfo = getEstadoInfo(fase.estadoProceso);
              const esActiva = !fase.fechaFinalizacion;
              const duracion = calcularDuracion(fase.fechaInicio, fase.fechaFinalizacion);
              const puedeReiniciar = fase.estadoProceso !== 'borrador';

              return (
                <tr 
                  key={`${fase.recetaId}-${index}`} 
                  className={esActiva ? 'bg-blue-50' : 'hover:bg-gray-50'}
                >
                  {/* Receta */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {fase.recetaNombre}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {fase.recetaId.slice(-6)}
                    </div>
                  </td>

                  {/* Fase */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-sm font-medium ${faseInfo.color}`}>
                      {faseInfo.icon}
                      {faseInfo.nombre}
                      {esActiva && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                          Activa
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${estadoInfo.color}`}>
                      {estadoInfo.label}
                    </span>
                  </td>

                  {/* Fecha Inicio */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatearFecha(fase.fechaInicio)}
                  </td>

                  {/* Fecha Fin */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {fase.fechaFinalizacion ? formatearFecha(fase.fechaFinalizacion) : (
                      <span className="text-blue-600 font-medium">En progreso</span>
                    )}
                  </td>

                  {/* Duración */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-gray-400" />
                      {duracion}
                    </div>
                  </td>

                  {/* Notas */}
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                    <div className="truncate" title={fase.notas || 'Sin notas'}>
                      {fase.notas || <span className="text-gray-400 italic">Sin notas</span>}
                    </div>
                    {fase.ingredientesAgregados && fase.ingredientesAgregados.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <FlaskRound size={12} /> {fase.ingredientesAgregados.length} ingredientes extra
                      </div>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {puedeReiniciar && (
                      <button
                        onClick={() => handleReiniciarReceta(fase.recetaId, fase.recetaNombre)}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3 py-1 border border-orange-200 rounded-xl text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Reiniciar receta al estado preparado"
                      >
                        <RotateCcw size={12} /> Reiniciar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer con estadísticas */}
      <div className="px-6 py-4 bg-gray-50/60 border-t border-gray-100">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Total de fases:</span> {todasLasFases.length}
          </div>
          <div>
            <span className="font-medium">Fases activas:</span> {todasLasFases.filter(f => !f.fechaFinalizacion).length}
          </div>
          <div>
            <span className="font-medium">Recetas con historial:</span> {new Set(todasLasFases.map(f => f.recetaId)).size}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablaHistorialGeneral;
