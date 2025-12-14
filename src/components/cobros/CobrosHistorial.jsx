import React, { useEffect, useState, useCallback, useMemo, useRef, memo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Info, Trash2 } from 'lucide-react';
import { getCobrosHistorial, deleteCobro } from '../../services/cobroService';

// Funciones de formato movidas fuera del componente para evitar recrearlas
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    // Usar timezone de Perú para consistencia
    return format(date, "d 'de' MMMM, yyyy HH:mm", { locale: es });
  } catch (error) {
    return '-';
  }
};

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return 'S/. 0.00';
  const numAmount = Number(amount);
  return isNaN(numAmount) ? 'S/. 0.00' : `S/. ${numAmount.toFixed(2)}`;
};

const formatPaymentTypes = (payment) => {
  const types = [];
  
  if (payment.yape && parseFloat(payment.yape) > 0) {
    types.push(`Yape: ${formatCurrency(payment.yape)}`);
  }
  if (payment.efectivo && parseFloat(payment.efectivo) > 0) {
    types.push(`Efectivo: ${formatCurrency(payment.efectivo)}`);
  }
  if (payment.billetes && parseFloat(payment.billetes) > 0) {
    types.push(`Billetes: ${formatCurrency(payment.billetes)}`);
  }
  if (payment.faltantes && parseFloat(payment.faltantes) > 0) {
    types.push(`Faltantes: ${formatCurrency(payment.faltantes)}`);
  }
  if (payment.gastosImprevistos && parseFloat(payment.gastosImprevistos) > 0) {
    types.push(`Gastos: ${formatCurrency(payment.gastosImprevistos)}`);
  }
  
  return types.length > 0 ? types : ['Sin especificar'];
};

const CobrosHistorial = ({ userRole }) => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCobro, setSelectedCobro] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCobros, setTotalCobros] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Ref para controlar si ya se cargó inicialmente
  const initialLoadDone = useRef(false);
  const isMounted = useRef(true);
  
  // Función fetchCobros memoizada con useCallback
  const fetchCobros = useCallback(async (isLoadMore = false) => {
    if (!isMounted.current) return;
    
    try {
      if (!isLoadMore) {
        setIsLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const pageToFetch = isLoadMore ? currentPage + 1 : 1;
      
      const data = await getCobrosHistorial(pageToFetch, ITEMS_PER_PAGE);
      
      if (!isMounted.current) return;
      
      if (isLoadMore) {
        setPayments(prevPayments => [...prevPayments, ...(data.cobros || [])]);
        setCurrentPage(pageToFetch);
      } else {
        setPayments(data.cobros || []);
        setCurrentPage(1);
      }
      
      // Actualizar estado de "hasMore" y total
      setTotalCobros(data.totalCobros || data.total || 0);
      setHasMore(pageToFetch < (data.totalPages || 1));
      
    } catch (err) {
      if (isMounted.current) {
        setError(err.message);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setLoadingMore(false);
      }
    }
  }, [currentPage]);

  // Efecto de carga inicial - solo una vez
  useEffect(() => {
    isMounted.current = true;
    
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchCobros(false);
    }
    
    return () => {
      isMounted.current = false;
    };
  }, []); // Sin dependencias - solo se ejecuta al montar

  // Handler para cargar más - memoizado
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchCobros(true);
    }
  }, [loadingMore, hasMore, fetchCobros]);

  // Handler para click en eliminar - memoizado
  const handleDeleteClick = useCallback((cobro) => {
    setSelectedCobro(cobro);
    setDeleteModalOpen(true);
  }, []);
  
  // Handler para cerrar modal - memoizado
  const handleCloseDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setSelectedCobro(null);
  }, []);
  
  // Handler para confirmar eliminación - memoizado
  const handleConfirmDelete = useCallback(async () => {
    if (!selectedCobro) return;
    
    try {
      setIsLoading(true);
      await deleteCobro(selectedCobro._id);
      setDeleteModalOpen(false);
      setSelectedCobro(null);
      // Recargar los datos desde el principio después de eliminar
      setCurrentPage(1);
      initialLoadDone.current = false;
      await fetchCobros(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCobro, fetchCobros]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-600">
        <p>Error al cargar los datos: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Usuario</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Sucursal</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipos de Cobro</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Total</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Descripción</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Información</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-4 text-center text-gray-500">No hay registros de cobros disponibles</td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                  {/* Fecha */}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(payment.fechaCobro || payment.fechaPago || payment.createdAt)}
                  </td>
                  
                  {/* Usuario */}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                    <div className="flex flex-col">
                      <span className="font-medium">{payment.creatorName || 'Usuario no especificado'}</span>
                      <span className="text-xs text-gray-500">{payment.creatorEmail || ''}</span>
                    </div>
                  </td>
                  
                  {/* Sucursal */}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                    {payment.sucursalNombre ? (
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {payment.sucursalNombre}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Sin sucursal</span>
                    )}
                  </td>
                  
                  {/* Tipos de Cobro */}
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div className="space-y-1">
                      {formatPaymentTypes(payment).map((type, index) => (
                        <div key={index} className="flex items-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  
                  {/* Monto Total */}
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(payment.montoPagado || payment.montoTotal)}
                  </td>
                  
                  {/* Descripción */}
                  <td className="px-4 py-4 text-sm text-gray-500 max-w-xs hidden md:table-cell">
                    <div className="truncate cursor-help" title={payment.descripcion || 'Sin descripción'}>
                      {payment.descripcion || '-'}
                    </div>
                  </td>
                  
                  {/* Información */}
                  <td className="px-4 py-4 text-sm text-gray-500">
                    <div className="flex flex-col space-y-2">
                      {payment.ventasId?.length > 0 && (
                        <div className="inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          <Info className="h-4 w-4 mr-1" />
                          <span>{payment.ventasId.length} venta{payment.ventasId.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {userRole === 'super_admin' && (
                        <button 
                          onClick={() => handleDeleteClick(payment)} 
                          className="inline-flex items-center text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          <span>Eliminar</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Modal de confirmación de eliminación */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Confirmar eliminación</h3>
            <p className="mb-4">¿Estás seguro que deseas eliminar este cobro? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCloseDeleteModal}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}        {/* Botón Ver Más - Solo para super_admin */}
      {hasMore && userRole === 'super_admin' && (
        <div className="px-6 py-4 text-center border-t">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              loadingMore
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loadingMore ? 'Cargando...' : 'Ver más'}
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Mostrando {payments.length} de {totalCobros} registros de cobros
          </p>
        </div>
      )}

      {/* Indicador para roles que no son super_admin */}
      {hasMore && userRole !== 'super_admin' && (
        <div className="px-6 py-4 text-center border-t">
          <p className="text-sm text-gray-500">
            Mostrando los {payments.length} registros de cobros más recientes
            {totalCobros > payments.length && (
              <span className="block mt-1 text-xs">
                ({totalCobros - payments.length} registros adicionales disponibles)
              </span>
            )}
          </p>
        </div>      )}
    </div>
  );
};

export default memo(CobrosHistorial);
