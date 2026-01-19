// services/images/imageService.js
import api from '../api';

/**
 * Servicio centralizado para gestión de imágenes con Cloudinary
 * Patrón: Clase con Singleton (consistente con el proyecto)
 */
class ImageService {
  constructor() {
    this.baseURL = '/api/images';
  }

  /**
   * Subir una imagen única
   * @param {File} file - Archivo de imagen
   * @param {Object} options - Opciones de subida
   * @param {string} options.folder - Carpeta en Cloudinary (productos, sucursales, usuarios, etc.)
   * @param {string} options.publicId - ID público personalizado (opcional)
   * @param {Function} onProgress - Callback de progreso (opcional)
   * @returns {Promise<Object>} - { url, publicId, width, height, format, bytes }
   */
  async uploadImage(file, options = {}, onProgress = null) {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const queryParams = new URLSearchParams();
      if (options.folder) queryParams.append('folder', options.folder);
      if (options.publicId) queryParams.append('publicId', options.publicId);

      const url = `${this.baseURL}/upload${queryParams.toString() ? `?${queryParams}` : ''}`;

      const response = await api.post(url, formData, {
        onUploadProgress: onProgress ? (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        } : undefined,
      });

      return response.data;
    } catch (error) {
      console.error('[ImageService] Error al subir imagen:', error);
      throw this._handleError(error);
    }
  }

  /**
   * Subir múltiples imágenes
   * @param {FileList|Array<File>} files - Lista de archivos
   * @param {Object} options - Opciones de subida
   * @param {Function} onProgress - Callback de progreso general
   * @returns {Promise<Object>} - { success, message, data: [...imágenes] }
   */
  async uploadMultipleImages(files, options = {}, onProgress = null) {
    try {
      const formData = new FormData();

      // Convertir FileList a Array si es necesario
      const filesArray = Array.from(files);

      filesArray.forEach((file) => {
        formData.append('images', file);
      });

      const queryParams = new URLSearchParams();
      if (options.folder) queryParams.append('folder', options.folder);

      const url = `${this.baseURL}/upload-multiple${queryParams.toString() ? `?${queryParams}` : ''}`;

      const response = await api.post(url, formData, {
        onUploadProgress: onProgress ? (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        } : undefined,
      });

      return response.data;
    } catch (error) {
      console.error('[ImageService] Error al subir múltiples imágenes:', error);
      throw this._handleError(error);
    }
  }

  /**
   * Eliminar una imagen
   * @param {string} publicId - Public ID de la imagen en Cloudinary
   * @returns {Promise<Object>} - Resultado de la eliminación
   */
  async deleteImage(publicId) {
    try {
      if (!publicId) {
        throw new Error('Public ID es requerido');
      }

      // Encodear el publicId por si tiene caracteres especiales o /
      const encodedPublicId = encodeURIComponent(publicId);
      const response = await api.delete(`${this.baseURL}/${encodedPublicId}`);
      return response.data;
    } catch (error) {
      console.error('[ImageService] Error al eliminar imagen:', error);
      throw this._handleError(error);
    }
  }

  /**
   * Eliminar múltiples imágenes
   * @param {Array<string>} publicIds - Array de Public IDs
   * @returns {Promise<Object>} - Resultado de la eliminación
   */
  async deleteMultipleImages(publicIds) {
    try {
      if (!publicIds || publicIds.length === 0) {
        throw new Error('Se requiere al menos un Public ID');
      }

      const response = await api.post(`${this.baseURL}/delete-multiple`, { publicIds });
      return response.data;
    } catch (error) {
      console.error('[ImageService] Error al eliminar imágenes:', error);
      throw this._handleError(error);
    }
  }

  /**
   * Obtener URLs optimizadas de una imagen
   * @param {string} publicId - Public ID de la imagen
   * @returns {Promise<Object>} - { publicId, urls: { thumbnail, small, medium, large, original } }
   */
  async getImageUrls(publicId) {
    try {
      if (!publicId) {
        throw new Error('Public ID es requerido');
      }

      const encodedPublicId = encodeURIComponent(publicId);
      const response = await api.get(`${this.baseURL}/url/${encodedPublicId}`);
      return response.data;
    } catch (error) {
      console.error('[ImageService] Error al obtener URLs:', error);
      throw this._handleError(error);
    }
  }

  /**
   * Validar archivo antes de subir
   * @param {File} file - Archivo a validar
   * @param {Object} options - Opciones de validación
   * @returns {Object} - { valid: boolean, error?: string }
   */
  validateFile(file, options = {}) {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB por defecto
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    } = options;

    if (!file) {
      return { valid: false, error: 'No se proporcionó ningún archivo' };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido. Permitidos: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`
      };
    }

    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return { valid: false, error: `El archivo excede el tamaño máximo de ${maxSizeMB}MB` };
    }

    return { valid: true };
  }

  /**
   * Validar múltiples archivos
   * @param {FileList|Array<File>} files - Archivos a validar
   * @param {Object} options - Opciones de validación
   * @returns {Object} - { valid: boolean, errors: [], validFiles: [] }
   */
  validateFiles(files, options = {}) {
    const { maxFiles = 10, ...fileOptions } = options;
    const filesArray = Array.from(files);
    const errors = [];
    const validFiles = [];

    if (filesArray.length > maxFiles) {
      return {
        valid: false,
        errors: [`Máximo ${maxFiles} archivos permitidos`],
        validFiles: [],
      };
    }

    filesArray.forEach((file, index) => {
      const result = this.validateFile(file, fileOptions);
      if (result.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${result.error}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      validFiles,
    };
  }

  /**
   * Crear URL de preview local para un archivo
   * @param {File} file - Archivo de imagen
   * @returns {string} - URL de blob para preview
   */
  createPreviewUrl(file) {
    return URL.createObjectURL(file);
  }

  /**
   * Revocar URL de preview (liberar memoria)
   * @param {string} url - URL de blob a revocar
   */
  revokePreviewUrl(url) {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Formatear tamaño de archivo para mostrar
   * @param {number} bytes - Tamaño en bytes
   * @returns {string} - Tamaño formateado (ej: "2.5 MB")
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Manejar errores de forma consistente
   * @private
   */
  _handleError(error) {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    return error;
  }
}

// Singleton
const imageService = new ImageService();
export default imageService;
export { ImageService };
