import { APP_NAME, COMPANY_LOCATION, COMPANY_NAME } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-white/95 py-4 backdrop-blur-sm">
      <p className="text-center text-sm text-muted-foreground">
        {COMPANY_NAME} · {APP_NAME}
      </p>
      <p className="mt-1 text-center text-xs text-muted-foreground/80">{COMPANY_LOCATION}</p>
    </footer>
  );
}
