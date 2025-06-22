
import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Flashcard } from '../types';
import { DocumentArrowUpIcon } from '../ui-assets';
import { GoogleGenAI, GenerateContentResponse }  from '@google/genai';

interface ImportFlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>;
  deckId: string;
}

// Helper function to read file content as text
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

interface GeminiFlashcardResponseItem {
  id: string; // uuid-v4
  type: 'open_ended' | 'multiple_choice' | 'fill_in_blank';
  question: string;
  choices?: string[];
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  section: string;
}

const MAX_CHUNK_CHAR_LENGTH = 750000; 
const MAX_RETRIES_PER_CHUNK = 2;
const RETRY_DELAY_MS = 1500;

const ImportFlashcardsModal: React.FC<ImportFlashcardsModalProps> = ({ isOpen, onClose, setFlashcards, deckId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [apiKeyMessage, setApiKeyMessage] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setFeedbackMessage(null);
      setApiKeyMessage(null);
      if (file.name.endsWith('.pdf')) {
        setFeedbackMessage({ type: 'info', text: 'La extracción de texto de PDF es compleja. Para mejores resultados, convierte el PDF a TXT o pega el texto manualmente si es posible.' });
      }
    }
  };
  
  const constructGeminiPrompt = (documentChunkText: string): string => {
    return `DOCUMENT_TEXT: <<<${documentChunkText}>>>

INSTRUCCIONES:
1) Lee todo el texto proporcionado (este fragmento del documento) 3 veces para máxima comprensión.
2) Genera un conjunto de preguntas relevantes basadas ÚNICAMENTE en el texto de este fragmento. El número de preguntas debe ser proporcional al tamaño y densidad de información del fragmento, apuntando a entre 3 y 7 preguntas de calidad si el fragmento es sustancial.
3) Aplica estos criterios de distribución aproximada para los tipos de pregunta:
   • 40% preguntas de recuerdo (hechos, definiciones).
   • 40% de aplicación (resolución de casos prácticos o ejemplos de uso).
   • 20% de análisis (comparaciones, interpretaciones, causa-efecto).
4) Usa estos formatos de salida JSON. Asegúrate de que la respuesta sea un array JSON válido:
  [{
     "id": "uuid-v4-auto-generado",
     "type": "multiple_choice",
     "question": "¿Cuál es...?",
     "choices": ["Opción A Correcta","Opción B Distractor","Opción C Distractor","Opción D Distractor"],
     "answer": "Opción A Correcta",
     "difficulty": "medium",
     "section": "Título de la sección de origen (inferido del fragmento)"
  },
  {
     "id": "uuid-v4-auto-generado-2",
     "type": "open_ended",
     "question": "Explica el concepto de...",
     "answer": "Respuesta detallada...",
     "difficulty": "hard",
     "section": "Otra sección (inferido del fragmento)"
  }]
5) Para 'multiple_choice', crea 3 distractores que sean plausibles pero incorrectos. La respuesta correcta debe ser una de las opciones.
6) Asegura que cada pregunta incluya el campo 'section', derivado del contenido del fragmento. Si no hay secciones explícitas en este fragmento, usa "Fragmento General".
7) El 'id' debe ser un placeholder como "uuid-v4-auto-generado", ya que la app lo reemplazará.`;
  };

  const splitTextIntoChunks = (text: string, maxLength: number): string[] => {
    const chunks: string[] = [];
    let currentPosition = 0;
    while (currentPosition < text.length) {
      let chunkEnd = Math.min(currentPosition + maxLength, text.length);
      if (chunkEnd < text.length) {
        const lastParagraphBreak = text.lastIndexOf('\n\n', chunkEnd);
        if (lastParagraphBreak > currentPosition && lastParagraphBreak > chunkEnd - (maxLength / 2) ) { 
          chunkEnd = lastParagraphBreak + 2;
        } else {
            const lastSentenceBreak = text.lastIndexOf('.', chunkEnd);
             if (lastSentenceBreak > currentPosition && lastSentenceBreak > chunkEnd - (maxLength / 2)) {
                chunkEnd = lastSentenceBreak + 1;
             }
        }
      }
      chunks.push(text.substring(currentPosition, chunkEnd));
      currentPosition = chunkEnd;
    }
    return chunks;
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleProcessDocument = async () => {
    if (!selectedFile) {
      setFeedbackMessage({ type: 'error', text: 'Por favor, selecciona un archivo.' });
      return;
    }

    if (!process.env.API_KEY) {
      setApiKeyMessage("La API Key de Gemini no está configurada. Por favor, configura la variable de entorno process.env.API_KEY.");
      setFeedbackMessage({ type: 'error', text: 'Falta configuración para la API.' });
      setIsLoading(false);
      return;
    }
    setApiKeyMessage(null);

    if (selectedFile.name.endsWith('.pdf')) {
        setFeedbackMessage({ type: 'info', text: 'La importación directa de PDF no está completamente soportada. Por favor, usa un archivo .txt o convierte tu PDF a texto plano.' });
    }
    
    setIsLoading(true);
    setFeedbackMessage({ type: 'info', text: 'Leyendo archivo...' });

    try {
      const documentText = await readFileAsText(selectedFile);
      if (!documentText.trim()) {
        setFeedbackMessage({ type: 'error', text: 'El archivo está vacío o no se pudo leer el contenido.' });
        setIsLoading(false);
        return;
      }

      const textChunks = splitTextIntoChunks(documentText, MAX_CHUNK_CHAR_LENGTH);
      const totalChunks = textChunks.length;
      let allGeneratedFlashcards: Flashcard[] = [];
      let chunkErrors = 0;
      let successfulChunks = 0;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = "Eres un asistente que procesa documentos y genera preguntas de estudio con alta calidad académica. Tu objetivo es leer el texto provisto hasta tres veces internamente y luego crear flashcards detalladas en formato JSON.";

      for (let i = 0; i < totalChunks; i++) {
        const chunkText = textChunks[i];
        let retries = 0;
        let chunkSuccess = false;

        while (retries <= MAX_RETRIES_PER_CHUNK && !chunkSuccess) {
          if (retries > 0) {
            setFeedbackMessage({ type: 'info', text: `Reintentando fragmento ${i + 1} de ${totalChunks} (intento ${retries})...` });
            await delay(RETRY_DELAY_MS * retries); 
          } else {
            setFeedbackMessage({ type: 'info', text: `Procesando fragmento ${i + 1} de ${totalChunks} con IA...` });
          }
        
          try {
            const userPrompt = constructGeminiPrompt(chunkText);
            const response: GenerateContentResponse = await ai.models.generateContent({
              model: "gemini-2.5-flash-preview-04-17",
              contents: [{ role: "user", parts: [{text: userPrompt}] }],
              config: {
                systemInstruction: systemInstruction,
                temperature: 0.2,
                maxOutputTokens: 4096, 
                topP: 0.9,
                responseMimeType: "application/json",
              }
            });

            if (!response || !response.text) {
              throw new Error('Respuesta de Gemini sin texto.'); 
            }

            let jsonStr = response.text.trim();
            const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
            const match = jsonStr.match(fenceRegex);
            if (match && match[2]) {
              jsonStr = match[2].trim();
            }
            
            const parsedJson = JSON.parse(jsonStr);

            if (typeof parsedJson === 'object' && parsedJson !== null && 'error' in parsedJson) {
                const geminiError = (parsedJson as { error: string | { message?: string } }).error;
                const errorMessage = typeof geminiError === 'string' ? geminiError : (geminiError.message || "Error desconocido de la IA al procesar contenido.");
                throw new Error(`Error de contenido de Gemini: ${errorMessage}`);
            }
            
            let chunkGeneratedData: GeminiFlashcardResponseItem[];
            if (Array.isArray(parsedJson)) {
              chunkGeneratedData = parsedJson;
            } else if (typeof parsedJson === 'object' && parsedJson !== null) {
                const arrayKey = Object.keys(parsedJson).find(key => Array.isArray((parsedJson as any)[key]));
                if (arrayKey) {
                    chunkGeneratedData = (parsedJson as any)[arrayKey];
                } else {
                    throw new Error("La respuesta JSON no es un array ni contiene un array de flashcards.");
                }
            } else {
                 throw new Error("La respuesta JSON no es un array de flashcards.");
            }

            const newFlashcardsFromChunk: Flashcard[] = chunkGeneratedData.map((item, index) => ({
              id: `gemini-${Date.now()}-${i}-${index}`,
              front: item.question,
              back: item.answer,
              deckId: deckId,
              lastReviewed: null,
              nextReviewDate: new Date().toISOString(),
              tags: ["imported", `difficulty:${item.difficulty}`, `section:${item.section || 'General'}`, `type:${item.type}`],
              qualityHistory: [],
              easiness: 2.5,
              repetitions: 0,
              interval: 0,
              lastElaboration: '',
            }));
            allGeneratedFlashcards.push(...newFlashcardsFromChunk);
            successfulChunks++;
            chunkSuccess = true; // Mark chunk as successfully processed

          } catch (chunkError) {
            console.error(`Error al procesar fragmento ${i + 1} (intento ${retries}) con Gemini:`, chunkError);
            let errorText = `Error al procesar fragmento ${i + 1}.`;
            let isRetryable = false;

            if (chunkError instanceof Error) {
                if (chunkError.message.includes('API key not valid')) {
                    errorText = 'La API Key de Gemini no es válida o ha expirado.';
                } else if (chunkError.message.includes('quota') || chunkError.message.includes('resourceExhausted')) {
                    errorText = `Se ha excedido la cuota de la API de Gemini.`;
                } else if (chunkError.message.includes('token count')) { // Input token limit
                    errorText = `El fragmento ${i+1} es demasiado grande para la IA.`;
                } else if (chunkError.message.includes('INTERNAL') || chunkError.message.includes('Service Unavailable') || chunkError.message.includes('timeout')) {
                    errorText = `Error interno/temporal de la API de Gemini en fragmento ${i+1}.`;
                    isRetryable = true;
                } else if (chunkError.message.startsWith('Error de contenido de Gemini:')) {
                    errorText = `Fragmento ${i+1}: ${chunkError.message.substring(0,200)}`;
                } else if (chunkError.message.startsWith('Respuesta de Gemini sin texto')) {
                     errorText = `Fragmento ${i+1}: Respuesta inválida de la IA.`;
                } else if (chunkError.message.includes('JSON')) {
                    errorText = `Error al interpretar respuesta de IA para fragmento ${i+1}.`;
                } else {
                    errorText = `Error en API para fragmento ${i+1}: ${chunkError.message.substring(0,100)}`;
                }
            }
            
            if (isRetryable && retries < MAX_RETRIES_PER_CHUNK) {
                retries++;
                setFeedbackMessage({ type: 'info', text: `${errorText} Reintentando...` });
            } else {
                setFeedbackMessage({ type: 'error', text: `${errorText} No se reintentará más este fragmento.` });
                chunkErrors++;
                break; // Exit retry loop for this chunk
            }
          }
        } // End of retry while loop
      } // End of chunks for loop
      
      if (allGeneratedFlashcards.length > 0) {
        setFlashcards(prev => [...prev, ...allGeneratedFlashcards]);
        let successMessage = `${allGeneratedFlashcards.length} flashcards generadas e importadas de ${successfulChunks} fragmento(s) exitoso(s).`;
        if (chunkErrors > 0) {
          successMessage += ` ${chunkErrors} fragmento(s) no pudieron ser procesados.`;
        }
        setFeedbackMessage({ type: 'success', text: successMessage });
      } else if (chunkErrors === totalChunks && totalChunks > 0) {
        setFeedbackMessage({ type: 'error', text: 'No se pudieron generar flashcards. Todos los fragmentos fallaron.' });
      } else if (totalChunks === 0){
         setFeedbackMessage({ type: 'error', text: 'El documento parece estar vacío o no se pudo dividir en fragmentos.' });
      } else {
         setFeedbackMessage({ type: 'info', text: 'No se generaron flashcards. Revisa el documento o intenta con uno diferente.' });
      }
      setSelectedFile(null); 

    } catch (error) { 
      console.error("Error general al procesar el documento:", error);
      setFeedbackMessage({ type: 'error', text: `Error general: ${(error as Error).message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setIsLoading(false);
    setFeedbackMessage(null);
    setApiKeyMessage(null);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar Flashcards con IA">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Sube un archivo <strong className="font-semibold">.txt</strong>. La aplicación usará la IA de Gemini para procesar el contenido y generar flashcards automáticamente.
          La extracción de texto de PDFs es compleja; convierte tu PDF a TXT para mejores resultados.
        </p>
        {apiKeyMessage && (
            <p className="text-sm p-2 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-700/30 dark:text-amber-300">
                <strong>Aviso:</strong> {apiKeyMessage}
            </p>
        )}
        <div>
          <label htmlFor="doc-upload" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Seleccionar Documento (.txt)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-slate-400" />
              <div className="flex text-sm text-slate-600 dark:text-slate-400">
                <label
                  htmlFor="doc-upload-input"
                  className="relative cursor-pointer bg-white dark:bg-slate-700 rounded-md font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-cyan-500 dark:focus-within:ring-offset-slate-800"
                >
                  <span>Sube un archivo .txt</span>
                  <input id="doc-upload-input" name="doc-upload-input" type="file" className="sr-only" onChange={handleFileChange} accept=".txt,.pdf" />
                </label>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500">Archivos TXT son procesados. PDFs tienen soporte limitado.</p>
            </div>
          </div>
          {selectedFile && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {feedbackMessage && (
          <p className={`text-sm p-2 rounded-md ${feedbackMessage.type === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-300' : feedbackMessage.type === 'error' ? 'bg-rose-100 text-rose-700 dark:bg-rose-700/30 dark:text-rose-300' : 'bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-300'}`}>
            {feedbackMessage.text}
          </p>
        )}
      </div>

      <div className="mt-6 flex justify-end space-x-2">
        <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
          {feedbackMessage?.type === 'success' ? 'Cerrar' : 'Cancelar'}
        </Button>
        <Button onClick={handleProcessDocument} disabled={isLoading || !selectedFile}>
          {isLoading ? 'Procesando con IA...' : 'Generar Flashcards'}
        </Button>
      </div>
    </Modal>
  );
};

export default ImportFlashcardsModal;
