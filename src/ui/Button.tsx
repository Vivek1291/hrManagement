import React from 'react';
import type { BadgeColor } from '../types';
import { cn } from './cn';

export type ButtonVariant = 'default' | 'primary' | 'danger' | 'ghost' | 'ghost-danger';

const BASE =
  'hrm:inline-flex hrm:items-center hrm:justify-center hrm:gap-1.5 hrm:rounded-lg hrm:border hrm:font-medium hrm:whitespace-nowrap hrm:transition-colors hrm:disabled:opacity-60 hrm:focus-visible:outline-2 hrm:focus-visible:outline-offset-2 hrm:focus-visible:outline-primary';

const VARIANTS: Record<ButtonVariant, string> = {
  default: 'hrm:border-border hrm:bg-surface hrm:text-fg hrm:hover:bg-bg',
  primary: 'hrm:border-primary hrm:bg-primary hrm:text-primary-fg hrm:hover:bg-primary/90',
  danger: 'hrm:border-danger/40 hrm:bg-surface hrm:text-danger hrm:hover:bg-danger/5',
  ghost: 'hrm:border-transparent hrm:bg-transparent hrm:text-muted hrm:hover:bg-bg hrm:hover:text-fg',
  'ghost-danger': 'hrm:border-transparent hrm:bg-transparent hrm:text-muted hrm:hover:bg-danger/5 hrm:hover:text-danger',
};

const SIZES = {
  sm: 'hrm:px-2.5 hrm:py-1 hrm:text-[13px]',
  md: 'hrm:px-3.5 hrm:py-2 hrm:text-sm',
  icon: 'hrm:size-8 hrm:p-0',
};

export function buttonClass(variant: ButtonVariant = 'default', size: keyof typeof SIZES = 'md', extra?: string) {
  return cn(BASE, VARIANTS[variant], SIZES[size], extra);
}

export function Button({
  variant = 'default',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: keyof typeof SIZES }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

export const BADGE_COLORS: Record<BadgeColor, string> = {
  gray: 'hrm:bg-gray-100 hrm:text-gray-700',
  green: 'hrm:bg-emerald-100 hrm:text-emerald-800',
  red: 'hrm:bg-red-100 hrm:text-red-800',
  yellow: 'hrm:bg-amber-100 hrm:text-amber-800',
  blue: 'hrm:bg-blue-100 hrm:text-blue-800',
  purple: 'hrm:bg-violet-100 hrm:text-violet-800',
};

export function Badge({ color = 'gray', children }: { color?: BadgeColor; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'hrm:inline-block hrm:rounded-full hrm:px-2.5 hrm:py-0.5 hrm:text-xs hrm:font-semibold hrm:capitalize hrm:whitespace-nowrap',
        BADGE_COLORS[color] ?? BADGE_COLORS.gray,
      )}
    >
      {children}
    </span>
  );
}

export const inputClass =
  'hrm:w-full hrm:rounded-lg hrm:border hrm:border-border hrm:bg-surface hrm:px-3 hrm:py-2 hrm:text-fg hrm:outline-none hrm:transition-shadow hrm:focus:border-primary hrm:focus:ring-2 hrm:focus:ring-primary/25 hrm:aria-invalid:border-danger';

/** Fixed height for single-line inputs and selects so filters line up. */
export const controlHeight = 'hrm:h-10';

export const cardClass = 'hrm:rounded-card hrm:border hrm:border-border hrm:bg-surface hrm:overflow-hidden';
