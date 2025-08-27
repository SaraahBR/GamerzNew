# GamerzNew – Descubra, favorite e acompanhe jogos

Um site moderno e enxuto dedicado ao universo dos **videogames**, com foco em **descoberta**, **lista de jogos** e **experiência simples e responsiva**.  
O objetivo é oferecer uma **navegação clara** e um **visual coerente** (tema rosa nude), com rotas bem definidas e base ideal para evoluir com APIs reais no futuro.

</br>
<p align="center">
  <img src="public/logo.png" alt="Logo GamerzNew" width="680" />
</p>

---

## 🚀 Tecnologias Utilizadas

### Core
- **Angular (Standalone Components)** – arquitetura sem módulos, leve e moderna  
- **Angular Router** – navegação entre páginas e rotas dinâmicas (`/jogos/:id`)  
- **TypeScript** – tipagem estática, mais segurança e produtividade  
- **SSR / Prerender** – build com renderização no servidor e pré-renderização de rotas (Vercel)

### UI & Tema
- **CSS puro** com **variáveis globais** (tema rosa nude)  
- **Layout base**: Header, Main e Footer (componentes reutilizáveis)  
- **Cards responsivos** e botões com **gradiente rosa**  
- **Ícone de favorito** (coração SVG) com **animação “pop”** ao favoritar  
- **Acessibilidade**: `aria-label`, `aria-pressed` no botão de favorito

### Formulários & Estado
- **Reactive Forms** (criação de jogos em `/jogos/novo`)  
- **FormsModule** com **[(ngModel)]** para busca (two-way binding)  
- **Service com BehaviorSubject** para gerenciar a lista de jogos e favoritos

### Testes
- **TestBed** com componentes standalone em `imports`  
- Testes básicos de criação de componente (ex.: `jogos.spec.ts`)

---

## 🕹️ Bio do Projeto
O **GamerzNew** nasce como um espaço para **descobrir e acompanhar jogos**, mantendo um **catálogo simples**, informações essenciais (gênero, ano, desenvolvedora, publicadora) e atalhos oficiais (Steam).  
A proposta é evoluir para **integrações reais** (APIs) e recursos como **busca avançada**, **filtros**, **listas personalizadas** e **perfil de usuário** — sem perder a leveza e o foco na experiência.

---

## ✨ Funcionalidades

- **Home**  
  - Destaques com **cards de preview** e botão “Ver detalhes” → encaminha para **/jogos/:id**  
  - CTA “Ver todos os jogos” → **/jogos**

- **Jogos** (`/jogos`)  
  - Grid de cards com imagem, descrição e metadados  
  - **Busca** com `[(ngModel)]` (título, gênero, dev, pub, ano)  
  - Botões: **Ver Detalhes** (rota interna) e **Ver na Steam** (link externo)  
  - **Favoritar** com coração (🤍 → 🖤) e **animação “pop”** ao ativar

- **Detalhes do jogo** (`/jogos/:id`)  
  - Página individual com informações completas (IDs pré-renderizados no build)

- **Favoritos** (`/jogos/favoritos`)  
  - Lista apenas dos jogos marcados como favoritos

- **Novo Jogo** (`/jogos/novo`)  
  - **Reactive Form** com validações (mínimo de caracteres, intervalo de ano etc.)  
  - Gêneros via string separada por vírgulas → `string[]`

- **Sobre** (`/sobre`)  
  - Propósito do site e **perfil da autora**  
  - Foto em `public/MinhaFoto.png`  
  - Rodapé com **“Sarah Hernandes”** (sem “Feito com ♥ em Angular”)

---

## 🧱 Fluxos de Dados & Decorators

- **Interpolação**: `{{ game.title }}`, `{{ year }}` etc.  
- **Unidirecional (`@Input`)**: `GameCardComponent` recebe `game` e `favorite` do pai  
- **Bidirecional custom (`@Output` + EventEmitter)**:  
  - `GameCardComponent` emite `favoriteChange`  
  - Uso no pai:  
    - em `/jogos` e `/jogos/favoritos`: `[favorite]="g.favorite ?? false" (favoriteChange)="updateFavorite(g, $event)"`  
- **Two-way com Forms**: `[(ngModel)]="search"` na busca de jogos

---

## 🎨 Tema (variáveis CSS)

As variáveis estão centralizadas (rosa nude):

```css
:root{
  --bg:#ffffff;
  --text:#111827;
  --muted:#6b7280;

  /* Tema rosa nude */
  --rosa:#e4a4b4;
  --rosa-escuro:#c97a8c;
  --rosa-clarinho:#fbe7ec;
}
```

Todos os componentes utilizam `var(--rosa*)` para cores, bordas e efeitos.

---

## 📂 Estrutura de Pastas (estado atual)

```bash
GamerzNew/
├── public/
│   ├── MinhaFoto.png                 # foto exibida em /sobre
│   └── favicon.ico                   # logo do projeto
│
└── src/
    ├── app/
    │   ├── components/
    │   │   ├── header/
    │   │   │   ├── header.component.ts
    │   │   │   ├── header.component.html
    │   │   │   └── header.component.css
    │   │   ├── footer/
    │   │   │   ├── footer.component.ts
    │   │   │   ├── footer.component.html
    │   │   │   └── footer.component.css
    │   │   └── game-card/            # card reutilizável com @Input/@Output
    │   │       ├── game-card.component.ts
    │   │       ├── game-card.component.html
    │   │       └── game-card.component.css
    │   │
    │   ├── pages/
    │   │   ├── home/
    │   │   │   ├── home.component.ts
    │   │   │   ├── home.component.html
    │   │   │   └── home.component.css
    │   │   ├── jogos/
    │   │   │   ├── games.data.ts            # base estática com jogos
    │   │   │   ├── jogos.component.ts
    │   │   │   ├── jogos.component.html
    │   │   │   ├── jogos.component.css
    │   │   │   ├── jogo-detalhes.component.ts
    │   │   │   ├── jogo-detalhes.component.html
    │   │   │   ├── jogos-favoritos.component.ts
    │   │   │   ├── jogos-favoritos.component.html
    │   │   │   ├── jogos-novo.component.ts  # Reactive Form
    │   │   │   └── jogos-novo.component.html
    │   │   └── sobre/
    │   │       ├── sobre.component.ts
    │   │       ├── sobre.component.html
    │   │       └── sobre.component.css
    │   │
    │   ├── services/
    │   │   └── games.service.ts      # BehaviorSubject, addGame, setFavorite
    │   │
    │   ├── app.ts                    # App root (RouterOutlet + Header/Footer)
    │   ├── app.html
    │   ├── app.css
    │   ├── app.routes.ts             # rotas da aplicação (home, jogos, etc.)
    │   ├── app.config.ts             # provideRouter + hydration
    │   └── app.routes.server.ts      # SSR/Prerender (getPrerenderParams)
    │
    ├── index.html
    └── styles.css                    # variáveis e resets globais
```

---

## ⚙️ SSR / Prerender

- O projeto utiliza **prerender** para rotas estáticas e para **/jogos/:id** via `getPrerenderParams`, que gera as páginas com base nos IDs do `GAMES`.  
- Arquivo: `src/app/app.routes.server.ts`  
- Alternativamente, é possível deixar `/jogos/:id` somente como **Server** (`RenderMode.Server`) se a lista for muito grande.

---

## 🧪 Testes

- Exemplos com **TestBed** usando **standalone components** (entrando em `imports`, não `declarations`)  
- Corrigido `jogos.spec.ts` para importar `./jogos.component` corretamente

---

## ▶️ Como rodar localmente

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
ng serve -o

# Rodar testes (opcional)
ng test

# Build de produção
ng build
```

---

## ☁️ Deploy (Vercel)

- Projeto configurado para **SSR/Prerender**  
- Erros resolvidos envolvendo **prerender de rotas dinâmicas**  
- Ao subir para `main`, a Vercel executa `npm run build` e publica

---

## 🧭 Roadmap (próximos passos)

- Integração com **API de jogos** (ex.: IGDB/RAWG)  
- **Filtro avançado** por plataforma, gênero e tags  
- **Autenticação** + **listas do usuário** (jogados, jogando, quero jogar)  
- **PWA** (offline, add-to-home-screen)  

---

## 👩‍💻 Autora

<p align="center">
  <img src="public/Sarah-Hernandes.jpg" width="140" style="border-radius: 50%;"/>
</p>

**Sarah Hernandes** – Desenvolvedora Full Stack  
Contato e redes sociais

---

## 📜 Licença

Este projeto é distribuído sob a licença MIT
