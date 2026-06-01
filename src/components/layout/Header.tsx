import { Landmark, Wallet } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-primary/10 p-2">
            <Landmark className="h-5 w-5 text-primary" aria-hidden="true" />
            <Wallet className="h-5 w-5 text-accent" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-primary sm:text-2xl">PocketBridge</h1>
            <p className="text-sm text-muted-foreground">
              Bank and cash — income and expenses in one place
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
