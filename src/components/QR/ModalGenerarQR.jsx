/**
 * Componente ModalGenerarQR
 * Modal con formulario para generar nuevos códigos QR
 */

import React, { useState, useEffect } from 'react';
import { X, QrCode, MapPin, Clock, AlertCircle, Edit3, Loader2 } from 'lucide-react';

const ModalGenerarQR = ({ 
  isOpen, 
  onClose, 
  onGenerar, 
  onActualizar,
  qrEditar = null, // QR a editar (null = modo crear)
  loading = false 
}) => {
  
  // Determinar si estamos en modo edición
  const modoEdicion = !!qrEditar;
  
  const [formData, setFormData] = useState({
    nombre: '',
    sucursal: '',
    validoHasta: '',
    notas: '',
    requiereGeolocalizacion: true,
    horaInicio: '06:00',
    horaFin: '23:00',
    // Configuración de tardanzas
    horarioEntradaEsperado: '08:00',
    toleranciaTardanza: 10,
    aplicarDeteccionTardanza: true
  });

  const [errores, setErrores] = useState({});

  // Efecto para cargar datos cuando se edita un QR
  useEffect(() => {
    if (qrEditar && isOpen) {
      // Formatear la fecha para el input date
      let fechaValidoHasta = '';
      if (qrEditar.validoHasta) {
        const fecha = new Date(qrEditar.validoHasta);
        fechaValidoHasta = fecha.toISOString().split('T')[0];
      }

      setFormData({
        nombre: qrEditar.nombre || '',
        sucursal: qrEditar.sucursalNombre || '',
        validoHasta: fechaValidoHasta,
        notas: qrEditar.notas || '',
        requiereGeolocalizacion: qrEditar.configuracion?.requiereGeolocalizacion ?? true,
        horaInicio: qrEditar.configuracion?.horariosPermitidos?.horaInicio || '06:00',
        horaFin: qrEditar.configuracion?.horariosPermitidos?.horaFin || '23:00',
        horarioEntradaEsperado: qrEditar.configuracion?.horarioEntradaEsperado || '08:00',
        toleranciaTardanza: qrEditar.configuracion?.toleranciaTardanza || 10,
        aplicarDeteccionTardanza: qrEditar.configuracion?.aplicarDeteccionTardanza ?? true
      });
    } else if (!qrEditar && isOpen) {
      // Resetear a valores por defecto cuando se abre en modo crear
      setFormData({
        nombre: '',
        sucursal: '',
        validoHasta: '',
        notas: '',
        requiereGeolocalizacion: true,
        horaInicio: '06:00',
        horaFin: '23:00',
        horarioEntradaEsperado: '08:00',
        toleranciaTardanza: 10,
        aplicarDeteccionTardanza: true
      });
      setErrores({});
    }
  }, [qrEditar, isOpen]);

  // Cerrar modal y resetear formulario
  const handleCerrar = () => {
    setFormData({
      nombre: '',
      sucursal: '',
      validoHasta: '',
      notas: '',
      requiereGeolocalizacion: true,
      horaInicio: '06:00',
      horaFin: '23:00',
      horarioEntradaEsperado: '08:00',
      toleranciaTardanza: 10,
      aplicarDeteccionTardanza: true
    });
    setErrores({});
    onClose();
  };

  // Validar formulario
  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    }

    if (!formData.sucursal.trim()) {
      nuevosErrores.sucursal = 'La sucursal es obligatoria';
    }

    if (formData.validoHasta) {
      const fechaSeleccionada = new Date(formData.validoHasta);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaSeleccionada < hoy) {
        nuevosErrores.validoHasta = 'La fecha debe ser futura';
      }
    }

    if (formData.horaInicio && formData.horaFin) {
      if (formData.horaInicio >= formData.horaFin) {
        nuevosErrores.horaInicio = 'La hora de inicio debe ser menor a la hora de fin';
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    // Preparar datos para enviar
    const datosQR = {
      nombre: formData.nombre.trim(),
      sucursalNombre: formData.sucursal.trim(),
      notas: formData.notas.trim(),
      configuracion: {
        requiereGeolocalizacion: formData.requiereGeolocalizacion,
        horariosPermitidos: {
          horaInicio: formData.horaInicio,
          horaFin: formData.horaFin
        },
        // Configuración de detección de tardanzas
        horarioEntradaEsperado: formData.horarioEntradaEsperado,
        toleranciaTardanza: parseInt(formData.toleranciaTardanza),
        aplicarDeteccionTardanza: formData.aplicarDeteccionTardanza
      }
    };

    // Solo incluir validoHasta si tiene valor
    if (formData.validoHasta) {
      datosQR.validoHasta = formData.validoHasta;
    } else {
      datosQR.validoHasta = null; // Permitir eliminar fecha de expiración
    }

    // Diferenciar entre crear y actualizar
    if (modoEdicion) {
      await onActualizar(qrEditar._id, datosQR);
    } else {
      // Mantener compatibilidad con onGenerar que espera 'sucursal' en lugar de 'sucursalNombre'
      datosQR.sucursal = datosQR.sucursalNombre;
      await onGenerar(datosQR);
    }
  };

  // Manejar cambios en inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error del campo al editar
    if (errores[name]) {
      setErrores(prev => {
        const nuevos = { ...prev };
        delete nuevos[name];
        return nuevos;
      });
    }
  };

  // Obtener fecha mínima (hoy)
  const getFechaMinima = () => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className={`${modoEdicion ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-gradient-to-r from-blue-600 to-purple-600'} text-white p-6 flex items-center justify-between sticky top-0`}>
          <div className="flex items-center gap-3">
            {modoEdicion ? <Edit3 size={32} /> : <QrCode size={32} />}
            <h2 className="text-2xl font-bold">
              {modoEdicion ? 'Editar Código QR' : 'Generar Código QR'}
            </h2>
          </div>
          <button
            onClick={handleCerrar}
            disabled={loading}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              Información Básica
            </h3>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del QR <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: QR Sede Principal - Marzo 2025"
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errores.nombre ? 'border-red-500' : 'border-gray-200'
                }`}
                disabled={loading}
              />
              {errores.nombre && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errores.nombre}
                </p>
              )}
            </div>

            {/* Sucursal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sucursal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sucursal"
                value={formData.sucursal}
                onChange={handleChange}
                placeholder="Ej: Lima Centro, Arequipa, Trujillo"
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errores.sucursal ? 'border-red-500' : 'border-gray-200'
                }`}
                disabled={loading}
              />
              {errores.sucursal && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errores.sucursal}
                </p>
              )}
            </div>

            {/* Válido Hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Válido Hasta (Opcional)
              </label>
              <input
                type="date"
                name="validoHasta"
                value={formData.validoHasta}
                onChange={handleChange}
                min={getFechaMinima()}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errores.validoHasta ? 'border-red-500' : 'border-gray-200'
                }`}
                disabled={loading}
              />
              {errores.validoHasta && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errores.validoHasta}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Deja vacío para que no expire
              </p>
            </div>
          </div>

          {/* Configuración de Horarios */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <Clock size={20} />
              Horarios Permitidos
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Hora Inicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora Inicio
                </label>
                <input
                  type="time"
                  name="horaInicio"
                  value={formData.horaInicio}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errores.horaInicio ? 'border-red-500' : 'border-gray-200'
                  }`}
                  disabled={loading}
                />
              </div>

              {/* Hora Fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora Fin
                </label>
                <input
                  type="time"
                  name="horaFin"
                  value={formData.horaFin}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>
            {errores.horaInicio && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle size={14} />
                {errores.horaInicio}
              </p>
            )}
          </div>

          {/* Configuración de Detección de Tardanzas */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <Clock size={20} />
              Detección de Tardanzas
            </h3>

            {/* Activar detección */}
            <div className="flex items-start gap-3 bg-orange-50 p-4 rounded-xl border border-orange-200">
              <input
                type="checkbox"
                name="aplicarDeteccionTardanza"
                id="aplicarDeteccionTardanza"
                checked={formData.aplicarDeteccionTardanza}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                disabled={loading}
              />
              <label htmlFor="aplicarDeteccionTardanza" className="flex-1 cursor-pointer">
                <span className="text-sm font-medium text-gray-900 block">
                  Detectar Tardanzas Automáticamente
                </span>
                <span className="text-xs text-gray-600">
                  El sistema marcará como "tardanza" si el colaborador llega después de la hora esperada + tolerancia
                </span>
              </label>
            </div>

            {/* Horario esperado y tolerancia */}
            {formData.aplicarDeteccionTardanza && (
              <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  {/* Horario de entrada esperado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora de Entrada Esperada
                    </label>
                    <input
                      type="time"
                      name="horarioEntradaEsperado"
                      value={formData.horarioEntradaEsperado}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Hora a la que deben llegar
                    </p>
                  </div>

                  {/* Tolerancia */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tolerancia (minutos)
                    </label>
                    <input
                      type="number"
                      name="toleranciaTardanza"
                      value={formData.toleranciaTardanza}
                      onChange={handleChange}
                      min="0"
                      max="60"
                      step="5"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minutos de gracia
                    </p>
                  </div>
                </div>

                {/* Ejemplo visual */}
                <div className="bg-white p-3 rounded border border-orange-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">💡 Ejemplo:</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Entrada antes de <strong>{formData.horarioEntradaEsperado}</strong> = Presente</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Entrada entre <strong>{formData.horarioEntradaEsperado}</strong> y <strong>{
                        (() => {
                          const [h, m] = formData.horarioEntradaEsperado.split(':').map(Number);
                          const totalMin = h * 60 + m + parseInt(formData.toleranciaTardanza);
                          const newH = Math.floor(totalMin / 60) % 24;
                          const newM = totalMin % 60;
                          return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
                        })()
                      }</strong> = Presente</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600">⚠</span>
                      <span>Entrada después de <strong>{
                        (() => {
                          const [h, m] = formData.horarioEntradaEsperado.split(':').map(Number);
                          const totalMin = h * 60 + m + parseInt(formData.toleranciaTardanza);
                          const newH = Math.floor(totalMin / 60) % 24;
                          const newM = totalMin % 60;
                          return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
                        })()
                      }</strong> = Tardanza</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Configuración Adicional */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <MapPin size={20} />
              Configuración Adicional
            </h3>

            {/* Requiere Geolocalización */}
            <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-xl">
              <input
                type="checkbox"
                name="requiereGeolocalizacion"
                id="requiereGeolocalizacion"
                checked={formData.requiereGeolocalizacion}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                disabled={loading}
              />
              <label htmlFor="requiereGeolocalizacion" className="flex-1 cursor-pointer">
                <span className="text-sm font-medium text-gray-900 block">
                  Requiere Geolocalización
                </span>
                <span className="text-xs text-gray-600">
                  El colaborador debe compartir su ubicación al escanear el QR
                </span>
              </label>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (Opcional)
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows="3"
              placeholder="Ej: Este QR es para el personal de la nueva sede..."
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={loading}
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCerrar}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-6 py-3 ${modoEdicion ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'} text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 text-white" />
                  <span>{modoEdicion ? 'Actualizando...' : 'Generando...'}</span>
                </>
              ) : (
                <>
                  {modoEdicion ? <Edit3 size={20} /> : <QrCode size={20} />}
                  <span>{modoEdicion ? 'Guardar Cambios' : 'Generar Código QR'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalGenerarQR;
