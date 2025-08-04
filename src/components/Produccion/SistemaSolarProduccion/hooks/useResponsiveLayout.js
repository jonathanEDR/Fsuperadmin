import { useState, useEffect } from 'react';
import { RESPONSIVE_CONFIG } from '../sistemaSolarConfig';

export const useResponsiveLayout = () => {
  const [configuracion, setConfiguracion] = useState(RESPONSIVE_CONFIG.desktop);
  const [tipoDispositivo, setTipoDispositivo] = useState('desktop');

  useEffect(() => {
    const actualizarConfiguracion = () => {
      const ancho = window.innerWidth;
      
      if (ancho <= RESPONSIVE_CONFIG.mobile.maxWidth) {
        setConfiguracion(RESPONSIVE_CONFIG.mobile);
        setTipoDispositivo('mobile');
      } else if (ancho <= RESPONSIVE_CONFIG.tablet.maxWidth) {
        setConfiguracion(RESPONSIVE_CONFIG.tablet);
        setTipoDispositivo('tablet');
      } else {
        setConfiguracion(RESPONSIVE_CONFIG.desktop);
        setTipoDispositivo('desktop');
      }
    };

    // Ejecutar al montar
    actualizarConfiguracion();

    // Escuchar cambios de tamaño
    window.addEventListener('resize', actualizarConfiguracion);

    return () => {
      window.removeEventListener('resize', actualizarConfiguracion);
    };
  }, []);

  return {
    configuracion,
    tipoDispositivo,
    esMobile: tipoDispositivo === 'mobile',
    esTablet: tipoDispositivo === 'tablet',
    esDesktop: tipoDispositivo === 'desktop'
  };
};
