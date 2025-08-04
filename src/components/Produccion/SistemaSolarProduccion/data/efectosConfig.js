// 🌌 Configuración de efectos visuales avanzados para el Sistema Solar

export const EFECTOS_CONFIG = {
  // 🎨 Configuración de animaciones globales
  animaciones: {
    // Rotaciones base
    rotacionLenta: '40s linear infinite',
    rotacionMedia: '25s linear infinite', 
    rotacionRapida: '15s linear infinite',
    
    // Pulsaciones
    pulsoSuave: '4s ease-in-out infinite',
    pulsoMedio: '3s ease-in-out infinite',
    pulsoRapido: '2s ease-in-out infinite',
    
    // Efectos especiales
    flotacion: '6s ease-in-out infinite',
    vibracion: '0.3s ease-in-out infinite',
    ondulacion: '4s ease-in-out infinite'
  },

  // ✨ Sistema de partículas
  particulas: {
    tipos: {
      organicas: {
        forma: 'circle',
        tamaño: { min: 2, max: 4 },
        velocidad: { min: 1, max: 3 },
        opacidad: { min: 0.3, max: 0.8 },
        colores: ['#10b981', '#059669', '#047857']
      },
      metalicas: {
        forma: 'square',
        tamaño: { min: 1, max: 3 },
        velocidad: { min: 2, max: 4 },
        opacidad: { min: 0.4, max: 0.9 },
        colores: ['#3b82f6', '#1d4ed8', '#60a5fa']
      },
      energia: {
        forma: 'star',
        tamaño: { min: 3, max: 6 },
        velocidad: { min: 1, max: 2 },
        opacidad: { min: 0.5, max: 1 },
        colores: ['#f59e0b', '#d97706', '#fbbf24']
      },
      industriales: {
        forma: 'hexagon',
        tamaño: { min: 2, max: 5 },
        velocidad: { min: 3, max: 5 },
        opacidad: { min: 0.4, max: 0.8 },
        colores: ['#8b5cf6', '#7c3aed', '#a78bfa']
      },
      residuales: {
        forma: 'triangle',
        tamaño: { min: 1, max: 3 },
        velocidad: { min: 0.5, max: 2 },
        opacidad: { min: 0.2, max: 0.6 },
        colores: ['#dc2626', '#b91c1c', '#f87171']
      },
      flujo: {
        forma: 'arrow',
        tamaño: { min: 2, max: 4 },
        velocidad: { min: 4, max: 6 },
        opacidad: { min: 0.6, max: 1 },
        colores: ['#06b6d4', '#0891b2', '#22d3ee']
      }
    },
    comportamientos: {
      orbital: 'rotacion circular alrededor del planeta',
      flotante: 'movimiento vertical suave',
      disperso: 'movimiento aleatorio lento',
      direccional: 'movimiento en direccion especifica'
    }
  },

  // 🌟 Efectos de iluminación
  iluminacion: {
    resplandor: {
      suave: 'drop-shadow(0 0 10px currentColor)',
      medio: 'drop-shadow(0 0 20px currentColor)',
      intenso: 'drop-shadow(0 0 30px currentColor)'
    },
    sombras: {
      profunda: '0 8px 25px rgba(0, 0, 0, 0.3)',
      media: '0 4px 15px rgba(0, 0, 0, 0.2)',
      suave: '0 2px 10px rgba(0, 0, 0, 0.1)'
    },
    reflejos: {
      metalico: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
      cristal: 'inset 0 1px 0 rgba(255, 255, 255, 0.4)',
      mate: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
    }
  },

  // 🎭 Estados interactivos
  interacciones: {
    hover: {
      escala: { pequeno: 1.1, medio: 1.15, grande: 1.2 },
      rotacion: { leve: '5deg', media: '10deg', fuerte: '15deg' },
      elevacion: { baja: '2px', media: '4px', alta: '8px' },
      brillo: { sutil: 1.1, notable: 1.3, intenso: 1.5 }
    },
    seleccionado: {
      escala: { pequeno: 1.2, medio: 1.25, grande: 1.3 },
      sombra: '0 0 30px rgba(59, 130, 246, 0.8)',
      borde: '3px solid rgba(59, 130, 246, 0.6)',
      pulso: 'pulso-seleccionado 2s ease-in-out infinite'
    },
    alerta: {
      parpadeo: 'alerta-parpadeo 1.5s ease-in-out infinite',
      sacudida: 'alerta-sacudida 0.5s ease-in-out infinite',
      pulsoRapido: 'alerta-pulso 1s ease-in-out infinite'
    }
  },

  // 🌊 Efectos de transición
  transiciones: {
    suave: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    media: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    lenta: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    elastica: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    rebote: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  },

  // 🎪 Efectos especiales por tipo de planeta
  efectosEspeciales: {
    ingredientes: {
      crecimiento: 'crecer-organico 3s ease-in-out infinite',
      respiracion: 'respiracion-natural 4s ease-in-out infinite',
      biomasa: 'efecto-biomasa 5s ease-in-out infinite'
    },
    materiales: {
      forja: 'efecto-forja 2.5s ease-in-out infinite',
      templado: 'templado-metal 3s ease-in-out infinite',
      oxidacion: 'proceso-oxidacion 6s ease-in-out infinite'
    },
    recetas: {
      coccion: 'proceso-coccion 4s ease-in-out infinite',
      fermentacion: 'fermentacion-activa 3.5s ease-in-out infinite',
      mezclado: 'efecto-mezclado 2.8s ease-in-out infinite'
    },
    produccion: {
      maquinaria: 'funcionamiento-maquina 2s linear infinite',
      vapor: 'vapor-industrial 4s ease-in-out infinite',
      engranajes: 'rotacion-engranajes 3s linear infinite'
    },
    residuos: {
      descomposicion: 'proceso-descomposicion 5s ease-in-out infinite',
      reciclaje: 'efecto-reciclaje 4s ease-in-out infinite',
      incineracion: 'efecto-incineracion 3s ease-in-out infinite'
    },
    movimientos: {
      transferencia: 'transferencia-datos 2s ease-in-out infinite',
      sincronizacion: 'sincronizacion-activa 1.5s ease-in-out infinite',
      flujo: 'flujo-continuo 3s linear infinite'
    }
  }
};

// 🎯 Configuración de filtros CSS
export const FILTROS_CONFIG = {
  base: {
    brillo: 'brightness(1)',
    contraste: 'contrast(1)',
    saturacion: 'saturate(1)',
    matiz: 'hue-rotate(0deg)',
    desenfoque: 'blur(0px)',
    opacidad: 'opacity(1)'
  },
  estados: {
    desactivado: 'brightness(0.6) saturate(0.7) opacity(0.8)',
    mantenimiento: 'brightness(0.8) saturate(0.5) contrast(1.2)',
    alerta: 'brightness(1.3) saturate(1.5) contrast(1.1)',
    critico: 'brightness(1.5) saturate(2) hue-rotate(10deg)',
    procesando: 'brightness(0.9) saturate(1.2) blur(0.5px)',
    completado: 'brightness(1.2) saturate(1.3) contrast(1.1)'
  }
};

// 🌈 Configuración de gradientes
export const GRADIENTES_CONFIG = {
  planetas: {
    ingredientes: [
      'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
      'radial-gradient(circle at 30% 30%, #6ee7b7, #10b981, #047857)',
      'conic-gradient(from 45deg, #10b981, #059669, #047857, #10b981)'
    ],
    materiales: [
      'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)',
      'radial-gradient(circle at 30% 30%, #93c5fd, #3b82f6, #1e40af)',
      'conic-gradient(from 0deg, #3b82f6, #1d4ed8, #1e40af, #3b82f6)'
    ],
    recetas: [
      'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
      'radial-gradient(circle at 30% 30%, #fbbf24, #f59e0b, #b45309)',
      'conic-gradient(from 90deg, #f59e0b, #d97706, #b45309, #f59e0b)'
    ],
    produccion: [
      'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)',
      'radial-gradient(circle at 30% 30%, #c4b5fd, #8b5cf6, #6d28d9)',
      'conic-gradient(from 180deg, #8b5cf6, #7c3aed, #6d28d9, #8b5cf6)'
    ],
    residuos: [
      'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
      'radial-gradient(circle at 30% 30%, #fca5a5, #dc2626, #991b1b)',
      'conic-gradient(from 270deg, #dc2626, #b91c1c, #991b1b, #dc2626)'
    ],
    movimientos: [
      'linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%)',
      'radial-gradient(circle at 30% 30%, #67e8f9, #06b6d4, #0e7490)',
      'conic-gradient(from 315deg, #06b6d4, #0891b2, #0e7490, #06b6d4)'
    ]
  },
  orbitas: {
    nivel1: 'conic-gradient(from 0deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.8))',
    nivel2: 'conic-gradient(from 0deg, rgba(138, 43, 226, 0.8), rgba(138, 43, 226, 0.3), rgba(138, 43, 226, 0.8))',
    nivel3: 'conic-gradient(from 0deg, rgba(75, 0, 130, 0.8), rgba(75, 0, 130, 0.3), rgba(75, 0, 130, 0.8))'
  }
};

// 🎪 Utilidades para aplicar efectos
export const aplicarEfecto = (elemento, efecto, duracion = '0.3s') => {
  if (!elemento) return;
  
  const efectoCSS = EFECTOS_CONFIG.interacciones[efecto];
  if (efectoCSS) {
    Object.assign(elemento.style, {
      transition: duracion,
      ...efectoCSS
    });
  }
};

export const removerEfecto = (elemento) => {
  if (!elemento) return;
  
  elemento.style.transform = '';
  elemento.style.filter = '';
  elemento.style.boxShadow = '';
};

// 🎯 Generador de keyframes dinámicos
export const generarKeyframes = (nombre, propiedades) => {
  const keyframes = `
    @keyframes ${nombre} {
      ${Object.entries(propiedades).map(([porcentaje, estilos]) => 
        `${porcentaje}% { ${Object.entries(estilos).map(([prop, valor]) => 
          `${prop}: ${valor}`).join('; ')} }`
      ).join('\n')}
    }
  `;
  return keyframes;
};
