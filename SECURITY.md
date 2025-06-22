# Guía de Seguridad para Variables de Entorno

## 🔒 Configuración Segura de API Keys

### Pasos para configurar las variables de entorno:

1. **Nunca comitear claves reales**
   - Los archivos `.env.local` están en `.gitignore` y **NO deben ser subidos al repositorio**
   - Usa siempre `.env.local.example` como plantilla

2. **Configuración inicial**
   ```bash
   # Copia el archivo de ejemplo
   cp .env.local.example .env.local
   
   # Edita el archivo con tu clave real
   # GEMINI_API_KEY=tu_clave_api_aqui
   ```

3. **Obtener una clave API de Gemini**
   - Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Crea una nueva clave API
   - Cópiala a tu archivo `.env.local`

4. **Verificar configuración**
   ```bash
   # Verificar que el archivo no está siendo trackeado
   git status
   
   # Los archivos .env.local NO deben aparecer en la lista
   ```

## ⚠️ Qué Hacer Si Expones una Clave Accidentalmente

1. **Revocar inmediatamente** la clave en Google AI Studio
2. **Generar una nueva clave**
3. **Actualizar tu archivo `.env.local`**
4. **Si la clave fue commitada**: 
   - Usar `git filter-branch` o contactar soporte de GitHub
   - Considerar hacer el repositorio privado temporalmente

## 📁 Archivos Sensibles Protegidos

Los siguientes archivos están protegidos por `.gitignore`:
- `.env`
- `.env.local`
- `.env.development.local`
- `.env.test.local`
- `.env.production.local`
- `*.local`

## 🔍 Verificar Seguridad

Ejecuta regularmente:
```bash
# Verificar que no hay claves expuestas
git log --all --full-history -- "*.env*"

# Verificar archivos ignorados
git status --ignored
```
