import { useEffect, useRef, useState } from 'react';

/** Subscribes to a media query and re-renders when it flips. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia?.(query).matches ?? false);

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    onChange();
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** True when the visitor has asked their system to keep animation to a minimum. */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Eases a number toward its new value so figures read as changing rather than
 * teleporting. Snaps instantly under reduced motion, and snaps on the very
 * first render so nothing counts up from zero on load.
 */
export function useCountUp(target: number, duration = 180): number {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(target);
  const frame = useRef(0);
  const first = useRef(true);

  useEffect(() => {
    if (reduced || first.current || !Number.isFinite(target)) {
      first.current = false;
      setDisplay(target);
      return;
    }

    const from = display;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic — fast to start, settles gently.
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (target - from) * eased);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    // Browsers stop serving animation frames to hidden tabs. Without this the
    // figure would sit frozen at a stale value until the tab came back.
    const safety = setTimeout(() => setDisplay(target), duration + 60);

    return () => {
      cancelAnimationFrame(frame.current);
      clearTimeout(safety);
    };
    // `display` is deliberately excluded: it is the tween's starting point,
    // captured once per target change, not a trigger for re-running it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, reduced]);

  return display;
}

/**
 * The same easing as useCountUp, applied to a whole list at once.
 *
 * The bars are animated by tweening their heights in JavaScript rather than
 * by CSS-transforming the rects. A vertical scale would stretch the terminal
 * bar's hatch pattern into a different angle on every slider move; changing
 * the geometry instead keeps the hatching honest.
 */
export function useTweenedList(targets: number[], duration = 160): number[] {
  const reduced = useReducedMotion();
  const [values, setValues] = useState(targets);
  const frame = useRef(0);
  const latest = useRef(targets);
  const first = useRef(true);

  latest.current = values;
  const signature = targets.join(',');

  useEffect(() => {
    if (reduced || first.current) {
      first.current = false;
      setValues(targets);
      return;
    }

    const from = latest.current;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValues(targets.map((to, i) => (from[i] ?? to) + (to - (from[i] ?? to)) * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    // Same safety net as useCountUp: a hidden tab gets no animation frames.
    const safety = setTimeout(() => setValues(targets), duration + 60);

    return () => {
      cancelAnimationFrame(frame.current);
      clearTimeout(safety);
    };
    // Targets are compared by value through `signature`; `latest` holds the
    // start of the tween without re-triggering it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, duration, reduced]);

  return values.length === targets.length ? values : targets;
}

/**
 * Opens every collapsed <details> while the page is being printed, then puts
 * them back. CSS cannot do this: browsers hide the contents of a closed
 * <details> below the cascade, so a judge printing the page would otherwise
 * get a heading with nothing under it.
 */
export function usePrintExpandsDetails() {
  useEffect(() => {
    let reopened: HTMLDetailsElement[] = [];

    const expand = () => {
      reopened = [...document.querySelectorAll('details')].filter((d) => !d.open);
      for (const details of reopened) details.open = true;
    };
    const restore = () => {
      for (const details of reopened) details.open = false;
      reopened = [];
    };

    window.addEventListener('beforeprint', expand);
    window.addEventListener('afterprint', restore);

    // Safari fires no beforeprint; it flips this media query instead.
    const printing = window.matchMedia('print');
    const onChange = (event: MediaQueryListEvent) => (event.matches ? expand() : restore());
    printing.addEventListener('change', onChange);

    return () => {
      window.removeEventListener('beforeprint', expand);
      window.removeEventListener('afterprint', restore);
      printing.removeEventListener('change', onChange);
    };
  }, []);
}

/**
 * A boolean preference that starts at `fallback` and, once the visitor changes
 * it, is remembered for the rest of the browser session. Returning inside the
 * same session respects their last choice; a fresh session starts over at the
 * default.
 */
export function useSessionPreference(
  key: string,
  fallback: boolean,
): [boolean, (next: boolean) => void] {
  const [value, setValue] = useState(() => {
    try {
      const stored = sessionStorage.getItem(key);
      return stored === null ? fallback : stored === '1';
    } catch {
      return fallback;
    }
  });

  const update = (next: boolean) => {
    setValue(next);
    try {
      sessionStorage.setItem(key, next ? '1' : '0');
    } catch {
      /* Private browsing. The preference simply lasts this page view. */
    }
  };

  return [value, update];
}

/** Remembers a flag for the length of the browser tab's session only. */
export function useSessionFlag(key: string): [boolean, () => void] {
  const [set, setSet] = useState(() => {
    try {
      return sessionStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  });

  const mark = () => {
    setSet(true);
    try {
      sessionStorage.setItem(key, '1');
    } catch {
      /* Private browsing. The walkthrough simply reappears next session. */
    }
  };

  return [set, mark];
}
