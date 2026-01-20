const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputImage = path.join(__dirname, '../public/logocuadrado.png');
const outputDir = path.join(__dirname, '../public');

async function generateFavicons() {
  console.log('Generando favicons optimizados...\n');

  try {
    // 1. Favicon 32x32 (para navegadores)
    await sharp(inputImage)
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(outputDir, 'favicon-32x32.png'));
    console.log('✓ favicon-32x32.png creado');

    // 2. Favicon 16x16 (para tabs pequeñas)
    await sharp(inputImage)
      .resize(16, 16, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(outputDir, 'favicon-16x16.png'));
    console.log('✓ favicon-16x16.png creado');

    // 3. Apple Touch Icon 180x180 (para iOS)
    await sharp(inputImage)
      .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    console.log('✓ apple-touch-icon.png (180x180) creado');

    // 4. Android Chrome 192x192
    await sharp(inputImage)
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(outputDir, 'android-chrome-192x192.png'));
    console.log('✓ android-chrome-192x192.png creado');

    // 5. Android Chrome 512x512
    await sharp(inputImage)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(outputDir, 'android-chrome-512x512.png'));
    console.log('✓ android-chrome-512x512.png creado');

    // 6. MS Tile 150x150 (para Windows)
    await sharp(inputImage)
      .resize(150, 150, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(outputDir, 'mstile-150x150.png'));
    console.log('✓ mstile-150x150.png creado');

    console.log('\n¡Todos los favicons han sido generados exitosamente!');

  } catch (error) {
    console.error('Error generando favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
