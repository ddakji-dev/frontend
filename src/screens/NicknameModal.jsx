const { useState, useEffect, useRef } = React;

function NicknameModal() {
  const g = useGame();
  const [name, setName]         = useState('');
  const [shake, setShake]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  const trimmed = name.trim();
  const valid   = trimmed.length >= 1 && trimmed.length <= 12;

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await g.submitNickname(trimmed);
    } catch {
      setShake(true);
      setTimeout(() => setShake(false), 480);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="nickname-modal-bg paper-grain">
      <div className={`nickname-modal ${shake ? 'shake-screen' : ''}`}>
        <div className="eyebrow" style={{ textAlign: 'center', letterSpacing: '0.3em' }}>새로운 딱지</div>

        <div className="nickname-ddakji">
          <div className="ddakji-glow" />
          <DdakjiCard size={180} seed={g.paletteSeed} atkLvl={0} defLvl={0} />
          {trimmed && <div className="nickname-preview-label serif">{trimmed}</div>}
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
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            disabled={submitting}
          />
          <div className="nickname-counter mono">{trimmed.length} / 12</div>
        </div>

        <button
          className="btn btn-primary btn-lg"
          onClick={submit}
          disabled={!valid || submitting}
          style={{ width: '100%' }}
        >
          {submitting ? '생성 중…' : '이름 새기고 시작하기 →'}
        </button>
      </div>
    </div>
  );
}
window.NicknameModal = NicknameModal;
