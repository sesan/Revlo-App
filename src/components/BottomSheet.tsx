import React, { useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Accessible name for screen readers when no visible heading is referenced */
  ariaLabel?: string;
  /** Optional id of a heading element labelling the dialog */
  ariaLabelledBy?: string;
  /** Maximum height as vh unit, e.g. 90 for 90vh. Default: 90 */
  maxHeight?: number;
  /** Show the drag handle pill. Default: true */
  showHandle?: boolean;
  /** Enable drag-to-dismiss gesture. Default: true */
  dragToDismiss?: boolean;
  /** Full screen mode (no rounded corners, 100vh). Default: false */
  fullScreen?: boolean;
}

const DISMISS_THRESHOLD = 100;
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  ariaLabel = 'Dialog',
  ariaLabelledBy,
  maxHeight = 90,
  showHandle = true,
  dragToDismiss = true,
  fullScreen = false,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useLockBodyScroll(isOpen);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > DISMISS_THRESHOLD || info.velocity.y > 500) {
        onClose();
      }
    },
    [onClose]
  );

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!sheetRef.current) return [];
    return Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  }, []);

  useEffect(() => {
    if (!isOpen) {
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
        previousActiveElementRef.current = null;
      }
      return;
    }

    previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => {
      const focusable = getFocusableElements();
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        sheetRef.current?.focus();
      }
    });
  }, [getFocusableElements, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) {
      e.preventDefault();
      sheetRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (e.shiftKey) {
      if (!active || active === first) {
        e.preventDefault();
        last.focus();
      }
      return;
    }

    if (!active || active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40"
            aria-hidden="true"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag={dragToDismiss ? 'y' : false}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabelledBy ? undefined : ariaLabel}
            aria-labelledby={ariaLabelledBy}
            tabIndex={-1}
            className={`relative z-10 w-full bg-bg-elevated flex flex-col mobile-scroll ${
              fullScreen
                ? 'h-screen'
                : `rounded-t-2xl max-h-[${maxHeight}vh]`
            }`}
            style={fullScreen ? undefined : { maxHeight: `${maxHeight}vh` }}
          >
            {/* Drag handle */}
            {showHandle && !fullScreen && (
              <div className="flex justify-center pt-2.5 pb-1 shrink-0">
                <div className="w-9 h-[5px] rounded-full bg-black/15" />
              </div>
            )}

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
