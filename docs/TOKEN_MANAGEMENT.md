# Sistema de Gestión Inteligente de Tokens para Gemini API

## 📋 Resumen de Mejoras

El sistema de importación de flashcards ha sido mejorado significativamente para manejar el límite de tokens de la API de Gemini de manera inteligente y eficiente.

## 🚀 Nuevas Funcionalidades

### 1. **Gestión Dinámica de Tokens**
- **Estimación inteligente**: Calcula automáticamente el número óptimo de tokens por chunk
- **Límite de seguridad**: Aplica un margen de seguridad del 15% para evitar errores
- **Ajuste automático**: Reduce el tamaño de los chunks cuando detecta errores de límite de tokens

### 2. **División Inteligente de Contenido**
- **Puntos de corte naturales**: Prioriza divisiones en párrafos, oraciones y palabras
- **Ventana de búsqueda**: Busca el mejor punto de corte en una ventana del 20% del chunk
- **Tamaños adaptativos**: Ajusta el tamaño basándose en el contenido y límites de la API

### 3. **Sistema de Reintentos Mejorado**
- **Backoff exponencial**: Aumenta progresivamente el tiempo entre reintentos
- **Jitter aleatorio**: Añade variabilidad para evitar colisiones de requests
- **Detección de errores**: Diferencia entre errores retryables y no retryables

### 4. **Manejo de Errores Específicos**
- **Límites de tokens**: Detecta automáticamente errores de tokens y ajusta chunks
- **Errores temporales**: Reintenta automáticamente errores de red y API
- **Errores permanentes**: Detiene reintentos para errores de autenticación

## 🔧 Configuración Técnica

### Límites de la API
```typescript
MAX_INPUT_TOKENS = 1,000,000  // Gemini 1.5 Flash
MAX_OUTPUT_TOKENS = 8,192
SAFETY_MARGIN = 15%           // Margen de seguridad
```

### Estrategia de Reintentos
```typescript
MAX_RETRIES = 3
BASE_DELAY = 1000ms
BACKOFF = Exponencial con jitter 10%
```

### Tamaños de Chunk
```typescript
DEFAULT_SIZE = 500,000 caracteres
MIN_SIZE = 50,000 caracteres
MAX_SIZE = 500,000 caracteres
```

## 📊 Beneficios

1. **Mayor Robustez**: El sistema no falla completamente si un fragmento es demasiado grande
2. **Mejor Eficiencia**: Usa el máximo espacio disponible de tokens sin desperdiciar requests
3. **Continuidad**: Si un fragmento falla, continúa procesando los siguientes
4. **Transparencia**: Proporciona feedback detallado del progreso y problemas
5. **Adaptabilidad**: Se ajusta automáticamente a diferentes tipos de contenido

## 🎯 Casos de Uso Mejorados

- **Documentos muy largos**: Se procesan sin problemas dividiéndose inteligentemente
- **Contenido denso**: Ajusta automáticamente el tamaño para contenido con muchos tokens
- **Errores de red**: Reintenta automáticamente con estrategia inteligente
- **Límites de quota**: Maneja mejor los límites de la API con reintentos espaciados

## 📈 Monitoreo

El sistema proporciona información en tiempo real sobre:
- Número de fragmentos creados
- Tamaño actual de chunks
- Errores y reintentos
- Progreso del procesamiento
- Estadísticas finales de éxito/fallo

## 🔮 Características Futuras Posibles

- Cache de fragmentos procesados para evitar reprocesamiento
- Balanceador de carga entre múltiples API keys
- Análisis de contenido para optimización de prompts
- Procesamiento paralelo de chunks independientes
