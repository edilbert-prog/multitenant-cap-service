import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useDataSources, useUploadedDatasources } from '../../api/validation/hooks';
import type { FilterOperation, FilterCondition, FilterOperator, LogicOperator, SourceDefinition, DataSource } from '../../types/validation';

interface FilterOperationEditorProps {
  operation: FilterOperation;
  sources: SourceDefinition[];
  availableSources: string[]; // source_ids that can be referenced
  previousOperations: any[]; // Operations before this one
  onChange: (operation: FilterOperation) => void;
}

export function FilterOperationEditor({
  operation,
  sources,
  availableSources,
  previousOperations,
  onChange,
}: FilterOperationEditorProps) {
  // Check if this is the first operation in pipeline
  const isFirstOperation = previousOperations.length === 0;
  const { data: regularDatasources = [] } = useDataSources();
  const { data: uploadedDatasources = [] } = useUploadedDatasources();

  // Merge uploaded Excel datasources with regular datasources
  const datasources: DataSource[] = [
    ...regularDatasources,
    ...uploadedDatasources.map(ud => ({
      id: `uploaded_${ud.datasource_id}`,
      display_name: ud.datasource_name,
      connection_id: -1,
      connection_name: 'Uploaded Excel',
      source_type: 'excel' as const,
      database_name: ud.filename,
      table_name: '',
      columns: [],
      uploaded_datasource_id: ud.datasource_id,
      sheets: ud.sheet_metadata,
    })),
  ];

  // Get all available columns from selected source or previous operation
  const getAvailableColumns = (): string[] => {
    // If first operation, get columns from selected source
    if (isFirstOperation && operation.source_id) {
      const source = sources.find(s => s.source_id === operation.source_id);
      if (!source) return [];

      // Use selected_columns if available
      if (source.selected_columns && source.selected_columns.length > 0) {
        return source.selected_columns;
      }

      // Handle uploaded Excel datasources
      if (source.uploaded_datasource_id) {
        const datasource = datasources.find(
          (ds) => ds.uploaded_datasource_id === source.uploaded_datasource_id
        );
        return datasource?.columns || [];
      }

      // Handle connection-based datasources
      const datasource = datasources.find(
        (ds) =>
          ds.connection_id === source.connection_id &&
          (source.query?.includes(ds.table_name || '') ||
            source.query?.includes(ds.display_name))
      );
      return datasource?.columns || [];
    }

    // If not first operation, get columns from previous operation
    // For now, get from all sources (will be improved when JOIN/MAP support is added)
    const allColumns: string[] = [];

    sources.forEach((source) => {
      // Use selected_columns if available, otherwise get all columns from datasource
      let columns: string[] = [];

      if (source.selected_columns && source.selected_columns.length > 0) {
        columns = source.selected_columns;
      } else {
        // Handle uploaded Excel datasources
        if (source.uploaded_datasource_id) {
          const datasource = datasources.find(
            (ds) => ds.uploaded_datasource_id === source.uploaded_datasource_id
          );
          columns = datasource?.columns || [];
        } else {
          // Handle connection-based datasources
          const datasource = datasources.find(
            (ds) =>
              ds.connection_id === source.connection_id &&
              (source.query?.includes(ds.table_name || '') ||
                source.query?.includes(ds.display_name))
          );
          columns = datasource?.columns || [];
        }
      }

      // Add columns
      if (columns.length > 0) {
        allColumns.push(...columns);
      }
    });

    return [...new Set(allColumns)]; // Remove duplicates
  };

  const availableColumns = getAvailableColumns();
  const handleAddCondition = () => {
    const newCondition: FilterCondition = {
      field: '',
      operator: 'equals',
      value: '',
    };
    onChange({
      ...operation,
      conditions: [...operation.conditions, newCondition],
    });
  };

  const handleRemoveCondition = (index: number) => {
    onChange({
      ...operation,
      conditions: operation.conditions.filter((_, i) => i !== index),
    });
  };

  const handleUpdateCondition = (
    index: number,
    field: keyof FilterCondition,
    value: any
  ) => {
    const updatedConditions = [...operation.conditions];
    updatedConditions[index] = {
      ...updatedConditions[index],
      [field]: value,
    };
    onChange({
      ...operation,
      conditions: updatedConditions,
    });
  };

  const handleLogicChange = (logic: LogicOperator) => {
    onChange({
      ...operation,
      logic,
    });
  };

  return (
    <div className="space-y-4">
      {/* Source Selector (only if first operation) */}
      {isFirstOperation && (
        <div className="space-y-2">
          <Label>Source</Label>
          <Select
            value={operation.source_id || ''}
            onValueChange={(value) => onChange({ ...operation, source_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select source to filter..." />
            </SelectTrigger>
            <SelectContent>
              {availableSources.map((sourceId) => (
                <SelectItem key={sourceId} value={sourceId}>
                  {sourceId.replace('source_', 'Source ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select which source to apply the filter to
          </p>
        </div>
      )}

      {/* Output Name */}
      <div className="space-y-2">
        <Label htmlFor="output_name">Output Name (Optional)</Label>
        <Input
          id="output_name"
          value={operation.output_name || ''}
          onChange={(e) => onChange({ ...operation, output_name: e.target.value })}
          placeholder="e.g., filtered_orders (leave empty to use 'result')"
        />
        <p className="text-xs text-muted-foreground">
          Name this result so you can reference it in subsequent operations
        </p>
      </div>

      {/* Logic Operator */}
      <div className="flex items-center gap-4">
        <Label>Combine conditions with:</Label>
        <Select value={operation.logic} onValueChange={handleLogicChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="and">AND</SelectItem>
            <SelectItem value="or">OR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conditions List */}
      {operation.conditions.length === 0 && (
        <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded">
          No filter conditions added yet
        </div>
      )}

      <div className="space-y-3">
        {operation.conditions.map((condition, index) => (
          <div key={index} className="flex gap-2 items-end">
            {/* Field */}
            <div className="flex-1 space-y-2">
              <Label className="text-xs">Field</Label>
              {availableColumns.length > 0 ? (
                <Select
                  value={condition.field}
                  onValueChange={(value) =>
                    handleUpdateCondition(index, 'field', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={condition.field}
                  onChange={(e) =>
                    handleUpdateCondition(index, 'field', e.target.value)
                  }
                  placeholder="field_name"
                />
              )}
            </div>

            {/* Operator */}
            <div className="w-[160px] space-y-2">
              <Label className="text-xs">Operator</Label>
              <Select
                value={condition.operator}
                onValueChange={(value: FilterOperator) =>
                  handleUpdateCondition(index, 'operator', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="not_equals">Not Equals</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="not_contains">Not Contains</SelectItem>
                  <SelectItem value="gt">Greater Than</SelectItem>
                  <SelectItem value="gte">Greater or Equal</SelectItem>
                  <SelectItem value="lt">Less Than</SelectItem>
                  <SelectItem value="lte">Less or Equal</SelectItem>
                  <SelectItem value="in">In List</SelectItem>
                  <SelectItem value="not_in">Not In List</SelectItem>
                  <SelectItem value="is_null">Is Null</SelectItem>
                  <SelectItem value="is_not_null">Is Not Null</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Value (hide for null checks) */}
            {!['is_null', 'is_not_null'].includes(condition.operator) && (
              <div className="flex-1 space-y-2">
                <Label className="text-xs">Value</Label>
                <Input
                  value={condition.value}
                  onChange={(e) =>
                    handleUpdateCondition(index, 'value', e.target.value)
                  }
                  placeholder="value"
                />
              </div>
            )}

            {/* Remove Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveCondition(index)}
              className="h-10 w-10 p-0"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add Condition Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddCondition}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Condition
      </Button>

      {/* Preview */}
      {operation.conditions.length > 0 && (
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
          <strong>Filter:</strong>{' '}
          {operation.conditions.map((c, i) => (
            <span key={i}>
              {i > 0 && ` ${operation.logic.toUpperCase()} `}
              {c.field} {c.operator} {!['is_null', 'is_not_null'].includes(c.operator) && c.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
