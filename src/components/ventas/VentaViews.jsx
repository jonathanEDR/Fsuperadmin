import React, { useState, useMemo } from 'react';
import { DollarSign, RotateCcw, Clock, Plus, Check, ChevronDown, ChevronUp, User, Search, Filter, ShoppingCart } from 'lucide-react';
import ProductCard from './ProductCard';
import ClienteCard from './ClienteCard';
import withProductoSafeGuard from '../../hoc/withProductoSafeGuard';

const VentaViews = ({
  ventasToRender,
  viewMode,
  userRole,
  currentUserId,
  loading,
  formatearFechaHora,
  canEditDelete,
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
  usuarios = [] // Lista de usuarios para filtrado
}) => {

  // Estados para la vista de lista por cliente
  const [expandedClients, setExpandedClients] = useState({});
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(''); // Filtro por usuario

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
                const puedeFinalizar = (venta.userId === currentUserId || venta.user_info?.id === currentUserId || venta.userInfo?.id === currentUserId) && (userRole === 'user' || userRole === 'admin');
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
                          Pagado: S/ {(venta.cantidadPagada || 0).toFixed(2)}
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

  // Vista de Tarjetas
  const renderCardsView = () => {
    return (
      <>
        {ventasToRender.map(venta => {
          const puedeFinalizar = (venta.userId === currentUserId || venta.user_info?.id === currentUserId || venta.userInfo?.id === currentUserId) && (userRole === 'user' || userRole === 'admin');
          
          const ventaParaPago = {
            ...venta,
            montoPendiente: venta.debe || (venta.montoTotal - (venta.cantidadPagada || 0))
          };
          
          return (
            <div key={venta._id} className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4">
              {/* Cabecera de la venta */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Venta #{venta._id}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {new Date(venta.fechadeVenta).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {/* Estados de la venta */}
                <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                  {/* Estado de pago con detalles */}
                  <div className="text-right w-full sm:w-auto">
                    <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full ${
                      venta.estadoPago === 'Pagado' 
                        ? 'bg-green-100 text-green-800'
                        : venta.estadoPago === 'Parcial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {venta.estadoPago}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      S/ {(venta.cantidadPagada || 0).toFixed(2)} / S/ {venta.montoTotal.toFixed(2)}
                    </div>
                    <div className={`text-xs font-medium ${
                      (venta.debe || 0) <= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      Debe: S/ {(venta.debe || 0).toFixed(2)}
                    </div>
                    {/* Barra de progreso de pago */}
                    <div className="w-full sm:w-24 mt-2">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            venta.estadoPago === 'Pagado' 
                              ? 'bg-green-500' 
                              : venta.estadoPago === 'Parcial'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ 
                            width: `${Math.min(100, ((venta.cantidadPagada || 0) / venta.montoTotal) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 text-center mt-1">
                        {Math.round(((venta.cantidadPagada || 0) / venta.montoTotal) * 100)}%
                      </div>
                    </div>
                  </div>
                  {/* Estado de finalización */}
                  {venta.isCompleted && (
                    <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full ${
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
                        : 'Pendiente de revisión'}
                    </span>
                  )}
                </div>
              </div>

              {/* Información del creador y propietario */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 mt-2 mb-4 text-xs sm:text-sm">
                {venta.creatorInfo && (
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                    <p className="font-medium text-gray-700">Creado por:</p>
                    <p className="text-gray-900">{venta.creatorInfo.nombre_negocio || 'No especificado'}</p>
                    <p className="text-gray-500 text-xs">{venta.creatorInfo.email}</p>
                    <p className="text-gray-500 text-xs italic">Rol: {venta.creatorInfo.role}</p>
                  </div>
                )}
                {venta.userInfo && venta.userInfo.id !== venta.creatorInfo?.id && (
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                    <p className="font-medium text-gray-700">Asignado a:</p>
                    <p className="text-gray-900">{venta.userInfo.nombre_negocio || 'No especificado'}</p>
                    <p className="text-gray-500 text-xs">{venta.userInfo.email}</p>
                    <p className="text-gray-500 text-xs italic">Rol: {venta.userInfo.role}</p>
                  </div>
                )}
              </div>

              {/* Detalles del Cliente */}
              <div className="mb-4">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Detalles del Cliente</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <p className="text-gray-600">
                    <span className="font-medium">Nombre:</span> {venta.user_info?.nombre_negocio || 'N/A'}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Email:</span> {venta.user_info?.email || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Detalles de la Venta */}
              <div className="mb-4">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Detalles de la Venta</h4>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Fecha:</span> {formatearFechaHora(venta.fechadeVenta)}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                  <p className="text-gray-600">
                    <span className="font-medium">Monto Total:</span> S/ {venta.montoTotal.toFixed(2)}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Monto Pagado:</span> 
                    <span className={`ml-1 font-semibold ${
                      venta.cantidadPagada >= venta.montoTotal 
                        ? 'text-green-600' 
                        : venta.cantidadPagada > 0 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                    }`}>
                      S/ {(venta.cantidadPagada || 0).toFixed(2)}
                    </span>
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Saldo Pendiente:</span> 
                    <span className={`ml-1 font-semibold ${
                      (venta.debe || 0) <= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      S/ {(venta.debe || 0).toFixed(2)}
                    </span>
                  </p>
                </div>
                
                {/* Desglose detallado de pagos */}
                {venta.cobros_detalle && (venta.cobros_detalle.yape > 0 || venta.cobros_detalle.efectivo > 0 || venta.cobros_detalle.billetes > 0 || venta.cobros_detalle.faltantes > 0 || venta.cobros_detalle.gastosImprevistos > 0) && (
                  <div className="mt-3 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="text-xs font-semibold text-blue-800 mb-2">Desglose de Pagos:</h5>
                    <div className="space-y-1 text-xs">
                      {venta.cobros_detalle.yape > 0 && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">💳 Yape:</span>
                          <span className="font-medium text-blue-800">S/ {venta.cobros_detalle.yape.toFixed(2)}</span>
                        </div>
                      )}
                      {venta.cobros_detalle.efectivo > 0 && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">💵 Efectivo:</span>
                          <span className="font-medium text-blue-800">S/ {venta.cobros_detalle.efectivo.toFixed(2)}</span>
                        </div>
                      )}
                      {venta.cobros_detalle.billetes > 0 && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">💰 Billetes:</span>
                          <span className="font-medium text-blue-800">S/ {venta.cobros_detalle.billetes.toFixed(2)}</span>
                        </div>
                      )}
                      {venta.cobros_detalle.faltantes > 0 && (
                        <div className="flex justify-between">
                          <span className="text-orange-700">⚠️ Faltantes:</span>
                          <span className="font-medium text-orange-600">S/ {venta.cobros_detalle.faltantes.toFixed(2)}</span>
                        </div>
                      )}
                      {venta.cobros_detalle.gastosImprevistos > 0 && (
                        <div className="flex justify-between">
                          <span className="text-red-700">🚨 Gastos Imprevistos:</span>
                          <span className="font-medium text-red-600">S/ {venta.cobros_detalle.gastosImprevistos.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t border-blue-300 pt-1 mt-2">
                        <div className="flex justify-between font-semibold">
                          <span className="text-blue-700">Total Ventas:</span>
                          <span className="text-blue-800">
                            S/ {((venta.cobros_detalle.yape || 0) + (venta.cobros_detalle.efectivo || 0) + (venta.cobros_detalle.billetes || 0) + (venta.cobros_detalle.faltantes || 0) + (venta.cobros_detalle.gastosImprevistos || 0)).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold mt-1">
                          <span className="text-green-700">Cobro Neto:</span>
                          <span className="text-green-800">
                            S/ {((venta.cobros_detalle.yape || 0) + (venta.cobros_detalle.efectivo || 0) + (venta.cobros_detalle.billetes || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Productos de la venta */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-700">Productos</h4>
                  {/* Botón para agregar más productos */}
                  {canEditDelete(venta) && venta.estadoPago !== 'Pagado' && (
                    <button
                      onClick={() => handleOpenAddProduct(venta)}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      title="Agregar producto"
                    >
                      <Plus className="w-3 h-3" />
                      Agregar Producto
                    </button>
                  )}
                </div>
                
                {/* Tarjetas de productos */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                  {venta.productos?.filter(prod => prod != null).map((prod, idx) => {
                    return (
                      <ProductCard
                        key={idx}
                        producto={prod}
                        ventaId={venta._id}
                        venta={venta} // Pasar toda la venta para acceder a devoluciones
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemoveProduct={handleRemoveProduct}
                        canEdit={canEditDelete(venta) && venta.estadoPago !== 'Pagado'}
                        loading={ventaModificationHook.loading}
                      />
                    );
                  }) || (
                    <div className="col-span-2 lg:col-span-3 xl:col-span-4 text-center text-gray-500 py-4">
                      No hay productos en esta venta
                    </div>
                  )}
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                {/* Botón de pago */}
                {venta.estadoPago !== 'Pagado' && (
                  <button
                    onClick={() => handleOpenPayment(ventaParaPago)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    disabled={loading}
                    title={userRole === 'user' ? 'Realizar pago de venta' : 'Procesar pago'}
                  >
                    <DollarSign className="w-4 h-4" />
                    {userRole === 'user' ? 'Pagar Venta' : 'Procesar Pago'}
                  </button>
                )}
                {/* Botón de Devolución - visible para todos los usuarios */}
                {(!venta.estado || venta.estado !== 'devuelta') && (
                  <button
                    onClick={() => handleOpenDevolucion(venta)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    disabled={loading}
                    title="Agregar devolución"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Agregar Devolución
                  </button>
                )}
                {/* Estado de finalización o botón para finalizar */}
                {((venta.userId === currentUserId && (userRole === 'user' || userRole === 'admin')) || userRole === 'super_admin') && (
                  <>
                    {/* Solo mostrar botón si la venta no está finalizada ni pendiente de revisión */}
                    {(!venta.completionStatus) && (
                      <button
                        onClick={() => handleFinalizarVenta(venta._id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        disabled={loading}
                      >
                        <Clock className="w-4 h-4" />
                        Marcar como Finalizada
                      </button>
                    )}
                    {/* Permitir reenviar solo si fue rechazada */}
                    {(venta.completionStatus === 'rejected') && (
                      <button
                        onClick={() => handleFinalizarVenta(venta._id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        disabled={loading}
                      >
                        <Clock className="w-4 h-4" />
                        Reenviar Venta
                      </button>
                    )}
                    {/* Si está pendiente, solo mostrar mensaje de espera */}
                    {venta.completionStatus === 'pending' && (
                      <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                        <Clock className="w-4 h-4" />
                        Pendiente de aprobación
                      </div>
                    )}
                    {venta.completionStatus === 'approved' && (
                      <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                        <Check className="w-4 h-4" />
                        Finalizada
                      </div>
                    )}
                  </>
                )}
                {/* Botones de aprobar/rechazar (solo para admin/super_admin) */}
                {venta.completionStatus === 'pending' && 
                  ['admin', 'super_admin'].includes(userRole) && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <button 
                        onClick={() => handleApproveReject(venta._id, 'approved')}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        disabled={loading}
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleApproveReject(venta._id, 'rejected')}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        disabled={loading}
                      >
                        Rechazar
                      </button>
                    </div>
                )}
                {/* Botón de eliminar o mensaje informativo */}
                {canEditDelete(venta) ? (
                  <button
                    onClick={() => handleDeleteVenta(venta._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    disabled={loading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                ) : (
                  // Mostrar razón por la que no se puede eliminar (solo para admin y super_admin)
                  ['admin', 'super_admin'].includes(userRole) && (
                    <div className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-center text-sm">
                      <span className="text-xs">
                        {getDeleteRestrictionReason(venta)}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </>
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
    return renderTableView();
  } else if (viewMode === 'lista') {
    return renderListaView();
  } else {
    return renderCardsView();
  }
};

export default withProductoSafeGuard(VentaViews);
