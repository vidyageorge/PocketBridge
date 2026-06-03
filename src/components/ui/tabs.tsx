import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'flex min-h-10 w-full flex-wrap items-center gap-1 overflow-visible rounded-xl border border-border bg-white/90 p-1.5 shadow-sm backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all',
        'bg-nav-yellow text-nav-yellow-foreground hover:brightness-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-navy',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:bg-nav-navy data-[state=active]:text-nav-navy-foreground data-[state=active]:shadow-sm data-[state=active]:hover:brightness-100',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn('mt-6 focus-visible:outline-none', className)}
      {...props}
    />
  );
}
