import { useState, useEffect, useRef } from 'react';

type ScrollDirection = 'up' | 'down';

export function useScrollDirection(threshold = 10): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>('up');
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const lastTouchY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const updateDirection = () => {
      const scrollY = window.scrollY;

      if (scrollY <= 0) {
        setDirection('up');
        lastScrollY.current = scrollY;
        ticking.current = false;
        return;
      }

      const diff = scrollY - lastScrollY.current;

      if (Math.abs(diff) >= threshold) {
        setDirection(diff > 0 ? 'down' : 'up');
        lastScrollY.current = scrollY;
      }

      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(updateDirection);
        ticking.current = true;
      }
    };

    // Handle touch events for mobile
    const onTouchStart = (e: TouchEvent) => {
      lastTouchY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const diff = lastTouchY.current - currentY;

      // Trigger scroll detection on significant touch movement
      if (Math.abs(diff) > threshold / 2) {
        if (!ticking.current) {
          requestAnimationFrame(updateDirection);
          ticking.current = true;
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [threshold]);

  return direction;
}
