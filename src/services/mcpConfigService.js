import api from './api';

const mcpConfigService = {
  /** Obtiene la configuración MCP (URL del servidor + API key) */
  async getConfig() {
    const res = await api.get('/api/mcp-config');
    return res.data;
  },

  /** Rota la API Key y devuelve la nueva */
  async rotateKey() {
    const res = await api.post('/api/mcp-config/rotate');
    return res.data;
  },

  /** Habilita o deshabilita el endpoint MCP */
  async toggle() {
    const res = await api.post('/api/mcp-config/toggle');
    return res.data;
  },
};

export default mcpConfigService;
