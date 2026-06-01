import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: 'bank' | 'cash' | 'income' | 'expense' | 'default';
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant === 'bank' && 'bg-primary/10 text-primary',
        variant === 'cash' && 'bg-accent/10 text-accent',
        variant === 'income' && 'bg-green-100 text-income',
        variant === 'expense' && 'bg-red-100 text-expense',
        variant === 'default' && 'bg-muted text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}
