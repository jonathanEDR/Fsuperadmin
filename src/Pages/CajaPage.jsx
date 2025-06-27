import React from 'react';
import Caja from '../components/Caja/Caja';

function CajaPage() {
  return (
    <div className="space-y-8">
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 rounded-lg">
            <span role="img" aria-label="Caja" className="text-purple-600 text-2xl">💰</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Gestión de Caja</h3>
            <p className="text-sm text-gray-600">
              Administra los ingresos, egresos y movimientos de caja del sistema
            </p>
          </div>
        </div>
        <Caja />
      </div>
    </div>
  );
}

export default CajaPage;
