import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ADD_NEW_VALUE = '__add_new__';

type CreatableSelectProps = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  onAddOption: (label: string) => string | null;
  placeholder?: string;
  disabled?: boolean;
  addLabel?: string;
};

/**
 * Dropdown that lists saved options and lets the user add new ones for future use.
 */
export function CreatableSelect({
  id,
  value,
  onValueChange,
  options,
  onAddOption,
  placeholder = 'Select',
  disabled = false,
  addLabel = 'Add new…',
}: CreatableSelectProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const handleSelectChange = (selected: string) => {
    if (selected === ADD_NEW_VALUE) {
      setShowAddForm(true);
      setNewLabel('');
      setAddError(null);
      return;
    }
    setShowAddForm(false);
    onValueChange(selected);
  };

  const handleAdd = () => {
    const error = onAddOption(newLabel);
    if (error) {
      setAddError(error);
      return;
    }
    onValueChange(newLabel.trim());
    setShowAddForm(false);
    setNewLabel('');
    setAddError(null);
  };

  const displayValue = value && options.includes(value) ? value : value;

  return (
    <div className="space-y-2">
      <Select
        value={displayValue || undefined}
        onValueChange={handleSelectChange}
        disabled={disabled}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
          <SelectItem value={ADD_NEW_VALUE} className="font-medium text-primary">
            + {addLabel}
          </SelectItem>
        </SelectContent>
      </Select>

      {showAddForm && (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-3">
          <Input
            value={newLabel}
            onChange={(event) => {
              setNewLabel(event.target.value);
              setAddError(null);
            }}
            placeholder="New option name"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAdd();
              }
            }}
          />
          {addError && <p className="text-xs text-expense">{addError}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={handleAdd}>
              Save option
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setAddError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
