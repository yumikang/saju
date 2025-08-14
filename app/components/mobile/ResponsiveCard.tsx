import { motion } from 'framer-motion';
import { cn } from '~/lib/utils';
import { useSwipe, useLongPress } from '~/hooks/useGestures';
import { useRef, useState } from 'react';
import { ChevronRight, MoreVertical, Heart, Share2, Bookmark } from 'lucide-react';

interface ResponsiveCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  badge?: string;
  badgeColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  actions?: CardAction[];
  className?: string;
  children?: React.ReactNode;
}

interface CardAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}

export function ResponsiveCard({
  title,
  subtitle,
  description,
  image,
  badge,
  badgeColor = 'primary',
  onClick,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  actions,
  className,
  children,
}: ResponsiveCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showActions, setShowActions] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Swipe handling
  useSwipe(cardRef, {
    onSwipeLeft: () => {
      if (onSwipeLeft) {
        setIsSwiping(true);
        setSwipeOffset(-100);
        setTimeout(() => {
          onSwipeLeft();
          setSwipeOffset(0);
          setIsSwiping(false);
        }, 300);
      }
    },
    onSwipeRight: () => {
      if (onSwipeRight) {
        setIsSwiping(true);
        setSwipeOffset(100);
        setTimeout(() => {
          onSwipeRight();
          setSwipeOffset(0);
          setIsSwiping(false);
        }, 300);
      }
    },
    threshold: 80,
  });

  // Long press handling
  if (onLongPress) {
    useLongPress(cardRef, {
      onLongPress: () => {
        // Haptic feedback on mobile
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        onLongPress();
      },
      delay: 500,
    });
  }

  const badgeColors = {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    danger: 'bg-red-500 text-white',
  };

  return (
    <motion.div
      ref={cardRef}
      animate={{
        x: swipeOffset,
        opacity: isSwiping ? 0.8 : 1,
      }}
      transition={{ type: 'spring', damping: 20 }}
      className={cn(
        "relative bg-card rounded-lg shadow-sm",
        "transition-all duration-200",
        "hover:shadow-md",
        onClick && "cursor-pointer active:scale-[0.98]",
        className
      )}
      onClick={(e) => {
        if (!showActions && onClick) {
          onClick();
        }
      }}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute top-2 right-2 z-10">
          <span className={cn(
            "px-2 py-1 text-xs font-bold rounded-full",
            badgeColors[badgeColor]
          )}>
            {badge}
          </span>
        </div>
      )}

      {/* Image */}
      {image && (
        <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden rounded-t-lg">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="p-4 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-foreground truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Action menu button */}
          {actions && actions.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className={cn(
                "p-2 rounded-lg transition-colors",
                "hover:bg-muted tap-highlight-transparent",
                "focus-visible-ring"
              )}
              aria-label="More actions"
            >
              <MoreVertical className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground line-clamp-3 mb-3">
            {description}
          </p>
        )}

        {/* Children content */}
        {children}

        {/* Quick actions (mobile optimized) */}
        {showActions && actions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 pt-3 border-t border-border"
          >
            <div className="flex gap-1 flex-wrap">
              {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick();
                      setShowActions(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2",
                      "text-sm rounded-lg",
                      "bg-muted hover:bg-muted/80",
                      "transition-colors tap-highlight-transparent",
                      "active:scale-95"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Click indicator for clickable cards */}
        {onClick && !showActions && (
          <div className="flex items-center justify-end mt-3 text-primary">
            <span className="text-sm font-medium">자세히 보기</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        )}
      </div>

      {/* Swipe indicators */}
      {(onSwipeLeft || onSwipeRight) && (
        <>
          {onSwipeLeft && (
            <div className={cn(
              "absolute left-0 top-0 bottom-0 w-16",
              "bg-gradient-to-r from-red-500/20 to-transparent",
              "opacity-0 transition-opacity pointer-events-none",
              swipeOffset < -20 && "opacity-100"
            )} />
          )}
          {onSwipeRight && (
            <div className={cn(
              "absolute right-0 top-0 bottom-0 w-16",
              "bg-gradient-to-l from-green-500/20 to-transparent",
              "opacity-0 transition-opacity pointer-events-none",
              swipeOffset > 20 && "opacity-100"
            )} />
          )}
        </>
      )}
    </motion.div>
  );
}

// Grid container for responsive cards
interface ResponsiveCardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function ResponsiveCardGrid({
  children,
  columns = 3,
  className,
}: ResponsiveCardGridProps) {
  const gridColumns = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={cn(
      "grid gap-4 sm:gap-5 lg:gap-6",
      gridColumns[columns],
      className
    )}>
      {children}
    </div>
  );
}

// Horizontal scrollable card list for mobile
interface ScrollableCardListProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollableCardList({
  children,
  className,
}: ScrollableCardListProps) {
  return (
    <div className={cn(
      "swipeable flex gap-4 pb-4",
      "-mx-4 px-4 sm:mx-0 sm:px-0",
      className
    )}>
      {children}
    </div>
  );
}

// Compact card for lists
interface CompactCardProps {
  title: string;
  subtitle?: string;
  avatar?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function CompactCard({
  title,
  subtitle,
  avatar,
  trailing,
  onClick,
  className,
}: CompactCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 sm:p-4",
        "bg-card rounded-lg",
        "transition-all duration-200",
        onClick && "cursor-pointer hover:bg-muted/50 active:scale-[0.98]",
        "tap-highlight-transparent",
        className
      )}
    >
      {/* Avatar */}
      {avatar && (
        <div className="flex-shrink-0">
          <img
            src={avatar}
            alt={title}
            className="w-12 h-12 rounded-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-medium text-foreground truncate">
          {title}
        </h4>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Trailing element */}
      {trailing || (onClick && <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />)}
    </div>
  );
}