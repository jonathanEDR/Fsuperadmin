import React from 'react';
import { Home, UserCircle, FileText, Settings, LogOut, Package } from 'lucide-react';

function Sidebar({ currentView, onViewChange, onLogout }) {  const menuItems = [
    { id: 'notes', icon: FileText, label: 'Mis Notas' },
    { id: 'productos', icon: Package, label: 'Gestión de Productos' },
    { id: 'profile', icon: UserCircle, label: 'Mi Perfil' },
  ];

  return (
    <div className="w-64 bg-white h-screen fixed left-0 top-0 shadow-lg">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Panel de Usuario</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-blue-50 text-blue-600'
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
      
      {/* Separador */}
      <div className="border-t border-gray-200 my-4"></div>
      
      {/* Botón de cerrar sesión */}
      <div className="p-6">
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

export default Sidebar;
