import React, { useState } from 'react';
import {
    estadosColor,
    tiposColor,
    formatearMoneda,
    formatearFecha,
    getAccionesDisponibles
} from './garantiasConfig';

/**
 * Modal para ver detalles completos de una garantía
 */
const ModalDetallesGarantia = ({
    isOpen,
    onClose,
    garantia,
    onAprobar,
    onRechazar,
    onActivar,
    onLiberar,
    onEjecutar,
    onEditar,
    onAgregarSeguro
}) => {
    const [activeTab, setActiveTab] = useState('general');

    if (!isOpen || !garantia) return null;

    const estadoConfig = estadosColor[garantia.estado] || estadosColor.pendiente_evaluacion;
    const tipoConfig = tiposColor[garantia.tipo] || tiposColor.otra;
    const accionesDisponibles = getAccionesDisponibles(garantia.estado);

    // Tabs de navegación
    const tabs = [
        { id: 'general', label: 'General', icono: '📋' },
        { id: 'bien', label: 'Bien', icono: '🏠' },
        { id: 'propietario', label: 'Propietario', icono: '👤' },
        { id: 'valores', label: 'Valores', icono: '💰' },
        { id: 'seguros', label: 'Seguros', icono: '🛡️' },
        { id: 'documentos', label: 'Documentos', icono: '📄' },
        { id: 'historial', label: 'Historial', icono: '📜' }
    ];

    // Renderizar campo de información
    const InfoField = ({ label, value, className = '' }) => (
        <div className={className}>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900">{value || '-'}</dd>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center gap-4">
                            <div className="text-4xl">{tipoConfig.icono}</div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                                        {garantia.codigo}
                                    </span>
                                    <span>{garantia.bien?.nombre || 'Garantía'}</span>
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tipoConfig.color}`}>
                                        {tipoConfig.label}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${estadoConfig.color}`}>
                                        {estadoConfig.icono} {estadoConfig.label}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 bg-white overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <span>{tab.icono}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[55vh]">
                        {/* Tab: General */}
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                {/* Información del préstamo */}
                                {garantia.prestamoId && (
                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                        <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                            <span>🏦</span>
                                            <span>Préstamo Asociado</span>
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <InfoField
                                                label="Código"
                                                value={garantia.prestamoId.codigo || garantia.prestamoId}
                                            />
                                            <InfoField
                                                label="Entidad"
                                                value={garantia.prestamoId.entidadFinanciera?.nombre}
                                            />
                                            <InfoField
                                                label="Prestatario"
                                                value={garantia.prestamoId.prestatario?.nombre}
                                            />
                                            <InfoField
                                                label="Monto"
                                                value={formatearMoneda(garantia.prestamoId.montoAprobado || garantia.prestamoId.montoSolicitado)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Descripción */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Descripción</h3>
                                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                                        {garantia.descripcion || 'Sin descripción'}
                                    </p>
                                </div>

                                {/* Información general */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <InfoField label="Fecha de Constitución" value={formatearFecha(garantia.fechaConstitucion)} />
                                    <InfoField label="Fecha de Registro" value={formatearFecha(garantia.createdAt)} />
                                    <InfoField label="Última Actualización" value={formatearFecha(garantia.updatedAt)} />
                                    <InfoField label="Creado por" value={garantia.creatorName} />
                                </div>

                                {/* Observaciones */}
                                {garantia.observaciones && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Observaciones</h3>
                                        <p className="text-sm text-gray-600 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                            {garantia.observaciones}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab: Bien */}
                        {activeTab === 'bien' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <InfoField label="Nombre del Bien" value={garantia.bien?.nombre} className="md:col-span-2" />
                                    <InfoField label="Estado" value={garantia.bien?.estado?.replace('_', ' ')} />
                                    <InfoField label="Marca" value={garantia.bien?.marca} />
                                    <InfoField label="Modelo" value={garantia.bien?.modelo} />
                                    <InfoField label="Año" value={garantia.bien?.año} />
                                    <InfoField label="Color" value={garantia.bien?.color} />
                                    <InfoField label="Número de Serie" value={garantia.bien?.numeroSerie} />
                                    <InfoField label="Número de Motor" value={garantia.bien?.numeroMotor} />
                                    <InfoField label="Número de Chasis" value={garantia.bien?.numeroChasis} />
                                </div>

                                {garantia.bien?.descripcionDetallada && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Descripción Detallada</h3>
                                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                                            {garantia.bien.descripcionDetallada}
                                        </p>
                                    </div>
                                )}

                                {/* Ubicación del bien */}
                                {garantia.ubicacion && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <span>📍</span>
                                            <span>Ubicación del Bien</span>
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                                            <InfoField label="Dirección" value={garantia.ubicacion.direccion} className="md:col-span-2" />
                                            <InfoField label="Distrito" value={garantia.ubicacion.distrito} />
                                            <InfoField label="Provincia" value={garantia.ubicacion.provincia} />
                                            <InfoField label="Departamento" value={garantia.ubicacion.departamento} />
                                            <InfoField label="Código Postal" value={garantia.ubicacion.codigoPostal} />
                                            <InfoField label="Referencia" value={garantia.ubicacion.referencia} className="md:col-span-3" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab: Propietario */}
                        {activeTab === 'propietario' && (
                            <div className="space-y-6">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <InfoField label="Nombre Completo" value={garantia.propietario?.nombre} className="md:col-span-2" />
                                        <InfoField label="Relación" value={garantia.propietario?.relacion} />
                                        <InfoField label="Tipo de Documento" value={garantia.propietario?.documento?.tipo} />
                                        <InfoField label="Número de Documento" value={garantia.propietario?.documento?.numero} />
                                        <InfoField label="Teléfono" value={garantia.propietario?.telefono} />
                                        <InfoField label="Email" value={garantia.propietario?.email} className="md:col-span-2" />
                                        <InfoField label="Dirección" value={garantia.propietario?.direccion} className="md:col-span-3" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Valores */}
                        {activeTab === 'valores' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                        <dt className="text-xs font-medium text-green-600 uppercase">Valor Comercial</dt>
                                        <dd className="mt-1 text-2xl font-bold text-green-700">
                                            {formatearMoneda(garantia.valores?.comercial, garantia.valores?.moneda)}
                                        </dd>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                        <dt className="text-xs font-medium text-blue-600 uppercase">Valor Tasación</dt>
                                        <dd className="mt-1 text-2xl font-bold text-blue-700">
                                            {formatearMoneda(garantia.valores?.tasacion, garantia.valores?.moneda)}
                                        </dd>
                                    </div>
                                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                        <dt className="text-xs font-medium text-orange-600 uppercase">Valor Realización</dt>
                                        <dd className="mt-1 text-2xl font-bold text-orange-700">
                                            {formatearMoneda(garantia.valores?.realizacion, garantia.valores?.moneda)}
                                        </dd>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                        <dt className="text-xs font-medium text-purple-600 uppercase">Valor Asegurado</dt>
                                        <dd className="mt-1 text-2xl font-bold text-purple-700">
                                            {formatearMoneda(garantia.valores?.seguro, garantia.valores?.moneda)}
                                        </dd>
                                    </div>
                                </div>

                                {/* Información de evaluación */}
                                {garantia.evaluacion && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Información de Evaluación</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <InfoField label="Fecha Evaluación" value={formatearFecha(garantia.evaluacion.fechaEvaluacion)} />
                                            <InfoField label="Evaluador" value={garantia.evaluacion.evaluadoPor?.nombre} />
                                            <InfoField label="Empresa" value={garantia.evaluacion.evaluadoPor?.empresa} />
                                            <InfoField label="Estado Conservación" value={garantia.evaluacion.estadoConservacion} />
                                            <InfoField label="Metodología" value={garantia.evaluacion.metodologia} className="md:col-span-2" />
                                        </div>
                                        {garantia.evaluacion.observaciones && (
                                            <div className="mt-4">
                                                <InfoField label="Observaciones" value={garantia.evaluacion.observaciones} />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab: Seguros */}
                        {activeTab === 'seguros' && (
                            <div className="space-y-4">
                                {garantia.seguros && garantia.seguros.length > 0 ? (
                                    <div className="space-y-4">
                                        {garantia.seguros.map((seguro, index) => {
                                            const hoy = new Date();
                                            const vencimiento = new Date(seguro.fechaVencimiento);
                                            const diasParaVencer = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
                                            const estaVencido = diasParaVencer < 0;
                                            const estaPorVencer = diasParaVencer >= 0 && diasParaVencer <= 30;

                                            return (
                                                <div
                                                    key={index}
                                                    className={`rounded-lg p-4 border ${estaVencido
                                                            ? 'bg-red-50 border-red-200'
                                                            : estaPorVencer
                                                                ? 'bg-yellow-50 border-yellow-200'
                                                                : 'bg-white border-gray-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                                            <span>🛡️</span>
                                                            <span>{seguro.compania}</span>
                                                        </h4>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${estaVencido
                                                                ? 'bg-red-100 text-red-800'
                                                                : estaPorVencer
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-green-100 text-green-800'
                                                            }`}>
                                                            {estaVencido ? 'Vencido' : estaPorVencer ? `Vence en ${diasParaVencer} días` : 'Vigente'}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <InfoField label="N° Póliza" value={seguro.numeroPoliza} />
                                                        <InfoField label="Tipo" value={seguro.tipo?.replace('_', ' ')} />
                                                        <InfoField label="Cobertura" value={formatearMoneda(seguro.cobertura, seguro.moneda)} />
                                                        <InfoField label="Prima" value={formatearMoneda(seguro.prima, seguro.moneda)} />
                                                        <InfoField label="Fecha Inicio" value={formatearFecha(seguro.fechaInicio)} />
                                                        <InfoField label="Fecha Vencimiento" value={formatearFecha(seguro.fechaVencimiento)} />
                                                        <InfoField label="Beneficiario" value={seguro.beneficiario} className="md:col-span-2" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                                        <div className="text-5xl mb-4">🛡️</div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Sin seguros registrados</h3>
                                        <p className="text-gray-500 mb-4">Esta garantía no tiene seguros asociados.</p>
                                        {accionesDisponibles.some(a => a.key === 'agregarSeguro') && onAgregarSeguro && (
                                            <button
                                                onClick={() => onAgregarSeguro(garantia)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                Agregar Seguro
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab: Documentos */}
                        {activeTab === 'documentos' && (
                            <div className="space-y-4">
                                {garantia.documentos && garantia.documentos.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {garantia.documentos.map((doc, index) => (
                                            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                                                <div className="flex items-start gap-3">
                                                    <div className="text-2xl">📄</div>
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-gray-900">{doc.nombre || doc.tipo}</h4>
                                                        <p className="text-sm text-gray-500 capitalize">{doc.tipo?.replace('_', ' ')}</p>
                                                        <div className="mt-2 text-xs text-gray-400">
                                                            {doc.fechaEmision && <span>Emitido: {formatearFecha(doc.fechaEmision)}</span>}
                                                            {doc.fechaVencimiento && <span className="ml-2">Vence: {formatearFecha(doc.fechaVencimiento)}</span>}
                                                        </div>
                                                    </div>
                                                    {doc.url && (
                                                        <a
                                                            href={doc.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                            Ver
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                                        <div className="text-5xl mb-4">📄</div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Sin documentos</h3>
                                        <p className="text-gray-500">No hay documentos adjuntos a esta garantía.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab: Historial */}
                        {activeTab === 'historial' && (
                            <div className="space-y-4">
                                {garantia.historialEstados && garantia.historialEstados.length > 0 ? (
                                    <div className="relative">
                                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                                        <div className="space-y-4">
                                            {garantia.historialEstados.map((cambio, index) => {
                                                const estadoNuevoConfig = estadosColor[cambio.estadoNuevo] || {};
                                                return (
                                                    <div key={index} className="relative pl-10">
                                                        <div className={`absolute left-2 w-4 h-4 rounded-full ${estadoNuevoConfig.color?.split(' ')[0] || 'bg-gray-300'} border-2 border-white`}></div>
                                                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoNuevoConfig.color || 'bg-gray-100 text-gray-800'}`}>
                                                                    {estadoNuevoConfig.icono} {estadoNuevoConfig.label || cambio.estadoNuevo}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {formatearFecha(cambio.fecha)}
                                                                </span>
                                                            </div>
                                                            {cambio.estadoAnterior && (
                                                                <p className="text-sm text-gray-600">
                                                                    Cambió de <strong>{cambio.estadoAnterior}</strong> a <strong>{cambio.estadoNuevo}</strong>
                                                                </p>
                                                            )}
                                                            {cambio.motivo && (
                                                                <p className="text-sm text-gray-500 mt-1">Motivo: {cambio.motivo}</p>
                                                            )}
                                                            {cambio.responsable && (
                                                                <p className="text-xs text-gray-400 mt-1">Por: {cambio.responsable}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                                        <div className="text-5xl mb-4">📜</div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Sin historial</h3>
                                        <p className="text-gray-500">No hay cambios de estado registrados.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer con acciones */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-2">
                            {/* Acciones según estado */}
                            {accionesDisponibles.some(a => a.key === 'aprobar') && onAprobar && (
                                <button
                                    onClick={() => onAprobar(garantia)}
                                    className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
                                >
                                    <span>✅</span>
                                    <span>Aprobar</span>
                                </button>
                            )}
                            {accionesDisponibles.some(a => a.key === 'rechazar') && onRechazar && (
                                <button
                                    onClick={() => onRechazar(garantia)}
                                    className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors flex items-center gap-1"
                                >
                                    <span>❌</span>
                                    <span>Rechazar</span>
                                </button>
                            )}
                            {accionesDisponibles.some(a => a.key === 'activar') && onActivar && (
                                <button
                                    onClick={() => onActivar(garantia)}
                                    className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
                                >
                                    <span>🔒</span>
                                    <span>Activar</span>
                                </button>
                            )}
                            {accionesDisponibles.some(a => a.key === 'liberar') && onLiberar && (
                                <button
                                    onClick={() => onLiberar(garantia)}
                                    className="px-3 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 transition-colors flex items-center gap-1"
                                >
                                    <span>🔓</span>
                                    <span>Liberar</span>
                                </button>
                            )}
                            {accionesDisponibles.some(a => a.key === 'ejecutar') && onEjecutar && (
                                <button
                                    onClick={() => onEjecutar(garantia)}
                                    className="px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors flex items-center gap-1"
                                >
                                    <span>⚖️</span>
                                    <span>Ejecutar</span>
                                </button>
                            )}
                            {accionesDisponibles.some(a => a.key === 'editar') && onEditar && (
                                <button
                                    onClick={() => onEditar(garantia)}
                                    className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors flex items-center gap-1"
                                >
                                    <span>✏️</span>
                                    <span>Editar</span>
                                </button>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalDetallesGarantia;
