# GamerzNew – Descubra, favorite e acompanhe jogos

Um site moderno e enxuto dedicado ao universo dos **videogames**, com foco em **descoberta**, **lista de jogos** e **experiência simples e responsiva**.  
O objetivo é oferecer uma **navegação clara** e um **visual dark gaming premium** (paleta rosa-magenta e roxo neon), com animações galáticas em canvas e base ideal para evoluir com APIs reais no futuro.

</br>
<p align="center">
  <img src="public/logo.png" alt="Logo GamerzNew" width="480" />
</p>

---

## 🚀 Tecnologias Utilizadas

### Core
- **Angular (Standalone Components)** – arquitetura sem módulos, leve e moderna  
- **Angular Router** – navegação entre páginas e rotas dinâmicas (`/jogos/:id`)  
- **TypeScript** – tipagem estática  
- **SSR / Prerender (Angular 20 + Vercel)** – renderização no servidor e pré‐render de rotas

### Backend & Dados
- **Vercel Functions (Node runtime)** – rotas serverless em `api/*`  
- **PostgreSQL Serverless (Neon)** com **`@neondatabase/serverless`** (conexão HTTP/Fetch)  
- **Sessões por cookie** (`gn_session`) e utilitários próprios (`api/_http.ts`)  
- **Favoritos persistidos** no banco e **jogos "custom" por usuário** no **LocalStorage**  
- **Login com Google (OAuth 2)** – endpoints `/api/auth/google/start` e `/api/auth/google/callback`

### UI & Tema
- **CSS puro** com **variáveis globais** (paleta dark gaming: rosa `#ff77c8`, magenta `#e91e63`, roxo `#d946ef`)
- **Canvas HTML5** para fundo galáxico animado (estrelas, aurora, nebulosas) a 60fps
- **Sistema de partículas duplo** — canvas de fundo (`z-index: -1`) + canvas de partículas (`z-index: 1`, `mix-blend-mode: screen`)
- **Borda neon da hero** com shimmer CSS animado (9 s) percorrendo as 4 arestas
- **Cards responsivos**, botões em gradiente rosa e toasts modernos (estilo "gamer")
- **Glassmorphism** e microanimações em hover

### Estado & Formulários
- **Reactive Forms** (criação de jogos em `/jogos/novo`)  
- **BehaviorSubject** para catálogo de jogos (+ ordenação alfabética)  
- **Signals (signal, computed, effect)** no **Backlog** (CRUD em LocalStorage)  
- **Loader progressivo** para evitar flicker em **/jogos** e **/jogos/favoritos**

### Integração externa (API)
- **IsThereAnyDeal (ITAD)** – melhor preço por jogo via endpoint serverless com fallback **BR → US**

### Testes
- **TestBed** com componentes standalone em `imports`  
- Testes básicos de criação de componente

---

## 🕹️ Bio do Projeto
O **GamerzNew** nasce como um espaço para **descobrir e acompanhar jogos**, mantendo um **catálogo simples**, informações essenciais (gênero, ano, desenvolvedora, publicadora) e atalhos oficiais (Steam).  
A proposta é evoluir para **integrações reais** e recursos como **busca avançada**, **filtros**, **listas personalizadas** e **perfil de usuário** — sem perder a leveza e o foco na experiência.

---

## ✨ Funcionalidades

- **Home**: destaques e CTA para **/jogos**  
- **Jogos** (`/jogos`): grid com busca, detalhes, link Steam, **favoritar** e **adicionar ao Backlog**  
- **Detalhes** (`/jogos/:id`): infos completas + **selo de preço (ITAD)**  
- **Favoritos** (`/jogos/favoritos`): só os marcados como favoritos (com loader progressivo fiel ao network)  
- **Novo Jogo** (`/jogos/novo`): Reactive Form; gêneros em string → `string[]`  
- **Backlog** (`/backlog`): CRUD local com **Signals**, agrupamento por status e ordenação  
- **Sobre** (`/sobre`): Página institucional com design *Dark Gaming*, sistema solar anatômico (Leis de Kepler) e modal educativo interativo.
- **Login** (`/login`): email simples + **Google OAuth**; sessões via cookie, gerido por um ícone de perfil unificado.

---

## 🔌 Integração de Preços (ITAD)

**Fluxo**  
1. Front chama `GET /api/itad?q={titulo}`.  
2. A função serverless faz:
   - `GET /games/lookup/v1` → ID do jogo (UUID)  
   - `POST /games/overview/v2` → melhor preço e histórico  
3. Preferência por **BR**; fallback automático para **US**.  
4. O componente `DealBadgeComponent` exibe "a partir de …" com loja e valor.

**Variáveis**  
`ITAD_API_KEY=suachave`

**Uso**  
- Componente: `<app-deal-badge [title]="game!.title"></app-deal-badge>`  
- Teste direto: `/api/itad?q=Hades` (opcional `&country=US`)

---

## 🔐 Autenticação & Sessões

- **Endpoints**:
  - `GET /api/auth/me` – retorna usuária atual
  - `POST /api/auth/login` – email simples (debug/local)
  - `POST /api/auth/logout`
  - `GET /api/auth/google/start` – redireciona para o Google
  - `GET /api/auth/google/callback` – troca code por token, **upsert de usuário** no Neon e cria sessão
- **Cookies**: `gn_session` (HttpOnly, `SameSite=Lax`, `Secure`)
- **UI de Perfil**: Ícone de usuário unificado no canto superior direito (header). Se deslogado, exibe um ícone SVG genérico com gradiente neon (encaminha para `/login`). Se logado, exibe foto de perfil ou inicial do nome, abrindo um dropdown de controle.

---

## 💾 Catálogo, Favoritos & Jogos Customizados

- **Catálogo base**: arquivo estático `GAMES`  
- **Favoritos**:
  - Jogos do catálogo: persistidos no Neon via `/api/games/favorite`
  - Jogos customizados (criados pelo usuário): sinalizados localmente e persistidos em **LocalStorage**
- **Loader Progressivo Real**: O carregamento nas páginas `/jogos` e `/jogos/favoritos` é sincronizado diretamente com a Promise de requisição da API (`refresh()`), impedindo "falsos 100%" ou travamentos de UI em chamadas em background.
- **Ordenação alfabética**: aplicada após cada refresh  
- **Heurística de sessão**: evita "piscada" de login com leitura de cookie (`hasSessionCookie()`)

---

## 📂 Estrutura de Pastas (unificada)

```bash
GamerzNew/
├── api/
│   ├── _db.ts                 # conexão Neon (neon(DATABASE_URL))
│   ├── _http.ts               # getBaseUrl, parse/setCookie, json, etc.
│   ├── itad.ts                # integração IsThereAnyDeal
│   ├── auth/
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   ├── me.ts
│   │   └── google/
│   │       ├── start.ts
│   │       └── callback.ts
│   └── games/
│       ├── index.ts           # (se usado) listagem/CRUD serverless
│       ├── favorites.ts       # GET ids favoritos do usuário
│       └── favorite.ts        # POST { id, value } – marca/desmarca
│
├── public/
│   ├── logo.png
│   ├── Sarah-Hernandes.jpg
│   └── favicon.ico
│
└── src/
    ├── app/
    │   ├── components/
    │   │   ├── header/...
    │   │   ├── footer/...
    │   │   ├── toasts/...                 # container + serviço visual
    │   │   └── game-card/
    │   │       ├── game-card.component.ts
    │   │       ├── game-card.component.html
    │   │       └── game-card.component.css
    │   ├── features/
    │   │   └── backlog/
    │   │       ├── backlog.store.ts       # Signals: signal/computed/effect
    │   │       ├── backlog.page.ts
    │   │       ├── backlog.page.html
    │   │       └── backlog.page.css
    │   ├── guards/
    │   │   └── auth.guard.ts
    │   ├── pages/
    │   │   ├── home/...
    │   │   ├── sobre/...                  # Sistema Solar Interativo
    │   │   └── jogos/
    │   │       ├── games.data.ts
    │   │       ├── jogos.ts|html|css
    │   │       ├── jogos-favoritos.ts|html|css
    │   │       ├── jogos-novo.ts|html|css
    │   │       ├── jogo-detalhes.ts|html|css
    │   │       └── login/...
    │   ├── services/
    │   │   ├── auth.service.ts
    │   │   ├── games.service.ts
    │   │   ├── itad.service.ts
    │   │   ├── animation.service.ts       # toggle de animações (signal + localStorage)
    │   │   └── shared/ui/toast.service.ts
    │   ├── app.ts|html|css
    │   ├── app.routes.ts
    │   ├── app.config.ts
    │   └── app.routes.server.ts           # SSR/Prerender params
    ├── index.html
    └── styles.css
```

---

## 🔧 Variáveis de Ambiente

Configure localmente (`.env`, não commitar) ou na Vercel:

```
# Banco (Neon)
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB?sslmode=require

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# ITAD
ITAD_API_KEY=...

# Base URL fallback (opcional p/ dev)
APP_URL=http://localhost:3000
```

---

## ⚙️ SSR / Prerender

- Prerender para rotas estáticas e **/jogos/:id** via `getPrerenderParams`  
- Endpoints sensíveis (auth/games) rodam **apenas** em runtime (sem SSR de chamadas externas)  
- Loader progressivo evita travas/timeout em rotas como **/jogos/favoritos**
- Canvas e animações protegidos com `isPlatformBrowser()` para evitar erros de SSR

---

## ▶️ Como rodar localmente

```bash
npm install

# Angular puro
npm start
# ou
ng serve -o

# Angular + rotas serverless (recomendado para testar ITAD/auth/favoritos)
vercel dev
```

---

## ☁️ Deploy (Vercel)

- Ao subir no `main`, a Vercel executa `npm run build` e publica
- Configure as **Environment Variables** (acima) no projeto da Vercel

---

## 🧪 Testes

- Exemplos com **TestBed** usando **standalone components** em `imports`  
- Ajustes de paths e imports para Angular 20

---

## 🎨 Changelog de Estética — Redesign UI/UX

### Antes vs. Depois (Evolução Dark Gaming)

| Elemento | ❌ Antes | ✅ Depois |
|---|---|---|
| **Tema geral** | Rosa nude claro, estilo HTML tradicional | Dark gaming premium — roxo profundo, magenta neon, rosa vibrante |
| **Fundo da Home** | Cor sólida estática `#0d0d12` | Canvas 60fps com 200 estrelas twinkle, aurora animada e nebulosas radiais |
| **Página "Sobre"** | Texto corrido alinhado à esquerda | Sistema solar centralizado, órbitas anatômicas (Leis de Kepler) e modal responsivo glassmorphism |
| **Navbar Login** | Link de texto solto no menu hambúrguer | Ícone de avatar unificado no topo direito (estilo moderno e contínuo) |
| **Loader** | Falso progresso para dados em cache | Barra progressiva real e sincronizada com as promessas de requisição (`refresh()`) |
| **Botões / pills** | `rgba(...)` semi-transparentes — partículas apareciam por baixo | Sólidos (`#1a0428`, `#12021e`) — sem vazamento visual |
| **Bordas dos cards** | Borda simples rosa | Cantos retos estilo cyberpunk com brilho neon rosa/roxo |

---

### 🌌 Sistema de Animações — Canvas Dual

A Home e o fundo de outras páginas usam **dois canvas sobrepostos** com papéis distintos:

```
┌─────────────────────────────────────────┐
│  particleCanvas   z-index: 1            │  ← partículas do cursor
│  mix-blend-mode: screen                 │     preto = transparente
├─────────────────────────────────────────┤
│  [conteúdo da página: hero, cards...]   │
├─────────────────────────────────────────┤
│  galaxyCanvas     z-index: -1           │  ← fundo galáxico
│  estrelas · aurora animada · nebulosas  │
└─────────────────────────────────────────┘
```

**Por que dois canvas?**  
O `galaxyCanvas` fica atrás de tudo (`z-index: -1`). Partículas desenhadas nele seriam
invisíveis sob os fundos opacos da Hero e dos cards. O `particleCanvas` fica acima (`z-index: 1`)
com `mix-blend-mode: screen`: áreas pretas somem, apenas os pixels brilhantes das partículas
aparecem — sem cobrir texto ou botões.

---

### ✨ Efeito de Partículas do Cursor

Ao mover o mouse na área da Home (exceto navbar, footer e elementos interativos):

| Tipo | Probabilidade | Descrição |
|---|---|---|
| **Estrela simples** | ~67% | Ponto brilhante (0,4–1,5 px) com halo suave, deriva e desvanece |
| **Sparkle em cruz** | ~15% | 4 linhas formando ✦, some com fade |
| **Planeta** | ~10% | Círculo maior com anel elíptico inclinado aleatoriamente |
| **Constelação** | a cada 35–85 frames | 3–7 pontos conectados por linhas tracejadas, deriva lentamente |

**Cores**: branco 60% · rosa `#ff9bd7` 20% · roxo `#be87ff` 20% — paleta do logo.

**Emissão inteligente** — partículas **não emitem** quando o cursor está sobre (exclusões gerenciadas pelo `CanvasService`):
Cards (`.card`), Títulos (`h1, h2, h3`), Planetas do Sistema Solar (`.planet`), Botões, etc.

---

### ♿ Acessibilidade — Toggle de Animações Inteligente

Botão redondo na navbar com o ícone padrão de **pessoa de braços abertos** (Material Design / WCAG).

| Estado | Aparência | Comportamento |
|---|---|---|
| **Ligado** (padrão) | Borda rosa, ícone vibrante | Fundo galáxico, partículas do cursor e órbitas do sistema solar ativos |
| **Desligado** | Borda cinza, ícone apagado | Fundo estático, remove as órbitas e foca em UI limpa (cancela transições CSS) |

**Implementação técnica:**
- `AnimationService` — singleton Angular com `signal<boolean>()`
- Persiste a preferência em `localStorage` (`gn-anim`)
- Integração dinâmica com o modal "Você Sabia?": Se o modal é aberto enquanto as animações estão desativadas, ele mostra um **aviso em rosa neon** pedindo para ativar a acessibilidade. Se a acessibilidade é ativada no meio da leitura, o modal se fecha sozinho (`effect` Angular).
- O loop do `galaxyCanvas` pula o desenho animado via `animSvc.enabled()`

---

## 🗺️ Roadmap

- Integração com API pública de jogos (IGDB/RAWG)  
- Filtros avançados (plataforma/gênero/tags)  
- PWA (offline + A2HS)

---

## 👩‍💻 Autora

<p align="center">
  <img src="public/Sarah-Hernandes.jpg" width="140" style="border-radius: 50%;"/>
</p>

**Sarah Hernandes** – Desenvolvedora Full Stack

---

## 📜 Licença

Distribuído sob a licença **MIT**. Consulte `LICENSE`.
