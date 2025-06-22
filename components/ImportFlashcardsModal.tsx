
import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Flashcard } from '../types';
import { DocumentArrowUpIcon } from '../ui-assets';
import { GoogleGenAI, GenerateContentResponse }  from '@google/genai';
import { GeminiTokenManager } from '../utils/geminiTokenManager';
import { OCRProcessor, OCRResult } from '../utils/ocrProcessor';

interface ImportFlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>;
  deckId: string;
}

interface GeminiFlashcardResponseItem {
  id: string; // uuid-v4
  type: 'open_ended' | 'multiple_choice' | 'fill_in_blank';
  question: string;
  choices?: string[];
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  section: string;
}

const ImportFlashcardsModal: React.FC<ImportFlashcardsModalProps> = ({ isOpen, onClose, setFlashcards, deckId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [apiKeyMessage, setApiKeyMessage] = useState<string | null>(null);
  const [ocrProcessor] = useState(() => new OCRProcessor());
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setFeedbackMessage(null);
      setApiKeyMessage(null);
      setExtractedText(null);
      setOcrResult(null);
      
      // Mostrar información sobre el tipo de archivo seleccionado
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.pdf')) {
        setFeedbackMessage({ type: 'info', text: '📄 PDF seleccionado. Se convertirá a imágenes y se usará OCR con Gemini para extraer el texto.' });
      } else if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/)) {
        setFeedbackMessage({ type: 'info', text: '🖼️ Imagen seleccionada. Se usará OCR para extraer el texto.' });
      } else if (fileName.match(/\.(txt|md|csv)$/)) {
        setFeedbackMessage({ type: 'info', text: '📝 Archivo de texto seleccionado. Se leerá directamente.' });
      } else {
        setFeedbackMessage({ type: 'error', text: '❌ Tipo de archivo no soportado. Usa PDF, imágenes (JPG, PNG, etc.) o archivos de texto (TXT, MD, CSV).' });
      }
    }
  };
  
  const constructGeminiPrompt = (documentChunkText: string): string => {
    return `Analiza este contenido educativo y genera flashcards que ayuden al aprendizaje:

CONTENIDO A ANALIZAR:
${documentChunkText}

INSTRUCCIONES PARA EL ANÁLISIS:
1. Lee y comprende profundamente el contenido, identificando conceptos clave, definiciones, procesos, y relaciones importantes.
2. Ignora aspectos estructurales del texto (números de página, formato, etc.) y enfócate ÚNICAMENTE en la información educativa.
3. Genera 3-5 preguntas que evalúen diferentes niveles de comprensión:
   - Definiciones y conceptos clave
   - Aplicación práctica de los conceptos
   - Relaciones entre ideas
   - Análisis y síntesis de la información

FORMATO DE RESPUESTA (JSON):
[{
   "id": "uuid",
   "type": "open_ended",
   "question": "¿Qué es [concepto clave] y cuáles son sus características principales?",
   "answer": "Respuesta completa basada en el contenido",
   "difficulty": "medium",
   "section": "Tema principal del fragmento"
},
{
   "id": "uuid", 
   "type": "multiple_choice",
   "question": "¿Cuál de las siguientes afirmaciones sobre [concepto] es correcta?",
   "choices": ["Opción basada en el contenido","Distractor plausible","Otro distractor","Distractor final"],
   "answer": "Opción basada en el contenido",
   "difficulty": "medium",
   "section": "Tema principal del fragmento"
}]

IMPORTANTE: Las preguntas deben ayudar a estudiar y memorizar la INFORMACIÓN REAL del contenido, no preguntar sobre el texto en sí.`;
  };

  const splitTextIntoChunks = (text: string, maxLength: number): string[] => {
    // Esta función será reemplazada por el GeminiTokenManager
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

  // Función helper para dividir chunks fallidos en partes más pequeñas
  const splitChunkIntoSmallerParts = (text: string, maxSize: number): string[] => {
    const parts: string[] = [];
    let currentPosition = 0;
    
    while (currentPosition < text.length) {
      let partEnd = Math.min(currentPosition + maxSize, text.length);
      
      // Buscar un punto de corte natural
      if (partEnd < text.length) {
        const sentenceBreak = text.lastIndexOf('.', partEnd);
        const paragraphBreak = text.lastIndexOf('\n', partEnd);
        const spaceBreak = text.lastIndexOf(' ', partEnd);
        
        const breakPoint = Math.max(sentenceBreak, paragraphBreak, spaceBreak);
        if (breakPoint > currentPosition && breakPoint > partEnd - (maxSize * 0.3)) {
          partEnd = breakPoint + 1;
        }
      }
      
      const part = text.substring(currentPosition, partEnd).trim();
      if (part.length > 0) {
        parts.push(part);
      }
      currentPosition = partEnd;
    }
    
    return parts;
  };

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
    
    setIsLoading(true);
    
    try {
      // Paso 1: Extraer texto usando OCR
      setFeedbackMessage({ type: 'info', text: '🔍 Procesando archivo y extrayendo texto...' });
      
      const ocrResult = await ocrProcessor.processFile(selectedFile);
      setOcrResult(ocrResult);
      setExtractedText(ocrResult.text);
      
      // Mostrar información sobre el resultado de la extracción
      let extractionInfo = `✅ Texto extraído usando ${ocrResult.processingMethod}. `;
      extractionInfo += `Caracteres procesados: ${ocrResult.text.length}`;
      if (ocrResult.confidence) {
        extractionInfo += `, Confianza OCR: ${ocrResult.confidence.toFixed(1)}%`;
      }
      if (ocrResult.totalPages) {
        extractionInfo += `, Páginas procesadas: ${ocrResult.totalPages}`;
      }
      
      console.log('📄 Resultado OCR:', ocrResult);
      
      if (!ocrResult.text.trim()) {
        setFeedbackMessage({ type: 'error', text: '❌ No se pudo extraer texto del archivo. Verifica que el archivo contenga texto legible.' });
        setIsLoading(false);
        return;
      }

      setFeedbackMessage({ type: 'info', text: `${extractionInfo}. Generando flashcards...` });

      // Paso 2: Procesar el texto extraído con Gemini
      const documentText = ocrResult.text;

      // Inicializar el gestor de tokens con tamaño muy pequeño
      const tokenManager = new GeminiTokenManager(20000); // Comenzar con chunks de solo 20K caracteres
      const systemInstruction = "Eres un experto pedagogo que analiza contenido educativo y crea preguntas de estudio efectivas. Tu objetivo es identificar conceptos clave, procesos importantes y relaciones entre ideas para generar flashcards que faciliten el aprendizaje y la memorización del contenido real.";
      const userPromptTemplate = constructGeminiPrompt("PLACEHOLDER_TEXT");
      
      console.log(`📄 Texto a procesar: ${documentText.length} caracteres`);
      console.log(`⚙️ Configuración inicial del gestor de tokens:`, tokenManager.getStats());
      
      // Dividir el texto usando el gestor inteligente de tokens
      const textChunks = tokenManager.splitTextIntoChunks(documentText, systemInstruction, userPromptTemplate);
      const totalChunks = textChunks.length;
      
      console.log(`✂️ Documento dividido en ${totalChunks} chunks`);
      textChunks.forEach((chunk, index) => {
        console.log(`  Chunk ${index + 1}: ${chunk.length} caracteres, ~${Math.ceil(chunk.length / 4)} tokens`);
      });
      let allGeneratedFlashcards: Flashcard[] = [];
      let chunkErrors = 0;
      let successfulChunks = 0;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      setFeedbackMessage({ 
        type: 'info', 
        text: `📊 Documento dividido en ${totalChunks} fragmentos (total: ${documentText.length} caracteres). Iniciando procesamiento...` 
      });

      // Función para procesar un chunk individual
      const processChunk = async (chunkText: string): Promise<any> => {
        const userPrompt = constructGeminiPrompt(chunkText);
        const response: GenerateContentResponse = await ai.models.generateContent({
          model: "gemini-1.5-flash", // Usar modelo más estable
          contents: [{ role: "user", parts: [{text: userPrompt}] }],
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.3, // Aumentar creatividad para mejor análisis educativo
            maxOutputTokens: 2048, // Reducido para ahorrar tokens
            topP: 0.9, // Más diversidad en respuestas
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

        return chunkGeneratedData;
      };

      // Procesar cada chunk con el gestor de tokens
      for (let i = 0; i < totalChunks; i++) {
        let chunkText = textChunks[i];
        
        setFeedbackMessage({ 
          type: 'info', 
          text: `Procesando fragmento ${i + 1} de ${totalChunks}... (Tamaño: ${chunkText.length} caracteres)` 
        });

        const result = await tokenManager.processChunkWithRetries(
          chunkText,
          processChunk,
          (message) => {
            setFeedbackMessage({ 
              type: 'info', 
              text: `Fragmento ${i + 1}/${totalChunks}: ${message}` 
            });
          }
        );

        if (result.success && result.data) {
          const newFlashcardsFromChunk: Flashcard[] = result.data.map((item: GeminiFlashcardResponseItem, index: number) => ({
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
          
          setFeedbackMessage({ 
            type: 'info', 
            text: `✅ Fragmento ${i + 1} procesado exitosamente. ${newFlashcardsFromChunk.length} flashcards generadas.` 
          });
          
        } else {
          console.error(`❌ Error al procesar fragmento ${i + 1}:`, result.error);
          
          // Si el chunk falló, intentar dividirlo en partes más pequeñas
          if (chunkText.length > 10000) { // Solo si es lo suficientemente grande para dividir
            console.log(`🔄 Intentando dividir fragmento ${i + 1} que falló...`);
            setFeedbackMessage({ 
              type: 'info', 
              text: `Fragmento ${i + 1} muy grande (${chunkText.length} chars). Dividiéndolo en partes más pequeñas...` 
            });
            
            // Dividir el chunk fallido en partes más pequeñas
            const smallerChunks = splitChunkIntoSmallerParts(chunkText, 8000); // 8K caracteres cada uno
            let subChunkSuccess = 0;
            
            for (let j = 0; j < smallerChunks.length; j++) {
              const subChunk = smallerChunks[j];
              console.log(`  📎 Procesando sub-fragmento ${j + 1}/${smallerChunks.length} de ${subChunk.length} caracteres`);
              
              setFeedbackMessage({ 
                type: 'info', 
                text: `Procesando sub-fragmento ${j + 1}/${smallerChunks.length} del fragmento ${i + 1}...` 
              });
              
              try {
                const subResult = await processChunk(subChunk);
                if (subResult && Array.isArray(subResult)) {
                  const newSubFlashcards: Flashcard[] = subResult.map((item: GeminiFlashcardResponseItem, index: number) => ({
                    id: `gemini-${Date.now()}-${i}-${j}-${index}`,
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
                  
                  allGeneratedFlashcards.push(...newSubFlashcards);
                  subChunkSuccess++;
                  
                  setFeedbackMessage({ 
                    type: 'info', 
                    text: `✅ Sub-fragmento ${j + 1}/${smallerChunks.length} procesado. ${newSubFlashcards.length} flashcards generadas.` 
                  });
                }
              } catch (subError) {
                console.error(`❌ Sub-fragmento ${j + 1} también falló:`, subError);
                setFeedbackMessage({ 
                  type: 'error', 
                  text: `❌ Sub-fragmento ${j + 1}/${smallerChunks.length} también falló.` 
                });
              }
              
              // Pequeña pausa entre sub-chunks para evitar rate limiting
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            if (subChunkSuccess > 0) {
              successfulChunks++;
              setFeedbackMessage({ 
                type: 'info', 
                text: `🎯 Fragmento ${i + 1} procesado parcialmente: ${subChunkSuccess}/${smallerChunks.length} sub-fragmentos exitosos.` 
              });
            } else {
              chunkErrors++;
              setFeedbackMessage({ 
                type: 'error', 
                text: `💥 Fragmento ${i + 1} falló completamente después de dividirlo. Error: ${result.error?.substring(0, 50)}...` 
              });
            }
          } else {
            // Chunk demasiado pequeño para dividir, simplemente contarlo como error
            chunkErrors++;
            setFeedbackMessage({ 
              type: 'error', 
              text: `❌ Fragmento ${i + 1} (${chunkText.length} chars) falló después de ${result.retries} intentos: ${result.error?.substring(0, 50)}...` 
            });
          }
        }
        
        // Pausa entre chunks para evitar rate limiting
        if (i < totalChunks - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Mostrar resultados finales
      if (allGeneratedFlashcards.length > 0) {
        setFlashcards(prev => [...prev, ...allGeneratedFlashcards]);
        let successMessage = `✅ ${allGeneratedFlashcards.length} flashcards generadas e importadas de ${successfulChunks} fragmento(s) exitoso(s).`;
        if (chunkErrors > 0) {
          successMessage += ` ⚠️ ${chunkErrors} fragmento(s) no pudieron ser procesados debido a límites de tokens o errores de API.`;
        }
        setFeedbackMessage({ type: 'success', text: successMessage });
      } else if (chunkErrors === totalChunks && totalChunks > 0) {
        setFeedbackMessage({ type: 'error', text: 'No se pudieron generar flashcards. Todos los fragmentos fallaron. Intenta con un documento más pequeño o verifica tu API key.' });
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
    setExtractedText(null);
    setOcrResult(null);
    
    // Limpiar recursos del OCR
    ocrProcessor.cleanup().catch(console.error);
    
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar Flashcards con IA">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Sube un archivo de documento para generar flashcards automáticamente con IA.
          <br /><br />
          <strong>🔍 Tipos de archivo soportados:</strong>
          <br />• <strong>PDFs:</strong> Extracción automática de texto
          <br />• <strong>Imágenes (JPG, PNG, etc.):</strong> OCR para extraer texto de imágenes escaneadas
          <br />• <strong>Archivos de texto (TXT, MD, CSV):</strong> Lectura directa
          <br /><br />
          <strong>🎓 Sistema de Análisis Educativo Inteligente:</strong>
          <br />• <strong>Análisis profundo de contenido:</strong> La IA analiza conceptos, definiciones, procesos y relaciones importantes.
          <br />• <strong>Preguntas educativas relevantes:</strong> Genera preguntas que evalúan comprensión, aplicación y análisis del contenido real.
          <br />• <strong>Enfoque pedagógico:</strong> Ignora aspectos estructurales del texto y se enfoca en la información educativa.
          <br />• <strong>Múltiples niveles de dificultad:</strong> Crea preguntas de diferentes tipos para evaluar distintos niveles de comprensión.
          <br />• <strong>Procesamiento inteligente:</strong> Fragmentos de 20K caracteres para mejor análisis detallado.
          <br /><br />
          <strong>💡 Mejora clave:</strong> Ahora genera preguntas sobre EL CONTENIDO y la INFORMACIÓN, no sobre el texto en sí.
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
                  <span>Sube un archivo (PDF, imagen, texto)</span>
                  <input id="doc-upload-input" name="doc-upload-input" type="file" className="sr-only" onChange={handleFileChange} accept=".txt,.pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp,.md,.csv" />
                </label>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500">PDF, imágenes (OCR) y archivos de texto soportados</p>
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

        {extractedText && ocrResult && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              ✅ Texto extraído ({ocrResult.processingMethod})
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Caracteres: {extractedText.length}
              {ocrResult.confidence && ` | Confianza OCR: ${ocrResult.confidence.toFixed(1)}%`}
              {ocrResult.totalPages && ` | Páginas: ${ocrResult.totalPages}`}
            </p>
            <div className="max-h-32 overflow-y-auto bg-white dark:bg-slate-700 p-2 rounded text-xs text-slate-600 dark:text-slate-300 border">
              {extractedText.substring(0, 500)}{extractedText.length > 500 ? '...' : ''}
            </div>
            <div className="mt-2 flex justify-end">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  if (ocrResult) {
                    const blob = ocrProcessor.createTemporaryTextFile(ocrResult);
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `extracted_text_${ocrResult.originalFileName.replace(/\.[^/.]+$/, '')}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }
                }}
              >
                💾 Descargar texto extraído
              </Button>
            </div>
          </div>
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
