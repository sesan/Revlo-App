import { useLayoutEffect } from 'react';

let lockCount = 0;

export function useLockBodyScroll(isLocked: boolean = true) {
  useLayoutEffect(() => {
    if (!isLocked) return;

    // Save initial styles
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Increment lock count
    lockCount++;

    // Only apply lock on first lock
    if (lockCount === 1) {
      // Get scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      // Prevent scrolling
      document.body.style.overflow = 'hidden';

      // Prevent layout shift by adding padding
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    // Re-enable scrolling when component unmounts
    return () => {
      lockCount--;

      // Only unlock when all locks are released
      if (lockCount === 0) {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      }
    };
  }, [isLocked]);
}
