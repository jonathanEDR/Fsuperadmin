/**
 * Funciones auxiliares para el módulo de creación de ventas
 */

/**
 * Filtra usuarios según el rol del usuario actual
 * @param {Array} users - Lista de usuarios
 * @param {string} currentRole - Rol del usuario actual (user, admin, super_admin)
 * @param {string} currentUserId - ID del usuario actual
 * @returns {Array} - Lista filtrada de usuarios
 */
export const filterUsersByRole = (users, currentRole, currentUserId) => {
  if (!users || !currentRole) {
    return [];
  }

  const filteredUsers = users.filter(user => {
    const isSelf = user.id === currentUserId;
    switch (currentRole) {
      case 'super_admin':
        return user.role !== 'super_admin' || isSelf;
      case 'admin':
       return user.role !== 'super_admin';  
      case 'user':
        return isSelf;
      default:
        return false;
    }
  });

  return filteredUsers;
};

/**
 * Obtiene la fecha/hora local en formato compatible con input datetime-local
 * @returns {string} - Fecha en formato ISO sin timezone
 */
export const getLocalDateTimeString = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

/**
 * Mapea datos de usuario del backend al formato requerido por el componente
 * @param {Array} rawUsers - Usuarios raw del backend
 * @returns {Array} - Usuarios mapeados
 */
export const mapUsuarios = (rawUsers) => {
  if (!Array.isArray(rawUsers)) {
    return [];
  }

  return rawUsers.map(u => ({
    id: u.clerk_id || u._id,
    name: u.nombre_negocio || u.email || 'Usuario sin nombre',
    email: u.email,
    role: u.role
  }));
};

/**
 * Calcula el subtotal de un producto
 * @param {number} precio - Precio unitario
 * @param {number} cantidad - Cantidad
 * @returns {number} - Subtotal
 */
export const calcularSubtotal = (precio, cantidad) => {
  return Number((precio * cantidad).toFixed(2));
};

/**
 * Calcula el subtotal total del carrito
 * @param {Array} carrito - Array de items del carrito
 * @returns {number} - Subtotal total
 */
export const calcularSubtotalCarrito = (carrito) => {
  if (!Array.isArray(carrito) || carrito.length === 0) {
    return 0;
  }
  return carrito.reduce((total, item) => total + (item.subtotal || 0), 0);
};

/**
 * Formatea un número como precio en formato local
 * @param {number} precio - Precio a formatear
 * @returns {string} - Precio formateado
 */
export const formatearPrecio = (precio) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(precio);
};
