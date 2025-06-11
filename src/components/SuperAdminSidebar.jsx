import React from 'react';
import { Home, FileText, UserCog, LogOut, Shield, History, Package } from 'lucide-react';

function SuperAdminSidebar({ currentView, onViewChange, onLogout }) {
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Gestión de Usuarios' },
    { id: 'productos', icon: Package, label: 'Gestión de Productos' },
    { id: 'notes', icon: FileText, label: 'Gestión de Notas' },
    { id: 'history', icon: History, label: 'Historial' },
    { id: 'profile', icon: UserCog, label: 'Mi Perfil' },
  ];

  return (
    <div className="w-64 bg-white h-screen fixed left-0 top-0 shadow-lg">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Shield className="text-purple-600" size={24} />
          Panel Super Admin
        </h2>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-purple-50 text-purple-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}

export default SuperAdminSidebar;
