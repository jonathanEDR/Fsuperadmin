import React from 'react';
import { ORBITAS_CONFIG } from './sistemaSolarConfig';
import { useOrbitalAnimation } from './hooks/useOrbitalAnimation';
import styles from './sistemaSolarAvanzado.module.css';

const OrbitaContainer = ({ 
  nivel, 
  children, 
  configuracion, 
  visible = true,
  mostrarOrbitas = true,
  className = "" 
}) => {
  const orbitaConfig = ORBITAS_CONFIG[nivel];
  const { anguloActual } = useOrbitalAnimation(nivel);
  
  if (!orbitaConfig || !visible) {
    return null;
  }

  const radio = configuracion.orbitaRadio[nivel] || orbitaConfig.radio;

  return (
    <div className={`absolute ${className}`}>
      {/* Órbita visual mejorada */}
      {mostrarOrbitas && (
        <div
          className={`${styles.orbita} ${styles['super-visible']} ${styles[`nivel${nivel}`]}`}
          style={{
            width: radio * 2,
            height: radio * 2,
            left: -radio,
            top: -radio,
            opacity: 1,
            zIndex: 2
          }}
        >
          {/* Partículas adicionales en la órbita */}
          <div
            className="absolute w-2 h-2 bg-white rounded-full opacity-80"
            style={{
              top: '10%',
              left: '90%',
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
              animation: `particula-orbita ${15 + nivel * 5}s linear infinite`
            }}
          />
          <div
            className="absolute w-1 h-1 bg-blue-200 rounded-full opacity-60"
            style={{
              top: '60%',
              left: '10%',
              boxShadow: '0 0 6px rgba(173, 216, 230, 0.8)',
              animation: `particula-orbita ${20 + nivel * 3}s linear infinite reverse`
            }}
          />
          <div
            className="absolute w-1 h-1 bg-purple-200 rounded-full opacity-50"
            style={{
              top: '90%',
              left: '50%',
              boxShadow: '0 0 4px rgba(221, 160, 221, 0.6)',
              animation: `particula-orbita ${25 + nivel * 2}s linear infinite`
            }}
          />
        </div>
      )}
      
      {/* Contenedor rotatorio para los planetas */}
      <div
        className={`${styles['orbita-container']} ${styles[`nivel${nivel}`]}`}
        style={{
          width: radio * 2,
          height: radio * 2,
          left: -radio,
          top: -radio,
          zIndex: 5
        }}
      >
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return child;
          
          return React.cloneElement(child, {
            ...child.props,
            orbita: nivel,
            radio,
            configuracion,
            anguloActual,
            indiceEnOrbita: index,
            totalEnOrbita: React.Children.count(children)
          });
        })}
      </div>
      
      {/* Estilos dinámicos para la animación - movidos a CSS inline */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes orbitaPulse-${nivel} {
          0%, 100% { 
            opacity: 0.2; 
            transform: scale(1);
          }
          50% { 
            opacity: 0.4; 
            transform: scale(1.02);
          }
        }
        `
      }} />
    </div>
  );
};

export default OrbitaContainer;
