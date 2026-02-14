
import React, { useMemo, useState, useEffect } from 'react';
import { X, Calendar, Package, User, FileText, Factory } from 'lucide-react';
import SearchableSelect from '../common/SearchableSelect';
import { movimientoUnificadoService } from '../../services/movimientoUnificadoService';

// Componente especializado para selección de productos con búsqueda
const ProductoSearchableSelect = ({ catalogoProductos, value, onChange, required }) => {
  // Preparar opciones para SearchableSelect
  const options = useMemo(() => {
    const productoOptions = [];

    // Agrupar productos por categoría
    const productosPorCategoria = catalogoProductos.reduce((acc, producto) => {
      const categoria = producto.categoria || 'Sin categoría';
      if (!acc[categoria]) {
        acc[categoria] = [];
      }
      acc[categoria].push(producto);
      return acc;
    }, {});

    // Ordenar categorías alfabéticamente
    const categoriasOrdenadas = Object.keys(productosPorCategoria).sort();

    // Crear opciones agrupadas
    categoriasOrdenadas.forEach(categoria => {
      // Agregar header de categoría (no seleccionable)
      productoOptions.push({
        id: `header-${categoria}`,
        label: `── ${categoria.toUpperCase()} ──`,
        code: '',
        isHeader: true,
        categoria
      });

      // Agregar productos de la categoría
      productosPorCategoria[categoria]
        .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
        .forEach(producto => {
          productoOptions.push({
            id: producto._id,
            label: `${producto.nombre} (Stock: ${producto.cantidadRestante || 0})`,
            code: producto.codigoProducto,
            categoria: categoria,
            stock: producto.cantidadRestante || 0
          });
        });
    });

    return productoOptions;
  }, [catalogoProductos]);

  // Función personalizada para filtrar opciones
  const filterFunction = (options, searchTerm) => {
    if (!searchTerm.trim()) return options;
    
    const term = searchTerm.toLowerCase();
    
    return options.filter(option => {
      // No filtrar headers, siempre mostrarlos
      if (option.isHeader) return true;
      
      // Buscar en código, nombre y categoría
      return (
        option.code?.toLowerCase().includes(term) ||
        option.label.toLowerCase().includes(term) ||
        option.categoria?.toLowerCase().includes(term)
      );
    });
  };

  // Función personalizada para renderizar opciones
  const renderOption = (option, index, isHighlighted, onSelect) => {
    if (option.isHeader) {
      return (
        <div
          key={option.id}
          className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200"
        >
          {option.label}
        </div>
      );
    }

    const stockColor = option.stock > 10 ? 'text-green-600' : 
                      option.stock > 0 ? 'text-yellow-600' : 'text-red-600';

    return (
      <div
        key={option.id}
        onClick={onSelect}
        className={`
          px-3 py-2 cursor-pointer transition-colors duration-150 border-l-4
          ${isHighlighted 
            ? 'bg-blue-100 text-blue-900 border-blue-400' 
            : 'text-gray-900 hover:bg-gray-50 border-transparent hover:border-gray-200'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <span className="font-mono text-sm text-gray-600 mr-2 font-medium">
                {option.code}
              </span>
              <span className="truncate">{option.label.replace(/ \(Stock:.*\)$/, '')}</span>
            </div>
          </div>
          <div className="ml-2">
            <span className={`text-sm font-medium ${stockColor}`}>
              Stock: {option.stock}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <SearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Buscar producto por código, nombre o categoría..."
      searchPlaceholder="Buscar productos..."
      required={required}
      renderOption={renderOption}
      filterFn={filterFunction}
      className="mt-1"
      name="productoId"
    />
  );
};

const InventarioModal = ({
  isOpen,
  onClose,
  inventarioForm,
  setInventarioForm,
  inventarioError,
  inventarioLoading,
  catalogoProductos,
  handleInventarioSubmit
}) => {
  // Estados para la sección de producción
  const [produccionActiva, setProduccionActiva] = useState(false);
  const [catalogoProduccion, setCatalogoProduccion] = useState([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);
  const [formulaEstandar, setFormulaEstandar] = useState(null);
  const [loadingFormula, setLoadingFormula] = useState(false);

  // Cargar catálogo de producción al activar
  useEffect(() => {
    if (isOpen && produccionActiva && catalogoProduccion.length === 0) {
      cargarCatalogoProduccion();
    }
  }, [isOpen, produccionActiva]);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setProduccionActiva(false);
      setFormulaEstandar(null);
    }
  }, [isOpen]);

  // Cargar fórmula cuando se selecciona producto de producción
  const handleProductoProduccionChange = async (productoId) => {
    setInventarioForm(f => ({ ...f, catalogoProduccionId: productoId }));
    setFormulaEstandar(null);
    
    if (!productoId) return;
    
    setLoadingFormula(true);
    try {
      const response = await movimientoUnificadoService.obtenerFormulaEstandar(productoId);
      const formula = response.data;
      if (formula?.activa && formula.recetas?.length > 0) {
        setFormulaEstandar(formula);
      }
    } catch (err) {
      console.log('Producto sin fórmula estándar configurada');
    } finally {
      setLoadingFormula(false);
    }
  };

  const cargarCatalogoProduccion = async () => {
    setLoadingCatalogo(true);
    try {
      const response = await movimientoUnificadoService.obtenerProductosPorTipo('produccion');
      setCatalogoProduccion(response.data || []);
    } catch (error) {
      console.error('Error al cargar catálogo de producción:', error);
    } finally {
      setLoadingCatalogo(false);
    }
  };

  // Submit wrapper que incluye datos de producción
  const handleSubmitConProduccion = async (e) => {
    e.preventDefault();

    // Calcular datos de producción ANTES de submit
    let datosProduccion = null;
    if (produccionActiva && inventarioForm.catalogoProduccionId && inventarioForm.cantidadProduccion) {
      const cantidadProd = parseFloat(inventarioForm.cantidadProduccion) || 0;
      let recetasCalculadas = [];
      
      if (formulaEstandar?.activa && formulaEstandar.recetas?.length > 0) {
        recetasCalculadas = formulaEstandar.recetas.map(item => ({
          receta: item.receta?._id || item.receta,
          cantidadUtilizada: Math.round((item.cantidadPorUnidad * cantidadProd) * 100) / 100,
          nombre: item.nombre || ''
        }));
      }
      
      datosProduccion = {
        catalogoProduccionId: inventarioForm.catalogoProduccionId,
        cantidadProduccion: cantidadProd,
        recetasCalculadas,
        tieneFormula: recetasCalculadas.length > 0
      };
    }

    // Agregar datos de producción al evento para que ProductoList los use
    e._datosProduccion = datosProduccion;

    // Delegar al handler original
    await handleInventarioSubmit(e);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-1 sm:p-4 z-50">
      <div className="bg-white rounded-none sm:rounded-lg w-full h-full sm:h-auto sm:max-w-4xl lg:max-w-5xl mx-0 sm:mx-2 lg:mx-4 relative sm:max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 rounded-t-none sm:rounded-t-lg">
          <button
            onClick={onClose}
            className="absolute right-2 sm:right-3 lg:right-4 top-2 sm:top-3 lg:top-4 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} className="sm:hidden" />
            <X size={24} className="hidden sm:block" />
          </button>

          <div className="pr-6 sm:pr-8">
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Registrar Nueva Entrada de Inventario</h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600">Cada entrada se registra individualmente para mejor trazabilidad</p>
          </div>
        </div>

        <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          {inventarioError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 sm:py-4 rounded-md mb-4 sm:mb-6">
              <div className="flex items-center">
                <div className="ml-2">
                  <strong>Error:</strong> {inventarioError}
                </div>
              </div>
            </div>
          )}

          <form id="inventario-form" onSubmit={handleSubmitConProduccion} className="space-y-4 sm:space-y-6">
            {/* Información del Producto */}
            <div className="bg-gray-50 p-3 sm:p-4 lg:p-6 rounded-lg">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Package className="mr-2 sm:mr-3" size={20} />
                <span className="hidden sm:inline">Información del Producto</span>
                <span className="sm:hidden">Producto</span>
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                    Producto Registrado * 
                    <span className="text-xs sm:text-sm text-gray-500 ml-1">(Con búsqueda inteligente)</span>
                  </label>
                  <ProductoSearchableSelect
                    catalogoProductos={catalogoProductos}
                    value={inventarioForm.productoId || ''}
                    onChange={(value) => setInventarioForm(f => ({ ...f, productoId: value }))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Información de la Entrada */}
            <div className="bg-gray-50 p-3 sm:p-4 lg:p-6 rounded-lg">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <FileText className="mr-2 sm:mr-3" size={20} />
                <span className="hidden sm:inline">Detalles de la Entrada</span>
                <span className="sm:hidden">Detalles</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    name="cantidad"
                    value={inventarioForm.cantidad || ''}
                    onChange={e => setInventarioForm(f => ({ ...f, cantidad: e.target.value }))}
                    required
                    min="1"
                    step="1"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base py-2 sm:py-3"
                    placeholder="Ej: 100"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                    Precio Unitario *
                  </label>
                  <input
                    type="number"
                    name="precio"
                    value={inventarioForm.precio || ''}
                    onChange={e => setInventarioForm(f => ({ ...f, precio: e.target.value }))}
                    required
                    min="0"
                    step="0.01"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base py-2 sm:py-3"
                    placeholder="Ej: 15.50"
                  />
                </div>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="bg-gray-50 p-3 sm:p-4 lg:p-6 rounded-lg">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <User className="mr-2 sm:mr-3" size={20} />
                <span className="hidden sm:inline">Información Adicional</span>
                <span className="sm:hidden">Adicional</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                    Lote
                  </label>
                  <input
                    type="text"
                    name="lote"
                    value={inventarioForm.lote || ''}
                    onChange={e => setInventarioForm(f => ({ ...f, lote: e.target.value }))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base py-2 sm:py-3"
                    placeholder="Ej: LOTE-001"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    name="proveedor"
                    value={inventarioForm.proveedor || ''}
                    onChange={e => setInventarioForm(f => ({ ...f, proveedor: e.target.value }))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base py-2 sm:py-3"
                    placeholder="Ej: Proveedor ABC"
                  />
                </div>
              </div>
              <div className="mt-4 sm:mt-6">
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  name="fechaVencimiento"
                  value={inventarioForm.fechaVencimiento || ''}
                  onChange={e => setInventarioForm(f => ({ ...f, fechaVencimiento: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base py-2 sm:py-3"
                />
              </div>
              <div className="mt-4 sm:mt-6">
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  value={inventarioForm.observaciones || ''}
                  onChange={e => setInventarioForm(f => ({ ...f, observaciones: e.target.value }))}
                  rows="3"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="Observaciones adicionales sobre esta entrada..."
                />
              </div>
            </div>

            {/* Sección de Producción (Opcional) */}
            <div className="border-2 border-dashed border-green-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setProduccionActiva(!produccionActiva)}
                className={`w-full flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4 transition-colors ${
                  produccionActiva
                    ? 'bg-green-50 border-b border-green-200'
                    : 'bg-white hover:bg-green-50'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <Factory size={20} className={produccionActiva ? 'text-green-600' : 'text-gray-400'} />
                  <div className="text-left">
                    <span className={`text-sm sm:text-base font-semibold ${produccionActiva ? 'text-green-800' : 'text-gray-700'}`}>
                      También registrar en Producción
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Agrega cantidad al inventario de producción simultáneamente
                    </p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full flex items-center transition-colors ${
                  produccionActiva ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'
                }`}>
                  <div className="w-5 h-5 bg-white rounded-full shadow-md mx-0.5"></div>
                </div>
              </button>

              {produccionActiva && (
                <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 bg-green-50/50">
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                      Producto de Producción *
                    </label>
                    {loadingCatalogo ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        Cargando productos de producción...
                      </div>
                    ) : (
                      <select
                        value={inventarioForm.catalogoProduccionId || ''}
                        onChange={(e) => handleProductoProduccionChange(e.target.value)}
                        required={produccionActiva}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm sm:text-base py-2 sm:py-3"
                      >
                        <option value="">Seleccionar producto de producción...</option>
                        {catalogoProduccion.map(prod => (
                          <option key={prod._id} value={prod._id}>
                            {prod.nombre} (Stock: {prod.stock || prod.cantidad || 0} {prod.unidadMedida || 'unidad'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Indicador de fórmula estándar */}
                  {loadingFormula && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
                      Cargando fórmula estándar...
                    </div>
                  )}
                  {!loadingFormula && inventarioForm.catalogoProduccionId && (
                    <div className={`p-3 rounded-lg border ${
                      formulaEstandar?.activa 
                        ? 'bg-emerald-50 border-emerald-300' 
                        : 'bg-amber-50 border-amber-300'
                    }`}>
                      {formulaEstandar?.activa ? (
                        <>
                          <div className="flex items-center gap-2 text-emerald-700 font-medium mb-2">
                            <span>✅</span>
                            <span>Fórmula estándar configurada</span>
                          </div>
                          <div className="text-xs text-emerald-600 space-y-1">
                            <p className="font-medium">Recetas que se consumirán (por unidad):</p>
                            {formulaEstandar.recetas.map((r, i) => (
                              <div key={i} className="flex justify-between">
                                <span>• {r.nombre || `Receta ${i + 1}`}</span>
                                <span className="font-mono">{r.cantidadPorUnidad} {r.unidadMedida || 'u'}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-700">
                          <span>⚠️</span>
                          <span className="text-sm">Sin fórmula configurada - solo se agregará stock sin consumir recetas</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                      Cantidad para Producción *
                    </label>
                    <input
                      type="number"
                      value={inventarioForm.cantidadProduccion || ''}
                      onChange={(e) => setInventarioForm(f => ({
                        ...f,
                        cantidadProduccion: e.target.value
                      }))}
                      required={produccionActiva}
                      min="0.01"
                      step="0.01"
                      className="w-full rounded-md border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm sm:text-base py-2 sm:py-3 bg-white"
                      placeholder="Ej: 50"
                    />
                    <p className="text-xs text-green-600 mt-1">
                      Esta cantidad se agregará al inventario de producción
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Resumen */}
            {inventarioForm.cantidad && inventarioForm.precio && (
              <div className="bg-blue-50 p-3 sm:p-4 lg:p-6 rounded-lg">
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-blue-900 mb-2 sm:mb-3">Resumen</h3>
                <div className="text-sm sm:text-base text-blue-800 space-y-1 sm:space-y-2">
                  <p>🛒 Cantidad para venta: <span className="font-semibold">{inventarioForm.cantidad} unidades</span></p>
                  <p>Precio unitario: <span className="font-semibold">S/ {parseFloat(inventarioForm.precio || 0).toFixed(2)}</span></p>
                  <p className="text-base sm:text-lg font-bold">
                    Costo total: S/ {(parseFloat(inventarioForm.cantidad || 0) * parseFloat(inventarioForm.precio || 0)).toFixed(2)}
                  </p>
                  {produccionActiva && inventarioForm.cantidadProduccion && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="text-green-700">
                        🏭 Cantidad para producción: <span className="font-semibold">{inventarioForm.cantidadProduccion} unidades</span>
                      </p>
                      {formulaEstandar?.activa && (
                        <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                          <p className="font-medium mb-1">📉 Recetas que se descontarán:</p>
                          {formulaEstandar.recetas.map((r, i) => {
                            const cantidadTotal = (r.cantidadPorUnidad * parseFloat(inventarioForm.cantidadProduccion)).toFixed(2);
                            return (
                              <div key={i} className="flex justify-between">
                                <span>• {r.nombre || `Receta ${i + 1}`}</span>
                                <span className="font-mono text-red-600">-{cantidadTotal} {r.unidadMedida || 'u'}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Botones fijos en la parte inferior */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 rounded-b-none sm:rounded-b-lg">
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="inventario-form"
              disabled={inventarioLoading}
              className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                inventarioLoading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {inventarioLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                  <span className="hidden sm:inline">Registrando...</span>
                  <span className="sm:hidden">...</span>
                </div>
              ) : (
                <>
                  <span className="hidden sm:inline">Registrar Entrada</span>
                  <span className="sm:hidden">Registrar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};



export default InventarioModal;
