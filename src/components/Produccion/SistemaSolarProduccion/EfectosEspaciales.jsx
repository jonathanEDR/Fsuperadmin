import React, { useState, useEffect } from 'react';
import styles from './EfectosEspaciales.module.css';

const EfectosEspaciales = ({ 
  activo = true,
  densidad = 'normal', // 'low', 'normal', 'high'
  className = ""
}) => {
  const [estrellas, setEstrellas] = useState([]);
  const [cometas, setCometas] = useState([]);
  const [meteoros, setMeteoros] = useState([]);
  const [nebulosas, setNebulosas] = useState([]);

  useEffect(() => {
    if (!activo) return;

    const densidades = {
      low: { estrellas: 80, cometas: 1, meteoros: 1, nebulosas: 2 },
      normal: { estrellas: 150, cometas: 2, meteoros: 2, nebulosas: 3 },
      high: { estrellas: 300, cometas: 3, meteoros: 3, nebulosas: 5 }
    };

    const config = densidades[densidad] || densidades.normal;

    // Generar estrellas más realistas
    const nuevasEstrellas = Array.from({ length: config.estrellas }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      tamaño: Math.random() * 4 + 0.5, // 0.5-4.5px
      opacidad: Math.random() * 0.9 + 0.1, // 0.1-1
      duracionParpadeo: Math.random() * 4 + 2, // 2-6s
      delay: Math.random() * 3,
      tipo: Math.random() > 0.8 ? 'brillante' : Math.random() > 0.6 ? 'pulsar' : 'normal',
      color: ['#ffffff', '#ffffcc', '#ccddff', '#ffcccc'][Math.floor(Math.random() * 4)]
    }));
    setEstrellas(nuevasEstrellas);

    // Generar nebulosas de fondo
    const nuevasNebulosas = Array.from({ length: config.nebulosas }, (_, i) => ({
      id: i,
      x: Math.random() * 120 - 10, // -10% a 110%
      y: Math.random() * 120 - 10,
      tamaño: Math.random() * 400 + 200, // 200-600px
      opacidad: Math.random() * 0.15 + 0.05, // 0.05-0.2
      color: [
        'rgba(138, 43, 226, 0.1)', // Púrpura
        'rgba(75, 0, 130, 0.08)', // Índigo
        'rgba(30, 144, 255, 0.06)', // Azul
        'rgba(123, 104, 238, 0.09)', // Violeta medio
        'rgba(147, 0, 211, 0.07)', // Violeta oscuro
        'rgba(255, 20, 147, 0.05)' // Rosa profundo
      ][Math.floor(Math.random() * 6)],
      rotacion: Math.random() * 360,
      velocidadRotacion: Math.random() * 60 + 30, // 30-90s
      velocidadPulso: Math.random() * 10 + 8 // 8-18s
    }));
    setNebulosas(nuevasNebulosas);

    // Generar cometas ocasionales más realistas
    const generarCometa = () => {
      const esDiagonal = Math.random() > 0.5;
      const nuevoCometa = {
        id: Date.now() + Math.random(),
        startX: esDiagonal ? (Math.random() > 0.5 ? -15 : 115) : Math.random() * 130 - 15,
        startY: esDiagonal ? Math.random() * 130 - 15 : (Math.random() > 0.5 ? -15 : 115),
        endX: esDiagonal ? (Math.random() > 0.5 ? 115 : -15) : Math.random() * 130 - 15,
        endY: esDiagonal ? Math.random() * 130 - 15 : (Math.random() > 0.5 ? 115 : -15),
        duracion: Math.random() * 12 + 8, // 8-20s
        tamaño: Math.random() * 3 + 1.5, // 1.5-4.5px
        cola: Math.random() * 100 + 60, // 60-160px
        color: ['#87ceeb', '#add8e6', '#87cefa', '#e0e6ff', '#b0e0e6'][Math.floor(Math.random() * 5)],
        brillo: Math.random() * 0.8 + 0.4 // 0.4-1.2
      };
      
      setCometas(prev => [...prev.slice(-2), nuevoCometa]); // Máximo 3 cometas
      
      setTimeout(() => {
        setCometas(prev => prev.filter(c => c.id !== nuevoCometa.id));
      }, nuevoCometa.duracion * 1000);
    };

    // Generar meteoros rápidos
    const generarMeteoro = () => {
      const nuevoMeteoro = {
        id: Date.now() + Math.random(),
        startX: Math.random() * 50 + 50, // Empiezan desde la derecha
        startY: Math.random() * 30, // Parte superior
        endX: Math.random() * 50, // Terminan a la izquierda
        endY: Math.random() * 40 + 60, // Parte inferior
        duracion: Math.random() * 2 + 1, // 1-3s (muy rápidos)
        tamaño: Math.random() * 2 + 1,
        intensidad: Math.random() * 0.9 + 0.5
      };
      
      setMeteoros(prev => [...prev.slice(-1), nuevoMeteoro]); // Máximo 2 meteoros
      
      setTimeout(() => {
        setMeteoros(prev => prev.filter(m => m.id !== nuevoMeteoro.id));
      }, nuevoMeteoro.duracion * 1000);
    };

    // Crear cometas aleatorios
    const intervaloCometas = setInterval(() => {
      if (Math.random() < 0.25) { // 25% de probabilidad cada 8s
        generarCometa();
      }
    }, 8000);

    // Crear meteoros ocasionales
    const intervaloMeteoros = setInterval(() => {
      if (Math.random() < 0.15) { // 15% de probabilidad cada 12s
        generarMeteoro();
      }
    }, 12000);

    return () => {
      clearInterval(intervaloCometas);
      clearInterval(intervaloMeteoros);
    };
  }, [activo, densidad]);

  if (!activo) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Fondo espacial profundo con múltiples capas */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 150% 100% at 50% 0%, rgba(25, 25, 112, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse 120% 80% at 20% 80%, rgba(75, 0, 130, 0.3) 0%, transparent 60%),
            radial-gradient(ellipse 100% 120% at 80% 20%, rgba(72, 61, 139, 0.25) 0%, transparent 70%),
            radial-gradient(ellipse 80% 60% at 60% 60%, rgba(123, 104, 238, 0.2) 0%, transparent 50%),
            linear-gradient(135deg, 
              #000511 0%, 
              #0a0a2e 15%, 
              #1a1a3e 30%, 
              #2d1b69 45%, 
              #1a1a3e 60%, 
              #0f0f2a 80%, 
              #000511 100%
            )
          `
        }}
      />

      {/* Nebulosas de fondo */}
      {nebulosas.map((nebula) => (
        <div
          key={`nebula-${nebula.id}`}
          className="absolute"
          style={{
            left: `${nebula.x}%`,
            top: `${nebula.y}%`,
            width: `${nebula.tamaño}px`,
            height: `${nebula.tamaño}px`,
            background: `radial-gradient(ellipse, ${nebula.color}, transparent 70%)`,
            opacity: nebula.opacidad,
            transform: `rotate(${nebula.rotacion}deg)`,
            animation: `
              rotarNebula ${nebula.velocidadRotacion}s linear infinite,
              pulsarNebula ${nebula.velocidadPulso}s ease-in-out infinite alternate
            `,
            filter: 'blur(1px)'
          }}
        />
      ))}

      {/* Campo de estrellas lejanas (textura) */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(0.5px 0.5px at 5% 8%, #ffffff, transparent),
            radial-gradient(0.5px 0.5px at 95% 12%, #ffffcc, transparent),
            radial-gradient(0.5px 0.5px at 15% 25%, #ccddff, transparent),
            radial-gradient(0.5px 0.5px at 85% 35%, #ffffff, transparent),
            radial-gradient(0.5px 0.5px at 25% 45%, #ffcccc, transparent),
            radial-gradient(0.5px 0.5px at 75% 55%, #ffffcc, transparent),
            radial-gradient(0.5px 0.5px at 35% 65%, #ccddff, transparent),
            radial-gradient(0.5px 0.5px at 65% 75%, #ffffff, transparent),
            radial-gradient(0.5px 0.5px at 45% 85%, #ffffcc, transparent),
            radial-gradient(0.5px 0.5px at 55% 95%, #ccddff, transparent)
          `,
          backgroundSize: '180px 180px, 220px 220px, 160px 160px, 200px 200px, 240px 240px, 190px 190px, 170px 170px, 210px 210px, 150px 150px, 230px 230px',
          animation: 'moverEstrellasFondo 120s linear infinite'
        }}
      />

      {/* Estrellas principales */}
      {estrellas.map((estrella) => (
        <div
          key={`estrella-${estrella.id}`}
          className={`absolute rounded-full ${
            estrella.tipo === 'brillante' ? 'animate-pulse' : 
            estrella.tipo === 'pulsar' ? '' : ''
          }`}
          style={{
            left: `${estrella.x}%`,
            top: `${estrella.y}%`,
            width: `${estrella.tamaño}px`,
            height: `${estrella.tamaño}px`,
            backgroundColor: estrella.color,
            opacity: estrella.opacidad,
            boxShadow: estrella.tipo === 'brillante' 
              ? `0 0 ${estrella.tamaño * 3}px ${estrella.color}, 0 0 ${estrella.tamaño * 6}px ${estrella.color}40`
              : estrella.tipo === 'pulsar'
              ? `0 0 ${estrella.tamaño * 2}px ${estrella.color}`
              : 'none',
            animation: estrella.tipo === 'pulsar' 
              ? `titilarPulsar ${estrella.duracionParpadeo}s ease-in-out infinite ${estrella.delay}s`
              : `titilar ${estrella.duracionParpadeo}s ease-in-out infinite ${estrella.delay}s`,
            filter: estrella.tipo === 'brillante' ? 'blur(0.3px)' : 'none'
          }}
        />
      ))}

      {/* Cometas */}
      {cometas.map((cometa) => (
        <div
          key={`cometa-${cometa.id}`}
          className="absolute"
          style={{
            left: `${cometa.startX}%`,
            top: `${cometa.startY}%`,
            animation: `moverCometa-${cometa.id} ${cometa.duracion}s linear forwards`
          }}
        >
          {/* Núcleo del cometa */}
          <div
            className="absolute rounded-full"
            style={{
              width: `${cometa.tamaño * 2}px`,
              height: `${cometa.tamaño * 2}px`,
              backgroundColor: cometa.color,
              boxShadow: `
                0 0 ${cometa.tamaño * 6}px ${cometa.color},
                0 0 ${cometa.tamaño * 12}px ${cometa.color}80,
                0 0 ${cometa.tamaño * 20}px ${cometa.color}40
              `,
              opacity: cometa.brillo
            }}
          />
          
          {/* Cola principal del cometa */}
          <div
            className="absolute top-1/2 left-full"
            style={{
              width: `${cometa.cola}px`,
              height: '3px',
              background: `linear-gradient(90deg, ${cometa.color}ee, ${cometa.color}aa, ${cometa.color}66, transparent)`,
              transform: 'translateY(-50%)',
              filter: 'blur(1px)'
            }}
          />
          
          {/* Cola secundaria más amplia */}
          <div
            className="absolute top-1/2 left-full"
            style={{
              width: `${cometa.cola * 0.7}px`,
              height: '6px',
              background: `linear-gradient(90deg, ${cometa.color}aa, ${cometa.color}44, transparent)`,
              transform: 'translateY(-50%)',
              filter: 'blur(2px)'
            }}
          />
          
          {/* Animación específica del cometa */}
          <style jsx>{`
            @keyframes moverCometa-${cometa.id} {
              0% {
                transform: translate(0, 0);
                opacity: 0;
              }
              5% {
                opacity: ${cometa.brillo * 0.3};
              }
              15% {
                opacity: ${cometa.brillo};
              }
              85% {
                opacity: ${cometa.brillo};
              }
              95% {
                opacity: ${cometa.brillo * 0.3};
              }
              100% {
                transform: translate(${cometa.endX - cometa.startX}vw, ${cometa.endY - cometa.startY}vh);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      ))}

      {/* Meteoros rápidos */}
      {meteoros.map((meteoro) => (
        <div
          key={`meteoro-${meteoro.id}`}
          className="absolute"
          style={{
            left: `${meteoro.startX}%`,
            top: `${meteoro.startY}%`,
            animation: `moverMeteoro-${meteoro.id} ${meteoro.duracion}s linear forwards`
          }}
        >
          {/* Cabeza del meteoro */}
          <div
            className="absolute bg-orange-300 rounded-full"
            style={{
              width: `${meteoro.tamaño}px`,
              height: `${meteoro.tamaño}px`,
              boxShadow: `0 0 ${meteoro.tamaño * 4}px #ffa500, 0 0 ${meteoro.tamaño * 8}px #ff4500`
            }}
          />
          
          {/* Estela del meteoro */}
          <div
            className="absolute top-1/2 left-full"
            style={{
              width: `${meteoro.tamaño * 15}px`,
              height: '2px',
              background: 'linear-gradient(90deg, #ffa500, #ff4500, transparent)',
              transform: 'translateY(-50%)',
              filter: 'blur(1px)'
            }}
          />
          
          <style jsx>{`
            @keyframes moverMeteoro-${meteoro.id} {
              0% {
                transform: translate(0, 0);
                opacity: 0;
              }
              10% {
                opacity: ${meteoro.intensidad};
              }
              90% {
                opacity: ${meteoro.intensidad};
              }
              100% {
                transform: translate(${meteoro.endX - meteoro.startX}vw, ${meteoro.endY - meteoro.startY}vh);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      ))}

      {/* Polvo cósmico flotante */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            radial-gradient(circle at 10% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 2%),
            radial-gradient(circle at 80% 40%, rgba(255, 255, 255, 0.08) 0%, transparent 2%),
            radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.06) 0%, transparent 2%),
            radial-gradient(circle at 90% 10%, rgba(255, 255, 255, 0.05) 0%, transparent 2%),
            radial-gradient(circle at 30% 60%, rgba(255, 255, 255, 0.04) 0%, transparent 2%)
          `,
          backgroundSize: '300px 300px, 400px 400px, 350px 350px, 280px 280px, 320px 320px',
          animation: 'flotarPolvo 45s linear infinite'
        }}
      />

      {/* Brillo galáctico sutil */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          background: `
            radial-gradient(ellipse 200% 100% at 50% 0%, rgba(138, 43, 226, 0.6) 0%, transparent 40%),
            radial-gradient(ellipse 100% 200% at 0% 50%, rgba(75, 0, 130, 0.4) 0%, transparent 40%),
            radial-gradient(ellipse 150% 150% at 100% 100%, rgba(72, 61, 139, 0.5) 0%, transparent 40%)
          `,
          animation: 'ondularGalaxia 25s ease-in-out infinite'
        }}
      />
    </div>
  );
};

export default EfectosEspaciales;
