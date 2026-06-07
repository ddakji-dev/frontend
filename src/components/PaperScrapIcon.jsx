function PaperScrapIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M 4 6 L 14 4 L 20 9 L 18 18 L 6 19 L 3 14 Z" fill="oklch(0.78 0.08 80)" stroke="oklch(0.4 0.04 60)" strokeWidth="0.8"/>
      <path d="M 14 4 L 14 9 L 20 9" fill="none" stroke="oklch(0.4 0.04 60)" strokeWidth="0.8"/>
      <line x1="7" y1="11" x2="14" y2="11" stroke="oklch(0.4 0.04 60)" strokeWidth="0.6" opacity="0.4"/>
      <line x1="7" y1="13" x2="16" y2="13" stroke="oklch(0.4 0.04 60)" strokeWidth="0.6" opacity="0.4"/>
      <line x1="7" y1="15" x2="13" y2="15" stroke="oklch(0.4 0.04 60)" strokeWidth="0.6" opacity="0.4"/>
    </svg>
  );
}
window.PaperScrapIcon = PaperScrapIcon;
