<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Adhoc Learning - Cuentos Educativos

Generador de cuentos educativos personalizados usando IA.

View your app in AI Studio: https://ai.studio/apps/drive/1NwpWK3luKQjvOST2NmbKtuHjhsgZ75X6

## 🔒 Seguridad

Este proyecto implementa **protección de API keys** mediante Vercel Serverless Functions.

### ⚠️ IMPORTANTE

- ❌ **NUNCA** uses `VITE_GEMINI_API_KEY` en el frontend
- ✅ La API key de Gemini debe estar **SOLO en variables de entorno de Vercel**
- ✅ El frontend llama a `/api/generate-story` (tu servidor)
- ✅ Tu servidor llama a Gemini con la API key protegida

## 🚀 Configuración en Vercel

1. Ve a tu proyecto en Vercel → Settings → Environment Variables
2. Agrega las variables:
   ```
   GEMINI_API_KEY=tu_api_key_de_gemini
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```
3. Asegúrate de que estén configuradas para **Production**, **Preview** y **Development**
4. Redeploy tu aplicación

## 💻 Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Crea un archivo `.env` en la raíz con:
   ```bash
   GEMINI_API_KEY=tu_api_key_de_gemini
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```
   **NUNCA** comitees este archivo (ya está en `.gitignore`).

3. Run the app:
   ```bash
   npm run dev
   ```

## 🛡️ Protecciones Implementadas

- ✅ Rate limiting por IP (10 requests/minuto)
- ✅ Validación de contenido y longitud
- ✅ Safety filters de Gemini en el servidor
- ✅ Logs de seguridad y monitoreo
- ✅ Validación de origen (CORS)
- ✅ API key protegida en el servidor (nunca expuesta al cliente)
