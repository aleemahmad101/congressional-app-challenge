import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GLOSSARY, type TermKey } from '../data/glossary';
import { useLearnMode } from '../learn-mode';

interface TermProps {
  id: TermKey;
  /** Defaults to the glossary title, lowercased to sit inside a sentence. */
  children?: React.ReactNode;
}

/**
 * A word that explains itself. Inert until Learn Mode is on — the same copy
 * reads normally either way, so nothing shifts when the toggle flips.
 */
export function Term({ id, children }: TermProps) {
  const learnMode = useLearnMode();
  const entry = GLOSSARY[id];
  const label = children ?? entry.title.toLowerCase();

  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [anchor, setAnchor] = useState({ left: 0, top: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;

    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      // The popover is centred on the word, then pulled back inside the
      // viewport so a term near either edge stays fully readable.
      const halfWidth = Math.min(300, window.innerWidth - 32) / 2;
      const margin = halfWidth + 12;
      const left = Math.min(
        Math.max(rect.left + rect.width / 2, margin),
        Math.max(margin, window.innerWidth - margin),
      );
      setAnchor({ left, top: rect.bottom + 8 });
    };
    place();

    const close = () => {
      setOpen(false);
      setPinned(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!buttonRef.current?.contains(event.target as Node)) close();
    };

    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  if (!learnMode) return <>{label}</>;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="term"
        aria-expanded={open}
        aria-describedby={open ? popoverId : undefined}
        onPointerEnter={() => setOpen(true)}
        onPointerLeave={() => !pinned && setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => !pinned && setOpen(false)}
        onClick={() => {
          setPinned((was) => !was);
          setOpen(true);
        }}
      >
        {label}
      </button>
      {/* Portalled to the body: the popover is a block, and it is often
          rendered from inside a paragraph. */}
      {open &&
        createPortal(
          <div
            id={popoverId}
            role="tooltip"
            className="glossary-pop"
            style={{ left: anchor.left, top: anchor.top }}
          >
            <h5>{entry.title}</h5>
            <p>{entry.definition}</p>
            <p className="example">{entry.example}</p>
          </div>,
          document.body,
        )}
    </>
  );
}
