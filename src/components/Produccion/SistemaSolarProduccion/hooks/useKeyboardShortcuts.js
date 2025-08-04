import { useEffect, useCallback } from 'react';
import { PLANETAS_CONFIG } from '../sistemaSolarConfig';

export const useKeyboardShortcuts = ({ 
  onPlanetaNavegar,
  onTogglePausa,
  onToggleEfectos,
  onToggleVista,
  activo = true 
}) => {
  
  const handleKeyPress = useCallback((event) => {
    if (!activo) return;

    // Ignorar si el usuario está escribiendo en un input
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    const key = event.key.toLowerCase();
    const isCtrl = event.ctrlKey;
    const isShift = event.shiftKey;

    // Prevenir comportamiento por defecto para nuestros shortcuts
    const shouldPreventDefault = [
      '1', '2', '3', '4', '5', '6', '7',
      ' ', 'f', 'e', 'v', 'h', '?'
    ].includes(key) || (isCtrl && ['p'].includes(key));

    if (shouldPreventDefault) {
      event.preventDefault();
    }

    // Navegación por números (1-7 para cada planeta)
    if (['1', '2', '3', '4', '5', '6', '7'].includes(key)) {
      const indice = parseInt(key) - 1;
      if (indice < PLANETAS_CONFIG.length && onPlanetaNavegar) {
        onPlanetaNavegar(PLANETAS_CONFIG[indice].id);
      }
      return;
    }

    // Atajos de funciones
    switch (key) {
      case ' ': // Espacio - Toggle pausa
        if (onTogglePausa) {
          onTogglePausa();
        }
        break;
        
      case 'f': // F - Toggle modo focus
        // TODO: Implementar modo focus
        console.log('🎯 Toggle modo focus (por implementar)');
        break;
        
      case 'e': // E - Toggle efectos
        if (onToggleEfectos) {
          onToggleEfectos();
        }
        break;
        
      case 'v': // V - Toggle vista
        if (onToggleVista) {
          onToggleVista();
        }
        break;
        
      case 'h': // H - Mostrar ayuda
      case '?': // ? - Mostrar ayuda
        mostrarAyuda();
        break;
        
      default:
        // Combinaciones con Ctrl
        if (isCtrl) {
          switch (key) {
            case 'p': // Ctrl+P - Pausar/Reanudar
              if (onTogglePausa) {
                onTogglePausa();
              }
              break;
          }
        }
        break;
    }
  }, [activo, onPlanetaNavegar, onTogglePausa, onToggleEfectos, onToggleVista]);

  const mostrarAyuda = () => {
    const ayuda = `
🌌 SISTEMA SOLAR DE PRODUCCIÓN - ATAJOS DE TECLADO

📍 NAVEGACIÓN:
• 1-7: Navegar a planetas específicos
  1: Ingredientes  2: Materiales  3: Producción
  4: Recetas      5: Catálogo    6: Movimientos
  7: Residuos

⚡ CONTROLES:
• Espacio: Pausar/Reanudar animaciones
• Ctrl+P: Pausar/Reanudar (alternativo)
• E: Toggle efectos visuales
• V: Alternar vista (Tradicional/Sistema Solar)
• F: Modo focus (próximamente)

ℹ️ AYUDA:
• H o ?: Mostrar esta ayuda
• ESC: Cerrar ayuda/modales

💡 TIP: Pasa el mouse sobre los planetas para más información
    `;
    
    alert(ayuda);
  };

  useEffect(() => {
    if (activo) {
      document.addEventListener('keydown', handleKeyPress);
      
      return () => {
        document.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [handleKeyPress, activo]);

  // Retornar funciones de utilidad
  return {
    mostrarAyuda
  };
};
