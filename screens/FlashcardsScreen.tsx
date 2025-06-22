import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFlashcards } from '../hooks/storage/useFlashcards';
import { usePersistentSettings } from '../hooks/storage/usePersistentStore';
import { Deck } from '../types';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Card from '../components/Card';
import { PlusIcon, TrashIcon, EditIcon, RectangleStackIcon, DocumentArrowUpIcon } from '../ui-assets';
import ImportFlashcardsModal from '../components/ImportFlashcardsModal';
import type { StoredFlashcard } from '../storage/api';

const DEFAULT_DECK_ID = 'default-deck';

const FlashcardsScreen: React.FC = () => {
  // Usar el nuevo sistema de almacenamiento
  const { 
    flashcards, 
    loading, 
    error, 
    createFlashcard, 
    updateFlashcard, 
    deleteFlashcard,
    searchFlashcards,
    bulkImport 
  } = useFlashcards();
  
  const { getSetting, setSetting } = usePersistentSettings();
  
  const [decks, setDecks] = useState<Deck[]>([
    { id: DEFAULT_DECK_ID, name: 'Mazo Principal', createdAt: new Date().toISOString() }
  ]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<StoredFlashcard | null>(null);
  const [currentFront, setCurrentFront] = useState('');
  const [currentBack, setCurrentBack] = useState('');
  const [currentTags, setCurrentTags] = useState(''); 
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StoredFlashcard[]>([]);
  
  const navigate = useNavigate();

  // Cargar mazos guardados
  useEffect(() => {
    const loadDecks = async () => {
      const savedDecks = await getSetting<Deck[]>('flashcard-decks');
      if (savedDecks && savedDecks.length > 0) {
        setDecks(savedDecks);
      }
    };
    loadDecks();
  }, [getSetting]);

  // Guardar mazos cuando cambien
  useEffect(() => {
    setSetting('flashcard-decks', decks);
  }, [decks, setSetting]);

  const handleAddOrUpdateCard = async () => {
    if (!currentFront.trim() || !currentBack.trim()) {
      alert('Ambos lados de la flashcard deben tener contenido.');
      return;
    }

    const tags = currentTags.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    if (editingCard && editingCard.id) {
      // Actualizar tarjeta existente
      const success = await updateFlashcard(editingCard.id, {
        front: currentFront,
        back: currentBack,
        tags,
      });
      
      if (!success) {
        alert('Error al actualizar la flashcard');
        return;
      }
    } else {
      // Crear nueva tarjeta
      const newCard = {
        front: currentFront,
        back: currentBack,
        deckId: DEFAULT_DECK_ID,
        lastReviewed: null,
        nextReviewDate: new Date().toISOString().split('T')[0],
        tags,
        qualityHistory: [],
        easiness: 2.5,
        repetitions: 0,
        interval: 1,
        isLearning: true,
        currentLearningStep: 0,
        difficulty: 'medium' as const,
        cognitiveLevel: 'recognition' as const,
      };
      
      const id = await createFlashcard(newCard);
      if (!id) {
        alert('Error al crear la flashcard');
        return;
      }
    }

    // Limpiar formulario
    closeModalAndClear();
  };

  const openModalForEdit = (card: StoredFlashcard) => {
    setEditingCard(card);
    setCurrentFront(card.front);
    setCurrentBack(card.back);
    setCurrentTags(card.tags.join(', '));
    setIsModalOpen(true);
  };

  const openModalForNew = () => {
    setEditingCard(null);
    setCurrentFront('');
    setCurrentBack('');
    setCurrentTags('');
    setIsModalOpen(true);
  };

  const closeModalAndClear = () => {
    setCurrentFront('');
    setCurrentBack('');
    setCurrentTags('');
    setEditingCard(null);
    setIsModalOpen(false);
  };

  const handleDeleteCard = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta flashcard?')) {
      const success = await deleteFlashcard(id);
      if (!success) {
        alert('Error al eliminar la flashcard');
      }
    }
  };

  const clearAllDefaultCards = async () => {
    if (window.confirm('¿Estás seguro de que quieres limpiar todas las flashcards del mazo principal?')) {
      const defaultCards = flashcards.filter(fc => fc.deckId === DEFAULT_DECK_ID);
      for (const card of defaultCards) {
        if (card.id) {
          await deleteFlashcard(card.id);
        }
      }
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchFlashcards(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleImportFlashcards = async (importedCards: any[]) => {
    const cardsToImport = importedCards.map(card => ({
      front: card.front || '',
      back: card.back || '',
      deckId: DEFAULT_DECK_ID,
      lastReviewed: null,
      nextReviewDate: new Date().toISOString().split('T')[0],
      tags: card.tags || [],
      qualityHistory: [],
      easiness: 2.5,
      repetitions: 0,
      interval: 1,
      isLearning: true,
      currentLearningStep: 0,
      difficulty: 'medium' as const,
      cognitiveLevel: 'recognition' as const,
    }));

    const ids = await bulkImport(cardsToImport);
    console.log(`Importadas ${ids.length} flashcards`);
    setIsImportModalOpen(false);
  };

  const cardsInDefaultDeck = flashcards.filter(fc => fc.deckId === DEFAULT_DECK_ID);
  const pendingReviewCount = cardsInDefaultDeck.filter(fc => new Date(fc.nextReviewDate) <= new Date()).length;
  
  const displayCards = searchQuery ? searchResults : cardsInDefaultDeck;

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-2"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando flashcards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">Error: {error}</p>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center">
          <RectangleStackIcon className="w-8 h-8 text-cyan-500 dark:text-cyan-400 mr-2" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Flashcards</h1>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsImportModalOpen(true)} size="sm" variant="secondary" leftIcon={<DocumentArrowUpIcon className="w-4 h-4"/>}>
            Importar
          </Button>
          <Button onClick={openModalForNew} leftIcon={<PlusIcon className="w-4 h-4" />}>
            Nueva
          </Button>
        </div>
      </header>

      {/* Barra de búsqueda */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar flashcards..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
        />
        <span className="absolute left-3 top-2.5 w-5 h-5 text-slate-400">🔍</span>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{cardsInDefaultDeck.length}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Total de tarjetas</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{pendingReviewCount}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Pendientes de repaso</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{Math.round((cardsInDefaultDeck.length - pendingReviewCount) / Math.max(cardsInDefaultDeck.length, 1) * 100)}%</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Progreso de repaso</p>
        </Card>
      </div>

      {/* Mazos */}
      <div className="space-y-4">
        {decks.map((deck: Deck) => (
          <Card key={deck.id} className="p-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">{deck.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{cardsInDefaultDeck.length} tarjetas</p>
            <div className="flex space-x-2">
              <Link to="/practice">
                <Button size="sm" variant="primary">
                  Estudiar ({pendingReviewCount} pendientes)
                </Button>
              </Link>
              <Button onClick={clearAllDefaultCards} size="sm" variant="ghost" leftIcon={<TrashIcon className="w-4 h-4" />}>
                Limpiar todo
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Lista de flashcards */}
      {displayCards.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {searchQuery ? `Resultados de búsqueda (${displayCards.length})` : 'Todas las flashcards'}
          </h3>
          {displayCards.map((card: StoredFlashcard) => (
            <Card key={card.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                  <div className="mb-2">
                    <strong className="text-slate-800 dark:text-slate-100">Pregunta:</strong>
                    <p className="text-slate-700 dark:text-slate-300">{card.front}</p>
                  </div>
                  <div className="mb-2">
                    <strong className="text-slate-800 dark:text-slate-100">Respuesta:</strong>
                    <p className="text-slate-700 dark:text-slate-300">{card.back}</p>
                  </div>
                  {card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {card.tags.map((tag: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-xs rounded text-slate-600 dark:text-slate-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => openModalForEdit(card)} size="sm" variant="ghost">
                    <EditIcon className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => card.id && handleDeleteCard(card.id)} size="sm" variant="ghost">
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal para crear/editar flashcard */}
      <Modal isOpen={isModalOpen} onClose={closeModalAndClear} title={editingCard ? 'Editar Flashcard' : 'Nueva Flashcard'}>
        <div className="space-y-4">
          <div>
            <label htmlFor="front" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Pregunta (Frente)
            </label>
            <textarea
              id="front"
              value={currentFront}
              onChange={(e) => setCurrentFront(e.target.value)}
              rows={3}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              placeholder="Escribe la pregunta..."
            />
          </div>
          <div>
            <label htmlFor="back" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Respuesta (Reverso)
            </label>
            <textarea
              id="back"
              value={currentBack}
              onChange={(e) => setCurrentBack(e.target.value)}
              rows={3}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              placeholder="Escribe la respuesta..."
            />
          </div>
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Etiquetas (separadas por comas)
            </label>
            <input
              type="text"
              id="tags"
              value={currentTags}
              onChange={(e) => setCurrentTags(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              placeholder="matemáticas, álgebra, ecuaciones"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button onClick={closeModalAndClear} variant="ghost">
            Cancelar
          </Button>
          <Button onClick={handleAddOrUpdateCard}>
            {editingCard ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </Modal>

      {/* Modal de importación */}
      <ImportFlashcardsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportFlashcards}
        deckId={DEFAULT_DECK_ID}
      />
    </div>
  );
};

export default FlashcardsScreen;
