/**
 * Hook personalizado para gestionar el escáner de QR
 * Maneja permisos de cámara, escaneo y geolocalización
 */

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export const useQRScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const scannerRef = useRef(null);
  const qrCodeScannerRef = useRef(null);

  /**
   * Solicitar permisos de cámara
   */
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Detener el stream inmediatamente, solo queríamos verificar permisos
      stream.getTracks().forEach(track => track.stop());
      
      setHasPermission(true);
      setError(null);
      return true;
    } catch (err) {
      console.error('Error al solicitar permisos de cámara:', err);
      setHasPermission(false);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
      return false;
    }
  };

  /**
   * Iniciar escáner QR
   */
  const startScanning = async (elementId = 'qr-reader') => {
    try {
      // Verificar que el elemento existe en el DOM
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Elemento con id="${elementId}" no encontrado. Espera un momento e intenta de nuevo.`);
      }

      // Verificar permisos primero
      const hasAccess = await requestCameraPermission();
      if (!hasAccess) return false;

      // Limpiar instancia anterior si existe
      if (qrCodeScannerRef.current) {
        try {
          await qrCodeScannerRef.current.stop();
          qrCodeScannerRef.current.clear();
        } catch (err) {
          // Ignorar errores al limpiar
        }
        qrCodeScannerRef.current = null;
      }

      // Crear nueva instancia del escáner
      qrCodeScannerRef.current = new Html5Qrcode(elementId);

      // Configuración del escáner
      const config = {
        fps: 10, // Frames por segundo
        qrbox: { width: 250, height: 250 }, // Área de escaneo
        aspectRatio: 1.0
      };

      // Callback cuando se detecta un QR
      const onScanSuccess = (decodedText, decodedResult) => {
        console.log('QR Escaneado:', decodedText);
        setScanResult(decodedText);
        stopScanning(); // Detener escáner después de escanear
      };

      // Callback para errores (opcional, no mostrar en consola)
      const onScanError = (errorMessage) => {
        // Ignorar errores de escaneo continuo
      };

      // Iniciar escáner
      await qrCodeScannerRef.current.start(
        { facingMode: 'environment' }, // Usar cámara trasera
        config,
        onScanSuccess,
        onScanError
      );

      setIsScanning(true);
      setError(null);
      return true;

    } catch (err) {
      console.error('Error al iniciar escáner:', err);
      setError('Error al iniciar el escáner: ' + err.message);
      setIsScanning(false);
      return false;
    }
  };

  /**
   * Detener escáner QR
   */
  const stopScanning = async () => {
    try {
      if (qrCodeScannerRef.current && isScanning) {
        await qrCodeScannerRef.current.stop();
        qrCodeScannerRef.current.clear();
      }
      setIsScanning(false);
    } catch (err) {
      console.error('Error al detener escáner:', err);
    }
  };

  /**
   * Obtener geolocalización del usuario
   */
  const getGeolocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitud: position.coords.latitude,
            longitud: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error('No se pudo obtener la ubicación: ' + error.message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  /**
   * Reset del resultado de escaneo
   */
  const resetScan = () => {
    setScanResult(null);
    setError(null);
  };

  /**
   * Cleanup al desmontar
   */
  useEffect(() => {
    return () => {
      if (qrCodeScannerRef.current && isScanning) {
        qrCodeScannerRef.current.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  return {
    isScanning,
    hasPermission,
    error,
    scanResult,
    startScanning,
    stopScanning,
    getGeolocation,
    resetScan,
    requestCameraPermission
  };
};

export default useQRScanner;
