
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlashcards } from '../hooks/storage/useFlashcards';
import { usePersistentSettings } from '../hooks/storage/usePersistentStore';
import { ReviewOutcome, SessionReflection } from '../types';
import type { StoredFlashcard } from '../storage/api';
import Button from '../components/Button';
import Modal from '../components/Modal';

const DEFAULT_DECK_ID = 'default-deck';

// Enhanced Anki SM-2 Algorithm with Learning Steps and Graduation
// Implements realistic Anki behavior with immediate reviews and learning phases
const applySM2 = (card: StoredFlashcard, quality: number, elaboration?: string): StoredFlashcard => {
  let newInterval: number;
  let newRepetitions: number;
  let newEasiness = card.easiness;
  let isLearning = false;
  let currentLearningStep = card.currentLearningStep || 0;

  if (quality < 0 || quality > 5) throw new Error("Quality must be between 0 and 5");

  // Learning steps (in minutes): 1min, 10min for new cards and lapses
  const learningSteps = [1, 10]; // minutes
  // Graduating interval: 1 day, Easy interval: 4 days
  const graduatingInterval = 1; // days
  const easyInterval = 4; // days

  // Determine if card is in learning phase
  const wasInLearning = card.repetitions === 0 || card.isLearning;

  // Step 1: Handle responses
  if (quality < 3) {
    // Failure - reset to learning mode
    newRepetitions = 0;
    currentLearningStep = 0;
    isLearning = true;
    newInterval = learningSteps[0] / (24 * 60); // Convert minutes to days (fraction)
    
    // Penalty for failures in mature cards
    if (!wasInLearning) {
      newEasiness = Math.max(1.3, newEasiness - 0.2);
    }
  } else {
    // Success (q >= 3)
    if (wasInLearning) {
      // Card is in learning phase
      if (quality === 5) {
        // Easy - graduate immediately to easy interval
        newRepetitions = 1;
        newInterval = easyInterval;
        isLearning = false;
        currentLearningStep = 0;
      } else if (currentLearningStep < learningSteps.length - 1) {
        // Move to next learning step
        currentLearningStep++;
        newInterval = learningSteps[currentLearningStep] / (24 * 60);
        newRepetitions = 0;
        isLearning = true;
      } else {
        // Graduate from learning
        newRepetitions = 1;
        newInterval = graduatingInterval;
        isLearning = false;
        currentLearningStep = 0;
      }
    } else {
      // Mature card - normal SM-2 progression
      if (card.repetitions === 1) {
        // Second review of graduated card
        newInterval = 6;
      } else {
        // SM-2 interval calculation
        newInterval = Math.round(card.interval * newEasiness);
      }
      newRepetitions = card.repetitions + 1;
      isLearning = false;
    }
  }

  // Step 2: Update easiness factor (only for mature cards)
  if (!wasInLearning || !isLearning) {
    const deltaEF = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    newEasiness = Math.max(1.3, newEasiness + deltaEF);
  }

  // Step 3: Calculate next review date
  const nextReviewDate = new Date();
  if (newInterval < 1) {
    // Sub-day intervals (learning phase)
    nextReviewDate.setTime(nextReviewDate.getTime() + (newInterval * 24 * 60 * 60 * 1000));
  } else {
    // Day intervals
    nextReviewDate.setDate(nextReviewDate.getDate() + Math.round(newInterval));
  }

  // Step 4: Update quality history
  const updatedQualityHistory = [...card.qualityHistory, { 
    date: new Date().toISOString(), 
    quality,
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

  // Check if session should continue (any cards still in learning or due within next hour)
  const shouldContinueSession = useCallback(() => {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour ahead
    
    return flashcards.some((fc: StoredFlashcard) => 
      fc.deckId === DEFAULT_DECK_ID && 
      (
        // Cards due now or very soon (within 1 hour)
        new Date(fc.nextReviewDate) <= oneHourFromNow ||
        // Cards explicitly in learning phase
        fc.isLearning ||
        // New cards (never successfully graduated)
        fc.repetitions === 0
      )
    );
  }, [flashcards]);

  // Enhanced session logic - continuous until all cards are learned
  useEffect(() => {
    const now = new Date();
    const cardsToReview = flashcards
      .filter((fc: StoredFlashcard) => fc.deckId === DEFAULT_DECK_ID && new Date(fc.nextReviewDate) <= now)
      .sort((a: StoredFlashcard, b: StoredFlashcard) => {
        // Priority: learning cards first, then by due date
        const aIsLearning = a.isLearning || a.repetitions === 0;
        const bIsLearning = b.isLearning || b.repetitions === 0;
        if (aIsLearning && !bIsLearning) return -1;
        if (!aIsLearning && bIsLearning) return 1;
        return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
      });
    
    setReviewQueue(cardsToReview);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setFeedbackToast(null);
    setElaborationInputText(cardsToReview[0]?.lastElaboration || '');
    setAnimationState('idle');
  }, [flashcards, shouldContinueSession]);

  // Auto-refresh queue every 30 seconds to catch cards that become due
  useEffect(() => {
    const interval = setInterval(() => {
      if (reviewQueue.length === 0 && shouldContinueSession()) {
        const now = new Date();
        const newCardsToReview = flashcards
          .filter((fc: StoredFlashcard) => fc.deckId === DEFAULT_DECK_ID && new Date(fc.nextReviewDate) <= now)
          .sort((a: StoredFlashcard, b: StoredFlashcard) => {
            const aIsLearning = a.isLearning || a.repetitions === 0;
            const bIsLearning = b.isLearning || b.repetitions === 0;
            if (aIsLearning && !bIsLearning) return -1;
            if (!aIsLearning && bIsLearning) return 1;
            return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
          });
        
        if (newCardsToReview.length > 0) {
          setReviewQueue(newCardsToReview);
          setCurrentCardIndex(0);
          setElaborationInputText(newCardsToReview[0]?.lastElaboration || '');
          setAnimationState('idle');
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [reviewQueue.length, shouldContinueSession, flashcards]);

  const mapOutcomeToQuality = (outcome: ReviewOutcome): number => {
    switch (outcome) {
      case ReviewOutcome.AGAIN: return 1; // Learning step restart
      case ReviewOutcome.HARD: return 2;  // Difficult but progresses in learning
      case ReviewOutcome.GOOD: return 4;  // Good recall, normal progression
      case ReviewOutcome.EASY: return 5;  // Perfect recall, accelerated progression
      default: return 3; // Minimum passing grade
    }
  };

  // Helper function to get human-readable time estimates with learning support
  const getTimeEstimate = (days: number): string => {
    if (days < 0.01) { // Less than ~15 minutes
      const minutes = Math.round(days * 24 * 60);
      return `${minutes} min`;
    }
    if (days < 1) { // Less than 1 day
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

  // Preview what would happen with each choice
  const getPreviewInterval = (outcome: ReviewOutcome): number => {
    if (!currentCard) return 1;
    const quality = mapOutcomeToQuality(outcome);
    const previewCard = applySM2(currentCard, quality, elaborationInputText);
    return previewCard.interval;
  };
  
  const proceedToNextCardOrEnd = useCallback(() => {
    setAnimationState('sliding-out');
    setTimeout(() => {
        setShowAnswer(false);
        setFeedbackToast(null);
        
        const nextCardExists = currentCardIndex < reviewQueue.length - 1;
        if (nextCardExists) {
            setElaborationInputText(reviewQueue[currentCardIndex + 1]?.lastElaboration || '');
            setCurrentCardIndex(prev => prev + 1);
            setAnimationState('sliding-in');
        } else {
            // Check if there are more cards to review (refreshed queue with immediate due cards)
            if (shouldContinueSession()) {
              // Get cards that are due now or very soon
              const now = new Date();
              const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes buffer
              
              const newCardsToReview = allFlashcards
                .filter(fc => 
                  fc.deckId === DEFAULT_DECK_ID && 
                  new Date(fc.nextReviewDate) <= fiveMinutesFromNow
                )
                .sort((a, b) => {
                  // Priority: learning cards first, then by due date
                  const aIsLearning = a.isLearning || a.repetitions === 0;
                  const bIsLearning = b.isLearning || b.repetitions === 0;
                  if (aIsLearning && !bIsLearning) return -1;
                  if (!aIsLearning && bIsLearning) return 1;
                  return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
                });
              
              if (newCardsToReview.length > 0) {
                setReviewQueue(newCardsToReview);
                setCurrentCardIndex(0);
                setElaborationInputText(newCardsToReview[0]?.lastElaboration || '');
                setAnimationState('sliding-in');
              } else {
                // If no immediate cards but session should continue, show waiting message
                const hasCardsWithinHour = allFlashcards.some(fc => {
                  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
                  return fc.deckId === DEFAULT_DECK_ID && 
                         new Date(fc.nextReviewDate) <= oneHourFromNow &&
                         (fc.isLearning || fc.repetitions === 0);
                });
                
                if (hasCardsWithinHour) {
                  // Show temporary waiting state and refresh in a few seconds
                  setTimeout(() => {
                    // Recursively check again
                    const refreshedCards = allFlashcards
                      .filter(fc => 
                        fc.deckId === DEFAULT_DECK_ID && 
                        new Date(fc.nextReviewDate) <= new Date()
                      );
                    
                    if (refreshedCards.length > 0) {
                      setReviewQueue(refreshedCards.sort((a, b) => {
                        const aIsLearning = a.isLearning || a.repetitions === 0;
                        const bIsLearning = b.isLearning || b.repetitions === 0;
                        if (aIsLearning && !bIsLearning) return -1;
                        if (!aIsLearning && bIsLearning) return 1;
                        return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
                      }));
                      setCurrentCardIndex(0);
                      setElaborationInputText(refreshedCards[0]?.lastElaboration || '');
                      setAnimationState('sliding-in');
                    }
                  }, 3000); // Wait 3 seconds and check again
                } else {
                  setElaborationInputText('');
                  setIsReflectionModalOpen(true);
                  setAnimationState('idle');
                }
              }
            } else {
              setElaborationInputText('');
              setIsReflectionModalOpen(true);
              setAnimationState('idle'); 
            }
        }
        
        if (nextCardExists || shouldContinueSession()) {
            setTimeout(() => setAnimationState('idle'), 300);
        }
    }, 300); 
  }, [currentCardIndex, reviewQueue, shouldContinueSession, allFlashcards]);


  const handleReview = useCallback(async (outcome: ReviewOutcome) => {
    if (animationState !== 'idle' || currentCardIndex >= reviewQueue.length) {
      console.warn("Review attempt while not idle or out of bounds", { currentCardIndex, reviewQueueLength: reviewQueue.length, animationState });
      return;
    }

    const currentCard = reviewQueue[currentCardIndex];
    if (!currentCard || !currentCard.id) {
      console.error("Current card is undefined or has no ID in handleReview");
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
      console.error("Failed to update flashcard");
      setFeedbackToast({ text: "Error al actualizar la tarjeta", type: "error" });
      return;
    }
    
    let toastText = "";
    let toastType: 'success' | 'error' | 'info' | 'warning' = 'info';
    const timeEstimate = getTimeEstimate(updatedCard.interval);
    const wasLearning = currentCard.isLearning || currentCard.repetitions === 0;
    const isNowLearning = updatedCard.isLearning;

    switch (quality) {
        case 1: 
            if (isNowLearning) {
              toastText = `🔄 Reiniciando aprendizaje. La verás en ${timeEstimate}.`;
            } else {
              toastText = `🔄 Olvidada. Volviendo a aprender en ${timeEstimate}.`;
            }
            toastType = 'error';
            break;
        case 2: 
            if (isNowLearning) {
              toastText = `⚠️ Progresando lentamente. Siguiente paso en ${timeEstimate}.`;
            } else {
              toastText = `⚠️ Difícil pero avanzas. Repaso en ${timeEstimate}.`;
            }
            toastType = 'warning';
            break;
        case 3: 
            if (wasLearning && !isNowLearning) {
              toastText = `🎓 ¡Graduada! Ahora la verás en ${timeEstimate}.`;
              toastType = 'success';
            } else if (isNowLearning) {
              toastText = `📚 Aprendiendo. Siguiente paso en ${timeEstimate}.`;
              toastType = 'info';
            } else {
              toastText = `✅ Recordada correctamente. Próxima en ${timeEstimate}.`;
              toastType = 'info';
            }
            break;
        case 4: 
            if (wasLearning && !isNowLearning) {
              toastText = `🎓 ¡Graduada exitosamente! Próxima en ${timeEstimate}.`;
              toastType = 'success';
            } else if (isNowLearning) {
              toastText = `📈 Buen progreso. Siguiente paso en ${timeEstimate}.`;
              toastType = 'success';
            } else {
              toastText = `🎯 ¡Bien recordada! Próxima revisión en ${timeEstimate}.`;
              toastType = 'success';
            }
            break;
        case 5: 
            if (wasLearning) {
              toastText = `🚀 ¡Graduación rápida! Intervalo directo a ${timeEstimate}.`;
            } else {
              toastText = `🚀 ¡Perfecto! Intervalo extendido a ${timeEstimate}.`;
            }
            toastType = 'success';
            break;
        default:
            toastText = `📝 Revisión registrada. Próxima en ${timeEstimate}.`; 
            toastType = 'info';
    }
    setFeedbackToast({ text: toastText, type: toastType });

    setTimeout(() => {
        proceedToNextCardOrEnd();
    }, 1500); 

  }, [
    currentCardIndex, 
    reviewQueue, 
    animationState,
    elaborationInputText, 
    setAllFlashcards, 
    proceedToNextCardOrEnd,
  ]);

  // Keyboard shortcuts handler (similar to Anki)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (animationState !== 'idle' || feedbackToast) return;
      
      if (!showAnswer) {
        if (event.code === 'Space' || event.code === 'Enter') {
          event.preventDefault();
          setShowAnswer(true);
        }
      } else {
        switch (event.code) {
          case 'Digit1':
          case 'Numpad1':
            event.preventDefault();
            handleReview(ReviewOutcome.AGAIN);
            break;
          case 'Digit2':
          case 'Numpad2':
            event.preventDefault();
            handleReview(ReviewOutcome.HARD);
            break;
          case 'Digit3':
          case 'Numpad3':
            event.preventDefault();
            handleReview(ReviewOutcome.GOOD);
            break;
          case 'Digit4':
          case 'Numpad4':
            event.preventDefault();
            handleReview(ReviewOutcome.EASY);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showAnswer, animationState, feedbackToast, handleReview]);

  const handleSaveReflection = () => {
    if (currentReflectionText.trim()) {
      const newReflection: SessionReflection = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        text: currentReflectionText.trim(),
        sessionType: 'flashcards',
      };
      setSessionReflections(prev => [newReflection, ...prev]);
    }
    setIsReflectionModalOpen(false);
    setCurrentReflectionText('');
    navigate('/flashcards');
  };

  const currentCard = useMemo(() => reviewQueue[currentCardIndex], [reviewQueue, currentCardIndex]);
  
  useEffect(() => { 
    if (currentCard && animationState === 'idle' && !feedbackToast) {
      setElaborationInputText(currentCard.lastElaboration || '');
    }
  }, [currentCard, animationState, feedbackToast]);


  if (reviewQueue.length === 0 && !isReflectionModalOpen) {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    const learningCards = allFlashcards.filter(fc => 
      fc.deckId === DEFAULT_DECK_ID && (fc.isLearning || fc.repetitions === 0)
    ).length;
    
    const cardsWithinHour = allFlashcards.filter(fc => 
      fc.deckId === DEFAULT_DECK_ID && 
      new Date(fc.nextReviewDate) <= oneHourFromNow &&
      (fc.isLearning || fc.repetitions === 0)
    ).length;
    
    const nextCardTime = allFlashcards
      .filter(fc => fc.deckId === DEFAULT_DECK_ID && (fc.isLearning || fc.repetitions === 0))
      .map(fc => new Date(fc.nextReviewDate))
      .sort((a, b) => a.getTime() - b.getTime())[0];
    
    // If there are cards coming within the hour, show waiting message
    if (cardsWithinHour > 0 && nextCardTime) {
      const timeUntilNext = Math.ceil((nextCardTime.getTime() - now.getTime()) / (1000 * 60)); // minutes
      
      return (
        <div className="p-4 text-center">
          <h1 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200">
            🕐 Esperando próxima tarjeta
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Tienes {cardsWithinHour} tarjeta{cardsWithinHour > 1 ? 's' : ''} en aprendizaje. 
            La próxima aparecerá en {timeUntilNext <= 0 ? 'menos de 1' : timeUntilNext} minuto{timeUntilNext !== 1 ? 's' : ''}.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => {
                // Force refresh of queue
                const immediateCards = allFlashcards.filter(fc => 
                  fc.deckId === DEFAULT_DECK_ID && new Date(fc.nextReviewDate) <= new Date()
                );
                if (immediateCards.length > 0) {
                  window.location.reload();
                }
              }} 
              className="w-full"
            >
              🔄 Verificar tarjetas ahora
            </Button>
            <Button variant="ghost" onClick={() => navigate('/flashcards')} className="w-full">
              Pausar sesión
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="p-4 text-center">
        <h1 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200">
          {learningCards > 0 ? '¡Sesión completada!' : '¡Todo repasado!'}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          {learningCards > 0 ? 
            `Excelente progreso. Tienes ${learningCards} tarjeta${learningCards > 1 ? 's' : ''} aún en aprendizaje que aparecerán según su programación (más de 1 hora).` :
            'No hay flashcards pendientes de repaso.'
          }
        </p>
        <Button onClick={() => navigate('/flashcards')}>Volver a Flashcards</Button>
      </div>
    );
  }

  if (!currentCard && !isReflectionModalOpen && reviewQueue.length > 0) {
     return (
      <div className="p-4 text-center">
        <p className="text-slate-600 dark:text-slate-300 mb-6">Cargando tarjeta...</p>
      </div>
    );
  }


  const progressPercentage = reviewQueue.length > 0 ? ((currentCardIndex + 1) / reviewQueue.length) * 100 : 0;

  const getAnimationClass = () => {
    if (animationState === 'sliding-out') return 'animate-slide-out';
    if (animationState === 'sliding-in') return 'animate-slide-in';
    return '';
  };
  
  const getToastBgColor = () => {
    if (!feedbackToast) return 'bg-slate-700';
    switch (feedbackToast.type) {
      case 'success': return 'bg-emerald-500';
      case 'error': return 'bg-red-600';
      case 'warning': return 'bg-orange-500';
      case 'info': return 'bg-sky-500';
      default: return 'bg-slate-700';
    }
  };
  
  if (!currentCard && !isReflectionModalOpen) {
    return (
      <div className="p-4 text-center">
        <p className="text-slate-600 dark:text-slate-300 mb-6">Finalizando sesión...</p>
         <Button onClick={() => navigate('/flashcards')}>Volver a Flashcards</Button>
      </div>
    );
  }
  
  return (
    <div className="p-4 flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-80px)]">
      <style>{`
        .flashcard-container {
          perspective: 1000px;
        }
        .flashcard-flipper {
          width: 100%;
          height: 100%;
          transition: transform 0.6s;
          transform-style: preserve-3d;
          position: relative;
        }
        .flashcard-flipper.flipped {
          transform: rotateY(180deg);
        }
        .flashcard-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between; 
          padding: 1rem; 
          border-radius: 1rem; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .flashcard-front {
          background-color: white;
          color: #333333;
        }
        .dark .flashcard-front {
          background-color: #1E293B; /* slate-800 */
          color: #E0E0E0;
        }
        .flashcard-back {
          background-color: white;
          color: #333333;
          transform: rotateY(180deg);
        }
        .dark .flashcard-back {
          background-color: #1E293B; /* slate-800 */
          color: #E0E0E0;
        }
        .flashcard-content-area {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: center; 
          align-items: center;
          text-align: center;
          overflow-y: auto; 
          max-height: calc(100% - 40px); 
        }
        .flashcard-elaboration-display {
           font-size: 0.875rem; 
           margin-top: 0.75rem; 
           padding-top: 0.5rem; 
           border-top: 1px solid #e2e8f0; 
           text-align: left;
           width: 100%;
           max-height: 80px; 
           overflow-y: auto;
        }
        .dark .flashcard-elaboration-display {
           border-top-color: #334155; 
        }
        @keyframes slide-out {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-100%); opacity: 0; }
        }
        .animate-slide-out { animation: slide-out 0.3s forwards; }
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s forwards; }
      `}</style>

      {!isReflectionModalOpen && currentCard && (
        <>
          <header className="mb-4">
            <h1 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100">Sesión de Repaso</h1>
            <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400 mt-1">
              <span>Tarjeta {currentCardIndex + 1} de {reviewQueue.length}</span>
              <span>
                {currentCard.isLearning || currentCard.repetitions === 0 ? 
                  `🎓 Aprendiendo (paso ${(currentCard.currentLearningStep || 0) + 1})` : 
                  `Repeticiones: ${currentCard.repetitions}`
                }
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500">
              <span>Dificultad: {currentCard.easiness.toFixed(1)}</span>
              <span>
                {currentCard.isLearning || currentCard.repetitions === 0 ? 
                  "Estado: Aprendiendo" : 
                  `Último intervalo: ${getTimeEstimate(currentCard.interval)}`
                }
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mt-2">
              <div className="bg-cyan-500 dark:bg-cyan-400 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </header>

          <div className={`flex-grow flex items-center justify-center relative flashcard-container ${getAnimationClass()}`}>
            <div 
                className="w-full max-w-[300px] h-[480px] sm:max-w-[350px] sm:h-[500px]" 
                onClick={!showAnswer && animationState === 'idle' ? () => setShowAnswer(true) : undefined}
                role="button"
                aria-pressed={showAnswer}
                tabIndex={0}
                onKeyDown={(e) => {if(e.key === ' ' || e.key === 'Enter') { if(!showAnswer && animationState === 'idle') setShowAnswer(true)}}}
            >
                <div className={`flashcard-flipper ${showAnswer ? 'flipped' : ''}`}>
                    {/* Front Face */}
                    <div className="flashcard-face flashcard-front">
                        <div className="flashcard-content-area">
                            <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Anverso</p>
                            <p className="text-xl md:text-2xl font-semibold break-words whitespace-pre-wrap">{currentCard.front}</p>
                        </div>
                        {currentCard.lastElaboration && (
                           <div className="flashcard-elaboration-display">
                               <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Tu nota anterior:</p>
                               <p className="text-slate-500 dark:text-slate-400 whitespace-pre-wrap">{currentCard.lastElaboration}</p>
                           </div>
                        )}
                    </div>
                    {/* Back Face */}
                    <div className="flashcard-face flashcard-back">
                        <div className="flashcard-content-area">
                             <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Reverso</p>
                            <p className="text-lg md:text-xl break-words whitespace-pre-wrap">{currentCard.back}</p>
                        </div>
                         <div className="w-full">
                            <label htmlFor="elaboration" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 text-left">
                              Notas de Elaboración (opcional):
                            </label>
                            <textarea
                              id="elaboration"
                              rows={2}
                              value={elaborationInputText}
                              onClick={(e) => e.stopPropagation()} 
                              onChange={(e) => setElaborationInputText(e.target.value)}
                              className="w-full p-1.5 text-sm border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
                              placeholder="Ej: Conexión con teoría X..."
                            />
                        </div>
                    </div>
                </div>
            </div>
            {feedbackToast && (
                <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md shadow-lg text-white text-sm
                                ${getToastBgColor()} 
                                transition-opacity duration-300 ${feedbackToast ? 'opacity-100' : 'opacity-0'}`}>
                    {feedbackToast.text}
                </div>
            )}
          </div>

          <div className="mt-6 w-full">
            {!showAnswer ? (
              <div className="text-center">
                <Button onClick={() => setShowAnswer(true)} className="w-full" size="lg">
                  Mostrar Respuesta
                </Button>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  💡 Presiona Espacio o Enter para mostrar la respuesta
                </p>
              </div>
            ) : (
              <div className="w-full">
                {feedbackToast && (
                  <div className="text-center mb-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {feedbackToast.text}
                    </p>
                  </div>
                )}
                
                <div className="space-y-3 w-full">
                  <p className="text-center text-sm text-slate-600 dark:text-slate-300 mb-4">
                    ¿Cómo fue tu experiencia recordando esta información?
                  </p>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <Button 
                      onClick={() => handleReview(ReviewOutcome.AGAIN)} 
                      disabled={!!feedbackToast}
                      className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800 text-left p-4 h-auto flex flex-col items-start w-full disabled:opacity-50" 
                      size="md"
                    >
                      <span className="font-semibold">🔄 Otra vez</span>
                      <span className="text-xs opacity-90 mt-1">
                        {getTimeEstimate(getPreviewInterval(ReviewOutcome.AGAIN))}
                      </span>
                      <span className="text-xs opacity-75 mt-0.5">Tecla: 1</span>
                    </Button>
                    <Button 
                      onClick={() => handleReview(ReviewOutcome.HARD)} 
                      disabled={!!feedbackToast}
                      className="bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700 text-left p-4 h-auto flex flex-col items-start w-full disabled:opacity-50" 
                      size="md"
                    >
                      <span className="font-semibold">⚠️ Difícil</span>
                      <span className="text-xs opacity-90 mt-1">
                        {getTimeEstimate(getPreviewInterval(ReviewOutcome.HARD))}
                      </span>
                      <span className="text-xs opacity-75 mt-0.5">Tecla: 2</span>
                    </Button>
                    <Button 
                      onClick={() => handleReview(ReviewOutcome.GOOD)} 
                      disabled={!!feedbackToast}
                      className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800 text-left p-4 h-auto flex flex-col items-start w-full disabled:opacity-50" 
                      size="md"
                    >
                      <span className="font-semibold">✅ Bien</span>
                      <span className="text-xs opacity-90 mt-1">
                        {getTimeEstimate(getPreviewInterval(ReviewOutcome.GOOD))}
                      </span>
                      <span className="text-xs opacity-75 mt-0.5">Tecla: 3</span>
                    </Button>
                    <Button 
                      onClick={() => handleReview(ReviewOutcome.EASY)} 
                      disabled={!!feedbackToast}
                      className="bg-lime-500 hover:bg-lime-600 text-white dark:bg-lime-600 dark:hover:bg-lime-700 text-left p-4 h-auto flex flex-col items-start w-full disabled:opacity-50" 
                      size="md"
                    >
                      <span className="font-semibold">🚀 Fácil</span>
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
                      🔄 Otra vez = Reiniciar aprendizaje | ⚠️ Difícil = Progreso lento | ✅ Bien = Avance normal | 🚀 Fácil = Graduación rápida
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      ⌨️ Usa las teclas 1-4 para responder rápidamente
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
           <Button variant="ghost" onClick={() => navigate('/flashcards')} className="w-full mt-4 text-sm dark:text-slate-400 dark:hover:text-slate-200">
              Salir de la sesión
            </Button>
        </>
      )}

      <Modal isOpen={isReflectionModalOpen} onClose={() => {setIsReflectionModalOpen(false); navigate('/flashcards');}} title="Reflexión de la Sesión">
        <div>
          <label htmlFor="reflectionText" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            ¿Qué aprendiste o qué podrías mejorar para la próxima sesión de estudio de flashcards?
          </label>
          <textarea
            id="reflectionText"
            value={currentReflectionText}
            onChange={(e) => setCurrentReflectionText(e.target.value)}
            rows={4}
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
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
