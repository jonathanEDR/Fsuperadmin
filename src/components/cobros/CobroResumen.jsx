import React from 'react';
import { Wallet, Receipt, TrendingUp, AlertCircle } from 'lucide-react';

const CobroResumen = ({ debtInfo }) => {
  if (!debtInfo) return null;

  const formatCurrency = (amount) => {
    return `S/. ${(amount || 0).toFixed(2)}`;
  };

  const getDebtStatus = () => {
    if (debtInfo.totalDebt === 0) {
      return { color: 'text-green-600', bgColor: 'bg-green-100', icon: TrendingUp, message: 'Sin deudas pendientes' };
    } else if (debtInfo.totalDebt > 0 && debtInfo.totalDebt <= 500) {
      return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertCircle, message: 'Deuda controlada' };
    } else {
      return { color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertCircle, message: 'Requiere atención' };
    }
  };

  const debtStatus = getDebtStatus();
  const StatusIcon = debtStatus.icon;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Deuda Total */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-300">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className={`p-2 sm:p-3 ${debtStatus.bgColor} rounded-lg`}>
            <Wallet className={`h-5 w-5 sm:h-6 sm:w-6 ${debtStatus.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-gray-500">Deuda Total</p>
            <p className={`text-lg sm:text-2xl font-bold ${debtStatus.color}`}>
              {formatCurrency(debtInfo.totalDebt)}
            </p>
            <p className="text-xs text-gray-400 mt-1">{debtStatus.message}</p>
          </div>
        </div>
      </div>

      {/* Ventas Pendientes */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-300">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
            <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-gray-500">Ventas Pendientes</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">
              {debtInfo.pendingVentasCount}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {debtInfo.pendingVentasCount === 0 ? 'Todas al día' : 
               debtInfo.pendingVentasCount === 1 ? 'venta pendiente' : 'ventas pendientes'}
            </p>
          </div>
        </div>
      </div>

      {/* Promedio por Venta Pendiente */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-300 md:col-span-2 lg:col-span-1">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
            <StatusIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-gray-500">Promedio por Venta</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">
              {debtInfo.pendingVentasCount > 0 
                ? formatCurrency(debtInfo.totalDebt / debtInfo.pendingVentasCount)
                : formatCurrency(0)
              }
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {debtInfo.pendingVentasCount > 0 ? 'deuda promedio' : 'sin ventas pendientes'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CobroResumen;
