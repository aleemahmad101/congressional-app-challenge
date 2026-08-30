interface HeaderProps {
  learnMode: boolean;
  onToggleLearnMode: () => void;
}

export function Header({ learnMode, onToggleLearnMode }: HeaderProps) {
  return (
    <header className="masthead">
      <div>
        <div className="wordmark">
          {/* The mark is the app's own idea in miniature: cash flows shrinking
              as they travel further into the future. */}
          <svg width="34" height="34" viewBox="0 0 64 64" role="img" aria-label="">
            <rect width="64" height="64" rx="12" fill="var(--ink)" />
            <rect x="14" y="18" width="9" height="32" fill="var(--currency)" />
            <rect x="27.5" y="26" width="9" height="24" fill="var(--currency)" opacity="0.75" />
            <rect x="41" y="34" width="9" height="16" fill="var(--seal)" />
          </svg>
          <h1>ClearValue</h1>
        </div>
        <p className="mission">
          What is a company actually worth? Work it out from the cash it generates — no finance
          degree required.
        </p>
      </div>

      <button
        type="button"
        className="switch"
        aria-pressed={learnMode}
        onClick={onToggleLearnMode}
      >
        <span className="switch-label">Learn mode</span>
        <span className="switch-track" aria-hidden="true">
          <span className="switch-thumb" />
        </span>
      </button>
    </header>
  );
}
