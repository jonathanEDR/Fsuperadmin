import React, { useState } from 'react';
import { ChevronDown, ChevronUp, User, DollarSign, ShoppingCart, Check, X, Clock } from 'lucide-react';

// Avatar component with real photo support
const AvatarColab = ({ nombre, avatarUrl, size = 'md' }) => {
  const [err, setErr] = React.useState(false);
  const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-xs', lg: 'w-14 h-14 text-xl' };
  const sz = sizes[size] || sizes.md;
  if (avatarUrl && !err) {
    return (
      <img
        src={avatarUrl}
        alt={nombre}
        className={`${sz} rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm`}
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center font-bold text-white flex-shrink-0 shadow-sm`}>
      {(nombre || '?').charAt(0).toUpperCase()}
    </div>
  );
};

const ClienteCard = ({ 
  clienteData, 
  isExpanded, 
  onToggleExpansion, 
  formatearFechaHora
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header del cliente */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={onToggleExpansion}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AvatarColab
              nombre={clienteData.cliente}
              avatarUrl={clienteData.avatarUrl}
              size="md"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{clienteData.cliente}</h3>
              {clienteData.email && (
                <p className="text-sm text-gray-500">{clienteData.email}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Estadísticas del cliente - Desktop */}
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ShoppingCart size={14} />
                {clienteData.ventas.length} venta(s)
              </div>
              <div className="flex items-center gap-2 font-semibold text-gray-900">
                <DollarSign size={14} />
                S/ {clienteData.totalVentas.toFixed(2)}
              </div>
              {clienteData.totalPendiente > 0 && (
                <div className="text-xs text-red-500">
                  Debe: S/ {clienteData.totalPendiente.toFixed(2)}
                </div>
              )}
            </div>
            
            {/* Botón de expansión */}
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              {isExpanded ? (
                <ChevronUp className="text-gray-500" size={20} />
              ) : (
                <ChevronDown className="text-gray-500" size={20} />
              )}
            </button>
          </div>
        </div>
        
        {/* Estadísticas móviles */}
        <div className="mt-3 flex justify-between items-center sm:hidden">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ShoppingCart size={14} />
            {clienteData.ventas.length} venta(s)
          </div>
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <DollarSign size={14} />
            S/ {clienteData.totalVentas.toFixed(2)}
          </div>
        </div>
        {clienteData.totalPendiente > 0 && (
          <div className="mt-2 text-xs text-red-500 sm:hidden">
            Debe: S/ {clienteData.totalPendiente.toFixed(2)}
          </div>
        )}
      </div>
      
      {/* Ventas del cliente (colapsable) */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Resumen detallado del cliente */}
          <div className="bg-gray-50/50 p-4 border-b border-gray-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">{clienteData.ventas.length}</div>
                <div className="text-xs text-gray-600">Ventas</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">S/ {clienteData.totalVentas.toFixed(2)}</div>
                <div className="text-xs text-gray-600">Total Facturado</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">S/ {clienteData.totalPagado.toFixed(2)}</div>
                <div className="text-xs text-gray-600">Total Pagado</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">S/ {clienteData.totalPendiente.toFixed(2)}</div>
                <div className="text-xs text-gray-600">Pendiente</div>
              </div>
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            {clienteData.ventas.map((venta) => (
              <div key={venta._id} className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Columna Venta - Similar a la tabla */}
                  <div className="space-y-1">
                    <div className="font-mono text-sm font-medium text-gray-900">
                      #{venta._id?.slice(-8)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatearFechaHora(venta.fechadeVenta)}
                    </div>
                    {venta.creatorInfo && (
                      <div className="text-xs text-gray-400">
                        Por: {venta.creatorInfo.nombre_negocio || venta.creatorInfo.email}
                      </div>
                    )}
                  </div>

                  {/* Columna Productos - Similar a la tabla */}
                  <div className="md:col-span-1">
                    <div className="max-h-20 overflow-y-auto">
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

                  {/* Columna Total/Pagado - Similar a la tabla */}
                  <div className="space-y-1">
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

                  {/* Columna Estado - Similar a la tabla */}
                  <div className="space-y-2">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full border ${
                      venta.estadoPago === 'Pagado' 
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : venta.estadoPago === 'Parcial'
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {venta.estadoPago}
                    </span>
                    {venta.isCompleted && (
                      <span className={`inline-flex items-center gap-0.5 px-2 py-1 text-xs rounded-full border ${
                        venta.completionStatus === 'approved'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : venta.completionStatus === 'rejected'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {venta.completionStatus === 'approved'
                          ? <><Check size={10} /> Aprobada</>
                          : venta.completionStatus === 'rejected'
                          ? <><X size={10} /> Rechazada</>
                          : <><Clock size={10} /> Pendiente</>}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClienteCard;
