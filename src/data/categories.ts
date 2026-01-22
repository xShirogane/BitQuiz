// src/data/categories.ts

// Bazowy adres dla plików w repozytorium (dla innych kwalifikacji)
const GITHUB_BASE = 'https://raw.githubusercontent.com/xShirogane/BitQuiz-Assets/main';

export const SCHOOLS = [
  { id: 'all', name: 'Wszystkie', icon: '♾️' },
  { id: 'ti', name: 'Tech. Informatyk', icon: '💻' },
  { id: 'tp', name: 'Tech. Programista', icon: '⌨️' },
  { id: 'tr', name: 'Tech. Reklamy', icon: '🎨' },
  { id: 'te', name: 'Tech. Elektronik', icon: '🔌' },
];

export const QUALIFICATIONS_DATA = [
  { 
    id: 'inf02', 
    title: 'INF.02', 
    fullName: 'Administracja i eksploatacja systemów', 
    schoolIds: ['ti'], 
    apiUrl: `${GITHUB_BASE}/inf02.json` 
  },
  { 
    id: 'inf03', 
    title: 'INF.03', 
    fullName: 'Tworzenie i administrowanie stronami', 
    schoolIds: ['tp', 'ti'], 
    apiUrl: `${GITHUB_BASE}/inf03.json` 
  },
  { 
    id: 'inf04', 
    title: 'INF.04', 
    fullName: 'Projektowanie, programowanie aplikacji', 
    schoolIds: ['tp'], 
    apiUrl: `${GITHUB_BASE}/inf04.json` 
  },
  { 
    id: 'pgf07', 
    title: 'PGF.07', 
    fullName: 'Wykonywanie przekazu reklamowego', 
    schoolIds: ['tr'], 
    apiUrl: `${GITHUB_BASE}/pgf07.json` 
  },
];