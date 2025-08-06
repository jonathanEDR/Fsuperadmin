import { useState, useEffect, useCallback } from 'react';
import { useFormulario } from '../CampoFormulario';
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
    const [modalMovimiento, setModalMovimiento] = useState(false);
    const [cuentaEditando, setCuentaEditando] = useState(null);
    const [cuentaMovimiento, setCuentaMovimiento] = useState(null);
    const [tipoMovimiento, setTipoMovimiento] = useState('deposito');
    
    // ========== ESTADOS DE FILTROS Y PAGINACIÓN ==========
    const [filtros, setFiltros] = useState(filtrosIniciales);
    const [paginacion, setPaginacion] = useState(paginacionInicial);
    
    // ========== FORMULARIOS ==========
    const formularioCuenta = useFormulario(formularioInicialCuenta, validacionesCuenta);
    const formularioMovimiento = useFormulario(formularioInicialMovimiento, validacionesMovimiento);
    
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
            
            // Debug: verificar estructura de datos
            console.log('🔍 Debug cuentas data:', {
                responseData: response.data,
                cuentasData: cuentasData,
                primeraAccount: cuentasArray[0],
                saldoExample: cuentasArray[0]?.saldoActual
            });
            
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
            console.log('🔍 Cargando resumen de cuentas bancarias...');
            const response = await finanzasService.obtenerResumenCuentasBancarias();
            console.log('📊 Resumen obtenido:', response);
            console.log('📊 Datos del resumen:', response.data);
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

    const abrirModalMovimiento = (cuenta, tipo) => {
        setCuentaMovimiento(cuenta);
        setTipoMovimiento(tipo);
        formularioMovimiento.resetear();
        setModalMovimiento(true);
    };

    const cerrarModalCuenta = () => {
        setModalAbierto(false);
        setCuentaEditando(null);
    };

    const cerrarModalMovimiento = () => {
        setModalMovimiento(false);
        setCuentaMovimiento(null);
    };

    // ========== FUNCIONES DE SUBMIT ==========
    const manejarSubmitCuenta = async (e) => {
        e.preventDefault();
        
        console.log('🔍 Valores del formulario antes de validar:', formularioCuenta.valores);
        
        if (!formularioCuenta.validarFormulario()) {
            console.log('❌ Errores de validación:', formularioCuenta.errores);
            return;
        }

        try {
            // Convertir saldoInicial a número antes de enviar
            const datosParaEnviar = {
                ...formularioCuenta.valores,
                saldoInicial: parseFloat(formularioCuenta.valores.saldoInicial) || 0
            };
            
            console.log('📤 Enviando datos al servidor:', datosParaEnviar);
            
            if (cuentaEditando) {
                const response = await cuentasBancariasService.actualizar(cuentaEditando._id, datosParaEnviar);
                console.log('✅ Cuenta actualizada:', response);
            } else {
                const response = await cuentasBancariasService.crear(datosParaEnviar);
                console.log('✅ Cuenta creada:', response);
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

    const manejarSubmitMovimiento = async (e) => {
        e.preventDefault();
        if (!formularioMovimiento.validarFormulario()) return;

        try {
            const datos = {
                ...formularioMovimiento.valores,
                monto: parseFloat(formularioMovimiento.valores.monto)
            };

            if (tipoMovimiento === 'deposito') {
                await cuentasBancariasService.realizarDeposito(cuentaMovimiento._id, datos);
            } else {
                await cuentasBancariasService.realizarRetiro(cuentaMovimiento._id, datos);
            }
            
            cerrarModalMovimiento();
            cargarCuentas();
            cargarResumen();
        } catch (error) {
            console.error('Error procesando movimiento:', error);
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
        modalMovimiento,
        cuentaEditando,
        cuentaMovimiento,
        tipoMovimiento,
        
        // Formularios
        formularioCuenta,
        formularioMovimiento,
        
        // Funciones de modales
        abrirModalNuevaCuenta,
        abrirModalEditarCuenta,
        abrirModalMovimiento,
        cerrarModalCuenta,
        cerrarModalMovimiento,
        
        // Funciones de submit
        manejarSubmitCuenta,
        manejarSubmitMovimiento,
        
        // Otras funciones
        eliminarCuenta,
        manejarCambioPagina,
        setFiltros,
        
        // Funciones de recarga
        cargarCuentas,
        cargarResumen
    };
};
