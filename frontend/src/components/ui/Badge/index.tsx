import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  pill?: boolean;
  dot?: boolean;
  dotColor?: string;
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800',
  primary: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-cyan-100 text-cyan-800',
  outline: 'bg-transparent border border-gray-300 text-gray-700',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({
  variant = 'default',
  size = 'md',
  pill = false,
  dot = false,
  dotColor,
  className = '',
  children,
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center font-medium';
  const roundedClass = pill ? 'rounded-full' : 'rounded-md';
  
  const badgeClasses = twMerge(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    roundedClass,
    className
  );

  const dotColorClass = dotColor || variantClasses[variant].split(' ')[0].replace('bg-', 'text-');

  return (
    <span
      ref={ref}
      className={badgeClasses}
      {...props}
    >
      {dot && (
        <svg
          className={`-ml-0.5 mr-1.5 h-2 w-2 ${dotColorClass}`}
          fill="currentColor"
          viewBox="0 0 8 8"
        >
          <circle cx="4" cy="4" r="3" />
        </svg>
      )}
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;
