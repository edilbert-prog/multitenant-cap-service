import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { X } from 'lucide-react';
import { AppliedOperation, Column, TRANSFORMATION_OPERATIONS } from '../types/deriveColumn';
import { ColumnSourceSelector } from '../ColumnSourceSelector';
import { ConcatBuilder } from '../ConcatBuilder';
import { OperationCategory } from '../types/sapValidation';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { OperationSelect } from '../OperationSelect';



interface OperationBlockProps {
  operation: AppliedOperation;
  onDelete: (id: string) => void;
  onUpdate: (id: string, newOpData: Partial<AppliedOperation>) => void;
  availableColumns: Column[];
  selectedRowIndex: number;
  operationCategory: OperationCategory;
  isReadOnly?: boolean;
}

export const OperationBlock: React.FC<OperationBlockProps> = ({
  operation,
  onDelete,
  onUpdate,
  availableColumns,
  selectedRowIndex,
  operationCategory,
  isReadOnly = false,
}) => {
  const opDef = TRANSFORMATION_OPERATIONS.find(o => o.name === operation.operation_name);

  const handleParamChange = (paramName: string, value: any) => {
    if (isReadOnly) return;
    onUpdate(operation.id, {
      parameters: { ...operation.parameters, [paramName]: value },
    });
  };

  const renderParameterInput = (param: any) => {
    const value = operation.parameters[param.name];

    switch (param.type) {
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id={`${operation.id}-${param.name}`}
              checked={!!value}
              onCheckedChange={(checked) => handleParamChange(param.name, !!checked)}
              disabled={isReadOnly}
            />
            <Label htmlFor={`${operation.id}-${param.name}`}>{param.label}</Label>
          </div>
        );
      case 'column_source':
        return (
            <ColumnSourceSelector
                label={param.label}
                value={value}
                onChange={(newValue: any) => handleParamChange(param.name, newValue)}
                availableColumns={availableColumns}
                selectedRowIndex={selectedRowIndex}
            />
        );
      case 'concat-builder':
        return (
            <ConcatBuilder
                value={value || []}
                onChange={(newValue: any) => handleParamChange(param.name, newValue)}
                availableColumns={availableColumns}
                selectedRowIndex={selectedRowIndex}
            />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleParamChange(param.name, e.target.valueAsNumber)}
            placeholder={param.placeholder}
            disabled={isReadOnly}
          />
        );
      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            placeholder={param.placeholder}
            disabled={isReadOnly}
          />
        );
    }
  };

  return (
    <Card className="bg-background/50">
      <CardContent className="p-3 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-grow">
            <Label className="text-xs">Select Operation</Label>
            <OperationSelect
                value={operation.operation_name}
                onChange={(opName) => onUpdate(operation.id, { operation_name: opName, parameters: {} })}
                category={operationCategory}
                disabled={isReadOnly}
            />
          </div>
          {!isReadOnly && (
            <Button variant="ghost" size="icon" className="h-8 w-8 mt-4" onClick={() => onDelete(operation.id)}>
                <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {opDef && opDef.parameters.length > 0 && (
            <>
                <Separator />
                <div className="space-y-3">
                    {opDef.parameters.map((param) => (
                    <div key={param.name}>
                        {param.type !== 'checkbox' && <Label className="text-xs mb-1 block">{param.label}</Label>}
                        {renderParameterInput(param)}
                    </div>
                    ))}
                </div>
            </>
        )}
        {opDef && opDef.parameters.length === 0 && !['sum', 'count', 'max', 'min'].includes(opDef.name) && (
            <p className="text-sm text-muted-foreground text-center py-4">This operation takes no parameters.</p>
        )}
      </CardContent>
    </Card>
  );
};
