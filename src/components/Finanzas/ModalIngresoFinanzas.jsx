import React, { useState, useEffect } from 'react';
import { DollarSign, X } from 'lucide-react';
import { movimientosCajaService } from '../../services/movimientosCajaService';

const ModalIngresoFinanzas = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        monto: '',
        concepto: '',
        descripcion: '',
        categoria: 'venta_producto',
        metodoPago: {
            tipo: 'efectivo',
            detalles: {
                billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 },
                monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 },
                numeroOperacion: '',
                cuentaOrigen: '',
                banco: ''
            }
        },
        cliente: {
            nombre: '',
            documento: '',
            telefono: ''
        },
        documento: {
            tipo: 'boleta',
            numero: '',
            serie: ''
        },
        observaciones: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [categorias, setCategorias] = useState({
        ingresos: [
            { value: 'venta_producto', label: 'Venta de Productos' },
            { value: 'venta_servicio', label: 'Venta de Servicios' },
            { value: 'cobro_cliente', label: 'Cobro a Cliente' },
            { value: 'prestamo_recibido', label: 'Préstamo Recibido' },
            { value: 'devolucion', label: 'Devolución' },
            { value: 'otros_ingresos', label: 'Otros Ingresos' }
        ]
    });
    const [metodosPago, setMetodosPago] = useState([
        { value: 'efectivo', label: 'Efectivo', icon: '💵' },
        { value: 'yape', label: 'Yape', icon: '📱' },
        { value: 'plin', label: 'Plin', icon: '📲' },
        { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
        { value: 'tarjeta', label: 'Tarjeta', icon: '💳' }
    ]);
    const [totalCalculado, setTotalCalculado] = useState(0);
    const [mostrarInfoAdicional, setMostrarInfoAdicional] = useState(false);
    
    // Cargar opciones
    useEffect(() => {
        if (isOpen) {
            // Cargar opciones del servidor de manera asíncrona (opcional - no bloquea)
            cargarOpciones().catch(() => {
                console.log('Usando opciones por defecto');
            });
            
            // Reset form when modal opens
            setFormData({
                monto: '',
                concepto: '',
                descripcion: '',
                categoria: 'venta_producto',
                metodoPago: {
                    tipo: 'efectivo',
                    detalles: {
                        billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 },
                        monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 },
                        numeroOperacion: '',
                        cuentaOrigen: '',
                        banco: ''
                    }
                },
                cliente: {
                    nombre: '',
                    documento: '',
                    telefono: ''
                },
                documento: {
                    tipo: 'boleta',
                    numero: '',
                    serie: ''
                },
                observaciones: ''
            });
        }
    }, [isOpen]);
    
    // Calcular total de efectivo automáticamente
    useEffect(() => {
        if (formData.metodoPago.tipo === 'efectivo') {
            const billetes = formData.metodoPago.detalles.billetes || {};
            const monedas = formData.metodoPago.detalles.monedas || {};
            
            const totalBilletes = 
                (billetes.b200 || 0) * 200 +
                (billetes.b100 || 0) * 100 +
                (billetes.b50 || 0) * 50 +
                (billetes.b20 || 0) * 20 +
                (billetes.b10 || 0) * 10;
            
            const totalMonedas = 
                (monedas.m5 || 0) * 5 +
                (monedas.m2 || 0) * 2 +
                (monedas.m1 || 0) * 1 +
                (monedas.c50 || 0) * 0.5 +
                (monedas.c20 || 0) * 0.2 +
                (monedas.c10 || 0) * 0.1;
            
            setTotalCalculado(totalBilletes + totalMonedas);
        }
    }, [formData.metodoPago.detalles, formData.metodoPago.tipo]);
    
    const cargarOpciones = async () => {
        try {
            console.log('� Cargando opciones del modal...');
            
            const [categoriasRes, metodosPagoRes] = await Promise.all([
                movimientosCajaService.obtenerCategorias(),
                movimientosCajaService.obtenerMetodosPago()
            ]);
            
            console.log('� Respuesta del servidor - Categorías:', categoriasRes);
            console.log('� Respuesta del servidor - Métodos de Pago:', metodosPagoRes);
            
            // Procesar categorías
            if (categoriasRes.success && categoriasRes.data && categoriasRes.data.ingresos) {
                const categoriasFormateadas = {
                    ingresos: categoriasRes.data.ingresos.map(cat => ({
                        value: cat,
                        label: formatearLabelCategoria(cat)
                    }))
                };
                setCategorias(categoriasFormateadas);
                console.log('✅ Categorías configuradas desde servidor');
            }
            
            // Procesar métodos de pago
            if (metodosPagoRes.success && metodosPagoRes.data && Array.isArray(metodosPagoRes.data)) {
                const metodosPagoFormateados = metodosPagoRes.data.map(metodo => ({
                    value: metodo,
                    label: formatearLabelMetodoPago(metodo),
                    icon: obtenerIconoMetodoPago(metodo)
                }));
                setMetodosPago(metodosPagoFormateados);
                console.log('✅ Métodos de pago configurados desde servidor');
            }
            
        } catch (error) {
            console.log('⚠️ Error al cargar del servidor, usando opciones por defecto:', error.message);
            // No hacer nada - mantener las opciones por defecto que ya están configuradas
        }
    };
    
    // Funciones auxiliares para formatear datos del servidor
    const formatearLabelCategoria = (categoria) => {
        const labels = {
            'venta_producto': 'Venta de Producto',
            'venta_servicio': 'Venta de Servicio',
            'cobro_cliente': 'Cobro a Cliente',
            'prestamo_recibido': 'Préstamo Recibido',
            'devolucion': 'Devolución',
            'otros_ingresos': 'Otros Ingresos'
        };
        return labels[categoria] || categoria;
    };
    
    const formatearLabelMetodoPago = (metodo) => {
        const labels = {
            'efectivo': 'Efectivo',
            'yape': 'Yape',
            'plin': 'Plin',
            'transferencia': 'Transferencia',
            'tarjeta': 'Tarjeta'
        };
        return labels[metodo] || metodo;
    };
    
    const obtenerIconoMetodoPago = (metodo) => {
        const iconos = {
            'efectivo': '💵',
            'yape': '📱',
            'plin': '📲',
            'transferencia': '🏦',
            'tarjeta': '💳'
        };
        return iconos[metodo] || '💰';
    };
    
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    
    const handleNestedChange = (path, value) => {
        setFormData(prev => {
            const keys = path.split('.');
            const newData = { ...prev };
            let current = newData;
            
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }
            
            current[keys[keys.length - 1]] = value;
            return newData;
        });
    };
    
    const handleBilleteMonedaChange = (tipo, denominacion, operation) => {
        const path = `metodoPago.detalles.${tipo}.${denominacion}`;
        const currentValue = formData.metodoPago.detalles[tipo][denominacion] || 0;
        const newValue = operation === 'add' ? currentValue + 1 : Math.max(0, currentValue - 1);
        handleNestedChange(path, newValue);
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validaciones
        if (!formData.monto || parseFloat(formData.monto) <= 0) {
            alert('Por favor ingresa un monto válido');
            return;
        }
        
        if (!formData.concepto.trim()) {
            alert('Por favor ingresa un concepto');
            return;
        }
        
        // Validar efectivo si aplica
        if (formData.metodoPago.tipo === 'efectivo') {
            if (totalCalculado !== parseFloat(formData.monto)) {
                const confirmar = window.confirm(
                    `El desglose de efectivo (S/ ${totalCalculado.toFixed(2)}) no coincide con el monto ingresado (S/ ${parseFloat(formData.monto).toFixed(2)}). ¿Deseas continuar?`
                );
                if (!confirmar) return;
            }
        }
        
        setLoading(true);
        
        try {
            const dataToSend = {
                ...formData,
                monto: parseFloat(formData.monto),
                tipo: 'ingreso'
            };
            
            const response = await movimientosCajaService.registrarIngreso(dataToSend);
            
            if (response.success) {
                alert('✅ Ingreso registrado exitosamente');
                onSuccess && onSuccess();
                onClose(); // Cerrar modal después del éxito
            } else {
                alert(`❌ Error: ${response.message}`);
            }
            
        } catch (error) {
            console.error('Error registrando ingreso:', error);
            alert(`❌ Error: ${error.message || 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                        Registrar Ingreso
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Columna 1: Información Principal */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-gray-900 border-b pb-2">
                                📝 Información Principal
                            </h3>
                            
                            {/* Monto y Concepto en 2 columnas */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        Monto *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={formData.monto}
                                        onChange={(e) => handleInputChange('monto', e.target.value)}
                                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        Concepto *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.concepto}
                                        onChange={(e) => handleInputChange('concepto', e.target.value)}
                                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        placeholder="Concepto del ingreso"
                                        required
                                    />
                                </div>
                            </div>
                            
                            {/* Descripción a ancho completo */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Descripción
                                </label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    rows="2"
                                    placeholder="Descripción detallada"
                                />
                            </div>
                            
                            {/* Tipo de Pago y Categoría en 2 columnas */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        Tipo de Pago *
                                    </label>
                                    <select
                                        value={formData.metodoPago.tipo}
                                        onChange={(e) => handleNestedChange('metodoPago.tipo', e.target.value)}
                                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium"
                                        required
                                    >
                                        {metodosPago.map(metodo => (
                                            <option key={metodo.value} value={metodo.value}>
                                                {metodo.icon} {metodo.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        Categoría *
                                    </label>
                                    <select
                                        value={formData.categoria}
                                        onChange={(e) => handleInputChange('categoria', e.target.value)}
                                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium"
                                        required
                                    >
                                        {categorias.ingresos?.map(cat => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            {/* Detalles según método de pago */}
                            {(formData.metodoPago.tipo === 'yape' || formData.metodoPago.tipo === 'plin') && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        Número de Operación
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.metodoPago.detalles.numeroOperacion}
                                        onChange={(e) => handleNestedChange('metodoPago.detalles.numeroOperacion', e.target.value)}
                                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        placeholder="Número de operación"
                                    />
                                </div>
                            )}
                            
                            {formData.metodoPago.tipo === 'transferencia' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                                            Número de Operación
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.metodoPago.detalles.numeroOperacion}
                                            onChange={(e) => handleNestedChange('metodoPago.detalles.numeroOperacion', e.target.value)}
                                            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="Número de operación"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                                            Banco
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.metodoPago.detalles.banco}
                                            onChange={(e) => handleNestedChange('metodoPago.detalles.banco', e.target.value)}
                                            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="Nombre del banco"
                                        />
                                    </div>
                                </div>
                            )}
                            
                            {/* Botón para mostrar/ocultar información adicional */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => setMostrarInfoAdicional(!mostrarInfoAdicional)}
                                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                                >
                                    <span className="flex items-center">
                                        📋 Información Adicional (Opcional)
                                    </span>
                                    <span className={`transform transition-transform ${mostrarInfoAdicional ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                </button>
                            </div>
                            
                            {/* Información Adicional Colapsable */}
                            {mostrarInfoAdicional && (
                                <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                                            Cliente
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.cliente.nombre}
                                            onChange={(e) => handleNestedChange('cliente.nombre', e.target.value)}
                                            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="Nombre del cliente"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                DNI/RUC
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.cliente.documento}
                                                onChange={(e) => handleNestedChange('cliente.documento', e.target.value)}
                                                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                placeholder="DNI/RUC"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                Teléfono
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.cliente.telefono}
                                                onChange={(e) => handleNestedChange('cliente.telefono', e.target.value)}
                                                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                placeholder="Teléfono"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                Tipo de Documento
                                            </label>
                                            <select
                                                value={formData.documento.tipo}
                                                onChange={(e) => handleNestedChange('documento.tipo', e.target.value)}
                                                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium"
                                            >
                                                <option value="boleta">Boleta</option>
                                                <option value="factura">Factura</option>
                                                <option value="recibo">Recibo</option>
                                                <option value="nota_venta">Nota de Venta</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                N° Documento
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.documento.numero}
                                                onChange={(e) => handleNestedChange('documento.numero', e.target.value)}
                                                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                placeholder="Número"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                                            Serie del Documento
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.documento.serie}
                                            onChange={(e) => handleNestedChange('documento.serie', e.target.value)}
                                            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="Serie del documento"
                                        />
                                    </div>
                                </div>
                            )}
                            
                            {/* Observaciones */}
                            <div className="pt-2">
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Observaciones
                                </label>
                                <textarea
                                    value={formData.observaciones}
                                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    rows="2"
                                    placeholder="Observaciones adicionales"
                                />
                            </div>
                            
                            {/* Botones */}
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-base font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-base font-semibold bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? 'Registrando...' : 'Registrar Ingreso'}
                                </button>
                            </div>
                        </div>
                        
                        {/* Columna 2: Desglose de Efectivo (Solo cuando es efectivo) */}
                        {formData.metodoPago.tipo === 'efectivo' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-base text-gray-900">💵 Desglose de Efectivo</h3>
                                    <div className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-bold">
                                        S/ {totalCalculado.toFixed(2)}
                                    </div>
                                </div>
                                
                                {/* Billetes Ultra Compactos */}
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold text-gray-800 flex items-center">
                                            � Billetes
                                        </h4>
                                        <span className="text-xs text-green-700 font-bold bg-green-100 px-2 py-1 rounded">
                                            S/ {[
                                                { key: 'b200', valor: 200 },
                                                { key: 'b100', valor: 100 },
                                                { key: 'b50', valor: 50 },
                                                { key: 'b20', valor: 20 },
                                                { key: 'b10', valor: 10 }
                                            ].reduce((sum, b) => sum + ((formData.metodoPago.detalles.billetes[b.key] || 0) * b.valor), 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-1">
                                        {[
                                            { key: 'b200', valor: 200, label: 'S/ 200', color: 'bg-purple-500', textColor: 'text-purple-900' },
                                            { key: 'b100', valor: 100, label: 'S/ 100', color: 'bg-blue-500', textColor: 'text-blue-900' },
                                            { key: 'b50', valor: 50, label: 'S/ 50', color: 'bg-orange-500', textColor: 'text-orange-900' },
                                            { key: 'b20', valor: 20, label: 'S/ 20', color: 'bg-green-500', textColor: 'text-green-900' },
                                            { key: 'b10', valor: 10, label: 'S/ 10', color: 'bg-red-500', textColor: 'text-red-900' }
                                        ].map(billete => {
                                            const cantidad = formData.metodoPago.detalles.billetes[billete.key] || 0;
                                            const subtotal = cantidad * billete.valor;
                                            return (
                                                <div key={billete.key} className="flex items-center justify-between bg-white p-1.5 rounded border shadow-sm">
                                                    <div className="flex items-center space-x-2">
                                                        <div className={`w-4 h-3 rounded ${billete.color} border`}></div>
                                                        <span className={`text-sm font-bold ${billete.textColor}`}>{billete.label}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleBilleteMonedaChange('billetes', billete.key, 'subtract')}
                                                            className="w-5 h-5 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-200 transition-colors"
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-8 text-center text-sm font-bold text-gray-800">{cantidad}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleBilleteMonedaChange('billetes', billete.key, 'add')}
                                                            className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold hover:bg-green-200 transition-colors"
                                                        >
                                                            +
                                                        </button>
                                                        <span className="text-xs text-green-700 font-bold min-w-[45px] text-right bg-green-50 px-1 py-0.5 rounded">
                                                            S/ {subtotal.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                
                                {/* Monedas Ultra Compactas */}
                                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-3 rounded-lg border">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold text-gray-800 flex items-center">
                                            🪙 Monedas
                                        </h4>
                                        <span className="text-xs text-amber-700 font-bold bg-amber-100 px-2 py-1 rounded">
                                            S/ {[
                                                { key: 'm5', valor: 5 },
                                                { key: 'm2', valor: 2 },
                                                { key: 'm1', valor: 1 },
                                                { key: 'c50', valor: 0.5 },
                                                { key: 'c20', valor: 0.2 },
                                                { key: 'c10', valor: 0.1 }
                                            ].reduce((sum, m) => sum + ((formData.metodoPago.detalles.monedas[m.key] || 0) * m.valor), 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-1">
                                        {[
                                            { key: 'm5', valor: 5, label: '5 soles', color: 'bg-yellow-500', textColor: 'text-yellow-900' },
                                            { key: 'm2', valor: 2, label: '2 soles', color: 'bg-gray-500', textColor: 'text-gray-900' },
                                            { key: 'm1', valor: 1, label: '1 sol', color: 'bg-yellow-400', textColor: 'text-yellow-900' },
                                            { key: 'c50', valor: 0.5, label: '50 ctv', color: 'bg-gray-400', textColor: 'text-gray-900' },
                                            { key: 'c20', valor: 0.2, label: '20 ctv', color: 'bg-gray-400', textColor: 'text-gray-900' },
                                            { key: 'c10', valor: 0.1, label: '10 ctv', color: 'bg-gray-400', textColor: 'text-gray-900' }
                                        ].map(moneda => {
                                            const cantidad = formData.metodoPago.detalles.monedas[moneda.key] || 0;
                                            const subtotal = cantidad * moneda.valor;
                                            return (
                                                <div key={moneda.key} className="flex items-center justify-between bg-white p-1.5 rounded border shadow-sm">
                                                    <div className="flex items-center space-x-2">
                                                        <div className={`w-4 h-4 rounded-full ${moneda.color} border`}></div>
                                                        <span className={`text-sm font-bold ${moneda.textColor}`}>{moneda.label}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleBilleteMonedaChange('monedas', moneda.key, 'subtract')}
                                                            className="w-5 h-5 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-200 transition-colors"
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-8 text-center text-sm font-bold text-gray-800">{cantidad}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleBilleteMonedaChange('monedas', moneda.key, 'add')}
                                                            className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold hover:bg-green-200 transition-colors"
                                                        >
                                                            +
                                                        </button>
                                                        <span className="text-xs text-amber-700 font-bold min-w-[45px] text-right bg-amber-50 px-1 py-0.5 rounded">
                                                            S/ {subtotal.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                
                                {/* Botones de Acción Compactos */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                metodoPago: {
                                                    ...prev.metodoPago,
                                                    detalles: {
                                                        ...prev.metodoPago.detalles,
                                                        billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 },
                                                        monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 }
                                                    }
                                                }
                                            }));
                                        }}
                                        className="px-3 py-2 bg-gray-500 text-white rounded text-sm font-semibold hover:bg-gray-600 transition-colors flex items-center justify-center"
                                    >
                                        🗑️ Limpiar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const monto = parseFloat(formData.monto) || 0;
                                            let restante = monto;
                                            const nuevos = { billetes: {}, monedas: {} };
                                            
                                            // Calcular distribución automática
                                            [
                                                { key: 'b200', valor: 200, tipo: 'billetes' },
                                                { key: 'b100', valor: 100, tipo: 'billetes' },
                                                { key: 'b50', valor: 50, tipo: 'billetes' },
                                                { key: 'b20', valor: 20, tipo: 'billetes' },
                                                { key: 'b10', valor: 10, tipo: 'billetes' },
                                                { key: 'm5', valor: 5, tipo: 'monedas' },
                                                { key: 'm2', valor: 2, tipo: 'monedas' },
                                                { key: 'm1', valor: 1, tipo: 'monedas' },
                                                { key: 'c50', valor: 0.5, tipo: 'monedas' },
                                                { key: 'c20', valor: 0.2, tipo: 'monedas' },
                                                { key: 'c10', valor: 0.1, tipo: 'monedas' }
                                            ].forEach(denominacion => {
                                                const cantidad = Math.floor(restante / denominacion.valor);
                                                if (cantidad > 0) {
                                                    nuevos[denominacion.tipo][denominacion.key] = cantidad;
                                                    restante = Math.round((restante - (cantidad * denominacion.valor)) * 100) / 100;
                                                }
                                            });
                                            
                                            setFormData(prev => ({
                                                ...prev,
                                                metodoPago: {
                                                    ...prev.metodoPago,
                                                    detalles: {
                                                        ...prev.metodoPago.detalles,
                                                        billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, ...nuevos.billetes },
                                                        monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0, ...nuevos.monedas }
                                                    }
                                                }
                                            }));
                                        }}
                                        className="px-3 py-2 bg-blue-500 text-white rounded text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center"
                                    >
                                        🎯 Auto
                                    </button>
                                </div>
                                
                                {/* Alerta de Diferencia Compacta */}
                                {parseFloat(formData.monto) > 0 && totalCalculado !== parseFloat(formData.monto) && (
                                    <div className="p-2 bg-gradient-to-r from-yellow-100 to-orange-100 border-l-4 border-yellow-500 rounded text-xs">
                                        <div className="flex items-center justify-between text-yellow-800">
                                            <span className="flex items-center font-semibold">
                                                <span className="mr-1">⚠️</span>
                                                Diferencia:
                                            </span>
                                            <span className="font-bold text-orange-700">
                                                S/ {Math.abs(totalCalculado - parseFloat(formData.monto)).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalIngresoFinanzas;
