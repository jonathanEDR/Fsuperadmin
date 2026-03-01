import React, { useState } from 'react';
import { CreditCard, DollarSign } from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import Caja from '../Caja/Caja';
import GastoList from '../gasto/GastoList';

const GestionCaja = () => {
  const [activeTab, setActiveTab] = useState('caja');
  const userRole = useRole(); // Usar el contexto de rol

  const tabs = [
    {
      id: 'caja',
      label: 'Caja',
      icon: CreditCard,
      component: <Caja userRole={userRole} />
    }
  ];

  // Solo agregar tab de gastos para super_admin
  if (userRole === 'super_admin') {
    tabs.push({
      id: 'gastos',
      label: 'Gastos',
      icon: DollarSign,
      component: <GastoList />
    });
  }

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-xl">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestión de Caja
            </h1>
          </div>
          <p className="text-gray-600">
            Administra la caja y los gastos del sistema
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group inline-flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className={`
                      h-5 w-5 transition-colors
                      ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <activeTabData.icon className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                {activeTabData.label}
              </h2>
            </div>
            
            {/* Render the active component */}
            <div>
              {activeTabData.component}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionCaja;
