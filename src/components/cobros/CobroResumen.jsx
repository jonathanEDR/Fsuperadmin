import React from 'react';
import { Wallet, Receipt } from 'lucide-react';

const CobroResumen = ({ debtInfo }) => {
  if (!debtInfo) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Wallet className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Deuda Total</p>
            <p className="text-2xl font-bold text-gray-900">
              S/. {debtInfo.totalDebt.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Receipt className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Ventas Pendientes</p>
            <p className="text-2xl font-bold text-gray-900">
              {debtInfo.pendingVentasCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CobroResumen;
