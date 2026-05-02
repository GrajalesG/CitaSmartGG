import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';


//Hook personalizado para consumo de datos
//Encapsula la lógica de carga, manejo de errores y actualización.
export function useFetch(fetchFn, deps = []) {
  // Datos obtenidos
  const [data, setData]       = useState([]);
  // Estado de carga
  const [loading, setLoading] = useState(true);
   // Estado de error
  const [error, setError]     = useState(null);

  //Función principal de carga
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFn();
      setData(res.data.data ?? res.data);
    } catch (e) {
      setError(e.message);
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, deps); 

  //Ejecutar carga automática
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load, setData };
}

//Hook personalizado para manejo de formularios
export function useForm(initial) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});

//Actualizar un campo específico
  const set = (field, val) =>
    setValues(v => ({ ...v, [field]: val }));
//Reemplazar todos los valores
  const setAll = (obj) => setValues(obj);

  //Reiniciar formulario
  const reset = () => { setValues(initial); setErrors({}); };

  return { values, errors, set, setAll, reset, setErrors };
}