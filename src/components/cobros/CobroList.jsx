import React, { useState, useEffect } from 'react';
import { useUser, useSession } from '@clerk/clerk-react';
import { DollarSign } from 'lucide-react';
import { 
  getPendingVentas,
  getPaymentHistory,
} from '../../services/cobroService';
import CobrosHistorial from './CobrosHistorial';
import CobroCreationModal from './CobroCreationModal';
import CobroResumen from './CobroResumen';
import CobrosLineChart from '../Graphics/CobrosLineChart.jsx';

const CobroList = ({ userRole }) => {
  const { user } = useUser();
  const { session } = useSession();
  const [pendingVentas, setPendingVentas] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [debtInfo, setDebtInfo] = useState(null);

  const loadData = async () => {
    if (!user || !session) {
      setLoading(false);
      setError('Por favor, inicie sesión para acceder a esta función.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await session.getToken();
      if (!token) {
        throw new Error('No se encontró una sesión activa. Por favor, inicie sesión nuevamente.');
      }

      const [ventasResponse, historyResponse] = await Promise.all([
        getPendingVentas(),
        getPaymentHistory(currentPage)
      ]);

      setPendingVentas(ventasResponse || []);
      setPaymentHistory(historyResponse?.cobros || []);
      setTotalPages(historyResponse?.totalPages || 1);

      // Calcular información de deuda
      const totalDebt = ventasResponse?.reduce((sum, venta) => 
        sum + (venta.montoTotalNeto - (venta.cantidadPagada || 0)), 0) || 0;
      
      setDebtInfo({
        totalDebt,
        pendingVentasCount: ventasResponse?.length || 0
      });

      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || 'Error al cargar los datos');
      setPendingVentas([]);
      setPaymentHistory([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, session, currentPage]);

  const handleCobroCreated = async (result) => {
    if (result) {
      setSuccess('Pago registrado exitosamente');
      setTimeout(() => setSuccess(''), 3000);
      await loadData();
      setShowPaymentModal(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      {error && (
        <div className="mb-4 sm:mb-6 p-2 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-xs sm:text-base">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 sm:mb-6 p-2 sm:p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg text-xs sm:text-base">
          {success}
        </div>
      )}

      <div className="mb-4 sm:mb-8">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <DollarSign className="text-blue-600" size={22} />
          Gestión de Cobros
        </h2>
      </div>

      {/* Resumen de Cobros */}
      <div className="mb-4 sm:mb-8">
        <div className="overflow-x-auto">
          <CobroResumen debtInfo={debtInfo} />
        </div>
      </div>

      {/* Gráfico de Cobros - Solo para Super Admin */}
      {userRole === 'super_admin' && (
        <div className="mb-4 sm:mb-8 overflow-x-auto">
          <CobrosLineChart userRole={userRole} />
        </div>
      )}

      {/* Botón para Nuevo Cobro */}
      <div className="mb-4 sm:mb-8">
        <button
          onClick={() => setShowPaymentModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <DollarSign size={18} />
          Registrar Nuevo Cobro
        </button>
      </div>

      {/* Historial de Pagos */}
      <div className="mb-4 sm:mb-8 overflow-x-auto">
        <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Historial de Pagos</h3>
        <CobrosHistorial userRole={userRole} />
      </div>

      {/* Modal de Pago */}
      {showPaymentModal && (
        <CobroCreationModal
          isOpen={true}
          onClose={() => setShowPaymentModal(false)}
          ventasData={pendingVentas}
          onCobroCreated={handleCobroCreated}
        />
      )}
    </div>
  );
};

export default CobroList;