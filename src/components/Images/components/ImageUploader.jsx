// components/Images/components/ImageUploader.jsx
import React, { useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Componente de carga de imágenes con drag & drop
 */
const ImageUploader = ({
  onFilesSelected,
  previews = [],
  onRemovePreview,
  uploading = false,
  uploadProgress = 0,
  error = null,
  multiple = true,
  maxFiles = 10,
  accept = 'image/jpeg,image/png,image/gif,image/webp',
  disabled = false,
  className = '',
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input para permitir seleccionar el mismo archivo
    e.target.value = '';
  };

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  }, [disabled, uploading]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || uploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
  }, [disabled, uploading, onFilesSelected]);

  return (
    <div className={`w-full ${className}`}>
      {/* Área de drop */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
          }
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || uploading}
        />

        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <>
              <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
              <p className="text-sm text-gray-600">Subiendo... {uploadProgress}%</p>
              <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400" />
              <div>
                <p className="text-base font-medium text-gray-700">
                  {isDragging ? 'Suelta las imágenes aquí' : 'Arrastra imágenes aquí'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  o haz clic para seleccionar
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {multiple ? `Máximo ${maxFiles} archivos` : '1 archivo'} • PNG, JPG, GIF, WebP • Máx 5MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Previews */}
      {previews.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Archivos seleccionados ({previews.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white"
              >
                <div className="aspect-square">
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Overlay con info */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200">
                  {/* Botón eliminar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemovePreview(index);
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Info del archivo */}
                <div className="p-2 bg-white border-t border-gray-100">
                  <p className="text-xs text-gray-600 truncate" title={preview.name}>
                    {preview.name}
                  </p>
                  <p className="text-xs text-gray-400">{preview.size}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

ImageUploader.propTypes = {
  onFilesSelected: PropTypes.func.isRequired,
  previews: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      size: PropTypes.string,
    })
  ),
  onRemovePreview: PropTypes.func,
  uploading: PropTypes.bool,
  uploadProgress: PropTypes.number,
  error: PropTypes.string,
  multiple: PropTypes.bool,
  maxFiles: PropTypes.number,
  accept: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default ImageUploader;
