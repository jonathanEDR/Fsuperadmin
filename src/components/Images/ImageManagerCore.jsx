// components/Images/ImageManagerCore.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  RefreshCw,
  FolderOpen,
  AlertCircle,
  CheckCircle,
  Search
} from 'lucide-react';
import ImageUploader from './components/ImageUploader';
import ImageGallery from './components/ImageGallery';
import { useImageManager } from '../../hooks/useImageManager';
import { IMAGE_FOLDERS } from '../../services/images';

/**
 * Componente principal de gestión de imágenes
 * Centro de control para ver, subir y eliminar imágenes
 */
const ImageManagerCore = () => {
  // Estado de carpeta seleccionada
  const [selectedFolder, setSelectedFolder] = useState(IMAGE_FOLDERS.GENERAL);
  const [selectedImages, setSelectedImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  const {
    images,
    previews,
    uploading,
    deleting,
    uploadProgress,
    error,
    selectFiles,
    removeSelectedFile,
    uploadSelectedFiles,
    deleteImage,
    deleteMultipleImages,
    reset,
    clearError,
    setExternalImages,
  } = useImageManager({
    folder: selectedFolder,
    onUploadSuccess: (result) => {
      showToast('Imágenes subidas correctamente', 'success');
    },
    onUploadError: (err) => {
      showToast(err.message || 'Error al subir imágenes', 'error');
    },
    onDeleteSuccess: () => {
      showToast('Imagen eliminada correctamente', 'success');
      setSelectedImages([]);
    },
    onDeleteError: (err) => {
      showToast(err.message || 'Error al eliminar', 'error');
    },
  });

  // Toast helper
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Filtrar imágenes por búsqueda
  const filteredImages = images.filter(img =>
    img.publicId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle selección
  const handleToggleSelection = useCallback((image) => {
    setSelectedImages(prev => {
      const isSelected = prev.includes(image.publicId);
      if (isSelected) {
        return prev.filter(id => id !== image.publicId);
      }
      return [...prev, image.publicId];
    });
  }, []);

  // Eliminar seleccionadas
  const handleDeleteSelected = useCallback(async () => {
    if (selectedImages.length === 0) return;

    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar ${selectedImages.length} imagen(es)?`
    );

    if (confirmDelete) {
      await deleteMultipleImages(selectedImages);
    }
  }, [selectedImages, deleteMultipleImages]);

  // Eliminar individual
  const handleDeleteSingle = useCallback(async (publicId) => {
    const confirmDelete = window.confirm('¿Estás seguro de eliminar esta imagen?');
    if (confirmDelete) {
      await deleteImage(publicId);
    }
  }, [deleteImage]);

  // Cambiar carpeta
  const handleFolderChange = useCallback((folder) => {
    setSelectedFolder(folder);
    setSelectedImages([]);
    setSearchTerm('');
    // Aquí se podría cargar imágenes de la carpeta desde el backend
  }, []);

  const folderOptions = [
    { value: IMAGE_FOLDERS.GENERAL, label: 'General', icon: FolderOpen },
    { value: IMAGE_FOLDERS.PRODUCTOS, label: 'Productos', icon: FolderOpen },
    { value: IMAGE_FOLDERS.CATALOGO, label: 'Catálogo', icon: FolderOpen },
    { value: IMAGE_FOLDERS.SUCURSALES, label: 'Sucursales', icon: FolderOpen },
    { value: IMAGE_FOLDERS.USUARIOS, label: 'Usuarios', icon: FolderOpen },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ImageIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Gestión de Imágenes
                </h1>
                <p className="text-sm text-gray-500">
                  Administra las imágenes del sistema
                </p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-3">
              {selectedImages.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar ({selectedImages.length})
                </button>
              )}
              <button
                onClick={() => {
                  reset();
                  showToast('Vista actualizada', 'info');
                }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Carpetas */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Carpetas</h2>
              </div>
              <div className="p-2">
                {folderOptions.map((folder) => (
                  <button
                    key={folder.value}
                    onClick={() => handleFolderChange(folder.value)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left
                      ${selectedFolder === folder.value
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    <folder.icon className="w-5 h-5" />
                    <span className="font-medium">{folder.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">Información</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Máximo 5MB por imagen</li>
                <li>• Formatos: JPG, PNG, GIF, WebP</li>
                <li>• Máximo 10 imágenes por subida</li>
              </ul>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-gray-500" />
                  Subir imágenes
                </h2>
                <span className="text-sm text-gray-500">
                  Carpeta: <span className="font-medium">{selectedFolder}</span>
                </span>
              </div>
              <div className="p-4">
                <ImageUploader
                  onFilesSelected={selectFiles}
                  previews={previews}
                  onRemovePreview={removeSelectedFile}
                  uploading={uploading}
                  uploadProgress={uploadProgress}
                  error={error}
                  multiple={true}
                  maxFiles={10}
                />

                {previews.length > 0 && !uploading && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={uploadSelectedFiles}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                    >
                      <Upload className="w-4 h-4" />
                      Subir {previews.length} imagen{previews.length > 1 ? 'es' : ''}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Gallery Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-gray-500" />
                    Imágenes subidas
                    <span className="text-sm font-normal text-gray-500">
                      ({filteredImages.length})
                    </span>
                  </h2>

                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <ImageGallery
                  images={filteredImages}
                  onDelete={handleDeleteSingle}
                  onSelect={handleToggleSelection}
                  selectable={true}
                  selectedIds={selectedImages}
                  deleting={deleting}
                  emptyMessage="No hay imágenes en esta carpeta. ¡Sube tu primera imagen!"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-fadeIn">
          <div
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
              ${toast.type === 'success' ? 'bg-green-600 text-white' : ''}
              ${toast.type === 'error' ? 'bg-red-600 text-white' : ''}
              ${toast.type === 'info' ? 'bg-gray-800 text-white' : ''}
            `}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageManagerCore;
