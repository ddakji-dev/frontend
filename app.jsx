// app.jsx — main router

function App() {
  const g = useGame();
  const [t, setTweak] = useTweaks(window.__TWEAK_DEFAULTS || {});
  const [tweaksOpen, setTweaksOpen] = useState(false);

  // Watch the DOM for the Tweaks panel coming/going. This is robust against
  // both standalone (window.parent === window) and host-iframe environments
  // where postMessage round-trips can behave differently.
  useEffect(() => {
    const check = () => setTweaksOpen(!!document.querySelector('.twk-panel'));
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

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

      {/* Floating Tweaks launcher — for deployed/standalone use */}
      {!tweaksOpen && (
        <button
          className="tweaks-launcher"
          onClick={() => {
            setTweaksOpen(true);
            window.postMessage({ type: '__activate_edit_mode' }, '*');
          }}
          aria-label="Tweaks 열기"
        >
          <span className="tweaks-launcher-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
              <path d="M11.49 3.17a1 1 0 0 0-1-.85h-1a1 1 0 0 0-1 .85l-.21 1.34a6.46 6.46 0 0 0-1.46.84l-1.27-.5a1 1 0 0 0-1.24.43l-.5.86a1 1 0 0 0 .21 1.27l1.02.9a6.46 6.46 0 0 0 0 1.7l-1.02.9a1 1 0 0 0-.21 1.27l.5.86a1 1 0 0 0 1.24.43l1.27-.5c.44.34.93.62 1.46.84l.21 1.34a1 1 0 0 0 1 .85h1a1 1 0 0 0 1-.85l.21-1.34c.53-.22 1.02-.5 1.46-.84l1.27.5a1 1 0 0 0 1.24-.43l.5-.86a1 1 0 0 0-.21-1.27l-1.02-.9a6.46 6.46 0 0 0 0-1.7l1.02-.9a1 1 0 0 0 .21-1.27l-.5-.86a1 1 0 0 0-1.24-.43l-1.27.5a6.46 6.46 0 0 0-1.46-.84l-.21-1.34ZM10 12.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/>
            </svg>
          </span>
          <span className="tweaks-launcher-label">Tweaks</span>
        </button>
      )}
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
