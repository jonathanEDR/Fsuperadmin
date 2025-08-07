import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import FinanzasLayout from './common/FinanzasLayout';

const AccesosRapidosFinanzasSimple = () => {
    const location = useLocation();

    // Configuración de accesos rápidos
    const accesos = [
        {
            label: 'Dashboard Financiero',
            to: '',
            icon: '📊',
            color: 'bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-800 border-blue-200',
            description: 'Resumen financiero general'
        },
        {
            label: 'Movimientos de Caja',
            to: 'movimientos-caja',
            icon: '💸',
            color: 'bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 text-emerald-800 border-emerald-200',
            description: 'Control de ingresos y egresos'
        },
        {
            label: 'Cuentas Bancarias',
            to: 'cuentas-bancarias',
            icon: '🏦',
            color: 'bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-800 border-green-200',
            description: 'Gestionar cuentas bancarias'
        },
        {
            label: 'Gestión de Préstamos',
            to: 'prestamos',
            icon: '💰',
            color: 'bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 text-yellow-800 border-yellow-200',
            description: 'Administrar préstamos'
        },
        {
            label: 'Garantías',
            to: 'garantias',
            icon: '🛡️',
            color: 'bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-800 border-purple-200',
            description: 'Gestionar garantías'
        },
        {
            label: 'Pagos Financiamiento',
            to: 'pagos-financiamiento',
            icon: '💳',
            color: 'bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 text-indigo-800 border-indigo-200',
            description: 'Pagos y financiamiento'
        }
    ];

    // Determinar ruta base - DEBE incluir el prefijo del dashboard actual
    const currentPath = location.pathname;
    
    // Detectar si estamos en super-admin o admin
    const baseRoute = currentPath.includes('/super-admin') 
        ? '/super-admin/finanzas' 
        : currentPath.includes('/admin')
        ? '/admin/finanzas'
        : '/finanzas'; // fallback

    return (
        <FinanzasLayout 
            currentModule="dashboard"
            title="Dashboard Financiero"
            loading={false}
            showStats={false}
        >
            {/* Accesos Rápidos */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Accesos Rápidos</h2>
                    <div className="text-sm text-gray-500">
                        <i className="fas fa-chart-line mr-2"></i>
                        Dashboard Financiero
                        <br />
                        <span className="text-xs text-blue-600">Ruta base: {baseRoute}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accesos.map((acceso, index) => {
                        const fullPath = acceso.to ? `${baseRoute}/${acceso.to}` : baseRoute;
                        const isActive = currentPath === fullPath || 
                                        (acceso.to === '' && currentPath.endsWith('/finanzas'));

                        console.log('🔗 Ruta generada:', fullPath, 'Ruta actual:', currentPath, 'Activo:', isActive);

                        return (
                            <Link
                                key={index}
                                to={fullPath}
                                className={`group block p-6 border border-gray-200 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 transform ${acceso.color} ${
                                    isActive ? 'ring-2 ring-blue-500 shadow-lg' : ''
                                }`}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="text-3xl">
                                        {acceso.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold group-hover:text-opacity-90">
                                            {acceso.label}
                                        </h3>
                                        <p className="text-sm opacity-75 group-hover:opacity-90">
                                            {acceso.description}
                                        </p>
                                    </div>
                                    <div className="text-xl opacity-50 group-hover:opacity-75 transition-opacity">
                                        <i className="fas fa-arrow-right"></i>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Información adicional */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        <i className="fas fa-info-circle text-blue-500 mr-2"></i>
                        Información del Sistema
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Última actualización:</strong> {new Date().toLocaleString()}</p>
                        <p><strong>Usuario activo:</strong> Sistema</p>
                        <p><strong>Módulos disponibles:</strong> {accesos.length}</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        <i className="fas fa-chart-bar text-green-500 mr-2"></i>
                        Estado del Sistema
                    </h3>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Conexión:</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></span>
                                Activa
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Estado:</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Operativo
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </FinanzasLayout>
    );
};

export default AccesosRapidosFinanzasSimple;
