import { forwardRef, useState, useRef, useEffect } from 'react';
import { Calendar, Clock, ChevronDown, X, Check } from 'lucide-react';
import { cn } from '~/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Mobile-optimized input component
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ label, error, helpText, icon: Icon, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          )}
          <input
            ref={ref}
            {...props}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={cn(
              "w-full min-h-[48px] px-4 py-3",
              "text-base", // Larger text for mobile
              "border rounded-lg",
              "transition-all duration-200",
              "tap-highlight-transparent",
              Icon && "pl-12",
              isFocused 
                ? "border-primary ring-2 ring-primary/20" 
                : "border-border",
              error && "border-destructive",
              props.disabled && "bg-muted opacity-50",
              className
            )}
          />
        </div>
        {helpText && !error && (
          <p className="text-sm text-muted-foreground">{helpText}</p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

MobileInput.displayName = 'MobileInput';

// Mobile-optimized select component
interface MobileSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export function MobileSelect({
  label,
  value,
  onChange,
  options,
  placeholder = '선택하세요',
  error,
  disabled,
}: MobileSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          className={cn(
            "w-full min-h-[48px] px-4 py-3",
            "flex items-center justify-between",
            "text-base text-left",
            "border rounded-lg",
            "transition-all duration-200",
            "tap-highlight-transparent",
            "hover:bg-muted/50",
            error && "border-destructive",
            disabled && "bg-muted opacity-50 cursor-not-allowed",
            !selectedOption && "text-muted-foreground"
          )}
        >
          <span>{selectedOption?.label || placeholder}</span>
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </button>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Bottom sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-xl"
            >
              {/* Handle */}
              <div className="flex justify-center py-2">
                <div className="w-12 h-1 bg-muted-foreground/20 rounded-full" />
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-2 border-b">
                <h3 className="text-lg font-semibold">{label}</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Options */}
              <div className="max-h-[50vh] overflow-y-auto momentum-scrolling">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-4 text-left",
                      "flex items-center justify-between",
                      "hover:bg-muted/50 transition-colors",
                      "tap-highlight-transparent",
                      value === option.value && "bg-primary/10"
                    )}
                  >
                    <span className="text-base">{option.label}</span>
                    {value === option.value && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Safe area */}
              <div className="safe-bottom" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Mobile date/time picker
interface MobileDateTimePickerProps {
  label: string;
  type: 'date' | 'time' | 'datetime';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  min?: string;
  max?: string;
}

export function MobileDateTimePicker({
  label,
  type,
  value,
  onChange,
  error,
  min,
  max,
}: MobileDateTimePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = type === 'time' ? Clock : Calendar;
  
  const inputType = type === 'datetime' ? 'datetime-local' : type;
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          className={cn(
            "w-full min-h-[48px] px-4 py-3 pl-12",
            "text-base",
            "border rounded-lg",
            "transition-all duration-200",
            "tap-highlight-transparent",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            error && "border-destructive",
            // Style the native picker
            "[&::-webkit-calendar-picker-indicator]:opacity-0",
            "[&::-webkit-calendar-picker-indicator]:absolute",
            "[&::-webkit-calendar-picker-indicator]:inset-0",
            "[&::-webkit-calendar-picker-indicator]:w-full",
            "[&::-webkit-calendar-picker-indicator]:h-full",
            "[&::-webkit-calendar-picker-indicator]:cursor-pointer"
          )}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

// Mobile checkbox with larger touch target
interface MobileCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function MobileCheckbox({
  label,
  checked,
  onChange,
  disabled,
}: MobileCheckboxProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 py-2",
        "cursor-pointer select-none",
        "tap-highlight-transparent",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={cn(
            "w-6 h-6 rounded border-2 transition-all",
            "flex items-center justify-center",
            checked 
              ? "bg-primary border-primary" 
              : "bg-background border-border"
          )}
        >
          {checked && (
            <Check className="w-4 h-4 text-primary-foreground" />
          )}
        </div>
      </div>
      <span className="text-base flex-1">{label}</span>
    </label>
  );
}

// Mobile radio group
interface MobileRadioOption {
  value: string;
  label: string;
  description?: string;
}

interface MobileRadioGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: MobileRadioOption[];
  disabled?: boolean;
}

export function MobileRadioGroup({
  label,
  value,
  onChange,
  options,
  disabled,
}: MobileRadioGroupProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex items-start gap-3 p-3",
              "border rounded-lg cursor-pointer",
              "transition-all duration-200",
              "tap-highlight-transparent",
              value === option.value 
                ? "border-primary bg-primary/5" 
                : "border-border hover:bg-muted/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="mt-0.5">
              <input
                type="radio"
                value={option.value}
                checked={value === option.value}
                onChange={() => !disabled && onChange(option.value)}
                disabled={disabled}
                className="sr-only"
              />
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 transition-all",
                  "flex items-center justify-center",
                  value === option.value
                    ? "border-primary"
                    : "border-border"
                )}
              >
                {value === option.value && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-base font-medium">{option.label}</div>
              {option.description && (
                <div className="text-sm text-muted-foreground mt-1">
                  {option.description}
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

// Mobile form submit button with loading state
interface MobileSubmitButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'submit' | 'button';
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

export function MobileSubmitButton({
  children,
  loading,
  disabled,
  onClick,
  type = 'submit',
  variant = 'primary',
  fullWidth = true,
}: MobileSubmitButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "min-h-[48px] px-6 py-3",
        "font-medium text-base",
        "rounded-lg transition-all duration-200",
        "tap-highlight-transparent",
        "active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        fullWidth && "w-full",
        variant === 'primary' 
          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      )}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
          <span>처리 중...</span>
        </span>
      ) : children}
    </button>
  );
}