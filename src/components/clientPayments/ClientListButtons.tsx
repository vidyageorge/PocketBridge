import { getClientList } from '@/lib/clientPayment';
import { useClientPayments } from '@/context/ClientPaymentContext';
import { cn } from '@/lib/utils';

type ClientListButtonsProps = {
  selectedClient: string;
  onClientChange: (clientName: string) => void;
};

/**
 * Client picker buttons for the Clients sub-view.
 */
export function ClientListButtons({ selectedClient, onClientChange }: ClientListButtonsProps) {
  const { records, registry } = useClientPayments();
  const clients = getClientList(records, registry);

  if (clients.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add a client below or upload the client payments workbook.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {clients.map((client) => {
        const isActive = selectedClient === client.clientName;
        return (
          <button
            key={client.clientName}
            type="button"
            onClick={() => onClientChange(client.clientName)}
            className={cn(
              'rounded-sm px-3 py-1.5 text-sm font-medium transition-all',
              'bg-nav-yellow text-nav-yellow-foreground hover:brightness-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-navy',
              isActive && 'bg-nav-navy text-nav-navy-foreground shadow-sm hover:brightness-100',
            )}
          >
            {client.clientName}
          </button>
        );
      })}
    </div>
  );
}
