import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const DashboardCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'blue',
  children,
  loading = false,
  error = null,
  expandable = true,
  isExpanded = false,
  onExpandToggle = null
}) => {
  // Usar estado interno solo si no se proporciona control externo
  const [internalExpanded, setInternalExpanded] = useState(false);
  
  // Determinar si usar estado interno o externo
  const expanded = onExpandToggle ? isExpanded : internalExpanded;
  const handleToggle = onExpandToggle || (() => setInternalExpanded(!internalExpanded));

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-600',
      valueText: 'text-blue-800',
      iconText: 'text-blue-500'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-600',
      valueText: 'text-green-800',
      iconText: 'text-green-500'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-600',
      valueText: 'text-purple-800',
      iconText: 'text-purple-500'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-600',
      valueText: 'text-yellow-800',
      iconText: 'text-yellow-500'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-600',
      valueText: 'text-red-800',
      iconText: 'text-red-500'
    }
  };

  const currentColor = colorClasses[color] || colorClasses.blue;

  if (loading) {
    return (
      <div className={`${currentColor.bg} ${currentColor.border} border rounded-lg p-6`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-8 w-8 bg-gray-300 rounded"></div>
          </div>
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-500 mr-3 text-2xl">⚠️</div>
          <div>
            <h3 className="text-red-800 font-medium">{title}</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${currentColor.bg} ${currentColor.border} border rounded-lg transition-all duration-300 ${expanded ? 'shadow-lg scale-105' : 'shadow hover:shadow-md'}`}>
      {/* Header - siempre visible */}
      <div 
        className={`p-6 ${expandable ? 'cursor-pointer hover:bg-opacity-80' : ''} transition-all duration-200`}
        onClick={() => expandable && handleToggle()}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`${currentColor.text} text-sm font-medium flex items-center gap-2`}>
                {title}
                {expandable && (
                  <span className={`${currentColor.text} text-xs bg-white px-2 py-1 rounded-full opacity-70`}>
                    {expanded ? 'Ocultar' : 'Ver más'}
                  </span>
                )}
              </h3>
              {expandable && (
                <button className={`${currentColor.iconText} hover:opacity-70 transition-all duration-200 hover:scale-110`}>
                  {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              )}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className={`${currentColor.valueText} text-3xl font-bold transition-all duration-300`}>
                  {value}
                </p>
                {subtitle && (
                  <p className={`${currentColor.text} text-sm mt-1 transition-all duration-300`}>
                    {subtitle}
                  </p>
                )}
              </div>
              {icon && (
                <div className={`${currentColor.iconText} text-4xl ml-4 transition-transform duration-300 ${expandable ? 'hover:scale-110' : ''}`}>
                  {icon}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido expandible */}
      {expanded && children && (
        <div className="border-t border-gray-200 bg-white rounded-b-lg animate-fadeIn">
          <div className="p-6">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
