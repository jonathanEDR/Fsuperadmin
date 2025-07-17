import api from './api';

const categoryService = {
  // Obtener todas las categorías
  getAllCategories: async () => {
    try {
      const response = await api.get('/api/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error.response?.data || error.message;
    }
  },

  // Crear una nueva categoría
  createCategory: async (categoryData) => {
    try {
      const response = await api.post('/api/categories', categoryData);
      return response.data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error.response?.data || error.message;
    }
  },

  // Actualizar una categoría
  updateCategory: async (id, categoryData) => {
    try {
      const response = await api.put(`/api/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error.response?.data || error.message;
    }
  },

  // Eliminar una categoría
  deleteCategory: async (id) => {
    try {
      await api.delete(`/api/categories/${id}`);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error.response?.data || error.message;
    }
  },

  // Obtener productos por categoría
  getProductosByCategory: async (categoryId) => {
    try {
      const response = await axios.get(`${API_URL}/api/categories/${categoryId}/productos`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default categoryService;
