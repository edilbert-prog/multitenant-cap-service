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
import { Checkbox } from '../ui/checkbox';
import { useDataSources, useUploadedDatasources } from '../../api/validation/hooks';
import type {
  DeduplicateOperation,
  DeduplicationStrategyType,
  SourceDefinition,
  DataSource,
} from '../../types/validation';

interface DeduplicateOperationEditorProps {
  operation: DeduplicateOperation;
  sources: SourceDefinition[];
  availableSources: string[]; // source_ids that can be referenced
  previousOperations: any[]; // Operations before this one
  onChange: (operation: DeduplicateOperation) => void;
}

export function DeduplicateOperationEditor({
  operation,
  sources,
  availableSources,
  previousOperations,
  onChange,
}: DeduplicateOperationEditorProps) {
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

  const handleStrategyChange = (strategy: DeduplicationStrategyType) => {
    onChange({
      ...operation,
      strategy,
    });
  };

  const handleToggleKey = (columnName: string) => {
    const currentKeys = operation.keys || [];
    const isSelected = currentKeys.includes(columnName);

    if (isSelected) {
      onChange({
        ...operation,
        keys: currentKeys.filter(k => k !== columnName),
      });
    } else {
      onChange({
        ...operation,
        keys: [...currentKeys, columnName],
      });
    }
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
              <SelectValue placeholder="Select source to deduplicate..." />
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
            Select which source to remove duplicates from
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
          placeholder="e.g., deduplicated_customers (leave empty to use 'result')"
        />
        <p className="text-xs text-muted-foreground">
          Name this result so you can reference it in subsequent operations
        </p>
      </div>

      {/* Strategy Selection */}
      <div className="space-y-2">
        <Label>Deduplication Strategy</Label>
        <Select
          value={operation.strategy || 'first'}
          onValueChange={handleStrategyChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="first">Keep First Occurrence</SelectItem>
            <SelectItem value="last">Keep Last Occurrence</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {operation.strategy === 'last'
            ? 'When duplicates are found, keep the last occurrence'
            : 'When duplicates are found, keep the first occurrence'}
        </p>
      </div>

      {/* Key Columns Selection */}
      <div className="space-y-2">
        <Label>Key Columns</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Select columns that identify duplicate rows (e.g., email, customer_id)
        </p>

        {availableColumns.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded">
            No columns available. Please select a source first.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
            {availableColumns.map((col) => (
              <div key={col} className="flex items-center space-x-2">
                <Checkbox
                  id={`key-${col}`}
                  checked={(operation.keys || []).includes(col)}
                  onCheckedChange={() => handleToggleKey(col)}
                />
                <label
                  htmlFor={`key-${col}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {col}
                </label>
              </div>
            ))}
          </div>
        )}

        {(operation.keys || []).length === 0 && availableColumns.length > 0 && (
          <p className="text-xs text-orange-600">
            ⚠️ Please select at least one key column
          </p>
        )}
      </div>

      {/* Preview */}
      {(operation.keys || []).length > 0 && (
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
          <strong>Deduplicate:</strong> Remove duplicates based on{' '}
          <span className="font-mono">
            [{operation.keys.join(', ')}]
          </span>
          , keeping <span className="font-semibold">{operation.strategy || 'first'}</span> occurrence
        </div>
      )}
    </div>
  );
}
