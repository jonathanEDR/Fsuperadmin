import React, { useState } from 'react';
import GestionPersonalOptimizado from './GestionPersonalOptimizado';
import PagosRealizados from './PagosRealizados';
import ProfileManagement from '../../Pages/ProfileManagement';

function GestionPersonal() {
  const [tab, setTab] = useState('personal');

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-colors ${tab === 'personal' ? 'border-purple-600 text-purple-700 bg-purple-50' : 'border-transparent text-gray-600 bg-gray-100 hover:bg-purple-50'}`}
          onClick={() => setTab('personal')}
        >
          Personal
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-colors ${tab === 'pagos' ? 'border-purple-600 text-purple-700 bg-purple-50' : 'border-transparent text-gray-600 bg-gray-100 hover:bg-purple-50'}`}
          onClick={() => setTab('pagos')}
        >
          Pagos Realizados
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-colors ${tab === 'colaboradores' ? 'border-purple-600 text-purple-700 bg-purple-50' : 'border-transparent text-gray-600 bg-gray-100 hover:bg-purple-50'}`}
          onClick={() => setTab('colaboradores')}
        >
          Colaboradores
        </button>
      </div>
      <div>
        {tab === 'personal' && <GestionPersonalOptimizado />}
        {tab === 'pagos' && <PagosRealizados />}
        {tab === 'colaboradores' && <ProfileManagement userRole="super_admin" />}
      </div>
    </div>
  );
}

export default GestionPersonal;
