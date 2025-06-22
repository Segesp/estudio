# Sense: Optimizador Académico

Una aplicación web inteligente para estudiantes universitarios, diseñada para organizar el estudio y aplicar técnicas de aprendizaje basadas en la evidencia científica.

## 🚀 Características

- **Sistema de Flashcards Inteligente** con repetición espaciada (SM-2)
- **Técnicas de Estudio Avanzadas**: Elaboración, Interleaving, Drawing
- **Técnica Pomodoro** personalizable
- **Gestión de Metas** y seguimiento de progreso
- **Sistema de Reflexiones** para sesiones de estudio
- **Calendario y Programación** de eventos académicos
- **Modo Oscuro/Claro** configurable

## 🛠️ Tecnologías

- React 19.1 + TypeScript
- Vite 6.2.0
- React Router DOM 7.6.2
- Google Gemini AI
- Tailwind CSS

## 📋 Requisitos Previos

- Node.js (versión 18 o superior)
- Una clave API de Google Gemini

## 🔧 Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone [url-del-repositorio]
   cd estudio
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   ```bash
   cp .env.local.example .env.local
   ```
   Luego edita `.env.local` y añade tu clave API de Gemini:
   ```
   GEMINI_API_KEY=tu_api_key_aqui
   ```

4. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```

## 📚 Obtener API Key de Gemini

1. Visita [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Crea una nueva API key
4. Copia la clave y pégala en tu archivo `.env.local`

## 🏗️ Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Construir para producción
- `npm run preview` - Vista previa de la build de producción

## 📱 Uso

La aplicación incluye las siguientes secciones principales:

- **Inicio**: Dashboard con resumen de actividades
- **Estrategias**: Información sobre técnicas de estudio
- **Flashcards**: Sistema de tarjetas con repetición espaciada
- **Metas**: Gestión de objetivos académicos
- **Bienestar**: Tips y consejos para mantener el equilibrio
- **Pomodoro**: Timer para técnica de productividad
- **Reflexiones**: Registro de sesiones de estudio
