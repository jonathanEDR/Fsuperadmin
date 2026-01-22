import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  ListChecks,
  ShoppingBag,
  RefreshCw,
  QrCode,
  UserCircle,
  ArrowRight,
  Clock,
  TrendingUp
} from 'lucide-react';

const UserHomePage = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  // Obtener saludo según la hora del día
  const obtenerSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Módulos disponibles para el usuario
  const modulos = [
    {
      id: 'tareas',
      titulo: 'Mis Tareas',
      descripcion: 'Gestiona tus tareas y actividades pendientes',
      icono: ListChecks,
      ruta: '/user/tareas',
      color: 'bg-blue-500',
      colorHover: 'hover:bg-blue-600',
      colorLight: 'bg-blue-50',
      colorText: 'text-blue-600'
    },
    {
      id: 'ventas',
      titulo: 'Mis Ventas',
      descripcion: 'Registra y consulta tus ventas',
      icono: ShoppingBag,
      ruta: '/user/ventas',
      color: 'bg-green-500',
      colorHover: 'hover:bg-green-600',
      colorLight: 'bg-green-50',
      colorText: 'text-green-600'
    },
    {
      id: 'produccion',
      titulo: 'Movimientos Producción',
      descripcion: 'Control de inventario y movimientos',
      icono: RefreshCw,
      ruta: '/user/produccion/movimientos',
      color: 'bg-purple-500',
      colorHover: 'hover:bg-purple-600',
      colorLight: 'bg-purple-50',
      colorText: 'text-purple-600',
      badge: 'NUEVO'
    },
    {
      id: 'asistencia',
      titulo: 'Registro de Asistencia',
      descripcion: 'Escanea tu código QR de asistencia',
      icono: QrCode,
      ruta: '/user/escaner-qr',
      color: 'bg-teal-500',
      colorHover: 'hover:bg-teal-600',
      colorLight: 'bg-teal-50',
      colorText: 'text-teal-600',
      badge: 'NUEVO'
    },
    {
      id: 'perfil',
      titulo: 'Mi Perfil',
      descripcion: 'Configura tu información personal',
      icono: UserCircle,
      ruta: '/user/perfil',
      color: 'bg-gray-500',
      colorHover: 'hover:bg-gray-600',
      colorLight: 'bg-gray-50',
      colorText: 'text-gray-600'
    }
  ];

  // Obtener fecha actual formateada
  const fechaActual = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Header de bienvenida */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {obtenerSaludo()}, {user?.firstName || 'Usuario'}
            </h1>
            <p className="text-blue-100 flex items-center gap-2">
              <Clock size={16} />
              {fechaActual.charAt(0).toUpperCase() + fechaActual.slice(1)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <TrendingUp size={24} className="mx-auto mb-1" />
              <p className="text-sm text-blue-100">Panel de Usuario</p>
            </div>
          </div>
        </div>
      </div>

      {/* Título de sección */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">
          Accesos Rápidos
        </h2>
        <p className="text-gray-500 text-sm">
          Selecciona un módulo para comenzar a trabajar
        </p>
      </div>

      {/* Grid de módulos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {modulos.map((modulo) => {
          const Icono = modulo.icono;
          return (
            <div
              key={modulo.id}
              onClick={() => navigate(modulo.ruta)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden border border-gray-100"
            >
              {/* Cabecera con icono */}
              <div className={`${modulo.colorLight} p-4 relative`}>
                <div className="flex items-center justify-between">
                  <div className={`${modulo.color} p-3 rounded-xl shadow-md`}>
                    <Icono size={24} className="text-white" />
                  </div>
                  {modulo.badge && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      {modulo.badge}
                    </span>
                  )}
                </div>
              </div>

              {/* Contenido */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                  {modulo.titulo}
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  {modulo.descripcion}
                </p>

                {/* Botón de acción */}
                <div className={`flex items-center ${modulo.colorText} font-medium text-sm group-hover:gap-2 transition-all`}>
                  <span>Ir al módulo</span>
                  <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sección de ayuda */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">
              ¿Necesitas ayuda?
            </h3>
            <p className="text-gray-500 text-sm">
              Si tienes dudas sobre cómo usar algún módulo, contacta a tu supervisor o administrador.
            </p>
          </div>
          <button
            onClick={() => navigate('/user/perfil')}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap"
          >
            Ver mi perfil
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserHomePage;
