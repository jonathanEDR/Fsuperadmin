import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, FileText, Leaf } from 'lucide-react';
import { recetaService } from '../../../services/recetaService';
import { formatearFecha as formatearFechaUtil } from '../../../utils/fechaHoraUtils';
import HistorialFases from './HistorialFases';
import HistorialProduccionReceta from './HistorialProduccionReceta';
import TarjetaKardex from '../Kardex/TarjetaKardex';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';

const VistaReceta = ({ receta, onCerrar, recargarKey }) => {
  // Hook de permisos - solo super_admin ve precios y costos
  const { canViewPrices } = useQuickPermissions();
  
  const [recetaActual, setRecetaActual] = useState(receta);
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [cantidadConsulta, setCantidadConsulta] = useState(1);
  const [loading, setLoading] = useState(false);

  // Efecto para recargar la receta cuando cambie el ID o la key de recarga
  useEffect(() => {
    if (receta?._id) {
      recargarReceta();
    }
  }, [receta?._id, recargarKey]);

  // Efecto para consultar información cuando cambie la cantidad o la receta
  useEffect(() => {
    const recetaParaUsar = recetaActual || receta;
    if (recetaParaUsar?._id) {
      consultarInformacion();
    }
  }, [cantidadConsulta, recetaActual?._id, receta?._id]);

  const recargarReceta = async () => {
    try {
      const response = await recetaService.obtenerRecetaPorId(receta._id);
      // Manejar respuesta del backend que puede venir en response.data o response.data.data
      const recetaActualizada = response.data || response;
      setRecetaActual(recetaActualizada);
    } catch (error) {
      console.error('Error al recargar receta:', error);
      // Si falla, usar la receta original
      setRecetaActual(receta);
    }
  };

  const consultarInformacion = async () => {
    const recetaParaUsar = recetaActual || receta;
    if (!recetaParaUsar?._id) return;
    
    setLoading(true);
    try {
      const disponibilidadResponse = await recetaService.verificarDisponibilidad(recetaParaUsar._id, cantidadConsulta);
      setDisponibilidad(disponibilidadResponse.data);
    } catch (error) {
      console.error('Error al consultar disponibilidad:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 NUEVO: Función para reiniciar receta
  const handleReiniciarReceta = async () => {
    const recetaParaUsar = recetaActual || receta;
    if (!recetaParaUsar?._id) return;

    try {
      setLoading(true);
      const response = await recetaService.reiniciarReceta(recetaParaUsar._id, 'Reinicio desde vista de detalles');
      
      // Recargar la receta con los nuevos datos
      await recargarReceta();
      
      alert('Receta reiniciada exitosamente al estado preparado');
    } catch (error) {
      console.error('Error al reiniciar receta:', error);
      alert(`Error al reiniciar receta: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getCategoriaColor = (categoria) => {
    const colores = {
      producto_terminado: 'bg-green-100 text-green-800',
      producto_intermedio: 'bg-yellow-100 text-yellow-800',
      preparado: 'bg-blue-100 text-blue-800'
    };
    return colores[categoria] || 'bg-gray-100 text-gray-800';
  };

  const getCategoriaLabel = (categoria) => {
    const labels = {
      producto_terminado: 'Producto Terminado',
      producto_intermedio: 'Producto Intermedio',
      preparado: 'Preparado'
    };
    return labels[categoria] || categoria;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return formatearFechaUtil(fecha);
  };

  // Usar recetaActual si está disponible, sino usar receta original
  const datosReceta = recetaActual || receta;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative mx-auto border border-gray-100 box-border w-full max-w-3xl sm:w-11/12 shadow-xl rounded-2xl bg-white p-0 max-h-[92vh] flex flex-col">
        <div className="flex-1 overflow-y-auto p-0 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4 sm:mb-6 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-5 py-4 rounded-t-2xl">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {datosReceta.nombre}
              </h3>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getCategoriaColor(datosReceta.categoria)}`}>
                  {getCategoriaLabel(datosReceta.categoria)}
                </span>
                <span className={`px-2 py-1 rounded text-xs sm:text-sm ${
                  datosReceta.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {datosReceta.activo ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={onCerrar}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-white/80 rounded-xl transition-colors"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Principal */}
            <div className="space-y-4 sm:space-y-6 min-w-0">
              {/* Descripción */}
              {datosReceta.descripcion && (
                <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-100">
                  <h4 className="font-medium text-gray-700 mb-2">Descripción</h4>
                  <p className="text-gray-600">{datosReceta.descripcion}</p>
                </div>
              )}

              {/* Ingredientes y Recetas - Vista de Lista */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-gray-50/60 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100">
                  <h4 className="font-medium text-gray-700">Ingredientes y Sub-recetas</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {datosReceta.ingredientes?.length || 0} items en esta receta
                  </p>
                </div>
                <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                  {datosReceta.ingredientes?.map((item, index) => {
                    // Detectar si es ingrediente o receta
                    const esReceta = item.tipo === 'receta' || (!item.tipo && item.receta && !item.ingrediente);
                    const itemData = esReceta ? item.receta : item.ingrediente;
                    
                    // Validar que el item exista (puede no estar poblado)
                    if (!itemData) {
                      return null;
                    }

                    let disponible, subtotal, cantidadNecesaria, suficiente, precioUnitarioItem;

                    if (esReceta) {
                      // Para recetas: disponible = producido - utilizado
                      disponible = (itemData.inventario?.cantidadProducida || 0) - (itemData.inventario?.cantidadUtilizada || 0);
                      precioUnitarioItem = itemData.costoUnitario || 0;
                      subtotal = item.cantidad * precioUnitarioItem;
                      cantidadNecesaria = item.cantidad * cantidadConsulta;
                      suficiente = disponible >= cantidadNecesaria;
                    } else {
                      // Para ingredientes: disponible = cantidad - procesado
                      disponible = (itemData.cantidad || 0) - (itemData.procesado || 0);
                      precioUnitarioItem = itemData.precioUnitario || 0;
                      subtotal = item.cantidad * precioUnitarioItem;
                      cantidadNecesaria = item.cantidad * cantidadConsulta;
                      suficiente = disponible >= cantidadNecesaria;
                    }

                    return (
                      <div
                        key={index}
                          className={`rounded-xl border p-3 ${
                            !suficiente 
                              ? 'bg-red-50 border-red-300' 
                              : esReceta 
                                ? 'bg-purple-50 border-purple-200' 
                                : 'bg-orange-50 border-orange-200'
                          }`}
                        >
                          {/* Header: Icono + Nombre */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="flex-shrink-0" title={esReceta ? 'Receta' : 'Ingrediente'}>
                                {esReceta ? <FileText size={20} className="text-purple-600" /> : <Leaf size={20} className="text-green-600" />}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium text-sm ${esReceta ? 'text-purple-700' : 'text-gray-900'} truncate`}>
                                {itemData.nombre}
                              </div>
                              <div className="text-xs text-gray-500">
                                {esReceta ? 'Sub-receta' : 'Ingrediente'}
                              </div>
                            </div>
                          </div>
                          {/* Badge de estado */}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 flex items-center gap-1 ${
                            suficiente 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {suficiente ? <><CheckCircle size={12} /> OK</> : <><AlertTriangle size={12} /> Bajo</>}
                          </span>
                        </div>

                        {/* Detalles en grid */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          {/* Cantidad necesaria */}
                          <div>
                            <div className="text-gray-500 mb-1">Cantidad</div>
                            <div className="font-semibold text-gray-900">
                              {item.cantidad} {item.unidadMedida}
                              {cantidadConsulta > 1 && (
                                <div className="text-xs text-gray-500 font-normal">
                                  ({cantidadNecesaria} total)
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Disponible */}
                          <div>
                            <div className="text-gray-500 mb-1">Disponible</div>
                            <div className={`font-semibold ${suficiente ? 'text-green-600' : 'text-red-600'}`}>
                              {disponible} {item.unidadMedida}
                            </div>
                          </div>

                          {/* Precios - Solo super_admin */}
                          {canViewPrices && (
                            <>
                              <div>
                                <div className="text-gray-500 mb-1">Precio/Unidad</div>
                                <div className={`font-semibold ${esReceta ? 'text-purple-600' : 'text-gray-900'}`}>
                                  S/.{precioUnitarioItem.toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 mb-1">Subtotal</div>
                                <div className={`font-semibold ${esReceta ? 'text-purple-600' : 'text-gray-900'}`}>
                                  S/.{subtotal.toFixed(2)}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Disponibilidad */}
              {disponibilidad && !disponibilidad.disponible && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} /> Ingredientes Insuficientes
                  </h4>
                  <div className="space-y-2">
                    {disponibilidad.faltantes.map((faltante, index) => (
                      <div key={index} className="text-sm text-red-700">
                        <strong>{faltante.ingrediente}:</strong> 
                        <span className="ml-1">
                          Requiere {faltante.requerido}, disponible {faltante.disponible}, 
                          falta {faltante.faltante}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {disponibilidad && disponibilidad.disponible && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h4 className="font-medium text-green-800 flex items-center gap-2">
                    <CheckCircle size={16} /> Todos los ingredientes están disponibles
                  </h4>
                </div>
              )}
            </div>

            {/* Panel Lateral */}
            <div className="space-y-4 sm:space-y-6 min-w-0">
              {/* Información Básica */}
              <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-100">
                <h4 className="font-medium text-gray-700 mb-3">Información</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rendimiento:</span>
                    <span className="font-medium">
                      {datosReceta.rendimiento?.cantidad} {datosReceta.rendimiento?.unidadMedida}
                    </span>
                  </div>
                  {datosReceta.tiempoPreparacion > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tiempo:</span>
                      <span className="font-medium">{datosReceta.tiempoPreparacion} min</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ingredientes:</span>
                    <span className="font-medium">{datosReceta.ingredientes?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Creada:</span>
                    <span className="font-medium text-xs">
                      {formatearFecha(datosReceta.createdAt)}
                    </span>
                  </div>
                  {datosReceta.updatedAt !== datosReceta.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Actualizada:</span>
                      <span className="font-medium text-xs">
                        {formatearFecha(datosReceta.updatedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cantidad a producir - controla disponibilidad */}
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Cantidad a producir (lotes)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={cantidadConsulta}
                  onChange={(e) => setCantidadConsulta(parseInt(e.target.value) || 1)}
                  className="w-full p-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Kardex PEPS - Reemplaza la calculadora simple */}
              <TarjetaKardex
                recetaId={datosReceta._id}
                recetaNombre={datosReceta.nombre}
                rendimiento={datosReceta.rendimiento}
                cantidadAProducir={cantidadConsulta}
              />

              {/* Estado de Disponibilidad */}
              <div className={`p-4 rounded-xl ${
                disponibilidad?.disponible 
                  ? 'bg-green-50/60 border border-green-200' 
                  : 'bg-red-50/60 border border-red-200'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  disponibilidad?.disponible ? 'text-green-800' : 'text-red-800'
                }`}>
                  Estado de Producción
                </h4>
                <p className={`text-sm ${
                  disponibilidad?.disponible ? 'text-green-700' : 'text-red-700'
                }`}>
                  {disponibilidad?.disponible 
                    ? <span className="flex items-center gap-1"><CheckCircle size={14} /> Se pueden producir {cantidadConsulta} unidad{cantidadConsulta > 1 ? 'es' : ''}</span>
                    : <span className="flex items-center gap-1"><XCircle size={14} /> No se puede producir con ingredientes actuales</span>
                  }
                </p>
              </div>
            </div>
          </div>

          {/* 🎯 Historial de Fases (flujo de trabajo) */}
          <HistorialFases 
            receta={datosReceta} 
            onReiniciar={handleReiniciarReceta}
          />

          {/* 🎯 NUEVO: Historial de Producción (producciones realizadas) */}
          <HistorialProduccionReceta 
            recetaId={datosReceta._id}
            recetaNombre={datosReceta.nombre}
            unidadMedida={datosReceta.rendimiento?.unidadMedida || 'unidad'}
          />

          {/* Botón Cerrar */}
          <div className="flex justify-center sm:justify-end mt-6 pt-4 border-t">
            <button
              onClick={onCerrar}
              className="w-full sm:w-auto px-6 py-2 text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VistaReceta;
