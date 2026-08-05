# Kaelara

Kaelara e uma assistente com:

- frontend React responsivo com tema claro/escuro
- backend Flask com historico persistente
- memoria online pronta no Supabase
- fallback local em SQLite para nao quebrar se o banco remoto ficar indisponivel

## Estado atual

Em 21 de julho de 2026, o projeto foi preparado para usar:

- Supabase Postgres como banco principal
- Gemini como provedor principal de IA
- suporte opcional a OpenAI, Groq e Grok/xAI

## Estrutura principal

- `frontend/`: interface React/Vite
- `kaelara/app.py`: API Flask
- `kaelara/database.py`: conexao com banco e fallback local
- `kaelara/rag.py`: provedores de IA
- `render.yaml`: configuracao sugerida para backend
- `vercel.json`: configuracao sugerida para frontend

## Variaveis importantes

Backend:

- `DATABASE_URL`
- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Frontend:

- `VITE_API_BASE_URL`

## Banco online atual

Projeto Supabase criado:

- projeto: `kaelara-memory`
- ref: `onzqsjokwqphxecmiswz`

Schema criado:

- `chat_sessions`
- `chat_messages`

## Rodando localmente

Backend:

```bash
.\.venv\Scripts\python.exe -m pytest tests\test_app.py
```

Frontend:

```bash
npm run build
```

## O que falta no deploy

### Render

No servico do backend, preencher:

- `DATABASE_URL`
- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Sugestao de `DATABASE_URL`:

```text
postgresql+psycopg://postgres.onzqsjokwqphxecmiswz:<SENHA>@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

### Vercel

No frontend, definir:

```text
VITE_API_BASE_URL=https://SEU-BACKEND.onrender.com
```

## Observacoes

- Se o banco remoto falhar, a Kaelara usa `kaelara.db` local temporariamente.
- O Supabase CLI nao estava instalado nesta maquina durante a configuracao.
- O deploy automatico no Vercel por ferramenta ficou pendente apenas por empacotamento explicito de arquivos, nao por erro do projeto.
