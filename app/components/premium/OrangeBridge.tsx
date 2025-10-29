import { cn } from "~/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface OrangeBridgeProps {
  type: 'icon' | 'border' | 'badge' | 'accent';
  children?: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
}

/**
 * Orange accent bridge components to maintain brand continuity in purple theme
 *
 * Provides strategic orange accents within purple premium sections to:
 * - Preserve brand identity
 * - Create visual coherence between theme zones
 * - Prevent "Frankenstein effect" from theme mixing
 *
 * @example
 * ```tsx
 * // Icon accent
 * <OrangeBridge type="icon" icon={Crown} />
 *
 * // Border accent
 * <OrangeBridge type="border">
 *   <PremiumCard />
 * </OrangeBridge>
 *
 * // Badge accent
 * <OrangeBridge type="badge">Best</OrangeBridge>
 *
 * // General accent wrapper
 * <OrangeBridge type="accent">
 *   <Button />
 * </OrangeBridge>
 * ```
 */
export function OrangeBridge({ type, children, className, icon: Icon }: OrangeBridgeProps) {
  switch (type) {
    case 'icon':
      if (!Icon) return null;
      return (
        <Icon
          className={cn(
            'text-brand-orange',
            'drop-shadow-[0_0_8px_rgba(255,107,53,0.5)]',
            'transition-all duration-300',
            'group-hover:scale-110',
            'group-hover:drop-shadow-[0_0_12px_rgba(255,107,53,0.8)]',
            className
          )}
        />
      );

    case 'border':
      return (
        <div
          className={cn(
            'border-2 border-transparent',
            'hover:border-brand-orange/40',
            'transition-colors duration-300',
            'rounded-2xl',
            className
          )}
        >
          {children}
        </div>
      );

    case 'badge':
      return (
        <span
          className={cn(
            'inline-flex items-center',
            'px-3 py-1',
            'bg-brand-orange/20',
            'border border-brand-orange/40',
            'text-brand-orange',
            'text-xs font-semibold',
            'rounded-full',
            'backdrop-blur-sm',
            'shadow-[0_0_12px_rgba(255,107,53,0.3)]',
            'transition-all duration-300',
            'hover:bg-brand-orange/30',
            'hover:shadow-[0_0_16px_rgba(255,107,53,0.5)]',
            className
          )}
        >
          {children}
        </span>
      );

    case 'accent':
      return (
        <div
          className={cn(
            'relative',
            // Orange glow on hover
            'before:absolute before:-inset-1',
            'before:bg-brand-orange/0',
            'before:rounded-xl',
            'before:blur-md',
            'before:transition-all before:duration-300',
            'hover:before:bg-brand-orange/20',
            className
          )}
        >
          {children}
        </div>
      );

    default:
      return <>{children}</>;
  }
}

/**
 * Rank badge with orange accent for premium names
 */
export function OrangeRankBadge({ rank, className }: { rank: number; className?: string }) {
  const isTop3 = rank <= 3;

  return (
    <OrangeBridge type="badge" className={className}>
      <span className="flex items-center gap-1.5">
        {isTop3 && <span className="text-brand-orange">★</span>}
        <span>{rank}위</span>
      </span>
    </OrangeBridge>
  );
}

/**
 * Premium indicator with orange accent
 */
export function OrangePremiumIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-brand-orange opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange" />
      </div>
      <span className="text-xs font-medium text-brand-orange">Premium</span>
    </div>
  );
}
