import React, { useState } from 'react';
import { useResponsiveLayout } from '../hooks/usePlanetEffects';
import SolCentral from '../components/SolCentral/SolCentral';
import PlanetaIngredientes from '../components/planetas/PlanetaIngredientes/PlanetaIngredientes';
import PlanetaMateriales from '../components/planetas/PlanetaMateriales/PlanetaMateriales';
import styles from '../sistemaSolarAvanzado.module.css';

/**
 * 🌌 DEMOSTRACIÓN DEL SISTEMA SOLAR MODULAR
 * 
 * Esta es una versión de prueba que muestra los primeros componentes modulares:
 * - Sol Central independiente
 * - Planeta Ingredientes con efectos orgánicos
 * - Planeta Materiales con efectos industriales
 * 
 * ✅ COMPLETADO:
 * - Configuración centralizada
 * - Sol Central modular
 * - Planeta Ingredientes (efectos orgánicos)
 * - Planeta Materiales (efectos industriales)
 * - Hooks especializados
 * 
 * 🚧 EN PROGRESO:
 * - Planeta Recetas (efectos de cocción)
 * - Planeta Producción (efectos industriales)
 * - Planeta Residuos (efectos de limpieza)
 * - Planeta Movimientos (efectos de flujo)
 */

const SistemaSolarModularDemo = ({ onPlanetaClick }) => {
  const { layout, isMobile, isTablet } = useResponsiveLayout();
  const [planetaSeleccionado, setPlanetaSeleccionado] = useState(null);
  const [efectosActivos, setEfectosActivos] = useState(true);

  // Estadísticas simuladas
  const estadisticas = {
    sol: { total: 6 },
    ingredientes: { cantidad: 15, estado: 'normal' },
    materiales: { cantidad: 8, estado: 'activo' }
  };

  const handlePlanetaClick = (planetaId) => {
    setPlanetaSeleccionado(planetaId);
    if (onPlanetaClick) {
      onPlanetaClick(planetaId);
    }
  };

  const toggleEfectos = () => {
    setEfectosActivos(!efectosActivos);
  };

  return (
    <div className={styles['sistema-solar-produccion']}>
      {/* Fondo espacial */}
      <div className={styles['fondo-espacial']}>
        
        {/* Panel de control */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 100,
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '15px',
          borderRadius: '10px',
          color: 'white',
          fontSize: '0.8rem'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#60a5fa' }}>
            🌌 Sistema Solar Modular
          </h3>
          <div style={{ marginBottom: '10px' }}>
            <strong>Layout:</strong> {layout}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Seleccionado:</strong> {planetaSeleccionado || 'Ninguno'}
          </div>
          <button
            onClick={toggleEfectos}
            style={{
              background: efectosActivos ? '#10b981' : '#6b7280',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.7rem'
            }}
          >
            {efectosActivos ? '✨ Efectos ON' : '⭕ Efectos OFF'}
          </button>
          
          <div style={{ marginTop: '15px', fontSize: '0.7rem', opacity: 0.8 }}>
            <div>✅ Sol Central</div>
            <div>✅ Ingredientes</div>
            <div>✅ Materiales</div>
            <div style={{ color: '#fbbf24' }}>🚧 Recetas (próximo)</div>
            <div style={{ color: '#fbbf24' }}>🚧 Producción (próximo)</div>
            <div style={{ color: '#fbbf24' }}>🚧 Residuos (próximo)</div>
            <div style={{ color: '#fbbf24' }}>🚧 Movimientos (próximo)</div>
          </div>
        </div>

        {/* Sol Central */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}>
          <SolCentral
            onClick={handlePlanetaClick}
            estadisticas={estadisticas.sol}
            responsive={layout}
            efectosActivos={efectosActivos}
          />
        </div>

        {/* Órbita 1 - Ingredientes y Materiales */}
        <div 
          className={`${styles.orbita} ${styles.nivel1}`}
          style={{
            width: isMobile ? '240px' : isTablet ? '320px' : '360px',
            height: isMobile ? '240px' : isTablet ? '320px' : '360px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        />

        {/* Container orbital nivel 1 */}
        <div 
          className={`${styles['orbita-container']} ${styles.nivel1}`}
          style={{
            width: isMobile ? '240px' : isTablet ? '320px' : '360px',
            height: isMobile ? '240px' : isTablet ? '320px' : '360px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Planeta Ingredientes */}
          <div style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)'
          }}>
            <PlanetaIngredientes
              onClick={handlePlanetaClick}
              estadisticas={estadisticas.ingredientes}
              estado={planetaSeleccionado === 'ingredientes' ? 'seleccionado' : estadisticas.ingredientes.estado}
              responsive={layout}
              efectosActivos={efectosActivos}
            />
          </div>

          {/* Planeta Materiales */}
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)'
          }}>
            <PlanetaMateriales
              onClick={handlePlanetaClick}
              estadisticas={estadisticas.materiales}
              estado={planetaSeleccionado === 'materiales' ? 'seleccionado' : estadisticas.materiales.estado}
              responsive={layout}
              efectosActivos={efectosActivos}
            />
          </div>
        </div>

        {/* Órbita 2 - Placeholder para próximos planetas */}
        <div 
          className={`${styles.orbita} ${styles.nivel2}`}
          style={{
            width: isMobile ? '360px' : isTablet ? '480px' : '560px',
            height: isMobile ? '360px' : isTablet ? '480px' : '560px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.3
          }}
        />

        {/* Órbita 3 - Placeholder para próximos planetas */}
        <div 
          className={`${styles.orbita} ${styles.nivel3}`}
          style={{
            width: isMobile ? '480px' : isTablet ? '600px' : '760px',
            height: isMobile ? '480px' : isTablet ? '600px' : '760px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.2
          }}
        />

        {/* Información del planeta seleccionado */}
        {planetaSeleccionado && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '15px 25px',
            borderRadius: '25px',
            color: 'white',
            textAlign: 'center',
            zIndex: 50
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>
              {planetaSeleccionado === 'ingredientes' && '🥗 Ingredientes'}
              {planetaSeleccionado === 'materiales' && '🔧 Materiales'}
              {planetaSeleccionado === 'dashboard' && '☀️ Dashboard Principal'}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              {planetaSeleccionado === 'ingredientes' && `${estadisticas.ingredientes.cantidad} elementos disponibles`}
              {planetaSeleccionado === 'materiales' && `${estadisticas.materiales.cantidad} elementos en inventario`}
              {planetaSeleccionado === 'dashboard' && 'Centro de control del sistema'}
            </div>
            <button
              onClick={() => setPlanetaSeleccionado(null)}
              style={{
                marginTop: '10px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '5px 15px',
                borderRadius: '15px',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              ✕ Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SistemaSolarModularDemo;
