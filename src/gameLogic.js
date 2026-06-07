// 팔레트(색상) 데이터 — window.paletteForSeed 로 전역 노출
// 게임 수식·확률 계산은 백엔드에서 처리합니다.

var PALETTES = [
  { name: '단청', tl: 'oklch(0.55 0.16 25)',  tr: 'oklch(0.55 0.14 240)', bl: 'oklch(0.68 0.16 85)',  br: 'oklch(0.45 0.05 50)', center: 'oklch(0.96 0.012 80)' },
  { name: '오방', tl: 'oklch(0.55 0.16 25)',  tr: 'oklch(0.62 0.16 150)', bl: 'oklch(0.55 0.16 270)', br: 'oklch(0.78 0.14 85)', center: 'oklch(0.25 0.01 50)' },
  { name: '청자', tl: 'oklch(0.62 0.10 200)', tr: 'oklch(0.48 0.10 200)', bl: 'oklch(0.72 0.08 200)', br: 'oklch(0.42 0.10 200)', center: 'oklch(0.92 0.02 80)' },
  { name: '먹빛', tl: 'oklch(0.30 0.01 50)',  tr: 'oklch(0.50 0.01 50)',  bl: 'oklch(0.40 0.01 50)',  br: 'oklch(0.22 0.01 50)', center: 'oklch(0.88 0.02 80)' },
  { name: '복숭', tl: 'oklch(0.75 0.10 30)',  tr: 'oklch(0.65 0.13 25)',  bl: 'oklch(0.82 0.08 50)',  br: 'oklch(0.60 0.14 20)', center: 'oklch(0.94 0.02 80)' },
  { name: '쪽빛', tl: 'oklch(0.42 0.14 250)', tr: 'oklch(0.55 0.14 240)', bl: 'oklch(0.62 0.10 235)', br: 'oklch(0.35 0.14 255)', center: 'oklch(0.92 0.02 250)' },
  { name: '소슬', tl: 'oklch(0.60 0.14 145)', tr: 'oklch(0.45 0.14 150)', bl: 'oklch(0.72 0.10 130)', br: 'oklch(0.55 0.14 160)', center: 'oklch(0.94 0.02 100)' },
  { name: '주황', tl: 'oklch(0.68 0.16 50)',  tr: 'oklch(0.58 0.18 35)',  bl: 'oklch(0.75 0.14 60)',  br: 'oklch(0.52 0.17 30)', center: 'oklch(0.94 0.02 80)' },
];

window.paletteForSeed = function (seed) {
  return PALETTES[seed % PALETTES.length];
};
