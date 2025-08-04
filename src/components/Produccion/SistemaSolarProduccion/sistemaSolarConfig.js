// Configuración del Sistema Solar de Producción

export const PLANETAS_CONFIG = [
  // Órbita 1 - Módulos más usados (más cerca del sol)
  {
    id: 'ingredientes',
    nombre: 'Gestión de Ingredientes',
    icono: '🥬',
    color: {
      primary: '#10b981', // green-500
      secondary: '#dcfce7', // green-100
      accent: '#065f46' // green-800
    },
    orbita: 1,
    angulo: 0, // posición inicial en la órbita
    to: 'ingredientes',
    descripcion: 'Administrar ingredientes',
    tamaño: 'large', // large, medium, small
    estadisticaKey: 'ingredientes'
  },
  {
    id: 'materiales',
    nombre: 'Gestión de Materiales',
    icono: '📦',
    color: {
      primary: '#f59e0b', // yellow-500
      secondary: '#fef3c7', // yellow-100
      accent: '#92400e' // yellow-800
    },
    orbita: 1,
    angulo: 120,
    to: 'materiales',
    descripcion: 'Administrar materiales',
    tamaño: 'large',
    estadisticaKey: 'materiales'
  },
  {
    id: 'produccion',
    nombre: 'Gestión de Producción',
    icono: '🏭',
    color: {
      primary: '#8b5cf6', // purple-500
      secondary: '#ede9fe', // purple-100
      accent: '#581c87' // purple-800
    },
    orbita: 1,
    angulo: 240,
    to: 'produccion',
    descripcion: 'Procesos de producción',
    tamaño: 'large',
    estadisticaKey: 'enProduccion'
  },

  // Órbita 2 - Módulos de uso frecuente
  {
    id: 'recetas',
    nombre: 'Gestión de Recetas',
    icono: '📝',
    color: {
      primary: '#3b82f6', // blue-500
      secondary: '#dbeafe', // blue-100
      accent: '#1e3a8a' // blue-800
    },
    orbita: 2,
    angulo: 60,
    to: 'recetas',
    descripcion: 'Crear y editar recetas',
    tamaño: 'medium',
    estadisticaKey: 'totalRecetas'
  },
  {
    id: 'catalogo',
    nombre: 'Catálogo de Producción',
    icono: '📋',
    color: {
      primary: '#6366f1', // indigo-500
      secondary: '#e0e7ff', // indigo-100
      accent: '#312e81' // indigo-800
    },
    orbita: 2,
    angulo: 180,
    to: 'catalogo',
    descripcion: 'Ver productos del catálogo',
    tamaño: 'medium',
    estadisticaKey: 'catalogoProductos'
  },
  {
    id: 'movimientos',
    nombre: 'Movimientos de Inventario',
    icono: '📊',
    color: {
      primary: '#f97316', // orange-500
      secondary: '#fed7aa', // orange-100
      accent: '#9a3412' // orange-800
    },
    orbita: 2,
    angulo: 300,
    to: 'movimientos',
    descripcion: 'Historial de movimientos',
    tamaño: 'medium',
    estadisticaKey: 'totalMovimientos'
  },

  // Órbita 3 - Módulos de uso ocasional
  {
    id: 'residuos',
    nombre: 'Residuos y Malogrados',
    icono: '🗑️',
    color: {
      primary: '#ef4444', // red-500
      secondary: '#fee2e2', // red-100
      accent: '#991b1b' // red-800
    },
    orbita: 3,
    angulo: 0,
    to: 'residuos',
    descripcion: 'Gestión de residuos',
    tamaño: 'small',
    estadisticaKey: 'residuos'
  }
];

export const SOL_CONFIG = {
  nombre: 'Centro de Control',
  icono: '☀️',
  color: {
    primary: '#fbbf24', // yellow-400
    secondary: '#fef3c7', // yellow-100
    accent: '#f59e0b' // yellow-500
  },
  rayos: [
    { angulo: 0, intensidad: 0.8 },
    { angulo: 45, intensidad: 0.6 },
    { angulo: 90, intensidad: 0.9 },
    { angulo: 135, intensidad: 0.7 },
    { angulo: 180, intensidad: 0.8 },
    { angulo: 225, intensidad: 0.6 },
    { angulo: 270, intensidad: 0.9 },
    { angulo: 315, intensidad: 0.7 }
  ]
};

export const ORBITAS_CONFIG = {
  1: {
    radio: 180, // px desde el centro
    velocidad: 30, // segundos por vuelta completa
    color: 'rgba(59, 130, 246, 0.1)', // blue-500 con transparencia
    grosor: 2
  },
  2: {
    radio: 280,
    velocidad: 45,
    color: 'rgba(139, 92, 246, 0.1)', // purple-500 con transparencia
    grosor: 2
  },
  3: {
    radio: 380,
    velocidad: 60,
    color: 'rgba(239, 68, 68, 0.1)', // red-500 con transparencia
    grosor: 2
  }
};

export const RESPONSIVE_CONFIG = {
  // Breakpoints para diferentes tamaños
  mobile: {
    maxWidth: 480,
    solTamaño: 60,
    planetaTamaño: { large: 40, medium: 35, small: 30 },
    orbitaRadio: { 1: 100, 2: 150, 3: 200 },
    mostrarOrbitas: false,
    mostrarTexto: false
  },
  tablet: {
    maxWidth: 768,
    solTamaño: 80,
    planetaTamaño: { large: 55, medium: 45, small: 35 },
    orbitaRadio: { 1: 140, 2: 200, 3: 260 },
    mostrarOrbitas: true,
    mostrarTexto: true
  },
  desktop: {
    maxWidth: Infinity,
    solTamaño: 100,
    planetaTamaño: { large: 70, medium: 55, small: 40 },
    orbitaRadio: { 1: 180, 2: 280, 3: 380 },
    mostrarOrbitas: true,
    mostrarTexto: true
  }
};

export const ANIMACIONES_CONFIG = {
  duracionHover: 300, // ms
  escalaHover: 1.15,
  rotacionBase: true,
  pausarEnHover: true,
  efectosParticulas: true
};

export const SATELITES_CONFIG = {
  ingredientes: [
    {
      id: 'crear-ingrediente',
      nombre: 'Nuevo Ingrediente',
      icono: '🌱',
      accion: 'crear-ingrediente',
      color: '#10b981',
      teclaRapida: 'Q'
    },
    {
      id: 'vista-rapida-ingredientes',
      nombre: 'Vista Rápida',
      icono: '👁️',
      accion: 'vista-rapida',
      color: '#3b82f6',
      teclaRapida: 'W'
    },
    {
      id: 'reporte-ingredientes',
      nombre: 'Reporte',
      icono: '📊',
      accion: 'generar-reporte',
      color: '#f97316',
      teclaRapida: 'E'
    },
    {
      id: 'importar-ingredientes',
      nombre: 'Importar',
      icono: '📥',
      accion: 'importar-datos',
      color: '#8b5cf6',
      teclaRapida: 'R'
    }
  ],
  materiales: [
    {
      id: 'crear-material',
      nombre: 'Nuevo Material',
      icono: '📦',
      accion: 'crear-material',
      color: '#f59e0b',
      teclaRapida: 'Q'
    },
    {
      id: 'vista-rapida-materiales',
      nombre: 'Vista Rápida',
      icono: '👁️',
      accion: 'vista-rapida',
      color: '#3b82f6',
      teclaRapida: 'W'
    },
    {
      id: 'reporte-materiales',
      nombre: 'Reporte',
      icono: '📊',
      accion: 'generar-reporte',
      color: '#f97316',
      teclaRapida: 'E'
    },
    {
      id: 'configurar-alertas',
      nombre: 'Alertas',
      icono: '🔔',
      accion: 'configurar-alertas',
      color: '#ef4444',
      teclaRapida: 'R'
    }
  ],
  produccion: [
    {
      id: 'nueva-produccion',
      nombre: 'Nueva Producción',
      icono: '🚀',
      accion: 'nueva-produccion',
      color: '#8b5cf6',
      teclaRapida: 'Q'
    },
    {
      id: 'vista-rapida-produccion',
      nombre: 'Vista Rápida',
      icono: '👁️',
      accion: 'vista-rapida',
      color: '#3b82f6',
      teclaRapida: 'W'
    },
    {
      id: 'historial-produccion',
      nombre: 'Historial',
      icono: '📜',
      accion: 'historial-produccion',
      color: '#06b6d4',
      teclaRapida: 'E'
    },
    {
      id: 'optimizar-produccion',
      nombre: 'Optimizar',
      icono: '⚡',
      accion: 'optimizar-produccion',
      color: '#eab308',
      teclaRapida: 'R'
    }
  ],
  recetas: [
    {
      id: 'crear-receta',
      nombre: 'Nueva Receta',
      icono: '✨',
      accion: 'crear-receta',
      color: '#3b82f6',
      teclaRapida: 'Q'
    },
    {
      id: 'vista-rapida-recetas',
      nombre: 'Vista Rápida',
      icono: '👁️',
      accion: 'vista-rapida',
      color: '#3b82f6',
      teclaRapida: 'W'
    },
    {
      id: 'calcular-costos',
      nombre: 'Calcular Costos',
      icono: '💰',
      accion: 'calcular-costos',
      color: '#10b981',
      teclaRapida: 'E'
    },
    {
      id: 'exportar-recetas',
      nombre: 'Exportar',
      icono: '📤',
      accion: 'exportar-recetas',
      color: '#8b5cf6',
      teclaRapida: 'R'
    }
  ],
  inventario: [
    {
      id: 'ajustar-inventario',
      nombre: 'Ajustar Stock',
      icono: '⚖️',
      accion: 'ajustar-inventario',
      color: '#f97316',
      teclaRapida: 'Q'
    },
    {
      id: 'vista-rapida-inventario',
      nombre: 'Vista Rápida',
      icono: '👁️',
      accion: 'vista-rapida',
      color: '#3b82f6',
      teclaRapida: 'W'
    },
    {
      id: 'auditoria-inventario',
      nombre: 'Auditoría',
      icono: '🔍',
      accion: 'auditoria-inventario',
      color: '#ef4444',
      teclaRapida: 'E'
    },
    {
      id: 'reporte-inventario',
      nombre: 'Reporte',
      icono: '�',
      accion: 'generar-reporte',
      color: '#f97316',
      teclaRapida: 'R'
    }
  ],
  movimientos: [
    {
      id: 'nuevo-movimiento',
      nombre: 'Nuevo Movimiento',
      icono: '↗️',
      accion: 'nuevo-movimiento',
      color: '#10b981',
      teclaRapida: 'Q'
    },
    {
      id: 'vista-rapida-movimientos',
      nombre: 'Vista Rápida',
      icono: '👁️',
      accion: 'vista-rapida',
      color: '#3b82f6',
      teclaRapida: 'W'
    },
    {
      id: 'reporte-movimientos',
      nombre: 'Reporte',
      icono: '📊',
      accion: 'generar-reporte',
      color: '#f97316',
      teclaRapida: 'E'
    },
    {
      id: 'configuracion-movimientos',
      nombre: 'Configuración',
      icono: '⚙️',
      accion: 'configuracion',
      color: '#6b7280',
      teclaRapida: 'R'
    }
  ]
};
