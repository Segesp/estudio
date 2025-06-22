import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlashcards } from '../hooks/storage/useFlashcards';
import { usePersistentSettings } from '../hooks/storage/usePersistentStore';
import { ReviewOutcome, SessionReflection } from '../types';
import type { StoredFlashcard } from '../storage/api';
import Button from '../components/Button';
import Modal from '../components/Modal';

const DEFAULT_DECK_ID = 'default-deck';

// Enhanced Anki SM-2 Algorithm with Learning Steps and Graduation
const applySM2 = (card: StoredFlashcard, quality: number, elaboration?: string): StoredFlashcard => {
  let newInterval: number;
  let newRepetitions: number;
  let newEasiness = card.easiness;
  let isLearning = false;
  let currentLearningStep = card.currentLearningStep || 0;

  if (quality < 0 || quality > 5) throw new Error("Quality must be between 0 and 5");

  // Learning steps (in minutes): 1min, 10min for new cards and lapses
  const learningSteps = [1, 10]; // minutes
  const graduatingInterval = 1; // days
  const easyInterval = 4; // days

  const wasInLearning = card.repetitions === 0 || card.isLearning;

  if (quality < 3) {
    // Failure - reset to learning mode
    newRepetitions = 0;
    currentLearningStep = 0;
    isLearning = true;
    newInterval = learningSteps[0] / (24 * 60); // Convert minutes to days
    
    if (!wasInLearning) {
      newEasiness = Math.max(1.3, newEasiness - 0.2);
    }
  } else {
    // Success (q >= 3)
    if (wasInLearning) {
      if (quality === 5) {
        // Easy - graduate immediately
        newRepetitions = 1;
        newInterval = easyInterval;
        isLearning = false;
        currentLearningStep = 0;
      } else if (quality === 4) {
        // Good - advance in learning steps
        if (currentLearningStep < learningSteps.length - 1) {
          currentLearningStep++;
          isLearning = true;
          newInterval = learningSteps[currentLearningStep] / (24 * 60);
          newRepetitions = 0;
        } else {
          // Graduate to review mode
          newRepetitions = 1;
          newInterval = graduatingInterval;
          isLearning = false;
          currentLearningStep = 0;
        }
      } else {
        // Hard - repeat current step
        isLearning = true;
        newInterval = learningSteps[currentLearningStep] / (24 * 60);
        newRepetitions = 0;
      }
    } else {
      // Mature card
      newRepetitions = card.repetitions + 1;
      isLearning = false;
      currentLearningStep = 0;
      
      if (quality === 5) {
        newEasiness = Math.min(2.5, newEasiness + 0.15);
        newInterval = Math.round(card.interval * newEasiness * 1.3);
      } else if (quality === 4) {
        newInterval = Math.round(card.interval * newEasiness);
      } else {
        newEasiness = Math.max(1.3, newEasiness - 0.15);
        newInterval = Math.round(card.interval * 1.2);
      }
    }
  }

  const nextReviewDate = new Date();
  nextReviewDate.setTime(nextReviewDate.getTime() + newInterval * 24 * 60 * 60 * 1000);
  
  const updatedQualityHistory = [...(card.qualityHistory || []), {
    quality,
    date: new Date().toISOString(),
    interval: newInterval,
    easiness: newEasiness,
    isLearning
  }];

  return {
    ...card,
    interval: newInterval,
    repetitions: newRepetitions,
    easiness: newEasiness,
    nextReviewDate: nextReviewDate.toISOString(),
    lastReviewed: new Date().toISOString(),
    qualityHistory: updatedQualityHistory,
    lastElaboration: elaboration?.trim() ? elaboration.trim() : card.lastElaboration,
    isLearning,
    currentLearningStep,
  };
};

const PracticeSessionScreen = () => {
  const { 
    flashcards, 
    loading, 
    error, 
    updateFlashcard 
  } = useFlashcards();
  
  const { getSetting, setSetting } = usePersistentSettings();
  
  const [reviewQueue, setReviewQueue] = useState<StoredFlashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{text: string, type: 'success' | 'error' | 'info' | 'warning'} | null>(null);
  const [elaborationInputText, setElaborationInputText] = useState('');
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [currentReflectionText, setCurrentReflectionText] = useState('');
  const [animationState, setAnimationState] = useState<'idle' | 'sliding-out' | 'sliding-in'>('idle');
  
  const navigate = useNavigate();

  // Initialize review queue
  useEffect(() => {
    console.log('PracticeSession: useEffect triggered');
    console.log('Total flashcards:', flashcards.length);
    
    if (flashcards.length === 0) {
      console.log('No flashcards found, returning early');
      return;
    }
    
    const now = new Date();
    console.log('Current time:', now);
    
    // Debug: Show all cards and their review dates
    flashcards.forEach((fc: StoredFlashcard, index: number) => {
      console.log(`Card ${index}:`, {
        id: fc.id,
        front: fc.front.substring(0, 50),
        deckId: fc.deckId,
        nextReviewDate: fc.nextReviewDate,
        isLearning: fc.isLearning,
        repetitions: fc.repetitions,
        isDue: new Date(fc.nextReviewDate) <= now
      });
    });
    
    const cardsToReview = flashcards
      .filter((fc: StoredFlashcard) => 
        fc.deckId === DEFAULT_DECK_ID && 
        new Date(fc.nextReviewDate) <= now
      )
      .sort((a: StoredFlashcard, b: StoredFlashcard) => {
        // Priority: learning cards first, then by due date
        const aIsLearning = a.isLearning || a.repetitions === 0;
        const bIsLearning = b.isLearning || b.repetitions === 0;
        if (aIsLearning && !bIsLearning) return -1;
        if (!aIsLearning && bIsLearning) return 1;
        return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
      });
    
    console.log('Cards to review:', cardsToReview.length);
    console.log('Review queue:', cardsToReview);
    
    setReviewQueue(cardsToReview);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setFeedbackToast(null);
    setElaborationInputText(cardsToReview[0]?.lastElaboration || '');
    setAnimationState('idle');
  }, [flashcards]);

  const mapOutcomeToQuality = (outcome: ReviewOutcome): number => {
    switch (outcome) {
      case ReviewOutcome.AGAIN: return 1;
      case ReviewOutcome.HARD: return 2;
      case ReviewOutcome.GOOD: return 4;
      case ReviewOutcome.EASY: return 5;
      default: return 3;
    }
  };

  const getTimeEstimate = (days: number): string => {
    if (days < 0.01) {
      const minutes = Math.round(days * 24 * 60);
      return `${minutes} min`;
    }
    if (days < 1) {
      const hours = Math.round(days * 24);
      return hours === 1 ? "1 hora" : `${hours} horas`;
    }
    if (days === 1) return "1 día";
    if (days < 7) return `${Math.round(days)} días`;
    if (days < 30) {
      const weeks = Math.round(days / 7);
      return weeks === 1 ? "1 semana" : `${weeks} semanas`;
    }
    if (days < 365) {
      const months = Math.round(days / 30);
      return months === 1 ? "1 mes" : `${months} meses`;
    }
    const years = Math.round(days / 365);
    return years === 1 ? "1 año" : `${years} años`;
  };

  const getPreviewInterval = (outcome: ReviewOutcome): number => {
    if (!currentCard) return 1;
    const quality = mapOutcomeToQuality(outcome);
    const previewCard = applySM2(currentCard, quality, elaborationInputText);
    return previewCard.interval;
  };

  const handleReview = useCallback(async (outcome: ReviewOutcome) => {
    if (animationState !== 'idle' || currentCardIndex >= reviewQueue.length) {
      return;
    }

    const currentCard = reviewQueue[currentCardIndex];
    if (!currentCard || !currentCard.id) {
      console.error("Current card is undefined or has no ID");
      return;
    }
    
    const quality = mapOutcomeToQuality(outcome);
    const updatedCard = applySM2(currentCard, quality, elaborationInputText);

    // Update card in database
    const success = await updateFlashcard(currentCard.id, {
      lastReviewed: updatedCard.lastReviewed,
      nextReviewDate: updatedCard.nextReviewDate,
      interval: updatedCard.interval,
      repetitions: updatedCard.repetitions,
      easiness: updatedCard.easiness,
      qualityHistory: updatedCard.qualityHistory,
      lastElaboration: updatedCard.lastElaboration,
      isLearning: updatedCard.isLearning,
      currentLearningStep: updatedCard.currentLearningStep
    });

    if (!success) {
      setFeedbackToast({ text: "Error al actualizar la tarjeta", type: "error" });
      return;
    }
    
    // Show feedback
    const timeEstimate = getTimeEstimate(updatedCard.interval);
    let toastText = "";
    let toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

    switch (quality) {
      case 1: 
        toastText = `🔄 Reiniciando aprendizaje. La verás en ${timeEstimate}.`;
        toastType = 'warning';
        break;
      case 2:
        toastText = `⚠️ Marcada como difícil. La verás en ${timeEstimate}.`;
        toastType = 'warning';
        break;
      case 4:
        toastText = updatedCard.isLearning 
          ? `✅ Progresando en aprendizaje. Siguiente: ${timeEstimate}.`
          : `✅ Buen trabajo. La verás en ${timeEstimate}.`;
        toastType = 'success';
        break;
      case 5:
        toastText = updatedCard.isLearning
          ? `🚀 ¡Graduada! Próxima revisión en ${timeEstimate}.`
          : `🚀 ¡Perfecto! La verás en ${timeEstimate}.`;
        toastType = 'success';
        break;
    }

    setFeedbackToast({ text: toastText, type: toastType });

    // Proceed to next card
    setTimeout(() => {
      const nextIndex = currentCardIndex + 1;
      if (nextIndex < reviewQueue.length) {
        setCurrentCardIndex(nextIndex);
        setElaborationInputText(reviewQueue[nextIndex]?.lastElaboration || '');
        setShowAnswer(false);
        setFeedbackToast(null);
      } else {
        // Session complete
        setIsReflectionModalOpen(true);
      }
    }, 2000);
  }, [currentCardIndex, reviewQueue, animationState, elaborationInputText, updateFlashcard]);

  const handleSaveReflection = async () => {
    if (currentReflectionText.trim()) {
      const reflections = await getSetting<SessionReflection[]>('sessionReflections') || [];
      const newReflection: SessionReflection = {
        id: Date.now().toString(),
        text: currentReflectionText.trim(),
        date: new Date().toISOString(),
        sessionType: 'practice' as any // Assuming this field exists in SessionType
      };
      
      await setSetting('sessionReflections', [newReflection, ...reflections]);
    }
    
    setIsReflectionModalOpen(false);
    navigate('/flashcards');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isReflectionModalOpen) return;
      
      if (showAnswer) {
        switch (e.key) {
          case '1':
            handleReview(ReviewOutcome.AGAIN);
            break;
          case '2':
            handleReview(ReviewOutcome.HARD);
            break;
          case '3':
            handleReview(ReviewOutcome.GOOD);
            break;
          case '4':
            handleReview(ReviewOutcome.EASY);
            break;
        }
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setShowAnswer(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showAnswer, isReflectionModalOpen, handleReview]);

  const currentCard = reviewQueue[currentCardIndex];

  if (loading) {
    console.log('PracticeSession: Still loading...');
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-2"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando sesión de práctica...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('PracticeSession: Error state:', error);
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">Error: {error}</p>
          <Button onClick={() => navigate('/flashcards')}>Volver a Flashcards</Button>
        </div>
      </div>
    );
  }

  if (reviewQueue.length === 0) {
    console.log('PracticeSession: No cards in review queue');
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            🎉 ¡No hay tarjetas pendientes de repaso!
          </p>
          <Button onClick={() => navigate('/flashcards')}>Volver a Flashcards</Button>
        </div>
      </div>
    );
  }

  console.log('PracticeSession: Rendering practice session with card:', currentCard);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {feedbackToast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          feedbackToast.type === 'success' ? 'bg-green-500 text-white' :
          feedbackToast.type === 'warning' ? 'bg-yellow-500 text-white' :
          feedbackToast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {feedbackToast.text}
        </div>
      )}

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Sesión de Práctica
          </h1>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {currentCardIndex + 1} / {reviewQueue.length}
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div 
            className="bg-cyan-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${((currentCardIndex + 1) / reviewQueue.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {currentCard && (
        <div className={`transition-all duration-300 ${animationState === 'sliding-out' ? 'opacity-0 transform translate-x-4' : animationState === 'sliding-in' ? 'opacity-0 transform -translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Pregunta:
              </h2>
              <p className="text-xl text-slate-800 dark:text-slate-100">
                {currentCard.front}
              </p>
            </div>

            {showAnswer && (
              <div className="border-t border-slate-200 dark:border-slate-600 pt-4 mb-4">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Respuesta:
                </h3>
                <p className="text-xl text-slate-800 dark:text-slate-100 mb-4">
                  {currentCard.back}
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Elaboración (opcional):
                  </label>
                  <textarea
                    value={elaborationInputText}
                    onChange={(e) => setElaborationInputText(e.target.value)}
                    placeholder="Agrega contexto, explicaciones adicionales, o notas..."
                    className="w-full p-3 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {!showAnswer ? (
              <Button
                onClick={() => setShowAnswer(true)}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                size="lg"
              >
                Mostrar Respuesta (Espacio)
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-slate-600 dark:text-slate-400 font-medium">
                  ¿Qué tan bien recordaste esta tarjeta?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleReview(ReviewOutcome.AGAIN)}
                    variant="secondary"
                    className="flex flex-col items-center p-4 bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 dark:bg-red-500 dark:hover:bg-red-600 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <span className="text-lg font-semibold">🔄 Otra vez</span>
                    <span className="text-xs opacity-90 mt-1">
                      {getTimeEstimate(getPreviewInterval(ReviewOutcome.AGAIN))}
                    </span>
                    <span className="text-xs opacity-75 mt-0.5">Tecla: 1</span>
                  </Button>
                  <Button
                    onClick={() => handleReview(ReviewOutcome.HARD)}
                    variant="secondary"
                    className="flex flex-col items-center p-4 bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 hover:border-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <span className="text-lg font-semibold">⚠️ Difícil</span>
                    <span className="text-xs opacity-90 mt-1">
                      {getTimeEstimate(getPreviewInterval(ReviewOutcome.HARD))}
                    </span>
                    <span className="text-xs opacity-75 mt-0.5">Tecla: 2</span>
                  </Button>
                  <Button
                    onClick={() => handleReview(ReviewOutcome.GOOD)}
                    variant="secondary"
                    className="flex flex-col items-center p-4 bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600 dark:bg-green-500 dark:hover:bg-green-600 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <span className="text-lg font-semibold">✅ Bien</span>
                    <span className="text-xs opacity-90 mt-1">
                      {getTimeEstimate(getPreviewInterval(ReviewOutcome.GOOD))}
                    </span>
                    <span className="text-xs opacity-75 mt-0.5">Tecla: 3</span>
                  </Button>
                  <Button
                    onClick={() => handleReview(ReviewOutcome.EASY)}
                    variant="secondary"
                    className="flex flex-col items-center p-4 bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <span className="text-lg font-semibold">🚀 Fácil</span>
                    <span className="text-xs opacity-90 mt-1">
                      {getTimeEstimate(getPreviewInterval(ReviewOutcome.EASY))}
                    </span>
                    <span className="text-xs opacity-75 mt-0.5">Tecla: 4</span>
                  </Button>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    💡 Sé honesto contigo mismo: una evaluación precisa optimiza tu aprendizaje
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    🔄 Otra vez = Reiniciar | ⚠️ Difícil = Progreso lento | ✅ Bien = Avance normal | 🚀 Fácil = Graduación rápida
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Button 
        variant="ghost" 
        onClick={() => navigate('/flashcards')} 
        className="w-full mt-4 text-sm dark:text-slate-400 dark:hover:text-slate-200"
      >
        Salir de la sesión
      </Button>

      <Modal 
        isOpen={isReflectionModalOpen} 
        onClose={() => { setIsReflectionModalOpen(false); navigate('/flashcards'); }} 
        title="Reflexión de la Sesión"
      >
        <div>
          <label htmlFor="reflectionText" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            ¿Qué aprendiste o qué podrías mejorar para la próxima sesión?
          </label>
          <textarea
            id="reflectionText"
            value={currentReflectionText}
            onChange={(e) => setCurrentReflectionText(e.target.value)}
            rows={4}
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
            placeholder="Ej: Necesito repasar más los conceptos de X, me sentí más seguro con Y..."
          />
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveReflection}>Guardar Reflexión y Terminar</Button>
        </div>
      </Modal>
    </div>
  );
};

export default PracticeSessionScreen;
