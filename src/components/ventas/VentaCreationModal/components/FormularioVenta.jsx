import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Search, UserPlus, ChevronDown, X, AlertCircle, Lightbulb, Info, Loader2 } from 'lucide-react';

// Avatar component with real photo support
const AvatarColab = ({ nombre, avatarUrl, size = 'md' }) => {
  const [err, setErr] = React.useState(false);
  const sizes = { sm: 'w-6 h-6 text-[9px]', md: 'w-8 h-8 text-xs', lg: 'w-14 h-14 text-xl' };
  const sz = sizes[size] || sizes.md;
  if (avatarUrl && !err) {
    return (
      <img
        src={avatarUrl}
        alt={nombre}
        className={`${sz} rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm`}
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center font-bold text-white flex-shrink-0 shadow-sm`}>
      {(nombre || '?').charAt(0).toUpperCase()}
    </div>
  );
};

/**
 * FormularioVenta - Formulario simplificado para selección de cliente
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.formData - Datos del formulario
 * @param {Function} props.onFormChange - Callback para cambios en el formulario
 * @param {Array} props.usuarios - Lista de usuarios disponibles
 * @param {boolean} props.loadingUsuarios - Estado de carga de usuarios
 * @param {string} props.userRole - Rol del usuario actual (user, admin, super_admin)
 * @param {string} props.currentUserName - Nombre del usuario actual
 * @param {Object} props.errores - Objeto con errores de validación
 * 
 * @example
 * <FormularioVenta
 *   formData={ventaData}
 *   onFormChange={handleChange}
 *   usuarios={clientesData}
 *   loadingUsuarios={false}
 *   userRole="user"
 *   currentUserName="Juan Pérez"
 *   errores={{}}
 * />
 */
const FormularioVenta = React.memo(({
  formData = {},
  onFormChange,
  usuarios = [],
  loadingUsuarios = false,
  userRole = 'user',
  currentUserName = 'Usuario',
  errores = {}
}) => {
  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showClienteNombre, setShowClienteNombre] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar usuarios según búsqueda
  const usuariosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return usuarios;
    
    const search = searchTerm.toLowerCase();
    return usuarios.filter(u => 
      u.name?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search)
    );
  }, [usuarios, searchTerm]);

  // Obtener usuario seleccionado
  const usuarioSeleccionado = useMemo(() => {
    if (!formData.targetUserId) return null;
    if (formData.targetUserId === 'sin-registro') {
      return { id: 'sin-registro', name: 'Cliente Sin Registro', email: 'sin-registro@sistema.local' };
    }
    return usuarios.find(u => u.id === formData.targetUserId);
  }, [formData.targetUserId, usuarios]);

  const handleSelectCliente = (clienteId) => {
    // Actualizar cliente seleccionado
    onFormChange({ ...formData, targetUserId: clienteId });
    
    // Si selecciona "sin-registro", mostrar campo de nombre
    if (clienteId === 'sin-registro') {
      setShowClienteNombre(true);
    } else {
      setShowClienteNombre(false);
      // Limpiar clienteNombre si había uno
      if (formData.clienteNombre) {
        onFormChange({ ...formData, targetUserId: clienteId, clienteNombre: '' });
      }
    }
    
    // Cerrar dropdown y limpiar búsqueda
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    onFormChange({ ...formData, targetUserId: '', clienteNombre: '' });
    setShowClienteNombre(false);
    setSearchTerm('');
  };

  // Determinar si debe mostrar el selector de clientes
  const mostrarSelectorClientes = userRole !== 'user';

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Cliente - Mostrar selector solo para admin/super_admin */}
      {mostrarSelectorClientes ? (
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            <User size={14} className="sm:w-4 sm:h-4 inline mr-1" />
            Cliente *
          </label>
          
          {loadingUsuarios ? (
            <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-gray-50 rounded-xl">
              <Loader2 size={14} className="sm:w-4 sm:h-4 animate-spin text-purple-600" />
              <span className="text-xs sm:text-sm text-gray-600">Cargando clientes...</span>
            </div>
          ) : (
          <div ref={dropdownRef} className="relative">
            {/* Input de búsqueda / Mostrar selección */}
            <div className={`relative flex items-center border rounded-xl ${
              errores.targetUserId ? 'border-red-500 bg-red-50' : 'border-gray-200'
            }`}>
              <Search size={16} className="sm:w-[18px] sm:h-[18px] absolute left-2.5 sm:left-3 text-gray-400 pointer-events-none" />
              
              <input
                type="text"
                placeholder={usuarioSeleccionado ? usuarioSeleccionado.name : "Buscar cliente..."}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                className={`w-full pl-8 sm:pl-10 pr-16 sm:pr-20 py-2 sm:py-2.5 text-sm sm:text-base bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-xl ${
                  usuarioSeleccionado ? 'font-medium text-gray-700' : 'text-gray-500'
                }`}
              />
              
              <div className="absolute right-1.5 sm:right-2 flex items-center gap-0.5 sm:gap-1">
                {usuarioSeleccionado && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Limpiar selección"
                  >
                    <X size={14} className="sm:w-4 sm:h-4 text-gray-500" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <ChevronDown size={16} className={`sm:w-[18px] sm:h-[18px] text-gray-500 transition-transform ${isOpen ? '' : 'rotate-180'}`} />
                </button>
              </div>
            </div>

            {/* Dropdown de opciones - Desplegado hacia arriba */}
            {isOpen && (
              <div className="absolute z-50 w-full bottom-full mb-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 sm:max-h-60 overflow-auto">
                {/* Opción especial: Cliente Sin Registro */}
                <div
                  onClick={() => handleSelectCliente('sin-registro')}
                  className={`px-3 py-2 sm:px-4 sm:py-3 cursor-pointer transition-colors border-b border-gray-100 ${
                    formData.targetUserId === 'sin-registro'
                      ? 'bg-yellow-50 border-l-4 border-l-yellow-500'
                      : 'hover:bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <UserPlus size={14} className="sm:w-4 sm:h-4 text-yellow-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-medium text-gray-900 truncate">Cliente Sin Registro</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">Venta directa sin cliente registrado</p>
                    </div>
                  </div>
                </div>

                {/* Lista de clientes */}
                {usuariosFiltrados.length > 0 ? (
                  usuariosFiltrados.map((usuario) => (
                    <div
                      key={usuario.id}
                      onClick={() => handleSelectCliente(usuario.id)}
                      className={`px-3 py-2 sm:px-4 sm:py-2.5 cursor-pointer transition-colors ${
                        formData.targetUserId === usuario.id
                          ? 'bg-purple-50 border-l-4 border-l-purple-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <AvatarColab
                          nombre={usuario.name}
                          avatarUrl={usuario.avatar_url}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{usuario.name}</p>
                          {usuario.email && (
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate">{usuario.email}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2.5 sm:px-4 sm:py-3 text-center text-gray-500">
                    <Search size={18} className="sm:w-5 sm:h-5 mx-auto mb-1 text-gray-400" />
                    <p className="text-xs sm:text-sm">No se encontraron clientes</p>
                    {searchTerm && (
                      <p className="text-[10px] sm:text-xs mt-1">Busca: "{searchTerm}"</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          )}
          
          {errores.targetUserId && (
            <p className="text-red-500 text-[10px] sm:text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errores.targetUserId}</p>
          )}

          {/* Campo adicional: Nombre del cliente cuando es "sin-registro" */}
          {showClienteNombre && formData.targetUserId === 'sin-registro' && (
            <div className="mt-2.5 sm:mt-3 p-2.5 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-xl animate-fadeIn">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                <UserPlus size={14} className="sm:w-4 sm:h-4 inline mr-1" />
                Nombre del Cliente (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez, Cliente mostrador, etc."
                value={formData.clienteNombre || ''}
                onChange={(e) => onFormChange({ ...formData, clienteNombre: e.target.value })}
                className="w-full px-2.5 py-2 sm:px-3 sm:py-2 text-sm sm:text-base border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-[10px] sm:text-xs text-yellow-700 mt-1 flex items-center gap-1">
                <Lightbulb size={10} className="text-amber-500" /> Este campo te ayudará a identificar esta venta posteriormente
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Vista simplificada para usuarios normales - Solo muestra su nombre */
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <User size={18} className="sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-purple-600 font-medium">Comprando para:</p>
              <p className="text-sm sm:text-base font-bold text-purple-900">{currentUserName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Información sobre el proceso de pago */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 sm:p-3">
        <p className="text-purple-800 text-xs sm:text-sm flex items-start gap-1.5">
          <Info size={14} className="text-purple-500 flex-shrink-0 mt-0.5" />
          <span><strong>Nota:</strong> La venta se creará con estado <strong>"Pendiente"</strong>.
          {userRole === 'user' 
            ? ' El administrador gestionará el pago posteriormente.' 
            : ' El pago se gestionará posteriormente desde el módulo de Cobros.'}</span>
        </p>
      </div>

      {/* Resumen de validación */}
      {Object.keys(errores).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 sm:p-3">
          <p className="text-red-700 text-xs sm:text-sm font-medium flex items-center gap-1">
            <AlertCircle size={12} /> Por favor corrige los errores antes de continuar
          </p>
        </div>
      )}
    </div>
  );
});

FormularioVenta.displayName = 'FormularioVenta';

export default FormularioVenta;
