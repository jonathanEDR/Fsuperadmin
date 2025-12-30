import React, { useState } from 'react';
import useCatalogoGastos from './useCatalogoGastos';
import CatalogoGastoForm from './CatalogoGastoForm';

export default function CatalogoGastoList() {
  const {
    catalogo,
    loading,
    error,
    isSubmitting,
    filtros,
    addItemCatalogo,
    updateItemCatalogo,
    deleteItemCatalogo,
    reactivarItemCatalogo,
    updateFiltros,
    limpiarFiltros,
    setError
  } = useCatalogoGastos();

  // Estado para el formulario
  const initialItem = {
    _id: null,
    nombre: '',
    categoria: '',
    tipoDeGasto: '',
    unidadMedida: 'unidad',
    precioReferencia: '',
    descripcion: '',
    activo: true
  };

  const [showForm, setShowForm] = useState(false);
  const [itemActual, setItemActual] = useState(initialItem);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  // Handlers para formulario
  const handleFormChange = (field, value) => {
    setItemActual(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    let result;

    if (itemActual._id) {
      result = await updateItemCatalogo(itemActual);
    } else {
      result = await addItemCatalogo(itemActual);
    }

    if (result.success) {
      setShowForm(false);
      setItemActual(initialItem);
    }
  };

  const handleEdit = (item) => {
    setItemActual({
      ...item,
      precioReferencia: item.precioReferencia?.toString() || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Desactivar "${nombre}" del catalogo?`)) {
      await deleteItemCatalogo(id);
    }
  };

  const handleReactivar = async (id) => {
    await reactivarItemCatalogo(id);
  };

  const handleAdd = () => {
    setItemActual(initialItem);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setItemActual(initialItem);
    setError(null);
  };

  // Filtrar catalogo segun filtros activos
  const catalogoFiltrado = catalogo.filter(item => {
    if (!mostrarInactivos && !item.activo) return false;
    return true;
  });

  // Agrupar por categoria
  const catalogoPorCategoria = catalogoFiltrado.reduce((acc, item) => {
    const cat = item.categoria;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categoriasOrdenadas = ['Finanzas', 'Producción', 'Ventas', 'Administración'];

  const getCategoriaColor = (categoria) => {
    const colores = {
      'Finanzas': 'blue',
      'Producción': 'green',
      'Ventas': 'yellow',
      'Administración': 'purple'
    };
    return colores[categoria] || 'gray';
  };

  const getCategoriaIcon = (categoria) => {
    const iconos = {
      'Finanzas': 'fa-coins',
      'Producción': 'fa-industry',
      'Ventas': 'fa-cash-register',
      'Administración': 'fa-user-tie'
    };
    return iconos[categoria] || 'fa-folder';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Cargando catalogo...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Catalogo de Gastos</h1>
          <p className="text-gray-600 mt-1">Administra los tipos de gastos disponibles para tu empresa</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors shadow-md flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Agregar al Catalogo
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filtrar por categoria:</label>
            <select
              value={filtros.categoria}
              onChange={e => updateFiltros({ categoria: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              <option value="Finanzas">Finanzas</option>
              <option value="Producción">Producción</option>
              <option value="Ventas">Ventas</option>
              <option value="Administración">Administración</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Tipo:</label>
            <select
              value={filtros.tipoDeGasto}
              onChange={e => updateFiltros({ tipoDeGasto: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="Pago Personal">Pago Personal</option>
              <option value="Materia Prima">Materia Prima</option>
              <option value="Otros">Otros</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="mostrarInactivos"
              checked={mostrarInactivos}
              onChange={e => setMostrarInactivos(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="mostrarInactivos" className="text-sm text-gray-700">
              Mostrar inactivos
            </label>
          </div>

          <button
            onClick={limpiarFiltros}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            <i className="fas fa-eraser mr-1"></i>
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {categoriasOrdenadas.map(cat => {
          const items = catalogoPorCategoria[cat] || [];
          const activos = items.filter(i => i.activo).length;
          const color = getCategoriaColor(cat);
          const icon = getCategoriaIcon(cat);

          return (
            <div
              key={cat}
              className={`bg-white rounded-lg shadow-md p-4 border-l-4 border-${color}-500`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-${color}-100 flex items-center justify-center`}>
                  <i className={`fas ${icon} text-${color}-500`}></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{cat}</p>
                  <p className="text-xl font-bold text-gray-800">{activos} items</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lista por categoria */}
      {catalogoFiltrado.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <i className="fas fa-folder-open text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 text-xl">No hay items en el catalogo</p>
          <button
            onClick={handleAdd}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Agregar primer item
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {categoriasOrdenadas.map(categoria => {
            const items = catalogoPorCategoria[categoria];
            if (!items || items.length === 0) return null;

            const color = getCategoriaColor(categoria);
            const icon = getCategoriaIcon(categoria);

            return (
              <div key={categoria} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className={`bg-gradient-to-r from-${color}-500 to-${color}-600 px-6 py-4`}>
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <i className={`fas ${icon}`}></i>
                    {categoria}
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      {items.filter(i => i.activo).length} activo(s)
                    </span>
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left p-4 font-semibold text-gray-700">Nombre</th>
                        <th className="text-center p-4 font-semibold text-gray-700">Tipo</th>
                        <th className="text-center p-4 font-semibold text-gray-700">Unidad</th>
                        <th className="text-center p-4 font-semibold text-gray-700">Precio Ref.</th>
                        <th className="text-center p-4 font-semibold text-gray-700">Estado</th>
                        <th className="text-center p-4 font-semibold text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map(item => (
                        <tr
                          key={item._id}
                          className={`hover:bg-gray-50 transition-colors ${!item.activo ? 'opacity-50 bg-gray-100' : ''}`}
                        >
                          <td className="p-4">
                            <div className="font-semibold text-gray-900">{item.nombre}</div>
                            {item.descripcion && (
                              <div className="text-xs text-gray-500 mt-1">{item.descripcion}</div>
                            )}
                          </td>
                          <td className="text-center p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.tipoDeGasto === 'Pago Personal' ? 'bg-purple-100 text-purple-700' :
                              item.tipoDeGasto === 'Materia Prima' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {item.tipoDeGasto}
                            </span>
                          </td>
                          <td className="text-center p-4 text-gray-600">{item.unidadMedida}</td>
                          <td className="text-center p-4">
                            {item.precioReferencia > 0 ? (
                              <span className="font-semibold text-green-600">
                                S/. {item.precioReferencia.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="text-center p-4">
                            {item.activo ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                Activo
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                Inactivo
                              </span>
                            )}
                          </td>
                          <td className="text-center p-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-2 text-blue-500 hover:bg-blue-100 rounded-md transition-colors"
                                title="Editar"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              {item.activo ? (
                                <button
                                  onClick={() => handleDelete(item._id, item.nombre)}
                                  className="p-2 text-red-500 hover:bg-red-100 rounded-md transition-colors"
                                  title="Desactivar"
                                >
                                  <i className="fas fa-ban"></i>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReactivar(item._id)}
                                  className="p-2 text-green-500 hover:bg-green-100 rounded-md transition-colors"
                                  title="Reactivar"
                                >
                                  <i className="fas fa-check-circle"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal del formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-screen overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <i className={`fas ${itemActual._id ? 'fa-edit' : 'fa-plus-circle'} text-blue-500`}></i>
                {itemActual._id ? 'Editar Item del Catalogo' : 'Agregar al Catalogo'}
              </h3>
              <CatalogoGastoForm
                item={itemActual}
                onChange={handleFormChange}
                onSubmit={handleFormSubmit}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
