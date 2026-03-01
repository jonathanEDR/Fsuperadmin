/**
 * Componente QRCodeDisplay
 * Muestra el código QR activo con opciones de descarga e impresión
 */

import React from 'react';
import { Download, Printer, XCircle, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const QRCodeDisplay = ({
  qrActivo,
  qrImageUrl,
  onDescargar,
  onImprimir,
  onDesactivar,
  onRecargar,
  loading = false
}) => {
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-8">
        <div className="flex justify-center items-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
          <span className="ml-3 text-gray-600">Cargando código QR...</span>
        </div>
      </div>
    );
  }

  if (!qrActivo || !qrImageUrl) {
    return (
      <div className="bg-white rounded-xl shadow p-8">
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No hay código QR activo
          </h3>
          <p className="text-gray-600 mb-6">
            Genera un nuevo código QR para comenzar a registrar asistencias
          </p>
          <button
            onClick={onRecargar}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <RefreshCw size={16} />
            <span>Recargar</span>
          </button>
        </div>
      </div>
    );
  }

  // Formatear fecha
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle size={32} />
            <div>
              <h2 className="text-2xl font-bold">{qrActivo.nombre}</h2>
              <p className="text-blue-100 text-sm mt-1">
                {qrActivo.sucursalNombre}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              Activo
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Columna Izquierda: Imagen QR */}
          <div className="flex flex-col items-center">
            <div className="bg-white border-4 border-gray-200 rounded-xl p-6 shadow-lg">
              <img 
                src={qrImageUrl} 
                alt="Código QR" 
                className="w-full max-w-sm"
              />
            </div>
            
            {/* Botones de acción */}
            <div className="flex flex-wrap gap-3 mt-6 w-full max-w-sm">
              <button
                onClick={onDescargar}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Download size={20} />
                <span>Descargar</span>
              </button>
              
              <button
                onClick={onImprimir}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
              >
                <Printer size={20} />
                <span>Imprimir</span>
              </button>
              
              <button
                onClick={onDesactivar}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                <XCircle size={20} />
                <span>Desactivar</span>
              </button>
            </div>
          </div>

          {/* Columna Derecha: Información */}
          <div className="space-y-6">
            
            {/* Información del QR */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información del Código
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Código:</span>
                  <span className="font-mono text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {qrActivo.codigo.substring(0, 8)}...
                  </span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Creado:</span>
                  <span className="text-gray-900 font-medium">
                    {formatearFecha(qrActivo.createdAt)}
                  </span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Creado por:</span>
                  <span className="text-gray-900 font-medium">
                    {qrActivo.createdByName}
                  </span>
                </div>
                
                {qrActivo.validoHasta && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Válido hasta:</span>
                    <span className="text-gray-900 font-medium">
                      {formatearFecha(qrActivo.validoHasta)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Estadísticas */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Estadísticas de Uso
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {qrActivo.totalEscaneos || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Escaneos</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {qrActivo.totalEntradas || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Entradas</p>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {qrActivo.totalSalidas || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Salidas</p>
                </div>
              </div>
            </div>

            {/* Configuración */}
            {qrActivo.configuracion && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Configuración
                </h3>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className={qrActivo.configuracion.requiereGeolocalizacion ? 'text-green-500' : 'text-gray-400'} />
                    <span className="text-gray-700">
                      Geolocalización {qrActivo.configuracion.requiereGeolocalizacion ? 'requerida' : 'opcional'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="text-gray-700">
                      Horario: {qrActivo.configuracion.horariosPermitidos?.horaInicio} - {qrActivo.configuracion.horariosPermitidos?.horaFin}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Notas */}
            {qrActivo.notas && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Notas
                </h3>
                <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-xl">
                  {qrActivo.notas}
                </p>
              </div>
            )}

            {/* Instrucciones */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                💡 Instrucciones de Uso
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Descarga o imprime este código QR</li>
                <li>• Colócalo en un lugar visible</li>
                <li>• Los colaboradores lo escanean para registrar entrada</li>
                <li>• El segundo escaneo del día registra su salida</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
