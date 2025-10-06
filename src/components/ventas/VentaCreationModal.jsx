import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';

// Importar hooks personalizados
import {
  useCarrito,
  useProductosVenta,
  useUsuariosVenta,
  useVentaForm
} from './VentaCreationModal/hooks';

// Importar utilidades
import { calcularSubtotalCarrito } from './VentaCreationModal/utils';

// Importar componentes UI
import {
  BusquedaProductos,
  ListaProductosDisponibles,
  CarritoVenta,
  FormularioVenta,
  BotonesAccion
} from './VentaCreationModal/components';

/**
 * VentaCreationModal - Modal refactorizado para crear ventas
 * 
 * Arquitectura modular:
 * - Hooks: Lógica de negocio separada
 * - Components: UI reutilizable y optimizada
 * - Utils: Funciones auxiliares y validadores
 * 
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Estado de apertura del modal
 * @param {Function} props.onClose - Callback para cerrar modal
 * @param {Function} props.onVentaCreated - Callback después de crear venta
 * @param {string} props.userRole - Rol del usuario actual
 */
const VentaCreationModal = ({ isOpen, onClose, onVentaCreated, userRole }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  
  // Estados locales
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Hook: Gestión del carrito
  const {
    carrito,
    agregarProducto,
    eliminarProducto,
    limpiarCarrito
  } = useCarrito();

  // Hook: Gestión de productos
  const {
    productos,
    categorias,
    loading: loadingProductos,
    error: errorProductos,
    searchTerm,
    selectedCategory,
    productosDisponibles,
    setSearchTerm,
    setSelectedCategory,
    actualizarStockMultiple
  } = useProductosVenta();

  // Hook: Gestión de usuarios
  const {
    usuarios,
    loading: loadingUsuarios,
    error: errorUsuarios
  } = useUsuariosVenta(userRole);

  // Hook: Gestión del formulario
  const {
    formData,
    isSubmitting: guardando,
    error: errorForm,
    actualizarFormulario,
    resetearFormulario,
    enviarVenta
  } = useVentaForm(onVentaCreated, onClose);

  // Calcular subtotal del carrito
  const subtotal = useMemo(() => calcularSubtotalCarrito(carrito), [carrito]);

  /**
   * Manejar agregar producto al carrito con cantidad
   */
  const handleAgregarProducto = useCallback((producto, cantidad) => {
    try {
      agregarProducto(producto, cantidad);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [agregarProducto]);

  /**
   * Manejar guardado de venta
   */
  const handleGuardarVenta = useCallback(async () => {
    try {
      setError('');
      setSuccessMessage('');

      // Validar carrito
      if (carrito.length === 0) {
        setError('Debes agregar al menos un producto al carrito');
        return;
      }

      // Validar cliente seleccionado
      if (!formData.targetUserId) {
        setError('Debes seleccionar un cliente');
        return;
      }

      // Enviar venta
      const resultado = await enviarVenta(carrito, subtotal, actualizarStockMultiple);

      if (resultado.success) {
        // Mensaje de éxito
        setSuccessMessage('✅ Venta creada exitosamente');

        // Limpiar carrito
        limpiarCarrito();

        // Esperar un momento para que el usuario vea el mensaje
        setTimeout(() => {
          handleCerrar();
        }, 1500);
      } else {
        setError(resultado.error || 'Error al crear la venta');
      }

    } catch (err) {
      setError(err.message || 'Error al crear la venta');
    }
  }, [
    carrito,
    formData.targetUserId,
    subtotal,
    enviarVenta,
    actualizarStockMultiple,
    limpiarCarrito
  ]);

  /**
   * Manejar cierre del modal
   */
  const handleCerrar = useCallback(() => {
    if (!guardando) {
      setError('');
      setSuccessMessage('');
      onClose();
    }
  }, [guardando, onClose]);

  /**
   * Resetear estado al cerrar
   */
  useEffect(() => {
    if (!isOpen) {
      limpiarCarrito();
      resetearFormulario();
      setError('');
      setSuccessMessage('');
    }
  }, [isOpen, limpiarCarrito, resetearFormulario]);

  // No renderizar si está cerrado
  if (!isOpen) return null;

  // Validar si se puede guardar
  const puedeGuardar = carrito.length > 0 && formData.targetUserId && !guardando;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2.5 sm:px-6 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-6 flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <ShoppingBag size={20} className="sm:w-7 sm:h-7 flex-shrink-0" />
              <h2 className="text-base sm:text-2xl font-bold truncate">Nueva Venta</h2>
            </div>
            {/* Total a facturar en el header */}
            {subtotal > 0 && (
              <div className="bg-white/20 backdrop-blur-sm px-2 py-1 sm:px-4 sm:py-2 rounded-md sm:rounded-lg border border-white/30">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium text-white/90">Total:</span>
                  <span className="text-sm sm:text-xl font-bold text-white whitespace-nowrap">S/ {subtotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleCerrar}
            disabled={guardando}
            className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Mensaje de éxito */}
        {successMessage && (
          <div className="bg-green-50 border-b border-green-200 px-6 py-3">
            <p className="text-green-700 font-medium text-center">{successMessage}</p>
          </div>
        )}

        {/* Contenido principal */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Columna Izquierda: Productos */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900 border-b pb-1.5 sm:pb-2">
                📦 Productos Disponibles
              </h3>

              {/* Búsqueda y filtros */}
              <BusquedaProductos
                searchTerm={searchTerm}
                selectedCategory={selectedCategory}
                categorias={categorias}
                onSearchChange={setSearchTerm}
                onCategoryChange={setSelectedCategory}
              />

              {/* Lista de productos */}
              <ListaProductosDisponibles
                productos={productosDisponibles}
                onAgregarProducto={handleAgregarProducto}
                loading={loadingProductos}
                error={errorProductos}
              />
            </div>

            {/* Columna Derecha: Carrito y Formulario */}
            <div className="space-y-4 sm:space-y-6">
              
              {/* Carrito */}
              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 border-b pb-1.5 sm:pb-2 mb-3 sm:mb-4">
                  🛒 Carrito de Compra
                </h3>
                <CarritoVenta
                  carrito={carrito}
                  onRemoverProducto={eliminarProducto}
                  onLimpiarCarrito={limpiarCarrito}
                  subtotal={subtotal}
                />
              </div>

              {/* Formulario */}
              {carrito.length > 0 && (
                <div>
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-900 border-b pb-1.5 sm:pb-2 mb-3 sm:mb-4">
                    📝 Datos de la Venta
                  </h3>
                  <FormularioVenta
                    formData={formData}
                    onFormChange={actualizarFormulario}
                    usuarios={usuarios}
                    loadingUsuarios={loadingUsuarios}
                    errores={{}}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="border-t border-gray-200 px-3 py-2.5 sm:px-6 sm:py-4 bg-gray-50">
          <BotonesAccion
            onGuardar={handleGuardarVenta}
            onCancelar={handleCerrar}
            guardando={guardando}
            deshabilitarGuardar={!puedeGuardar}
            mensajeError={error}
            subtotal={subtotal}
          />
        </div>
      </div>
    </div>
  );
};

export default VentaCreationModal;
