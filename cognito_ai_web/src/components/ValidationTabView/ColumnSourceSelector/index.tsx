import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Column, ColumnSourceConfig } from '../types/deriveColumn';
import { Card, CardContent } from '../ui/card';

interface ColumnSourceSelectorProps {
  label: string;
  value: ColumnSourceConfig;
  onChange: (value: ColumnSourceConfig) => void;
  availableColumns: Column[];
  selectedRowIndex: number;
}

export const ColumnSourceSelector: React.FC<ColumnSourceSelectorProps> = ({
  label,
  value,
  onChange,
  availableColumns,
  selectedRowIndex,
}) => {
  const handleModeChange = (newMode: 'full' | 'substring') => {
    onChange({ ...value, source_mode: newMode });
  };

  const handleColumnChange = (columnId: string) => {
    onChange({ ...value, column_id: columnId });
  };

  const handleRangeChange = (field: 'start' | 'end', fieldValue: number | undefined) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const handleAffixChange = (field: 'prefix' | 'suffix', fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const selectedColumn = availableColumns.find(c => c.id === value?.column_id);
  const previewText = selectedColumn?.sampleData?.[selectedRowIndex] || 'No column selected';

  return (
    <Card className="bg-background p-3">
      <CardContent className="p-0 space-y-3">
        <Label>{label}</Label>
        <Select value={value?.column_id} onValueChange={handleColumnChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select source column..." />
          </SelectTrigger>
          <SelectContent>
            {availableColumns.map(col => (
              <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedColumn && (
          <>
            <div className="flex items-center gap-2">
                <Label className="text-xs">Mode:</Label>
                <Select value={value?.source_mode || 'full'} onValueChange={handleModeChange}>
                    <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="full">Full Value</SelectItem>
                        <SelectItem value="substring">Substring</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            {value?.source_mode === 'substring' && (
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Start" value={value.start ?? ''} onChange={e => handleRangeChange('start', e.target.valueAsNumber)} />
                <Input type="number" placeholder="End" value={value.end ?? ''} onChange={e => handleRangeChange('end', e.target.valueAsNumber)} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Prefix" value={value.prefix ?? ''} onChange={e => handleAffixChange('prefix', e.target.value)} />
              <Input placeholder="Suffix" value={value.suffix ?? ''} onChange={e => handleAffixChange('suffix', e.target.value)} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
