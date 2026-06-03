import { APP_NAME, APP_TAGLINE, BRAND_LOGO_PATH, COMPANY_NAME } from '@/lib/constants';

export function Header() {
  return (
    <header className="border-b border-border bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="shrink-0 rounded-lg border border-border bg-white px-3 py-2 shadow-sm" aria-label={COMPANY_NAME}>
            <img
              src={BRAND_LOGO_PATH}
              alt={COMPANY_NAME}
              className="h-9 w-auto max-w-[200px] object-contain sm:h-10"
              width={200}
              height={40}
            />
          </a>
          <div className="min-w-0 border-l border-border pl-4">
            <p className="text-xs font-medium uppercase tracking-wider text-accent">{COMPANY_NAME}</p>
            <h1 className="text-xl font-semibold text-primary sm:text-2xl">{APP_NAME}</h1>
            <p className="text-sm text-muted-foreground">{APP_TAGLINE}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
