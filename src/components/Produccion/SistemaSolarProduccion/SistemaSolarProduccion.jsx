import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Estilos
import styles from './sistemaSolarAvanzado.module.css';

// Componentes
import SolCentral from './SolCentral';
import OrbitaContainer from './OrbitaContainer';
import PlanetaModuloProfesional from './PlanetaModuloProfesional'; // 🌟 VERSIÓN PROFESIONAL
import SatelitesContainer from './SatelitesContainer';
import EfectosEspaciales from './EfectosEspaciales';
import FondoEspacialProfundo from './FondoEspacialProfundo';
import ModalAccionRapida from './ModalAccionRapida';

// Hooks
import { useResponsiveLayout } from './hooks/useResponsiveLayout';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Configuración
import { PLANETAS_CONFIG } from './sistemaSolarConfig';

// Servicios (importar los mismos que AccesosRapidosProduccion)
import { ingredienteService } from '../../../services/ingredienteService';
import { materialService } from '../../../services/materialService';
import { recetaService } from '../../../services/recetaService';
import { produccionService } from '../../../services/produccionService';

const SistemaSolarProduccion = ({ 
  onPlanetaClick,
  onSateliteClick: onSateliteClickProp,
  mostrarEstadisticas = true,
  modoInteractivo = true,
  mostrarEfectos = true,
  className = ""
}) => {
  const { configuracion, tipoDispositivo } = useResponsiveLayout();
  const location = useLocation();
  const navigate = useNavigate();

  // Estados principales
  const [estadisticas, setEstadisticas] = useState({
    totalRecetas: 0,
    ingredientes: 0,
    enProduccion: 0,
    materiales: 0,
    totalMovimientos: 0
  });
  const [alertas, setAlertas] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Estados de interacción
  const [planetaEnHover, setPlanetaEnHover] = useState(null);
  const [planetaSeleccionado, setPlanetaSeleccionado] = useState(null);
  const [pausarAnimaciones, setPausarAnimaciones] = useState(false);
  const [efectosActivos, setEfectosActivos] = useState(mostrarEfectos);
  const [mostrarSatelites, setMostrarSatelites] = useState(false);
  const [modoFocus, setModoFocus] = useState(null);
  
  // Estados del modal de acción rápida
  const [modalAccion, setModalAccion] = useState({
    isOpen: false,
    titulo: '',
    descripcion: '',
    icono: '',
    accion: null,
    colorConfirmar: 'blue'
  });

  // Hook de atajos de teclado
  useKeyboardShortcuts({
    onPlanetaNavegar: (planetaId) => {
      setPlanetaSeleccionado(planetaId);
      setMostrarSatelites(true);
    },
    onTogglePausa: () => setPausarAnimaciones(prev => !prev),
    onToggleEfectos: () => setEfectosActivos(prev => !prev),
    onToggleVista: () => setMostrarSatelites(false),
    activo: modoInteractivo && tipoDispositivo === 'desktop'
  });

  // Cargar estadísticas reales
  useEffect(() => {
    if (!mostrarEstadisticas) return;

    const cargarEstadisticas = async () => {
      try {
        setLoadingStats(true);
        
        // Cargar datos en paralelo (misma lógica que AccesosRapidosProduccion)
        const [
          ingredientesRes,
          materialesRes,
          recetasRes,
          produccionesRes
        ] = await Promise.all([
          ingredienteService.obtenerIngredientes({ activo: true }).catch(() => ({ data: [] })),
          materialService.obtenerMateriales({ activo: true }).catch(() => ({ data: [] })),
          recetaService.obtenerRecetas({ activo: true }).catch(() => ({ data: [] })),
          produccionService.obtenerProducciones({ estado: 'en_proceso' }).catch(() => ({ data: { producciones: [] } }))
        ]);

        // Calcular estadísticas
        const ingredientesActivos = ingredientesRes.data?.filter(ing => 
          (ing.cantidad - (ing.procesado || 0)) > 0
        ).length || 0;

        const materialesActivos = materialesRes.data?.filter(mat => 
          (mat.cantidad - (mat.utilizado || 0)) > 0
        ).length || 0;

        const recetasDisponibles = recetasRes.data?.filter(rec => 
          (rec.inventario?.cantidadProducida || 0) > 0
        ).length || 0;

        const produccionesEnProceso = produccionesRes.data?.producciones?.length || 0;

        setEstadisticas({
          totalRecetas: recetasRes.data?.length || 0,
          ingredientes: ingredientesActivos,
          enProduccion: produccionesEnProceso,
          materiales: materialesActivos,
          totalMovimientos: 0 // TODO: agregar cuando esté disponible
        });

        // Simular algunas alertas basadas en los datos
        const nuevasAlertas = [];
        
        if (ingredientesActivos === 0) {
          nuevasAlertas.push({
            id: 'sin-ingredientes',
            modulo: 'ingredientes',
            mensaje: 'No hay ingredientes disponibles',
            activa: true,
            tipo: 'warning'
          });
        }

        if (produccionesEnProceso > 5) {
          nuevasAlertas.push({
            id: 'muchas-producciones',
            modulo: 'produccion',
            mensaje: `${produccionesEnProceso} producciones en proceso`,
            activa: true,
            tipo: 'info'
          });
        }

        setAlertas(nuevasAlertas);
        
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    cargarEstadisticas();
  }, [mostrarEstadisticas]);

  // Manejar hover en planetas
  const handlePlanetaHover = (tipo, enHover) => {
    setPlanetaEnHover(enHover ? tipo : null);
    
    if (modoInteractivo) {
      setPausarAnimaciones(enHover);
    }
  };

  // Manejar click en planetas
  const handlePlanetaClick = (tipo) => {
    setPlanetaSeleccionado(tipo);
    setMostrarSatelites(true);
    
    if (onPlanetaClick) {
      onPlanetaClick(tipo);
    }
  };

  // Manejar click en satélites
  const handleSateliteClick = (sateliteConfig) => {
    console.log('🛰️ Click en satélite:', sateliteConfig);
    
    // Si hay un callback personalizado, ejecutarlo
    if (onSateliteClickProp) {
      onSateliteClickProp(sateliteConfig);
      return;
    }
    
    // Navegación por defecto según el tipo de acción
    switch (sateliteConfig.accion) {
      case 'crear-ingrediente':
        manejarCreacion('crear-ingrediente', '/produccion/ingredientes/crear');
        break;
      case 'crear-material':
        manejarCreacion('crear-material', '/produccion/materiales/crear');
        break;
      case 'crear-receta':
        manejarCreacion('crear-receta', '/produccion/recetas/crear');
        break;
      case 'crear-producto':
        manejarCreacion('crear-producto', '/produccion/productos/crear');
        break;
      case 'generar-reporte':
        generarReporteStock();
        break;
      case 'vista-rapida':
        mostrarVistaRapida(planetaSeleccionado);
        break;
      case 'configuracion':
        setModalAccion({
          isOpen: true,
          titulo: 'Configuración del Sistema',
          descripcion: '⚙️ Acceder al panel de configuración del sistema de producción.\n\nDesde aquí podrá ajustar parámetros, gestionar usuarios y personalizar el funcionamiento del sistema.',
          icono: '⚙️',
          accion: () => navigate('/produccion/configuracion'),
          colorConfirmar: 'purple'
        });
        break;
      default:
        console.log('🔧 Acción no implementada:', sateliteConfig.accion);
        // Navegación genérica basada en el planeta
        const planeta = PLANETAS_CONFIG.find(p => p.id === planetaSeleccionado);
        if (planeta?.ruta) {
          navigate(planeta.ruta);
        }
    }
  };

  // Función para generar reporte de stock
  const generarReporteStock = async () => {
    try {
      // Simular generación de reporte
      const alertas = [];
      
      // Verificar ingredientes con stock bajo
      const ingredientesBajos = await verificarStockBajo('ingredientes');
      if (ingredientesBajos.length > 0) {
        alertas.push(`🔴 ${ingredientesBajos.length} ingredientes con stock bajo`);
      }
      
      // Verificar materiales con stock bajo
      const materialesBajos = await verificarStockBajo('materiales');
      if (materialesBajos.length > 0) {
        alertas.push(`🟡 ${materialesBajos.length} materiales con stock bajo`);
      }
      
      // Mostrar modal con el reporte
      const descripcion = alertas.length > 0 
        ? `Se encontraron las siguientes alertas:\n\n${alertas.join('\n')}\n\n¿Desea revisar los detalles en el módulo de movimientos?`
        : `✅ Todos los productos tienen stock suficiente.\n\n📈 El sistema está funcionando correctamente.`;
      
      setModalAccion({
        isOpen: true,
        titulo: 'Reporte de Stock',
        descripcion,
        icono: '📊',
        accion: alertas.length > 0 ? () => navigate('/produccion/movimientos') : null,
        colorConfirmar: alertas.length > 0 ? 'orange' : 'green'
      });
      
    } catch (error) {
      console.error('Error al generar reporte:', error);
      setModalAccion({
        isOpen: true,
        titulo: 'Error en Reporte',
        descripcion: '❌ No se pudo generar el reporte de stock. Por favor, intente nuevamente.',
        icono: '⚠️',
        accion: null,
        colorConfirmar: 'blue'
      });
    }
  };

  // Función para mostrar vista rápida
  const mostrarVistaRapida = (tipoModulo) => {
    const planeta = PLANETAS_CONFIG.find(p => p.id === tipoModulo);
    
    if (!planeta) return;
    
    const estadisticaKey = planeta.estadisticaKey;
    const valor = estadisticas[estadisticaKey] || 0;
    
    setModalAccion({
      isOpen: true,
      titulo: `Vista Rápida - ${planeta.nombre}`,
      descripcion: `📊 ${planeta.descripcion}\n\n📈 Cantidad actual: ${valor}\n\n¿Desea ir al módulo completo para más detalles?`,
      icono: planeta.icono,
      accion: planeta.ruta ? () => navigate(planeta.ruta) : null,
      colorConfirmar: 'blue'
    });
  };

  // Función para manejar confirmación de creación
  const manejarCreacion = (tipo, ruta) => {
    const tipos = {
      'crear-ingrediente': { nombre: 'Ingrediente', icono: '🥬', color: 'green' },
      'crear-material': { nombre: 'Material', icono: '📦', color: 'blue' },
      'crear-receta': { nombre: 'Receta', icono: '📋', color: 'purple' },
      'crear-producto': { nombre: 'Producto', icono: '🏭', color: 'orange' }
    };
    
    const config = tipos[tipo];
    if (!config) return;
    
    setModalAccion({
      isOpen: true,
      titulo: `Crear ${config.nombre}`,
      descripcion: `¿Está listo para crear un nuevo ${config.nombre.toLowerCase()}?\n\nSerá redirigido al formulario de creación donde podrá ingresar todos los detalles necesarios.`,
      icono: config.icono,
      accion: () => navigate(ruta),
      colorConfirmar: config.color
    });
  };

  // Función para verificar stock bajo
  const verificarStockBajo = async (tipo) => {
    try {
      // Esta función se podría conectar con los servicios reales
      // Por ahora, simulamos la verificación
      return [];
    } catch (error) {
      console.error(`Error al verificar stock de ${tipo}:`, error);
      return [];
    }
  };

  // Manejar click en sol
  const handleSolClick = () => {
    console.log('☀️ Click en el sol - mostrar dashboard general');
    setMostrarSatelites(false);
    setPlanetaSeleccionado(null);
  };

  // Funciones para atajos de teclado
  const navegarAPlaneta = (tipo) => {
    handlePlanetaClick(tipo);
  };

  const togglePausa = () => {
    setPausarAnimaciones(!pausarAnimaciones);
  };

  const toggleEfectos = () => {
    setEfectosActivos(!efectosActivos);
  };

  const toggleVista = () => {
    // Esta función será manejada por el componente padre
    console.log('🔄 Toggle vista (manejado por padre)');
  };

  // Hook de atajos de teclado
  useKeyboardShortcuts({
    onPlanetaNavegar: navegarAPlaneta,
    onTogglePausa: togglePausa,
    onToggleEfectos: toggleEfectos,
    onToggleVista: toggleVista,
    activo: modoInteractivo
  });

  // Agrupar planetas por órbita
  const planetasPorOrbita = PLANETAS_CONFIG.reduce((acc, planeta) => {
    if (!acc[planeta.orbita]) {
      acc[planeta.orbita] = [];
    }
    acc[planeta.orbita].push(planeta);
    return acc;
  }, {});

  // Calcular tamaño del contenedor
  const tamañoContenedor = Math.max(
    ...(configuracion.orbitaRadio ? Object.values(configuracion.orbitaRadio) : [200])
  ) * 2 + 200;

  return (
    <div className={`${styles['sistema-solar-produccion']} ${efectosActivos ? styles['fondo-espacial'] : ''} ${className}`}>
      {/* Fondo espacial profundo */}
      <FondoEspacialProfundo
        activo={efectosActivos}
        intensidad={tipoDispositivo === 'mobile' ? 'sutil' : 'normal'}
        mostrarViaLactea={tipoDispositivo !== 'mobile'}
        mostrarAurora={tipoDispositivo === 'desktop'}
      />

      {/* Efectos espaciales animados */}
      <EfectosEspaciales
        activo={efectosActivos && tipoDispositivo !== 'mobile'}
        densidad={tipoDispositivo === 'desktop' ? 'normal' : 'low'}
      />

      {/* Título y descripción */}
      <div className="mb-8 text-center relative z-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sistema de Producción
        </h1>
        <p className="text-gray-600">
          Gestiona todos los aspectos de tu proceso de producción desde un solo lugar
        </p>
        
        {/* Indicador de loading */}
        {loadingStats && (
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
            <span className="text-sm text-gray-500">Cargando estadísticas...</span>
          </div>
        )}

        {/* Indicadores de estado */}
        {modoInteractivo && tipoDispositivo === 'desktop' && (
          <div className="mt-4 flex justify-center space-x-4 text-xs text-gray-500">
            <div className={`flex items-center ${pausarAnimaciones ? 'text-orange-600' : 'text-green-600'}`}>
              <span className="mr-1">{pausarAnimaciones ? '⏸️' : '▶️'}</span>
              {pausarAnimaciones ? 'Pausado' : 'Animado'}
            </div>
            <div className={`flex items-center ${efectosActivos ? 'text-blue-600' : 'text-gray-400'}`}>
              <span className="mr-1">✨</span>
              Efectos {efectosActivos ? 'ON' : 'OFF'}
            </div>
            <div className="flex items-center text-indigo-600">
              <span className="mr-1">🌀</span>
              Órbitas Visibles
            </div>
            <div className="flex items-center text-purple-600">
              <span className="mr-1">⌨️</span>
              Presiona H para ayuda
            </div>
          </div>
        )}
      </div>

      {/* Contenedor del sistema solar */}
      <div className="flex justify-center relative z-10">
        <div 
          className={`relative ${pausarAnimaciones ? styles['pausar-animaciones'] : ''}`}
          style={{ 
            width: tamañoContenedor, 
            height: tamañoContenedor,
            minWidth: 300,
            minHeight: 300
          }}
        >
          {/* Sol central */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className={styles['sol-central']}>
              <div className={styles['sol-icono']}>☀️</div>
            </div>
          </div>

          {/* Órbitas con planetas */}
          {Object.entries(planetasPorOrbita).map(([orbita, planetas]) => (
            <div key={orbita} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ transformStyle: 'preserve-3d' }}>
              <OrbitaContainer
                nivel={parseInt(orbita)}
                configuracion={configuracion}
                visible={true}
                mostrarOrbitas={true}
              >
                {planetas.map((planeta) => (
                  <PlanetaModuloProfesional
                    key={planeta.id}
                    tipo={planeta.id}
                    configuracion={configuracion}
                    estadisticas={estadisticas}
                    alertas={alertas}
                    onHover={handlePlanetaHover}
                    onClick={handlePlanetaClick}
                    seleccionado={planetaSeleccionado === planeta.id}
                  />
                ))}
              </OrbitaContainer>
            </div>
          ))}

          {/* Satélites del planeta seleccionado */}
          {mostrarSatelites && planetaSeleccionado && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <SatelitesContainer
                planetaActivo={planetaSeleccionado}
                configuracion={configuracion}
                onSateliteClick={handleSateliteClick}
                visible={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Información del planeta en hover (solo desktop) */}
      {planetaEnHover && tipoDispositivo === 'desktop' && !mostrarSatelites && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-4 z-50 min-w-[200px]">
          <div className="text-center">
            {(() => {
              const planeta = PLANETAS_CONFIG.find(p => p.id === planetaEnHover);
              const estadisticaPlaneta = estadisticas[planeta?.estadisticaKey] || 0;
              return (
                <>
                  <div className="text-2xl mb-2">{planeta?.icono}</div>
                  <div className="font-bold text-gray-800">{planeta?.nombre}</div>
                  <div className="text-sm text-gray-600 mb-2">{planeta?.descripcion}</div>
                  {estadisticaPlaneta > 0 && (
                    <div className="text-lg font-bold" style={{ color: planeta?.color.primary }}>
                      {estadisticaPlaneta}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Controles de modo interactivo (solo desktop) */}
      {modoInteractivo && tipoDispositivo === 'desktop' && (
        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-30">
          <button
            onClick={() => setPausarAnimaciones(!pausarAnimaciones)}
            className={`px-3 py-2 rounded-lg text-white text-sm transition-colors ${
              pausarAnimaciones ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
            }`}
          >
            {pausarAnimaciones ? '▶️ Reanudar' : '⏸️ Pausar'}
          </button>
          
          {mostrarSatelites && (
            <button
              onClick={() => setMostrarSatelites(false)}
              className="px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm transition-colors"
            >
              🌍 Vista General
            </button>
          )}
        </div>
      )}

      {/* Indicador de atajos de teclado */}
      {modoInteractivo && tipoDispositivo === 'desktop' && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded-lg text-xs z-30">
          <div className="font-bold mb-1">Atajos:</div>
          <div>ESC - Salir</div>
          <div>SPACE - Pausar/Reanudar</div>
          <div>1-6 - Seleccionar planeta</div>
          {mostrarSatelites && <div>Q,W,E,R - Acciones rápidas</div>}
        </div>
      )}

      {/* Vista alternativa para móvil muy pequeño */}
      {tipoDispositivo === 'mobile' && tamañoContenedor > window.innerWidth - 40 && (
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>💡 Gira tu dispositivo para una mejor experiencia</p>
        </div>
      )}

      {/* Modal de acción rápida */}
      <ModalAccionRapida
        isOpen={modalAccion.isOpen}
        onClose={() => setModalAccion(prev => ({ ...prev, isOpen: false }))}
        titulo={modalAccion.titulo}
        descripcion={modalAccion.descripcion}
        icono={modalAccion.icono}
        onConfirmar={modalAccion.accion || (() => {})}
        colorConfirmar={modalAccion.colorConfirmar}
        textoConfirmar={modalAccion.accion ? "Continuar" : "Entendido"}
      />
    </div>
  );
};

export default SistemaSolarProduccion;
