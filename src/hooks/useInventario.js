import { useState, useEffect } from 'react';
import * as inventarioService from '../services/inventarioService';

export default function useInventario() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInventario = async () => {
    setLoading(true);
    try {
      const { data } = await inventarioService.getInventario();
      setProductos(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventario(); }, []);

  return { productos, loading, error, fetchInventario };
}
