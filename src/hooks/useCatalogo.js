import { useState, useEffect } from 'react';
import * as catalogoService from '../services/catalogoService';

export default function useCatalogo() {
  const [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCatalogo = async () => {
    setLoading(true);
    try {
      const { data } = await catalogoService.getCatalogo();
      setCatalogo(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCatalogo(); }, []);

  return { catalogo, loading, error, fetchCatalogo };
}
