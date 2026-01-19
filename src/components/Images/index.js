// components/Images/index.js

// Componente principal
export { default as ImageManagerCore } from './ImageManagerCore';

// Componentes reutilizables
export { default as ImageUploader } from './components/ImageUploader';
export { default as ImageGallery } from './components/ImageGallery';
export { default as ImagePicker } from './components/ImagePicker';

// Re-exportar hook y servicio para conveniencia
export { useImageManager } from '../../hooks/useImageManager';
export { imageService, IMAGE_FOLDERS, IMAGE_CONFIG } from '../../services/images';
