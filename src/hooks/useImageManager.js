// hooks/useImageManager.js
import { useState, useCallback, useRef } from 'react';
import { imageService, IMAGE_CONFIG } from '../services/images';

/**
 * Hook personalizado para gestión de imágenes
 * Proporciona estado y métodos para upload, delete y preview de imágenes
 */
export const useImageManager = (options = {}) => {
  const {
    folder = 'general',
    maxFiles = IMAGE_CONFIG.maxFiles,
    maxSize = IMAGE_CONFIG.maxSize,
    allowedTypes = IMAGE_CONFIG.allowedTypes,
    onUploadSuccess = null,
    onUploadError = null,
    onDeleteSuccess = null,
    onDeleteError = null,
  } = options;

  // Estados
  const [images, setImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  // Ref para limpiar previews
  const previewUrlsRef = useRef([]);

  /**
   * Limpiar URLs de preview para liberar memoria
   */
  const clearPreviews = useCallback(() => {
    previewUrlsRef.current.forEach(url => {
      imageService.revokePreviewUrl(url);
    });
    previewUrlsRef.current = [];
    setPreviews([]);
  }, []);

  /**
   * Seleccionar archivos para subir
   * @param {FileList|Array<File>} files - Archivos seleccionados
   */
  const selectFiles = useCallback((files) => {
    setError(null);

    // Validar archivos
    const validation = imageService.validateFiles(files, {
      maxFiles,
      maxSize,
      allowedTypes,
    });

    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return { success: false, errors: validation.errors };
    }

    // Limpiar previews anteriores
    clearPreviews();

    // Crear nuevos previews
    const newPreviews = validation.validFiles.map(file => {
      const url = imageService.createPreviewUrl(file);
      previewUrlsRef.current.push(url);
      return {
        file,
        url,
        name: file.name,
        size: imageService.formatFileSize(file.size),
        type: file.type,
      };
    });

    setSelectedFiles(validation.validFiles);
    setPreviews(newPreviews);

    return { success: true, files: validation.validFiles };
  }, [maxFiles, maxSize, allowedTypes, clearPreviews]);

  /**
   * Remover un archivo de la selección
   * @param {number} index - Índice del archivo a remover
   */
  const removeSelectedFile = useCallback((index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      const removed = prev[index];
      if (removed?.url) {
        imageService.revokePreviewUrl(removed.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  /**
   * Subir los archivos seleccionados
   * @returns {Promise<Object>} - Resultado del upload
   */
  const uploadSelectedFiles = useCallback(async () => {
    if (selectedFiles.length === 0) {
      setError('No hay archivos seleccionados');
      return { success: false, error: 'No hay archivos seleccionados' };
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      let result;

      if (selectedFiles.length === 1) {
        // Subir imagen única
        result = await imageService.uploadImage(
          selectedFiles[0],
          { folder },
          (progress) => setUploadProgress(progress)
        );
      } else {
        // Subir múltiples imágenes
        result = await imageService.uploadMultipleImages(
          selectedFiles,
          { folder },
          (progress) => setUploadProgress(progress)
        );
      }

      // Agregar imágenes subidas al estado
      const uploadedImages = Array.isArray(result.data) ? result.data : [result.data];
      setImages(prev => [...prev, ...uploadedImages]);

      // Limpiar selección
      clearPreviews();
      setSelectedFiles([]);

      if (onUploadSuccess) {
        onUploadSuccess(result);
      }

      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.message || 'Error al subir las imágenes';
      setError(errorMessage);

      if (onUploadError) {
        onUploadError(err);
      }

      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFiles, folder, clearPreviews, onUploadSuccess, onUploadError]);

  /**
   * Subir archivos directamente (sin selección previa)
   * @param {FileList|Array<File>} files - Archivos a subir
   * @returns {Promise<Object>} - Resultado del upload
   */
  const uploadFiles = useCallback(async (files) => {
    const selection = selectFiles(files);
    if (!selection.success) {
      return selection;
    }

    // Esperar a que el estado se actualice y luego subir
    return new Promise((resolve) => {
      setTimeout(async () => {
        const result = await uploadSelectedFiles();
        resolve(result);
      }, 0);
    });
  }, [selectFiles, uploadSelectedFiles]);

  /**
   * Eliminar una imagen
   * @param {string} publicId - Public ID de la imagen
   */
  const deleteImage = useCallback(async (publicId) => {
    setDeleting(true);
    setError(null);

    try {
      const result = await imageService.deleteImage(publicId);

      // Remover del estado
      setImages(prev => prev.filter(img => img.publicId !== publicId));

      if (onDeleteSuccess) {
        onDeleteSuccess(result);
      }

      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.message || 'Error al eliminar la imagen';
      setError(errorMessage);

      if (onDeleteError) {
        onDeleteError(err);
      }

      return { success: false, error: errorMessage };
    } finally {
      setDeleting(false);
    }
  }, [onDeleteSuccess, onDeleteError]);

  /**
   * Eliminar múltiples imágenes
   * @param {Array<string>} publicIds - Array de Public IDs
   */
  const deleteMultipleImages = useCallback(async (publicIds) => {
    setDeleting(true);
    setError(null);

    try {
      const result = await imageService.deleteMultipleImages(publicIds);

      // Remover del estado
      setImages(prev => prev.filter(img => !publicIds.includes(img.publicId)));

      if (onDeleteSuccess) {
        onDeleteSuccess(result);
      }

      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.message || 'Error al eliminar las imágenes';
      setError(errorMessage);

      if (onDeleteError) {
        onDeleteError(err);
      }

      return { success: false, error: errorMessage };
    } finally {
      setDeleting(false);
    }
  }, [onDeleteSuccess, onDeleteError]);

  /**
   * Limpiar todo el estado
   */
  const reset = useCallback(() => {
    clearPreviews();
    setSelectedFiles([]);
    setImages([]);
    setError(null);
    setUploadProgress(0);
  }, [clearPreviews]);

  /**
   * Limpiar solo el error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Establecer imágenes externas (ej: cargadas desde la BD)
   */
  const setExternalImages = useCallback((externalImages) => {
    setImages(externalImages || []);
  }, []);

  return {
    // Estado
    images,
    selectedFiles,
    previews,
    uploading,
    deleting,
    uploadProgress,
    error,

    // Acciones
    selectFiles,
    removeSelectedFile,
    uploadSelectedFiles,
    uploadFiles,
    deleteImage,
    deleteMultipleImages,
    reset,
    clearError,
    clearPreviews,
    setExternalImages,

    // Utilidades
    validateFile: imageService.validateFile.bind(imageService),
    validateFiles: imageService.validateFiles.bind(imageService),
    formatFileSize: imageService.formatFileSize.bind(imageService),
  };
};

export default useImageManager;
