import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

const BulkUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const { getToken } = useAuth();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [templateStats, setTemplateStats] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const handleClose = () => {
    setFile(null);
    setResults(null);
    setError('');
    setTemplateStats(null);
    onClose();
  };

  // Descargar plantilla pre-poblada
  const handleDownloadTemplate = async () => {
    setDownloading(true);
    setError('');

    try {
      const token = await getToken();
      const response = await axios.get(`${backendUrl}/api/productos/bulk-upload/export-template`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Extraer stats del header si están disponibles
      const statsHeader = response.headers['x-template-stats'];
      if (statsHeader) {
        try {
          setTemplateStats(JSON.parse(statsHeader));
        } catch (e) {
          console.log('No se pudieron parsear las stats del template');
        }
      }

      // Crear link de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `productos_disponibles_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Mostrar mensaje de éxito
      setError('');

    } catch (err) {
      console.error('Error al descargar plantilla:', err);
      setError(err.response?.data?.message || 'Error al descargar la plantilla');
    } finally {
      setDownloading(false);
    }
  };

  // Validar y establecer archivo
  const validateAndSetFile = (selectedFile) => {
    setError('');

    const validExtensions = ['.xlsx', '.xls'];
    const fileName = selectedFile.name.toLowerCase();
    const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidExtension) {
      setError('Solo se permiten archivos Excel (.xlsx, .xls)');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (selectedFile.size > maxSize) {
      setError('El archivo excede el tamaño máximo de 5MB');
      return;
    }

    setFile(selectedFile);
    setResults(null);
  };

  // Manejar selección de archivo
  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  // Drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  // Subir archivo
  const handleUpload = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setUploading(true);
    setError('');
    setResults(null);

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${backendUrl}/api/productos/bulk-upload/import`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setResults(response.data.results);

      if (response.data.results.summary.created > 0) {
        onSuccess && onSuccess();
      }

    } catch (err) {
      console.error('Error al subir archivo:', err);
      setError(err.response?.data?.message || 'Error al procesar el archivo');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="text-green-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Importar Productos Masivamente
              </h2>
              <p className="text-sm text-gray-600">
                Sistema mejorado con IDs pre-configurados
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Instrucciones mejoradas */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
            <div className="flex items-start gap-3 mb-4">
              <Info className="text-blue-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-blue-900 mb-2 text-lg">
                  ✨ Nuevo Proceso Mejorado - Sin Errores
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  Este sistema genera un Excel <strong>pre-poblado</strong> con todos los productos
                  disponibles y sus IDs correctos. ¡Solo llena precio y cantidad!
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900">📥 Paso 1: Descargar</h4>
                <ul className="space-y-1 pl-4">
                  <li>• Click en "Descargar Excel Pre-poblado"</li>
                  <li>• El Excel tiene TODAS las combinaciones disponibles</li>
                  <li>• Categorías y productos con IDs correctos</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900">✏️ Paso 2: Completar</h4>
                <ul className="space-y-1 pl-4">
                  <li>• Llena columnas: <strong>PRECIO</strong> y <strong>CANTIDAD</strong></li>
                  <li>• ELIMINA las filas que NO quieras agregar</li>
                  <li>• NO modifiques los IDs ni nombres</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900">📤 Paso 3: Importar</h4>
                <ul className="space-y-1 pl-4">
                  <li>• Guarda el archivo Excel</li>
                  <li>• Súbelo arrastrando o seleccionando</li>
                  <li>• El sistema valida y crea productos</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900">✅ Ventajas</h4>
                <ul className="space-y-1 pl-4">
                  <li>• ✅ Cero errores de tipeo</li>
                  <li>• ✅ IDs correctos garantizados</li>
                  <li>• ✅ Solo llenar precio y cantidad</li>
                </ul>
              </div>
            </div>

            {templateStats && (
              <div className="mt-4 p-3 bg-blue-100 rounded-lg text-sm">
                <p className="text-blue-900">
                  <strong>Última plantilla generada:</strong> {templateStats.combinacionesDisponibles} combinaciones disponibles
                  ({templateStats.categorias} categorías × {templateStats.catalogoProductos} productos)
                </p>
              </div>
            )}

            <button
              onClick={handleDownloadTemplate}
              disabled={downloading}
              className={`
                mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg
                font-semibold transition-all transform hover:scale-105
                ${downloading
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg'
                }
              `}
            >
              {downloading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando Excel...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Descargar Excel Pre-poblado (Paso 1)
                </>
              )}
            </button>
          </div>

          {/* Área de subida */}
          {!results && (
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-all
                ${dragActive
                  ? 'border-blue-500 bg-blue-50 scale-105'
                  : 'border-gray-300 hover:border-gray-400'
                }
                ${file ? 'bg-green-50 border-green-500' : ''}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />

              <Upload
                size={56}
                className={`mx-auto mb-4 ${file ? 'text-green-600' : 'text-gray-400'}`}
              />

              {file ? (
                <div className="space-y-3">
                  <p className="text-xl font-bold text-green-700">
                    ✓ Archivo Listo para Importar
                  </p>
                  <div className="bg-white rounded-lg p-3 inline-block">
                    <p className="text-sm font-medium text-gray-800">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="mt-3 text-sm text-red-600 hover:text-red-700 underline font-medium"
                  >
                    Cambiar archivo
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xl font-semibold text-gray-700">
                    Arrastra el Excel completado aquí
                  </p>
                  <p className="text-sm text-gray-500">
                    o haz click para seleccionar el archivo
                  </p>
                  <p className="text-xs text-gray-400 mt-3">
                    Formatos aceptados: .xlsx, .xls (máx. 5MB)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Mensajes de error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="text-red-600 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Resultados */}
          {results && (
            <div className="space-y-4">
              {/* Resumen */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center transform hover:scale-105 transition-transform">
                  <CheckCircle className="text-green-600 mx-auto mb-2" size={28} />
                  <p className="text-3xl font-bold text-green-700">
                    {results.summary.created}
                  </p>
                  <p className="text-sm font-medium text-green-600">Creados</p>
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 text-center transform hover:scale-105 transition-transform">
                  <AlertCircle className="text-yellow-600 mx-auto mb-2" size={28} />
                  <p className="text-3xl font-bold text-yellow-700">
                    {results.summary.skipped}
                  </p>
                  <p className="text-sm font-medium text-yellow-600">Omitidos</p>
                </div>

                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center transform hover:scale-105 transition-transform">
                  <XCircle className="text-red-600 mx-auto mb-2" size={28} />
                  <p className="text-3xl font-bold text-red-700">
                    {results.summary.failed}
                  </p>
                  <p className="text-sm font-medium text-red-600">Fallidos</p>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center transform hover:scale-105 transition-transform">
                  <FileSpreadsheet className="text-blue-600 mx-auto mb-2" size={28} />
                  <p className="text-3xl font-bold text-blue-700">
                    {results.totalRows}
                  </p>
                  <p className="text-sm font-medium text-blue-600">Total</p>
                </div>
              </div>

              {/* Detalles de productos creados */}
              {results.created.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle size={18} />
                    Productos Creados Exitosamente ({results.created.length})
                  </h3>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {results.created.map((item, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">
                              <span className="text-green-600 font-bold">{item.codigo}</span> - {item.nombre}
                            </p>
                            <p className="text-sm text-gray-600">
                              {item.categoria} • S/ {item.precio.toFixed(2)} • {item.cantidad} unidades
                            </p>
                          </div>
                          <CheckCircle className="text-green-500" size={20} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filas omitidas */}
              {results.skipped.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                    <AlertCircle size={18} />
                    Filas Omitidas ({results.skipped.length})
                  </h3>
                  <p className="text-sm text-yellow-700 mb-3">
                    Estas filas no tenían precio o cantidad completados
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {results.skipped.map((item, index) => (
                      <div key={index} className="text-sm text-yellow-800 bg-white p-2 rounded">
                        Fila {item.row}: <span className="font-medium">{item.codigo}</span> - {item.nombre}
                        <p className="text-xs text-yellow-600 mt-1">{item.razon}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errores */}
              {results.failed.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <XCircle size={18} />
                    Errores Encontrados ({results.failed.length})
                  </h3>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {results.failed.map((item, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border-l-4 border-red-500">
                        <p className="font-medium text-red-800">
                          Fila {item.row}
                          {item.data && (
                            <span className="ml-2">
                              {item.data.codigo || item.data.nombre || 'Sin identificar'}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-red-600 mt-1">{item.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <button
            onClick={handleClose}
            className="px-5 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            {results ? 'Cerrar' : 'Cancelar'}
          </button>

          {!results && (
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className={`
                px-6 py-3 rounded-lg font-semibold transition-all transform
                ${!file || uploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:scale-105 shadow-lg'
                }
              `}
            >
              {uploading ? (
                <>
                  <svg className="animate-spin inline-block mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="inline-block mr-2" size={20} />
                  Importar Productos (Paso 3)
                </>
              )}
            </button>
          )}

          {results && results.summary.created > 0 && (
            <button
              onClick={() => {
                setFile(null);
                setResults(null);
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold transform hover:scale-105 shadow-lg"
            >
              Importar Otro Archivo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
