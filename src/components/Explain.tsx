import { useLearnMode } from '../learn-mode';

interface ExplainProps {
  children: React.ReactNode;
  /** Renders as a paragraph by default; "block" allows richer content. */
  as?: 'p' | 'div';
  className?: string;
}

/**
 * Teaching copy that only appears while "Explain everything" is on. With it
 * off, the page reads as clean labels and numbers.
 */
export function Explain({ children, as = 'p', className = '' }: ExplainProps) {
  const learnMode = useLearnMode();
  if (!learnMode) return null;
  const Tag = as;
  return <Tag className={`explain ${className}`.trim()}>{children}</Tag>;
}
