interface HeaderProps {
  learnMode: boolean;
  onToggleLearnMode: () => void;
  /** Go to the home page, optionally scrolling to a section on it. */
  onNavigate: (anchor?: string) => void;
}

export function Header({ learnMode, onToggleLearnMode, onNavigate }: HeaderProps) {
  return (
    <header className="masthead">
      <div className="masthead-inner">
        <a
          className="wordmark"
          href="./"
          onClick={(event) => {
            event.preventDefault();
            onNavigate();
          }}
        >
          {/* The mark is the app's own idea in miniature: cash flows shrinking
              as they travel further into the future. */}
          <svg width="32" height="32" viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" rx="12" fill="var(--ink)" />
            <rect x="14" y="18" width="9" height="32" fill="var(--currency-bright)" />
            <rect x="27.5" y="26" width="9" height="24" fill="var(--currency-bright)" opacity="0.75" />
            <rect x="41" y="34" width="9" height="16" fill="var(--seal)" />
          </svg>
          <span className="wordmark-text">ClearValue</span>
        </a>

        <nav className="masthead-nav" aria-label="Main">
          {(['how-it-works', 'companies'] as const).map((anchor) => (
            <a
              key={anchor}
              href={`#${anchor}`}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(anchor);
              }}
            >
              {anchor === 'companies' ? 'Companies' : 'How it works'}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="switch"
          aria-pressed={learnMode}
          onClick={onToggleLearnMode}
        >
          <span className="switch-label">
            Explain everything
            <span className="switch-state" aria-hidden="true">
              {learnMode ? 'On' : 'Off'}
            </span>
          </span>
          <span className="switch-track" aria-hidden="true">
            <span className="switch-thumb" />
          </span>
        </button>
      </div>
    </header>
  );
}
