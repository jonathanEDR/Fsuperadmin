import React from 'react';
import { 
    usePrestamos, 
    TablaPrestamos,
    ModalPrestamo, 
    ModalCalculadoraCuota, 
    ModalTablaAmortizacion 
} from '../components/Finanzas/Prestamos';
import FinanzasLayout from '../components/Finanzas/common/FinanzasLayout';

const PrestamosPage = () => {
    try {
        const {
            // Estado
            prestamos,
            loading,
            
            // Modales
            modalAbierto,
            modalCalculadora,
            modalTablaAmortizacion,
            modalDetallesPrestamo,
            prestamoEditando,
            prestamoViendoDetalles,
            calculoCuota,
            tablaAmortizacion,
            
            // Formularios
            formularioPrestamo,
            formularioCalculadora,
            
            // Funciones de CRUD
            manejarSubmitPrestamo,
            cancelarPrestamo, // ✅ Nueva función para cancelar
            eliminarPrestamo, // ✅ Nueva función para eliminar
            
            // Funciones de modales
            abrirModalNuevoPrestamo,
            abrirModalEditarPrestamo,
            cerrarModal,
            abrirModalCalculadora,
            cerrarModalCalculadora,
            cerrarModalTablaAmortizacion,
            abrirModalDetallesPrestamo,
            cerrarModalDetallesPrestamo,
            
            // Funciones de cálculo
            calcularCuota,
            verTablaAmortizacion
        } = usePrestamos();

        // Acciones para la toolbar
        const actions = (
            <div className="flex space-x-3">
                <button 
                    onClick={abrirModalCalculadora}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    🧮 Calculadora
                </button>
                <button 
                    onClick={abrirModalNuevoPrestamo}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    + Nuevo Préstamo
                </button>
            </div>
        );

        return (
            <FinanzasLayout 
                currentModule="prestamos"
                title="Gestión de Préstamos"
                loading={loading}
                actions={actions}
            >

                {/* Tabla Principal con Tarjetas de Resumen */}
                <TablaPrestamos
                    prestamos={prestamos}
                    loading={loading}
                    onEdit={abrirModalEditarPrestamo}
                    onCancel={cancelarPrestamo} // ✅ Nueva función para cancelar
                    onDelete={eliminarPrestamo} // ✅ Nueva función para eliminar
                    onVerAmortizacion={verTablaAmortizacion}
                    // Props para el modal de detalles
                    modalDetallesPrestamo={modalDetallesPrestamo}
                    prestamoViendoDetalles={prestamoViendoDetalles}
                    onAbrirModalDetalles={abrirModalDetallesPrestamo}
                    onCerrarModalDetalles={cerrarModalDetallesPrestamo}
                />

            {/* Modal Préstamo */}
            <ModalPrestamo
                isOpen={modalAbierto}
                onClose={cerrarModal}
                prestamo={prestamoEditando}
                onSubmit={manejarSubmitPrestamo}
                formulario={formularioPrestamo}
            />

            {/* Modal Calculadora */}
            <ModalCalculadoraCuota
                isOpen={modalCalculadora}
                onClose={cerrarModalCalculadora}
                onCalcular={calcularCuota}
                resultado={calculoCuota}
                formulario={formularioCalculadora}
            />

            {/* Modal Tabla de Amortización */}
            <ModalTablaAmortizacion
                isOpen={modalTablaAmortizacion}
                onClose={cerrarModalTablaAmortizacion}
                tablaAmortizacion={tablaAmortizacion}
                prestamo={prestamoEditando}
            />
        </FinanzasLayout>
    );
    } catch (error) {
        console.error('🚨 Error en PrestamosPage:', error);
        return (
            <FinanzasLayout 
                currentModule="prestamos"
                title="Gestión de Préstamos - Error"
                loading={false}
                actions={null}
            >
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <h2 className="font-bold text-lg">Error en la página de préstamos</h2>
                    <p>Por favor, revisa la consola para más detalles.</p>
                    <pre className="mt-2 text-sm">{error.message}</pre>
                </div>
            </FinanzasLayout>
        );
    }
};

export default PrestamosPage;
