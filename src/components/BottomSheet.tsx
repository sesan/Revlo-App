import React, { useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
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

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  maxHeight = 90,
  showHandle = true,
  dragToDismiss = true,
  fullScreen = false,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useLockBodyScroll(isOpen);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > DISMISS_THRESHOLD || info.velocity.y > 500) {
        onClose();
      }
    },
    [onClose]
  );

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
            className={`relative z-10 w-full bg-bg-elevated flex flex-col ${
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
