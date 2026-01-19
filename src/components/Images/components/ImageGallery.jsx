// components/Images/components/ImageGallery.jsx
import React, { useState } from 'react';
import { Trash2, ExternalLink, Copy, Check, ZoomIn, X } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Componente de galería de imágenes con acciones
 */
const ImageGallery = ({
  images = [],
  onDelete,
  onSelect,
  selectable = false,
  selectedIds = [],
  showActions = true,
  columns = { sm: 2, md: 3, lg: 4 },
  emptyMessage = 'No hay imágenes',
  loading = false,
  deleting = false,
}) => {
  const [copiedId, setCopiedId] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  const handleCopyUrl = async (url, publicId) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(publicId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handleOpenExternal = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const gridClasses = `grid gap-4 grid-cols-${columns.sm} sm:grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className={`grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`}>
        {images.map((image) => {
          const isSelected = selectedIds.includes(image.publicId);

          return (
            <div
              key={image.publicId}
              className={`
                relative group rounded-lg overflow-hidden border-2 bg-white shadow-sm
                transition-all duration-200
                ${selectable ? 'cursor-pointer' : ''}
                ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
              `}
              onClick={() => selectable && onSelect && onSelect(image)}
            >
              {/* Imagen */}
              <div className="aspect-square relative overflow-hidden bg-gray-100">
                <img
                  src={image.url}
                  alt={image.publicId}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Checkbox de selección */}
                {selectable && (
                  <div className="absolute top-2 left-2">
                    <div
                      className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center
                        transition-all duration-200
                        ${isSelected
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white border-gray-300 group-hover:border-gray-400'
                        }
                      `}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                )}

                {/* Overlay con acciones */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {/* Zoom */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxImage(image);
                    }}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Ver imagen"
                  >
                    <ZoomIn className="w-5 h-5 text-gray-700" />
                  </button>

                  {/* Abrir en nueva pestaña */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenExternal(image.url);
                    }}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Abrir en nueva pestaña"
                  >
                    <ExternalLink className="w-5 h-5 text-gray-700" />
                  </button>

                  {/* Copiar URL */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyUrl(image.url, image.publicId);
                    }}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Copiar URL"
                  >
                    {copiedId === image.publicId ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-700" />
                    )}
                  </button>

                  {/* Eliminar */}
                  {showActions && onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(image.publicId);
                      }}
                      disabled={deleting}
                      className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 truncate font-mono" title={image.publicId}>
                  {image.publicId.split('/').pop()}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">
                    {image.width && image.height ? `${image.width}×${image.height}` : ''}
                  </span>
                  <span className="text-xs text-gray-400 uppercase">
                    {image.format || ''}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          <img
            src={lightboxImage.url}
            alt={lightboxImage.publicId}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-lg">
            <p className="text-sm font-mono">{lightboxImage.publicId}</p>
            {lightboxImage.width && lightboxImage.height && (
              <p className="text-xs text-gray-300 text-center mt-1">
                {lightboxImage.width} × {lightboxImage.height}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

ImageGallery.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
      publicId: PropTypes.string.isRequired,
      width: PropTypes.number,
      height: PropTypes.number,
      format: PropTypes.string,
    })
  ),
  onDelete: PropTypes.func,
  onSelect: PropTypes.func,
  selectable: PropTypes.bool,
  selectedIds: PropTypes.arrayOf(PropTypes.string),
  showActions: PropTypes.bool,
  columns: PropTypes.shape({
    sm: PropTypes.number,
    md: PropTypes.number,
    lg: PropTypes.number,
  }),
  emptyMessage: PropTypes.string,
  loading: PropTypes.bool,
  deleting: PropTypes.bool,
};

export default ImageGallery;
