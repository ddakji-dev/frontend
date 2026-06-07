const { createContext, useContext, useState, useEffect, useCallback } = React;

const GameContext = createContext(null);
const useGame = () => useContext(GameContext);

function GameProvider({ children }) {
  const [playerId, setPlayerId] = useState(() => localStorage.getItem('ddakji_player_id'));
  const [player, setPlayer]     = useState(null);
  const [screen, setScreen]     = useState('lobby');
  const [currentOpponent, setCurrentOpponent] = useState(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!playerId) return;
    setLoading(true);
    api.getPlayer(playerId)
      .then(({ player: p, opponent }) => {
        setPlayer(p);
        setCurrentOpponent(opponent);
      })
      .catch(() => {
        localStorage.removeItem('ddakji_player_id');
        setPlayerId(null);
      })
      .finally(() => setLoading(false));
  }, [playerId]);

  const submitNickname = useCallback(async (nickname) => {
    if (playerId) {
      const { player: p } = await api.renamePlayer(playerId, nickname);
      setPlayer(p);
    } else {
      const { player: p, opponent } = await api.createPlayer(nickname);
      localStorage.setItem('ddakji_player_id', p.player_id);
      setPlayerId(p.player_id);
      setPlayer(p);
      setCurrentOpponent(opponent);
    }
  }, [playerId]);

  const enhance = useCallback(async (track) => {
    if (!playerId) return { ok: false };
    const result = await api.enhance(playerId, track);
    setPlayer(result.player);
    return result;
  }, [playerId]);

  const summonOpponent = useCallback(async () => {
    if (currentOpponent) return currentOpponent;
    const { opponent } = await api.getOpponent(playerId);
    setCurrentOpponent(opponent);
    return opponent;
  }, [playerId, currentOpponent]);

  const advanceOpponent = useCallback(async () => {
    const { opponent } = await api.advanceOpponent(playerId);
    setCurrentOpponent(opponent);
    return opponent;
  }, [playerId]);

  const completeBattle = useCallback(async (win) => {
    const result = await api.completeBattle(playerId, win);
    if (win) {
      setPlayer(result.player);
    } else {
      // 패배: 스탯·소지금은 서버 값으로 갱신하되, 닉네임은 유지
      // clearNickname() 호출(모달 닫기 버튼)에서 null 처리
      setPlayer(p => ({ ...result.player, nickname: p?.nickname ?? null }));
    }
    return result;
  }, [playerId]);

  const clearNickname = useCallback(() => {
    // 패배 후 호출 — 기존 플레이어 ID를 해제해 다음 닉네임 입력 시 새 플레이어(POST)로 생성
    localStorage.removeItem('ddakji_player_id');
    setPlayerId(null);
    setPlayer(null);
    setCurrentOpponent(null);
  }, []);

  const eff = {
    atk: player?.eff_atk ?? 10,
    def: player?.eff_def ?? 10,
  };

  const value = {
    playerId,
    player,
    loading,
    screen, setScreen,
    nickname:        player?.nickname      ?? null,
    paperScraps:     player?.paper_scraps  ?? 0,
    atkLvl:          player?.atk_lvl       ?? 0,
    defLvl:          player?.def_lvl       ?? 0,
    paletteSeed:     player?.palette_seed  ?? 0,
    tier:            player?.tier          ?? '무강',
    eff,
    history:         player?.history       ?? [],
    currentOpponent,
    submitNickname,
    enhance,
    summonOpponent,
    advanceOpponent,
    completeBattle,
    clearNickname,
  };

  return React.createElement(GameContext.Provider, { value }, children);
}

// 전역 노출
window.useGame       = useGame;
window.GameProvider  = GameProvider;
