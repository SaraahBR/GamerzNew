export type Game = {
  id: number;
  title: string;
  img: string;
  genre: string[];
  year: number;
  dev: string;
  pub: string;
  description: string;
  steam: string;
  favorite?: boolean; 
};

export const GAMES: Game[] = [
  {
    id: 991,
    title: 'Hades',
    img: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145360/header.jpg',
    genre: ['Ação', 'Roguelike'],
    year: 2020,
    dev: 'Supergiant Games',
    pub: 'Supergiant Games',
    description: 'Roguelike de ação com narrativa reativa. Controle Zagreus em sua fuga do Submundo combinando poderes dos deuses do Olimpo.',
    steam: 'https://store.steampowered.com/app/1145360/'
  },
  {
    id: 992,
    title: 'Elden Ring',
    img: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg',
    genre: ['RPG de Ação', 'Mundo Aberto'],
    year: 2022,
    dev: 'FromSoftware',
    pub: 'Bandai Namco Entertainment',
    description: 'RPG de ação em mundo aberto com exploração densa, masmorras herdadas e chefes desafiadores no Entre-Terras.',
    steam: 'https://store.steampowered.com/app/1245620/'
  },
  {
    id: 993,
    title: 'Hollow Knight',
    img: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/header.jpg',
    genre: ['Metroidvania', 'Ação'],
    year: 2017,
    dev: 'Team Cherry',
    pub: 'Team Cherry',
    description: 'Metroidvania atmosférico em um reino subterrâneo decadente, com plataformas precisas e combates exigentes.',
    steam: 'https://store.steampowered.com/app/367520/'
  },
  {
    id: 994,
    title: 'Starfield',
    img: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1716740/header.jpg',
    genre: ['RPG', 'Mundo Aberto', 'Espaço'],
    year: 2023,
    dev: 'Bethesda Game Studios',
    pub: 'Bethesda Softworks',
    description: 'RPG espacial com centenas de sistemas para explorar, facções, naves personalizáveis e progressão livre.',
    steam: 'https://store.steampowered.com/app/1716740/'
  },
  {
    id: 995,
    title: "Baldur's Gate 3",
    img: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1086940/header.jpg',
    genre: ['RPG Tático'],
    year: 2023,
    dev: 'Larian Studios',
    pub: 'Larian Studios',
    description: 'RPG baseado em D&D 5e com foco em escolhas, reatividade e companheiros com histórias profundas.',
    steam: 'https://store.steampowered.com/app/1086940/'
  },
  {
    id: 996,
    title: 'Cyberpunk 2077',
    img: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg',
    genre: ['RPG', 'Mundo Aberto'],
    year: 2020,
    dev: 'CD PROJEKT RED',
    pub: 'CD PROJEKT',
    description: 'Mundo aberto futurista em Night City com narrativa cinematográfica e expansão Phantom Liberty.',
    steam: 'https://store.steampowered.com/app/1091500/'
  }
];
