import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Plus, Trash2 } from 'lucide-react';
import { AppliedOperation, Column, TRANSFORMATION_OPERATIONS } from '../types/deriveColumn';

interface OperationPanelProps {
  availableColumns: Column[];
  appliedOperations: AppliedOperation[];
  onOperationsChange: (operations: AppliedOperation[]) => void;
  isSourcePanel?: boolean; // To conditionally render column selector
  selectedColumn?: string;
  onColumnChange?: (columnId: string) => void;
}

export const OperationPanel: React.FC<OperationPanelProps> = ({
  availableColumns,
  appliedOperations,
  onOperationsChange,
  isSourcePanel = false,
  selectedColumn,
  onColumnChange,
}) => {
  const [opCategory, setOpCategory] = useState<'string' | 'arithmetic'>('string');

  const handleAddOperation = () => {
    const newOp: AppliedOperation = {
      id: `op-${Date.now()}`,
      operation_name: '',
      parameters: {},
      output_target: { mode: 'inplace' },
    };
    onOperationsChange([...appliedOperations, newOp]);
  };

  const handleUpdateOperation = (id: string, updates: Partial<AppliedOperation>) => {
    onOperationsChange(
      appliedOperations.map(op => (op.id === id ? { ...op, ...updates } : op))
    );
  };
  
  const handleParamChange = (opId: string, paramName: string, value: any) => {
    const op = appliedOperations.find(o => o.id === opId);
    if (op) {
      handleUpdateOperation(opId, { parameters: { ...op.parameters, [paramName]: value } });
    }
  };

  const handleRemoveOperation = (id: string) => {
    onOperationsChange(appliedOperations.filter(op => op.id !== id));
  };

  const filteredOperations = TRANSFORMATION_OPERATIONS.filter(op => op.category === opCategory);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-base">
          {isSourcePanel ? 'Source Value' : 'Expected Value'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        {isSourcePanel && onColumnChange && (
            <div className="mb-4">
                <Label>Source Column</Label>
                <Select value={selectedColumn} onValueChange={onColumnChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a source column..." />
                    </SelectTrigger>
                    <SelectContent>
                        {availableColumns.map(col => (
                            <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )}

        <div className="flex items-center justify-between mb-4">
            <ToggleGroup
              type="single"
              value={opCategory}
              onValueChange={(value: 'string' | 'arithmetic') => value && setOpCategory(value)}
              size="sm"
            >
              <ToggleGroupItem value="string" aria-label="String operations">S</ToggleGroupItem>
              <ToggleGroupItem value="arithmetic" aria-label="Arithmetic operations">A</ToggleGroupItem>
            </ToggleGroup>
            <Button variant="outline" size="sm" onClick={handleAddOperation}>
                <Plus className="mr-2 h-4 w-4" /> Add Op
            </Button>
        </div>


        <ScrollArea className="h-[300px] -mx-4 px-4">
          {appliedOperations.length === 0 && (
            <div className="text-center text-sm text-muted-foreground h-full flex items-center justify-center">
              No operations added.
            </div>
          )}
          {appliedOperations.map(op => (
            <div key={op.id} className="p-3 border rounded-md mb-3">
              <div className="flex items-center justify-between mb-2">
                <Select
                  value={op.operation_name}
                  onValueChange={opName => handleUpdateOperation(op.id, { operation_name: opName, parameters: {} })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an operation..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredOperations.map(def => (
                      <SelectItem key={def.name} value={def.name}>{def.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => handleRemoveOperation(op.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              
              {TRANSFORMATION_OPERATIONS.find(def => def.name === op.operation_name)?.parameters.map(param => (
                <div key={param.name} className="mt-2">
                  <Label className="text-xs">{param.label}</Label>
                  {param.type === 'text' && (
                    <Input
                      type="text"
                      value={op.parameters[param.name] || ''}
                      onChange={e => handleParamChange(op.id, param.name, e.target.value)}
                      placeholder={param.placeholder}
                    />
                  )}
                  {param.type === 'number' && (
                     <Input
                      type="number"
                      value={op.parameters[param.name] || ''}
                      onChange={e => handleParamChange(op.id, param.name, e.target.value)}
                      placeholder={param.placeholder}
                    />
                  )}
                  {param.type === 'checkbox' && (
                    <div className="flex items-center gap-2 mt-1">
                      <Checkbox
                        id={`${op.id}-${param.name}`}
                        checked={!!op.parameters[param.name]}
                        onCheckedChange={checked => handleParamChange(op.id, param.name, checked)}
                      />
                      <Label htmlFor={`${op.id}-${param.name}`} className="text-sm font-normal">{param.label}</Label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
