// src/data/categories.ts

// Bazowy adres dla plików w repozytorium (dla innych kwalifikacji)
const GITHUB_BASE = 'https://raw.githubusercontent.com/xShirogane/BitQuiz-Assets/main';

// Dodajemy interfejsy, aby TypeScript w innych plikach wiedział, czego się spodziewać
export interface School {
  id: string;
  name: string;
  icon: string;
}

export interface Qualification {
  id: string;
  title: string;
  fullName: string;
  schoolIds: string[];
  apiUrl: string;
  iconName: any; // <--- Nowe pole dla ikon (typ 'any' dla nazw Ionicons)
}

export const SCHOOLS: School[] = [
  { id: 'ti', name: 'Tech. Informatyk', icon: '💻' },
  { id: 'tp', name: 'Tech. Programista', icon: '⌨️' },
  { id: 'tr', name: 'Tech. Reklamy', icon: '🎨' },
  { id: 'te', name: 'Tech. Elektronik', icon: '🔌' },
];

export const QUALIFICATIONS_DATA: Qualification[] = [
  { 
    id: 'inf02', 
    title: 'INF.02', 
    fullName: 'Administracja i eksploatacja systemów', 
    schoolIds: ['ti'], 
    apiUrl: `${GITHUB_BASE}/inf02.json`,
    iconName: 'hardware-chip-outline' // Procesor
  },
    { 
    id: 'inf05', 
    title: 'INF.05', 
    fullName: 'Administracja i eksploatacja systemów', 
    schoolIds: ['ti'], 
    apiUrl: `${GITHUB_BASE}/inf02.json`,
    iconName: 'hardware-chip-outline' // Procesor
  },
  { 
    id: 'inf03', 
    title: 'INF.03', 
    fullName: 'Tworzenie i administrowanie stronami', 
    schoolIds: ['tp', 'ti'], 
    apiUrl: `${GITHUB_BASE}/inf03.json`,
    iconName: 'code-slash-outline' // Kod / Tag
  },
  { 
    id: 'inf04', 
    title: 'INF.04', 
    fullName: 'Projektowanie, programowanie aplikacji', 
    schoolIds: ['tp'], 
    apiUrl: `${GITHUB_BASE}/inf04.json`,
    iconName: 'desktop-outline' // Monitor
  },
  { 
    id: 'pgf07', 
    title: 'PGF.07', 
    fullName: 'Wykonywanie przekazu reklamowego', 
    schoolIds: ['tr'], 
    apiUrl: `${GITHUB_BASE}/pgf07.json`,
    iconName: 'color-palette-outline' // Paleta (Reklama)
  },
  { 
    id: 'pgf08', 
    title: 'PGF.08', 
    fullName: 'test', 
    schoolIds: ['tr'], 
    apiUrl: `${GITHUB_BASE}/pgf07.json`,
    iconName: 'color-palette-outline' // Paleta (Reklama)
  },
  { 
    id: 'pgf99', 
    title: 'PGF.99', 
    fullName: 'Wykonywanie przekazu reklamowego', 
    schoolIds: ['tr'], 
    apiUrl: `${GITHUB_BASE}/pgf07.json`,
    iconName: 'color-palette-outline' // Paleta (Reklama)
  },
];