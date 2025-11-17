/**
 * Componente ListaAsistencias
 * Tabla con lista de asistencias filtradas
 * 
 * Features:
 * - Tabla responsive
 * - Acciones: ver, editar, eliminar
 * - Código de colores por estado
 * - Información de horarios
 * - Paginación
 */

import React, { useMemo } from 'react';
import { Edit2, Trash2, Clock, Calendar } from 'lucide-react';
import { asistenciaService } from '../../../services';

const ListaAsistencias = React.memo(({
  asistencias = [],
  onEditar,
  onEliminar,
  loading = false
}) => {
  
  // Ordenar asistencias por fecha descendente
  const asistenciasOrdenadas = useMemo(() => {
    return [...asistencias].sort((a, b) => 
      new Date(b.fecha) - new Date(a.fecha)
    );
  }, [asistencias]);
  
  // Formatear fecha (usando zona horaria de Perú)
  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Lima'
    });
  };
  
  // Formatear hora (usando zona horaria de Perú)
  const formatearHora = (fecha) => {
    if (!fecha) return '--:--';
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Lima'
    });
  };
  
  // Calcular duración
  const calcularDuracion = (horaEntrada, horaSalida) => {
    if (!horaEntrada || !horaSalida) return '--';
    
    const entrada = new Date(horaEntrada);
    const salida = new Date(horaSalida);
    const diff = salida - entrada;
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${horas}h ${minutos}m`;
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando asistencias...</span>
        </div>
      </div>
    );
  }
  
  if (asistenciasOrdenadas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center text-gray-500">
          <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">No hay asistencias registradas</p>
          <p className="text-sm mt-2">Use los filtros para buscar o registre una nueva asistencia</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gray-50 border-b">
        <h3 className="text-lg font-medium">
          Lista de Asistencias ({asistenciasOrdenadas.length})
        </h3>
      </div>
      
      {/* Tabla Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Colaborador
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entrada
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Salida
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duración
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {asistenciasOrdenadas.map((asistencia) => {
              const colores = asistenciaService.obtenerColorEstado(asistencia.estado);
              
              return (
                <tr key={asistencia._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {asistencia.colaboradorInfo?.nombre}
                      </div>
                      <div className="text-xs text-gray-500">
                        {asistencia.colaboradorInfo?.departamento}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatearFecha(asistencia.fecha)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatearHora(asistencia.horaEntrada)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatearHora(asistencia.horaSalida)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {calcularDuracion(asistencia.horaEntrada, asistencia.horaSalida)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`
                      inline-flex px-2 py-1 text-xs font-semibold rounded-full
                      ${colores.bg} ${colores.text} ${colores.border} border
                    `}>
                      {asistenciaService.obtenerEtiquetaEstado(asistencia.estado)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEditar(asistencia)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onEliminar(asistencia._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Vista Mobile */}
      <div className="md:hidden divide-y divide-gray-200">
        {asistenciasOrdenadas.map((asistencia) => {
          const colores = asistenciaService.obtenerColorEstado(asistencia.estado);
          
          return (
            <div key={asistencia._id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium text-gray-900">
                    {asistencia.colaboradorInfo?.nombre}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatearFecha(asistencia.fecha)}
                  </div>
                </div>
                <span className={`
                  inline-flex px-2 py-1 text-xs font-semibold rounded-full
                  ${colores.bg} ${colores.text}
                `}>
                  {asistenciaService.obtenerEtiquetaEstado(asistencia.estado)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock size={14} />
                  <span>Entrada: {formatearHora(asistencia.horaEntrada)}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock size={14} />
                  <span>Salida: {formatearHora(asistencia.horaSalida)}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => onEditar(asistencia)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                >
                  <Edit2 size={16} />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => onEliminar(asistencia._id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                >
                  <Trash2 size={16} />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

ListaAsistencias.displayName = 'ListaAsistencias';

export default ListaAsistencias;
