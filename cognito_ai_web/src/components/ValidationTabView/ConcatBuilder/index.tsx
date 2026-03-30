import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Column, ConcatPart } from '../types/deriveColumn';
import { Plus, Trash2 } from 'lucide-react';
import { ColumnSourceSelector } from '../ColumnSourceSelector';

interface ConcatBuilderProps {
  value: ConcatPart[];
  onChange: (value: ConcatPart[]) => void;
  availableColumns: Column[];
  selectedRowIndex: number;
}

export const ConcatBuilder: React.FC<ConcatBuilderProps> = ({
  value,
  onChange,
  availableColumns,
  selectedRowIndex,
}) => {
  const handleAddPart = () => {
    const newPart: ConcatPart = {
      id: `part-${Date.now()}`,
      type: 'manual',
      value: '',
    };
    onChange([...value, newPart]);
  };

  const handleUpdatePart = (id: string, updates: Partial<ConcatPart>) => {
    onChange(value.map(part => (part.id === id ? { ...part, ...updates } : part)));
  };

  const handleRemovePart = (id: string) => {
    onChange(value.filter(part => part.id !== id));
  };

  return (
    <div className="space-y-3 p-3 bg-background rounded-md border">
      {value.map(part => (
        <div key={part.id} className="space-y-2 p-2 border rounded-md relative">
            <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => handleRemovePart(part.id)}
            >
                <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
            <Select
                value={part.type}
                onValueChange={(type: 'manual' | 'column') => handleUpdatePart(part.id, { type, value: '', column_config: undefined })}
            >
                <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="manual">String Literal</SelectItem>
                    <SelectItem value="column">From Column</SelectItem>
                </SelectContent>
            </Select>

            {part.type === 'manual' ? (
                <Input
                    placeholder="Enter string..."
                    value={part.value || ''}
                    onChange={e => handleUpdatePart(part.id, { value: e.target.value })}
                />
            ) : (
                <ColumnSourceSelector
                    label="Source Column"
                    value={part.column_config!}
                    onChange={config => handleUpdatePart(part.id, { column_config: config })}
                    availableColumns={availableColumns}
                    selectedRowIndex={selectedRowIndex}
                />
            )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={handleAddPart} className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Add Part
      </Button>
    </div>
  );
};
