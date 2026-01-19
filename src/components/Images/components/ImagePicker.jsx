// components/Images/components/ImagePicker.jsx
import React, { useState, useCallback } from 'react';
import { X, Image as ImageIcon, Upload, Check } from 'lucide-react';
import PropTypes from 'prop-types';
import ImageUploader from './ImageUploader';
import ImageGallery from './ImageGallery';
import { useImageManager } from '../../../hooks/useImageManager';

/**
 * Componente selector de imagen reutilizable
 * Puede usarse en formularios para seleccionar/subir imágenes
 */
const ImagePicker = ({
  value = null,
  onChange,
  folder = 'general',
  label = 'Imagen',
  placeholder = 'Seleccionar imagen',
  existingImages = [],
  showUpload = true,
  showGallery = true,
  multiple = false,
  disabled = false,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(showUpload ? 'upload' : 'gallery');
  const [selectedImage, setSelectedImage] = useState(value);

  const {
    previews,
    uploading,
    uploadProgress,
    error,
    selectFiles,
    removeSelectedFile,
    uploadSelectedFiles,
    clearError,
  } = useImageManager({
    folder,
    maxFiles: multiple ? 10 : 1,
    onUploadSuccess: (result) => {
      const uploadedImage = result.data;
      handleSelectImage(uploadedImage);
      setIsModalOpen(false);
    },
  });

  const handleSelectImage = useCallback((image) => {
    setSelectedImage(image);
    if (onChange) {
      onChange(image);
    }
  }, [onChange]);

  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null);
    if (onChange) {
      onChange(null);
    }
  }, [onChange]);

  const handleConfirmSelection = useCallback(() => {
    if (selectedImage) {
      onChange && onChange(selectedImage);
      setIsModalOpen(false);
    }
  }, [selectedImage, onChange]);

  return (
    <div className={`${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Preview o Placeholder */}
      <div
        onClick={() => !disabled && setIsModalOpen(true)}
        className={`
          relative w-full h-40 border-2 border-dashed rounded-lg overflow-hidden
          transition-all duration-200 cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
          ${value ? 'border-gray-300 bg-gray-50' : 'border-gray-300 bg-gray-50'}
        `}
      >
        {value ? (
          <>
            <img
              src={value.url}
              alt="Imagen seleccionada"
              className="w-full h-full object-cover"
            />
            {/* Botón remover */}
            {!disabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ImageIcon className="w-10 h-10 mb-2" />
            <span className="text-sm">{placeholder}</span>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setIsModalOpen(false)}
            />

            {/* Modal content */}
            <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Seleccionar imagen
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              {showUpload && showGallery && (
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`
                      flex-1 px-4 py-3 text-sm font-medium transition-colors
                      ${activeTab === 'upload'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Upload className="w-4 h-4 inline-block mr-2" />
                    Subir nueva
                  </button>
                  <button
                    onClick={() => setActiveTab('gallery')}
                    className={`
                      flex-1 px-4 py-3 text-sm font-medium transition-colors
                      ${activeTab === 'gallery'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <ImageIcon className="w-4 h-4 inline-block mr-2" />
                    Galería ({existingImages.length})
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {activeTab === 'upload' && showUpload && (
                  <div>
                    <ImageUploader
                      onFilesSelected={selectFiles}
                      previews={previews}
                      onRemovePreview={removeSelectedFile}
                      uploading={uploading}
                      uploadProgress={uploadProgress}
                      error={error}
                      multiple={multiple}
                      maxFiles={multiple ? 10 : 1}
                    />

                    {previews.length > 0 && !uploading && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={uploadSelectedFiles}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Subir {previews.length > 1 ? `${previews.length} imágenes` : 'imagen'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'gallery' && showGallery && (
                  <ImageGallery
                    images={existingImages}
                    selectable={true}
                    selectedIds={selectedImage ? [selectedImage.publicId] : []}
                    onSelect={handleSelectImage}
                    showActions={false}
                    emptyMessage="No hay imágenes disponibles"
                  />
                )}
              </div>

              {/* Footer */}
              {activeTab === 'gallery' && selectedImage && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedImage.url}
                      alt="Seleccionada"
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <span className="text-sm text-gray-600">
                      Imagen seleccionada
                    </span>
                  </div>
                  <button
                    onClick={handleConfirmSelection}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Confirmar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ImagePicker.propTypes = {
  value: PropTypes.shape({
    url: PropTypes.string.isRequired,
    publicId: PropTypes.string.isRequired,
  }),
  onChange: PropTypes.func,
  folder: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  existingImages: PropTypes.array,
  showUpload: PropTypes.bool,
  showGallery: PropTypes.bool,
  multiple: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default ImagePicker;
