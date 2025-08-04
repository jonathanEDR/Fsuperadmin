import React from 'react';
import { DollarSign } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

function SubMenuFinanzas({ isCollapsed, userRole }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Solo mostrar para SuperAdmin
  if (userRole !== 'super-admin') {
    return null;
  }

  const handleClick = () => {
    navigate('/super-admin/finanzas');
  };

  const isActive = location.pathname.startsWith('/super-admin/finanzas');

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        className={`
          flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
          ${isActive 
            ? 'bg-blue-100 text-blue-600 border-r-2 border-blue-600' 
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }
        `}
        title={isCollapsed ? "Gestión de Finanzas" : ""}
      >
        <DollarSign className="h-5 w-5 flex-shrink-0" />
        {!isCollapsed && (
          <span className="ml-3 text-left">
            Gestión de Finanzas
          </span>
        )}
      </button>
    </div>
  );
}

export default SubMenuFinanzas;
