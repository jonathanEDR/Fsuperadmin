import React from 'react';
import { DollarSign, RotateCcw, Clock, Plus, Check } from 'lucide-react';
import ProductCard from './ProductCard';

const VentaViews = ({
  ventasToRender,
  viewMode,
  userRole,
  currentUserId,
  loading,
  devoluciones,
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
  ventaModificationHook
}) => {

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
                          {venta.productos?.map((prod, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                              <span className="text-gray-900 text-xs truncate max-w-[120px]" title={prod.productoId?.nombre || prod.nombre || 'Producto sin nombre'}>
                                {prod.productoId?.nombre || prod.nombre || 'Producto sin nombre'}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 text-xs">x{prod.cantidad}</span>
                                <span className="text-green-600 text-xs font-medium">
                                  S/ {((prod.precioUnitario || prod.precio || 0) * (prod.cantidad || 0)).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            Total items: {venta.productos?.reduce((sum, prod) => sum + prod.cantidad, 0) || 0}
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
                        
                        {/* Botón de eliminar */}
                        {canEditDelete(venta) && (
                          <button
                            onClick={() => handleDeleteVenta(venta._id)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                            disabled={loading}
                          >
                            🗑️
                          </button>
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

              {/* Detalles de productos y montos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Detalles del Cliente</h4>
                  <p className="text-gray-600">
                    <span className="font-medium">Nombre:</span> {venta.user_info?.nombre_negocio || 'N/A'}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Email:</span> {venta.user_info?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Detalles de la Venta</h4>
                  <p className="text-gray-600">
                    <span className="font-medium">Fecha:</span> {formatearFechaHora(venta.fechadeVenta)}
                  </p>
                  <div className="space-y-1">
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
                    {/* Desglose detallado de pagos */}
                    {venta.cobros_detalle && (venta.cobros_detalle.yape > 0 || venta.cobros_detalle.efectivo > 0 || venta.cobros_detalle.gastosImprevistos > 0) && (
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
                          {venta.cobros_detalle.gastosImprevistos > 0 && (
                            <div className="flex justify-between">
                              <span className="text-blue-700">⚠️ Gastos Imprevistos:</span>
                              <span className="font-medium text-red-600">S/ {venta.cobros_detalle.gastosImprevistos.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="border-t border-blue-300 pt-1 mt-2">
                            <div className="flex justify-between font-semibold">
                              <span className="text-blue-700">Total Ventas:</span>
                              <span className="text-blue-800">
                                S/ {((venta.cobros_detalle.yape || 0) + (venta.cobros_detalle.efectivo || 0) + (venta.cobros_detalle.gastosImprevistos || 0)).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between font-semibold mt-1">
                              <span className="text-green-700">Cobro Neto:</span>
                              <span className="text-green-800">
                                S/ {((venta.cobros_detalle.yape || 0) + (venta.cobros_detalle.efectivo || 0)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {venta.productos?.map((prod, idx) => {
                    // FILTRAR DEVOLUCIONES PARA ESTA VENTA - Solo para admin y super_admin
                    const devolucionesVenta = ['admin', 'super_admin'].includes(userRole) 
                      ? devoluciones.filter(dev => {
                          return dev.ventaId === venta._id || dev.ventaId?._id === venta._id;
                        })
                      : []; // Para usuarios normales, no pasar devoluciones
                    
                    return (
                      <ProductCard
                        key={idx}
                        producto={prod}
                        ventaId={venta._id}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemoveProduct={handleRemoveProduct}
                        canEdit={canEditDelete(venta) && venta.estadoPago !== 'Pagado'}
                        loading={ventaModificationHook.loading}
                        devoluciones={devolucionesVenta}
                      />
                    );
                  })}
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
                {/* Botón de eliminar (solo para admin y super_admin con permisos) */}
                {canEditDelete(venta) && (
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
                )}
              </div>
            </div>
          );
        })}
      </>
    );
  };

  // Renderizado condicional basado en viewMode
  if (viewMode === 'table') {
    return renderTableView();
  } else {
    return renderCardsView();
  }
};

export default VentaViews;
