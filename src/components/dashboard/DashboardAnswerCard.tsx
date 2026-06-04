import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type DashboardAnswerCardProps = {
  label: string;
  answer: string;
  /** Lakh / crore shorthand shown under the main figure (e.g. "1.91 Cr"). */
  unitLabel?: string;
  tone?: string;
  onClick?: () => void;
};

/**
 * Stat card with a short label and prominent value. Optional click navigates to a detail page.
 */
export function DashboardAnswerCard({
  label,
  answer,
  unitLabel,
  tone,
  onClick,
}: DashboardAnswerCardProps) {
  const content = (
    <>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold ${tone ?? 'text-foreground'}`}>{answer}</p>
      {unitLabel && (
        <p className="text-sm font-medium text-muted-foreground">{unitLabel}</p>
      )}
      {onClick && (
        <p className="text-xs font-medium text-primary">Open page</p>
      )}
    </>
  );

  if (!onClick) {
    return (
      <Card className="border-border/80 bg-white/95">
        <CardContent className="space-y-1 p-4">{content}</CardContent>
      </Card>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border border-border/80 bg-white/95 text-left transition-all',
        'hover:border-primary/40 hover:bg-nav-yellow/25 hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-navy',
      )}
    >
      <div className="space-y-1 p-4">{content}</div>
    </button>
  );
}
