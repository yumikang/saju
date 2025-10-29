import { cn } from "~/lib/utils";
import type { ReactNode } from "react";

export type GlassIntensity = 'light' | 'medium' | 'strong';

export interface GlassCardProps {
  children: ReactNode;
  className?: string;
  intensity?: GlassIntensity;
  withBorder?: boolean;
  withHover?: boolean;
  orangeAccent?: boolean;
}

/**
 * Glassmorphism card component with configurable blur intensity
 *
 * @param intensity - Blur strength: light (4px), medium (12px), strong (16px)
 * @param withBorder - Add semi-transparent white border
 * @param withHover - Enable hover state with increased blur
 * @param orangeAccent - Add orange accent on hover (brand bridge)
 */
export function GlassCard({
  children,
  className,
  intensity = 'medium',
  withBorder = true,
  withHover = true,
  orangeAccent = false,
}: GlassCardProps) {
  const intensityClasses: Record<GlassIntensity, string> = {
    light: 'backdrop-blur-sm bg-white/5',
    medium: 'backdrop-blur-md bg-white/10',
    strong: 'backdrop-blur-lg bg-white/20',
  };

  const hoverClasses = withHover ? 'hover:bg-white/15 transition-all duration-300' : '';
  const borderClasses = withBorder ? 'border border-white/20' : '';
  const orangeAccentClasses = orangeAccent
    ? 'hover:border-brand-orange/40 hover:shadow-[0_0_20px_rgba(255,107,53,0.2)]'
    : '';

  return (
    <div
      className={cn(
        intensityClasses[intensity],
        borderClasses,
        hoverClasses,
        orangeAccentClasses,
        'shadow-2xl',
        'rounded-2xl',
        'p-6',
        // Fallback for browsers without backdrop-filter support
        'supports-[backdrop-filter]:bg-white/10',
        '@supports not (backdrop-filter: blur(12px)) { bg-white/90 }',
        className
      )}
    >
      {children}
    </div>
  );
}

export interface GlassCardWithGlowProps extends GlassCardProps {
  glowColor?: 'purple' | 'orange' | 'premium';
  glowIntensity?: 'subtle' | 'medium' | 'strong';
}

/**
 * Glass card with animated glow effect for premium content
 */
export function GlassCardWithGlow({
  glowColor = 'premium',
  glowIntensity = 'medium',
  children,
  ...props
}: GlassCardWithGlowProps) {
  const glowClasses: Record<typeof glowColor, Record<typeof glowIntensity, string>> = {
    purple: {
      subtle: 'bg-gradient-to-br from-purple-500/20 to-indigo-500/10',
      medium: 'bg-gradient-to-br from-purple-500/40 to-indigo-500/20',
      strong: 'bg-gradient-to-br from-purple-500/60 to-indigo-500/30',
    },
    orange: {
      subtle: 'bg-gradient-to-br from-brand-orange/20 to-brand-orange-light/10',
      medium: 'bg-gradient-to-br from-brand-orange/40 to-brand-orange-light/20',
      strong: 'bg-gradient-to-br from-brand-orange/60 to-brand-orange-light/30',
    },
    premium: {
      subtle: 'bg-premium-glow opacity-40',
      medium: 'bg-premium-glow opacity-60',
      strong: 'bg-premium-glow opacity-80',
    },
  };

  return (
    <div className="group relative">
      {/* Glow effect */}
      <div
        className={cn(
          'absolute -inset-0.5 rounded-2xl blur-lg',
          'opacity-0 group-hover:opacity-100',
          'transition-opacity duration-500',
          'animate-glow-pulse',
          glowClasses[glowColor][glowIntensity]
        )}
      />

      {/* Glass card */}
      <div className="relative">
        <GlassCard {...props}>{children}</GlassCard>
      </div>
    </div>
  );
}
