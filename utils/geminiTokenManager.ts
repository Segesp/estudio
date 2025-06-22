/**
 * Gestor avanzado de tokens para Gemini API
 * Maneja límites de tokens, chunking dinámico y reintentos inteligentes
 */

export interface TokenUsage {
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
}

export interface ChunkProcessingResult {
  success: boolean;
  data?: any;
  error?: string;
  tokenUsage?: TokenUsage;
  retries: number;
}

export interface GeminiConfig {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  responseMimeType: string;
}

export class GeminiTokenManager {
  private readonly MAX_INPUT_TOKENS = 800000; // Aún más conservador
  private readonly MAX_OUTPUT_TOKENS = 2048; // Reducido para más espacio de input
  private readonly SAFETY_MARGIN = 0.6; // 60% de margen de seguridad muy amplio
  private readonly BASE_RETRY_DELAY = 1000;
  private readonly MAX_RETRIES = 3;
  
  private currentChunkSize: number;
  private readonly minChunkSize: number;
  private readonly maxChunkSize: number;
  
  constructor(initialChunkSize: number = 20000) { // Aún más pequeño
    this.currentChunkSize = initialChunkSize;
    this.minChunkSize = Math.max(5000, Math.floor(initialChunkSize * 0.1)); // Mínimo 5K caracteres
    this.maxChunkSize = initialChunkSize;
  }

  /**
   * Estima el número de tokens en un texto
   * Usa una aproximación: 1 token ≈ 4 caracteres para español
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Calcula el tamaño óptimo de chunk basado en el límite de tokens
   */
  private calculateOptimalChunkSize(systemPrompt: string, userPromptTemplate: string): number {
    const systemTokens = this.estimateTokens(systemPrompt);
    const templateTokens = this.estimateTokens(userPromptTemplate);
    
    // Reservar tokens para el prompt del sistema, plantilla y output
    const reservedTokens = systemTokens + templateTokens + this.MAX_OUTPUT_TOKENS;
    const availableTokens = this.MAX_INPUT_TOKENS - reservedTokens;
    
    // Aplicar margen de seguridad
    const safeTokens = Math.floor(availableTokens * (1 - this.SAFETY_MARGIN));
    
    // Convertir tokens a caracteres (aproximadamente)
    const optimalChunkSize = safeTokens * 4;
    
    return Math.min(Math.max(optimalChunkSize, this.minChunkSize), this.maxChunkSize);
  }

  /**
   * Divide el texto en chunks de manera inteligente
   */
  public splitTextIntoChunks(text: string, systemPrompt: string, userPromptTemplate: string): string[] {
    const optimalSize = this.calculateOptimalChunkSize(systemPrompt, userPromptTemplate);
    this.currentChunkSize = optimalSize;
    
    const chunks: string[] = [];
    let currentPosition = 0;
    
    while (currentPosition < text.length) {
      let chunkEnd = Math.min(currentPosition + this.currentChunkSize, text.length);
      
      // Si no es el final del texto, buscar un punto de corte natural
      if (chunkEnd < text.length) {
        chunkEnd = this.findOptimalBreakPoint(text, currentPosition, chunkEnd);
      }
      
      const chunk = text.substring(currentPosition, chunkEnd);
      chunks.push(chunk);
      currentPosition = chunkEnd;
    }
    
    return chunks;
  }

  /**
   * Encuentra el mejor punto de corte para un chunk
   */
  private findOptimalBreakPoint(text: string, start: number, maxEnd: number): number {
    const searchWindow = Math.floor(this.currentChunkSize * 0.2); // 20% del tamaño del chunk
    const minEnd = Math.max(start + this.currentChunkSize - searchWindow, start + this.minChunkSize);
    
    // Prioridad de puntos de corte (del mejor al peor)
    const breakPatterns = [
      /\n\n/g, // Párrafos
      /\n/g,   // Líneas
      /\. /g,  // Oraciones
      /\, /g,  // Comas
      / /g     // Espacios
    ];
    
    for (const pattern of breakPatterns) {
      const matches = [...text.substring(minEnd, maxEnd).matchAll(pattern)];
      if (matches.length > 0) {
        // Tomar el último match (más cerca del final)
        const lastMatch = matches[matches.length - 1];
        return minEnd + lastMatch.index! + lastMatch[0].length;
      }
    }
    
    // Si no se encuentra ningún patrón, usar el límite máximo
    return maxEnd;
  }

  /**
   * Reduce el tamaño del chunk si hay errores de tokens
   */
  public reduceChunkSize(): boolean {
    const newSize = Math.floor(this.currentChunkSize * 0.3); // Reducir 70% muy agresivo
    if (newSize >= this.minChunkSize) {
      console.log(`📉 Reduciendo chunk size de ${this.currentChunkSize} a ${newSize} (reducción del 70%)`);
      this.currentChunkSize = newSize;
      return true;
    }
    console.log(`💥 No se puede reducir más. Tamaño actual: ${this.currentChunkSize}, mínimo: ${this.minChunkSize}`);
    return false;
  }

  /**
   * Procesa un chunk con reintentos inteligentes
   */
  public async processChunkWithRetries(
    chunk: string,
    processFunction: (chunk: string) => Promise<any>,
    onProgress?: (message: string) => void
  ): Promise<ChunkProcessingResult> {
    let retries = 0;
    let lastError: string = '';
    let currentChunk = chunk;
    
    console.log(`Iniciando procesamiento de chunk de ${chunk.length} caracteres`);
    console.log(`Tokens estimados: ${this.estimateTokens(chunk)}`);
    
    while (retries <= this.MAX_RETRIES) {
      try {
        if (retries > 0) {
          const delay = this.calculateBackoffDelay(retries);
          onProgress?.(`Reintentando en ${delay}ms... (intento ${retries}/${this.MAX_RETRIES})`);
          await this.delay(delay);
        }
        
        console.log(`Intento ${retries + 1}: procesando chunk de ${currentChunk.length} caracteres`);
        const result = await processFunction(currentChunk);
        console.log(`✅ Chunk procesado exitosamente en intento ${retries + 1}`);
        
        return {
          success: true,
          data: result,
          retries
        };
        
      } catch (error) {
        retries++;
        lastError = this.parseError(error);
        console.error(`❌ Error en intento ${retries}:`, lastError);
        
        // Si es un error de tokens, intentar reducir el chunk
        if (this.isTokenLimitError(lastError)) {
          console.log(`🔄 Error de tokens detectado: ${lastError}`);
          
          if (retries <= this.MAX_RETRIES) {
            // Reducir el chunk directamente si es muy grande
            if (currentChunk.length > this.currentChunkSize) {
              currentChunk = currentChunk.substring(0, this.currentChunkSize);
              onProgress?.(`Chunk demasiado grande, reduciendo a ${this.currentChunkSize} caracteres...`);
              console.log(`📏 Chunk reducido a ${currentChunk.length} caracteres`);
              continue; // Reintentar con el chunk reducido
            }
            
            // Si el chunk ya es del tamaño correcto, reducir el tamaño base
            if (this.reduceChunkSize()) {
              // Reducir el chunk actual al nuevo tamaño
              currentChunk = currentChunk.substring(0, this.currentChunkSize);
              onProgress?.(`Reduciendo tamaño de chunk y reintentando...`);
              console.log(`📉 Nuevo tamaño de chunk: ${this.currentChunkSize}, chunk actual: ${currentChunk.length} caracteres`);
              continue; // Reintentar inmediatamente sin aumentar el contador
            } else {
              console.log(`💥 No se puede reducir más el chunk`);
              break; // No se puede reducir más
            }
          }
        } else if (this.isRetryableError(lastError)) {
          onProgress?.(`Error temporal: ${lastError}. Reintentando...`);
          console.log(`⏳ Error temporal, reintentando...`);
        } else {
          console.log(`🚫 Error no reintentable: ${lastError}`);
          break; // Error no reintentable
        }
      }
    }
    
    console.log(`❌ Chunk falló después de ${retries} intentos: ${lastError}`);
    return {
      success: false,
      error: lastError,
      retries: retries - 1 // Ajustar porque incrementamos al principio del catch
    };
  }

  /**
   * Calcula el delay para backoff exponencial
   */
  private calculateBackoffDelay(retryCount: number): number {
    const exponentialDelay = this.BASE_RETRY_DELAY * Math.pow(2, retryCount - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% de jitter
    return Math.floor(exponentialDelay + jitter);
  }

  /**
   * Determina si un error está relacionado con límites de tokens
   */
  private isTokenLimitError(error: string): boolean {
    const tokenErrorPatterns = [
      'token count',
      'input too long',
      'context length',
      'maximum context',
      'token limit',
      'input tokens exceed',
      'request too large',
      'request entity too large',
      'payload too large',
      'content too long',
      'exceeds',
      'limit',
      'too large',
      'too long',
      'maximum',
      'size'
    ];
    
    const errorLower = error.toLowerCase();
    return tokenErrorPatterns.some(pattern => errorLower.includes(pattern));
  }

  /**
   * Determina si un error es reintentable
   */
  private isRetryableError(error: string): boolean {
    const retryablePatterns = [
      'internal',
      'service unavailable',
      'timeout',
      'temporary failure',
      'rate limit',
      'quota exceeded',
      '429',
      '500',
      '502',
      '503',
      '504'
    ];
    
    return retryablePatterns.some(pattern => 
      error.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Extrae información útil de errores
   */
  private parseError(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object') {
      return error.message || error.error || JSON.stringify(error);
    }
    return 'Error desconocido';
  }

  /**
   * Delay utilitario
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtiene estadísticas del procesamiento
   */
  public getStats() {
    return {
      currentChunkSize: this.currentChunkSize,
      maxChunkSize: this.maxChunkSize,
      minChunkSize: this.minChunkSize,
      estimatedTokensPerChunk: this.estimateTokens(''.repeat(this.currentChunkSize))
    };
  }

  /**
   * Reinicia el tamaño de chunk al valor inicial
   */
  public resetChunkSize(): void {
    this.currentChunkSize = this.maxChunkSize;
  }
}
