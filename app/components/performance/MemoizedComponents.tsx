import { memo, useMemo, useCallback, ReactNode } from 'react';
import { cn } from '~/lib/utils';

// Props comparison helper
function arePropsEqual<T extends Record<string, any>>(
  prevProps: T,
  nextProps: T,
  keysToCompare?: (keyof T)[]
): boolean {
  const keys = keysToCompare || (Object.keys(prevProps) as (keyof T)[]);
  
  return keys.every(key => {
    if (typeof prevProps[key] === 'function' && typeof nextProps[key] === 'function') {
      // Functions are assumed to be stable if using useCallback
      return true;
    }
    return Object.is(prevProps[key], nextProps[key]);
  });
}

// Memoized card component
interface MemoizedCardProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const MemoizedCard = memo<MemoizedCardProps>(
  ({ title, description, children, className, onClick }) => {
    return (
      <div 
        className={cn(
          "bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg",
          className
        )}
        onClick={onClick}
      >
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        {description && <p className="text-gray-600 mb-4">{description}</p>}
        {children}
      </div>
    );
  },
  (prevProps, nextProps) => arePropsEqual(prevProps, nextProps, ['title', 'description', 'className'])
);

MemoizedCard.displayName = 'MemoizedCard';

// Memoized list component with virtualization support
interface MemoizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  virtualized?: boolean;
  itemHeight?: number;
  visibleItems?: number;
}

export const MemoizedList = memo(
  <T extends any>({
    items,
    renderItem,
    keyExtractor,
    className,
    virtualized = false,
    itemHeight = 100,
    visibleItems = 10,
  }: MemoizedListProps<T>) => {
    const renderedItems = useMemo(() => {
      if (!virtualized) {
        return items.map((item, index) => (
          <div key={keyExtractor(item, index)}>
            {renderItem(item, index)}
          </div>
        ));
      }
      
      // Simple virtualization for performance
      // In production, use react-window or react-virtualized
      return items.slice(0, visibleItems).map((item, index) => (
        <div 
          key={keyExtractor(item, index)}
          style={{ height: itemHeight }}
        >
          {renderItem(item, index)}
        </div>
      ));
    }, [items, renderItem, keyExtractor, virtualized, itemHeight, visibleItems]);
    
    return (
      <div className={cn("space-y-4", className)}>
        {renderedItems}
      </div>
    );
  }
) as <T>(props: MemoizedListProps<T>) => JSX.Element;

MemoizedList.displayName = 'MemoizedList';

// Memoized form input
interface MemoizedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const MemoizedInput = memo<MemoizedInputProps>(
  ({ label, value, onChange, type = 'text', placeholder, error, disabled, className }) => {
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    }, [onChange]);
    
    return (
      <div className={cn("space-y-2", className)}>
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <input
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500",
            error ? "border-red-500" : "border-gray-300",
            disabled && "bg-gray-100 cursor-not-allowed"
          )}
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => 
    prevProps.value === nextProps.value && 
    prevProps.error === nextProps.error &&
    prevProps.disabled === nextProps.disabled
);

MemoizedInput.displayName = 'MemoizedInput';

// Memoized button with loading state
interface MemoizedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const MemoizedButton = memo<MemoizedButtonProps>(
  ({ 
    children, 
    onClick, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    disabled = false, 
    className 
  }) => {
    const variantStyles = {
      primary: 'bg-orange-500 hover:bg-orange-600 text-white',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
      danger: 'bg-red-500 hover:bg-red-600 text-white',
    };
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };
    
    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={cn(
          "font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
          variantStyles[variant],
          sizeStyles[size],
          (disabled || loading) && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </span>
        ) : children}
      </button>
    );
  },
  (prevProps, nextProps) => 
    prevProps.loading === nextProps.loading &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.variant === nextProps.variant &&
    prevProps.size === nextProps.size
);

MemoizedButton.displayName = 'MemoizedButton';

// Memoized stats card
interface StatsData {
  label: string;
  value: string | number;
  change?: number;
  icon?: ReactNode;
}

interface MemoizedStatsCardProps {
  stats: StatsData;
  className?: string;
}

export const MemoizedStatsCard = memo<MemoizedStatsCardProps>(
  ({ stats, className }) => {
    const changeColor = useMemo(() => {
      if (!stats.change) return 'text-gray-500';
      return stats.change > 0 ? 'text-green-500' : 'text-red-500';
    }, [stats.change]);
    
    const changeIcon = useMemo(() => {
      if (!stats.change) return null;
      return stats.change > 0 ? '↑' : '↓';
    }, [stats.change]);
    
    return (
      <div className={cn(
        "bg-white rounded-lg shadow p-6",
        className
      )}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{stats.label}</p>
            <p className="text-2xl font-bold mt-1">{stats.value}</p>
            {stats.change !== undefined && (
              <p className={cn("text-sm mt-2", changeColor)}>
                <span>{changeIcon}</span>
                <span className="ml-1">{Math.abs(stats.change)}%</span>
              </p>
            )}
          </div>
          {stats.icon && (
            <div className="text-gray-400">
              {stats.icon}
            </div>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => 
    JSON.stringify(prevProps.stats) === JSON.stringify(nextProps.stats)
);

MemoizedStatsCard.displayName = 'MemoizedStatsCard';

// Export all components
export default {
  Card: MemoizedCard,
  List: MemoizedList,
  Input: MemoizedInput,
  Button: MemoizedButton,
  StatsCard: MemoizedStatsCard,
};