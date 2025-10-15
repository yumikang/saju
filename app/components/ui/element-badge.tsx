/**
 * Element Badge Component
 *
 * Displays an element (木火土金水) with appropriate styling and color
 */

import { Badge } from '~/components/ui/badge';
import { Element } from '@prisma/client';
import { cn } from '~/lib/utils';

interface ElementBadgeProps {
  element: Element;
  count?: number;
  className?: string;
}

// Element labels in Korean
const ELEMENT_LABELS: Record<Element, string> = {
  WOOD: '목(木)',
  FIRE: '화(火)',
  EARTH: '토(土)',
  METAL: '금(金)',
  WATER: '수(水)',
};

// Element colors for light mode
const ELEMENT_COLORS: Record<Element, string> = {
  WOOD: 'bg-green-100 text-green-800 border-green-300',
  FIRE: 'bg-red-100 text-red-800 border-red-300',
  EARTH: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  METAL: 'bg-gray-100 text-gray-800 border-gray-300',
  WATER: 'bg-blue-100 text-blue-800 border-blue-300',
};

/**
 * Element Badge Component
 *
 * @param element - The element type (WOOD, FIRE, EARTH, METAL, WATER)
 * @param count - Optional count to display next to the element
 * @param className - Additional CSS classes
 */
export function ElementBadge({ element, count, className }: ElementBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border',
        ELEMENT_COLORS[element],
        className
      )}
    >
      {ELEMENT_LABELS[element]}
      {count !== undefined && ` (${count})`}
    </Badge>
  );
}

/**
 * Element Badge Group Component
 *
 * Displays multiple element badges in a row
 */
interface ElementBadgeGroupProps {
  elements: Array<{ element: Element; count?: number }>;
  className?: string;
}

export function ElementBadgeGroup({ elements, className }: ElementBadgeGroupProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {elements.map(({ element, count }, index) => (
        <ElementBadge
          key={`${element}-${index}`}
          element={element}
          count={count}
        />
      ))}
    </div>
  );
}

/**
 * Element Distribution Display
 *
 * Shows all 5 elements with their counts
 */
interface ElementDistributionProps {
  elementCounts: Record<Element, number>;
  className?: string;
}

export function ElementDistribution({ elementCounts, className }: ElementDistributionProps) {
  const elements = Object.entries(elementCounts) as [Element, number][];

  return (
    <div className={cn('grid grid-cols-5 gap-3', className)}>
      {elements.map(([element, count]) => (
        <div key={element} className="text-center">
          <div className="mb-2">
            <ElementBadge element={element} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{count}</div>
        </div>
      ))}
    </div>
  );
}
