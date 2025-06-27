import React, { useState } from 'react';
import useGestionPersonalData from './useGestionPersonalData';
import PagosRealizados from './PagosRealizados';
import GestionPersonalList from './GestionPersonalList';

function PagosRealizadosPage() {
  // Hook centralizado para compartir datos y funciones
  const {
    pagos,
    colaboradores,
    registros,
    loading,
    error,
    fetchPagos,
    agregarPago,
    eliminarPago,
    setError
  } = useGestionPersonalData();

  // Estado para filtros de GestionPersonalList
  const [filtroFecha, setFiltroFecha] = useState('historico');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });

  // Filtrar registros según filtroFecha para GestionPersonalList
  const filtrarRegistros = () => {
    if (filtroFecha === 'historico') return registros;
    const hoy = new Date();
    let inicio, fin;
    switch (filtroFecha) {
      case 'semana': {
        const diaSemana = hoy.getDay();
        const diferenciaDias = diaSemana === 0 ? 6 : diaSemana - 1;
        inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - diferenciaDias);
        inicio.setHours(0, 0, 0, 0);
        fin = new Date(inicio);
        fin.setDate(inicio.getDate() + 6);
        fin.setHours(23, 59, 59, 999);
        break;
      }
      case 'mes': {
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        inicio.setHours(0, 0, 0, 0);
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        fin.setHours(23, 59, 59, 999);
        break;
      }
      case 'año': {
        inicio = new Date(hoy.getFullYear(), 0, 1);
        inicio.setHours(0, 0, 0, 0);
        fin = new Date(hoy.getFullYear(), 11, 31);
        fin.setHours(23, 59, 59, 999);
        break;
      }
      case 'personalizado': {
        if (customDateRange.start && customDateRange.end) {
          inicio = new Date(customDateRange.start);
          fin = new Date(customDateRange.end);
          fin.setHours(23, 59, 59, 999);
        } else {
          return registros;
        }
        break;
      }
      default:
        return registros;
    }
    return registros.filter(registro => {
      const fechaRegistro = new Date(registro.fechaDeGestion);
      return fechaRegistro >= inicio && fechaRegistro <= fin;
    });
  };

  const registrosFiltrados = filtrarRegistros();

  // Handlers para filtros
  const handleFiltroChange = (nuevoFiltro) => setFiltroFecha(nuevoFiltro);
  const handleCustomDateRangeChange = (field, value) => {
    setCustomDateRange(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      {/* Pagos Realizados */}
      <PagosRealizados
        pagos={pagos}
        colaboradores={colaboradores}
        registros={registros}
        loading={loading}
        error={error}
        fetchPagos={fetchPagos}
        agregarPago={agregarPago}
        eliminarPago={eliminarPago}
        setError={setError}
      />

      {/* Gestión de Personal (Lista de registros) */}
      <GestionPersonalList
        registros={registrosFiltrados}
        todosLosRegistros={registros}
        onEliminar={eliminarPago} // O ajusta según lógica de eliminación
        loading={loading}
        filtroFecha={filtroFecha}
        onFiltroChange={handleFiltroChange}
        customDateRange={customDateRange}
        onCustomDateRangeChange={handleCustomDateRangeChange}
      />
    </div>
  );
}

export default PagosRealizadosPage;
