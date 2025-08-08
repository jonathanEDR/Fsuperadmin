import { useState, useEffect, useCallback } from 'react';
import { useFormularioCuentasBancarias } from './useFormularioCuentasBancarias';
import { cuentasBancariasService, finanzasService } from '../../../services/finanzasService';
import {
    validacionesCuenta,
    validacionesMovimiento,
    formularioInicialCuenta,
    formularioInicialMovimiento,
    filtrosIniciales,
    paginacionInicial
} from './cuentasBancariasConfig';

export const useCuentasBancarias = () => {
    // ========== ESTADOS PRINCIPALES ==========
    const [cuentas, setCuentas] = useState([]);
    const [resumenCuentas, setResumenCuentas] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // ========== ESTADOS DE MODALES ==========
    const [modalAbierto, setModalAbierto] = useState(false);
    const [cuentaEditando, setCuentaEditando] = useState(null);
    
    // ========== ESTADOS DE FILTROS Y PAGINACIÓN ==========
    const [filtros, setFiltros] = useState(filtrosIniciales);
    const [paginacion, setPaginacion] = useState(paginacionInicial);
    
    // ========== FORMULARIOS ==========
    const formularioCuenta = useFormularioCuentasBancarias(formularioInicialCuenta, validacionesCuenta);
    
    // ========== FUNCIONES DE CARGA DE DATOS ==========
    const cargarCuentas = useCallback(async () => {
        try {
            setLoading(true);
            const response = await cuentasBancariasService.obtenerTodos({
                ...filtros,
                page: paginacion.paginaActual,
                limit: paginacion.limite
            });
            
            // Manejar diferentes formatos de respuesta
            const cuentasData = response.data.data || response.data.cuentas || response.data || [];
            const cuentasArray = Array.isArray(cuentasData) ? cuentasData : [];
            
            // Solo mostrar cantidad en desarrollo
            if (process.env.NODE_ENV === 'development') {
                console.log('📋 Cuentas cargadas:', cuentasArray.length);
            }
            
            setCuentas(cuentasArray);
            
            // Solo actualizar metadatos de paginación si vienen del servidor
            if (response.data.paginacion) {
                setPaginacion(prev => ({
                    ...prev,
                    total: response.data.paginacion.total,
                    totalPaginas: response.data.paginacion.totalPaginas
                }));
            }
        } catch (error) {
            console.error('Error cargando cuentas:', error);
        } finally {
            setLoading(false);
        }
    }, [filtros, paginacion.paginaActual, paginacion.limite]);

    const cargarResumen = useCallback(async () => {
        try {
            const response = await finanzasService.obtenerResumenCuentasBancarias();
            if (process.env.NODE_ENV === 'development') {
                console.log('📊 Resumen cuentas cargado:', response.data?.length || 'Sin datos');
            }
            setResumenCuentas(response.data);
        } catch (error) {
            console.error('❌ Error cargando resumen:', error);
        }
    }, []);

    // ========== EFFECTS ==========
    useEffect(() => {
        cargarCuentas();
    }, [cargarCuentas]);

    useEffect(() => {
        cargarResumen();
    }, [cargarResumen]);

    useEffect(() => {
        cargarResumen();
    }, [cargarResumen]);

    // ========== FUNCIONES DE MODALES ==========
    const abrirModalNuevaCuenta = () => {
        setCuentaEditando(null);
        formularioCuenta.resetear();
        setModalAbierto(true);
    };

    const abrirModalEditarCuenta = (cuenta) => {
        setCuentaEditando(cuenta);
        formularioCuenta.setValores({
            nombre: cuenta.nombre,
            banco: cuenta.banco,
            tipoCuenta: cuenta.tipoCuenta,
            numeroCuenta: cuenta.numeroCuenta,
            moneda: cuenta.moneda,
            saldoInicial: cuenta.saldoInicial,
            titular: cuenta.titular,
            descripcion: cuenta.descripcion || '',
            alertas: cuenta.alertas || {
                saldoMinimo: 0,
                notificarMovimientos: true
            }
        });
        setModalAbierto(true);
    };

    const cerrarModalCuenta = () => {
        setModalAbierto(false);
        setCuentaEditando(null);
    };

    // ========== FUNCIONES DE SUBMIT ==========
    const manejarSubmitCuenta = async (e) => {
        e.preventDefault();
        
        if (!formularioCuenta.validarFormulario()) {
            return;
        }

        try {
            // Convertir saldoInicial a número antes de enviar
            const datosParaEnviar = {
                ...formularioCuenta.valores,
                saldoInicial: parseFloat(formularioCuenta.valores.saldoInicial) || 0
            };
            
            if (cuentaEditando) {
                const response = await cuentasBancariasService.actualizar(cuentaEditando._id, datosParaEnviar);
            } else {
                const response = await cuentasBancariasService.crear(datosParaEnviar);
            }
            
            cerrarModalCuenta();
            cargarCuentas();
            cargarResumen();
        } catch (error) {
            console.error('❌ Error guardando cuenta:', error);
            console.error('Detalles del error:', error.response?.data);
            // Mostrar mensaje de error al usuario
            alert(`Error: ${error.response?.data?.message || error.message}`);
        }
    };

    // ========== FUNCIÓN DE ELIMINACIÓN ==========
    const eliminarCuenta = async (cuenta) => {
        if (window.confirm(`¿Estás seguro de eliminar la cuenta ${cuenta.nombre}?`)) {
            try {
                await cuentasBancariasService.eliminar(cuenta._id);
                cargarCuentas();
                cargarResumen();
            } catch (error) {
                console.error('Error eliminando cuenta:', error);
            }
        }
    };

    // ========== FUNCIÓN DE CAMBIO DE PÁGINA ==========
    const manejarCambioPagina = (nuevaPagina) => {
        setPaginacion(prev => ({ ...prev, paginaActual: nuevaPagina }));
    };

    // ========== RETORNO DEL HOOK ==========
    return {
        // Estados
        cuentas,
        resumenCuentas,
        loading,
        filtros,
        paginacion,
        
        // Estados de modales
        modalAbierto,
        cuentaEditando,
        
        // Formularios
        formularioCuenta,
        
        // Funciones de modales
        abrirModalNuevaCuenta,
        abrirModalEditarCuenta,
        cerrarModalCuenta,
        
        // Funciones de submit
        manejarSubmitCuenta,
        
        // Otras funciones
        eliminarCuenta,
        manejarCambioPagina,
        setFiltros,
        
        // Funciones de recarga
        cargarCuentas,
        cargarResumen
    };
};
