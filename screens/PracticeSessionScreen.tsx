
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import { Flashcard, ReviewOutcome, SessionReflection } from '../types';
import Button from '../components/Button';
import Modal from '../components/Modal';
import useNotifications from '../hooks/useNotifications'; // Import the hook

const DEFAULT_DECK_ID = 'default-deck';

// SM-2 Algorithm Implementation based on user specification
const applySM2 = (card: Flashcard, quality: number, elaboration?: string): Flashcard => {
  let newInterval: number;
  let newRepetitions: number;
  let newEasiness = card.easiness;

  if (quality < 0 || quality > 5) throw new Error("Quality must be between 0 and 5");

  if (quality < 3) { 
    newRepetitions = 0; 
    newInterval = 1;    
  } else { 
    newRepetitions = card.repetitions + 1;
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(card.interval * newEasiness);
    }
  }
  
  newEasiness = newEasiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEasiness < 1.3) newEasiness = 1.3; 
  
  newInterval = Math.max(1, newInterval);      
  newInterval = Math.min(newInterval, 365);  

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  const updatedQualityHistory = [...card.qualityHistory, { date: new Date().toISOString(), quality }];

  return {
    ...card,
    interval: newInterval,
    repetitions: newRepetitions,
    easiness: newEasiness,
    nextReviewDate: nextReviewDate.toISOString(),
    lastReviewed: new Date().toISOString(),
    qualityHistory: updatedQualityHistory,
    lastElaboration: elaboration?.trim() ? elaboration.trim() : card.lastElaboration,
  };
};


const PracticeSessionScreen: React.FC = () => {
  const [allFlashcards, setAllFlashcards] = useLocalStorage<Flashcard[]>('flashcards', []);
  const [sessionReflections, setSessionReflections] = useLocalStorage<SessionReflection[]>('sessionReflections', []);
  
  const [reviewQueue, setReviewQueue] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false); 
  const [feedbackToast, setFeedbackToast] = useState<{text: string, type: 'success' | 'error' | 'info' | 'warning'} | null>(null);
  const [elaborationInputText, setElaborationInputText] = useState('');
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [currentReflectionText, setCurrentReflectionText] = useState('');
  const [animationState, setAnimationState] = useState<'idle' | 'sliding-out' | 'sliding-in'>('idle');
  
  const { showNotification, permission, requestPermission } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    const cardsToReview = allFlashcards
      .filter(fc => fc.deckId === DEFAULT_DECK_ID && new Date(fc.nextReviewDate) <= new Date())
      .sort((a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime());
    
    setReviewQueue(cardsToReview);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setFeedbackToast(null);
    setElaborationInputText(cardsToReview[0]?.lastElaboration || '');
    setAnimationState('idle');

    if (cardsToReview.length > 0) {
      if (permission === 'default') {
        requestPermission().then(currentPerm => {
          if (currentPerm === 'granted') {
             showNotification("EstudioPro: Repaso Pendiente", { body: `Tienes ${cardsToReview.length} flashcards para repasar hoy.`, icon: '/icon-192.png' });
          }
        });
      } else if (permission === 'granted') {
        showNotification("EstudioPro: Repaso Pendiente", { body: `Tienes ${cardsToReview.length} flashcards para repasar hoy.`, icon: '/icon-192.png' });
      }
    }
  }, [allFlashcards, permission, requestPermission, showNotification]);

  const mapOutcomeToQuality = (outcome: ReviewOutcome): number => {
    switch (outcome) {
      case ReviewOutcome.AGAIN: return 0; 
      case ReviewOutcome.HARD: return 2;  
      case ReviewOutcome.GOOD: return 4;
      case ReviewOutcome.EASY: return 5;
      default: return 3; 
    }
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
            setElaborationInputText('');
            setIsReflectionModalOpen(true);
            setAnimationState('idle'); 
        }
        
        if (nextCardExists) {
            setTimeout(() => setAnimationState('idle'), 300);
        }
    }, 300); 
  }, [currentCardIndex, reviewQueue]);


  const handleReview = useCallback((outcome: ReviewOutcome) => {
    if (animationState !== 'idle' || currentCardIndex >= reviewQueue.length) {
      console.warn("Review attempt while not idle or out of bounds", { currentCardIndex, reviewQueueLength: reviewQueue.length, animationState });
      return;
    }

    const currentCard = reviewQueue[currentCardIndex];
    if (!currentCard) {
      console.error("Current card is undefined in handleReview");
      return;
    }
    const quality = mapOutcomeToQuality(outcome);
    const updatedCard = applySM2(currentCard, quality, elaborationInputText);

    setAllFlashcards(prevFlashcards =>
      prevFlashcards.map(fc =>
        fc.id === currentCard.id ? updatedCard : fc
      )
    );
    
    let toastText = "";
    let toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

    switch (quality) {
        case 0: 
            toastText = `No recuerdo. Se revisará mañana.`;
            toastType = 'error';
            break;
        case 2: 
            toastText = `Difícil. Próxima revisión en ${updatedCard.interval} día(s).`;
            toastType = 'warning';
            break;
        case 4: 
            toastText = `Bien. Próxima revisión en ${updatedCard.interval} día(s).`;
            toastType = 'success';
            break;
        case 5: 
            toastText = `Fácil. Próxima revisión en ${updatedCard.interval} día(s).`;
            toastType = 'success';
            break;
        default:
            toastText = "Revisión registrada."; 
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
    return (
      <div className="p-4 text-center">
        <h1 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200">¡Todo repasado!</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6">No hay flashcards pendientes de repaso.</p>
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
    <div className="p-4 flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-80px)] overflow-hidden">
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
              <span>Repetición actual: {currentCard.repetitions}</span>
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

          <div className="mt-6">
            {!showAnswer && animationState === 'idle' ? (
              <Button onClick={() => setShowAnswer(true)} className="w-full" size="lg">
                Mostrar Respuesta
              </Button>
            ) : showAnswer && animationState === 'idle' && !feedbackToast ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button onClick={() => handleReview(ReviewOutcome.AGAIN)} className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800" size="md">No recuerdo</Button>
                <Button onClick={() => handleReview(ReviewOutcome.HARD)} className="bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700" size="md">Difícil</Button>
                <Button onClick={() => handleReview(ReviewOutcome.GOOD)} className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800" size="md">Bien</Button>
                <Button onClick={() => handleReview(ReviewOutcome.EASY)} className="bg-lime-500 hover:bg-lime-600 text-white dark:bg-lime-600 dark:hover:bg-lime-700" size="md">Fácil</Button>
              </div>
            ) : (
              <div className="h-[52px]"> {/* Placeholder to maintain layout height */} </div>
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
