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
import type { ConsolidateOperation, Aggregation, AggregateFunction, SourceDefinition, DataSource } from '../../types/validation';

interface ConsolidateOperationEditorProps {
  operation: ConsolidateOperation;
  sources: SourceDefinition[];
  onChange: (operation: ConsolidateOperation) => void;
}

export function ConsolidateOperationEditor({
  operation,
  sources,
  onChange,
}: ConsolidateOperationEditorProps) {
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

  // Get all available columns from all sources
  const getAvailableColumns = (): string[] => {
    const allColumns: string[] = [];

    sources.forEach((source) => {
      // Use selected_columns if available, otherwise get all columns from datasource
      let columns: string[] = [];

      if (source.selected_columns && source.selected_columns.length > 0) {
        columns = source.selected_columns;
      } else {
        // Handle uploaded Excel datasources
        if (source.uploaded_datasource_id && source.selected_sheet) {
          const datasource = datasources.find(
            (ds) => ds.uploaded_datasource_id === source.uploaded_datasource_id
          );
          if (datasource?.sheets) {
            const sheet = datasource.sheets.find(
              (s) => s.sheet_name === source.selected_sheet
            );
            columns = sheet?.columns || [];
          }
        } else {
          // Handle connection-based datasources
          const datasource = datasources.find(
            (ds) =>
              ds.connection_id === source.connection_id &&
              (source.query.includes(ds.table_name || '') ||
                source.query.includes(ds.display_name))
          );
          columns = datasource?.columns || [];
        }
      }

      // Add columns with source prefix if multiple sources
      if (columns.length > 0) {
        if (sources.length > 1) {
          columns.forEach((col) => {
            allColumns.push(`${source.source_id}.${col}`);
          });
        } else {
          allColumns.push(...columns);
        }
      }
    });

    return [...new Set(allColumns)]; // Remove duplicates
  };

  const availableColumns = getAvailableColumns();
  const handleAddGroupBy = () => {
    onChange({
      ...operation,
      group_by: [...operation.group_by, ''],
    });
  };

  const handleRemoveGroupBy = (index: number) => {
    onChange({
      ...operation,
      group_by: operation.group_by.filter((_, i) => i !== index),
    });
  };

  const handleUpdateGroupBy = (index: number, value: string) => {
    const updatedGroupBy = [...operation.group_by];
    updatedGroupBy[index] = value;
    onChange({
      ...operation,
      group_by: updatedGroupBy,
    });
  };

  const handleAddAggregation = () => {
    const newAggregation: Aggregation = {
      field: '',
      function: 'sum',
      alias: '',
    };
    onChange({
      ...operation,
      aggregations: [...operation.aggregations, newAggregation],
    });
  };

  const handleRemoveAggregation = (index: number) => {
    onChange({
      ...operation,
      aggregations: operation.aggregations.filter((_, i) => i !== index),
    });
  };

  const handleUpdateAggregation = (
    index: number,
    field: keyof Aggregation,
    value: any
  ) => {
    const updatedAggregations = [...operation.aggregations];
    updatedAggregations[index] = {
      ...updatedAggregations[index],
      [field]: value,
    };
    onChange({
      ...operation,
      aggregations: updatedAggregations,
    });
  };

  return (
    <div className="space-y-6">
      {/* Group By Fields */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-semibold">Group By Fields</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddGroupBy}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Field
          </Button>
        </div>

        {operation.group_by.length === 0 && (
          <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded">
            No group by fields added yet
          </div>
        )}

        {operation.group_by.map((field, index) => (
          <div key={index} className="flex gap-2">
            {availableColumns.length > 0 ? (
              <Select
                value={field}
                onValueChange={(value) => handleUpdateGroupBy(index, value)}
              >
                <SelectTrigger className="flex-1">
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
                value={field}
                onChange={(e) => handleUpdateGroupBy(index, e.target.value)}
                placeholder="field_name"
                className="flex-1"
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveGroupBy(index)}
              className="h-10 w-10 p-0"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {/* Aggregations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-semibold">Aggregations</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddAggregation}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Aggregation
          </Button>
        </div>

        {operation.aggregations.length === 0 && (
          <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded">
            No aggregations added yet
          </div>
        )}

        {operation.aggregations.map((agg, index) => (
          <div key={index} className="flex gap-2 items-end">
            {/* Field */}
            <div className="flex-1 space-y-2">
              <Label className="text-xs">Field</Label>
              {availableColumns.length > 0 ? (
                <Select
                  value={agg.field}
                  onValueChange={(value) =>
                    handleUpdateAggregation(index, 'field', value)
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
                  value={agg.field}
                  onChange={(e) =>
                    handleUpdateAggregation(index, 'field', e.target.value)
                  }
                  placeholder="field_name"
                />
              )}
            </div>

            {/* Function */}
            <div className="w-[140px] space-y-2">
              <Label className="text-xs">Function</Label>
              <Select
                value={agg.function}
                onValueChange={(value: AggregateFunction) =>
                  handleUpdateAggregation(index, 'function', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sum">SUM</SelectItem>
                  <SelectItem value="avg">AVG</SelectItem>
                  <SelectItem value="min">MIN</SelectItem>
                  <SelectItem value="max">MAX</SelectItem>
                  <SelectItem value="count">COUNT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alias */}
            <div className="flex-1 space-y-2">
              <Label className="text-xs">Alias (Optional)</Label>
              <Input
                value={agg.alias || ''}
                onChange={(e) =>
                  handleUpdateAggregation(index, 'alias', e.target.value)
                }
                placeholder="result_name"
              />
            </div>

            {/* Remove Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveAggregation(index)}
              className="h-10 w-10 p-0"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {/* Preview */}
      {(operation.group_by.length > 0 || operation.aggregations.length > 0) && (
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
          <strong>Consolidate:</strong>
          {operation.group_by.length > 0 && (
            <div>Group by: {operation.group_by.join(', ')}</div>
          )}
          {operation.aggregations.length > 0 && (
            <div>
              Aggregations:{' '}
              {operation.aggregations.map((agg, i) => (
                <span key={i}>
                  {i > 0 && ', '}
                  {agg.function.toUpperCase()}({agg.field})
                  {agg.alias && ` as ${agg.alias}`}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
