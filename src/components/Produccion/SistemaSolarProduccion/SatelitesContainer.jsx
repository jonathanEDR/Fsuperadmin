import React from 'react';
import SateliteAccion from './SateliteAccion';
import { SATELITES_CONFIG } from './sistemaSolarConfig';

const SatelitesContainer = ({ 
  planetaActivo = null,
  configuracion,
  onSateliteClick,
  visible = true,
  className = ""
}) => {
  if (!visible || !planetaActivo) return null;

  // Obtener satélites del planeta usando la nueva configuración
  const satelitesDelPlaneta = SATELITES_CONFIG[planetaActivo] || [];

  if (satelitesDelPlaneta.length === 0) return null;

  // Calcular radio de órbita de satélites
  const radioSatelites = 60; // px desde el planeta padre

  return (
    <div className={`absolute ${className}`}>
      {satelitesDelPlaneta.map((satelite, index) => {
        // Calcular posición del satélite alrededor del planeta
        const angulo = (index * (360 / satelitesDelPlaneta.length)) * (Math.PI / 180);
        const x = Math.cos(angulo) * radioSatelites;
        const y = Math.sin(angulo) * radioSatelites;

        return (
          <div
            key={satelite.id}
            className="absolute"
            style={{
              transform: `translate(${x}px, ${y}px)`,
              left: '50%',
              top: '50%',
              marginLeft: -(configuracion.planetaTamaño.small * 0.6) / 2,
              marginTop: -(configuracion.planetaTamaño.small * 0.6) / 2,
            }}
          >
            <SateliteAccion
              id={satelite.id}
              planetaPadre={planetaActivo}
              configuracion={configuracion}
              onClick={onSateliteClick}
              visible={true}
            />
          </div>
        );
      })}
      
      {/* Órbita de satélites (línea punteada) */}
      <div
        className="absolute rounded-full border-dotted border-2 opacity-20 pointer-events-none"
        style={{
          width: radioSatelites * 2,
          height: radioSatelites * 2,
          left: -radioSatelites,
          top: -radioSatelites,
          borderColor: '#6b7280',
          animation: 'sateliteOrbit 10s linear infinite reverse'
        }}
      />
      
      <style jsx>{`
        @keyframes sateliteOrbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SatelitesContainer;
