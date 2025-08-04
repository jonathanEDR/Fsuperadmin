import React from 'react';
import './designTokens.css';

// PRUEBA DE COMPONENTES PROFESIONALES
const TestComponentesProfesionales = () => {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#1a1a2e',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        🚀 PRUEBA DE COMPONENTES PROFESIONALES
      </h1>
      
      <div style={{ 
        display: 'grid', 
        gap: '20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        
        {/* PRUEBA 1: SistemaSolarProfesional */}
        <div style={{ 
          border: '2px solid #00ff88',
          borderRadius: '10px',
          padding: '20px',
          backgroundColor: '#0a0a15'
        }}>
          <h2>✅ PRUEBA 1: Sistema Solar Profesional</h2>
          <p>Importa y renderiza SistemaSolarProfesional:</p>
          <code style={{ 
            display: 'block',
            backgroundColor: '#1a1a2e',
            padding: '10px',
            borderRadius: '5px',
            marginTop: '10px'
          }}>
            {`import SistemaSolarProfesional from './SistemaSolarProfesional';`}
          </code>
          <div style={{ 
            height: '60px',
            backgroundColor: '#16213e',
            borderRadius: '5px',
            marginTop: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}>
            Aquí se renderizaría &lt;SistemaSolarProfesional /&gt;
          </div>
        </div>

        {/* PRUEBA 2: TestPlanetasProfesionales */}
        <div style={{ 
          border: '2px solid #00d4ff',
          borderRadius: '10px',
          padding: '20px',
          backgroundColor: '#0a0a15'
        }}>
          <h2>🔍 PRUEBA 2: Test Individual de Planetas</h2>
          <p>Importa y prueba TestPlanetasProfesionales:</p>
          <code style={{ 
            display: 'block',
            backgroundColor: '#1a1a2e',
            padding: '10px',
            borderRadius: '5px',
            marginTop: '10px'
          }}>
            {`import TestPlanetasProfesionales from './TestPlanetasProfesionales';`}
          </code>
          <div style={{ 
            height: '60px',
            backgroundColor: '#16213e',
            borderRadius: '5px',
            marginTop: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}>
            Aquí se renderizaría &lt;TestPlanetasProfesionales /&gt;
          </div>
        </div>

        {/* PRUEBA 3: SistemaSolarProduccion */}
        <div style={{ 
          border: '2px solid #ff6b6b',
          borderRadius: '10px',
          padding: '20px',
          backgroundColor: '#0a0a15'
        }}>
          <h2>🎯 PRUEBA 3: Sistema Principal Actualizado</h2>
          <p>Importa y usa SistemaSolarProduccion (con planetas profesionales):</p>
          <code style={{ 
            display: 'block',
            backgroundColor: '#1a1a2e',
            padding: '10px',
            borderRadius: '5px',
            marginTop: '10px'
          }}>
            {`import SistemaSolarProduccion from './SistemaSolarProduccion';`}
          </code>
          <div style={{ 
            height: '60px',
            backgroundColor: '#16213e',
            borderRadius: '5px',
            marginTop: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}>
            Aquí se renderizaría &lt;SistemaSolarProduccion /&gt;
          </div>
        </div>

        {/* INSTRUCCIONES */}
        <div style={{ 
          border: '2px solid #ffd93d',
          borderRadius: '10px',
          padding: '20px',
          backgroundColor: '#2a2a0a'
        }}>
          <h2>📋 INSTRUCCIONES DE PRUEBA</h2>
          <ol style={{ lineHeight: '1.6' }}>
            <li><strong>Paso 1:</strong> Usa este componente para probar que todas las rutas funcionan</li>
            <li><strong>Paso 2:</strong> Reemplaza las cajas de demostración con los componentes reales</li>
            <li><strong>Paso 3:</strong> Verifica que los planetas se ven redondos y profesionales</li>
            <li><strong>Paso 4:</strong> Si funciona todo, integra en tu app principal</li>
          </ol>
        </div>

      </div>
    </div>
  );
};

export default TestComponentesProfesionales;
