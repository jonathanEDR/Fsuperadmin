import React from 'react';

// ==================== CONFIGURACIÓN DE PRÉSTAMOS ====================

// ========== COLORES Y ETIQUETAS DE ESTADOS ==========
export const estadosColor = {
    'aprobado': { color: 'bg-green-100 text-green-800', label: 'Aprobado', icono: '✅' },
    'cancelado': { color: 'bg-gray-100 text-gray-800', label: 'Cancelado', icono: '❌' }
};

// ========== VALORES INICIALES DE FORMULARIOS ==========
export const formularioInicialPrestamo = {
    entidadFinanciera: {
        nombre: '',
        codigo: '',
        tipo: 'banco'
    },
    tipoCredito: '',
    montoSolicitado: '',
    tasaInteres: {
        porcentaje: '',
        tipo: 'fija',
        periodo: 'anual'
    },
    plazo: {
        cantidad: '',
        unidad: 'meses'
    },
    proposito: '',
    observaciones: ''
};

export const formularioInicialCalculadora = {
    monto: '',
    tasaInteres: '',
    plazoMeses: ''
};

export const filtrosIniciales = {
    estado: '',
    tipoCredito: '',
    entidad: '',
    fechaInicio: '',
    fechaFin: ''
};

export const paginacionInicial = {
    paginaActual: 1,
    limite: 20
};

// ========== VALIDACIONES DE FORMULARIOS ==========
export const validacionesPrestamo = {
    'entidadFinanciera.nombre': (valor) => !valor ? 'El nombre de la entidad financiera es requerido' : '',
    tipoCredito: (valor) => !valor ? 'El tipo de crédito es requerido' : '',
    montoSolicitado: (valor) => {
        if (!valor) return 'El monto solicitado es requerido';
        if (isNaN(valor) || parseFloat(valor) <= 0) return 'Debe ser un monto válido mayor a 0';
        return '';
    },
    'tasaInteres.porcentaje': (valor) => {
        if (!valor) return 'La tasa de interés es requerida';
        if (isNaN(valor) || parseFloat(valor) <= 0 || parseFloat(valor) > 100) {
            return 'Debe ser un porcentaje válido entre 0 y 100';
        }
        return '';
    },
    'plazo.cantidad': (valor) => {
        if (!valor) return 'El plazo es requerido';
        if (isNaN(valor) || parseInt(valor) <= 0) return 'Debe ser un número válido mayor a 0';
        return '';
    }
};

export const validacionesCalculadora = {
    monto: (valor) => {
        if (!valor) return 'El monto es requerido';
        if (isNaN(valor) || parseFloat(valor) <= 0) return 'Debe ser un monto válido mayor a 0';
        return '';
    },
    tasaInteres: (valor) => {
        if (!valor) return 'La tasa de interés es requerida';
        if (isNaN(valor) || parseFloat(valor) <= 0 || parseFloat(valor) > 100) {
            return 'Debe ser un porcentaje válido entre 0 y 100';
        }
        return '';
    },
    plazoMeses: (valor) => {
        if (!valor) return 'El plazo en meses es requerido';
        if (isNaN(valor) || parseInt(valor) <= 0) return 'Debe ser un número válido mayor a 0';
        return '';
    }
};

// ========== CONFIGURACIÓN DE COLUMNAS DE TABLA ==========
export const columnasPrestamos = [
    { 
        key: 'codigo', 
        titulo: 'Código', 
        ordenable: true,
        render: (valor) => (
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {valor}
            </span>
        )
    },
    { 
        key: 'entidadFinanciera.nombre', 
        titulo: 'Entidad',
        ordenable: true
    },
    { 
        key: 'prestatario.nombre', 
        titulo: 'Prestatario',
        ordenable: true
    },
    { 
        key: 'tipo', // ✅ Corregido: usar 'tipo' en lugar de 'tipoCredito'
        titulo: 'Tipo',
        ordenable: true,
        render: (valor) => {
            const tipos = {
                'personal': 'Personal',
                'hipotecario': 'Hipotecario', 
                'vehicular': 'Vehicular',
                'comercial': 'Comercial',
                'microempresa': 'Microempresa',
                'capital_trabajo': 'Capital de Trabajo',
                'inversion': 'Inversión'
            };
            return tipos[valor] || valor;
        }
    },
    { 
        key: 'montoAprobado', 
        titulo: 'Monto Aprobado',
        render: (valor, fila) => {
            const monto = valor || fila.montoSolicitado;
            return (
                <span className="font-semibold text-green-600">
                    S/ {parseFloat(monto || 0).toLocaleString('es-PE', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                    })}
                </span>
            );
        }
    },
    { 
        key: 'tasaInteres', // ✅ Corregido: usar 'tasaInteres' directamente (no anidado)
        titulo: 'Tasa',
        render: (valor) => (
            <span className="text-blue-600 font-medium">
                {parseFloat(valor || 0).toFixed(2)}%
            </span>
        )
    },
    { 
        key: 'fechaVencimiento', 
        titulo: 'Vencimiento', 
        tipo: 'fecha',
        render: (valor) => {
            if (!valor) return '-';
            return new Date(valor).toLocaleDateString('es-PE');
        }
    },
    { 
        key: 'estado', 
        titulo: 'Estado', 
        render: (valor) => {
            const config = estadosColor[valor] || estadosColor['aprobado']; // ✅ Estado por defecto: aprobado
            return (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                    {config.label}
                </span>
            );
        }
    }
];

// ========== CONFIGURACIÓN DE ACCIONES DE TABLA (TEMPORAL - PARA DEBUG) ==========
export const accionesPrestamos = [
    {
        label: 'Editar',
        icono: '✏️',
        color: 'blue',
        handler: 'abrirModalEditarPrestamo',
        className: 'bg-blue-500 hover:bg-blue-600'
        // ⚠️ TEMPORAL: Sin condición mostrar para debug
    },
    {
        label: 'Ver Tabla',
        icono: '📊',
        color: 'purple',
        handler: 'verTablaAmortizacion',
        className: 'bg-purple-500 hover:bg-purple-600'
        // ⚠️ TEMPORAL: Sin condición mostrar para debug
    },
    {
        label: 'Cancelar',
        icono: '❌',
        color: 'red',
        handler: 'cancelarPrestamo',
        className: 'bg-red-500 hover:bg-red-600'
        // ⚠️ TEMPORAL: Sin condición mostrar para debug
    }
];

// ========== CONFIGURACIÓN DE COLUMNAS DE TABLA DE AMORTIZACIÓN ==========
export const columnasAmortizacion = [
    { 
        key: 'cuota', 
        titulo: 'Cuota',
        render: (valor) => (
            <span className="font-mono text-sm bg-blue-50 px-2 py-1 rounded">
                #{valor}
            </span>
        )
    },
    { 
        key: 'fechaPago', 
        titulo: 'Fecha', 
        tipo: 'fecha',
        render: (valor) => {
            if (!valor) return '-';
            return new Date(valor).toLocaleDateString('es-PE');
        }
    },
    { 
        key: 'capital', 
        titulo: 'Capital', 
        render: (valor) => (
            <span className="text-green-600 font-medium">
                S/ {parseFloat(valor || 0).toLocaleString('es-PE', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                })}
            </span>
        )
    },
    { 
        key: 'interes', 
        titulo: 'Interés', 
        render: (valor) => (
            <span className="text-blue-600 font-medium">
                S/ {parseFloat(valor || 0).toLocaleString('es-PE', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                })}
            </span>
        )
    },
    { 
        key: 'cuotaMensual', 
        titulo: 'Cuota Total', 
        render: (valor) => (
            <span className="text-purple-600 font-semibold">
                S/ {parseFloat(valor || 0).toLocaleString('es-PE', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                })}
            </span>
        )
    },
    { 
        key: 'saldoPendiente', 
        titulo: 'Saldo Pendiente', 
        render: (valor) => (
            <span className="text-orange-600 font-medium">
                S/ {parseFloat(valor || 0).toLocaleString('es-PE', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                })}
            </span>
        )
    }
];

// ========== OPCIONES PARA SELECTS ==========
export const opcionesTipoDocumento = [
    { value: 'DNI', label: 'DNI' },
    { value: 'RUC', label: 'RUC' },
    { value: 'CE', label: 'Carnet de Extranjería' },
    { value: 'PASAPORTE', label: 'Pasaporte' }
];

export const opcionesTipoEntidad = [
    { value: 'banco', label: 'Banco' },
    { value: 'financiera', label: 'Financiera' },
    { value: 'cooperativa', label: 'Cooperativa' },
    { value: 'caja_municipal', label: 'Caja Municipal' },
    { value: 'particular', label: 'Particular' }
];

export const opcionesTipoInteres = [
    { value: 'fija', label: 'Tasa Fija' },
    { value: 'variable', label: 'Tasa Variable' }
];

export const opcionesPeriodoInteres = [
    { value: 'anual', label: 'Anual' },
    { value: 'mensual', label: 'Mensual' }
];

export const opcionesUnidadPlazo = [
    { value: 'meses', label: 'Meses' },
    { value: 'años', label: 'Años' }
];

// ========== MENSAJES DE TEXTO ==========
export const mensajes = {
    confirmaciones: {
        cancelar: '¿Estás seguro de que quieres cancelar este préstamo? Esta acción no se puede deshacer.',
        editar: '¿Deseas editar la información de este préstamo?'
    },
    exito: {
        crear: 'Préstamo creado y aprobado exitosamente',
        actualizar: 'Préstamo actualizado exitosamente',
        cancelar: 'Préstamo cancelado exitosamente'
    },
    error: {
        cargar: 'Error al cargar los préstamos',
        crear: 'Error al crear el préstamo',
        actualizar: 'Error al actualizar el préstamo',
        cancelar: 'Error al cancelar el préstamo',
        calcular: 'Error al calcular la cuota',
        amortizacion: 'Error al obtener la tabla de amortización'
    }
};
