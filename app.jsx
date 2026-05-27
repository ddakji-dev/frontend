// app.jsx — main router

function App() {
  const g = useGame();
  const [t, setTweak] = useTweaks(window.__TWEAK_DEFAULTS || {});

  // Apply theme tweaks
  useEffect(() => {
    const root = document.documentElement;
    if (t.paperWarmth === 'cool') {
      root.style.setProperty('--paper-1', 'oklch(0.93 0.012 240)');
      root.style.setProperty('--paper-0', 'oklch(0.96 0.008 240)');
      root.style.setProperty('--paper-2', 'oklch(0.89 0.014 240)');
      root.style.setProperty('--paper-3', 'oklch(0.83 0.018 240)');
      root.style.setProperty('--paper-line', 'oklch(0.78 0.02 240)');
    } else if (t.paperWarmth === 'warm') {
      root.style.setProperty('--paper-1', 'oklch(0.92 0.026 60)');
      root.style.setProperty('--paper-0', 'oklch(0.95 0.018 60)');
      root.style.setProperty('--paper-2', 'oklch(0.87 0.030 58)');
      root.style.setProperty('--paper-3', 'oklch(0.81 0.034 55)');
      root.style.setProperty('--paper-line', 'oklch(0.76 0.036 55)');
    } else {
      root.style.setProperty('--paper-1', 'oklch(0.93 0.018 80)');
      root.style.setProperty('--paper-0', 'oklch(0.96 0.012 80)');
      root.style.setProperty('--paper-2', 'oklch(0.89 0.022 78)');
      root.style.setProperty('--paper-3', 'oklch(0.83 0.028 75)');
      root.style.setProperty('--paper-line', 'oklch(0.78 0.03 72)');
    }

    if (t.accent === 'mono') {
      root.style.setProperty('--jeok', 'oklch(0.32 0.012 50)');
      root.style.setProperty('--cheong', 'oklch(0.55 0.012 50)');
      root.style.setProperty('--jeok-deep', 'oklch(0.22 0.012 50)');
      root.style.setProperty('--cheong-deep', 'oklch(0.42 0.012 50)');
    } else if (t.accent === 'forest') {
      root.style.setProperty('--jeok', 'oklch(0.50 0.15 30)');
      root.style.setProperty('--cheong', 'oklch(0.45 0.13 150)');
      root.style.setProperty('--jeok-deep', 'oklch(0.40 0.15 30)');
      root.style.setProperty('--cheong-deep', 'oklch(0.35 0.13 150)');
    } else {
      root.style.setProperty('--jeok', 'oklch(0.55 0.16 25)');
      root.style.setProperty('--cheong', 'oklch(0.55 0.14 240)');
      root.style.setProperty('--jeok-deep', 'oklch(0.42 0.16 25)');
      root.style.setProperty('--cheong-deep', 'oklch(0.42 0.14 240)');
    }
  }, [t.paperWarmth, t.accent]);

  let body;
  if (!g.nickname) body = <NicknameModal />;
  else if (g.screen === 'lobby') body = <LobbyScreen />;
  else if (g.screen === 'enhance') body = <EnhanceScreen />;
  else if (g.screen === 'battle') body = <BattleScreen />;
  else body = <LobbyScreen />;

  return (
    <div className="app">
      {g.screen !== 'battle' && g.nickname && (
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">딱지치기</div>
          </div>
          <nav className="nav-tabs">
            <button className={`nav-tab ${g.screen === 'lobby' ? 'active' : ''}`} onClick={() => g.setScreen('lobby')}>로비</button>
            <button className={`nav-tab ${g.screen === 'enhance' ? 'active' : ''}`} onClick={() => g.setScreen('enhance')}>강화</button>
            <button className={`nav-tab ${g.screen === 'battle' ? 'active' : ''}`} onClick={() => { if (!g.currentOpponent) g.summonOpponent(); g.setScreen('battle'); }}>대결</button>
          </nav>
          <div className="top-actions">
            <div className="scrap-counter">
              <span className="scrap-icon"><PaperScrapIcon /></span>
              <span className="scrap-num">{g.paperScraps}</span>
              <span className="scrap-label">종이 조각</span>
            </div>
          </div>
        </header>
      )}

      <div className="stage">
        {body}
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="용지 톤" />
        <TweakRadio
          label="베이지"
          value={t.paperWarmth}
          options={[
            { label: '기본', value: 'default' },
            { label: '따뜻', value: 'warm' },
            { label: '서늘', value: 'cool' },
          ]}
          onChange={(v) => setTweak('paperWarmth', v)}
        />

        <TweakSection label="액센트 팔레트" />
        <TweakRadio
          label="단청"
          value={t.accent}
          options={[
            { label: '적·청', value: 'default' },
            { label: '먹빛', value: 'mono' },
            { label: '솔향', value: 'forest' },
          ]}
          onChange={(v) => setTweak('accent', v)}
        />

        <TweakSection label="테스트" />
        <TweakButton label="종이 조각 +500" onClick={() => g.addScraps(500)} />
      </TweaksPanel>
    </div>
  );
}

// Persistent tweak defaults
window.__TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "paperWarmth": "default",
  "accent": "default"
}/*EDITMODE-END*/;

// Mount
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GameProvider>
    <App />
  </GameProvider>
);
