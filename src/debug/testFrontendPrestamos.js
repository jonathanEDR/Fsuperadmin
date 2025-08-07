/**
 * 🧪 SCRIPT DE VERIFICACIÓN: Frontend de Préstamos
 * 
 * Lista de validaciones a realizar en el navegador
 */

console.log(`
🧪 VERIFICACIONES PARA EL FRONTEND DE PRÉSTAMOS
======================================================

📋 CHECKLIST DE PRUEBAS:

1. ✅ MODAL DE PRÉSTAMO:
   - [ ] Se abre correctamente al hacer clic en "Nuevo Préstamo"
   - [ ] Todos los campos permiten escribir texto
   - [ ] Los selects muestran las opciones correctas
   - [ ] Los campos numéricos aceptan números
   - [ ] Los textarea permiten texto multilínea

2. ✅ VALIDACIONES:
   - [ ] Campos requeridos muestran error si están vacíos
   - [ ] Montos solo aceptan números positivos
   - [ ] Tasas de interés están entre 0 y 100
   - [ ] Errores se limpian al escribir

3. ✅ ENVÍO DE DATOS:
   - [ ] Al enviar formulario se transforman los datos correctamente
   - [ ] Se envían al endpoint /api/prestamos
   - [ ] Se registra automáticamente en movimientos de caja
   - [ ] Se muestra mensaje de éxito

4. ✅ INTEGRACIÓN BACKEND:
   - [ ] Los préstamos aparecen en la lista
   - [ ] Se genera movimiento en caja automáticamente
   - [ ] Los datos se almacenan correctamente

📝 DATOS DE PRUEBA RECOMENDADOS:
------------------------------
Entidad Financiera:
- Nombre: "Banco de Crédito del Perú"
- Código: "BCP"
- Tipo: "banco"

Préstamo:
- Tipo: "personal"
- Monto: 10000
- Tasa: 15.5%
- Plazo: 12 meses

🔧 SI HAY ERRORES:
------------------
1. Abrir DevTools (F12)
2. Revisar Console para errores JavaScript
3. Revisar Network para ver requests a la API
4. Verificar que los datos se envían correctamente

🎯 VALIDACIÓN FINAL:
--------------------
- [ ] Préstamo se crea exitosamente
- [ ] Aparece en /api/movimientos-caja/movimientos con categoría 'prestamo_recibido'
- [ ] Los montos coinciden
- [ ] No hay errores en console
`);

// Función para debuggear el formulario
window.debugFormularioPrestamos = function() {
    console.log('🔍 Estado actual del formulario:', {
        modal: document.querySelector('[data-testid="modal-prestamo"]'),
        campos: Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
            name: el.name,
            value: el.value,
            type: el.type,
            placeholder: el.placeholder
        }))
    });
};

// Función para probar el envío de datos
window.testEnvioPrestamo = function() {
    const datosTest = {
        entidadFinanciera: {
            nombre: "Banco de Prueba",
            codigo: "TEST",
            tipo: "banco"
        },
        tipoCredito: "personal",
        montoSolicitado: 5000,
        tasaInteres: {
            porcentaje: 15,
            tipo: "fija",
            periodo: "anual"
        },
        plazo: {
            cantidad: 12,
            unidad: "meses"
        },
        proposito: "Préstamo de prueba",
        observaciones: "Datos de testing"
    };
    
    console.log('📤 Enviando datos de prueba:', datosTest);
    
    // Simulamos el envío a la API
    fetch('/api/prestamos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosTest)
    })
    .then(response => response.json())
    .then(data => {
        console.log('✅ Respuesta del servidor:', data);
    })
    .catch(error => {
        console.error('❌ Error en envío:', error);
    });
};

console.log(`
🛠️ FUNCIONES DE DEBUG DISPONIBLES:
- debugFormularioPrestamos() - Ver estado del formulario
- testEnvioPrestamo() - Probar envío de datos

Ejecuta estas funciones en la consola del navegador.
`);
