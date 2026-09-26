import { useEffect, useRef, useState } from 'react';

/**
 * Reveal an element once it scrolls into view. With reduced motion, or
 * without IntersectionObserver, content is simply shown.
 */
export function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => (
    typeof window === 'undefined'
    || !('IntersectionObserver' in window)
    || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ));

  useEffect(() => {
    if (visible || !ref.current) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  return [ref, visible];
}
