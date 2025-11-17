/**
 * Card de resumen de asistencias del colaborador
 * Muestra estadísticas rápidas del mes actual
 */

import React from 'react';
import { Calendar, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

const AsistenciaResumenCard = React.memo(({ 
  estadisticasAsistencia,
  onVerDetalle 
}) => {
  
  if (!estadisticasAsistencia) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-purple-600" size={24} />
            <h4 className="text-lg font-semibold text-gray-800">
              Asistencias del Mes
            </h4>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          No hay datos de asistencia disponibles
        </p>
      </div>
    );
  }
  
  const {
    total = 0,
    presentes = 0,
    ausentes = 0,
    tardanzas = 0,
    permisos = 0
  } = estadisticasAsistencia;
  
  const porcentajeAsistencia = total > 0 
    ? ((presentes + tardanzas) / total * 100).toFixed(0) 
    : 0;
  
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="text-purple-600" size={24} />
          <h4 className="text-lg font-semibold text-gray-800">
            Asistencias del Mes
          </h4>
        </div>
        {onVerDetalle && (
          <button
            onClick={onVerDetalle}
            className="text-sm text-purple-600 hover:text-purple-800 font-medium underline"
          >
            Ver detalle completo
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        {/* Presentes */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="text-green-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-green-700">{presentes}</div>
          <div className="text-xs text-gray-600">Presentes</div>
        </div>
        
        {/* Tardanzas */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Clock className="text-orange-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-orange-700">{tardanzas}</div>
          <div className="text-xs text-gray-600">Tardanzas</div>
        </div>
        
        {/* Ausentes */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <XCircle className="text-red-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-red-700">{ausentes}</div>
          <div className="text-xs text-gray-600">Ausentes</div>
        </div>
        
        {/* Permisos */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <FileText className="text-blue-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-blue-700">{permisos}</div>
          <div className="text-xs text-gray-600">Permisos</div>
        </div>
      </div>
      
      {/* Barra de porcentaje de asistencia */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Porcentaje de Asistencia
          </span>
          <span className={`text-sm font-bold ${
            porcentajeAsistencia >= 90 ? 'text-green-600' :
            porcentajeAsistencia >= 75 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {porcentajeAsistencia}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              porcentajeAsistencia >= 90 ? 'bg-green-500' :
              porcentajeAsistencia >= 75 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${porcentajeAsistencia}%` }}
          ></div>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-500 text-center">
        Basado en {total} registros del mes actual
      </div>
    </div>
  );
});

AsistenciaResumenCard.displayName = 'AsistenciaResumenCard';

export default AsistenciaResumenCard;
