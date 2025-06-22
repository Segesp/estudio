import { useState, useEffect, useCallback } from 'react';
import { getAll, upsert, remove } from '../../storage/api';

export function usePersistentStore<T extends { id?: number }>(storeName: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getAll<T>(storeName);
        setItems(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error(`Error cargando datos de ${storeName}:`, err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [storeName]);

  // Añadir o actualizar item
  const add = useCallback(async (item: Omit<T, 'id'> | T): Promise<number | null> => {
    try {
      const id = await upsert(storeName, item as T);
      
      // Actualizar el estado local
      setItems(prev => {
        const exists = prev.find(i => i.id === id);
        if (exists) {
          // Actualizar existente
          return prev.map(i => (i.id === id ? { ...item, id } as T : i));
        } else {
          // Añadir nuevo
          return [...prev, { ...item, id } as T];
        }
      });
      
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      console.error(`Error guardando en ${storeName}:`, err);
      return null;
    }
  }, [storeName]);

  // Eliminar item
  const del = useCallback(async (id: number): Promise<boolean> => {
    try {
      await remove(storeName, id);
      
      // Actualizar el estado local
      setItems(prev => prev.filter(i => i.id !== id));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
      console.error(`Error eliminando de ${storeName}:`, err);
      return false;
    }
  }, [storeName]);

  // Actualizar item existente
  const update = useCallback(async (id: number, updates: Partial<T>): Promise<boolean> => {
    try {
      const existingItem = items.find(i => i.id === id);
      if (!existingItem) {
        throw new Error('Item no encontrado');
      }

      const updatedItem = { ...existingItem, ...updates };
      await upsert(storeName, updatedItem);
      
      // Actualizar el estado local
      setItems(prev => prev.map(i => (i.id === id ? updatedItem : i)));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
      console.error(`Error actualizando en ${storeName}:`, err);
      return false;
    }
  }, [storeName, items]);

  // Refrescar datos desde la base de datos
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAll<T>(storeName);
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al refrescar');
      console.error(`Error refrescando ${storeName}:`, err);
    } finally {
      setLoading(false);
    }
  }, [storeName]);

  return {
    items,
    loading,
    error,
    add,
    update,
    del,
    refresh,
  };
}

// Hook específico para configuraciones
export function usePersistentSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { settingsAPI } = await import('../../storage/api');
        const allSettings = await settingsAPI.getAll();
        setSettings(allSettings);
      } catch (err) {
        console.error('Error cargando configuraciones:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const setSetting = useCallback(async (key: string, value: any) => {
    try {
      const { settingsAPI } = await import('../../storage/api');
      await settingsAPI.set(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (err) {
      console.error('Error guardando configuración:', err);
    }
  }, []);

  const getSetting = useCallback(<T>(key: string, defaultValue?: T): T | undefined => {
    return settings[key] !== undefined ? settings[key] : defaultValue;
  }, [settings]);

  const removeSetting = useCallback(async (key: string) => {
    try {
      const { settingsAPI } = await import('../../storage/api');
      await settingsAPI.remove(key);
      setSettings(prev => {
        const newSettings = { ...prev };
        delete newSettings[key];
        return newSettings;
      });
    } catch (err) {
      console.error('Error eliminando configuración:', err);
    }
  }, []);

  return {
    settings,
    loading,
    setSetting,
    getSetting,
    removeSetting,
  };
}
