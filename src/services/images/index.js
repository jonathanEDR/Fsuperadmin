// services/images/index.js
export { default as imageService, ImageService } from './imageService';

// Configuración de carpetas disponibles para organizar imágenes
export const IMAGE_FOLDERS = {
  PRODUCTOS: 'productos',
  CATALOGO: 'catalogo-productos',
  SUCURSALES: 'sucursales',
  USUARIOS: 'usuarios',
  GENERAL: 'general',
};

// Tipos de imagen permitidos
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Configuración por defecto
export const IMAGE_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 10,
  allowedTypes: ALLOWED_IMAGE_TYPES,
};
