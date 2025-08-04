import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Trash2, Edit, Eye, Shield, Calendar, DollarSign, User, FileText } from 'lucide-react';
import TarjetaFinanciera from '../components/Finanzas/TarjetaFinanciera';
import TablaFinanciera from '../components/Finanzas/TablaFinanciera';
import ModalFinanciero from '../components/Finanzas/ModalFinanciero';
import CampoFormulario, { useFormulario } from '../components/Finanzas/CampoFormulario';
import { garantiasService } from '../services/finanzasService';

function GarantiasPage() {
  const [garantias, setGarantias] = useState([]);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    tipo: '',
    estado: '',
    fechaInicio: '',
    fechaFin: ''
  });
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoModal, setTipoModal] = useState('crear'); // crear, editar, ver
  const [garantiaSeleccionada, setGarantiaSeleccionada] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    activas: 0,
    ejecutadas: 0,
    valorTotal: 0
  });

  const nuevaGarantia = useFormulario({
    tipo: '',
    descripcion: '',
    valorGarantia: '',
    fechaOtorgamiento: '',
    fechaVencimiento: '',
    beneficiario: '',
    condiciones: '',
    estado: 'activa',
    documentos: [],
    observaciones: ''
  });

  // Cargar garantías al montar el componente
  useEffect(() => {
    cargarGarantias();
  }, []);

  // Cargar garantías filtradas cuando cambian los filtros
  useEffect(() => {
    cargarGarantias();
  }, [filtros]);

  const cargarGarantias = async () => {
    try {
      setCargando(true);
      const response = await garantiasService.obtenerTodos(filtros);
      console.log('Respuesta de garantías:', response); // Debug
      
      // Manejar diferentes estructuras de respuesta
      let garantiasData = [];
      if (response?.data?.garantias) {
        garantiasData = response.data.garantias;
      } else if (response?.garantias) {
        garantiasData = response.garantias;
      } else if (Array.isArray(response?.data)) {
        garantiasData = response.data;
      } else if (Array.isArray(response)) {
        garantiasData = response;
      }
      
      setGarantias(garantiasData);
      calcularEstadisticas(garantiasData);
    } catch (error) {
      console.error('Error al cargar garantías:', error);
      // En caso de error, inicializar con array vacío
      setGarantias([]);
      calcularEstadisticas([]);
    } finally {
      setCargando(false);
    }
  };

  const calcularEstadisticas = (data) => {
    // Asegurar que data sea un array
    if (!Array.isArray(data)) {
      console.warn('calcularEstadisticas: data no es un array:', data);
      data = [];
    }
    
    const stats = data.reduce((acc, garantia) => {
      acc.total += 1;
      if (garantia.estado === 'activa') acc.activas += 1;
      if (garantia.estado === 'ejecutada') acc.ejecutadas += 1;
      acc.valorTotal += parseFloat(garantia.valorGarantia || 0);
      return acc;
    }, { total: 0, activas: 0, ejecutadas: 0, valorTotal: 0 });

    setEstadisticas(stats);
  };

  const abrirModal = (tipo, garantia = null) => {
    setTipoModal(tipo);
    setGarantiaSeleccionada(garantia);
    if (garantia && tipo === 'editar') {
      nuevaGarantia.setValores(garantia);
    } else if (tipo === 'crear') {
      nuevaGarantia.resetear();
    }
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setGarantiaSeleccionada(null);
    nuevaGarantia.resetear();
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    try {
      if (tipoModal === 'crear') {
        await garantiasService.crear(nuevaGarantia.valores);
      } else if (tipoModal === 'editar') {
        await garantiasService.actualizar(garantiaSeleccionada._id, nuevaGarantia.valores);
      }
      cerrarModal();
      cargarGarantias();
    } catch (error) {
      console.error('Error al guardar garantía:', error);
    }
  };

  const eliminarGarantia = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta garantía?')) {
      try {
        await garantiasService.eliminar(id);
        cargarGarantias();
      } catch (error) {
        console.error('Error al eliminar garantía:', error);
      }
    }
  };

  const columnasTabla = [
    {
      campo: 'tipo',
      encabezado: 'Tipo',
      renderizar: (garantia) => (
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <span className="font-medium">{garantia.tipo}</span>
        </div>
      )
    },
    {
      campo: 'beneficiario',
      encabezado: 'Beneficiario',
      renderizar: (garantia) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-600" />
          <span>{garantia.beneficiario}</span>
        </div>
      )
    },
    {
      campo: 'valorGarantia',
      encabezado: 'Valor',
      renderizar: (garantia) => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-green-600">
            ${parseFloat(garantia.valorGarantia || 0).toLocaleString()}
          </span>
        </div>
      )
    },
    {
      campo: 'fechaVencimiento',
      encabezado: 'Vencimiento',
      renderizar: (garantia) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-orange-600" />
          <span>{new Date(garantia.fechaVencimiento).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      campo: 'estado',
      encabezado: 'Estado',
      renderizar: (garantia) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          garantia.estado === 'activa' ? 'bg-green-100 text-green-800' :
          garantia.estado === 'ejecutada' ? 'bg-red-100 text-red-800' :
          garantia.estado === 'vencida' ? 'bg-gray-100 text-gray-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {garantia.estado}
        </span>
      )
    }
  ];

  const acciones = [
    {
      icono: <Eye className="w-4 h-4" />,
      tooltip: 'Ver detalles',
      onClick: (garantia) => abrirModal('ver', garantia),
      color: 'text-blue-600'
    },
    {
      icono: <Edit className="w-4 h-4" />,
      tooltip: 'Editar',
      onClick: (garantia) => abrirModal('editar', garantia),
      color: 'text-green-600'
    },
    {
      icono: <Trash2 className="w-4 h-4" />,
      tooltip: 'Eliminar',
      onClick: (garantia) => eliminarGarantia(garantia._id),
      color: 'text-red-600'
    }
  ];

  const tarjetasEstadisticas = [
    {
      titulo: 'Total Garantías',
      valor: estadisticas.total,
      icono: <Shield className="w-6 h-6" />,
      color: 'bg-blue-500',
      tendencia: null
    },
    {
      titulo: 'Garantías Activas',
      valor: estadisticas.activas,
      icono: <Shield className="w-6 h-6" />,
      color: 'bg-green-500',
      tendencia: null
    },
    {
      titulo: 'Garantías Ejecutadas',
      valor: estadisticas.ejecutadas,
      icono: <Shield className="w-6 h-6" />,
      color: 'bg-red-500',
      tendencia: null
    },
    {
      titulo: 'Valor Total',
      valor: `$${estadisticas.valorTotal.toLocaleString()}`,
      icono: <DollarSign className="w-6 h-6" />,
      color: 'bg-purple-500',
      tendencia: null
    }
  ];

  const tiposGarantia = [
    'Garantía Bancaria',
    'Garantía de Cumplimiento',
    'Garantía de Calidad',
    'Garantía de Anticipo',
    'Garantía de Mantenimiento',
    'Garantía Personal',
    'Fianza',
    'Aval',
    'Otra'
  ];

  const estadosGarantia = [
    'activa',
    'ejecutada',
    'vencida',
    'cancelada'
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Garantías</h1>
        <p className="text-gray-600">Administra todas las garantías y fianzas del sistema</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {tarjetasEstadisticas.map((tarjeta, index) => (
          <TarjetaFinanciera key={index} {...tarjeta} />
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar garantías..."
              value={filtros.busqueda}
              onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los tipos</option>
            {tiposGarantia.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>

          <select
            value={filtros.estado}
            onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            {estadosGarantia.map(estado => (
              <option key={estado} value={estado}>
                {estado.charAt(0).toUpperCase() + estado.slice(1)}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filtros.fechaInicio}
            onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <input
            type="date"
            value={filtros.fechaFin}
            onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Lista de Garantías</h2>
          <button
            onClick={() => abrirModal('crear')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Garantía
          </button>
        </div>

        <TablaFinanciera
          datos={garantias}
          columnas={columnasTabla}
          acciones={acciones}
          loading={cargando}
          mensajeVacio="No hay garantías registradas"
        />
      </div>

      {/* Modal */}
      <ModalFinanciero
        abierto={modalAbierto}
        onClose={cerrarModal}
        titulo={
          tipoModal === 'crear' ? 'Nueva Garantía' :
          tipoModal === 'editar' ? 'Editar Garantía' :
          'Detalles de Garantía'
        }
        size="lg"
      >
        {tipoModal === 'ver' && garantiaSeleccionada ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información General</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Tipo:</span>
                    <p className="text-gray-900">{garantiaSeleccionada.tipo}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Beneficiario:</span>
                    <p className="text-gray-900">{garantiaSeleccionada.beneficiario}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Valor:</span>
                    <p className="text-gray-900 font-semibold">
                      ${parseFloat(garantiaSeleccionada.valorGarantia || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Estado:</span>
                    <p className="text-gray-900">{garantiaSeleccionada.estado}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Fechas</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Otorgamiento:</span>
                    <p className="text-gray-900">
                      {new Date(garantiaSeleccionada.fechaOtorgamiento).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Vencimiento:</span>
                    <p className="text-gray-900">
                      {new Date(garantiaSeleccionada.fechaVencimiento).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {garantiaSeleccionada.descripcion && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Descripción</h3>
                <p className="text-gray-600">{garantiaSeleccionada.descripcion}</p>
              </div>
            )}
            
            {garantiaSeleccionada.condiciones && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Condiciones</h3>
                <p className="text-gray-600">{garantiaSeleccionada.condiciones}</p>
              </div>
            )}
            
            {garantiaSeleccionada.observaciones && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Observaciones</h3>
                <p className="text-gray-600">{garantiaSeleccionada.observaciones}</p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={manejarSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CampoFormulario
                label="Tipo de Garantía"
                name="tipo"
                type="select"
                options={tiposGarantia.map(tipo => ({ value: tipo, label: tipo }))}
                value={nuevaGarantia.valores.tipo}
                onChange={nuevaGarantia.manejarCambio}
                required
              />

              <CampoFormulario
                label="Beneficiario"
                name="beneficiario"
                type="text"
                value={nuevaGarantia.valores.beneficiario}
                onChange={nuevaGarantia.manejarCambio}
                required
              />

              <CampoFormulario
                label="Valor de la Garantía"
                name="valorGarantia"
                type="number"
                value={nuevaGarantia.valores.valorGarantia}
                onChange={nuevaGarantia.manejarCambio}
                step="0.01"
                min="0"
                required
              />

              <CampoFormulario
                label="Estado"
                name="estado"
                type="select"
                options={estadosGarantia.map(estado => ({ 
                  value: estado, 
                  label: estado.charAt(0).toUpperCase() + estado.slice(1) 
                }))}
                value={nuevaGarantia.valores.estado}
                onChange={nuevaGarantia.manejarCambio}
                required
              />

              <CampoFormulario
                label="Fecha de Otorgamiento"
                name="fechaOtorgamiento"
                type="date"
                value={nuevaGarantia.valores.fechaOtorgamiento}
                onChange={nuevaGarantia.manejarCambio}
                required
              />

              <CampoFormulario
                label="Fecha de Vencimiento"
                name="fechaVencimiento"
                type="date"
                value={nuevaGarantia.valores.fechaVencimiento}
                onChange={nuevaGarantia.manejarCambio}
                required
              />
            </div>

            <CampoFormulario
              label="Descripción"
              name="descripcion"
              type="textarea"
              value={nuevaGarantia.valores.descripcion}
              onChange={nuevaGarantia.manejarCambio}
              rows={3}
            />

            <CampoFormulario
              label="Condiciones"
              name="condiciones"
              type="textarea"
              value={nuevaGarantia.valores.condiciones}
              onChange={nuevaGarantia.manejarCambio}
              rows={3}
            />

            <CampoFormulario
              label="Observaciones"
              name="observaciones"
              type="textarea"
              value={nuevaGarantia.valores.observaciones}
              onChange={nuevaGarantia.manejarCambio}
              rows={2}
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cerrarModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {tipoModal === 'crear' ? 'Crear Garantía' : 'Actualizar Garantía'}
              </button>
            </div>
          </form>
        )}
      </ModalFinanciero>
    </div>
  );
}

export default GarantiasPage;
