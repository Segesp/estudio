
import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import { Flashcard, Deck } from '../types'; // Removed ReviewOutcome as it's not used here directly
import Button from '../components/Button';
import Modal from '../components/Modal';
import Card from '../components/Card';
import { PlusIcon, TrashIcon, EditIcon, RectangleStackIcon, DocumentArrowUpIcon } from '../ui-assets';
import ImportFlashcardsModal from '../components/ImportFlashcardsModal';


const DEFAULT_DECK_ID = 'default-deck';

const FlashcardsScreen: React.FC = () => {
  const [decks, setDecks] = useLocalStorage<Deck[]>('flashcard-decks', [{ id: DEFAULT_DECK_ID, name: 'Mazo Principal', createdAt: new Date().toISOString() }]);
  const [flashcards, setFlashcards] = useLocalStorage<Flashcard[]>('flashcards', []);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [currentFront, setCurrentFront] = useState('');
  const [currentBack, setCurrentBack] = useState('');
  const [currentTags, setCurrentTags] = useState(''); 
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const navigate = useNavigate();

  const handleAddOrUpdateCard = () => {
    if (!currentFront.trim() || !currentBack.trim()) {
      alert('Ambos lados de la flashcard deben tener contenido.');
      return;
    }

    const tagsArray = currentTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    if (editingCard) {
      setFlashcards(prev => prev.map(fc => 
        fc.id === editingCard.id 
        ? { ...fc, front: currentFront, back: currentBack, tags: tagsArray } 
        : fc
      ));
    } else {
      const newCard: Flashcard = {
        id: Date.now().toString(),
        front: currentFront,
        back: currentBack,
        deckId: DEFAULT_DECK_ID,
        lastReviewed: null,
        nextReviewDate: new Date().toISOString(),
        // SM-2 fields initialization
        tags: tagsArray,
        qualityHistory: [],
        easiness: 2.5, // Standard starting easiness factor
        repetitions: 0,
        interval: 0, // Will be set to 1 on first good review by SM-2
        lastElaboration: '',
      };
      setFlashcards(prev => [...prev, newCard]);
    }
    closeModal();
  };

  const openModalForNew = () => {
    setEditingCard(null);
    setCurrentFront('');
    setCurrentBack('');
    setCurrentTags('');
    setIsModalOpen(true);
  };

  const openModalForEdit = (card: Flashcard) => {
    setEditingCard(card);
    setCurrentFront(card.front);
    setCurrentBack(card.back);
    setCurrentTags(card.tags ? card.tags.join(', ') : '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCard(null);
    setCurrentFront('');
    setCurrentBack('');
    setCurrentTags('');
  };

  const handleDeleteCard = (id: string) => {
    if (window.confirm('¿Seguro que quieres eliminar esta flashcard?')) {
      setFlashcards(prev => prev.filter(fc => fc.id !== id));
    }
  };

  const handleClearAllCards = () => {
    if (cardsInDefaultDeck.length === 0) {
      alert('No hay flashcards para eliminar.');
      return;
    }
    
    const confirmMessage = `¿Estás seguro de que quieres eliminar TODAS las ${cardsInDefaultDeck.length} flashcards? Esta acción no se puede deshacer.`;
    if (window.confirm(confirmMessage)) {
      setFlashcards(prev => prev.filter(fc => fc.deckId !== DEFAULT_DECK_ID));
    }
  };
  
  const cardsInDefaultDeck = flashcards.filter(fc => fc.deckId === DEFAULT_DECK_ID);
  const pendingReviewCount = cardsInDefaultDeck.filter(fc => new Date(fc.nextReviewDate) <= new Date()).length;

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
          {cardsInDefaultDeck.length > 0 && (
            <Button 
              onClick={handleClearAllCards} 
              size="sm" 
              variant="secondary" 
              leftIcon={<TrashIcon className="w-4 h-4"/>}
              className="text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-700/50 dark:text-rose-400"
            >
              Limpiar todas
            </Button>
          )}
          <Button onClick={openModalForNew} size="sm" leftIcon={<PlusIcon className="w-4 h-4"/>}>
            Nueva
          </Button>
        </div>
      </header>

      {decks.map(deck => (
        <Card key={deck.id} className="mb-4">
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">{deck.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{flashcards.filter(fc => fc.deckId === deck.id).length} tarjetas</p>
          {pendingReviewCount > 0 && deck.id === DEFAULT_DECK_ID && (
             <Button 
                onClick={() => navigate('/flashcards/practice')} 
                variant="primary" 
                className="w-full mb-3"
              >
                Repasar {pendingReviewCount} Tarjetas
              </Button>
          )}
           {pendingReviewCount === 0 && deck.id === DEFAULT_DECK_ID && cardsInDefaultDeck.length > 0 && (
             <p className="text-center text-emerald-600 dark:text-emerald-400 p-2 bg-emerald-100 dark:bg-emerald-700/30 rounded-md mb-3">¡Todo repasado por hoy!</p>
          )}

          {cardsInDefaultDeck.length === 0 && deck.id === DEFAULT_DECK_ID ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-4">No hay flashcards en este mazo. ¡Añade algunas o importa un documento!</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {cardsInDefaultDeck.map(card => (
                <div key={card.id} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg shadow-sm">
                  <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{card.front}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{card.back}</p>
                  {card.tags && card.tags.length > 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
                      Etiquetas: {card.tags.join(', ')}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-end space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openModalForEdit(card)} aria-label="Editar">
                      <EditIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteCard(card.id)} className="text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-700/50 dark:text-rose-400" aria-label="Eliminar">
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCard ? "Editar Flashcard" : "Nueva Flashcard"}>
        <div className="space-y-4">
          <div>
            <label htmlFor="front" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Anverso (Pregunta)</label>
            <textarea
              id="front"
              value={currentFront}
              onChange={(e) => setCurrentFront(e.target.value)}
              rows={3}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
              aria-label="Anverso de la flashcard"
            />
          </div>
          <div>
            <label htmlFor="back" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reverso (Respuesta)</label>
            <textarea
              id="back"
              value={currentBack}
              onChange={(e) => setCurrentBack(e.target.value)}
              rows={3}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
              aria-label="Reverso de la flashcard"
            />
          </div>
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Etiquetas (separadas por coma)</label>
            <input
              type="text"
              id="tags"
              value={currentTags}
              onChange={(e) => setCurrentTags(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
              placeholder="Ej: Física, Espaciado, Importante"
              aria-label="Etiquetas de la flashcard"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
          <Button onClick={handleAddOrUpdateCard}>{editingCard ? "Guardar Cambios" : "Crear Flashcard"}</Button>
        </div>
      </Modal>

      <ImportFlashcardsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        setFlashcards={setFlashcards}
        deckId={DEFAULT_DECK_ID}
      />
    </div>
  );
};

export default FlashcardsScreen;
