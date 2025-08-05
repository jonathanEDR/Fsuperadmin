import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, MinusCircle } from 'lucide-react';
import { movimientosCajaService } from '../../services/movimientosCajaService';

const ModalEgresoFinanzas = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        monto: '',
        concepto: '',
        descripcion: '',
        categoria: 'gasto_operativo',
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
        proveedor: {
            nombre: '',
            ruc: '',
            contacto: ''
        },
        documento: {
            tipo: 'recibo',
            numero: '',
            serie: ''
        },
        observaciones: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [categorias, setCategorias] = useState([]);
    const [metodosPago, setMetodosPago] = useState([]);
    const [totalCalculado, setTotalCalculado] = useState(0);
    const [mostrarInfoAdicional, setMostrarInfoAdicional] = useState(false);
    
    // Cargar opciones
    useEffect(() => {
        if (isOpen) {
            cargarOpciones();
        }
    }, [isOpen]);
    
    // Calcular total de efectivo automáticamente
    useEffect(() => {
        if (formData.metodoPago.tipo === 'efectivo') {
            const total = movimientosCajaService.constructor.calcularTotalEfectivo(
                formData.metodoPago.detalles.billetes,
                formData.metodoPago.detalles.monedas
            );
            setTotalCalculado(total);
            
            // Auto-completar monto si está vacío
            if (!formData.monto || formData.monto === '0') {
                setFormData(prev => ({
                    ...prev,
                    monto: total.toString()
                }));
            }
        }
    }, [formData.metodoPago.detalles, formData.metodoPago.tipo]);
    
    const cargarOpciones = async () => {
        try {
            // Establecer opciones por defecto primero
            setMetodosPago([
                { value: 'efectivo', label: 'Efectivo', icon: '💵' },
                { value: 'yape', label: 'Yape', icon: '📱' },
                { value: 'plin', label: 'Plin', icon: '💳' },
                { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
                { value: 'tarjeta', label: 'Tarjeta', icon: '💳' }
            ]);
            
            setCategorias({
                egresos: [
                    { value: 'gasto_operativo', label: 'Gasto Operativo' },
                    { value: 'compra_inventario', label: 'Compra de Inventario' },
                    { value: 'pago_proveedor', label: 'Pago a Proveedor' },
                    { value: 'gastos_servicios', label: 'Gastos de Servicios' },
                    { value: 'gastos_personal', label: 'Gastos de Personal' },
                    { value: 'prestamo_otorgado', label: 'Préstamo Otorgado' },
                    { value: 'otros_egresos', label: 'Otros Egresos' }
                ]
            });
            
            // Luego intentar cargar desde el servidor
            const [categoriasRes, metodosRes] = await Promise.all([
                movimientosCajaService.obtenerCategorias(),
                movimientosCajaService.obtenerMetodosPago()
            ]);
            
            if (categoriasRes.success && categoriasRes.data) {
                setCategorias(movimientosCajaService.constructor.formatearCategorias(categoriasRes.data));
            }
            
            if (metodosRes.success && metodosRes.data) {
                setMetodosPago(movimientosCajaService.constructor.formatearMetodosPago());
            }
        } catch (error) {
            console.error('Error cargando opciones:', error);
            // Mantener las opciones por defecto si hay error
        }
    };
    
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    
    const handleNestedChange = (path, value) => {
        setFormData(prev => {
            const newData = { ...prev };
            const keys = path.split('.');
            let current = newData;
            
            for (let i = 0; i < keys.length - 1; i++) {
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
            alert('El monto debe ser mayor a 0');
            return;
        }
        
        if (!formData.concepto.trim()) {
            alert('El concepto es obligatorio');
            return;
        }
        
        // Validar efectivo si aplica
        if (formData.metodoPago.tipo === 'efectivo') {
            const diferencia = Math.abs(parseFloat(formData.monto) - totalCalculado);
            if (diferencia > 0.01) {
                alert(`El desglose de efectivo (S/ ${totalCalculado.toFixed(2)}) no coincide con el monto (S/ ${parseFloat(formData.monto).toFixed(2)})`);
                return;
            }
        }
        
        try {
            setLoading(true);
            
            // Preparar datos para envío
            const dataToSend = {
                ...formData,
                monto: parseFloat(formData.monto)
            };
            
            // Limpiar campos opcionales vacíos
            if (!dataToSend.proveedor.nombre) delete dataToSend.proveedor;
            if (!dataToSend.documento.numero) delete dataToSend.documento;
            
            const response = await movimientosCajaService.registrarEgreso(dataToSend);
            
            if (response.success) {
                alert('✅ Egreso registrado exitosamente');
                onSuccess && onSuccess();
            } else {
                alert(`❌ Error: ${response.message}`);
            }
            
        } catch (error) {
            console.error('Error registrando egreso:', error);
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
                        <MinusCircle className="w-5 h-5 mr-2 text-red-600" />
                        Registrar Egreso
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
                                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium"
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
                                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="Concepto del egreso"
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
                                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium"
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
                                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium"
                                        required
                                    >
                                        {categorias.egresos?.map(cat => (
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Número de Operación
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.metodoPago.detalles.numeroOperacion}
                                        onChange={(e) => handleNestedChange('metodoPago.detalles.numeroOperacion', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="Número de operación"
                                    />
                                </div>
                            )}
                            
                            {formData.metodoPago.tipo === 'transferencia' && (
                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Número de Operación
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.metodoPago.detalles.numeroOperacion}
                                            onChange={(e) => handleNestedChange('metodoPago.detalles.numeroOperacion', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                            placeholder="Número de operación"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Banco
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.metodoPago.detalles.banco}
                                            onChange={(e) => handleNestedChange('metodoPago.detalles.banco', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                                            Proveedor
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.proveedor.nombre}
                                            onChange={(e) => handleNestedChange('proveedor.nombre', e.target.value)}
                                            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                            placeholder="Nombre del proveedor"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                RUC
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.proveedor.ruc}
                                                onChange={(e) => handleNestedChange('proveedor.ruc', e.target.value)}
                                                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                placeholder="RUC"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                Contacto
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.proveedor.contacto}
                                                onChange={(e) => handleNestedChange('proveedor.contacto', e.target.value)}
                                                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                placeholder="Teléfono/Email"
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
                                                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium"
                                            >
                                                <option value="recibo">Recibo</option>
                                                <option value="factura">Factura</option>
                                                <option value="boleta">Boleta</option>
                                                <option value="nota_credito">Nota de Crédito</option>
                                                <option value="nota_debito">Nota de Débito</option>
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
                                                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                                            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                                    className="px-4 py-2 text-base font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? 'Registrando...' : 'Registrar Egreso'}
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
                                
                                {/* Billetes Compactos */}
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-medium text-gray-700">📄 Billetes</h4>
                                        <span className="text-xs text-green-600 font-medium">
                                            S/ {[
                                                { key: 'b200', valor: 200 },
                                                { key: 'b100', valor: 100 },
                                                { key: 'b50', valor: 50 },
                                                { key: 'b20', valor: 20 },
                                                { key: 'b10', valor: 10 }
                                            ].reduce((sum, b) => sum + ((formData.metodoPago.detalles.billetes[b.key] || 0) * b.valor), 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {[
                                            { key: 'b200', valor: 200, label: 'S/ 200', color: 'bg-purple-500' },
                                            { key: 'b100', valor: 100, label: 'S/ 100', color: 'bg-blue-500' },
                                            { key: 'b50', valor: 50, label: 'S/ 50', color: 'bg-orange-500' },
                                            { key: 'b20', valor: 20, label: 'S/ 20', color: 'bg-green-500' },
                                            { key: 'b10', valor: 10, label: 'S/ 10', color: 'bg-red-500' }
                                        ].map(billete => {
                                            const cantidad = formData.metodoPago.detalles.billetes[billete.key] || 0;
                                            const subtotal = cantidad * billete.valor;
                                            return (
                                                <div key={billete.key} className="flex items-center justify-between bg-white p-2 rounded border">
                                                    <div className={`${billete.color} text-white px-2 py-1 rounded text-xs font-bold min-w-[60px] text-center`}>
                                                        {billete.label}
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleBilleteMonedaChange('billetes', billete.key, 'subtract')}
                                                            className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
                                                            disabled={cantidad === 0}
                                                        >
                                                            <Minus size={12} />
                                                        </button>
                                                        <span className="bg-gray-100 px-2 py-1 rounded min-w-[30px] text-center text-sm font-bold">
                                                            {cantidad}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleBilleteMonedaChange('billetes', billete.key, 'add')}
                                                            className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                                                        >
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>
                                                    <div className="text-xs font-semibold text-green-600 min-w-[50px] text-right">
                                                        S/ {subtotal.toFixed(2)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                
                                {/* Monedas Compactas */}
                                <div className="bg-yellow-50 p-3 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-medium text-gray-700">🪙 Monedas</h4>
                                        <span className="text-xs text-yellow-600 font-medium">
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
                                    <div className="space-y-1">
                                        {[
                                            { key: 'm5', valor: 5, label: '5 soles', color: 'bg-yellow-500' },
                                            { key: 'm2', valor: 2, label: '2 soles', color: 'bg-gray-500' },
                                            { key: 'm1', valor: 1, label: '1 sol', color: 'bg-yellow-400' },
                                            { key: 'c50', valor: 0.5, label: '0.50 ctv', color: 'bg-gray-400' },
                                            { key: 'c20', valor: 0.2, label: '0.20 ctv', color: 'bg-gray-400' },
                                            { key: 'c10', valor: 0.1, label: '0.10 ctv', color: 'bg-gray-400' }
                                        ].map(moneda => {
                                            const cantidad = formData.metodoPago.detalles.monedas[moneda.key] || 0;
                                            const subtotal = cantidad * moneda.valor;
                                            return (
                                                <div key={moneda.key} className="flex items-center justify-between bg-white p-1.5 rounded border">
                                                    <div className={`${moneda.color} text-white px-2 py-0.5 rounded text-xs font-bold min-w-[50px] text-center`}>
                                                        {moneda.label}
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleBilleteMonedaChange('monedas', moneda.key, 'subtract')}
                                                            className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-xs disabled:opacity-50"
                                                            disabled={cantidad === 0}
                                                        >
                                                            <Minus size={10} />
                                                        </button>
                                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded min-w-[25px] text-center text-xs font-bold">
                                                            {cantidad}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleBilleteMonedaChange('monedas', moneda.key, 'add')}
                                                            className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors text-xs"
                                                        >
                                                            <Plus size={10} />
                                                        </button>
                                                    </div>
                                                    <div className="text-xs font-semibold text-yellow-600 min-w-[40px] text-right">
                                                        S/ {subtotal.toFixed(2)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                
                                {/* Botones de acción */}
                                <div className="flex gap-2">
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
                                        className="flex-1 px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
                                    >
                                        🗑️ Limpiar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const monto = parseFloat(formData.monto) || 0;
                                            if (monto > 0) {
                                                let restante = monto;
                                                const billetes = { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 };
                                                const monedas = { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 };
                                                
                                                // Calcular billetes
                                                if (restante >= 200) { billetes.b200 = Math.floor(restante / 200); restante %= 200; }
                                                if (restante >= 100) { billetes.b100 = Math.floor(restante / 100); restante %= 100; }
                                                if (restante >= 50) { billetes.b50 = Math.floor(restante / 50); restante %= 50; }
                                                if (restante >= 20) { billetes.b20 = Math.floor(restante / 20); restante %= 20; }
                                                if (restante >= 10) { billetes.b10 = Math.floor(restante / 10); restante %= 10; }
                                                
                                                // Calcular monedas
                                                if (restante >= 5) { monedas.m5 = Math.floor(restante / 5); restante %= 5; }
                                                if (restante >= 2) { monedas.m2 = Math.floor(restante / 2); restante %= 2; }
                                                if (restante >= 1) { monedas.m1 = Math.floor(restante / 1); restante %= 1; }
                                                if (restante >= 0.5) { monedas.c50 = Math.floor(restante / 0.5); restante %= 0.5; }
                                                if (restante >= 0.2) { monedas.c20 = Math.floor(restante / 0.2); restante %= 0.2; }
                                                if (restante >= 0.1) { monedas.c10 = Math.floor(restante / 0.1); }
                                                
                                                setFormData(prev => ({
                                                    ...prev,
                                                    metodoPago: {
                                                        ...prev.metodoPago,
                                                        detalles: {
                                                            ...prev.metodoPago.detalles,
                                                            billetes,
                                                            monedas
                                                        }
                                                    }
                                                }));
                                            }
                                        }}
                                        className="flex-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                                    >
                                        🎯 Auto
                                    </button>
                                </div>
                                
                                {/* Validación visual */}
                                {parseFloat(formData.monto) > 0 && totalCalculado !== parseFloat(formData.monto) && (
                                    <div className="p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                                        <div className="flex items-center text-yellow-800">
                                            <span className="mr-1">⚠️</span>
                                            <span>
                                                Diferencia: S/ {Math.abs(totalCalculado - parseFloat(formData.monto)).toFixed(2)}
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

export default ModalEgresoFinanzas;
