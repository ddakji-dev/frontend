// 백엔드 API 클라이언트 — window.api 로 전역 노출
window.api = (function () {
  const BASE = 'https://famous-blowfish-plainly.ngrok-free.app/api';

  async function request(method, path, body) {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
       } : {'ngrok-skip-browser-warning': 'true'},
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || '요청 실패');
    }
    return res.json();
  }

  return {
    createPlayer:     (nickname)            => request('POST', '/players', { nickname }),
    getPlayer:        (playerId)            => request('GET',  `/players/${playerId}`),
    renamePlayer:     (playerId, nickname)  => request('PATCH',`/players/${playerId}/nickname`, { nickname }),
    enhance:          (playerId, track)     => request('POST', `/players/${playerId}/enhance`, { track }),
    getEnhancePreview:(playerId, track)     => request('GET',  `/players/${playerId}/enhance/preview?track=${track}`),
    getBattleProbs:   (playerId, turnNum)   => request('GET',  `/players/${playerId}/battle/probabilities?turn_num=${turnNum}`),
    getOpponent:      (playerId)            => request('GET',  `/players/${playerId}/opponent`),
    advanceOpponent:  (playerId)            => request('POST', `/players/${playerId}/advance-opponent`),
    battleSwing:      (playerId, actor, turn_num) => request('POST', `/players/${playerId}/battle/swing`, { actor, turn_num }),
    completeBattle:   (playerId, win)       => request('POST', `/players/${playerId}/battle/complete`, { win }),
  };
})();
