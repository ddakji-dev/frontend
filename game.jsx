// game.jsx — state, calculations, opponent generation

const { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } = React;

// === Enhancement system ===

// Per-level stat increment based on current zone
function statGainAtLevel(level) {
  // level is the NEW level after success
  if (level <= 5) return 1;
  if (level <= 10) return 2;
  if (level <= 15) return 3;
  return 5;
}

// Cumulative stat gained from enhancement up to current level
function cumulativeStatAt(level) {
  let total = 0;
  for (let i = 1; i <= level; i++) total += statGainAtLevel(i);
  return total;
}

// Penalty from opposite track
function penaltyFromOppositeLevel(oppLevel) {
  // 0~5 none; 6~10 -1/lvl over 5; 11~15 -2/lvl over 10; 16~20 -3/lvl over 15
  let p = 0;
  if (oppLevel > 5) p += Math.min(oppLevel, 10) - 5;        // 1pt per lvl 6-10
  if (oppLevel > 10) p += (Math.min(oppLevel, 15) - 10) * 2; // 2pt per lvl 11-15
  if (oppLevel > 15) p += (Math.min(oppLevel, 20) - 15) * 3; // 3pt per lvl 16-20
  return p;
}

function effectiveStats(atkLvl, defLvl) {
  const atk = Math.max(1, 10 + cumulativeStatAt(atkLvl) - penaltyFromOppositeLevel(defLvl));
  const def = Math.max(1, 10 + cumulativeStatAt(defLvl) - penaltyFromOppositeLevel(atkLvl));
  return { atk, def };
}

function zoneOfNextLevel(nextLvl) {
  if (nextLvl <= 5)  return { key: 'safe',    label: '안전', successRate: 1.00, failDrop: 0, cost: 10, statGain: 1 };
  if (nextLvl <= 10) return { key: 'normal',  label: '일반', successRate: 0.70, failDrop: 0, cost: 25, statGain: 2 };
  if (nextLvl <= 15) return { key: 'danger',  label: '위험', successRate: 0.40, failDrop: 1, cost: 50, statGain: 3 };
  return                  { key: 'extreme', label: '극한', successRate: 0.20, failDrop: 3, cost: 100, statGain: 5 };
}

function scrapsFromDecomposing(atkLvl, defLvl) {
  return (atkLvl + defLvl) * 3;
}

function winProbability(myAtk, oppDef) {
  const p = 50 + (myAtk - oppDef) * 0.5;
  return Math.max(10, Math.min(90, p));
}

// === Ddakji palette generation ===

// Curated palettes inspired by 단청 / 색종이
const PALETTES = [
  { name: '단청', tl: 'oklch(0.55 0.16 25)',  tr: 'oklch(0.55 0.14 240)', bl: 'oklch(0.68 0.16 85)',  br: 'oklch(0.45 0.05 50)', center: 'oklch(0.96 0.012 80)' },
  { name: '오방', tl: 'oklch(0.55 0.16 25)',  tr: 'oklch(0.62 0.16 150)', bl: 'oklch(0.55 0.16 270)', br: 'oklch(0.78 0.14 85)', center: 'oklch(0.25 0.01 50)' },
  { name: '청자', tl: 'oklch(0.62 0.10 200)', tr: 'oklch(0.48 0.10 200)', bl: 'oklch(0.72 0.08 200)', br: 'oklch(0.42 0.10 200)', center: 'oklch(0.92 0.02 80)' },
  { name: '먹빛', tl: 'oklch(0.30 0.01 50)',  tr: 'oklch(0.50 0.01 50)',  bl: 'oklch(0.40 0.01 50)',  br: 'oklch(0.22 0.01 50)', center: 'oklch(0.88 0.02 80)' },
  { name: '복숭', tl: 'oklch(0.75 0.10 30)',  tr: 'oklch(0.65 0.13 25)',  bl: 'oklch(0.82 0.08 50)',  br: 'oklch(0.60 0.14 20)', center: 'oklch(0.94 0.02 80)' },
  { name: '쪽빛', tl: 'oklch(0.42 0.14 250)', tr: 'oklch(0.55 0.14 240)', bl: 'oklch(0.62 0.10 235)', br: 'oklch(0.35 0.14 255)', center: 'oklch(0.92 0.02 250)' },
  { name: '소슬', tl: 'oklch(0.60 0.14 145)', tr: 'oklch(0.45 0.14 150)', bl: 'oklch(0.72 0.10 130)', br: 'oklch(0.55 0.14 160)', center: 'oklch(0.94 0.02 100)' },
  { name: '주황', tl: 'oklch(0.68 0.16 50)',  tr: 'oklch(0.58 0.18 35)',  bl: 'oklch(0.75 0.14 60)',  br: 'oklch(0.52 0.17 30)', center: 'oklch(0.94 0.02 80)' },
];

function paletteForSeed(seed) {
  return PALETTES[seed % PALETTES.length];
}

// === Opponent generation ===

const OPPONENT_NAMES = [
  '동네 형',
  '뒷골목 영수',
  '학교 일진',
  '거리의 무명',
  '문방구 김씨',
  '시장통 갑돌',
  '옥상 박씨',
  '전설의 종이꾼',
  '딱지왕 후보',
  '강북 챔피언',
  '잊혀진 도장꾼',
  '바람의 최강자',
];

function makeOpponent(playerPower, idx) {
  // playerPower ~ atkLvl + defLvl
  // scale opponent to roughly match, with slight variance
  const total = Math.max(0, Math.min(40, playerPower + (Math.random() < 0.5 ? -2 : 2) + Math.floor(Math.random() * 6) - 2));
  // distribute
  const ratio = 0.2 + Math.random() * 0.6; // 0.2~0.8
  let atk = Math.round(total * ratio);
  let def = total - atk;
  atk = Math.max(0, Math.min(20, atk));
  def = Math.max(0, Math.min(20, def));
  const eff = effectiveStats(atk, def);
  const seed = (idx * 7 + atk * 3 + def * 5 + 11) % PALETTES.length;
  return {
    id: 'opp-' + Date.now() + '-' + idx,
    name: OPPONENT_NAMES[idx % OPPONENT_NAMES.length],
    atkLvl: atk,
    defLvl: def,
    effAtk: eff.atk,
    effDef: eff.def,
    paletteSeed: seed,
  };
}

function tierOf(atkLvl, defLvl) {
  const total = atkLvl + defLvl;
  if (total >= 30) return '극상';
  if (total >= 20) return '상급';
  if (total >= 10) return '중급';
  if (total >= 1) return '초급';
  return '무강';
}

// === Game state context ===

const GameContext = createContext(null);
const useGame = () => useContext(GameContext);

function GameProvider({ children }) {
  const [screen, setScreen] = useState('lobby'); // lobby, enhance, battle
  const [paperScraps, setScraps] = useState(120);
  const [atkLvl, setAtkLvl] = useState(0);
  const [defLvl, setDefLvl] = useState(0);
  const [paletteSeed] = useState(0); // player palette
  const [nickname, setNickname] = useState(null); // null = needs naming
  const [history, setHistory] = useState([]); // [{win:true, opponent, atk, def}]
  const [currentOpponent, setCurrentOpponent] = useState(null);
  const [opponentIdx, setOpponentIdx] = useState(0);

  const eff = effectiveStats(atkLvl, defLvl);

  const enhance = useCallback((track) => {
    // track: 'atk' or 'def'
    const lvl = track === 'atk' ? atkLvl : defLvl;
    if (lvl >= 20) return { ok: false, reason: 'max' };
    const z = zoneOfNextLevel(lvl + 1);
    if (paperScraps < z.cost) return { ok: false, reason: 'cost' };
    setScraps(s => s - z.cost);
    const rolled = Math.random();
    const success = rolled < z.successRate;
    if (success) {
      if (track === 'atk') setAtkLvl(l => l + 1);
      else setDefLvl(l => l + 1);
      return { ok: true, success: true, zone: z, newLvl: lvl + 1 };
    } else {
      // fail: drop by z.failDrop, floor 0
      const drop = z.failDrop;
      if (drop > 0) {
        if (track === 'atk') setAtkLvl(l => Math.max(0, l - drop));
        else setDefLvl(l => Math.max(0, l - drop));
      }
      return { ok: true, success: false, zone: z, drop, newLvl: Math.max(0, lvl - drop) };
    }
  }, [atkLvl, defLvl, paperScraps]);

  const summonOpponent = useCallback(() => {
    const next = opponentIdx + 1;
    setOpponentIdx(next);
    const opp = makeOpponent(atkLvl + defLvl, next);
    setCurrentOpponent(opp);
    return opp;
  }, [opponentIdx, atkLvl, defLvl]);

  // Turn-based: battle screen handles per-swing rolls.
  // completeBattle is called once at the end with the final result.
  // On WIN: opponent's ddakji is immediately decomposed into paper scraps.
  // On LOSS: everything resets to base.
  const completeBattle = useCallback((win, opp) => {
    if (win) {
      const gained = scrapsFromDecomposing(opp.atkLvl, opp.defLvl);
      setScraps(s => s + gained);
      setHistory(h => [{ win: true, oppName: opp.name, atk: opp.atkLvl, def: opp.defLvl, gained }, ...h].slice(0, 8));
      return { gained };
    } else {
      // Defeat — wipe ddakji stats + scraps now so the result modal reflects loss.
      // Nickname is NOT cleared here; clearNickname() runs when the user
      // dismisses the defeat modal, which transitions them to the naming screen.
      setAtkLvl(0);
      setDefLvl(0);
      setScraps(120); // back to starting scraps
      setHistory(h => [{ win: false, oppName: opp.name, atk: opp.atkLvl, def: opp.defLvl }, ...h].slice(0, 8));
      return { gained: 0 };
    }
  }, []);

  const clearNickname = useCallback(() => setNickname(null), []);

  const addScraps = useCallback((n) => setScraps(s => s + n), []);

  const value = {
    screen, setScreen,
    paperScraps, atkLvl, defLvl, paletteSeed,
    nickname, setNickname, clearNickname,
    eff,
    history,
    currentOpponent, summonOpponent,
    enhance, completeBattle, addScraps,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

Object.assign(window, {
  effectiveStats, zoneOfNextLevel, scrapsFromDecomposing, winProbability,
  cumulativeStatAt, penaltyFromOppositeLevel, statGainAtLevel,
  paletteForSeed, makeOpponent, tierOf,
  PALETTES, OPPONENT_NAMES,
  GameContext, GameProvider, useGame,
});
