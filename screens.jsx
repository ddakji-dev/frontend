// screens.jsx — Lobby / Enhance / Battle / Collection

// =========================================================================
// Nickname modal — shown when player has no ddakji name
// =========================================================================
function NicknameModal() {
  const g = useGame();
  const [name, setName] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // autofocus shortly after mount so it lands after the modal animates in
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  const trimmed = name.trim();
  const valid = trimmed.length >= 1 && trimmed.length <= 12;

  const submit = () => {
    if (!valid) {
      setShake(true);
      setTimeout(() => setShake(false), 480);
      return;
    }
    g.setNickname(trimmed);
  };

  const onKey = (e) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <div className="nickname-modal-bg paper-grain">
      <div className={`nickname-modal ${shake ? 'shake-screen' : ''}`}>
        <div className="eyebrow" style={{ textAlign: 'center', letterSpacing: '0.3em' }}>새로운 딱지</div>

        <div className="nickname-ddakji">
          <div className="ddakji-glow" />
          <DdakjiCard size={180} seed={g.paletteSeed} atkLvl={0} defLvl={0} />
          {trimmed && (
            <div className="nickname-preview-label serif">{trimmed}</div>
          )}
        </div>

        <div className="nickname-prompt">
          <h2 className="serif">딱지 접기</h2>
          <p>새로운 딱지에 붙을 닉네임을 정해주세요.<br/>패배하면 딱지와 함께 사라집니다.</p>
        </div>

        <div className="nickname-input-row">
          <input
            ref={inputRef}
            className="nickname-input serif"
            type="text"
            placeholder="딱지 이름"
            maxLength={12}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onKey}
          />
          <div className="nickname-counter mono">{trimmed.length} / 12</div>
        </div>

        <button
          className="btn btn-primary btn-lg"
          onClick={submit}
          disabled={!valid}
          style={{ width: '100%' }}
        >
          이름 새기고 시작하기 →
        </button>
      </div>
    </div>
  );
}

// =========================================================================
// Shared: Bidirectional StatBar
// =========================================================================
function BidirectionalStatBar({ atk, def, max = 65 }) {
  const atkPct = Math.min(100, (atk / max) * 100);
  const defPct = Math.min(100, (def / max) * 100);
  return (
    <div className="statbar">
      <div className="statbar-half left">
        <div className="statbar-fill def" style={{ width: defPct + '%' }} />
        {def > 6 && <span className="statbar-value mono">{def}</span>}
      </div>
      <div className="statbar-half right">
        <div className="statbar-fill atk" style={{ width: atkPct + '%' }} />
        {atk > 6 && <span className="statbar-value mono">{atk}</span>}
      </div>
      <div className="statbar-axis" />
    </div>
  );
}

// =========================================================================
// Lobby — game-y arcade-poster vibe
// =========================================================================
function LobbyScreen() {
  const g = useGame();

  return (
    <div className="lobby-arcade paper-grain" data-screen-label="01 Lobby">
      {/* Decorative scattered onomatopoeia + mini ddakji */}
      <div className="lobby-deco">
        {/* <span className="deco-word w1">딱!</span>
        <span className="deco-word w2">쾅</span>
        <span className="deco-word w3">슉...</span>
        <span className="deco-word w4">탁!</span>
        <span className="deco-word w5">꽝!</span> */}
        <span className="deco-mini-ddakji m1" />
        <span className="deco-mini-ddakji m2" />
        <span className="deco-mini-ddakji m3" />
        <span className="deco-mini-ddakji m4" />
      </div>

      {/* Title block */}
      <div className="lobby-arcade-title">
        <div className="lobby-stamp">
          <span className="lobby-stamp-text">한 판 승부</span>
        </div>
        <h1 className="lobby-headline">딱지치기</h1>
        <div className="lobby-subline">
        </div>
      </div>

      {/* Ddakji with radiating energy */}
      <div className="lobby-arcade-ddakji">
        <div className="energy-burst">
          <span /><span /><span /><span />
          <span /><span /><span /><span />
        </div>
        <div className="ddakji-float">
          <DdakjiCard size={240} seed={g.paletteSeed} atkLvl={g.atkLvl} defLvl={g.defLvl} />
        </div>
        {g.nickname && (
          <div className="lobby-name-banner serif">
            <span className="banner-tape" />
            <span className="banner-text">{g.nickname}</span>
            <span className="banner-tape right" />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="lobby-arcade-actions">
        <button className="arcade-btn arcade-btn-primary" onClick={() => { g.summonOpponent(); g.setScreen('battle'); }}>
          <span className="arcade-btn-stamp">⚔️</span>
          <span className="arcade-btn-text">
            <span className="arcade-btn-title">딱지치기</span>
            <span className="arcade-btn-sub">NPC와 한 판 붙기, 승리 후 종이 조각 획득</span>
          </span>
          <span className="arcade-btn-arrow">→</span>
        </button>

        <button className="arcade-btn" onClick={() => g.setScreen('enhance')}>
          <span className="arcade-btn-stamp atelier">🔨</span>
          <span className="arcade-btn-text">
            <span className="arcade-btn-title">딱지 강화하기</span>
            <span className="arcade-btn-sub">종이 조각으로 딱지 강화</span>
          </span>
          <span className="arcade-btn-arrow">→</span>
        </button>
      </div>
    </div>
  );
}

// =========================================================================
// Enhance screen
// =========================================================================
function EnhanceScreen() {
  const g = useGame();
  const [track, setTrack] = useState('atk');
  const [result, setResult] = useState(null); // {success, drop, oldLvl, newLvl, zone}
  const [shaking, setShaking] = useState(false);
  const [tearing, setTearing] = useState(false);
  const [glowing, setGlowing] = useState(false);

  const currentLvl = track === 'atk' ? g.atkLvl : g.defLvl;
  const nextLvl = currentLvl + 1;
  const isMax = currentLvl >= 20;
  const zone = isMax ? null : zoneOfNextLevel(nextLvl);

  // Preview effective stats after success
  const previewAtk = track === 'atk' ? g.atkLvl + 1 : g.atkLvl;
  const previewDef = track === 'def' ? g.defLvl + 1 : g.defLvl;
  const previewEff = effectiveStats(previewAtk, previewDef);

  const canAfford = zone && g.paperScraps >= zone.cost;

  const onEnhance = () => {
    if (!zone || !canAfford) return;
    setShaking(true);
    setTimeout(() => setShaking(false), 480);

    const r = g.enhance(track);
    if (!r.ok) return;
    setTimeout(() => {
      setResult({ ...r, track });
      if (r.outcome === 'success') {
        setGlowing(true);
        setTimeout(() => setGlowing(false), 1200);
      } else if (r.outcome === 'drop') {
        setTearing(true);
        setTimeout(() => setTearing(false), 900);
      }
      // 'stay' — no special effect (only shake from earlier)
      setTimeout(() => setResult(null), 1800);
    }, 200);
  };

  return (
    <div className="enhance" data-screen-label="02 Enhance">
      <section className={`enhance-stage paper-grain ${shaking ? 'shake-screen' : ''}`}>
        <button className="btn btn-ghost" style={{ position: 'absolute', top: 24, left: 24 }} onClick={() => g.setScreen('lobby')}>← 로비</button>

        <div className="enh-identity">
          <div className="eyebrow">내 딱지</div>
          <div className="enh-identity-row">
            <h2 className="serif">{g.nickname || '제 0 호'}</h2>
            <span className="enh-tier-badge">{tierOf(g.atkLvl, g.defLvl)}</span>
          </div>
        </div>

        <div className="ddakji-slot">
          {glowing && (
            <div style={{
              position: 'absolute',
              inset: -60,
              background: 'radial-gradient(circle, oklch(0.9 0.18 80 / 0.9), transparent 60%)',
              animation: 'pop 1200ms ease-out',
              pointerEvents: 'none',
            }} />
          )}
          <DdakjiCard size={260} seed={g.paletteSeed} atkLvl={g.atkLvl} defLvl={g.defLvl} damaged={tearing} showStats highlight={track === 'atk' ? 'paper' : 'coin'} />
        </div>

        {/* Result overlay */}
        {result && (
          <div className="enh-result">
            <div className={`enh-result-card outcome-${result.outcome}`}>
              <div className="label">
                {result.outcome === 'success' && '강화 성공'}
                {result.outcome === 'stay'    && '강화 유지'}
                {result.outcome === 'drop'    && '강화 하락'}
              </div>
              <div className="big serif">+{result.newLvl}</div>
              <div className="delta">
                {result.outcome === 'success' && `${result.track === 'atk' ? '종이 재질' : '동전'} 강화 성공`}
                {result.outcome === 'stay'    && `${result.track === 'atk' ? '재질' : '동전'} 강화 그대로 유지`}
                {result.outcome === 'drop'    && `${result.track === 'atk' ? '재질' : '동전'} −${result.drop}강 하락`}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="enhance-panel scroll-y">
        <div>
          <div className="eyebrow">강화 종류</div>
          <div className="track-tabs" style={{ marginTop: 10 }}>
            <button className={`track-tab atk ${track === 'atk' ? 'active' : ''}`} onClick={() => setTrack('atk')}>
              <span className="track-glyph">재질 강화</span>
              <span className="track-name">공격력</span>
            </button>
            <button className={`track-tab def ${track === 'def' ? 'active' : ''}`} onClick={() => setTrack('def')}>
              <span className="track-glyph">동전 강화</span>
              <span className="track-name">방어력</span>
            </button>
          </div>
        </div>

        {isMax ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--ink-2)' }}>이미 만강(+20)에 도달했습니다.</div>
        ) : (
          <>
            {/* Current level — big */}
            <div className="enh-current-block">
              <div className="eyebrow" style={{ marginBottom: 8 }}>현재 강</div>
              <div className="enh-current-row">
                <div className="enh-current-num mono" style={{ color: track === 'atk' ? 'var(--jeok)' : 'var(--cheong)' }}>
                  +{currentLvl}
                </div>
                <div className="enh-current-arrow">→</div>
                <div className="enh-current-next mono">
                  +{nextLvl}
                </div>
              </div>
              <span className={`zone-pill zone-${zone.key}`} style={{ marginTop: 12 }}>
                <span className="dot" /> {zone.label} 구간
              </span>
            </div>

            {/* Success rate — big + breakdown */}
            <div className="enh-success-block">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div className="eyebrow">성공 확률</div>
              </div>
              <div className="enh-success-num mono" style={{ color: track === 'atk' ? 'var(--jeok)' : 'var(--cheong)' }}>
                {Math.round(zone.successRate * 100)}<span style={{ fontSize: 28, marginLeft: 2 }}>%</span>
              </div>

              {/* Segmented probability bar: 성공 / 유지 / 하락 */}
              <div className="enh-prob-bar" style={{ marginTop: 6 }}>
                <div
                  className="enh-prob-seg seg-success"
                  style={{ width: (zone.successRate * 100) + '%', background: track === 'atk' ? 'var(--jeok)' : 'var(--cheong)' }}
                  title={`성공 ${Math.round(zone.successRate * 100)}%`}
                />
                <div
                  className="enh-prob-seg seg-stay"
                  style={{ width: (zone.stayRate * 100) + '%' }}
                  title={`유지 ${Math.round(zone.stayRate * 100)}%`}
                />
                <div
                  className="enh-prob-seg seg-drop"
                  style={{ width: (zone.dropRate * 100) + '%' }}
                  title={`하락 ${Math.round(zone.dropRate * 100)}%`}
                />
              </div>

              <div className="enh-prob-legend">
                <div className="prob-legend-row">
                  <span className="legend-dot success" style={{ background: track === 'atk' ? 'var(--jeok)' : 'var(--cheong)' }} />
                  <span className="legend-label">성공</span>
                  <span className="legend-val mono">{Math.round(zone.successRate * 100)}%</span>
                </div>
                <div className="prob-legend-row">
                  <span className="legend-dot stay" />
                  <span className="legend-label">유지</span>
                  <span className="legend-val mono">{Math.round(zone.stayRate * 100)}%</span>
                </div>
                <div className="prob-legend-row">
                  <span className="legend-dot drop" />
                  <span className="legend-label">하락 {zone.dropAmount > 0 ? `(−${zone.dropAmount}강)` : ''}</span>
                  <span className="legend-val mono">{Math.round(zone.dropRate * 100)}%</span>
                </div>
              </div>
            </div>

            <button
              className={`btn btn-lg ${track === 'atk' ? 'btn-jeok' : 'btn-cheong'} enh-cta`}
              onClick={onEnhance}
              disabled={!canAfford}
              style={{ width: '100%' }}
            >
              <span>{!canAfford ? '종이 조각 부족' : '강화 시도'}</span>
              <span className="enh-cta-cost">
                <PaperScrapIcon size={16}/>
                <span className="mono">{zone.cost}</span>
              </span>
            </button>
          </>
        )}
      </section>
    </div>
  );
}

// =========================================================================
// Battle screen — turn-based
// =========================================================================
function BattleScreen() {
  const g = useGame();
  const [phase, setPhase] = useState('intro'); // intro, player-turn, player-swinging, npc-turn, npc-swinging, result
  const [turnNum, setTurnNum] = useState(1);
  const [log, setLog] = useState([]);
  const [lastSwing, setLastSwing] = useState(null); // {actor, hit, prob}
  const [shaking, setShaking] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [showSwingResult, setShowSwingResult] = useState(false);
  const [finalResult, setFinalResult] = useState(null);

  const opp = g.currentOpponent;
  if (!opp) {
    return (
      <div style={{ padding: 40 }}>
        <button className="btn" onClick={() => g.setScreen('lobby')}>로비로 돌아가기</button>
      </div>
    );
  }

  const playerHitProb = winProbability(g.eff.atk, opp.effDef);
  const oppHitProb    = winProbability(opp.effAtk, g.eff.def);

  const startBattle = () => {
    setPhase('player-turn');
    setTurnNum(1);
    setLog([]);
    setLastSwing(null);
  };

  const doSwing = (actor) => {
    const prob = actor === 'me' ? playerHitProb : oppHitProb;
    const hit = Math.random() * 100 < prob;
    setLastSwing({ actor, hit, prob });
    setShowSwingResult(false);
    setPhase(actor === 'me' ? 'player-swinging' : 'npc-swinging');

    // Impact moment around 880ms (matches slam keyframe 64% of 1400ms)
    setTimeout(() => {
      setFlashing(true);
      setShaking(true);
      setShowSwingResult(true);
      setTimeout(() => setShaking(false), hit ? 520 : 280);
      setTimeout(() => setFlashing(false), hit ? 900 : 500);
    }, 880);

    // Resolve outcome after flip/wobble animation finishes (~2100ms)
    setTimeout(() => {
      setLog(l => [...l, { actor, hit, prob, turn: turnNum }]);
      if (hit) {
        const win = actor === 'me';
        const r = g.completeBattle(win, opp);
        setFinalResult({ win, turns: turnNum, gained: r.gained });
        setPhase('result');
      } else {
        // Miss — pass turn
        setLastSwing(null);
        setShowSwingResult(false);
        if (actor === 'me') {
          setPhase('npc-turn');
          setTimeout(() => doSwing('opp'), 900);
        } else {
          setTurnNum(t => t + 1);
          setPhase('player-turn');
        }
      }
    }, 2100);
  };

  const playerSwing = () => {
    if (phase !== 'player-turn') return;
    doSwing('me');
  };

  const newOpponent = () => {
    setFinalResult(null);
    setLog([]);
    setTurnNum(1);
    setLastSwing(null);
    setShowSwingResult(false);
    setPhase('intro');
    g.summonOpponent();
  };

  // Animation class resolution
  const playerClass = (() => {
    if (phase === 'player-swinging') return 'dd-swing-r';
    if (phase === 'npc-swinging' && lastSwing?.hit) return 'dd-flipped';
    if (phase === 'npc-swinging') return 'dd-wobble';
    if (phase === 'intro') return 'dd-slide-in-left';
    return '';
  })();

  const oppClass = (() => {
    if (phase === 'npc-swinging') return 'dd-swing-l';
    if (phase === 'player-swinging' && lastSwing?.hit) return 'dd-flipped';
    if (phase === 'player-swinging') return 'dd-wobble';
    if (phase === 'intro') return 'dd-slide-in-right';
    return '';
  })();

  return (
    <div className="battle" data-screen-label="03 Battle">
      <div className="topbar topbar-battle" style={{ borderBottom: '1px solid var(--paper-line)' }}>
        <div className="topbar-left">
          <button className="btn btn-ghost" onClick={() => g.setScreen('lobby')}>← 로비</button>
        </div>
        <div className="serif topbar-title" style={{ fontSize: 18 }}>대결장</div>
        <div className="topbar-right">
          <div className="scrap-counter">
            <span className="scrap-icon"><PaperScrapIcon /></span>
            <span className="scrap-num">{g.paperScraps}</span>
            <span className="scrap-label">조각</span>
          </div>
        </div>
      </div>

      {/* Turn indicator */}
      <div className="turn-indicator">
        <div className="turn-num mono">{turnNum}<span style={{ fontSize: 13, marginLeft: 4, color: 'var(--ink-2)' }}>턴</span></div>
        <div className="turn-actor">
          {phase === 'intro' && <span style={{ color: 'var(--ink-2)' }}>대결 시작 대기 중</span>}
          {(phase === 'player-turn' || phase === 'player-swinging') && (
            <><span className="turn-dot me" /> <span>내 차례</span></>
          )}
          {(phase === 'npc-turn' || phase === 'npc-swinging') && (
            <><span className="turn-dot opp" /> <span>{opp.name}의 차례</span></>
          )}
          {phase === 'result' && <span style={{ color: 'var(--ink-2)' }}>대결 종료</span>}
        </div>
        <div className="turn-warning">패배 시 종이 조각·강화 모두 초기화</div>
      </div>

      <div className={`battle-arena paper-grain ${shaking ? 'shake-screen' : ''}`}>
        {flashing && (
          <>
            <div className="collision-flash" />
            <div className="impact-ring" />
            <div className="impact-ring second" />
            <div className="impact-burst-lines">
              <span /><span />
            </div>
            <div className="paper-particles">
              {Array.from({ length: 12 }).map((_, i) => <span key={i} />)}
            </div>
            <div className={`impact-word ${lastSwing?.hit ? '' : 'miss'}`}>
              {lastSwing?.hit ? '딱!' : '슉…'}
            </div>
          </>
        )}

        {/* Left = me */}
        <div className="battle-side left">
          <div className="battle-tag">나</div>
          <div className="battle-name serif">{g.nickname || '제 0 호'}</div>
          <div className={playerClass}>
            <DdakjiCard size={200} seed={g.paletteSeed} atkLvl={g.atkLvl} defLvl={g.defLvl} showStats />
          </div>
          <div className="battle-stats">
            <div className="battle-stat">
              <div className="n atk mono">{g.eff.atk}</div>
              <div className="l">공격</div>
              <div className="sub mono">+{g.atkLvl}재질</div>
            </div>
            <div className="battle-stat">
              <div className="n def mono">{g.eff.def}</div>
              <div className="l">방어</div>
              <div className="sub mono">+{g.defLvl}동전</div>
            </div>
          </div>
        </div>

        {/* Center: VS + asymmetric hit probabilities */}
        <div className="vs-block">
          <div className="vs-glyph">VS</div>
          <div className="hit-prob-display">
            <div className="hit-prob-row">
              <span className="hit-prob-label">내 공격 명중</span>
              <span className="hit-prob-val small mono" style={{ color: 'var(--jeok)' }}>{Math.round(playerHitProb)}%</span>
            </div>
            <div className="hit-prob-bar">
              <div className="hit-prob-fill atk" style={{ width: playerHitProb + '%' }} />
            </div>
            <div className="hit-prob-row" style={{ marginTop: 10 }}>
              <span className="hit-prob-label">상대 공격 명중</span>
              <span className="hit-prob-val small mono" style={{ color: 'var(--cheong)' }}>{Math.round(oppHitProb)}%</span>
            </div>
            <div className="hit-prob-bar">
              <div className="hit-prob-fill def" style={{ width: oppHitProb + '%' }} />
            </div>
          </div>

          {/* Swing result callout — only after impact */}
          {lastSwing && showSwingResult && (
            <div key={`${lastSwing.actor}-${log.length}`} className={`swing-result ${lastSwing.hit ? 'hit' : 'miss'}`}>
              {lastSwing.hit ? '뒤집기 성공!' : '빗나갔다'}
            </div>
          )}
        </div>

        {/* Right = opponent */}
        <div className="battle-side right">
          <div className="battle-tag">
            상대
            {opp.order && <span className="battle-order mono">#{opp.order}/{opp.total}</span>}
            {opp.isFinal && <span className="battle-boss-tag">최강 보스</span>}
          </div>
          <div className={`battle-name serif ${opp.isFinal ? 'boss-name' : ''}`}>{opp.name}</div>
          <div className={`battle-build-badge tone-${opp.buildTone}`}>
            <span className="build-glyph">{opp.buildGlyph}</span>
            <span className="build-label">{opp.buildLabel}</span>
          </div>
          <div className={oppClass}>
            <DdakjiCard size={200} seed={opp.paletteSeed} atkLvl={opp.atkLvl} defLvl={opp.defLvl} showStats />
          </div>
          <div className="battle-stats">
            <div className="battle-stat">
              <div className="n atk mono">{opp.effAtk}</div>
              <div className="l">공격</div>
              <div className="sub mono">+{opp.atkLvl}재질</div>
            </div>
            <div className="battle-stat">
              <div className="n def mono">{opp.effDef}</div>
              <div className="l">방어</div>
              <div className="sub mono">+{opp.defLvl}동전</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="battle-cta">
        {phase === 'intro' && (
          <button className="btn btn-primary btn-lg" onClick={startBattle}>
            대결 시작 →
          </button>
        )}
        {phase === 'player-turn' && (
          <button className="btn btn-jeok btn-lg battle-swing-btn" onClick={playerSwing}>
            <span style={{ fontFamily: "'Gowun Batang', serif", fontSize: 18 }}>딱!</span>
            <span>내려치기</span>
          </button>
        )}
        {phase === 'player-swinging' && (
          <div className="battle-cta-waiting">…휘두르는 중</div>
        )}
        {phase === 'npc-turn' && (
          <div className="battle-cta-waiting">{opp.name}이(가) 자세를 잡는다…</div>
        )}
        {phase === 'npc-swinging' && (
          <div className="battle-cta-waiting" style={{ color: 'var(--cheong)' }}>{opp.name}의 일격!</div>
        )}
      </div>

      {/* Turn log */}
      <div className="battle-turnlog">
        <span className="history-label">교환 기록</span>
        {log.length === 0 && <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>아직 한 차례도 휘두르지 않음</span>}
        {log.slice(-8).map((entry, i) => (
          <span key={i} className={`turnlog-pill ${entry.hit ? 'hit' : 'miss'} ${entry.actor}`}>
            <span className="mono">{entry.turn}T</span>
            <span>{entry.actor === 'me' ? '나' : '적'}</span>
            <span>{entry.hit ? '명중' : '빗나감'}</span>
          </span>
        ))}
      </div>

      {/* Result modal */}
      {finalResult && phase === 'result' && (
        <BattleResultModal
          win={finalResult.win}
          turns={finalResult.turns}
          gained={finalResult.gained}
          opp={opp}
          nickname={g.nickname}
          onAgain={newOpponent}
          onLobby={() => g.setScreen('lobby')}
          onDefeatExit={() => {
            // Loss path: clearing nickname triggers the NicknameModal
            // automatically once we leave the battle screen.
            g.clearNickname();
            g.setScreen('lobby');
          }}
        />
      )}
    </div>
  );
}

function BattleResultModal({ win, turns, gained, opp, nickname, onAgain, onLobby, onDefeatExit }) {
  return (
    <div className="battle-result">
      <div className="result-card">
        <div className={`result-stamp ${win ? 'win' : 'lose'}`}>
          {win ? '승리 · 뒤집기 성공' : '패배 · 뒤집기 실패'}
        </div>
        <div className="result-sub">
          {win
            ? `${turns}턴 만에 ${opp.name}의 딱지를 찢어 종이 조각으로.`
            : `${opp.name}이(가) ${nickname || '내 딱지'}을(를) 뒤집었다. (${turns}턴)`}
        </div>
        {win ? (
          <>
            <div className="result-reward result-reward-single">
              <PaperScrapIcon size={28} />
              <div className="item">
                <div className="n mono">+{gained}</div>
                <div className="l">종이 조각 획득</div>
              </div>
            </div>
            <div className="result-actions">
              <button className="btn btn-ghost" onClick={onLobby}>로비</button>
              <button className="btn btn-primary" onClick={onAgain}>다음 상대</button>
            </div>
          </>
        ) : (
          <>
            <div className="result-reset-warn">
              <div className="reset-warn-icon">⚠</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--ink-0)', fontSize: 15 }}>모든 진행이 초기화되었습니다</div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.6 }}>
                  · <strong className="serif" style={{ color: 'var(--ink-0)', fontWeight: 700 }}>{nickname || '제 0 호'}</strong> — 딱지와 함께 사라짐<br/>
                  · 재질 <span className="mono">+0</span> / 동전 <span className="mono">+0</span> 상태로 초기화<br/>
                  · 종이 조각 — 처음 상태(<span className="mono">120</span>)로 복귀
                </div>
              </div>
            </div>
            <div className="result-defeat-sub">
              새로운 종이를 꺼내 다시 접으세요.
            </div>
            <div className="result-actions" style={{ justifyContent: 'center' }}>
              <button className="btn btn-primary btn-lg" onClick={onDefeatExit}>메인으로 돌아가기 →</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, {
  BidirectionalStatBar,
  NicknameModal,
  LobbyScreen, EnhanceScreen, BattleScreen,
});
