import { useState, useEffect, useCallback } from 'react';
import { flashcardAPI, StoredFlashcard } from '../../storage/api';

export function useFlashcards(deckId?: string) {
  const [flashcards, setFlashcards] = useState<StoredFlashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar flashcards
  useEffect(() => {
    const loadFlashcards = async () => {
      try {
        setLoading(true);
        const cards = deckId 
          ? await flashcardAPI.getByDeck(deckId)
          : await flashcardAPI.getAll();
        setFlashcards(cards);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando flashcards');
        console.error('Error cargando flashcards:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFlashcards();
  }, [deckId]);

  // Crear nueva flashcard
  const createFlashcard = useCallback(async (flashcard: Omit<StoredFlashcard, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = await flashcardAPI.create(flashcard);
      const newCard = { ...flashcard, id, createdAt: Date.now(), updatedAt: Date.now() };
      setFlashcards(prev => [...prev, newCard]);
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando flashcard');
      console.error('Error creando flashcard:', err);
      return null;
    }
  }, []);

  // Actualizar flashcard
  const updateFlashcard = useCallback(async (id: number, updates: Partial<StoredFlashcard>) => {
    try {
      await flashcardAPI.update(id, updates);
      setFlashcards(prev => prev.map(card => 
        card.id === id ? { ...card, ...updates, updatedAt: Date.now() } : card
      ));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando flashcard');
      console.error('Error actualizando flashcard:', err);
      return false;
    }
  }, []);

  // Eliminar flashcard
  const deleteFlashcard = useCallback(async (id: number) => {
    try {
      await flashcardAPI.remove(id);
      setFlashcards(prev => prev.filter(card => card.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando flashcard');
      console.error('Error eliminando flashcard:', err);
      return false;
    }
  }, []);

  // Obtener flashcards debido para revisión
  const getDueFlashcards = useCallback(async (date?: Date) => {
    try {
      return await flashcardAPI.getDue(date);
    } catch (err) {
      console.error('Error obteniendo flashcards debidas:', err);
      return [];
    }
  }, []);

  // Buscar flashcards
  const searchFlashcards = useCallback(async (query: string) => {
    try {
      return await flashcardAPI.search(query);
    } catch (err) {
      console.error('Error buscando flashcards:', err);
      return [];
    }
  }, []);

  // Importar flashcards en lote
  const bulkImport = useCallback(async (cards: Omit<StoredFlashcard, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    try {
      setLoading(true);
      const ids = await flashcardAPI.bulkCreate(cards);
      const now = Date.now();
      const newCards = cards.map((card, index) => ({
        ...card,
        id: ids[index],
        createdAt: now,
        updatedAt: now,
      }));
      setFlashcards(prev => [...prev, ...newCards]);
      return ids;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error importando flashcards');
      console.error('Error importando flashcards:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    flashcards,
    loading,
    error,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    getDueFlashcards,
    searchFlashcards,
    bulkImport,
  };
}
