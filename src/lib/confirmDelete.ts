/**
 * Two-step delete confirmation used app-wide before removing data.
 */
export function confirmDeleteEntry(summary: string): boolean {
  const firstStep = window.confirm(`Delete this entry?\n\n${summary}`);
  if (!firstStep) {
    return false;
  }

  return window.confirm('This cannot be undone. Permanently delete this entry?');
}

/**
 * Two-step confirmation before bulk delete.
 */
export function confirmDeleteAll(count: number, itemLabel: string): boolean {
  const firstStep = window.confirm(
    `Delete all ${count} ${itemLabel}?\n\nYou are about to remove every row in this list.`,
  );
  if (!firstStep) {
    return false;
  }

  return window.confirm('This cannot be undone. Permanently delete all of them?');
}
