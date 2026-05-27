// game.jsx — state, calculations, opponent generation

const { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } = React;

// ============================================================================
// === Enhancement system (rate.js 모델 기반) ====================================
// ============================================================================
// 강화 = 확률-보상 반비례 모델
//   1) 성공률 = exp(-k · lvl²)  — 초반 완만, 후반 급락
//   2) 누적 스탯 = a · lvl^p   — 초반 완만, 후반 폭발
//   3) 전투 승률 = sigmoid(n · (myAtk - oppDef)), [minWin, maxWin] 클램프

const RATE_K          = 0.007;   // 확률 감쇠 계수 (낮을수록 완만)
const TARGET_MAX_STAT = 150;     // +20강에서 도달하는 누적 스탯
const MAX_LVL         = 20;
const STAT_EXPONENT   = 1.7;     // 후반 폭발력 지수
const CONST_A         = TARGET_MAX_STAT / Math.pow(MAX_LVL, STAT_EXPONENT);

const MIN_WIN_RATE = 0.05;
const MAX_WIN_RATE = 0.95;

// 누적 스탯 (lvl 0~20)
function totalStatAt(lvl) {
  return CONST_A * Math.pow(Math.max(0, lvl), STAT_EXPONENT);
}

// 강화 1회 성공 시 증가량 (lvl → lvl+1)
function statGainFromCurrentLvl(currentLvl) {
  return totalStatAt(currentLvl + 1) - totalStatAt(currentLvl);
}

// 강화 성공률 (현재 lvl 기준)
function successRateAt(currentLvl) {
  return Math.max(0.001, Math.exp(-RATE_K * currentLvl * currentLvl));
}

// === 전투 승률 보정변수 n 계산 ===
// 비대칭 모델 (공격력 vs 방어력) — +15 공격 vs +10 방어에서 ~85% 명중률.
const _CAL_STAT_DIFF = totalStatAt(15) - totalStatAt(10);
const _CAL_INTER     = ((MAX_WIN_RATE - MIN_WIN_RATE) / (0.85 - MIN_WIN_RATE)) - 1;
const WIN_RATE_N     = -Math.log(_CAL_INTER) / _CAL_STAT_DIFF;

// === 외부에 노출되던 기존 API와의 호환 함수들 ===

function statGainAtLevel(level) {
  return totalStatAt(level) - totalStatAt(level - 1);
}

function cumulativeStatAt(level) {
  return totalStatAt(level);
}

// 트레이드오프 패널티 제거됨 — 시그니처만 유지 (외부에서 참조하는 경우 대비)
function penaltyFromOppositeLevel(_oppLevel) {
  return 0;
}

// 두 트랙은 서로 영향 없음. 각각 base 10 + 누적 스탯.
function effectiveStats(atkLvl, defLvl) {
  const atk = Math.max(1, Math.round(10 + cumulativeStatAt(atkLvl)));
  const def = Math.max(1, Math.round(10 + cumulativeStatAt(defLvl)));
  return { atk, def };
}

// 종합 전투력 — 전투 승률 계산의 기본 단위
function totalPower(atkLvl, defLvl) {
  return Math.max(1, Math.round(20 + cumulativeStatAt(atkLvl) + cumulativeStatAt(defLvl)));
}

function zoneOfNextLevel(nextLvl) {
  const currentLvl = nextLvl - 1;
  const rate = successRateAt(currentLvl);
  const gain = statGainFromCurrentLvl(currentLvl);

  // 성공률 구간으로 안전/일반/위험/극한 라벨링 (UI용)
  // stayShare: 실패했을 때 그중 유지될 비율. 나머지는 하락.
  // dropAmount: 하락 시 떨어지는 강 수.
  let zoneInfo;
  if (rate >= 0.85)      zoneInfo = { key: 'safe',    label: '안전', stayShare: 1.00, dropAmount: 0, cost: 10  };
  else if (rate >= 0.50) zoneInfo = { key: 'normal',  label: '일반', stayShare: 0.70, dropAmount: 1, cost: 25  };
  else if (rate >= 0.20) zoneInfo = { key: 'danger',  label: '위험', stayShare: 0.40, dropAmount: 1, cost: 50  };
  else                   zoneInfo = { key: 'extreme', label: '극한', stayShare: 0.20, dropAmount: 2, cost: 100 };

  const failRate = 1 - rate;
  const stayRate = failRate * zoneInfo.stayShare;
  const dropRate = failRate * (1 - zoneInfo.stayShare);

  // 기존 failDrop 필드와의 호환 (lvl0에서는 하락 불가 → 자동 0)
  return {
    ...zoneInfo,
    successRate: rate,
    stayRate,
    dropRate,
    failDrop: zoneInfo.dropAmount,
    statGain: gain,
  };
}

function scrapsFromDecomposing(atkLvl, defLvl) {
  // 상대 딱지를 찢어 얻는 종이 조각.
  // 강화 비용(10/25/50/100)과 실패 확률을 고려해 후반 보스 격파 시 다음 단계
  // 진입에 필요한 자금 일부를 충당할 수 있도록 넉넉히 보상.
  const sum = totalStatAt(atkLvl) + totalStatAt(defLvl);
  return Math.round(20 + sum * 2.5);
}

function winProbability(myAtk, oppDef) {
  // 비대칭 모델: 공격자의 공격력 vs 방어자의 방어력.
  // 내 턴이면 (myAtk = 내 공격력, oppDef = 상대 방어력).
  // 상대 턴이면 (myAtk = 상대 공격력, oppDef = 내 방어력).
  const diff = myAtk - oppDef;
  const sig  = 1 / (1 + Math.exp(-WIN_RATE_N * diff));
  const rate = MIN_WIN_RATE + (MAX_WIN_RATE - MIN_WIN_RATE) * sig;
  return Math.round(rate * 100); // 0~100
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
// 12명의 NPC가 항상 동일한 순서로 등장. 각자 다른 빌드 타입.
// 'balance' 균형 · 'attack' 공격형 · 'defense' 방어형 · 'glass' 글래스캐논 · 'tank' 탱크
const OPPONENT_ROSTER = [
  { name: '동네 형',         atk: 1,  def: 1,  build: 'balance' },
  { name: '뒷골목 영수',     atk: 4,  def: 1,  build: 'attack'  },
  { name: '학교 일진',       atk: 2,  def: 5,  build: 'defense' },
  { name: '거리의 무명',     atk: 5,  def: 5,  build: 'balance' },
  { name: '문방구 김씨',     atk: 3,  def: 9,  build: 'defense'    },
  { name: '시장통 갑돌',     atk: 10, def: 3,  build: 'attack'   },
  { name: '옥상 박씨',       atk: 8,  def: 8,  build: 'balance' },
  { name: '전설의 종이꾼',   atk: 15, def: 5,  build: 'attack'  },
  { name: '딱지왕 후보',     atk: 6,  def: 15, build: 'defense' },
  { name: '강북 챔피언',     atk: 12, def: 12, build: 'balance' },
  { name: '잊혀진 도장꾼',   atk: 19, def: 9,  build: 'attack'   },
  { name: '바람의 최강자',   atk: 20, def: 20, build: 'balance' },
];

const BUILD_INFO = {
  balance: { label: '균형',     glyph: '⚖️', tone: 'neutral' },
  attack:  { label: '공격형',   glyph: '🗡️', tone: 'jeok'    },
  defense: { label: '방어형',   glyph: '🛡️', tone: 'cheong'  },
  // tank:    { label: '탱크',     glyph: '盾', tone: 'cheong'  },
  // glass:   { label: '글래스캐논', glyph: '刃', tone: 'jeok'  },
};

// 기존 외부 호환 — 이름 목록만 유지
const OPPONENT_NAMES = OPPONENT_ROSTER.map(e => e.name);
const TOTAL_OPPONENTS = OPPONENT_ROSTER.length;

function makeOpponent(idx) {
  const i = Math.min(Math.max(1, idx), TOTAL_OPPONENTS) - 1;
  const entry = OPPONENT_ROSTER[i];
  const eff = effectiveStats(entry.atk, entry.def);
  const info = BUILD_INFO[entry.build];
  // 빌드 분위기에 맞는 팔레트 시드
  const paletteIdx = info.tone === 'jeok' ? [0, 4, 7][i % 3]
                   : info.tone === 'cheong' ? [2, 5, 3][i % 3]
                   : [1, 6, 3][i % 3];
  return {
    id: 'opp-' + Date.now() + '-' + i,
    name: entry.name,
    atkLvl: entry.atk,
    defLvl: entry.def,
    effAtk: eff.atk,
    effDef: eff.def,
    paletteSeed: paletteIdx,
    build: entry.build,
    buildLabel: info.label,
    buildGlyph: info.glyph,
    buildTone: info.tone,
    order: i + 1,
    total: TOTAL_OPPONENTS,
    isFinal: i === TOTAL_OPPONENTS - 1,
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

// === 시작 / 초기화 종이 조각 ===
// 시작자가 +3강 강화 뚜딩 구간(안전) 몇 차례를 감당하고
// 1번 적에게 충분히 도전할 수 있는 초기 자금.
const STARTING_SCRAPS = 250;
function GameProvider({ children }) {
  const [screen, setScreen] = useState('lobby'); // lobby, enhance, battle
  const [paperScraps, setScraps] = useState(STARTING_SCRAPS);
  const [atkLvl, setAtkLvl] = useState(0);
  const [defLvl, setDefLvl] = useState(0);
  const [paletteSeed] = useState(0); // player palette
  const [nickname, setNickname] = useState(null); // null = needs naming
  const [history, setHistory] = useState([]); // [{win:true, opponent, atk, def}]
  const [currentOpponent, setCurrentOpponent] = useState(null);
  const [opponentIdx, setOpponentIdx] = useState(0);

  const eff = effectiveStats(atkLvl, defLvl);
  const myPower = totalPower(atkLvl, defLvl);

  const enhance = useCallback((track) => {
    // track: 'atk' or 'def'
    const lvl = track === 'atk' ? atkLvl : defLvl;
    if (lvl >= 20) return { ok: false, reason: 'max' };
    const z = zoneOfNextLevel(lvl + 1);
    if (paperScraps < z.cost) return { ok: false, reason: 'cost' };
    setScraps(s => s - z.cost);

    const r = Math.random();
    // Roll into one of three outcomes:
    //   [0, successRate)               → success
    //   [successRate, +stayRate)       → stay (no change)
    //   [successRate + stayRate, 1)    → drop
    if (r < z.successRate) {
      if (track === 'atk') setAtkLvl(l => l + 1);
      else setDefLvl(l => l + 1);
      return { ok: true, outcome: 'success', zone: z, newLvl: lvl + 1, drop: 0 };
    } else if (r < z.successRate + z.stayRate) {
      return { ok: true, outcome: 'stay', zone: z, newLvl: lvl, drop: 0 };
    } else {
      const drop = z.dropAmount;
      if (drop > 0) {
        if (track === 'atk') setAtkLvl(l => Math.max(0, l - drop));
        else setDefLvl(l => Math.max(0, l - drop));
      }
      return { ok: true, outcome: 'drop', zone: z, newLvl: Math.max(0, lvl - drop), drop };
    }
  }, [atkLvl, defLvl, paperScraps]);

  const summonOpponent = useCallback(() => {
    const next = opponentIdx + 1;
    setOpponentIdx(next);
    const opp = makeOpponent(next);
    setCurrentOpponent(opp);
    return opp;
  }, [opponentIdx]);

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
      // Defeat — wipe ddakji stats + scraps + opponent progression.
      // (currentOpponent is NOT nulled here, otherwise BattleScreen would
      //  early-return before rendering the defeat result modal.)
      setAtkLvl(0);
      setDefLvl(0);
      setScraps(STARTING_SCRAPS); // back to starting scraps
      setOpponentIdx(0); // restart roster from #1
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
    eff, myPower,
    history,
    currentOpponent, summonOpponent,
    enhance, completeBattle, addScraps,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

Object.assign(window, {
  effectiveStats, totalPower, zoneOfNextLevel, scrapsFromDecomposing, winProbability,
  cumulativeStatAt, penaltyFromOppositeLevel, statGainAtLevel,
  paletteForSeed, makeOpponent, tierOf,
  PALETTES, OPPONENT_NAMES, OPPONENT_ROSTER, TOTAL_OPPONENTS,
  GameContext, GameProvider, useGame,
});
