/**
 * Componente ReporteAsistencias
 * Vista de reporte estadístico mensual de asistencias
 * 
 * Features:
 * - Resumen estadístico del mes
 * - Desglose por tipo de estado
 * - Porcentajes y gráficos visuales
 * - Cards informativos
 */

import React, { useMemo } from 'react';
import { 
  CheckCircle, XCircle, Clock, FileText, 
  Calendar, TrendingUp, AlertTriangle 
} from 'lucide-react';
import { asistenciaService } from '../../../services';

const ReporteAsistencias = React.memo(({
  asistencias = [],
  filtros = {},
  loading = false
}) => {
  
  // Contar domingos en el mes (definir ANTES de useMemo)
  const contarDomingos = (año, mes) => {
    let count = 0;
    const diasEnMes = new Date(año, mes, 0).getDate();
    
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(año, mes - 1, dia);
      if (fecha.getDay() === 0) count++;
    }
    
    return count;
  };
  
  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    const total = asistencias.length;
    
    if (total === 0) {
      return {
        total: 0,
        presentes: 0,
        ausentes: 0,
        tardanzas: 0,
        permisos: 0,
        faltasJustificadas: 0,
        faltasInjustificadas: 0,
        porcentajeAsistencia: 0,
        porcentajeTardanzas: 0,
        diasLaborales: 0
      };
    }
    
    const presentes = asistencias.filter(a => a.estado === 'presente').length;
    const ausentes = asistencias.filter(a => a.estado === 'ausente').length;
    const tardanzas = asistencias.filter(a => a.estado === 'tardanza').length;
    const permisos = asistencias.filter(a => a.estado === 'permiso').length;
    const faltasJustificadas = asistencias.filter(a => a.estado === 'falta_justificada').length;
    const faltasInjustificadas = asistencias.filter(a => a.estado === 'falta_injustificada').length;
    
    // Calcular días laborales del mes (excluyendo domingos por ahora)
    const { año, mes } = filtros;
    const diasEnMes = new Date(año, mes, 0).getDate();
    const domingos = contarDomingos(año, mes);
    const diasLaborales = diasEnMes - domingos;
    
    return {
      total,
      presentes,
      ausentes,
      tardanzas,
      permisos,
      faltasJustificadas,
      faltasInjustificadas,
      porcentajeAsistencia: ((presentes + tardanzas) / total * 100).toFixed(1),
      porcentajeTardanzas: (tardanzas / total * 100).toFixed(1),
      diasLaborales
    };
  }, [asistencias, filtros]);
  
  // Obtener nombre del mes
  const nombreMes = useMemo(() => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[filtros.mes - 1];
  }, [filtros.mes]);
  
  // Calcular barra de progreso
  const calcularProgreso = (valor, total) => {
    if (total === 0) return 0;
    return (valor / total * 100).toFixed(1);
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Generando reporte...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header del reporte */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <FileText size={28} />
          <h2 className="text-2xl font-bold">
            Reporte de Asistencias
          </h2>
        </div>
        <p className="text-white/90">
          {nombreMes} {filtros.año}
        </p>
        {filtros.colaboradorId && (
          <p className="text-sm text-white/80 mt-2">
            Vista individual de colaborador
          </p>
        )}
      </div>
      
      {/* Cards principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total de registros */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {estadisticas.total}
          </div>
          <div className="text-sm text-gray-600">
            Registros totales
          </div>
          <div className="text-xs text-gray-500 mt-1">
            de {estadisticas.diasLaborales} días laborales
          </div>
        </div>
        
        {/* Presentes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {estadisticas.presentes}
          </div>
          <div className="text-sm text-gray-600">
            Días presentes
          </div>
          <div className="text-xs text-green-600 mt-1 font-medium">
            {estadisticas.porcentajeAsistencia}% de asistencia
          </div>
        </div>
        
        {/* Tardanzas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="text-orange-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {estadisticas.tardanzas}
          </div>
          <div className="text-sm text-gray-600">
            Tardanzas
          </div>
          <div className="text-xs text-orange-600 mt-1 font-medium">
            {estadisticas.porcentajeTardanzas}% del total
          </div>
        </div>
        
        {/* Ausencias */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="text-red-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {estadisticas.ausentes + estadisticas.faltasInjustificadas}
          </div>
          <div className="text-sm text-gray-600">
            Ausencias totales
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {estadisticas.faltasInjustificadas} injustificadas
          </div>
        </div>
      </div>
      
      {/* Desglose detallado */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-600" />
          Desglose por Estado
        </h3>
        
        <div className="space-y-4">
          {/* Presente */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                Presente
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {estadisticas.presentes} ({calcularProgreso(estadisticas.presentes, estadisticas.total)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${calcularProgreso(estadisticas.presentes, estadisticas.total)}%` }}
              ></div>
            </div>
          </div>
          
          {/* Tardanza */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                Tardanza
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {estadisticas.tardanzas} ({calcularProgreso(estadisticas.tardanzas, estadisticas.total)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${calcularProgreso(estadisticas.tardanzas, estadisticas.total)}%` }}
              ></div>
            </div>
          </div>
          
          {/* Permiso */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                Permiso
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {estadisticas.permisos} ({calcularProgreso(estadisticas.permisos, estadisticas.total)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${calcularProgreso(estadisticas.permisos, estadisticas.total)}%` }}
              ></div>
            </div>
          </div>
          
          {/* Falta Justificada */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                Falta Justificada
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {estadisticas.faltasJustificadas} ({calcularProgreso(estadisticas.faltasJustificadas, estadisticas.total)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${calcularProgreso(estadisticas.faltasJustificadas, estadisticas.total)}%` }}
              ></div>
            </div>
          </div>
          
          {/* Ausente / Falta Injustificada */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                Ausente / Falta Injustificada
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {estadisticas.ausentes + estadisticas.faltasInjustificadas} 
                ({calcularProgreso(estadisticas.ausentes + estadisticas.faltasInjustificadas, estadisticas.total)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${calcularProgreso(estadisticas.ausentes + estadisticas.faltasInjustificadas, estadisticas.total)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Alertas y observaciones */}
      {(estadisticas.faltasInjustificadas > 3 || estadisticas.tardanzas > 5) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 flex-shrink-0" size={24} />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-2">
                Observaciones del periodo
              </h4>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                {estadisticas.faltasInjustificadas > 3 && (
                  <li>Alto número de faltas injustificadas ({estadisticas.faltasInjustificadas})</li>
                )}
                {estadisticas.tardanzas > 5 && (
                  <li>Tardanzas recurrentes detectadas ({estadisticas.tardanzas})</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Sin datos */}
      {estadisticas.total === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay datos para este periodo
          </h3>
          <p className="text-gray-600">
            No se encontraron registros de asistencia para {nombreMes} {filtros.año}
          </p>
        </div>
      )}
    </div>
  );
});

ReporteAsistencias.displayName = 'ReporteAsistencias';

export default ReporteAsistencias;
