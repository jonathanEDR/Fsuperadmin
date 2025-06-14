import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Info, Trash2 } from 'lucide-react';
import { getCobrosHistorial, deleteCobro } from '../services/cobroService';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return format(date, "d 'de' MMMM, yyyy HH:mm", { locale: es });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return '-';
  }
};

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return 'S/. 0.00';
  const numAmount = Number(amount);
  return isNaN(numAmount) ? 'S/. 0.00' : `S/. ${numAmount.toFixed(2)}`;
};

const CobrosHistorial = () => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCobro, setSelectedCobro] = useState(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchCobros = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Obteniendo cobros para página:', currentPage);        const data = await getCobrosHistorial(currentPage, ITEMS_PER_PAGE);
        console.log('Datos recibidos:', data);
        console.log('Cobros con sus descripciones:', data.cobros?.map(cobro => ({
          id: cobro._id,
          descripcion: cobro.descripcion,
          fecha: cobro.fechaPago
        })));
        setPayments(data.cobros || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setError(err.message);
        console.error('Error al cargar los cobros:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCobros();
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDeleteClick = (cobro) => {
    setSelectedCobro(cobro);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsLoading(true);
      await deleteCobro(selectedCobro._id);
      setDeleteModalOpen(false);
      setSelectedCobro(null);
      // Recargar los datos después de eliminar
      const data = await getCobrosHistorial(currentPage, ITEMS_PER_PAGE);
      setPayments(data.cobros || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message);
      console.error('Error al eliminar el cobro:', err);
    } finally {
      setIsLoading(false);
    }
  };

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
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto Total
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Yape
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Efectivo
              </th>              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gastos Imprevistos
              </th>              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Información
              </th>
     
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  No hay registros de cobros disponibles
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(payment.fechaPago)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col">
                      <span className="font-medium">{payment.ventasId || '-'}</span>
                      <span className="text-xs text-gray-500">{payment.creatorEmail || ''}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(payment.montoPagado || payment.montoTotal)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(payment.yape)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(payment.efectivo)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(payment.gastosImprevistos)}
                  </td>                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                    <div 
                      className="truncate cursor-help" 
                      title={payment.descripcion || 'Sin descripción'}
                    >
                      {payment.descripcion || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-col space-y-2">
                      {payment.ventasId?.length > 0 && (
                        <div className="inline-flex items-center text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          <Info className="h-4 w-4 mr-1" />
                          <span>{payment.ventasId.length} venta{payment.ventasId.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      <button
                        onClick={() => handleDeleteClick(payment)}
                        className="inline-flex items-center text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        <span>Eliminar</span>
                      </button>
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
                onClick={() => setDeleteModalOpen(false)}
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
      )}
      
      {/* Paginación */}
      <div className="px-6 py-4 flex justify-between items-center border-t">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded bg-gray-100 text-gray-600 disabled:opacity-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm text-gray-600">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded bg-gray-100 text-gray-600 disabled:opacity-50"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default CobrosHistorial;
