export interface PresetSticker {
  id: string;
  name: string;
  svg: string;
}

export const presetStickers: PresetSticker[] = [
  {
    id: 'skull',
    name: 'Skull',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="black" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M50 8C28 8 15 24 15 44c0 12 6 20 12 26v12a4 4 0 004 4h6v-8h6v8h14v-8h6v8h6a4 4 0 004-4V70c6-6 12-14 12-26C85 24 72 8 50 8z"/><circle cx="35" cy="42" r="8" fill="black"/><circle cx="65" cy="42" r="8" fill="black"/><path d="M44 60l6 8 6-8"/></svg>`,
  },
  {
    id: 'flame',
    name: 'Flame',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="black" stroke="black" stroke-width="2"><path d="M50 5C40 25 30 35 30 55c0 22 12 38 20 38s20-16 20-38c0-12-6-20-10-28-4 8-6 14-6 20 0-10-4-22-4-42z"/></svg>`,
  },
  {
    id: 'star',
    name: 'Star',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="black" stroke="black" stroke-width="2" stroke-linejoin="round"><path d="M50 5L61 38L96 38L68 58L79 92L50 72L21 92L32 58L4 38L39 38z"/></svg>`,
  },
  {
    id: 'eye',
    name: 'Eye',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="black" stroke-width="3"><path d="M5 50C20 25 35 18 50 18s30 7 45 32c-15 25-30 32-45 32S20 75 5 50z"/><circle cx="50" cy="50" r="15" fill="black"/><circle cx="55" cy="45" r="5" fill="white"/></svg>`,
  },
  {
    id: 'bolt',
    name: 'Bolt',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="black" stroke="black" stroke-width="2" stroke-linejoin="round"><path d="M58 5L25 55L45 55L38 95L75 40L55 40z"/></svg>`,
  },
  {
    id: 'crown',
    name: 'Crown',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="black" stroke="black" stroke-width="2" stroke-linejoin="round"><path d="M10 75L15 30L30 50L50 25L70 50L85 30L90 75z"/><rect x="10" y="75" width="80" height="12"/></svg>`,
  },
  {
    id: 'heart',
    name: 'Heart',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="black" stroke="black" stroke-width="2"><path d="M50 85C50 85 15 60 15 38c0-15 12-25 25-25 7 0 14 5 10 12 4-7 13-12 10-12 13 0 25 10 25 25 0 22-35 47-35 47z"/></svg>`,
  },
  {
    id: 'circle-text',
    name: 'Circle',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="black" stroke-width="4"><circle cx="50" cy="50" r="42"/><circle cx="50" cy="50" r="28"/></svg>`,
  },
  {
    id: 'triangle',
    name: 'Triangle',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="black" stroke-width="4" stroke-linejoin="round"><path d="M50 10L90 85L10 85z"/></svg>`,
  },
  {
    id: 'snake',
    name: 'Snake',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="black" stroke-width="4" stroke-linecap="round"><path d="M15 30c0-10 10-15 20-10s10 15 0 20-15 10-5 15 20 5 25-5 5-15 15-15 15 5-5 15"/><circle cx="80" cy="70" r="4" fill="black"/></svg>`,
  },
  {
    id: 'diamond',
    name: 'Diamond',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="black" stroke-width="4" stroke-linejoin="round"><path d="M50 8L88 38L50 92L12 38z"/><path d="M12 38L88 38M30 8L50 92M70 8L50 92" stroke-width="2"/></svg>`,
  },
  {
    id: 'sun',
    name: 'Sun',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="black" stroke-width="3" stroke-linecap="round"><circle cx="50" cy="50" r="18"/><path d="M50 5v12M50 83v12M5 50h12M83 50h12M18 18l8 8M74 74l8 8M82 18l-8 8M18 82l8-8"/></svg>`,
  },
];

export function presetStickerToDataUrl(sticker: PresetSticker): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(sticker.svg)))}`;
}
