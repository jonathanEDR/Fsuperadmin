import { useState, useEffect } from 'react';
import { PLANETAS_CONFIG } from '../data/planetasConfig';

/**
 * Hook para manejar efectos específicos de planetas
 * @param {string} planetaId - ID del planeta
 * @param {string} estado - Estado actual del planeta
 * @param {boolean} efectosActivos - Si los efectos están habilitados
 */
export const usePlanetEffects = (planetaId, estado = 'normal', efectosActivos = true) => {
  const [efectosActuales, setEfectosActuales] = useState([]);
  const [animacionActiva, setAnimacionActiva] = useState(null);

  useEffect(() => {
    if (!efectosActivos || !planetaId) {
      setEfectosActuales([]);
      setAnimacionActiva(null);
      return;
    }

    const config = PLANETAS_CONFIG[planetaId];
    if (!config) return;

    // Obtener efectos base del planeta
    const efectosBase = config.efectos;
    
    // Obtener efectos específicos del estado
    const estadoConfig = config.estados[estado];
    
    // Combinar efectos
    const efectosCombinados = {
      ...efectosBase,
      ...estadoConfig
    };

    setEfectosActuales(efectosCombinados);
    setAnimacionActiva(config.animaciones);

  }, [planetaId, estado, efectosActivos]);

  return {
    efectosActuales,
    animacionActiva,
    configuracion: PLANETAS_CONFIG[planetaId]
  };
};

/**
 * Hook para manejar animaciones orbitales
 * @param {number} orbita - Número de órbita (1, 2, 3)
 * @param {boolean} activa - Si la animación está activa
 */
export const useOrbitalAnimation = (orbita, activa = true) => {
  const [rotacion, setRotacion] = useState(0);
  const [velocidad, setVelocidad] = useState(1);

  useEffect(() => {
    if (!activa) return;

    // Calcular velocidad basada en la órbita (más lejos = más lento)
    const velocidadBase = orbita === 1 ? 1 : orbita === 2 ? 0.7 : 0.5;
    setVelocidad(velocidadBase);

    const interval = setInterval(() => {
      setRotacion(prev => (prev + velocidadBase) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, [orbita, activa]);

  return {
    rotacion,
    velocidad,
    transformOrital: `rotateX(75deg) rotateZ(${rotacion}deg)`
  };
};

/**
 * Hook para efectos de partículas dinámicas
 * @param {string} tipo - Tipo de partículas
 * @param {number} cantidad - Cantidad de partículas
 * @param {boolean} activas - Si las partículas están activas
 */
export const useParticleEffects = (tipo = 'organicas', cantidad = 6, activas = true) => {
  const [particulas, setParticulas] = useState([]);
  const [configuracion, setConfiguracion] = useState(null);

  useEffect(() => {
    if (!activas) {
      setParticulas([]);
      return;
    }

    // Configuraciones por tipo de partícula
    const configs = {
      organicas: {
        forma: 'circle',
        colores: ['#10b981', '#059669', '#047857'],
        velocidad: 'lenta',
        comportamiento: 'flotante'
      },
      metalicas: {
        forma: 'square',
        colores: ['#3b82f6', '#1d4ed8', '#60a5fa'],
        velocidad: 'media',
        comportamiento: 'chispas'
      },
      energia: {
        forma: 'star',
        colores: ['#f59e0b', '#d97706', '#fbbf24'],
        velocidad: 'rapida',
        comportamiento: 'ondulante'
      },
      industriales: {
        forma: 'hexagon',
        colores: ['#8b5cf6', '#7c3aed', '#a78bfa'],
        velocidad: 'ritmica',
        comportamiento: 'vapor'
      },
      residuales: {
        forma: 'triangle',
        colores: ['#dc2626', '#b91c1c', '#f87171'],
        velocidad: 'lenta',
        comportamiento: 'disperso'
      },
      flujo: {
        forma: 'arrow',
        colores: ['#06b6d4', '#0891b2', '#22d3ee'],
        velocidad: 'muy-rapida',
        comportamiento: 'direccional'
      }
    };

    const config = configs[tipo] || configs.organicas;
    setConfiguracion(config);

    // Generar partículas
    const nuevasParticulas = Array.from({ length: cantidad }, (_, index) => ({
      id: index,
      color: config.colores[index % config.colores.length],
      delay: index * (2 / cantidad),
      angulo: (360 / cantidad) * index,
      velocidad: config.velocidad,
      forma: config.forma
    }));

    setParticulas(nuevasParticulas);

  }, [tipo, cantidad, activas]);

  return {
    particulas,
    configuracion
  };
};

/**
 * Hook para manejar estados responsivos
 * @param {Object} breakpoints - Puntos de quiebre personalizados
 */
export const useResponsiveLayout = (breakpoints = {}) => {
  const [layout, setLayout] = useState('desktop');
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  const defaultBreakpoints = {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
    xl: 1280,
    ...breakpoints
  };

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setDimensions({ width, height });

      if (width <= defaultBreakpoints.mobile) {
        setLayout('mobile');
      } else if (width <= defaultBreakpoints.tablet) {
        setLayout('tablet');
      } else if (width <= defaultBreakpoints.desktop) {
        setLayout('desktop');
      } else {
        setLayout('xl');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    layout,
    dimensions,
    isMobile: layout === 'mobile',
    isTablet: layout === 'tablet',
    isDesktop: layout === 'desktop' || layout === 'xl',
    isXL: layout === 'xl'
  };
};

/**
 * Hook para obtener estadísticas del sistema
 * @param {Array} modulos - Lista de módulos a monitorear
 */
export const useSystemStats = (modulos = []) => {
  const [estadisticas, setEstadisticas] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        setLoading(true);
        
        // Simulación de carga de estadísticas
        // En un caso real, aquí harías llamadas a tu API
        const stats = {};
        
        for (const modulo of modulos) {
          stats[modulo] = {
            total: Math.floor(Math.random() * 100),
            activos: Math.floor(Math.random() * 80),
            alertas: Math.floor(Math.random() * 5),
            estado: Math.random() > 0.8 ? 'alerta' : 'normal'
          };
        }
        
        setEstadisticas(stats);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (modulos.length > 0) {
      cargarEstadisticas();
      
      // Actualizar cada 30 segundos
      const interval = setInterval(cargarEstadisticas, 30000);
      return () => clearInterval(interval);
    }
  }, [modulos]);

  return {
    estadisticas,
    loading,
    error,
    actualizar: () => {
      if (modulos.length > 0) {
        cargarEstadisticas();
      }
    }
  };
};

/**
 * Hook para efectos de hover y selección
 * @param {boolean} habilitado - Si los efectos están habilitados
 */
export const useInteractionEffects = (habilitado = true) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handlers = habilitado ? {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    onClick: () => setIsSelected(!isSelected)
  } : {};

  const resetear = () => {
    setIsHovered(false);
    setIsSelected(false);
    setIsPressed(false);
  };

  const seleccionar = (estado = true) => {
    setIsSelected(estado);
  };

  return {
    isHovered,
    isSelected,
    isPressed,
    handlers,
    resetear,
    seleccionar
  };
};
