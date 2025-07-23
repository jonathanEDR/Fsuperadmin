// Debug para entender el procesamiento de fechas en el frontend
// Simular exactamente lo que hace el componente VentasLineChart

// Importar función desde el frontend
import { getLocalDate } from './src/utils/fechaHoraUtils.js';

// Simular datos de devolución tal como vienen del backend
const devolucionTest = {
  _id: '68807a6e735377749630716',
  fechaDevolucion: '2025-07-10T06:00:00.000+00:00', // Fecha de la imagen
  createdAt: '2025-07-23T06:00:14.710+00:00',
  monto: 30
};

console.log('🔍 === DEBUG DE PROCESAMIENTO DE FECHAS ===');
console.log('Devolución de prueba:', devolucionTest);

// Simular proceso del gráfico
console.log('\n📅 Procesando fechas como en el gráfico:');

// Prioridad de fechas como en el código
const fechaCampos = [
  devolucionTest.fechaDevolucion,
  devolucionTest.createdAt,
  devolucionTest.updatedAt
];

let fechaValida = null;

for (let fecha of fechaCampos) {
  if (fecha) {
    console.log('  Probando fecha:', fecha);
    const localDate = getLocalDate(fecha);
    console.log('  Resultado getLocalDate:', localDate);
    
    if (localDate) {
      fechaValida = localDate;
      console.log('  ✅ Fecha válida encontrada:', fechaValida);
      break;
    }
  }
}

const devolucionDate = fechaValida || new Date();

console.log('\n🎯 Resultado final:');
console.log('fechaValida:', fechaValida);
console.log('devolucionDate:', devolucionDate);
console.log('Tipo:', typeof devolucionDate);
console.log('Es válida:', !isNaN(devolucionDate.getTime()));

// Simular cálculo del rango como en el gráfico (filtro 'mes')
const now = new Date();
const startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Inicio de julio
const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); // Inicio de agosto

console.log('\n📊 Análisis del rango (filtro mes):');
console.log('Ahora:', now.toISOString());
console.log('Inicio del mes:', startDate.toISOString());
console.log('Fin del mes:', endDate.toISOString());
console.log('¿Está en el rango?:', devolucionDate >= startDate && devolucionDate < endDate);

// Calcular índice como en el código corregido
if (devolucionDate >= startDate && devolucionDate < endDate) {
  const indexPos = Math.floor((devolucionDate - startDate) / (24 * 60 * 60 * 1000));
  console.log('Índice calculado:', indexPos);
  console.log('Día del gráfico:', indexPos + 1);
} else {
  console.log('❌ Fecha fuera del rango del mes');
}

// Verificar diferencias entre fechas
console.log('\n🔄 Comparación de fechas:');
console.log('fechaDevolucion original:', devolucionTest.fechaDevolucion);
console.log('Como Date object:', new Date(devolucionTest.fechaDevolucion));
console.log('getLocalDate result:', getLocalDate(devolucionTest.fechaDevolucion));

// Analizar zona horaria
const originalDate = new Date(devolucionTest.fechaDevolucion);
console.log('\n🌍 Análisis de zona horaria:');
console.log('Fecha original UTC:', originalDate.toISOString());
console.log('Fecha local toString:', originalDate.toString());
console.log('Offset local (minutos):', originalDate.getTimezoneOffset());
console.log('Día UTC:', originalDate.getUTCDate());
console.log('Día local:', originalDate.getDate());
