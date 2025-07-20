import React from 'react';

const HistorialFases = ({ receta, onReiniciar }) => {
  if (!receta || !receta.historicoFases || receta.historicoFases.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          📋 Historial de Fases
        </h3>
        <div className="text-center text-gray-500 py-4">
          <p>No hay historial de fases disponible</p>
          <p className="text-sm">Inicia el proceso para ver el seguimiento</p>
        </div>
      </div>
    );
  }

  // Función para obtener el icono y color por fase
  const getFaseInfo = (fase) => {
    switch (fase) {
      case 'preparado':
        return {
          icon: '🥫',
          color: 'text-blue-600 bg-blue-100',
          nombre: 'Preparado'
        };
      case 'intermedio':
        return {
          icon: '⚗️',
          color: 'text-yellow-600 bg-yellow-100',
          nombre: 'Intermedio'
        };
      case 'terminado':
        return {
          icon: '✅',
          color: 'text-green-600 bg-green-100',
          nombre: 'Terminado'
        };
      default:
        return {
          icon: '❓',
          color: 'text-gray-600 bg-gray-100',
          nombre: 'Desconocido'
        };
    }
  };

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'En progreso';
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para calcular duración
  const calcularDuracion = (fechaInicio, fechaFinalizacion) => {
    if (!fechaInicio) return '';
    
    const inicio = new Date(fechaInicio);
    const fin = fechaFinalizacion ? new Date(fechaFinalizacion) : new Date();
    const duracion = fin - inicio;
    
    const horas = Math.floor(duracion / (1000 * 60 * 60));
    const minutos = Math.floor((duracion % (1000 * 60 * 60)) / (1000 * 60));
    
    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    }
    return `${minutos}m`;
  };

  // Determinar si se puede reiniciar
  const puedeReiniciar = receta.estadoProceso !== 'borrador';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          📋 Historial de Fases
        </h3>
        
        {puedeReiniciar && (
          <button
            onClick={() => {
              if (window.confirm('¿Estás seguro de que quieres reiniciar esta receta al estado preparado? Esta acción no se puede deshacer.')) {
                onReiniciar();
              }
            }}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors text-sm font-medium"
            title="Reiniciar receta al estado preparado"
          >
            🔄 Reiniciar
          </button>
        )}
      </div>

      <div className="space-y-4">
        {receta.historicoFases.map((fase, index) => {
          const faseInfo = getFaseInfo(fase.fase);
          const esActiva = !fase.fechaFinalizacion;
          const duracion = calcularDuracion(fase.fechaInicio, fase.fechaFinalizacion);

          return (
            <div
              key={index}
              className={`relative flex items-start space-x-4 p-4 rounded-lg border-l-4 ${
                esActiva 
                  ? 'border-l-blue-500 bg-blue-50' 
                  : 'border-l-gray-300 bg-gray-50'
              }`}
            >
              {/* Icono de fase */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${faseInfo.color}`}>
                {faseInfo.icon}
              </div>

              {/* Información de la fase */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {faseInfo.nombre}
                    {esActiva && (
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
                        En Progreso
                      </span>
                    )}
                  </h4>
                  
                  {duracion && (
                    <span className="text-xs text-gray-500 font-medium">
                      ⏱️ {duracion}
                    </span>
                  )}
                </div>

                {/* Fechas */}
                <div className="mt-1 text-xs text-gray-600 space-y-1">
                  <div>
                    <span className="font-medium">Inicio:</span> {formatearFecha(fase.fechaInicio)}
                  </div>
                  {fase.fechaFinalizacion && (
                    <div>
                      <span className="font-medium">Fin:</span> {formatearFecha(fase.fechaFinalizacion)}
                    </div>
                  )}
                </div>

                {/* Notas */}
                {fase.notas && (
                  <div className="mt-2 text-sm text-gray-700">
                    <span className="font-medium">Notas:</span> {fase.notas}
                  </div>
                )}

                {/* Ingredientes agregados en esta fase */}
                {fase.ingredientesAgregados && fase.ingredientesAgregados.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-gray-600">
                      Ingredientes agregados ({fase.ingredientesAgregados.length}):
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {fase.ingredientesAgregados.slice(0, 3).map((ing, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded"
                        >
                          {ing.cantidad} {ing.unidadMedida}
                        </span>
                      ))}
                      {fase.ingredientesAgregados.length > 3 && (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-300 text-gray-600 rounded">
                          +{fase.ingredientesAgregados.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Información adicional */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Estado actual:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
              receta.estadoProceso === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
              receta.estadoProceso === 'completado' ? 'bg-green-100 text-green-800' :
              receta.estadoProceso === 'pausado' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {receta.estadoProceso || 'borrador'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Fase actual:</span>
            <span className="ml-2 text-gray-900">
              {getFaseInfo(receta.faseActual || receta.categoria).nombre}
            </span>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-600">
          <span className="font-medium">Total de transiciones:</span> {receta.historicoFases.length}
        </div>
      </div>
    </div>
  );
};

export default HistorialFases;
