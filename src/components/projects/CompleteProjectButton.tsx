import { useState } from 'react';
import { useClientPayments } from '@/context/ClientPaymentContext';
import { Button } from '@/components/ui/button';

type CompleteProjectButtonProps = {
  sheetProject: string;
  onCompleted?: () => void;
};

export function CompleteProjectButton({ sheetProject, onCompleted }: CompleteProjectButtonProps) {
  const { completeProject } = useClientPayments();
  const [error, setError] = useState('');

  const handleComplete = () => {
    const confirmed = window.confirm(
      `Mark ${sheetProject} as completed? It will move to Project History and no longer appear in the active project list.`,
    );
    if (!confirmed) {
      return;
    }

    const message = completeProject(sheetProject);
    if (message) {
      setError(message);
      return;
    }

    setError('');
    onCompleted?.();
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="outline" onClick={handleComplete}>
        Mark as completed
      </Button>
      {error && <p className="text-sm text-expense">{error}</p>}
    </div>
  );
}
