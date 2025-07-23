// Prueba de procesamiento de fechas en el gráfico
import { getLocalDate } from '../utils/fechaHoraUtils.js';

// Simular datos de devolución de la imagen
const devolucionTest = {
  _id: 'test-dev-001',
  fechaDevolucion: '2025-07-10T12:46:00', // 10/07/2025, 12:46:00 a.m.
  monto: 10
};

// Configurar rango para mes actual (julio 2025)
const now = new Date('2025-07-23T10:00:00'); // Simular fecha actual
const startDate = new Date(now.getFullYear(), now.getMonth(), 1); // 1 de julio
const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); // 1 de agosto

console.log('🔍 Datos de prueba:');
console.log('Devolución fecha original:', devolucionTest.fechaDevolucion);
console.log('Rango del mes:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });

// Procesar la fecha como lo hace el gráfico
let fechaValida = null;
const fechaCampos = [devolucionTest.fechaDevolucion];

for (let fecha of fechaCampos) {
  if (fecha) {
    const localDate = getLocalDate(fecha);
    if (localDate) {
      fechaValida = localDate;
      break;
    }
  }
}

const devolucionDate = fechaValida || new Date();

console.log('📅 Procesamiento de fecha:');
console.log('Fecha válida:', fechaValida);
console.log('Fecha procesada:', devolucionDate);
console.log('Dentro del rango?', devolucionDate >= startDate && devolucionDate < endDate);

// Calcular índice como en el gráfico (mes)
if (devolucionDate >= startDate && devolucionDate < endDate) {
  const indexPos = Math.floor((devolucionDate - startDate) / (24 * 60 * 60 * 1000));
  console.log('✅ Índice calculado:', indexPos);
  console.log('Debería aparecer en día del mes:', indexPos + 1);
} else {
  console.log('❌ Fecha fuera del rango del mes actual');
}

// Verificar qué pasa con fecha de hoy
const hoy = new Date();
console.log('\n🕐 Comparación con hoy:');
console.log('Hoy:', hoy.toISOString());
console.log('Devolución:', devolucionDate.toISOString());
console.log('Diferencia en días:', Math.floor((hoy - devolucionDate) / (24 * 60 * 60 * 1000)));
