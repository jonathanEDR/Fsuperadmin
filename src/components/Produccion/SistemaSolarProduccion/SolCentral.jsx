import React, { useState } from 'react';
import { SOL_CONFIG } from './sistemaSolarConfig';

const SolCentral = ({ 
  estadisticas = {}, 
  alertas = [], 
  onClick,
  configuracion,
  className = ""
}) => {
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  
  const { solTamaño } = configuracion;
  
  // Calcular alertas activas
  const alertasActivas = alertas.filter(a => a.activa).length;
  const hayAlertas = alertasActivas > 0;

  // Estadísticas rápidas para mostrar en el sol
  const estadisticasRapidas = [
    { 
      icono: '📊', 
      valor: estadisticas.totalMovimientos || 0, 
      label: 'Movimientos',
      color: 'text-blue-600'
    },
    { 
      icono: '🏭', 
      valor: estadisticas.enProduccion || 0, 
      label: 'En Producción',
      color: 'text-purple-600'
    }
  ];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setMostrarDetalle(!mostrarDetalle);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Sol principal */}
      <div
        onClick={handleClick}
        className="relative cursor-pointer group transition-all duration-300 hover:scale-110"
        style={{ 
          width: solTamaño, 
          height: solTamaño 
        }}
      >
        {/* Resplandor exterior */}
        <div 
          className="absolute inset-0 rounded-full opacity-60 group-hover:opacity-80 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle, ${SOL_CONFIG.color.secondary} 0%, ${SOL_CONFIG.color.primary}40 50%, transparent 100%)`,
            transform: 'scale(1.5)',
            filter: 'blur(8px)'
          }}
        />
        
        {/* Cuerpo del sol */}
        <div 
          className="relative w-full h-full rounded-full flex items-center justify-center shadow-2xl border-4 group-hover:shadow-yellow-400/50 transition-all duration-300"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${SOL_CONFIG.color.primary}, ${SOL_CONFIG.color.accent})`,
            borderColor: SOL_CONFIG.color.primary
          }}
        >
          {/* Icono principal */}
          <div className="text-center">
            <div 
              className="mb-1 group-hover:animate-pulse"
              style={{ fontSize: solTamaño * 0.3 }}
            >
              {SOL_CONFIG.icono}
            </div>
            
            {/* Texto en desktop */}
            {solTamaño >= 80 && (
              <div className="text-white font-bold text-xs opacity-90">
                Centro
              </div>
            )}
          </div>
          
          {/* Rayos solares animados */}
          {SOL_CONFIG.rayos.map((rayo, index) => (
            <div
              key={index}
              className="absolute animate-pulse"
              style={{
                transform: `rotate(${rayo.angulo}deg) translateY(-${solTamaño * 0.7}px)`,
                transformOrigin: 'center bottom',
                opacity: rayo.intensidad * 0.6,
                animationDelay: `${index * 0.5}s`,
                animationDuration: '3s'
              }}
            >
              <div 
                className="w-1 bg-yellow-300 rounded-full"
                style={{ 
                  height: solTamaño * 0.2,
                  filter: 'blur(1px)'
                }}
              />
            </div>
          ))}
        </div>
        
        {/* Indicador de alertas */}
        {hayAlertas && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-bounce shadow-lg">
            {alertasActivas}
          </div>
        )}
        
        {/* Mini estadísticas (solo desktop) */}
        {solTamaño >= 100 && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {estadisticasRapidas.map((stat, index) => (
              <div 
                key={index}
                className="bg-white rounded-lg px-2 py-1 shadow-lg text-xs"
              >
                <div className={`flex items-center space-x-1 ${stat.color}`}>
                  <span>{stat.icono}</span>
                  <span className="font-medium">{stat.valor}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Panel de detalle expandido */}
      {mostrarDetalle && solTamaño >= 80 && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 bg-white rounded-lg shadow-xl p-4 z-50 min-w-[300px]">
          <div className="text-center mb-4">
            <h3 className="font-bold text-gray-800 flex items-center justify-center">
              <span className="mr-2">{SOL_CONFIG.icono}</span>
              {SOL_CONFIG.nombre}
            </h3>
          </div>
          
          {/* Estadísticas detalladas */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {estadisticasRapidas.map((stat, index) => (
                <div key={index} className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-lg">{stat.icono}</div>
                  <div className={`font-bold ${stat.color}`}>{stat.valor}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
            
            {/* Alertas */}
            {hayAlertas && (
              <div className="border-t pt-3">
                <h4 className="font-medium text-red-600 mb-2 flex items-center">
                  <span className="mr-1">🚨</span>
                  Alertas Activas ({alertasActivas})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {alertas.filter(a => a.activa).map((alerta, index) => (
                    <div key={index} className="text-xs p-2 bg-red-50 rounded text-red-700">
                      {alerta.mensaje}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Botón cerrar */}
          <button
            onClick={() => setMostrarDetalle(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default SolCentral;
