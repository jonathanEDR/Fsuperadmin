import React from 'react';
import { 
    usePrestamos, 
    TablaPrestamos,
    ModalPrestamo, 
    ModalCalculadoraCuota, 
    ModalTablaAmortizacion 
} from '../components/Finanzas/Prestamos';

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
            prestamoEditando,
            calculoCuota,
            tablaAmortizacion,
            
            // Formularios
            formularioPrestamo,
            formularioCalculadora,
            
            // Funciones de CRUD
            manejarSubmitPrestamo,
            cancelarPrestamo, // ✅ Nueva función para cancelar
            
            // Funciones de modales
            abrirModalNuevoPrestamo,
            abrirModalEditarPrestamo,
            cerrarModal,
            abrirModalCalculadora,
            cerrarModalCalculadora,
            cerrarModalTablaAmortizacion,
            
            // Funciones de cálculo
            calcularCuota,
            verTablaAmortizacion
        } = usePrestamos();

        return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">💰 Gestión de Préstamos</h1>
                        <p className="mt-2 text-gray-600">
                            Administra solicitudes, préstamos activos y pagos
                        </p>
                    </div>
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
                </div>
            </div>

                {/* Tabla Principal con Tarjetas de Resumen */}
                <TablaPrestamos
                    prestamos={prestamos}
                    loading={loading}
                    onEdit={abrirModalEditarPrestamo}
                    onCancel={cancelarPrestamo} // ✅ Nueva función para cancelar
                    onVerAmortizacion={verTablaAmortizacion}
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
        </div>
    );
    } catch (error) {
        console.error('🚨 Error en PrestamosPage:', error);
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <h2 className="font-bold text-lg">Error en la página de préstamos</h2>
                    <p>Por favor, revisa la consola para más detalles.</p>
                    <pre className="mt-2 text-sm">{error.message}</pre>
                </div>
            </div>
        );
    }
};

export default PrestamosPage;
