import React from 'react';
import PlanetaIngredientesPro from './components/planetas/PlanetaIngredientes/PlanetaIngredientesPro';
import PlanetaRecetasPro from './components/planetas/PlanetaRecetas/PlanetaRecetasPro';
import PlanetaProduccionPro from './components/planetas/PlanetaProduccion/PlanetaProduccionPro';
import PlanetaMovimientosPro from './components/planetas/PlanetaMovimientos/PlanetaMovimientosPro';

/**
 * 🧪 COMPONENTE DE PRUEBA - PLANETAS PROFESIONALES
 * 
 * Este componente es para verificar que los planetas profesionales
 * se rendericen correctamente antes de integrarlos al sistema principal.
 */

const TestPlanetasProfesionales = () => {
  const handlePlanetaClick = (planetaId, data) => {
    console.log(`🌟 Planeta clickeado: ${planetaId}`, data);
    alert(`Planeta ${planetaId} clickeado!`);
  };

  const estilosContenedor = {
    width: '100%',
    height: '100vh',
    background: 'radial-gradient(ellipse at center, #1a0d3e 0%, #0a0118 70%, #000000 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '60px',
    flexWrap: 'wrap',
    padding: '20px'
  };

  const estilosPlanetaContainer = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px'
  };

  const estilosLabel = {
    color: 'white',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: '10px'
  };

  return (
    <div style={estilosContenedor}>
      
      {/* Panel de información */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        maxWidth: '300px',
        fontSize: '0.85rem'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#60a5fa' }}>
          🧪 Test Planetas Profesionales
        </h3>
        <p style={{ margin: '0 0 10px 0' }}>
          Si puedes ver planetas redondos con efectos animados, 
          la implementación funciona correctamente.
        </p>
        <div style={{ marginTop: '15px' }}>
          <strong>Características esperadas:</strong>
          <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
            <li>Planetas perfectamente redondos</li>
            <li>Efectos de hover y selección</li>
            <li>Animaciones fluidas</li>
            <li>Partículas y efectos únicos</li>
          </ul>
        </div>
      </div>

      {/* Planeta Ingredientes Profesional */}
      <div style={estilosPlanetaContainer}>
        <PlanetaIngredientesPro
          onClick={handlePlanetaClick}
          isSelected={false}
          hasAlert={false}
          estadoIngredientes="normal"
          estadisticas={{ cantidad: 15, stock_bajo: 2 }}
        />
        <div style={estilosLabel}>🌿 Ingredientes Pro</div>
      </div>

      {/* Planeta Recetas Profesional */}
      <div style={estilosPlanetaContainer}>
        <PlanetaRecetasPro
          onClick={handlePlanetaClick}
          isSelected={false}
          hasAlert={true}
          estadoRecetas="cocinando"
          estadisticas={{ activas: 8, completadas: 12 }}
        />
        <div style={estilosLabel}>🍳 Recetas Pro</div>
      </div>

      {/* Planeta Producción Profesional */}
      <div style={estilosPlanetaContainer}>
        <PlanetaProduccionPro
          onClick={handlePlanetaClick}
          isSelected={true}
          hasAlert={false}
          estadoProduccion="produciendo"
          estadisticas={{ ordenesActivas: 5 }}
          nivelProduccion={75}
        />
        <div style={estilosLabel}>⚙️ Producción Pro</div>
      </div>

      {/* Planeta Movimientos Profesional */}
      <div style={estilosPlanetaContainer}>
        <PlanetaMovimientosPro
          onClick={handlePlanetaClick}
          isSelected={false}
          hasAlert={false}
          estadoMovimientos="transfiriendo"
          estadisticas={{ transferencias: 12 }}
          actividadRed={85}
        />
        <div style={estilosLabel}>🔄 Movimientos Pro</div>
      </div>

      {/* Instrucciones de uso */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '10px',
        fontSize: '0.8rem',
        maxWidth: '250px'
      }}>
        <strong style={{ color: '#10b981' }}>✅ ¿Funciona?</strong>
        <p style={{ margin: '5px 0' }}>
          Haz clic en los planetas para probar la interactividad.
          Deberías ver efectos únicos en cada uno.
        </p>
        <p style={{ margin: '5px 0', fontSize: '0.75rem', opacity: 0.8 }}>
          Si funcionan aquí, pueden integrarse al sistema principal.
        </p>
      </div>
    </div>
  );
};

export default TestPlanetasProfesionales;
