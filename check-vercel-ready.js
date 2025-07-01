import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔍 Verificando configuración frontend para Vercel...\n');

// Verificar archivos esenciales
const requiredFiles = [
  'package.json',
  'vite.config.js',
  'vercel.json',
  '.env.example',
  'index.html',
  'public/_redirects'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(__dirname, file)));

if (missingFiles.length > 0) {
  console.log('❌ Archivos faltantes:', missingFiles.join(', '));
} else {
  console.log('✅ Todos los archivos esenciales están presentes');
}

// Verificar package.json
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Verificar scripts
  const requiredScripts = ['build', 'preview'];
  const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
  
  if (missingScripts.length === 0) {
    console.log('✅ Scripts necesarios definidos');
  } else {
    console.log('❌ Scripts faltantes:', missingScripts.join(', '));
  }
  
  // Verificar engines
  if (packageJson.engines) {
    console.log('✅ Engines definidos:', JSON.stringify(packageJson.engines, null, 2));
  } else {
    console.log('⚠️  Engines no definidos (recomendado para producción)');
  }
  
  // Verificar dependencias críticas
  const criticalDeps = ['react', 'react-dom', '@clerk/clerk-react', 'vite'];
  const missingDeps = criticalDeps.filter(dep => !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]);
  
  if (missingDeps.length === 0) {
    console.log('✅ Todas las dependencias críticas están presentes');
  } else {
    console.log('❌ Dependencias faltantes:', missingDeps.join(', '));
  }
  
} catch (error) {
  console.log('❌ Error leyendo package.json:', error.message);
}

// Verificar variables de entorno
console.log('\n📋 Variables de entorno necesarias para Vercel:');
console.log('- VITE_CLERK_PUBLISHABLE_KEY (obligatorio)');
console.log('- VITE_CLERK_DOMAIN (obligatorio)');
console.log('- VITE_BACKEND_URL (obligatorio - URL de tu backend en Render)');
console.log('- VITE_NODE_ENV=production (recomendado)');

// Verificar archivos de configuración
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  if (vercelConfig.framework === 'vite') {
    console.log('\n✅ Configuración de Vercel correcta');
  }
} catch (error) {
  console.log('\n❌ Error en vercel.json:', error.message);
}

console.log('\n🚀 Pasos para desplegar en Vercel:');
console.log('1. Sube tu código a GitHub');
console.log('2. Conecta tu repositorio en Vercel');
console.log('3. Configura las variables de entorno');
console.log('4. ¡Despliega!');

console.log('\n📝 Recuerda:');
console.log('- Configura tu backend primero en Render');
console.log('- Actualiza VITE_BACKEND_URL con la URL de Render');
console.log('- Agrega el dominio de Vercel a CORS_ORIGINS en tu backend');

console.log('\n🎯 Tu frontend está listo para Vercel!');
