const { useState: useStateBattle, useEffect: useEffectBattle, useRef: useRefBattle } = React;

function BattleScreen() {
  const g = useGame();
  const [phase, setPhase]                   = useStateBattle('intro');
  const [turnNum, setTurnNum]               = useStateBattle(1);
  const [log, setLog]                       = useStateBattle([]);
  const [lastSwing, setLastSwing]           = useStateBattle(null);
  const [shaking, setShaking]               = useStateBattle(false);
  const [flashing, setFlashing]             = useStateBattle(false);
  const [showSwingResult, setShowSwingResult] = useStateBattle(false);
  const [finalResult, setFinalResult]       = useStateBattle(null);
  const [battleProbs, setBattleProbs]       = useStateBattle(null);
  const swinging = useRefBattle(false);

  const opp = g.currentOpponent;

  useEffectBattle(() => {
    if (!g.playerId || !opp) return;
    api.getBattleProbs(g.playerId, turnNum)
      .then(setBattleProbs)
      .catch(console.error);
  }, [g.playerId, turnNum, opp && opp.id]);

  if (!opp) {
    return (
      <div style={{ padding: 40 }}>
        <button className="btn" onClick={() => g.setScreen('lobby')}>로비로 돌아가기</button>
      </div>
    );
  }

  const playerHitProb = battleProbs?.player_hit_prob ?? null;
  const oppHitProb    = battleProbs?.opp_hit_prob    ?? null;
  const momentum      = battleProbs?.momentum        ?? 0;

  const startBattle = () => {
    setPhase('player-turn');
    setTurnNum(1);
    setLog([]);
    setLastSwing(null);
  };

  const doSwing = async (actor) => {
    if (swinging.current) return;
    swinging.current = true;
    let hit, prob;
    try {
      const res = await api.battleSwing(g.playerId, actor, turnNum);
      hit = res.hit; prob = res.prob;
    } catch (e) {
      console.error('swing error:', e);
      swinging.current = false;
      return;
    }

    setLastSwing({ actor, hit, prob });
    setShowSwingResult(false);
    setPhase(actor === 'me' ? 'player-swinging' : 'npc-swinging');

    setTimeout(() => {
      setFlashing(true);
      setShaking(true);
      setShowSwingResult(true);
      setTimeout(() => setShaking(false), hit ? 520 : 280);
      setTimeout(() => setFlashing(false), hit ? 900 : 500);
    }, 880);

    setTimeout(async () => {
      setLog(l => [...l, { actor, hit, prob, turn: turnNum }]);
      if (hit) {
        const win = actor === 'me';
        try {
          const r = await g.completeBattle(win);
          setFinalResult({ win, turns: turnNum, gained: r.gained });
        } catch (e) { console.error('completeBattle error:', e); }
        setPhase('result');
      } else {
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
      swinging.current = false;
    }, 2100);
  };

  const newOpponent = async () => {
    setFinalResult(null); setLog([]); setTurnNum(1);
    setLastSwing(null); setShowSwingResult(false); setBattleProbs(null);
    setPhase('intro');
    await g.advanceOpponent();
  };

  const winToLobby = async () => { await g.advanceOpponent(); g.setScreen('lobby'); };

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
          {phase === 'intro' && <button className="btn btn-ghost" onClick={() => g.setScreen('lobby')}>← 로비</button>}
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

      <div className="turn-indicator">
        <div className="turn-num mono">{turnNum}<span style={{ fontSize: 13, marginLeft: 4, color: 'var(--ink-2)' }}>턴</span></div>
        <div className="turn-actor">
          {phase === 'intro' && <span style={{ color: 'var(--ink-2)' }}>대결 시작 대기 중</span>}
          {(phase === 'player-turn' || phase === 'player-swinging') && (<><span className="turn-dot me" /> <span>내 차례</span></>)}
          {(phase === 'npc-turn'   || phase === 'npc-swinging')    && (<><span className="turn-dot opp" /> <span>{opp.name}의 차례</span></>)}
          {phase === 'result' && <span style={{ color: 'var(--ink-2)' }}>대결 종료</span>}
        </div>
        <div className="turn-warning">패배 시 종이 조각·강화 모두 초기화</div>
      </div>

      <div className={`battle-arena paper-grain ${shaking ? 'shake-screen' : ''}`}>
        {flashing && (<>
          <div className="collision-flash" />
          <div className="impact-ring" /><div className="impact-ring second" />
          <div className="impact-burst-lines"><span /><span /></div>
          <div className="paper-particles">{Array.from({ length: 12 }).map((_, i) => <span key={i} />)}</div>
          <div className={`impact-word ${lastSwing?.hit ? '' : 'miss'}`}>{lastSwing?.hit ? '딱!' : '슉…'}</div>
        </>)}

        <div className="battle-side left">
          <div className="battle-tag">나</div>
          <div className="battle-name serif">{g.nickname || '제 0 호'}</div>
          <div className={playerClass}><DdakjiCard size={200} seed={g.paletteSeed} atkLvl={g.atkLvl} defLvl={g.defLvl} showStats /></div>
          <div className="battle-stats">
            <div className="battle-stat"><div className="n atk mono">{g.eff.atk}</div><div className="l">공격</div><div className="sub mono">+{g.atkLvl}재질</div></div>
            <div className="battle-stat"><div className="n def mono">{g.eff.def}</div><div className="l">방어</div><div className="sub mono">+{g.defLvl}동전</div></div>
          </div>
        </div>

        <div className="vs-block">
          <div className="vs-glyph">VS</div>
          <div className="hit-prob-display">
            {playerHitProb === null ? (
              <div style={{ color: 'var(--ink-3)', fontSize: 12, textAlign: 'center', padding: 8 }}>불러오는 중…</div>
            ) : (<>
              <div className="hit-prob-row">
                <span className="hit-prob-label">내 공격 명중</span>
                <span className="hit-prob-val small mono" style={{ color: 'var(--jeok)' }}>{playerHitProb}%</span>
              </div>
              <div className="hit-prob-bar"><div className="hit-prob-fill atk" style={{ width: playerHitProb + '%' }} /></div>
              <div className="hit-prob-row" style={{ marginTop: 10 }}>
                <span className="hit-prob-label">상대 공격 명중</span>
                <span className="hit-prob-val small mono" style={{ color: 'var(--cheong)' }}>{oppHitProb}%</span>
              </div>
              <div className="hit-prob-bar"><div className="hit-prob-fill def" style={{ width: oppHitProb + '%' }} /></div>
              {momentum > 0 && <div className="momentum-tag"><span className="momentum-icon">⚡</span>기세 +{momentum}%p</div>}
            </>)}
          </div>
          {lastSwing && showSwingResult && (
            <div key={`${lastSwing.actor}-${log.length}`} className={`swing-result ${lastSwing.hit ? 'hit' : 'miss'}`}>
              {lastSwing.hit ? '뒤집기 성공!' : '빗나갔다'}
            </div>
          )}
        </div>

        <div className="battle-side right">
          <div className="battle-tag">
            상대
            {opp.order && <span className="battle-order mono">#{opp.order}/{opp.total}</span>}
            {opp.is_final && <span className="battle-boss-tag">최강 보스</span>}
          </div>
          <div className={`battle-name serif ${opp.is_final ? 'boss-name' : ''}`}>{opp.name}</div>
          <div className={`battle-build-badge tone-${opp.build_tone}`}>
            <span className="build-glyph">{opp.build_glyph}</span>
            <span className="build-label">{opp.build_label}</span>
          </div>
          <div className={oppClass}><DdakjiCard size={200} seed={opp.palette_seed} atkLvl={opp.atk_lvl} defLvl={opp.def_lvl} showStats /></div>
          <div className="battle-stats">
            <div className="battle-stat"><div className="n atk mono">{opp.eff_atk}</div><div className="l">공격</div><div className="sub mono">+{opp.atk_lvl}재질</div></div>
            <div className="battle-stat"><div className="n def mono">{opp.eff_def}</div><div className="l">방어</div><div className="sub mono">+{opp.def_lvl}동전</div></div>
          </div>
        </div>
      </div>

      <div className="battle-cta">
        {phase === 'intro' && <button className="btn btn-primary btn-lg" onClick={startBattle}>대결 시작 →</button>}
        {phase === 'player-turn' && (
          <button className="btn btn-jeok btn-lg battle-swing-btn" onClick={() => phase === 'player-turn' && doSwing('me')}>
            <span style={{ fontFamily: "'Gowun Batang', serif", fontSize: 18 }}>딱!</span>
            <span>내려치기</span>
          </button>
        )}
        {phase === 'player-swinging' && <div className="battle-cta-waiting">…휘두르는 중</div>}
        {phase === 'npc-turn'        && <div className="battle-cta-waiting">{opp.name}이(가) 자세를 잡는다…</div>}
        {phase === 'npc-swinging'    && <div className="battle-cta-waiting" style={{ color: 'var(--cheong)' }}>{opp.name}의 일격!</div>}
      </div>

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

      {finalResult && phase === 'result' && (
        <BattleResultModal
          win={finalResult.win} turns={finalResult.turns} gained={finalResult.gained}
          opp={opp} nickname={g.nickname}
          onAgain={newOpponent} onLobby={winToLobby}
          onDefeatExit={() => { g.clearNickname(); g.setScreen('lobby'); }}
        />
      )}
    </div>
  );
}

window.BattleScreen = BattleScreen;

function BattleResultModal({ win, turns, gained, opp, nickname, onAgain, onLobby, onDefeatExit }) {
  return (
    <div className="battle-result">
      <div className="result-card">
        <div className={`result-stamp ${win ? 'win' : 'lose'}`}>{win ? '승리 · 뒤집기 성공' : '패배 · 뒤집기 실패'}</div>
        <div className="result-sub">
          {win ? `${turns}턴 만에 ${opp.name}의 딱지를 찢어 종이 조각으로.`
                : `${opp.name}이(가) ${nickname || '내 딱지'}을(를) 뒤집었다. (${turns}턴)`}
        </div>
        {win ? (
          <>
            <div className="result-reward result-reward-single">
              <PaperScrapIcon size={28} />
              <div className="item"><div className="n mono">+{gained}</div><div className="l">종이 조각 획득</div></div>
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
                  · 종이 조각 — 처음 상태(<span className="mono">250</span>)로 복귀
                </div>
              </div>
            </div>
            <div className="result-defeat-sub">새로운 종이를 꺼내 다시 접으세요.</div>
            <div className="result-actions" style={{ justifyContent: 'center' }}>
              <button className="btn btn-primary btn-lg" onClick={onDefeatExit}>메인으로 돌아가기 →</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
