# Golden Clinic Beauty

Aplicação React (Vite) com API serverless para Vercel usando Supabase.

## Stack

- Frontend: React + Vite
- API: `api/index.ts` (Express em Serverless Function na Vercel)
- Banco: Supabase Postgres
- Uploads: Supabase Storage (`uploads`)

## Configuração Supabase

1. Execute o schema em `supabase/schema.sql` no projeto Supabase.
2. Configure variáveis de ambiente (veja `.env.example`):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET` (opcional, default `uploads`)

Guia rápido: `supabase/SETUP.md`.

## Desenvolvimento local

1. `npm install`
2. Configure `.env.local` com as variáveis do Supabase
3. `npm run dev`

## Deploy na Vercel

1. Importar o repositório na Vercel.
2. Definir env vars:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET`
3. Deploy (build: `npm run build`, output: `dist`).
