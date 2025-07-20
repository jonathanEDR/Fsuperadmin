import React from 'react';

const HistorialFasesCompacto = ({ receta }) => {
  if (!receta || !receta.historicoFases || receta.historicoFases.length === 0) {
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-md">
        <p className="text-xs text-gray-500 text-center">Sin historial de fases</p>
      </div>
    );
  }

  // Función para obtener info de fase
  const getFaseInfo = (fase) => {
    switch (fase) {
      case 'preparado':
        return { icon: '🥄', nombre: 'Prep.', color: 'text-blue-600' };
      case 'intermedio':
        return { icon: '⚗️', nombre: 'Inter.', color: 'text-yellow-600' };
      case 'terminado':
        return { icon: '✅', nombre: 'Term.', color: 'text-green-600' };
      default:
        return { icon: '❓', nombre: 'N/A', color: 'text-gray-600' };
    }
  };

  // Formatear fecha compacta
  const formatearFechaCompacta = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular duración compacta
  const calcularDuracionCompacta = (fechaInicio, fechaFinalizacion) => {
    if (!fechaInicio) return '';
    
    const inicio = new Date(fechaInicio);
    const fin = fechaFinalizacion ? new Date(fechaFinalizacion) : new Date();
    const duracion = fin - inicio;
    
    const horas = Math.floor(duracion / (1000 * 60 * 60));
    const minutos = Math.floor((duracion % (1000 * 60 * 60)) / (1000 * 60));
    
    if (horas > 24) {
      const dias = Math.floor(horas / 24);
      return `${dias}d`;
    }
    if (horas > 0) {
      return `${horas}h`;
    }
    return `${minutos}m`;
  };

  // Mostrar solo las últimas 3 fases o todas si son pocas
  const fasesParaMostrar = receta.historicoFases.slice(-3);

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-700">📋 Historial</span>
        <span className="text-xs text-gray-500">
          {receta.historicoFases.length} fase{receta.historicoFases.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2">
        {fasesParaMostrar.map((fase, index) => {
          const faseInfo = getFaseInfo(fase.fase);
          const esActiva = !fase.fechaFinalizacion;
          const duracion = calcularDuracionCompacta(fase.fechaInicio, fase.fechaFinalizacion);

          return (
            <div
              key={index}
              className={`flex items-center justify-between text-xs p-2 rounded ${
                esActiva ? 'bg-blue-100 border border-blue-200' : 'bg-white border border-gray-200'
              }`}
            >
              {/* Fase e icono */}
              <div className="flex items-center space-x-2 flex-1">
                <span className="text-sm">{faseInfo.icon}</span>
                <span className={`font-medium ${faseInfo.color}`}>
                  {faseInfo.nombre}
                </span>
                {esActiva && (
                  <span className="px-1 py-0.5 text-xs bg-blue-500 text-white rounded">
                    Activa
                  </span>
                )}
              </div>

              {/* Duración y fecha */}
              <div className="text-right text-gray-500">
                <div className="flex items-center space-x-1">
                  <span>⏱️</span>
                  <span>{duracion}</span>
                </div>
                <div className="text-xs">
                  {formatearFechaCompacta(fase.fechaInicio)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ingredientes agregados en total */}
      {receta.historicoFases.some(f => f.ingredientesAgregados && f.ingredientesAgregados.length > 0) && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>🧪 Ingredientes extra:</span>
            <span>
              {receta.historicoFases.reduce((total, fase) => 
                total + (fase.ingredientesAgregados?.length || 0), 0
              )}
            </span>
          </div>
        </div>
      )}

      {/* Estado actual */}
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Estado:</span>
          <span className={`px-2 py-1 rounded font-medium ${
            receta.estadoProceso === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
            receta.estadoProceso === 'completado' ? 'bg-green-100 text-green-800' :
            receta.estadoProceso === 'pausado' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {receta.estadoProceso || 'borrador'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HistorialFasesCompacto;
