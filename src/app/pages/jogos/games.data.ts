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
    id: 990,
    title: 'inZOI',
    img: 'https://cdn-flowgames.s3.us-east-2.amazonaws.com/wp-content/uploads/2025/03/26145946/inzoi-pc-jogo-steam-cover-1.jpg',
    genre: ['Simulador de Vida Real', 'Realístico'],
    year: 2025,
    dev: 'inZOI Studio',
    pub: 'KRAFTON, Inc.',
    description: '"Toda vida se torna uma história". Crie sua própria história única enquanto guia e observa a vida de seus Zois. Crie a vida ideal com as ferramentas do inZOI, projetando personagens únicos e construindo casas deslumbrantes.',
    steam: 'https://store.steampowered.com/app/2456740/inZOI/'
  },
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
  },
  {
    id: 997,
    title: 'The Sims™ 4',
    img: 'https://upload.wikimedia.org/wikipedia/pt/thumb/3/34/Nova_capa_de_The_Sims_4.png/270px-Nova_capa_de_The_Sims_4.png',
    genre: ['Simulador de Vida Real', 'Casual'],
    year: 2014,
    dev: 'Maxis',
    pub: 'Electronic Arts',
    description: 'Curta o poder de criar e controlar pessoas num mundo virtual onde não há regras. Seja poderoso e livre, divirta-se e jogue com a vida!',
    steam: 'https://store.steampowered.com/app/1222670/The_Sims_4/'
  },
  {
    id: 998,
    title: 'The Sims™ 4 - Natureza Encantada',
    img: 'https://image.api.playstation.com/vulcan/ap/rnd/202506/0314/721c9d4693680911dbc50775a77d7455c75f9eff00aa1f3c.png',
    genre: ['Simulador de Vida Real', 'Magia', 'Fadas'],
    year: 2025,
    dev: 'Maxis', 
    pub: 'Electronic Arts',
    description: 'Viva em meio à magia da natureza no The Sims™ 4 Pacote de Expansão Natureza Encantada. Adote um estilo de vida livre, em que você pode Coletar itens e dormir sob as estrelas, ou cultive os presentes da natureza dentro de casa, com vasos versáteis para jardinagem. Um mundo encantador espera por você, onde é possível criar Elixires, curar Doenças, conhecer a Mãe Natureza e até se tornar uma Fada!',
    steam: 'https://store.steampowered.com/app/3199780/The_Sims_4_Pacote_de_Expanso_Natureza_Encantada/'
  },
  {
    id: 999,
    title: 'The Sims™ 4 - Gatos e Cães',
    img: 'https://cdn1.epicgames.com/offer/2a14cf8a83b149919a2399504e5686a6/EGS_EP04TheSims4CatsDogs_ElectronicArts_DLC_S1_2560x1440-819239f9ebffe4f66c485ba0f4d7d547',
    genre: ['Simulador de Vida Real', 'Cães', 'Gatos'],
    year: 2017,
    dev: 'Maxis', 
    pub: 'Electronic Arts',
    description: 'Crie vários gatos e cães, adicione-os às casas dos seus Sims para mudar as vidas deles para sempre e cuide dos bichinhos da vizinhança como veterinário com o The Sims™ 4 Gatos e Cães.',
    steam: 'https://store.steampowered.com/app/1235721/The_Sims_4_Cats__Dogs/'
  },
  {
    id: 1000,
    title: 'Resident Evil 4',
    img: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2050650/capsule_616x353.jpg?t=1736385712',
    genre: ['Terror', 'Tiro', 'Zumbis'],
    year: 2023,
    dev: 'CAPCOM Co., Ltd.', 
    pub: 'CAPCOM Co., Ltd.',
    description: 'Sobrevivência é apenas o começo. Seis anos se passaram desde o desastre biológico em Raccoon City. Leon S. Kennedy, um dos sobreviventes, segue o rastro da raptada filha do presidente até uma vila europeia isolada, onde há algo terrivelmente errado com os habitantes.',
    steam: 'https://store.steampowered.com/app/2050650/Resident_Evil_4/'
  },
   {
    id: 1001,
    title: 'Bayonetta',
    img: 'https://image.api.playstation.com/vulcan/img/cfn/1130713kl3mfwnbkusAOq2GK2g5oLlfTRa_ekbYFVvcCMyQkZOtN9sT3o5D9SBQ5uWF7F01GYWTJhwzEfxwagzuX5EU7TeII.png',
    genre: ['Ação', 'Protagonista Mulher', 'Hack and Slash'],
    year: 2017,
    dev: 'PlatinumGames', 
    pub: 'SEGA',
    description: 'A obra-prima de ação da PlatinumGames, aclamada mundialmente, finalmente chega ao PC. Experimente a ação estilosa e exagerada em 60fps com resoluções HD desbloqueadas. A forma definitiva de jogar: ser mau nunca pareceu tão bom.',
    steam: 'https://store.steampowered.com/app/460790/Bayonetta/'
  }
];
