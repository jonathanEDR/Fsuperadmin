import { useState, useEffect, useRef } from 'react';
import { ORBITAS_CONFIG, ANIMACIONES_CONFIG } from '../sistemaSolarConfig';

export const useOrbitalAnimation = (orbita, angloInicial = 0) => {
  const [anguloActual, setAnguloActual] = useState(angloInicial);
  const [esPausado, setEsPausado] = useState(false);
  const [velocidadMultiplicador, setVelocidadMultiplicador] = useState(1);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (esPausado) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const configuracionOrbita = ORBITAS_CONFIG[orbita];
    if (!configuracionOrbita) return;

    // Calcular incremento por frame (60fps)
    const velocidadBase = configuracionOrbita.velocidad * velocidadMultiplicador;
    const incrementoPorFrame = (360 / velocidadBase) / 60; // grados por frame

    intervalRef.current = setInterval(() => {
      setAnguloActual(prevAngulo => (prevAngulo + incrementoPorFrame) % 360);
    }, 1000 / 60); // 60fps

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [orbita, esPausado, velocidadMultiplicador]);

  const pausar = () => setEsPausado(true);
  const reanudar = () => setEsPausado(false);
  const alternarPausa = () => setEsPausado(prev => !prev);
  
  const cambiarVelocidad = (nuevaVelocidad) => {
    setVelocidadMultiplicador(nuevaVelocidad);
  };

  const irAAngulo = (nuevoAngulo) => {
    setAnguloActual(nuevoAngulo);
  };

  return {
    anguloActual,
    esPausado,
    velocidadMultiplicador,
    pausar,
    reanudar,
    alternarPausa,
    cambiarVelocidad,
    irAAngulo
  };
};
