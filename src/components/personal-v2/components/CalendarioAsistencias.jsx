/**
 * Componente CalendarioAsistencias
 * Vista de calendario mensual con visualización de estados de asistencia
 * 
 * Features:
 * - Calendario responsive
 * - Código de colores por estado
 * - Navegación entre meses
 * - Click en día para ver lista de asistencias
 * - Leyenda de estados
 */

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { asistenciaService } from '../../../services';
import ModalAsistenciasDia from './ModalAsistenciasDia';

const CalendarioAsistencias = React.memo(({
  asistencias = [],
  filtros = {},
  onDiaClick,
  onCargarDatos,
  onNuevaAsistencia,
  loading = false
}) => {
  
  // Estado para el modal de asistencias del día
  const [modalDiaAbierto, setModalDiaAbierto] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  
  const { año, mes, colaboradorId } = filtros;
  
  // Obtener fecha en zona horaria de Perú (YYYY-MM-DD)
  const obtenerFechaLocalPeru = (fechaISO) => {
    const date = new Date(fechaISO);
    return date.toLocaleDateString('en-CA', { timeZone: 'America/Lima' }); // YYYY-MM-DD
  };
  
  // Obtener partes de fecha en zona horaria de Perú
  const obtenerPartesFechaPeru = (fechaISO) => {
    const date = new Date(fechaISO);
    const fechaStr = date.toLocaleDateString('es-PE', { 
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }); // DD/MM/YYYY
    const [dia, mes, año] = fechaStr.split('/').map(Number);
    return { dia, mes, año };
  };
  
  // Verificar si una fecha es hoy (definir ANTES de useMemo)
  const esHoy = (fecha) => {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  };
  
  // Obtener días del mes
  const diasDelMes = useMemo(() => {
    const primerDia = new Date(año, mes - 1, 1);
    const ultimoDia = new Date(año, mes, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay(); // 0 = Domingo
    
    // Crear array de días
    const dias = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < primerDiaSemana; i++) {
      dias.push(null);
    }
    
    // Días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(año, mes - 1, dia);
      
      // Buscar asistencia(s) para este día - CORREGIDO para zona horaria de Perú
      const asistenciasDia = asistencias.filter(a => {
        const partes = obtenerPartesFechaPeru(a.fecha);
        return partes.dia === dia &&
               partes.mes === mes &&
               partes.año === año;
      });
      
      dias.push({
        numero: dia,
        fecha,
        asistencias: asistenciasDia,
        estado: asistenciasDia.length > 0 ? asistenciasDia[0].estado : null,
        esHoy: esHoy(fecha)
      });
    }
    
    return dias;
  }, [año, mes, asistencias]);
  
  // Navegación de meses
  const irMesAnterior = () => {
    const nuevoMes = mes === 1 ? 12 : mes - 1;
    const nuevoAño = mes === 1 ? año - 1 : año;
    onCargarDatos({ ...filtros, mes: nuevoMes, año: nuevoAño });
  };
  
  const irMesSiguiente = () => {
    const nuevoMes = mes === 12 ? 1 : mes + 1;
    const nuevoAño = mes === 12 ? año + 1 : año;
    onCargarDatos({ ...filtros, mes: nuevoMes, año: nuevoAño });
  };
  
  const irMesActual = () => {
    const hoy = new Date();
    onCargarDatos({
      ...filtros,
      mes: hoy.getMonth() + 1,
      año: hoy.getFullYear()
    });
  };
  
  // Obtener nombre del mes
  const nombreMes = useMemo(() => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1];
  }, [mes]);
  
  // Manejar click en día
  const handleDiaClick = (dia) => {
    if (!dia) return;
    
    // Abrir modal con las asistencias del día
    setDiaSeleccionado(dia);
    setModalDiaAbierto(true);
  };
  
  // Cerrar modal del día
  const handleCerrarModal = () => {
    setModalDiaAbierto(false);
    setDiaSeleccionado(null);
  };
  
  // Manejar edición de una asistencia desde el modal
  const handleEditarDesdeModal = (asistencia) => {
    onDiaClick('editar', asistencia);
  };
  
  // Obtener clases CSS por estado
  const obtenerClasesDia = (dia) => {
    if (!dia) return '';
    
    const clases = ['calendario-dia'];
    
    if (dia.esHoy) {
      clases.push('es-hoy');
    }
    
    if (dia.estado) {
      const colores = asistenciaService.obtenerColorEstado(dia.estado);
      clases.push(colores.bg, colores.text, colores.border);
    } else {
      clases.push('sin-registro');
    }
    
    return clases.join(' ');
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando calendario...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header del calendario */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <button
            onClick={irMesAnterior}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Mes anterior"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="text-center">
            <h3 className="text-xl font-bold">
              {nombreMes} {año}
            </h3>
            <button
              onClick={irMesActual}
              className="text-sm text-white/80 hover:text-white underline mt-1"
            >
              Ir a hoy
            </button>
          </div>
          
          <button
            onClick={irMesSiguiente}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Mes siguiente"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        {colaboradorId && (
          <div className="mt-2 text-center text-sm text-white/90">
            Vista filtrada por colaborador
          </div>
        )}
      </div>
      
      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia, index) => (
          <div
            key={index}
            className="bg-gray-50 py-2 text-center text-xs sm:text-sm font-medium text-gray-700"
          >
            {dia}
          </div>
        ))}
      </div>
      
      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {diasDelMes.map((dia, index) => (
          <div
            key={index}
            className={`
              bg-white min-h-[60px] sm:min-h-[80px] p-1 sm:p-2
              ${dia ? 'cursor-pointer hover:bg-gray-50' : ''}
              transition-colors relative
            `}
            onClick={() => handleDiaClick(dia)}
          >
            {dia && (
              <>
                {/* Número del día */}
                <div className={`
                  text-xs sm:text-sm font-medium mb-1
                  ${dia.esHoy ? 'text-blue-600 font-bold' : 'text-gray-700'}
                `}>
                  {dia.numero}
                </div>
                
                {/* Indicador de estado */}
                {dia.estado && (
                  <div className={`
                    text-[10px] sm:text-xs px-1 py-0.5 rounded
                    ${asistenciaService.obtenerColorEstado(dia.estado).bg}
                    ${asistenciaService.obtenerColorEstado(dia.estado).text}
                    font-medium text-center
                  `}>
                    {asistenciaService.obtenerEtiquetaEstado(dia.estado).substring(0, 3)}
                  </div>
                )}
                
                {/* Badge si es hoy */}
                {dia.esHoy && (
                  <div className="absolute top-1 right-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                )}
                
                {/* Contador de asistencias (si hay múltiples) */}
                {dia.asistencias.length > 1 && (
                  <div className="absolute bottom-1 right-1 bg-gray-700 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {dia.asistencias.length}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      
      {/* Leyenda */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Leyenda:</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { estado: 'presente', label: 'Presente' },
            { estado: 'ausente', label: 'Ausente' },
            { estado: 'tardanza', label: 'Tardanza' },
            { estado: 'permiso', label: 'Permiso' },
            { estado: 'falta_justificada', label: 'F. Justificada' },
            { estado: 'falta_injustificada', label: 'F. Injustificada' }
          ].map(({ estado, label }) => {
            const colores = asistenciaService.obtenerColorEstado(estado);
            return (
              <div key={estado} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${colores.dot}`}></div>
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            );
          })}
        </div>
        
        <div className="mt-3 text-xs text-gray-500 text-center">
          💡 Click en un día para ver las asistencias registradas
        </div>
      </div>
      
      {/* Modal de asistencias del día */}
      <ModalAsistenciasDia
        isOpen={modalDiaAbierto}
        fecha={diaSeleccionado?.fecha}
        asistencias={diaSeleccionado?.asistencias || []}
        onClose={handleCerrarModal}
        onEditar={handleEditarDesdeModal}
      />
    </div>
  );
});

CalendarioAsistencias.displayName = 'CalendarioAsistencias';

export default CalendarioAsistencias;
