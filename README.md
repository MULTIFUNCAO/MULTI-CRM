# MULTI CRM — Admin

Novo painel administrativo da Multi, **projeto separado** do app cliente/profissional
(`MULTI`) e do backend (`MULTI-BACKEND`). Não duplica lógica de negócio: consome as
rotas `/api/admin/*` do MULTI-BACKEND já existentes (mesma autenticação por senha +
token HMAC do Admin atual — ver `POST /api/admin/login` em `server.js`).

Fase 1 (escopo atual): login + Lista de Clientes + Ficha do Cliente (dados reais,
sem simular tracking que não existe ainda). Ver auditoria completa em
`admin-crm-fase1-auditoria.md` (repo separado, pasta de trabalho local).

## Rodar localmente

```
npm install
npm run dev
```

⚠️ Se estiver rodando no mesmo ambiente Windows onde o perfil do usuário contém `#`
no caminho (`C:\Users\#234\...`), `npm run dev`/`npm run build` local **não funcionam**
(bug conhecido do Vite/Rollup com `#` em file URLs — não é bug deste projeto). Use
`npx vercel deploy` para gerar uma preview real e testar ao vivo.

## Variáveis de ambiente

- `VITE_API_URL` — base do MULTI-BACKEND. Default: `https://multi-backend-lfwp.onrender.com`.

## Deploy

Projeto Vercel `multi-crm`, mesmo time (`anacristinal1401-2650s-projects`) do projeto
`multi`. O backend já libera CORS para qualquer preview/produção desse projeto
(ver `previewOriginRegex`/`allowedOrigins` em `MULTI-BACKEND/server.js`).
