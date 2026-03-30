import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Button } from '../ui/button';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '../ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { TRANSFORMATION_OPERATIONS } from '../types/deriveColumn';
import { OperationCategory } from '../types/validation';

interface OperationSelectProps {
  value: string;
  onChange: (value: string) => void;
  category: OperationCategory;
}

export const OperationSelect: React.FC<OperationSelectProps> = ({ value, onChange, category }) => {
  const [open, setOpen] = React.useState(false);
  const filteredOperations = TRANSFORMATION_OPERATIONS.filter(op => op.category === category);
  const selectedOperation: any = filteredOperations.find(op => op.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto"
        >
          {selectedOperation ? (
            <div className="text-left">
              <p className="font-semibold">{selectedOperation.label}</p>
              <p className="text-xs text-muted-foreground">{selectedOperation.description}</p>
            </div>
          ) : (
            "Select operation..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search operation..." />
          <CommandList>
            <CommandEmpty>No operation found.</CommandEmpty>
            <CommandGroup>
              {filteredOperations.map((op: any) => (
                <CommandItem
                  key={op.name}
                  value={op.name}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === op.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="text-left">
                    <p>{op.label}</p>
                    <p className="text-xs text-muted-foreground">{op.description}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
