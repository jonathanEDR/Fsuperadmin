import { finanzasService } from '../../../services/finanzasService';

// ========== VALIDACIONES ==========
export const validacionesCuenta = {
    nombre: (valor) => !valor ? 'El nombre es requerido' : '',
    banco: (valor) => !valor ? 'El banco es requerido' : '',
    tipoCuenta: (valor) => !valor ? 'El tipo de cuenta es requerido' : '',
    numeroCuenta: (valor) => !valor ? 'El número de cuenta es requerido' : '',
    moneda: (valor) => !valor ? 'La moneda es requerida' : '',
    titular: (valor) => !valor ? 'El titular es requerido' : '',
    saldoInicial: (valor) => {
        // Permitir 0 como valor válido
        if (valor === '' || valor === null || valor === undefined) return 'El saldo inicial es requerido';
        if (isNaN(valor) || parseFloat(valor) < 0) return 'El saldo inicial no puede ser negativo';
        return '';
    }
};

export const validacionesMovimiento = {
    monto: (valor) => {
        if (!valor || isNaN(valor) || parseFloat(valor) <= 0) {
            return 'El monto debe ser mayor a cero';
        }
        return '';
    },
    descripcion: (valor) => !valor ? 'La descripción es requerida' : ''
};

// ========== FORMULARIOS INICIALES ==========
export const formularioInicialCuenta = {
    nombre: '',
    banco: '',
    tipoCuenta: 'ahorros',  // Valor por defecto válido
    numeroCuenta: '',
    moneda: 'PEN',
    saldoInicial: 0,        // Valor numérico en lugar de string
    titular: '',
    descripcion: '',
    alertas: {
        saldoMinimo: 0,
        notificarMovimientos: true
    }
};

export const formularioInicialMovimiento = {
    monto: '',
    descripcion: '',
    referencia: '',
    categoria: ''
};

// ========== CONFIGURACIÓN DE COLUMNAS ==========
export const obtenerColumnas = () => [
    { 
        key: 'codigo', 
        titulo: 'Código', 
        ordenable: true,
        render: (valor) => `Código: ${valor}`
    },
    { key: 'nombre', titulo: 'Nombre', ordenable: true },
    { key: 'banco', titulo: 'Banco' },
    { key: 'tipoCuenta', titulo: 'Tipo' },
    { 
        key: 'numeroCuenta', 
        titulo: 'Número',
        render: (valor) => `***${valor.slice(-4)}`
    },
    { 
        key: 'saldoActual', 
        titulo: 'Saldo',
        render: (valor, fila) => (
            `${fila.moneda} ${valor.toFixed(2)}`
        )
    },
    { 
        key: 'ultimoMovimiento', 
        titulo: 'Último Movimiento',
        render: (valor, fila) => {
            if (fila.ultimoMovimiento) {
                const fecha = new Date(fila.ultimoMovimiento.fecha).toLocaleDateString();
                const origen = fila.ultimoMovimiento.origen || 'Manual';
                return `${fecha} - ${origen}`;
            }
            return 'Sin movimientos';
        }
    },
    { 
        key: 'moneda', 
        titulo: 'Moneda'
    },
    { 
        key: 'activa', 
        titulo: 'Estado', 
        tipo: 'estado',
        render: (valor) => valor ? 'Activa' : 'Inactiva'
    }
];

// ========== CONFIGURACIÓN DE ACCIONES ==========
export const obtenerAcciones = (callbacks) => [
    {
        label: 'Ver Movimientos',
        icono: '�',
        color: 'green',
        handler: (cuenta) => callbacks.verMovimientosCuenta && callbacks.verMovimientosCuenta(cuenta)
    },
    {
        label: 'Editar',
        icono: '✏️',
        color: 'blue',
        handler: (cuenta) => callbacks.abrirModalEditarCuenta(cuenta)
    },
    {
        label: 'Eliminar',
        icono: '🗑️',
        color: 'red',
        handler: (cuenta) => callbacks.eliminarCuenta(cuenta)
    }
];

// ========== CONSTANTES ==========
export const categoriasMovimiento = [
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'deposito', label: 'Depósito' },
    { value: 'retiro', label: 'Retiro' },
    { value: 'pago', label: 'Pago' },
    { value: 'cobro', label: 'Cobro' },
    { value: 'ajuste', label: 'Ajuste' }
];

export const opcionesEstado = [
    { value: 'true', label: 'Activas' },
    { value: 'false', label: 'Inactivas' }
];

// ========== FILTROS INICIALES ==========
export const filtrosIniciales = {
    banco: '',
    tipoCuenta: '',
    moneda: '',
    activa: ''
};

// ========== PAGINACIÓN INICIAL ==========
export const paginacionInicial = {
    paginaActual: 1,
    limite: 20
};
