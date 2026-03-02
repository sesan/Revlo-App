import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MotivationalMessage } from '../lib/motivationalMessages';
import { format } from 'date-fns';

interface MotivationalBannerProps {
  message: MotivationalMessage;
}

export default function MotivationalBanner({ message }: MotivationalBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if banner was dismissed today
    const dismissedDate = localStorage.getItem('motivationalBannerDismissed');
    const today = format(new Date(), 'yyyy-MM-dd');

    if (dismissedDate === today) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    localStorage.setItem('motivationalBannerDismissed', today);
    setIsDismissed(true);
  };

  const handleAction = () => {
    if (message.actionPath) {
      navigate(message.actionPath);
    }
  };

  if (isDismissed) {
    return null;
  }

  const Icon = message.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-gold-subtle to-bg-surface border border-gold/30 rounded-2xl p-4 mb-4 relative"
      >
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-6 h-6 rounded-full hover:bg-bg-hover flex items-center justify-center transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} className="text-text-muted" />
        </button>

        <div className="flex items-center gap-3 pr-8">
          {/* Icon */}
          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
            <Icon size={20} className="text-gold" />
          </div>

          {/* Message */}
          <div className="flex-1">
            <p className="text-[14px] text-text-primary font-medium leading-relaxed">
              {message.message}
            </p>
          </div>

          {/* Action button */}
          {message.actionText && message.actionPath && (
            <button
              onClick={handleAction}
              className="flex-shrink-0 px-4 py-2 bg-text-primary text-text-inverse rounded-xl text-[13px] font-medium hover:bg-text-primary/90 transition-colors"
            >
              {message.actionText}
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
