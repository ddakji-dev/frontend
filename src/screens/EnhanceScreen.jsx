const { useState: useStateEnh, useEffect: useEffectEnh } = React;

function EnhanceScreen() {
  const g = useGame();
  const [track, setTrack]     = useStateEnh('atk');
  const [preview, setPreview] = useStateEnh(null);
  const [result, setResult]   = useStateEnh(null);
  const [shaking, setShaking] = useStateEnh(false);
  const [tearing, setTearing] = useStateEnh(false);
  const [glowing, setGlowing] = useStateEnh(false);

  useEffectEnh(() => {
    if (!g.playerId) return;
    api.getEnhancePreview(g.playerId, track)
      .then(setPreview)
      .catch(console.error);
  }, [g.playerId, track, g.atkLvl, g.defLvl, g.paperScraps]);

  const isMax     = preview?.is_max    ?? false;
  const zone      = preview?.zone      ?? null;
  const canAfford = preview?.can_afford ?? false;

  const onEnhance = async () => {
    if (!zone || !canAfford) return;
    setShaking(true);
    setTimeout(() => setShaking(false), 480);
    try {
      const r = await g.enhance(track);
      setTimeout(() => {
        setResult({ ...r, track });
        if (r.outcome === 'success') {
          setGlowing(true);
          setTimeout(() => setGlowing(false), 1200);
        } else if (r.outcome === 'drop') {
          setTearing(true);
          setTimeout(() => setTearing(false), 900);
        }
        setTimeout(() => setResult(null), 1800);
      }, 200);
    } catch (e) { console.error('강화 실패:', e); }
  };

  return (
    <div className="enhance" data-screen-label="02 Enhance">
      <section className={`enhance-stage paper-grain ${shaking ? 'shake-screen' : ''}`}>
        <button className="btn btn-ghost" style={{ position: 'absolute', top: 24, left: 24 }} onClick={() => g.setScreen('lobby')}>← 로비</button>

        <div className="enh-identity">
          <div className="eyebrow">내 딱지</div>
          <div className="enh-identity-row">
            <h2 className="serif">{g.nickname || '제 0 호'}</h2>
            <span className="enh-tier-badge">{g.tier}</span>
          </div>
        </div>

        <div className="ddakji-slot">
          {glowing && (
            <div style={{ position: 'absolute', inset: -60, background: 'radial-gradient(circle, oklch(0.9 0.18 80 / 0.9), transparent 60%)', animation: 'pop 1200ms ease-out', pointerEvents: 'none' }} />
          )}
          <DdakjiCard size={260} seed={g.paletteSeed} atkLvl={g.atkLvl} defLvl={g.defLvl} damaged={tearing} showStats highlight={track === 'atk' ? 'paper' : 'coin'} />
        </div>

        {result && (
          <div className="enh-result">
            <div className={`enh-result-card outcome-${result.outcome}`}>
              <div className="label">
                {result.outcome === 'success' && '강화 성공'}
                {result.outcome === 'stay'    && '강화 유지'}
                {result.outcome === 'drop'    && '강화 하락'}
              </div>
              <div className="big serif">+{result.new_lvl}</div>
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
              <span className="track-glyph">재질 강화</span><span className="track-name">공격력</span>
            </button>
            <button className={`track-tab def ${track === 'def' ? 'active' : ''}`} onClick={() => setTrack('def')}>
              <span className="track-glyph">동전 강화</span><span className="track-name">방어력</span>
            </button>
          </div>
        </div>

        {!preview ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--ink-3)' }}>불러오는 중…</div>
        ) : isMax ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--ink-2)' }}>이미 만강(+20)에 도달했습니다.</div>
        ) : (
          <>
            <div className="enh-current-block">
              <div className="eyebrow" style={{ marginBottom: 8 }}>현재 강</div>
              <div className="enh-current-row">
                <div className="enh-current-num mono" style={{ color: track === 'atk' ? 'var(--jeok)' : 'var(--cheong)' }}>+{preview.current_lvl}</div>
                <div className="enh-current-arrow">→</div>
                <div className="enh-current-next mono">+{preview.next_lvl}</div>
              </div>
              <span className={`zone-pill zone-${zone.key}`} style={{ marginTop: 12 }}>
                <span className="dot" /> {zone.label} 구간
              </span>
            </div>

            <div className="enh-success-block">
              <div className="eyebrow">성공 확률</div>
              <div className="enh-success-num mono" style={{ color: track === 'atk' ? 'var(--jeok)' : 'var(--cheong)' }}>
                {Math.round(zone.success_rate * 100)}<span style={{ fontSize: 28, marginLeft: 2 }}>%</span>
              </div>
              <div className="enh-prob-bar" style={{ marginTop: 6 }}>
                <div className="enh-prob-seg seg-success" style={{ width: (zone.success_rate * 100) + '%', background: track === 'atk' ? 'var(--jeok)' : 'var(--cheong)' }} />
                <div className="enh-prob-seg seg-stay"    style={{ width: (zone.stay_rate    * 100) + '%' }} />
                <div className="enh-prob-seg seg-drop"    style={{ width: (zone.drop_rate    * 100) + '%' }} />
              </div>
              <div className="enh-prob-legend">
                <div className="prob-legend-row">
                  <span className="legend-dot success" style={{ background: track === 'atk' ? 'var(--jeok)' : 'var(--cheong)' }} />
                  <span className="legend-label">성공</span>
                  <span className="legend-val mono">{Math.round(zone.success_rate * 100)}%</span>
                </div>
                <div className="prob-legend-row">
                  <span className="legend-dot stay" />
                  <span className="legend-label">유지</span>
                  <span className="legend-val mono">{Math.round(zone.stay_rate * 100)}%</span>
                </div>
                <div className="prob-legend-row">
                  <span className="legend-dot drop" />
                  <span className="legend-label">하락 {zone.drop_amount > 0 ? `(−${zone.drop_amount}강)` : ''}</span>
                  <span className="legend-val mono">{Math.round(zone.drop_rate * 100)}%</span>
                </div>
              </div>
            </div>

            <button className={`btn btn-lg ${track === 'atk' ? 'btn-jeok' : 'btn-cheong'} enh-cta`} onClick={onEnhance} disabled={!canAfford} style={{ width: '100%' }}>
              <span>{!canAfford ? '종이 조각 부족' : '강화 시도'}</span>
              <span className="enh-cta-cost"><PaperScrapIcon size={16} /><span className="mono">{zone.cost}</span></span>
            </button>
          </>
        )}
      </section>
    </div>
  );
}
window.EnhanceScreen = EnhanceScreen;
