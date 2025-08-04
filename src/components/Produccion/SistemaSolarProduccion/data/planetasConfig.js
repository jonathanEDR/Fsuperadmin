// 🌌 Configuración centralizada de planetas del Sistema Solar de Producción

export const PLANETAS_CONFIG = {
  ingredientes: {
    id: 'ingredientes',
    nombre: 'Ingredientes',
    icono: '🥗',
    orbita: 1,
    orden: 0,
    colorPrimario: '#10b981',
    colorSecundario: '#059669',
    colorTerciario: '#047857',
    gradiente: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
    efectos: {
      particulas: {
        color: '#10b981',
        cantidad: 6,
        velocidad: 'lenta',
        forma: 'circulo',
        brillo: 0.8
      },
      brilloOrganico: {
        intensidad: 0.7,
        pulso: '3s ease-in-out infinite',
        sombra: '0 0 20px rgba(16, 185, 129, 0.6)'
      },
      estela: {
        color: 'rgba(16, 185, 129, 0.4)',
        longitud: '25px',
        difuminado: '8px'
      }
    },
    animaciones: {
      rotacionPropia: 'rotacion-ingredientes 25s linear infinite',
      pulsacion: 'pulso-organico 4s ease-in-out infinite',
      hover: 'scale(1.15) rotateY(15deg)',
      seleccionado: 'scale(1.25)'
    },
    tamaños: {
      base: 55,
      mobile: 45,
      tablet: 50,
      hover: 1.15,
      seleccionado: 1.25
    },
    estados: {
      normal: { brillo: 1, saturacion: 1 },
      alertaBajo: { brillo: 1.3, saturacion: 1.5, pulso: 'alerta-rapida 1.5s infinite' },
      seleccionado: { brillo: 1.2, saturacion: 1.3, escala: 1.25 }
    }
  },
  
  materiales: {
    id: 'materiales',
    nombre: 'Materiales',
    icono: '🔧',
    orbita: 1,
    orden: 1,
    colorPrimario: '#3b82f6',
    colorSecundario: '#1d4ed8',
    colorTerciario: '#1e40af',
    gradiente: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)',
    efectos: {
      particulas: {
        color: '#3b82f6',
        cantidad: 5,
        velocidad: 'media',
        forma: 'cuadrado',
        brillo: 0.9
      },
      brilloMetalico: {
        intensidad: 0.8,
        pulso: '3.5s ease-in-out infinite',
        sombra: '0 0 25px rgba(59, 130, 246, 0.7)'
      },
      chispas: {
        color: '#60a5fa',
        cantidad: 3,
        velocidad: 'rapida'
      }
    },
    animaciones: {
      rotacionPropia: 'rotacion-mecanica 20s linear infinite',
      pulsacion: 'pulso-metalico 3.5s ease-in-out infinite',
      hover: 'scale(1.12) rotateY(-10deg)',
      engranaje: 'rotacion-engranaje 8s linear infinite'
    },
    tamaños: {
      base: 55,
      mobile: 45,
      tablet: 50,
      hover: 1.12,
      seleccionado: 1.22
    },
    estados: {
      normal: { brillo: 1, saturacion: 1 },
      mantenimiento: { brillo: 0.7, saturacion: 0.8, filtro: 'grayscale(0.3)' },
      activo: { brillo: 1.4, saturacion: 1.6, pulso: 'activo-brillante 2s infinite' }
    }
  },

  recetas: {
    id: 'recetas',
    nombre: 'Recetas',
    icono: '📝',
    orbita: 2,
    orden: 0,
    colorPrimario: '#f59e0b',
    colorSecundario: '#d97706',
    colorTerciario: '#b45309',
    gradiente: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
    efectos: {
      particulas: {
        color: '#f59e0b',
        cantidad: 7,
        velocidad: 'media',
        forma: 'estrella',
        brillo: 1.0
      },
      ondasCalor: {
        intensidad: 0.6,
        velocidad: '4s ease-in-out infinite',
        sombra: '0 0 30px rgba(245, 158, 11, 0.8)'
      },
      brilloDorado: {
        color: 'rgba(251, 191, 36, 0.5)',
        pulso: '3s ease-in-out infinite alternate'
      }
    },
    animaciones: {
      rotacionPropia: 'rotacion-coccion 30s linear infinite',
      ondulacion: 'ondular 4s ease-in-out infinite',
      hover: 'scale(1.18) rotateY(12deg)',
      coccion: 'efecto-coccion 6s ease-in-out infinite'
    },
    tamaños: {
      base: 45,
      mobile: 38,
      tablet: 42,
      hover: 1.18,
      seleccionado: 1.28
    },
    estados: {
      normal: { brillo: 1, saturacion: 1 },
      creando: { brillo: 1.5, saturacion: 1.4, pulso: 'creacion-activa 2.5s infinite' },
      completado: { brillo: 1.3, saturacion: 1.2, efecto: 'brillo-completado' }
    }
  },

  produccion: {
    id: 'produccion',
    nombre: 'Producción',
    icono: '🏭',
    orbita: 2,
    orden: 1,
    colorPrimario: '#8b5cf6',
    colorSecundario: '#7c3aed',
    colorTerciario: '#6d28d9',
    gradiente: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)',
    efectos: {
      particulas: {
        color: '#8b5cf6',
        cantidad: 8,
        velocidad: 'rapida',
        forma: 'hexagono',
        brillo: 0.9
      },
      vaporIndustrial: {
        intensidad: 0.5,
        velocidad: '5s ease-in-out infinite',
        sombra: '0 0 35px rgba(139, 92, 246, 0.7)'
      },
      lucesActividad: {
        color: '#a78bfa',
        parpadeo: '1.5s ease-in-out infinite'
      }
    },
    animaciones: {
      rotacionPropia: 'rotacion-industrial 18s linear infinite',
      pulsacionRitmica: 'pulso-maquinaria 2.8s ease-in-out infinite',
      hover: 'scale(1.16) rotateY(-15deg)',
      maquinaria: 'actividad-industrial 4s ease-in-out infinite'
    },
    tamaños: {
      base: 45,
      mobile: 38,
      tablet: 42,
      hover: 1.16,
      seleccionado: 1.26
    },
    estados: {
      normal: { brillo: 1, saturacion: 1 },
      produciendo: { brillo: 1.6, saturacion: 1.5, pulso: 'produccion-activa 1.8s infinite' },
      detenido: { brillo: 0.6, saturacion: 0.7, filtro: 'opacity(0.8)' }
    }
  },

  residuos: {
    id: 'residuos',
    nombre: 'Residuos',
    icono: '🗑️',
    orbita: 3,
    orden: 0,
    colorPrimario: '#dc2626',
    colorSecundario: '#b91c1c',
    colorTerciario: '#991b1b',
    gradiente: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
    efectos: {
      particulas: {
        color: '#dc2626',
        cantidad: 4,
        velocidad: 'lenta',
        forma: 'triangulo',
        brillo: 0.7,
        dispersas: true
      },
      desintegracion: {
        intensidad: 0.4,
        velocidad: '6s ease-in-out infinite',
        sombra: '0 0 20px rgba(220, 38, 38, 0.6)'
      },
      vibracion: {
        amplitud: '2px',
        frecuencia: '0.3s ease-in-out infinite'
      }
    },
    animaciones: {
      rotacionPropia: 'rotacion-residuos 35s linear infinite',
      vibracion: 'vibrar-suave 4s ease-in-out infinite',
      hover: 'scale(1.14) rotateY(8deg)',
      limpieza: 'efecto-limpieza 5s ease-in-out infinite'
    },
    tamaños: {
      base: 40,
      mobile: 33,
      tablet: 37,
      hover: 1.14,
      seleccionado: 1.24
    },
    estados: {
      normal: { brillo: 1, saturacion: 1 },
      llenaciónAlta: { brillo: 1.4, saturacion: 1.6, pulso: 'alerta-residuos 2s infinite' },
      procesando: { brillo: 0.8, saturacion: 0.9, efecto: 'procesamiento' }
    }
  },

  movimientos: {
    id: 'movimientos',
    nombre: 'Movimientos',
    icono: '📦',
    orbita: 3,
    orden: 1,
    colorPrimario: '#06b6d4',
    colorSecundario: '#0891b2',
    colorTerciario: '#0e7490',
    gradiente: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%)',
    efectos: {
      particulas: {
        color: '#06b6d4',
        cantidad: 6,
        velocidad: 'muy-rapida',
        forma: 'flecha',
        brillo: 1.1
      },
      flujosDatos: {
        intensidad: 0.8,
        velocidad: '2.5s ease-in-out infinite',
        sombra: '0 0 25px rgba(6, 182, 212, 0.8)'
      },
      trazasMovimiento: {
        color: '#22d3ee',
        longitud: '30px',
        velocidad: '1s linear infinite'
      }
    },
    animaciones: {
      rotacionPropia: 'rotacion-datos 15s linear infinite',
      rotacionRapida: 'rotacion-transferencia 12s linear infinite',
      hover: 'scale(1.2) rotateY(20deg)',
      transferencia: 'efecto-transferencia 3s ease-in-out infinite'
    },
    tamaños: {
      base: 40,
      mobile: 33,
      tablet: 37,
      hover: 1.2,
      seleccionado: 1.3
    },
    estados: {
      normal: { brillo: 1, saturacion: 1 },
      sincronizando: { brillo: 1.5, saturacion: 1.4, pulso: 'sincronizacion 1.5s infinite' },
      error: { brillo: 0.8, saturacion: 1.2, filtro: 'hue-rotate(40deg)' }
    }
  }
};

// 🎯 Configuración de órbitas
export const ORBITAS_CONFIG = {
  nivel1: {
    radio: 180,
    radioMobile: 120,
    velocidad: 60, // segundos para completar una órbita
    planetas: ['ingredientes', 'materiales'],
    efectos: {
      particulas: { color: '#ffffff', cantidad: 2 },
      pulso: { duracion: '8s', intensidad: 0.8 }
    },
    estilos: {
      border: '3px solid rgba(255, 255, 255, 0.6)',
      boxShadow: '0 0 25px rgba(255, 255, 255, 0.4), inset 0 0 25px rgba(255, 255, 255, 0.2)'
    }
  },
  nivel2: {
    radio: 280,
    radioMobile: 180,
    velocidad: 90,
    planetas: ['recetas', 'produccion'],
    efectos: {
      particulas: { color: '#8b5cf6', cantidad: 3 },
      pulso: { duracion: '10s', intensidad: 0.9 }
    },
    estilos: {
      border: '3px solid rgba(138, 43, 226, 0.7)',
      boxShadow: '0 0 30px rgba(138, 43, 226, 0.4), inset 0 0 30px rgba(138, 43, 226, 0.2)'
    }
  },
  nivel3: {
    radio: 380,
    radioMobile: 240,
    velocidad: 120,
    planetas: ['residuos', 'movimientos'],
    efectos: {
      particulas: { color: '#4b0082', cantidad: 4 },
      pulso: { duracion: '12s', intensidad: 1.0 }
    },
    estilos: {
      border: '3px solid rgba(75, 0, 130, 0.8)',
      boxShadow: '0 0 35px rgba(75, 0, 130, 0.4), inset 0 0 35px rgba(75, 0, 130, 0.2)'
    }
  }
};

// ⭐ Configuración del Sol Central
export const SOL_CONFIG = {
  tamaños: {
    base: 90,
    mobile: 70,
    tablet: 80,
    hover: 1.15
  },
  efectos: {
    gradiente: 'radial-gradient(circle at 30% 30%, #fff59d, #ffeb3b, #ff9800, #e65100)',
    sombras: [
      '0 0 25px rgba(255, 193, 7, 0.7)',
      '0 0 50px rgba(255, 193, 7, 0.5)',
      '0 0 75px rgba(255, 193, 7, 0.3)',
      '0 0 100px rgba(255, 152, 0, 0.2)'
    ],
    corona: {
      tamaño: '120%',
      rotacion: '8s linear infinite reverse',
      gradiente: 'radial-gradient(circle, transparent 60%, rgba(255, 193, 7, 0.1) 100%)'
    }
  },
  animaciones: {
    pulso: 'sol-pulso 6s ease-in-out infinite',
    rotacion: 'sol-rotacion 30s linear infinite',
    brillo: 'sol-brillo 8s ease-in-out infinite alternate'
  }
};

// 🎨 Configuración de efectos espaciales
export const EFECTOS_ESPACIALES_CONFIG = {
  estrellas: {
    cantidad: 25,
    tamaños: ['pequeña', 'mediana', 'grande'],
    colores: ['#ffffff', '#f0f9ff', '#e0f2fe'],
    animacion: 'estrella-parpadeo 3s ease-in-out infinite'
  },
  cometas: {
    cantidad: 2,
    velocidad: '15s linear infinite',
    tamaño: { width: '4px', height: '4px' },
    cola: { longitud: '20px', degradado: 'linear-gradient(90deg, rgba(255, 255, 255, 0.8), transparent)' }
  },
  nebulas: {
    cantidad: 3,
    colores: ['rgba(138, 43, 226, 0.1)', 'rgba(75, 0, 130, 0.1)', 'rgba(30, 64, 175, 0.1)'],
    animacion: 'nebula-movimiento 30s ease-in-out infinite'
  }
};

// 📱 Configuración responsive
export const RESPONSIVE_CONFIG = {
  breakpoints: {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
    xl: 1280
  },
  factoresEscala: {
    mobile: 0.7,
    tablet: 0.85,
    desktop: 1,
    xl: 1.1
  }
};

// 🎯 Utilidad para obtener configuración de un planeta
export const getPlanetaConfig = (planetaId) => {
  return PLANETAS_CONFIG[planetaId] || null;
};

// 🎯 Utilidad para obtener planetas por órbita
export const getPlanetasPorOrbita = (orbita) => {
  return Object.values(PLANETAS_CONFIG).filter(planeta => planeta.orbita === orbita);
};

// 🎯 Utilidad para obtener configuración de órbita
export const getOrbitaConfig = (nivel) => {
  return ORBITAS_CONFIG[`nivel${nivel}`] || null;
};
