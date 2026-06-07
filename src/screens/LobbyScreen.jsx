function LobbyScreen() {
  const g = useGame();

  const handleBattle = async () => {
    await g.summonOpponent();
    g.setScreen('battle');
  };

  return (
    <div className="lobby-arcade paper-grain" data-screen-label="01 Lobby">
      <div className="lobby-deco">
        <span className="deco-mini-ddakji m1" />
        <span className="deco-mini-ddakji m2" />
        <span className="deco-mini-ddakji m3" />
        <span className="deco-mini-ddakji m4" />
      </div>

      <div className="lobby-arcade-title">
        <div className="lobby-stamp">
          <span className="lobby-stamp-text">한 판 승부</span>
        </div>
        <h1 className="lobby-headline">딱지치기</h1>
        <div className="lobby-subline"></div>
      </div>

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

      <div className="lobby-arcade-actions">
        <div className="arcade-btn-wrap">
          <button className="arcade-btn arcade-btn-primary" onClick={handleBattle}>
            <span className="arcade-btn-stamp">⚔️</span>
            <span className="arcade-btn-text">
              <span className="arcade-btn-title">딱지치기</span>
              <span className="arcade-btn-sub">NPC와 한 판 붙기, 승리 후 종이 조각 획득</span>
            </span>
            <span className="arcade-btn-arrow">→</span>
          </button>
          <ButtonPreview
            side="left"
            src="assets/preview-battle.png"
            title="딱지치기"
            desc="NPC와 턴제로 맞붙어 상대 딱지를 뒤집습니다. 명중에 성공하면 승리한 뒤 [종이 조각]을 얻게 되고, 패배하면 모든 진행이 초기화됩니다."
            tags={['턴제 대결', '확률', '보스 16명']}
            placeholderGlyph="⚔"
          />
        </div>

        <div className="arcade-btn-wrap">
          <button className="arcade-btn" onClick={() => g.setScreen('enhance')}>
            <span className="arcade-btn-stamp atelier">🔨</span>
            <span className="arcade-btn-text">
              <span className="arcade-btn-title">딱지 강화하기</span>
              <span className="arcade-btn-sub">종이 조각으로 딱지 강화</span>
            </span>
            <span className="arcade-btn-arrow">→</span>
          </button>
          <ButtonPreview
            side="right"
            src="assets/preview-enhance.png"
            title="딱지 강화하기"
            desc="종이 조각을 사용해 재질과 동전을 강화합니다. [재질]을 강화하면 공격력이, [동전]을 강화하면 방어력이 올라갑니다."
            tags={['재질·동전', '확률 강화', '성공·유지·하락']}
            placeholderGlyph="🔨"
          />
        </div>
      </div>
    </div>
  );
}
function ButtonPreview({ side, src, title, desc, tags = [], placeholderGlyph = '?' }) {
  const [imgOk, setImgOk] = React.useState(true);
  return (
    <div className={`btn-preview ${side}`} role="tooltip">
      <div className="btn-preview-shot">
        {imgOk ? (
          <img src={src} alt={`${title} 미리보기`} onError={() => setImgOk(false)} />
        ) : (
          <div className="btn-preview-placeholder">
            <span className="bp-glyph serif">{placeholderGlyph}</span>
            <span className="bp-hint">{src}</span>
          </div>
        )}
      </div>
      <div className="btn-preview-body">
        <div className="btn-preview-title serif">{title}</div>
        <div className="btn-preview-desc">{desc}</div>
        {tags.length > 0 && (
          <div className="btn-preview-tags">
            {tags.map((t, i) => <span key={i} className="bp-tag">{t}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

window.LobbyScreen = LobbyScreen;
