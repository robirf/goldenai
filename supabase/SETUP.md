## Setup Supabase via MCP

1. Crie um projeto no Supabase e copie:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

2. No MCP Supabase (SQL runner), execute o arquivo:
- `supabase/schema.sql`

3. Confirme se as tabelas existem:
- `services`
- `professionals`
- `clients`
- `bookings`

4. Confirme se o bucket existe:
- `uploads` (public)

## Vercel env vars

Configure no projeto da Vercel:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET=uploads`

## Deploy

1. `npm install`
2. `npm run build`
3. Deploy na Vercel (import do repositório)

O frontend é servido por Vite (`dist`) e a API roda em `/api/index.ts` como Serverless Function.
