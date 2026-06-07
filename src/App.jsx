function App() {
  const g = useGame();

  if (g.loading) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--ink-2)', fontFamily: "'Gowun Batang', serif", fontSize: 18 }}>불러오는 중…</span>
      </div>
    );
  }

  let body;
  if (!g.nickname)               body = <NicknameModal />;
  else if (g.screen === 'lobby') body = <LobbyScreen />;
  else if (g.screen === 'enhance') body = <EnhanceScreen />;
  else if (g.screen === 'battle') body = <BattleScreen />;
  else                           body = <LobbyScreen />;

  return (
    <div className="app">
      {g.screen !== 'battle' && g.nickname && (
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">딱지치기</div>
          </div>
          <nav className="nav-tabs">
            <button className={`nav-tab ${g.screen === 'lobby'   ? 'active' : ''}`} onClick={() => g.setScreen('lobby')}>로비</button>
            <button className={`nav-tab ${g.screen === 'enhance' ? 'active' : ''}`} onClick={() => g.setScreen('enhance')}>강화</button>
            <button
              className={`nav-tab ${g.screen === 'battle' ? 'active' : ''}`}
              onClick={async () => { await g.summonOpponent(); g.setScreen('battle'); }}
            >대결</button>
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
      <div className="stage">{body}</div>
    </div>
  );
}

// 앱 마운트
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GameProvider>
    <App />
  </GameProvider>
);
