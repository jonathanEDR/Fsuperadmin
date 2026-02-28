/**
 * Card de resumen de asistencias del colaborador
 */

import React from 'react';
import { Calendar, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

const AsistenciaResumenCard = React.memo(({ estadisticasAsistencia, onVerDetalle }) => {

  if (!estadisticasAsistencia) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={16} className="text-purple-500" />
          <h4 className="text-sm font-semibold text-gray-700">Asistencias del Mes</h4>
        </div>
        <p className="text-xs text-gray-400">No hay datos de asistencia disponibles</p>
      </div>
    );
  }

  const { total = 0, presentes = 0, ausentes = 0, tardanzas = 0, permisos = 0 } = estadisticasAsistencia;
  const pct = total > 0 ? Math.round((presentes + tardanzas) / total * 100) : 0;

  const stats = [
    { label: 'Presentes', value: presentes, icon: CheckCircle, color: 'text-emerald-600' },
    { label: 'Tardanzas', value: tardanzas, icon: Clock, color: 'text-orange-500' },
    { label: 'Ausentes', value: ausentes, icon: XCircle, color: 'text-red-500' },
    { label: 'Permisos', value: permisos, icon: FileText, color: 'text-blue-500' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-purple-500" />
          <h4 className="text-sm font-semibold text-gray-700">Asistencias del Mes</h4>
        </div>
        {onVerDetalle && (
          <button onClick={onVerDetalle}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 transition-all">
            Ver detalle
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="text-center">
              <Icon size={16} className={`${s.color} mx-auto mb-1`} />
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Barra de asistencia */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-gray-500">Porcentaje de Asistencia</span>
          <span className={`text-xs font-bold ${pct >= 90 ? 'text-emerald-600' : pct >= 75 ? 'text-amber-600' : 'text-red-500'}`}>
            {pct}%
          </span>
        </div>
        <div className="w-full bg-gray-200/60 rounded-full h-2">
          <div className={`h-2 rounded-full transition-all duration-300 ${
            pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-500' : 'bg-red-500'
          }`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-1.5">Basado en {total} registros del mes actual</p>
      </div>
    </div>
  );
});

AsistenciaResumenCard.displayName = 'AsistenciaResumenCard';
export default AsistenciaResumenCard;