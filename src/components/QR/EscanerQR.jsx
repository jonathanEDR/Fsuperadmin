/**
 * Componente EscanerQR
 * Permite a los usuarios colaboradores escanear códigos QR para registrar asistencia
 */

import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  Clock,
  LogIn,
  LogOut,
  RefreshCw,
  XCircle,
  Loader2
} from 'lucide-react';
import { useQRScanner } from '../../hooks/useQRScanner';
import { qrAsistenciaService } from '../../services';

const EscanerQR = () => {
  const {
    isScanning,
    hasPermission,
    error: scannerError,
    scanResult,
    startScanning,
    stopScanning,
    getGeolocation,
    resetScan
  } = useQRScanner();

  const [registroResult, setRegistroResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [geolocalizacion, setGeolocalizacion] = useState(null);
  const [mostrarEscaner, setMostrarEscaner] = useState(false); // Nuevo estado

  /**
   * Procesar QR escaneado
   */
  useEffect(() => {
    if (scanResult && !loading) {
      procesarQR(scanResult);
    }
  }, [scanResult]);

  /**
   * Cleanup al desmontar componente
   */
  useEffect(() => {
    return () => {
      if (isScanning) {
        stopScanning();
      }
    };
  }, []);

  /**
   * Manejar cancelación del escaneo
   */
  const handleCancelar = () => {
    stopScanning();
    setMostrarEscaner(false);
  };

  /**
   * Enviar código al backend para registrar asistencia
   */
  const procesarQR = async (codigo) => {
    try {
      setLoading(true);
      setError(null);

      // Intentar obtener geolocalización
      let geo = null;
      try {
        geo = await getGeolocation();
        setGeolocalizacion(geo);
      } catch (geoError) {
        console.warn('No se pudo obtener geolocalización:', geoError);
        // Continuar sin geolocalización
      }

      // Enviar al backend
      const response = await qrAsistenciaService.escanearQR({
        codigo,
        geolocalizacion: geo
      });

      if (response.success) {
        setRegistroResult({
          tipo: response.data.tipoRegistro || response.data.tipo, // 'entrada' o 'salida'
          estado: response.data.estado || 'presente', // presente, tardanza, etc
          mensaje: response.data.mensaje,
          hora: response.data.hora || new Date().toISOString(), // Usar hora del servidor o actual
          colaborador: response.data.colaborador,
          success: true,
          // Nuevos campos para múltiples registros
          esRolPrivilegiado: response.data.esRolPrivilegiado || false,
          totalRegistrosHoy: response.data.totalRegistrosHoy || 0,
          tiempoTrabajadoMinutos: response.data.tiempoTrabajadoMinutos || null,
          // 🆕 Información del pago diario
          pagoDiario: response.data.pagoDiario || null
        });
      } else {
        throw new Error(response.message || 'Error al registrar asistencia');
      }

    } catch (err) {
      console.error('Error al procesar QR:', err);
      setError(err.message || 'Error al registrar asistencia');
      setRegistroResult({
        success: false,
        mensaje: err.message || 'Error al registrar asistencia'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Iniciar nuevo escaneo
   */
  const handleIniciarEscaneo = () => {
    resetScan();
    setRegistroResult(null);
    setError(null);
    setGeolocalizacion(null);
    setMostrarEscaner(true); // Mostrar el elemento primero
  };

  /**
   * Inicializar escáner cuando el elemento está visible
   */
  useEffect(() => {
    if (mostrarEscaner && !isScanning) {
      // Esperar a que el DOM se renderice
      const timer = setTimeout(() => {
        startScanning();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [mostrarEscaner]);

  /**
   * Formatear hora en zona horaria de Perú
   */
  const formatearHora = (fecha) => {
    if (!fecha) return 'Hora no disponible';
    
    try {
      const date = new Date(fecha);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Hora no disponible';
      }
      
      // Formatear en zona horaria de Perú
      return date.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Lima'
      });
    } catch (error) {
      console.error('Error al formatear hora:', error);
      return 'Hora no disponible';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <Camera size={32} />
          <div>
            <h1 className="text-2xl font-bold">Registro de Asistencia</h1>
            <p className="text-blue-100 text-sm mt-1">
              Escanea el código QR para registrar tu entrada o salida
            </p>
          </div>
        </div>
      </div>

      {/* Estado: Sin escanear y sin resultado */}
      {!mostrarEscaner && !registroResult && (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera size={40} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Listo para escanear
          </h2>
          <p className="text-gray-600 mb-6">
            Presiona el botón para activar la cámara y escanear el código QR
          </p>
          
          <button
            onClick={handleIniciarEscaneo}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera size={20} />
            <span>{loading ? 'Iniciando...' : 'Iniciar Escáner'}</span>
          </button>

          {(scannerError || error) && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-left">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-900 font-medium">Error</p>
                <p className="text-red-700 text-sm mt-1">{scannerError || error}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estado: Escaneando */}
      {mostrarEscaner && !registroResult && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <p className="text-blue-900 font-medium text-center flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
              {isScanning ? 'Escaneando... Apunta la cámara al código QR' : 'Iniciando cámara...'}
            </p>
          </div>
          
          {/* Contenedor del escáner */}
          <div className="relative">
            <div id="qr-reader" className="w-full min-h-[300px] bg-gray-900"></div>
            
            {loading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white rounded-xl p-6 flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
                  <p className="text-gray-900 font-medium">Procesando...</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={handleCancelar}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <XCircle size={20} />
              <span>Cancelar</span>
            </button>
          </div>
        </div>
      )}

      {/* Estado: Resultado de Registro */}
      {registroResult && (
        <div className="space-y-4">
          
          {/* Mensaje de Éxito/Error */}
          {registroResult.success ? (
            <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                  {registroResult.tipo === 'entrada' ? (
                    <LogIn size={32} className="text-white" />
                  ) : (
                    <LogOut size={32} className="text-white" />
                  )}
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-green-900 text-center mb-2">
                {registroResult.tipo === 'entrada' ? '¡Entrada Registrada!' : '¡Salida Registrada!'}
              </h2>
              
              <p className="text-green-800 text-center mb-4">
                {registroResult.mensaje}
              </p>

              {/* Badge de estado (si es tardanza) */}
              {registroResult.tipo === 'entrada' && registroResult.estado === 'tardanza' && (
                <div className="bg-orange-100 border border-orange-300 rounded-xl p-3 mb-4">
                  <p className="text-orange-800 text-center text-sm font-medium flex items-center justify-center gap-2">
                    <Clock size={16} />
                    <span>⚠️ Registro marcado como TARDANZA</span>
                  </p>
                </div>
              )}

              {/* Información del Registro */}
              <div className="bg-white rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <Clock size={20} className="text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Hora de registro</p>
                    <p className="font-semibold">{formatearHora(registroResult.hora)}</p>
                  </div>
                </div>

                {geolocalizacion && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPin size={20} className="text-green-600" />
                    <div>
                      <p className="text-sm text-gray-500">Ubicación</p>
                      <p className="font-semibold text-xs">
                        {geolocalizacion.latitud.toFixed(6)}, {geolocalizacion.longitud.toFixed(6)}
                      </p>
                    </div>
                  </div>
                )}

                {registroResult.tipo === 'entrada' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                    <p className="text-blue-800 text-sm">
                      💡 <strong>Recuerda:</strong> Escanea nuevamente el código QR al finalizar tu jornada para registrar tu salida.
                    </p>
                  </div>
                )}

                {registroResult.tipo === 'salida' && (
                  <div className="mt-4 p-3 bg-green-50 rounded-xl">
                    <p className="text-green-800 text-sm">
                      ✅ Tu jornada laboral ha sido registrada completamente.
                    </p>
                  </div>
                )}

                {/* 🆕 Información del Pago Diario */}
                {registroResult.tipo === 'salida' && registroResult.pagoDiario && (
                  <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">💰</span>
                      <h3 className="font-semibold text-emerald-900">Pago Diario</h3>
                    </div>
                    {registroResult.pagoDiario.registrado ? (
                      <div className="space-y-2">
                        <p className="text-emerald-800 text-sm">
                          ✅ Se ha registrado automáticamente tu pago del día.
                        </p>
                        <div className="bg-white rounded p-2 flex items-center justify-between">
                          <span className="text-sm text-gray-600">Monto del día:</span>
                          <span className="font-bold text-emerald-700 text-lg">
                            S/ {registroResult.pagoDiario.montoDiario?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-amber-700 text-sm">
                        ⚠️ No se configuró sueldo para este colaborador. El pago diario no fue registrado.
                      </p>
                    )}
                  </div>
                )}

                {/* Información adicional para roles privilegiados */}
                {registroResult.esRolPrivilegiado && (
                  <div className="mt-4 space-y-3">
                    {/* Badge de rol privilegiado */}
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                      <p className="text-purple-800 text-sm font-medium flex items-center gap-2">
                        <span>👑</span>
                        <span>Modo Administrador: Puedes registrar múltiples entradas/salidas</span>
                      </p>
                    </div>
                    
                    {/* Estadísticas del día */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 rounded-xl text-center">
                        <p className="text-2xl font-bold text-gray-900">{registroResult.totalRegistrosHoy}</p>
                        <p className="text-xs text-gray-600">Registros hoy</p>
                      </div>
                      
                      {registroResult.tiempoTrabajadoMinutos !== null && (
                        <div className="p-3 bg-gray-50 rounded-xl text-center">
                          <p className="text-2xl font-bold text-gray-900">
                            {Math.floor(registroResult.tiempoTrabajadoMinutos / 60)}h {registroResult.tiempoTrabajadoMinutos % 60}m
                          </p>
                          <p className="text-xs text-gray-600">Tiempo trabajado</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Mensaje de siguiente acción */}
                    {registroResult.tipo === 'entrada' && (
                      <div className="p-3 bg-blue-50 rounded-xl">
                        <p className="text-blue-800 text-sm">
                          📌 Escanea nuevamente cuando te retires para registrar tu salida.
                        </p>
                      </div>
                    )}
                    
                    {registroResult.tipo === 'salida' && (
                      <div className="p-3 bg-amber-50 rounded-xl">
                        <p className="text-amber-800 text-sm">
                          🔄 Si regresas más tarde, puedes escanear para registrar una nueva entrada.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertCircle size={32} className="text-white" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-red-900 text-center mb-2">
                Error al Registrar
              </h2>
              
              <p className="text-red-800 text-center">
                {registroResult.mensaje || 'Ocurrió un error al procesar el código QR'}
              </p>
            </div>
          )}

          {/* Botón para nuevo escaneo */}
          <button
            onClick={handleIniciarEscaneo}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={20} />
            <span>Escanear Nuevamente</span>
          </button>
        </div>
      )}

      {/* Instrucciones */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <CheckCircle size={20} className="text-blue-600" />
          Instrucciones
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">1.</span>
            <span>Presiona "Iniciar Escáner" y permite el acceso a la cámara</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">2.</span>
            <span>Apunta la cámara al código QR que está en tu lugar de trabajo</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">3.</span>
            <span>El sistema detectará automáticamente si es entrada o salida</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">4.</span>
            <span>Espera la confirmación del registro en pantalla</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default EscanerQR;
