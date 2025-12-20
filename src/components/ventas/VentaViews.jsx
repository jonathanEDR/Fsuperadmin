import React, { useState, useMemo } from 'react';
import { DollarSign, RotateCcw, Clock, Plus, Check, ChevronDown, ChevronUp, User, Search, Filter, ShoppingCart, Package, X, Trash2 } from 'lucide-react';
import ProductCard from './ProductCard';
import ClienteCard from './ClienteCard';
import QuantityModal from './QuantityModal';
import CobrosDetalleModal from './CobrosDetalleModal';
import withProductoSafeGuard from '../../hoc/withProductoSafeGuard';
import './VentaCards.css';

const VentaViews = ({
  ventasToRender,
  viewMode,
  userRole,
  currentUserId,
  loading,
  formatearFechaHora,
  canEditDelete,
  canModifyQuantity, // ✅ NUEVO: Permiso para modificar cantidades
  handleOpenPayment,
  handleOpenDevolucion,
  handleFinalizarVenta,
  handleApproveReject,
  handleDeleteVenta,
  handleOpenAddProduct,
  handleUpdateQuantity,
  handleRemoveProduct,
  ventaModificationHook,
  searchTerm = '',
  filters = {},
  setSearchTerm = () => {},
  setFilters = () => {},
  usuarios = [], // Lista de usuarios para filtrado
  onVentaUpdated = () => {} // Callback para notificar cambios
}) => {

  // Estados para la vista de lista por cliente
  const [expandedClients, setExpandedClients] = useState({});
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(''); // Filtro por usuario

  // Estados para el modal de cantidad
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVentaId, setSelectedVentaId] = useState(null);

  // Estados para el modal de cobros detalle
  const [isCobrosModalOpen, setIsCobrosModalOpen] = useState(false);
  const [selectedVentaForCobros, setSelectedVentaForCobros] = useState(null);

  // Función para abrir el modal de cobros detalle
  const handleOpenCobrosDetalle = (venta) => {
    setSelectedVentaForCobros(venta);
    setIsCobrosModalOpen(true);
  };

  // Función para filtrar ventas según rol y usuario seleccionado
  const ventasFiltradas = useMemo(() => {
    let ventasFiltradas = ventasToRender;

    // Aplicar filtro por usuario si es necesario
    if (viewMode === 'lista' && ['super_admin', 'admin'].includes(userRole) && selectedUserId) {
      ventasFiltradas = ventasFiltradas.filter(venta => 
        venta.userId === selectedUserId || venta.creatorId === selectedUserId
      );
    }

    return ventasFiltradas;
  }, [ventasToRender, viewMode, userRole, selectedUserId]);

  // Función para agrupar ventas por cliente
  const ventasPorCliente = useMemo(() => {
    if (viewMode !== 'lista') return {};
    
    const grupos = {};
    
    ventasFiltradas.forEach(venta => {
      // Usar la misma lógica que en la tabla para obtener el cliente
      let clienteKey = venta.user_info?.nombre_negocio || 'Sin Cliente';
      let clienteEmail = venta.user_info?.email || '';
      
      // Si no hay cliente pero hay información del usuario, usar esa información
      if (clienteKey === 'Sin Cliente' && venta.userInfo) {
        clienteKey = venta.userInfo.nombre_negocio || venta.userInfo.email || 'Sin Cliente';
        clienteEmail = venta.userInfo.email || '';
      }
      
      // Como último recurso, usar información del creador
      if (clienteKey === 'Sin Cliente' && venta.creatorInfo) {
        clienteKey = venta.creatorInfo.nombre_negocio || venta.creatorInfo.email || 'Sin Cliente';
        clienteEmail = venta.creatorInfo.email || '';
      }
      
      if (!grupos[clienteKey]) {
        grupos[clienteKey] = {
          cliente: clienteKey,
          email: clienteEmail,
          ventas: [],
          totalVentas: 0,
          totalPagado: 0,
          totalPendiente: 0,
          cantidadVentas: 0
        };
      }
      
      grupos[clienteKey].ventas.push(venta);
      grupos[clienteKey].totalVentas += venta.montoTotal || 0;
      grupos[clienteKey].totalPagado += venta.cantidadPagada || 0;
      grupos[clienteKey].totalPendiente += (venta.montoTotal || 0) - (venta.cantidadPagada || 0);
      grupos[clienteKey].cantidadVentas += 1;
    });
    
    // Filtrar por búsqueda de cliente si hay término de búsqueda
    if (clientSearchTerm.trim()) {
      const filteredGrupos = {};
      Object.keys(grupos).forEach(clienteKey => {
        if (clienteKey.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
            grupos[clienteKey].email.toLowerCase().includes(clientSearchTerm.toLowerCase())) {
          filteredGrupos[clienteKey] = grupos[clienteKey];
        }
      });
      return filteredGrupos;
    }
    
    return grupos;
  }, [ventasFiltradas, viewMode, clientSearchTerm]);

  // Función para alternar expansión de cliente
  const toggleClientExpansion = (clienteKey) => {
    setExpandedClients(prev => ({
      ...prev,
      [clienteKey]: !prev[clienteKey]
    }));
  };

  // Funciones para manejar el modal de cantidad
  const openQuantityModal = (producto, ventaId) => {
    console.log('🔍 Abriendo modal de cantidad:', { producto, ventaId });
    setSelectedProduct(producto);
    setSelectedVentaId(ventaId);
    setShowQuantityModal(true);
  };

  const closeQuantityModal = () => {
    setShowQuantityModal(false);
    setSelectedProduct(null);
    setSelectedVentaId(null);
  };

  const handleQuantityConfirm = (responseData) => {
    console.log('✅ Cantidad actualizada desde modal:', responseData);
    
    // La venta puede venir directamente o dentro de un objeto con la propiedad 'venta'
    const venta = responseData?.venta || responseData;
    
    if (venta && onVentaUpdated) {
      onVentaUpdated(venta);
    }
    
    closeQuantityModal();
  };

  // Helper para determinar por qué no se puede eliminar una venta
  const getDeleteRestrictionReason = (venta) => {
    if (userRole === 'user') {
      return 'Los usuarios no pueden eliminar ventas';
    }
    
    if (venta.estadoPago === 'Pagado' || venta.estadoPago === 'Parcial' || 
        (venta.cantidadPagada && venta.cantidadPagada > 0)) {
      return 'No se puede eliminar: tiene pagos registrados';
    }

    // Verificar si la venta tiene devoluciones
    if (venta.devoluciones && venta.devoluciones.length > 0) {
      return 'No se puede eliminar: tiene devoluciones asociadas';
    }

    if (venta.completionStatus === 'approved') {
      console.log('❌ COMPLETION RESTRICTION: venta aprobada');
      return 'No se puede eliminar: venta aprobada';
    }
    
    if (venta.completionStatus === 'pending') {
      console.log('❌ PENDING RESTRICTION: venta en proceso de aprobación');
      return 'No se puede eliminar: venta en proceso de aprobación';
    }

    if (userRole === 'admin' && venta.creatorInfo?.role === 'super_admin') {
      console.log('❌ ADMIN RESTRICTION: creada por super admin');
      return 'No se puede eliminar: creada por super admin';
    }

    console.log('✅ NO RESTRICTIONS: Venta puede ser eliminada');
    return null; // Se puede eliminar
  };

  // Vista de Tabla
  const renderTableView = () => {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Venta
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total/Pagado
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ventasToRender.map(venta => {
                // Super admin puede finalizar todas las ventas, usuarios/admin solo las suyas
                const puedeFinalizar = userRole === 'super_admin' || 
                  ((venta.userId === currentUserId || venta.user_info?.id === currentUserId || venta.userInfo?.id === currentUserId) && 
                  (userRole === 'user' || userRole === 'admin'));
                const ventaParaPago = {
                  ...venta,
                  montoPendiente: venta.debe || (venta.montoTotal - (venta.cantidadPagada || 0))
                };

                return (
                  <tr key={venta._id} className="hover:bg-gray-50">
                    {/* Columna Venta */}
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">#{venta._id.slice(-8)}</div>
                        <div className="text-gray-500">{formatearFechaHora(venta.fechadeVenta)}</div>
                        {venta.creatorInfo && (
                          <div className="text-xs text-gray-400">
                            Por: {venta.creatorInfo.nombre_negocio || venta.creatorInfo.email}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Columna Cliente */}
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {venta.user_info?.nombre_negocio || 'N/A'}
                        </div>
                        <div className="text-gray-500 text-xs md:text-sm">
                          {venta.user_info?.email || 'N/A'}
                        </div>
                      </div>
                    </td>

                    {/* Columna Productos */}
                    <td className="px-3 md:px-6 py-4">
                      <div className="text-sm max-w-xs">
                        <div className="max-h-24 overflow-y-auto">
                          {venta.productos?.filter(prod => prod != null).map((prod, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                              <span className="text-gray-900 text-xs truncate max-w-[120px]" title={prod.productoId?.nombre || prod.nombre || 'Producto sin nombre'}>
                                {prod.productoId?.nombre || prod.nombre || 'Producto sin nombre'}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 text-xs">x{prod.cantidad || 0}</span>
                                <span className="text-green-600 text-xs font-medium">
                                  S/ {((prod.precioUnitario || prod.precio || 0) * (prod.cantidad || 0)).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )) || (
                            <div className="text-gray-500 text-xs">No hay productos</div>
                          )}
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            Total items: {venta.productos?.filter(prod => prod != null).reduce((sum, prod) => sum + (prod.cantidad || 0), 0) || 0}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Columna Total/Pagado */}
                    {/* Columna Total/Pagado */}
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          S/ {venta.montoTotal.toFixed(2)}
                        </div>
                        <div className={`text-xs ${
                          venta.cantidadPagada >= venta.montoTotal 
                            ? 'text-green-600' 
                            : venta.cantidadPagada > 0 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                        }`}>
                          {venta.cantidadPagada > 0 ? (
                            <button
                              onClick={() => handleOpenCobrosDetalle(venta)}
                              className="hover:underline cursor-pointer inline-flex items-center gap-1"
                              title="Ver detalle de pagos"
                            >
                              💳 Pagado: S/ {(venta.cantidadPagada || 0).toFixed(2)}
                            </button>
                          ) : (
                            <span>Pagado: S/ 0.00</span>
                          )}
                        </div>
                        <div className={`text-xs font-medium ${
                          (venta.debe || 0) <= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          Debe: S/ {(venta.debe || 0).toFixed(2)}
                        </div>
                      </div>
                    </td>

                    {/* Columna Estado */}
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          venta.estadoPago === 'Pagado' 
                            ? 'bg-green-100 text-green-800'
                            : venta.estadoPago === 'Parcial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {venta.estadoPago}
                        </span>
                        {venta.isCompleted && (
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            venta.completionStatus === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : venta.completionStatus === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {venta.completionStatus === 'approved'
                              ? 'Aprobada'
                              : venta.completionStatus === 'rejected'
                              ? 'Rechazada'
                              : 'Pendiente'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Columna Acciones */}
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col gap-1">
                        {/* Botón de pago */}
                        {venta.estadoPago !== 'Pagado' && (
                          <button
                            onClick={() => handleOpenPayment(ventaParaPago)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                            disabled={loading}
                          >
                            <DollarSign className="w-3 h-3" />
                            Pagar
                          </button>
                        )}
                        
                        {/* Botón de Devolución */}
                        {(!venta.estado || venta.estado !== 'devuelta') && (
                          <button
                            onClick={() => handleOpenDevolucion(venta)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 transition-colors"
                            disabled={loading}
                          >
                            <RotateCcw className="w-3 h-3" />
                            Devolución
                          </button>
                        )}
                        
                        {/* Botón Finalizar */}
                        {((venta.userId === currentUserId && (userRole === 'user' || userRole === 'admin')) || userRole === 'super_admin') && (
                          <>
                            {(!venta.completionStatus) && (
                              <button
                                onClick={() => handleFinalizarVenta(venta._id)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                disabled={loading}
                              >
                                <Clock className="w-3 h-3" />
                                Finalizar
                              </button>
                            )}
                          </>
                        )}
                        
                        {/* Botones de aprobar/rechazar */}
                        {venta.completionStatus === 'pending' && ['admin', 'super_admin'].includes(userRole) && (
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleApproveReject(venta._id, 'approved')}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                              disabled={loading}
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleApproveReject(venta._id, 'rejected')}
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                              disabled={loading}
                            >
                              ✗
                            </button>
                          </div>
                        )}
                        
                        {/* Botón de eliminar o razón por la que no se puede eliminar */}
                        {canEditDelete(venta) ? (
                          <button
                            onClick={() => handleDeleteVenta(venta._id)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                            disabled={loading}
                          >
                            🗑️
                          </button>
                        ) : (
                          // Mostrar tooltip o texto indicativo para admin/super_admin
                          ['admin', 'super_admin'].includes(userRole) && (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs cursor-help"
                              title={getDeleteRestrictionReason(venta)}
                            >
                              🚫
                            </span>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Vista de Líneas Compactas - Optimizada para móvil
  const renderCardsView = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
        {ventasToRender.map(venta => {
          // Super admin puede finalizar todas las ventas, usuarios/admin solo las suyas
          const puedeFinalizar = userRole === 'super_admin' || 
            ((venta.userId === currentUserId || venta.user_info?.id === currentUserId || venta.userInfo?.id === currentUserId) && 
            (userRole === 'user' || userRole === 'admin'));
          
          const ventaParaPago = {
            ...venta,
            montoPendiente: venta.debe || (venta.montoTotal - (venta.cantidadPagada || 0))
          };
          
          return (
            <div key={venta._id} className="venta-row bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 p-2 sm:p-4">
              {/* Header de la venta - Compacto para móvil */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 sm:mb-3 gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                  <div className="flex flex-col">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-700">
                      Venta #{venta._id.slice(-8)}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {formatearFechaHora(venta.fechadeVenta)}
                    </p>
                  </div>
                  
                  {/* Información financiera - Stack en móvil, inline en desktop */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-6">
                    <div className="text-center">
                      <p className="text-xs text-blue-600 font-medium">Total</p>
                      <p className="text-xs sm:text-sm font-bold text-blue-800">S/ {venta.montoTotal.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-emerald-600 font-medium">Pagado</p>
                      {venta.cantidadPagada > 0 ? (
                        <button
                          onClick={() => handleOpenCobrosDetalle(venta)}
                          className="text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-600 hover:underline cursor-pointer transition-colors inline-flex items-center gap-1"
                          title="Ver detalle de pagos"
                        >
                          💳 S/ {(venta.cantidadPagada || 0).toFixed(2)}
                        </button>
                      ) : (
                        <p className="text-xs sm:text-sm font-bold text-emerald-800">S/ 0.00</p>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-rose-600 font-medium">Debe</p>
                      <p className="text-xs sm:text-sm font-bold text-rose-800">S/ {(venta.debe || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Estados - Compactos */}
                <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-auto">
                  <span className={`px-1.5 sm:px-2 py-1 text-xs font-medium rounded-md ${
                    venta.estadoPago === 'Pagado' 
                      ? 'bg-emerald-100 text-emerald-700'
                      : venta.estadoPago === 'Parcial'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}>
                    {venta.estadoPago}
                  </span>
                  
                  {venta.isCompleted && (
                    <span className={`px-1.5 sm:px-2 py-1 text-xs rounded-md ${
                      venta.completionStatus === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : venta.completionStatus === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {venta.completionStatus === 'approved'
                        ? '✓'
                        : venta.completionStatus === 'rejected'
                        ? '✗'
                        : '⏳'}
                    </span>
                  )}
                </div>
              </div>

              {/* Línea del cliente con progreso inline */}
              <div className="flex items-center justify-between mb-3 py-2 bg-slate-50 rounded-lg px-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-600" />
                  <div>
                    <span className="font-medium text-slate-800 text-sm">
                      {venta.user_info?.nombre_negocio || 'Cliente sin nombre'}
                    </span>
                    <p className="text-xs text-slate-600">
                      {venta.user_info?.email || 'Sin email'}
                    </p>
                  </div>
                </div>
                
                {/* Progreso inline al lado del email */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">Progreso:</span>
                    <div className="w-20 bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          venta.estadoPago === 'Pagado' 
                            ? 'bg-emerald-500' 
                            : venta.estadoPago === 'Parcial'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ 
                          width: `${Math.min(100, ((venta.cantidadPagada || 0) / venta.montoTotal) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-slate-700">
                      {Math.round(((venta.cantidadPagada || 0) / venta.montoTotal) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Productos en línea horizontal */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-slate-800 text-sm">
                      Productos ({venta.productos?.filter(prod => prod != null).length || 0})
                    </span>
                  </div>
                  {/* Botón agregar producto - Usuarios también pueden agregar a sus propias ventas */}
                  {canModifyQuantity(venta) && venta.estadoPago !== 'Pagado' && (
                    <button
                      onClick={() => handleOpenAddProduct(venta)}
                      className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
                      title="Agregar producto"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                {/* Lista vertical de productos con botones funcionales */}
                <div className="space-y-2">
                  {venta.productos?.filter(prod => prod != null).map((prod, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="font-medium text-slate-700 truncate">
                          {prod.productoId?.nombre || prod.nombre || 'Sin nombre'}
                        </span>
                        <span className="text-emerald-600 font-medium text-sm">
                          S/ {((prod.precioUnitario || prod.precio || 0) * (prod.cantidad || 0)).toFixed(2)}
                        </span>
                      </div>
                      
                      {/* Controles de cantidad - CON MODAL - Usar canModifyQuantity para usuarios */}
                      {canModifyQuantity(venta) && venta.estadoPago !== 'Pagado' ? (
                        <div className="flex items-center gap-2">
                          {/* Botón disminuir (-) */}
                          <button
                            onClick={() => {
                              if ((prod.cantidad || 0) > 1) {
                                // Si tiene más de 1, abrir modal para quitar
                                openQuantityModal(prod, venta._id);
                              } else {
                                // Si solo tiene 1, eliminar directamente
                                if (window.confirm('¿Eliminar este producto de la venta?')) {
                                  handleRemoveProduct(venta._id, prod.productoId?._id || prod._id);
                                }
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors text-sm font-bold"
                            title={(prod.cantidad || 0) > 1 ? "Disminuir cantidad" : "Eliminar producto"}
                            disabled={loading}
                          >
                            -
                          </button>
                          
                          {/* Cantidad actual */}
                          <span className="text-slate-700 font-medium min-w-[3ch] text-center">
                            {prod.cantidad || 0}
                          </span>
                          
                          {/* Botón aumentar (+) */}
                          <button
                            onClick={() => openQuantityModal(prod, venta._id)}
                            className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors text-sm font-bold"
                            title="Aumentar cantidad"
                            disabled={loading}
                          >
                            +
                          </button>
                          
                          {/* Botón eliminar producto */}
                          <button
                            onClick={async () => {
                              try {
                                if (window.confirm('¿Eliminar este producto de la venta?')) {
                                  console.log('🗑️ Eliminando producto:', {
                                    ventaId: venta._id,
                                    productoId: prod.productoId?._id || prod._id
                                  });
                                  await handleRemoveProduct(venta._id, prod.productoId?._id || prod._id);
                                }
                              } catch (error) {
                                console.error('❌ Error al eliminar producto:', error);
                                alert('Error al eliminar producto: ' + error.message);
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 text-red-500 rounded-full hover:bg-red-100 transition-colors ml-2"
                            title="Eliminar producto"
                            disabled={loading}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        // Solo mostrar cantidad cuando no se puede editar
                        <span className="text-slate-500 text-sm">
                          x{prod.cantidad || 0}
                        </span>
                      )}
                    </div>
                  )) || (
                    <div className="text-slate-500 text-sm py-2 text-center bg-slate-50 rounded-lg">
                      No hay productos
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de acción en línea horizontal */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                {/* Botón de pago principal */}
                {venta.estadoPago !== 'Pagado' && (
                  <button
                    onClick={() => handleOpenPayment(ventaParaPago)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
                    disabled={loading}
                  >
                    <DollarSign className="w-4 h-4" />
                    {userRole === 'user' ? 'Realizar Pago' : 'Procesar Pago'}
                  </button>
                )}
                
                {/* Botón de Devolución */}
                {(!venta.estado || venta.estado !== 'devuelta') && (
                  <button
                    onClick={() => handleOpenDevolucion(venta)}
                    className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
                    disabled={loading}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Devolución
                  </button>
                )}
                
                {/* Botón Finalizar/Estado */}
                {((venta.userId === currentUserId && (userRole === 'user' || userRole === 'admin')) || userRole === 'super_admin') && (
                  <>
                    {(!venta.completionStatus) && (
                      <button
                        onClick={() => handleFinalizarVenta(venta._id)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        disabled={loading}
                      >
                        <Clock className="w-4 h-4" />
                        Finalizar
                      </button>
                    )}
                    {(venta.completionStatus === 'rejected') && (
                      <button
                        onClick={() => handleFinalizarVenta(venta._id)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        disabled={loading}
                      >
                        <Clock className="w-4 h-4" />
                        Reenviar
                      </button>
                    )}
                    {venta.completionStatus === 'pending' && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-200">
                        <Clock className="w-4 h-4" />
                        Pendiente
                      </div>
                    )}
                    {venta.completionStatus === 'approved' && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-200">
                        <Check className="w-4 h-4" />
                        Finalizada
                      </div>
                    )}
                  </>
                )}
                
                {/* Botones de aprobar/rechazar */}
                {venta.completionStatus === 'pending' && 
                  ['admin', 'super_admin'].includes(userRole) && (
                    <>
                      <button 
                        onClick={() => handleApproveReject(venta._id, 'approved')}
                        className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                        disabled={loading}
                      >
                        <Check className="w-4 h-4" />
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleApproveReject(venta._id, 'rejected')}
                        className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        disabled={loading}
                      >
                        <X className="w-4 h-4" />
                        Rechazar
                      </button>
                    </>
                )}
                
                {/* Botón de eliminar */}
                {canEditDelete(venta) ? (
                  <button
                    onClick={() => handleDeleteVenta(venta._id)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                ) : (
                  ['admin', 'super_admin'].includes(userRole) && (
                    <div 
                      className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-500 rounded-lg text-xs cursor-help border border-slate-200"
                      title={getDeleteRestrictionReason(venta)}
                    >
                      🚫 No disponible
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Función para renderizar la vista de lista por cliente
  const renderListaView = () => {
    const clientes = Object.values(ventasPorCliente);
    
    if (clientes.length === 0) {
      return (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay ventas</h3>
          <p className="mt-1 text-sm text-gray-500">
            {clientSearchTerm ? 'No se encontraron clientes con ese término de búsqueda.' : 'No hay ventas registradas para mostrar.'}
          </p>
        </div>
      );
    }

    // Calcular estadísticas generales
    const totalClientes = clientes.length;
    const totalVentasGlobal = clientes.reduce((sum, cliente) => sum + cliente.cantidadVentas, 0);
    const totalMontoGlobal = clientes.reduce((sum, cliente) => sum + cliente.totalVentas, 0);
    const totalPendienteGlobal = clientes.reduce((sum, cliente) => sum + cliente.totalPendiente, 0);

    return (
      <div className="space-y-6">
        {/* Información del usuario seleccionado */}
        {['super_admin', 'admin'].includes(userRole) && selectedUserId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            {(() => {
              const usuarioSeleccionado = usuarios.find(u => u.id === selectedUserId);
              return usuarioSeleccionado ? (
                <div className="flex items-center gap-3">
                  <User className="text-blue-600" size={20} />
                  <div>
                    <h3 className="font-semibold text-blue-900">
                      Viendo ventas de: {usuarioSeleccionado.name}
                    </h3>
                    <p className="text-sm text-blue-700">
                      {usuarioSeleccionado.email} - {usuarioSeleccionado.role}
                    </p>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Información cuando no hay filtro aplicado */}
        {['super_admin', 'admin'].includes(userRole) && !selectedUserId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Filter className="text-yellow-600" size={20} />
              <div>
                <h3 className="font-semibold text-yellow-900">
                  Mostrando ventas de todos los usuarios
                </h3>
                <p className="text-sm text-yellow-700">
                  Selecciona un usuario específico para filtrar las ventas
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard de estadísticas - Optimizado para móvil */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <User className="text-blue-600 flex-shrink-0" size={16} />
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold text-blue-900 truncate">{totalClientes}</div>
                <div className="text-xs sm:text-sm text-blue-600">Cliente(s)</div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <ShoppingCart className="text-green-600 flex-shrink-0" size={16} />
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold text-green-900 truncate">{totalVentasGlobal}</div>
                <div className="text-xs sm:text-sm text-green-600">Venta(s)</div>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2">
              <DollarSign className="text-purple-600 flex-shrink-0" size={16} />
              <div className="min-w-0">
                <div className="text-sm sm:text-2xl font-bold text-purple-900 truncate">S/ {totalMontoGlobal.toFixed(2)}</div>
                <div className="text-xs sm:text-sm text-purple-600">Total Ventas</div>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <Clock className="text-red-600 flex-shrink-0" size={16} />
              <div className="min-w-0">
                <div className="text-sm sm:text-2xl font-bold text-red-900 truncate">S/ {totalPendienteGlobal.toFixed(2)}</div>
                <div className="text-xs sm:text-sm text-red-600">Pendiente</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros para la vista de cliente */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col gap-4">
            {/* Primera fila: Selector de usuario (solo para admin y super_admin) */}
            {['super_admin', 'admin'].includes(userRole) && (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por usuario:
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos los usuarios</option>
                    {usuarios.map(usuario => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.name} ({usuario.email}) - {usuario.role}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedUserId && (
                  <div className="flex items-end">
                    <button
                      onClick={() => setSelectedUserId('')}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Limpiar
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Segunda fila: Búsqueda de cliente */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar cliente por nombre o email..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User size={16} />
                <span>{clientes.length} cliente(s) mostrado(s)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de clientes */}
        {clientes
          .sort((a, b) => b.totalVentas - a.totalVentas) // Ordenar por total de ventas descendente
          .map((clienteData) => (
            <ClienteCard
              key={clienteData.cliente}
              clienteData={clienteData}
              isExpanded={expandedClients[clienteData.cliente]}
              onToggleExpansion={() => toggleClientExpansion(clienteData.cliente)}
              formatearFechaHora={formatearFechaHora}
            />
          ))}
      </div>
    );
  };

  // Renderizado condicional basado en viewMode
  if (viewMode === 'table') {
    return (
      <>
        {renderTableView()}
        
        {/* Modal de cantidad */}
        <QuantityModal
          isOpen={showQuantityModal}
          onClose={closeQuantityModal}
          producto={selectedProduct}
          onConfirm={handleQuantityConfirm}
          isUpdating={loading}
          ventaId={selectedVentaId}
        />

        {/* Modal de Detalle de Cobros */}
        <CobrosDetalleModal
          isOpen={isCobrosModalOpen}
          onClose={() => setIsCobrosModalOpen(false)}
          venta={selectedVentaForCobros}
        />
      </>
    );
  } else if (viewMode === 'lista') {
    return (
      <>
        {renderListaView()}
        
        {/* Modal de cantidad */}
        <QuantityModal
          isOpen={showQuantityModal}
          onClose={closeQuantityModal}
          producto={selectedProduct}
          onConfirm={handleQuantityConfirm}
          isUpdating={loading}
          ventaId={selectedVentaId}
        />

        {/* Modal de Detalle de Cobros */}
        <CobrosDetalleModal
          isOpen={isCobrosModalOpen}
          onClose={() => setIsCobrosModalOpen(false)}
          venta={selectedVentaForCobros}
        />
      </>
    );
  } else {
    return (
      <>
        {renderCardsView()}
        
        {/* Modal de cantidad */}
        <QuantityModal
          isOpen={showQuantityModal}
          onClose={closeQuantityModal}
          producto={selectedProduct}
          onConfirm={handleQuantityConfirm}
          isUpdating={loading}
          ventaId={selectedVentaId}
        />

        {/* Modal de Detalle de Cobros */}
        <CobrosDetalleModal
          isOpen={isCobrosModalOpen}
          onClose={() => setIsCobrosModalOpen(false)}
          venta={selectedVentaForCobros}
        />
      </>
    );
  }
};

export default withProductoSafeGuard(VentaViews);
