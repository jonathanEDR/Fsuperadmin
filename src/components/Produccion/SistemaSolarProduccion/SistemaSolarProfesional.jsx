import React, { useState } from 'react';
import { useResponsiveLayout } from './hooks/usePlanetEffects';
import SolCentral from './components/SolCentral/SolCentral';

// IMPORTAR LAS VERSIONES PROFESIONALES
import PlanetaIngredientesPro from './components/planetas/PlanetaIngredientes/PlanetaIngredientesPro';
import PlanetaRecetasPro from './components/planetas/PlanetaRecetas/PlanetaRecetasPro';
import PlanetaProduccionPro from './components/planetas/PlanetaProduccion/PlanetaProduccionPro';
import PlanetaMovimientosPro from './components/planetas/PlanetaMovimientos/PlanetaMovimientosPro';
import PlanetaMateriales from './components/planetas/PlanetaMateriales/PlanetaMateriales';
import PlanetaResiduos from './components/planetas/PlanetaResiduos/PlanetaResiduos';

import styles from './sistemaSolarAvanzado.module.css';

/**
 * 🌌 SISTEMA SOLAR PROFESIONAL - VERSIÓN COMPLETA
 * 
 * ✨ NUEVAS CARACTERÍSTICAS PROFESIONALES:
 * - Design tokens centralizados
 * - Efectos visuales avanzados
 * - Planetas con estilos únicos y profesionales
 * - Animaciones fluidas y micro-interacciones
 * - Sistema de colores unificado
 * - Responsive design completo
 * - Accesibilidad avanzada
 * 
 * 🎨 PLANETAS PROFESIONALES INCLUIDOS:
 * ✅ PlanetaIngredientesPro - Estilo orgánico refinado
 * ✅ PlanetaRecetasPro - Estilo culinario profesional  
 * ✅ PlanetaProduccionPro - Estilo industrial moderno
 * ✅ PlanetaMovimientosPro - Estilo dinámico fluido
 * 🚧 PlanetaResiduosPro - Estilo ecológico consciente (pendiente)
 */

const SistemaSolarProfesional = ({ onPlanetaClick }) => {
  const { layout, isMobile, isTablet } = useResponsiveLayout();
  const [planetaSeleccionado, setPlanetaSeleccionado] = useState(null);
  const [efectosActivos, setEfectosActivos] = useState(true);

  // Estadísticas simuladas con datos más realistas
  const estadisticas = {
    sol: { 
      total: 6,
      activos: 4,
      alertas: 1
    },
    ingredientes: { 
      cantidad: 24, 
      estado: 'normal',
      stock_bajo: 3,
      alertas: false
    },
    recetas: {
      activas: 8,
      estado: 'cocinando',
      completadas: 12,
      alertas: true
    },
    produccion: {
      ordenesActivas: 5,
      estado: 'produciendo',
      nivel: 75,
      alertas: false
    },
    materiales: { 
      cantidad: 18, 
      estado: 'activo',
      alertas: false
    },
    movimientos: {
      transferencias: 12,
      estado: 'transfiriendo',
      alertas: false
    },
    residuos: {
      pendientes: 6,
      estado: 'normal',
      reciclados: 15,
      alertas: false
    }
  };

  const handlePlanetaClick = (planetaId, data = {}) => {
    console.log(`🌟 Planeta seleccionado: ${planetaId}`, data);
    setPlanetaSeleccionado(planetaId);
    if (onPlanetaClick) {
      onPlanetaClick(planetaId, data);
    }
  };

  const toggleEfectos = () => {
    setEfectosActivos(!efectosActivos);
  };

  const getEstilosSistemaSolar = () => {
    const baseStyles = {
      position: 'relative',
      width: '100%',
      height: '100vh',
      background: 'radial-gradient(ellipse at center, #1a0d3e 0%, #0a0118 70%, #000000 100%)',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };

    if (isMobile) {
      baseStyles.height = '100vh';
      baseStyles.padding = '10px';
    }

    return baseStyles;
  };

  const getEstilosOrbita = (radio, zIndex = 5) => ({
    position: 'absolute',
    width: `${radio * 2}px`,
    height: `${radio * 2}px`,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex,
    animation: `orbit-rotation 60s linear infinite`,
    pointerEvents: 'none'
  });

  return (
    <div style={getEstilosSistemaSolar()}>
      
      {/* Panel de control profesional */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 200,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '20px',
        borderRadius: '15px',
        color: 'white',
        fontSize: '0.85rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        minWidth: '250px'
      }}>
        <h3 style={{ 
          margin: '0 0 15px 0', 
          color: '#60a5fa',
          fontSize: '1.1rem',
          fontWeight: 'bold'
        }}>
          🌌 Sistema Solar Profesional
        </h3>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Layout:</strong> <span style={{ color: '#10b981' }}>{layout}</span>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <strong>Seleccionado:</strong> 
          <span style={{ 
            color: planetaSeleccionado ? '#f59e0b' : '#6b7280',
            marginLeft: '5px'
          }}>
            {planetaSeleccionado || 'Ninguno'}
          </span>
        </div>
        
        <button
          onClick={toggleEfectos}
          style={{
            background: efectosActivos 
              ? 'linear-gradient(135deg, #10b981, #059669)' 
              : 'linear-gradient(135deg, #6b7280, #4b5563)',
            color: 'white',
            border: 'none',
            padding: '8px 15px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            width: '100%'
          }}
        >
          {efectosActivos ? '✨ Efectos Profesionales ON' : '⭕ Efectos OFF'}
        </button>
        
        <div style={{ 
          marginTop: '20px', 
          fontSize: '0.75rem', 
          opacity: 0.9,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '15px'
        }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#60a5fa' }}>
            Estado de Planetas:
          </div>
          <div style={{ color: '#10b981', marginBottom: '3px' }}>✅ Sol Central</div>
          <div style={{ color: '#10b981', marginBottom: '3px' }}>✅ Ingredientes Pro</div>
          <div style={{ color: '#10b981', marginBottom: '3px' }}>✅ Recetas Pro</div>
          <div style={{ color: '#10b981', marginBottom: '3px' }}>✅ Producción Pro</div>
          <div style={{ color: '#10b981', marginBottom: '3px' }}>✅ Movimientos Pro</div>
          <div style={{ color: '#f59e0b', marginBottom: '3px' }}>🚧 Materiales (original)</div>
          <div style={{ color: '#f59e0b' }}>🚧 Residuos (original)</div>
        </div>
      </div>

      {/* Órbitas profesionales */}
      {efectosActivos && (
        <>
          <div style={getEstilosOrbita(120, 1)}></div>
          <div style={getEstilosOrbita(180, 1)}></div>
          <div style={getEstilosOrbita(240, 1)}></div>
        </>
      )}

      {/* Sol Central */}
      <SolCentral 
        onClick={() => handlePlanetaClick('sol')}
        isSelected={planetaSeleccionado === 'sol'}
        estadisticas={estadisticas.sol}
        efectosActivos={efectosActivos}
      />

      {/* ÓRBITA 1 - Ingredientes y Materiales */}
      <div style={{
        position: 'absolute',
        width: '240px',
        height: '240px',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 5
      }}>
        {/* Planeta Ingredientes PROFESIONAL */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10
        }}>
          <PlanetaIngredientesPro
            onClick={handlePlanetaClick}
            isSelected={planetaSeleccionado === 'ingredientes'}
            hasAlert={estadisticas.ingredientes.alertas}
            estadoIngredientes={estadisticas.ingredientes.estado}
            estadisticas={estadisticas.ingredientes}
          />
        </div>

        {/* Planeta Materiales (versión original por ahora) */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10
        }}>
          <PlanetaMateriales
            onClick={handlePlanetaClick}
            tieneAlerta={estadisticas.materiales.alertas}
            seleccionado={planetaSeleccionado === 'materiales'}
            estadisticas={estadisticas.materiales}
          />
        </div>
      </div>

      {/* ÓRBITA 2 - Recetas y Producción */}
      <div style={{
        position: 'absolute',
        width: '360px',
        height: '360px',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 5
      }}>
        {/* Planeta Recetas PROFESIONAL */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10
        }}>
          <PlanetaRecetasPro
            onClick={handlePlanetaClick}
            isSelected={planetaSeleccionado === 'recetas'}
            hasAlert={estadisticas.recetas.alertas}
            estadoRecetas={estadisticas.recetas.estado}
            estadisticas={estadisticas.recetas}
          />
        </div>

        {/* Planeta Producción PROFESIONAL */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          zIndex: 10
        }}>
          <PlanetaProduccionPro
            onClick={handlePlanetaClick}
            isSelected={planetaSeleccionado === 'produccion'}
            hasAlert={estadisticas.produccion.alertas}
            estadoProduccion={estadisticas.produccion.estado}
            estadisticas={estadisticas.produccion}
            nivelProduccion={estadisticas.produccion.nivel}
          />
        </div>
      </div>

      {/* ÓRBITA 3 - Movimientos y Residuos */}
      <div style={{
        position: 'absolute',
        width: '480px',
        height: '480px',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 5
      }}>
        {/* Planeta Movimientos PROFESIONAL */}
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '10px',
          transform: 'translateY(-50%)',
          zIndex: 10
        }}>
          <PlanetaMovimientosPro
            onClick={handlePlanetaClick}
            isSelected={planetaSeleccionado === 'movimientos'}
            hasAlert={estadisticas.movimientos.alertas}
            estadoMovimientos={estadisticas.movimientos.estado}
            estadisticas={estadisticas.movimientos}
            actividadRed={75}
          />
        </div>

        {/* Planeta Residuos (versión original por ahora) */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '10px',
          transform: 'translateY(-50%)',
          zIndex: 10
        }}>
          <PlanetaResiduos
            onClick={handlePlanetaClick}
            tieneAlerta={estadisticas.residuos.alertas}
            seleccionado={planetaSeleccionado === 'residuos'}
            estadisticas={estadisticas.residuos}
          />
        </div>
      </div>

      {/* Efectos espaciales de fondo */}
      {efectosActivos && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 1
        }}>
          {/* Estrellas animadas */}
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '2px',
                height: '2px',
                background: 'white',
                borderRadius: '50%',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.8 + 0.2,
                animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Estilos CSS en línea para animaciones */}
      <style jsx>{`
        @keyframes orbit-rotation {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SistemaSolarProfesional;
