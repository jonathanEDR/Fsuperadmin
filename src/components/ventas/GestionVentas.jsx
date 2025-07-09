import React, { useState } from 'react';
import VentasManager from './VentasManager';
import CobroList from '../cobros/CobroList';
import { ReservasCompletadas } from '../productos';

function GestionVentas({ userRole }) {
  const [tab, setTab] = useState('ventas');

  // Solo super admin y admin pueden ver los tabs de navegación
  const canViewTabs = ['super_admin', 'admin'].includes(userRole);

  return (
    <div>
      {/* Solo mostrar tabs para super admin y admin */}
      {canViewTabs && (
        <div className="flex gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-colors ${
              tab === 'ventas' 
                ? 'border-purple-600 text-purple-700 bg-purple-50' 
                : 'border-transparent text-gray-600 bg-gray-100 hover:bg-purple-50'
            }`}
            onClick={() => setTab('ventas')}
          >
            Ventas
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-colors ${
              tab === 'cobros' 
                ? 'border-purple-600 text-purple-700 bg-purple-50' 
                : 'border-transparent text-gray-600 bg-gray-100 hover:bg-purple-50'
            }`}
            onClick={() => setTab('cobros')}
          >
            Cobros
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-colors ${
              tab === 'reservas' 
                ? 'border-purple-600 text-purple-700 bg-purple-50' 
                : 'border-transparent text-gray-600 bg-gray-100 hover:bg-purple-50'
            }`}
            onClick={() => setTab('reservas')}
          >
            Reservas Completadas
          </button>
        </div>
      )}
      
      <div>
        {/* Para usuarios normales, solo mostrar ventas */}
        {!canViewTabs && <VentasManager userRole={userRole} />}
        
        {/* Para admin y super admin, mostrar según el tab seleccionado */}
        {canViewTabs && (
          <>
            {tab === 'ventas' && <VentasManager userRole={userRole} />}
            {tab === 'cobros' && <CobroList userRole={userRole} />}
            {tab === 'reservas' && <ReservasCompletadas />}
          </>
        )}
      </div>
    </div>
  );
}

export default GestionVentas;
