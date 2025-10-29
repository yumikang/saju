import { cn } from "~/lib/utils";
import type { ReactNode } from "react";

export type ThemeVariant = 'orange' | 'purple' | 'transition';

export interface ThemeZoneProps {
  children: ReactNode;
  variant: ThemeVariant;
  className?: string;
}

/**
 * Theme zone wrapper for section-based color separation
 *
 * Wraps content sections to apply theme-specific styles without global changes.
 * Supports three variants:
 * - orange: Main brand color (existing system)
 * - purple: Premium gradient theme (new)
 * - transition: Gradient bridge between orange and purple zones
 *
 * @example
 * ```tsx
 * <ThemeZone variant="orange">
 *   <FreeContent />
 * </ThemeZone>
 *
 * <ThemeZone variant="transition">
 *   <Divider />
 * </ThemeZone>
 *
 * <ThemeZone variant="purple">
 *   <PremiumContent />
 * </ThemeZone>
 * ```
 */
export function ThemeZone({ children, variant, className }: ThemeZoneProps) {
  const variantStyles: Record<ThemeVariant, string> = {
    orange: cn(
      // Existing orange brand theme
      'bg-gradient-to-b from-orange-50 to-white',
      '[&_.premium-content]:hidden', // Hide purple-only content
    ),
    purple: cn(
      // New purple premium theme
      'bg-purple-gradient',
      'relative overflow-hidden',
      // Purple ambient lighting
      'before:absolute before:inset-0',
      'before:bg-gradient-to-br before:from-purple-500/10 before:via-transparent before:to-indigo-500/10',
      'before:pointer-events-none',
    ),
    transition: cn(
      // Gradient bridge between themes
      'bg-transition-gradient',
      'min-h-[120px]',
      'relative',
      // Smooth opacity transition
      '[mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]',
    ),
  };

  return (
    <div className={cn('relative', variantStyles[variant], className)}>
      {children}
    </div>
  );
}

/**
 * Premium section wrapper with purple theme and glass effects
 */
export function PremiumSection({
  children,
  className,
  showTransition = true,
}: {
  children: ReactNode;
  className?: string;
  showTransition?: boolean;
}) {
  return (
    <>
      {showTransition && (
        <ThemeZone variant="transition">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-4">
              <div className="h-px w-24 bg-gradient-to-r from-brand-orange to-transparent" />
              <span className="text-sm font-medium text-white/70">Premium Names</span>
              <div className="h-px w-24 bg-gradient-to-l from-purple-500 to-transparent" />
            </div>
          </div>
        </ThemeZone>
      )}

      <ThemeZone variant="purple" className={className}>
        {children}
      </ThemeZone>
    </>
  );
}
