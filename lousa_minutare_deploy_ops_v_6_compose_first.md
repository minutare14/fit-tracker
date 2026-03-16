# Skill: Minutare Deploy Ops 

> **Manual + Checklist + Contrato de execução.**
> Sempre que houver dúvida durante deploy, **volte aqui e marque os itens**.

---

## 0) Princípio central

Deploy **não** é “subir código”. Deploy é orquestrar:

1. Repo correto
2. Arquitetura correta
3. Build previsível
4. Infra validada
5. Domínio funcional
6. SSL ativo
7. Auto‑deploy validado
8. Recuperabilidade garantida
9. Configuração de IA consistente e observável

✅ Se qualquer um falhar → **deploy incompleto**.

---

## 1) Arquitetura da Skill (obrigatória)

A execução **sempre** segue:

**FASE 1 — Interpretar intenção**
**FASE 2 — Classificar arquitetura**
**FASE 3 — Validar infraestrutura**
**FASE 4 — Validar perfil de IA (se aplicável)**
**FASE 5 — Executar (Compose‑First)**
**FASE 6 — Validar pós‑deploy**
**FASE 7 — Emitir relatório técnico**

🚫 Nunca pular fases.

---

## 2) Router de intenção (regex)

Categorias:

- MVP_SIMPLE
- MVP_COMPLEX
- OFFICIAL
- RESTRUCTURE
- FIX_DEPLOY
- DEPLOY_ONLY
- ANALYZE_ONLY

Prioridade:
**OFFICIAL > MVP_COMPLEX > MVP_SIMPLE**

Fallback obrigatório:
Se o usuário não for explícito → **perguntar antes de assumir**.

Regex (exemplos):

- `(?i)\b(mvp simples|teste rápido|ideia rápida|só testar)\b` → **MVP_SIMPLE**
- `(?i)\b(mvp complexo|multi-serviço|tem api e dashboard|worker|redis|postgres)\b` → **MVP_COMPLEX**
- `(?i)\b(oficial|produção|projeto principal|enterprise)\b` → **OFFICIAL**
- `(?i)\b(reestruture|padronize|organize a arquitetura)\b` → **RESTRUCTURE**
- `(?i)\b(falhou|erro de deploy|porta errada|ssl|502|não sobe)\b` → **FIX_DEPLOY**
- `(?i)\b(só deploy|já está pronto|não mexa no código)\b` → **DEPLOY_ONLY**
- `(?i)\b(só analisar|diagnóstico|sem executar|dry-run)\b` → **ANALYZE_ONLY**

---

## 3) Classificação arquitetural automática

Detectar:

### A) SINGLE_SERVICE

- 1 Dockerfile
- sem compose

### B) MULTI_SERVICE_COMPOSE ✅ (PREFERIDO)

- existe `docker-compose.yml` (ou `compose.yml`)
- múltiplos serviços (app + db/redis etc.)

### C) MULTI_SERVICE_PRO

- `apps/` (dashboard/gate/worker)
- múltiplos Dockerfiles (ex: `Dockerfile.dashboard`, `Dockerfile.gate`, `Dockerfile.worker`)

Regra:

- Se **existe compose** → **sempre usar Compose**
- Se **multi Dockerfiles** → **gerar/usar compose** como padrão

---

## 4) Modos de repositório

### 🔹 LABS

`minutare-labs/experiments/<slug>/`

### 🔹 REPO ISOLADO

`mvp-<slug>`

### 🔹 PROJETO OFICIAL

Repo dedicado + multi‑app

Deploy preferido:
**Compose‑First com governança** (healthchecks + volumes + envs + domínios).

---

## 5) Extração de slug

Regras:

- lowercase
- remover acentos
- regex `[a-z0-9-]`
- máx 40 chars

---

## 6) Estado persistente

```json
{
  "default_mode": "labs",
  "github_owner": "",
  "coolify_server": "",
  "last_repo": "",
  "default_deploy_mode": "compose"
}
```

---

## 7) Checklist pré‑deploy (obrigatório)

### Infra

- [ ] Repo válido
- [ ] GitHub App instalada no repo
- [ ] Coolify online
- [ ] Proxy ativo
- [ ] Wildcard configurado (ex: `*.minutarecore.space`)
- [ ] Portas abertas (80/443/22)

### App

- [ ] `docker-compose.yml` existe (ou foi gerado)
- [ ] serviços com `build`/`dockerfile` corretos
- [ ] apps escutam em `0.0.0.0`
- [ ] healthcheck quando possível
- [ ] volumes persistentes (db)

### IA (se aplicável)

- [ ] `AI_DEPLOY_PROFILE.md` presente
- [ ] provider/model definidos
- [ ] API keys persistentes
- [ ] prompt editável via dashboard
- [ ] tools toggles ativos
- [ ] observabilidade (trace + raw debug)

---

## 8) Estrutura mínima obrigatória

Sempre:

- `README.md`
- `.env.example`
- `.dockerignore`

SINGLE_SERVICE:

- `Dockerfile`

MULTI_SERVICE (padrão):

- `docker-compose.yml` obrigatório

Com IA:

- `AI_DEPLOY_PROFILE.md` obrigatório

---

## 9) Detecção automática de porta

1. ENV `PORT`
2. `uvicorn` → 8000
3. `next` / `express` → 3000
4. default → 8000

---

## 10) Deploy padrão (Compose‑First) ✅✅✅

**Regra de ouro:**
Se for **MVP_COMPLEX**, **MULTI_SERVICE_PRO** ou **OFFICIAL multi‑serviço** → **deploy via Docker Compose no Coolify**.

### 10.1 Auditar/Preparar o compose

Checklist do `docker-compose.yml`:

- [ ] `services:` inclui `dashboard`, `gate` (api), `worker` (se existir)
- [ ] resources: `postgres`, `redis` (se aplicável)
- [ ] `build:` aponta para o Dockerfile correto
  - dashboard → `dockerfile: Dockerfile.dashboard`
  - gate → `dockerfile: Dockerfile.gate`
  - worker → `dockerfile: Dockerfile.worker`
- [ ] `ports:` só para serviços expostos externamente
  - dashboard: `3000:3000`
  - gate/api: `8000:8000`
  - worker: **sem** ports
- [ ] `depends_on` coerente
- [ ] `volumes` persistentes (ex: `postgres_data`)
- [ ] `env_file: .env` / `environment` com variáveis críticas
- [ ] `restart: unless-stopped`

### 10.2 Criar App no Coolify

No Coolify:

- **New Resource → Application → Docker Compose**
- escolher repo/branch
- apontar para `docker-compose.yml`
- (se existir) Working/Base dir = `/` (raiz)
- Deploy

### 10.3 Domínios + SSL

Após subir o compose:

- `rag-mvp.minutarecore.space` → serviço `dashboard` porta 3000
- `api.rag-mvp.minutarecore.space` → serviço `gate` porta 8000
- habilitar SSL (Let’s Encrypt)

### 10.4 Auto‑deploy

- ativar auto‑deploy (webhook)
- validar: push no main → deploy automático

---

## 11) Deploy single service

Usar fluxo normal Coolify:

- Dockerfile **ou** Nixpacks

---

## 12) Fallback: Apps separadas (somente se necessário)

Use apenas se:

- Compose não é aceito por alguma limitação
- ou precisa escalar serviços isoladamente **agora**

Criar 3 apps:

- dashboard (Dockerfile.dashboard, porta 3000)
- gate (Dockerfile.gate, porta 8000)
- worker (Dockerfile.worker, sem domínio)

Resources:

- Postgres + Redis

---

## 13) Injeção de variáveis (Compose‑First)

Backend (gate/worker):

- `DATABASE_URL`
- `REDIS_URL`
- `PORT`
- `ENV=production`

Frontend (dashboard):

- `NEXT_PUBLIC_API_URL=https://api.<slug>.minutarecore.space`

IA:

- `LLM_PROVIDER`
- `LLM_MODEL`
- `EMBED_MODEL`

🚫 Nunca deixar variável crítica vazia.

---

## 14) Playbook de erros (fallback obrigatório)

### Build falhou

- abrir logs
- identificar: dockerfile path / build context / deps / versões
- corrigir compose: `build.context` + `dockerfile`
- redeploy

### Porta errada / 502

- confirmar serviço escutando
- corrigir `ports` e porta interna
- garantir `0.0.0.0`
- redeploy

### SSL não gera

- validar DNS A record
- validar proxy do Coolify ativo
- validar 80/443 liberados
- aguardar propagação e tentar novamente

---

## 15) Modo DRY‑RUN

Simular sem executar:

- classificar arquitetura
- prever compose/serviços/portas
- listar variáveis
- listar ações exatas no Coolify
- gerar checklist final

---

## 16) Proteções

- nunca sobrescrever `main` sem confirmação
- nunca criar domínio duplicado
- nunca deployar sem validação

---

## 17) Relatório final (sempre)

- Tier:
- Arquitetura:
- Modo:
- Repo:
- Compose:
- Serviços:
- Domínios:
- Portas:
- SSL:
- Auto‑deploy:
- AI Provider (se houver):
- Prompt version:
- Tools ativas:

---

## 18) AI_DEPLOY_PROFILE (obrigatório para IA)

Todo projeto com IA deve conter: `AI_DEPLOY_PROFILE.md`

Campos mínimos:

- LLM: provider/model/api_key_source/temp/max_tokens
- Embeddings: provider/model
- Prompt: source/editable/versioning
- Tools: enabled/toggle_ui/audit
- RAG: backend/top_k/db_first/draft_publish
- Pooling: enabled/window_ms
- Resiliência: queue/retries/sweeper
- Observabilidade: trace/raw_debug/tokens/latência/retries

---

## 19) Padrão LangGraph para IA

State mínimo:

- conversation_id, session_id, client_id
- customer_profile, settings_snapshot
- db_facts, rag_snippets, trace

Nodes mínimos:

1. LoadSettings
2. MessagePooling
3. CheckUser
4. ResolveTime
5. RetrieveFacts
6. RetrieveRAG
7. DecideTools
8. ExecuteTools
9. ComposeAnswer
10. PersistTrace
11. SendMessage

Worker deve compartilhar env com Gate.

---

## 20) Garantias v6

✔ Infra validada
✔ Deploy previsível
✔ **Compose‑First para multi‑serviço**
✔ IA configurável via dashboard
✔ Tools auditáveis
✔ RAG estruturado
✔ Pooling + resiliência
✔ Observabilidade completa

---

# Nota prática

Quando você disser:

- “**mvp complexo**” ou “**projeto oficial multi‑serviço**”

O padrão vira:
✅ **1 repo → 1 compose → 1 deploy**

E no Coolify você só mapeia domínios para os serviços (dashboard/gate).
