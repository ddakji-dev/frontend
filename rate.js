/**
 * 단순 수식 기반 강화 시스템 (확률-보상 반비례 모델)
 * @param {number} lvl - 현재 레벨 (0~19)
 * @returns {object} { successRate, statGain, totalStat }
 */
function getEnhanceData(lvl) {
  // --- [1. 확률 계산: 완만한 지수 감소] ---
  // k값을 낮추어 초반 하락폭을 줄임
  const k_rate = 0.018; 
  const successRate = Math.exp(-k_rate * Math.pow(lvl, 2));

  // --- [2. 누적 스탯 계산: 1강 증가량 1 고정] ---
  // 20강일 때 targetMaxStat에 도달하도록 보정 계수(const_a)를 계산
  const targetMaxStat = 150;
  const maxLvl = 20;
  const exponent = 1.7; // 후반부 폭발력을 결정하는 지수
  const const_a = targetMaxStat / Math.pow(maxLvl, exponent);

  const currentTotal = const_a * Math.pow(lvl, exponent);
  const nextTotal = const_a * Math.pow(lvl + 1, exponent);
  const statGain = nextTotal - currentTotal;

  return {
    successRate: Number(Math.max(0.001, successRate).toFixed(4)),
    statGain: Number(statGain.toFixed(2)),
    totalStat: Number(currentTotal.toFixed(2))
  };
}

const minWinRate = 0.05;
const maxWinRate = 0.95;

/**
 * 강화 로직 스탯 곡선 기반 최적의 보정변수 n 계산
 * @param {number} targetLevel - 정확한 softcap이 적용되는 레벨
 * @param {number} targetWinRate - softcap일때의 확률
 * @returns {number} 로지스틱 기반 승률 함수용 보정변수 n
 */
function calculateFixedVar(targetLevel, targetWinRate) {
    // 1. 목표 레벨과 특정 하위 지점의 스탯 차이 가져오기
    const targetStat = getEnhanceData(targetLevel).totalStat;
    const compareStat = getEnhanceData(targetLevel - 5).totalStat;
    const statDiff = targetStat - compareStat; // 실제 스택 차이 (D)

    // 2. 로지스틱 역함수를 통해 보정변수 n 도출
    // P = minWinRate + (maxWinRate - minWinRate) * sigmoid(n * D)
    const intermediate = ((maxWinRate - minWinRate) / (targetWinRate - minWinRate)) - 1;

    // n = -ln(intermediate) / D
    return -Math.log(intermediate) / statDiff;
}

// 10강과 15강 사이의 승률이 85%내외가 되도록 보정변수 설정
var n = calculateFixedVar(15, 0.85);

/**
 * 턴제 전투 승률 계산 함수
 * @param {number} myAtkStat - 현재 내 공격력 수치
 * @param {number} oppDefStat - 현재 상대방의 방어력 수치
 * @param {number} k - 난이도
 * @returns {number} 승률
 */
function calculateWinRate(myAtkStat, oppDefStat, k = 0) {
    const statDiff = myAtkStat - oppDefStat;

    const sigmoid = 1 / (1 + Math.exp(-n * (statDiff + k)));

    return Number((minWinRate + ((maxWinRate - minWinRate) * sigmoid)).toFixed(2));
}

myAtkStat = 13
oppDefStat = 12

console.log(calculateWinRate(getEnhanceData(myAtkStat).totalStat, getEnhanceData(oppDefStat).totalStat));