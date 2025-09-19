import React from 'react';
import { Calendar } from 'lucide-react';

const DateRangePicker = ({ 
  fechaInicio, 
  fechaFin, 
  onFechaInicioChange, 
  onFechaFinChange,
  label = "Rango de Fechas",
  className = ""
}) => {
  
  // Formatear fecha para input type="date"
  const formatearFechaInput = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toISOString().split('T')[0];
  };

  // Obtener fecha máxima (hoy)
  const fechaMaxima = new Date().toISOString().split('T')[0];

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Calendar className="h-4 w-4" />
        <span className="font-medium">{label}:</span>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Fecha Inicio</label>
          <input
            type="date"
            value={formatearFechaInput(fechaInicio)}
            onChange={(e) => onFechaInicioChange(e.target.value)}
            max={fechaMaxima}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Fecha Fin</label>
          <input
            type="date"
            value={formatearFechaInput(fechaFin)}
            onChange={(e) => onFechaFinChange(e.target.value)}
            min={formatearFechaInput(fechaInicio)}
            max={fechaMaxima}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;