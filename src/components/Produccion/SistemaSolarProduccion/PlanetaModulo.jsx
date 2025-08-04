import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PLANETAS_CONFIG, ANIMACIONES_CONFIG } from './sistemaSolarConfig';
import styles from './sistemaSolarAvanzado.module.css';

const PlanetaModulo = ({ 
  tipo,
  orbita,
  radio,
  configuracion,
  anguloActual = 0,
  indiceEnOrbita = 0,
  totalEnOrbita = 1,
  estadisticas = {},
  alertas = [],
  onHover,
  onClick,
  seleccionado = false,
  className = ""
}) => {
  const [estaEnHover, setEstaEnHover] = useState(false);
  const location = useLocation();
  
  // Encontrar configuración del planeta
  const planetaConfig = PLANETAS_CONFIG.find(p => p.id === tipo);
  if (!planetaConfig) return null;

  // Calcular posición en la órbita - posición fija en el borde
  const anguloPropio = planetaConfig.angulo + (indiceEnOrbita * (360 / totalEnOrbita));
  const anguloFinalRadianes = anguloPropio * (Math.PI / 180);
  
  const x = Math.cos(anguloFinalRadianes) * radio;
  const y = Math.sin(anguloFinalRadianes) * radio;
  
  // Tamaño responsive
  const tamaño = configuracion.planetaTamaño[planetaConfig.tamaño];
  
  // Verificar si está activo
  const rutaCompleta = location.pathname;
  const isActive = rutaCompleta.includes(planetaConfig.to);
  
  // Obtener estadística
  const valorEstadistica = estadisticas[planetaConfig.estadisticaKey] || 0;
  const hayAlertas = alertas.filter(a => a.modulo === tipo && a.activa).length > 0;

  // Construir la ruta
  const pathParts = location.pathname.split('/');
  const produccionIdx = pathParts.findIndex(p => p === 'produccion');
  let basePath = '';
  if (produccionIdx !== -1) {
    basePath = pathParts.slice(0, produccionIdx + 1).join('/');
  } else {
    basePath = pathParts.slice(0, 2).join('/');
  }
  const to = basePath + '/' + planetaConfig.to;

  const handleMouseEnter = () => {
    setEstaEnHover(true);
    if (onHover) onHover(tipo, true);
  };

  const handleMouseLeave = () => {
    setEstaEnHover(false);
    if (onHover) onHover(tipo, false);
  };

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(tipo);
    }
  };

  return (
    <div
      className={`absolute ${className}`}
      style={{
        transform: `translate(${x}px, ${y}px)`,
        left: '50%',
        top: '50%',
        marginLeft: -tamaño / 2,
        marginTop: -tamaño / 2,
      }}
    >
      <Link
        to={to}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="block group relative"
      >
        {/* Planeta principal */}
        <div
          className={`
            ${styles['planeta-modulo']} relative rounded-full border-4 cursor-pointer transition-all duration-300 shadow-lg
            ${estaEnHover ? 'shadow-2xl' : 'shadow-lg'}
            ${isActive ? 'ring-4 ring-blue-400 ring-opacity-60' : ''}
            ${seleccionado ? styles.seleccionado : ''}
            ${hayAlertas ? styles['con-alerta'] : ''}
          `}
          style={{
            width: tamaño,
            height: tamaño,
            background: `radial-gradient(circle at 30% 30%, ${planetaConfig.color.primary}, ${planetaConfig.color.accent})`,
            borderColor: planetaConfig.color.primary,
            transform: `
              scale(${estaEnHover ? ANIMACIONES_CONFIG.escalaHover : seleccionado ? 1.1 : 1}) 
              rotate(${-anguloActual}deg)
            `,
            boxShadow: `
              0 0 ${tamaño * 0.5}px ${planetaConfig.color.primary}40,
              ${estaEnHover || seleccionado ? `0 0 ${tamaño}px ${planetaConfig.color.primary}60` : ''}
            `
          }}
        >
          {/* Contenido del planeta */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              {/* Icono */}
              <div 
                className={`${styles['planeta-icono']} mb-1`}
                style={{ fontSize: tamaño * 0.35 }}
              >
                {planetaConfig.icono}
              </div>
              
              {/* Texto (solo si hay espacio) */}
              {configuracion.mostrarTexto && tamaño >= 50 && (
                <div className="text-white font-bold text-xs opacity-90 leading-tight">
                  {planetaConfig.nombre.split(' ').map((palabra, i) => (
                    <div key={i}>{palabra}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Superficie con textura */}
          <div 
            className="absolute inset-2 rounded-full opacity-20"
            style={{
              background: `radial-gradient(circle at 70% 20%, transparent 30%, ${planetaConfig.color.secondary} 100%)`
            }}
          />
        </div>

        {/* Indicador de alertas */}
        {hayAlertas && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
            !
          </div>
        )}

        {/* Badge con estadística */}
        {valorEstadistica > 0 && tamaño >= 40 && (
          <div 
            className="absolute -bottom-2 -right-2 bg-white rounded-full px-2 py-1 text-xs font-bold shadow-lg border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ 
              borderColor: planetaConfig.color.primary,
              color: planetaConfig.color.accent
            }}
          >
            {valorEstadistica}
          </div>
        )}

        {/* Tooltip en hover (solo desktop) */}
        {estaEnHover && configuracion.mostrarTexto && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50 opacity-0 animate-fadeIn">
            <div className="font-medium">{planetaConfig.nombre}</div>
            <div className="text-xs opacity-75">{planetaConfig.descripcion}</div>
            {valorEstadistica > 0 && (
              <div className="text-xs mt-1 text-blue-300">
                {planetaConfig.estadisticaKey}: {valorEstadistica}
              </div>
            )}
            
            {/* Flecha del tooltip */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}

        {/* Indicador de activo */}
        {isActive && (
          <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-pulse opacity-60"></div>
        )}
      </Link>

      {/* Estilo para la animación de fade in */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, 0) scale(0.8); }
          to { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PlanetaModulo;
