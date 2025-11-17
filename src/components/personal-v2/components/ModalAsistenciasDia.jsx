/**
 * Componente ModalAsistenciasDia
 * Modal que muestra todas las asistencias de un día específico
 * Se usa en la vista calendario para ver quiénes están presentes
 * 
 * Features:
 * - Lista de colaboradores del día
 * - Muestra estado de cada asistencia
 * - Horarios de entrada/salida
 * - Opción de editar cada registro
 * - Responsive design
 */

import React from 'react';
import { X, Clock, Edit2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { asistenciaService } from '../../../services';

const ModalAsistenciasDia = React.memo(({
  isOpen,
  fecha,
  asistencias = [],
  onClose,
  onEditar
}) => {
  
  if (!isOpen) return null;
  
  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Formatear hora
  const formatearHora = (fecha) => {
    if (!fecha) return '--:--';
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Obtener icono según estado
  const obtenerIconoEstado = (estado) => {
    switch (estado) {
      case 'presente':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'tardanza':
        return <Clock size={20} className="text-yellow-600" />;
      case 'ausente':
      case 'falta_injustificada':
        return <XCircle size={20} className="text-red-600" />;
      case 'permiso':
      case 'falta_justificada':
        return <AlertCircle size={20} className="text-blue-600" />;
      default:
        return <CheckCircle size={20} className="text-gray-400" />;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold">Asistencias del Día</h2>
            <p className="text-sm text-blue-100 mt-1 capitalize">
              {formatearFecha(fecha)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {asistencias.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Clock size={48} className="mx-auto" />
              </div>
              <p className="text-gray-600 text-lg font-medium">
                No hay asistencias registradas
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Aún no se han registrado asistencias para este día
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Total: <span className="font-semibold">{asistencias.length}</span> {asistencias.length === 1 ? 'colaborador' : 'colaboradores'}
              </p>
              
              {asistencias.map((asistencia) => {
                const colores = asistenciaService.obtenerColorEstado(asistencia.estado);
                
                return (
                  <div
                    key={asistencia._id}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      
                      {/* Info colaborador y estado */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {obtenerIconoEstado(asistencia.estado)}
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {asistencia.colaboradorInfo?.nombre || 'Sin nombre'}
                            </h4>
                            {asistencia.colaboradorInfo?.departamento && (
                              <p className="text-sm text-gray-500">
                                {asistencia.colaboradorInfo.departamento}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Horarios */}
                        <div className="flex flex-wrap gap-4 text-sm mt-3">
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-gray-400" />
                            <span className="text-gray-600">Entrada:</span>
                            <span className="font-medium text-gray-900">
                              {formatearHora(asistencia.horaEntrada)}
                            </span>
                          </div>
                          
                          {asistencia.horaSalida && (
                            <div className="flex items-center gap-2">
                              <Clock size={16} className="text-gray-400" />
                              <span className="text-gray-600">Salida:</span>
                              <span className="font-medium text-gray-900">
                                {formatearHora(asistencia.horaSalida)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Estado badge */}
                        <div className="mt-3">
                          <span className={`
                            inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full
                            ${colores.bg} ${colores.text} ${colores.border} border
                          `}>
                            {asistenciaService.obtenerEtiquetaEstado(asistencia.estado)}
                          </span>
                        </div>
                        
                        {/* Permiso info */}
                        {asistencia.tienePermiso && asistencia.motivoPermiso && (
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                            <p className="text-blue-800">
                              <span className="font-medium">Motivo:</span> {asistencia.motivoPermiso}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Botón editar */}
                      <button
                        onClick={() => {
                          onEditar(asistencia);
                          onClose();
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        <Edit2 size={16} />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
});

ModalAsistenciasDia.displayName = 'ModalAsistenciasDia';

export default ModalAsistenciasDia;
