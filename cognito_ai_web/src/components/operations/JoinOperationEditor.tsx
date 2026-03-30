import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useDataSources, useUploadedDatasources } from '../../api/validation/hooks';
import type { JoinOperation, JoinType, SourceDefinition, TransformOperation, DataSource } from '../../types/validation';

interface JoinOperationEditorProps {
  operation: JoinOperation;
  availableSources: string[]; // source_ids
  sources: SourceDefinition[]; // Full source definitions to extract table names
  previousOperations: TransformOperation[]; // Previous operations to calculate their output columns
  validationId: number; // Required for validation-scoped datasources
  onChange: (operation: JoinOperation) => void;
}

export function JoinOperationEditor({
  operation,
  availableSources,
  sources,
  previousOperations,
  validationId,
  onChange,
}: JoinOperationEditorProps) {
  const { data: regularDatasources = [] } = useDataSources();
  const { data: uploadedDatasources = [] } = useUploadedDatasources(validationId);

  console.log('[JoinOperationEditor] validationId:', validationId);
  console.log('[JoinOperationEditor] uploadedDatasources:', uploadedDatasources);

  // Merge uploaded Excel datasources with regular datasources
  const datasources: DataSource[] = [
    ...regularDatasources,
    ...uploadedDatasources.map(ud => {
      console.log('[JoinOperationEditor] Mapping uploaded datasource:', {
        datasource_id: ud.datasource_id,
        datasource_name: ud.datasource_name,
        columns: ud.columns,
        column_count: ud.columns?.length || 0,
      });
      return {
        id: `uploaded_${ud.datasource_id}`,
        display_name: ud.datasource_name,
        connection_id: -1,
        connection_name: 'Uploaded Excel',
        source_type: 'excel' as const,
        database_name: ud.filename,
        table_name: ud.temp_table_name, // MySQL temp table
        columns: ud.columns || [], // ✅ Use columns from API response
        uploaded_datasource_id: ud.datasource_id,
      };
    }),
  ];

  const handleUpdate = (field: keyof JoinOperation, value: any) => {
    onChange({
      ...operation,
      [field]: value,
    });
  };

  const handleConditionUpdate = (field: 'left_key' | 'right_key', value: string) => {
    onChange({
      ...operation,
      condition: {
        ...operation.condition,
        [field]: value,
      },
    });
  };

  // Get available columns for a given source_id
  const getColumnsForSource = (sourceId: string): string[] => {
    if (sourceId === 'result') {
      // For 'result', try to find the last operation's output
      if (previousOperations.length > 0) {
        const lastOp = previousOperations[previousOperations.length - 1];
        return getOperationOutputColumns(lastOp);
      }
      return [];
    }

    // Check if sourceId matches a previous operation's output_name
    const matchingOperation = previousOperations.find(
      (op) => 'output_name' in op && op.output_name === sourceId
    );

    if (matchingOperation) {
      return getOperationOutputColumns(matchingOperation);
    }

    // Find the source definition
    const sourceDef = sources.find((s) => s.source_id === sourceId);
    if (!sourceDef) return [];

    // If the source has selected_columns defined, use those instead of all columns
    if (sourceDef.selected_columns && sourceDef.selected_columns.length > 0) {
      return sourceDef.selected_columns;
    }

    // Handle uploaded Excel datasources (temp table architecture)
    if (sourceDef.uploaded_datasource_id) {
      const datasource = datasources.find(
        (ds) => ds.uploaded_datasource_id === sourceDef.uploaded_datasource_id
      );

      // Columns will be fetched from the temp table
      return datasource?.columns || [];
    }

    // Otherwise, get all columns from connection-based datasource
    const datasource = datasources.find(
      (ds) =>
        ds.connection_id === sourceDef.connection_id &&
        (sourceDef.query.includes(ds.table_name || '') ||
          sourceDef.query.includes(ds.display_name))
    );

    return datasource?.columns || [];
  };

  // Calculate what columns an operation produces
  const getOperationOutputColumns = (op: TransformOperation): string[] => {
    switch (op.operation) {
      case 'join':
        const joinOp = op as JoinOperation;
        const leftCols = getColumnsForSource(joinOp.left);
        const rightCols = getColumnsForSource(joinOp.right);

        // Apply column selection if specified
        const selectedLeftCols = joinOp.left_columns && joinOp.left_columns.length > 0
          ? joinOp.left_columns
          : leftCols;
        const selectedRightCols = joinOp.right_columns && joinOp.right_columns.length > 0
          ? joinOp.right_columns
          : rightCols;

        return [...selectedLeftCols, ...selectedRightCols];

      case 'map':
        // Map operations pass through ALL input columns + add new ones
        const mapOp = op as any; // MapOperation type

        // Get input columns (from previous operation or sources)
        let inputColumns: string[] = [];
        if (previousOperations.length > 0) {
          const previousOp = previousOperations[previousOperations.indexOf(op) - 1];
          if (previousOp) {
            inputColumns = getOperationOutputColumns(previousOp);
          }
        }
        if (inputColumns.length === 0) {
          // First operation - get from sources
          inputColumns = sources.flatMap(s => s.selected_columns || []);
        }

        // Add target fields from mappings
        const outputColumns = new Set(inputColumns);
        if (mapOp.mappings && Array.isArray(mapOp.mappings)) {
          mapOp.mappings.forEach((mapping: any) => {
            if (mapping.target_field) {
              outputColumns.add(mapping.target_field);
            }
          });
        }

        return Array.from(outputColumns);

      case 'filter':
        // Filter operations pass through all input columns unchanged
        // Get columns from the previous operation in the pipeline
        if (previousOperations.length > 0) {
          const lastPreviousOp = previousOperations[previousOperations.length - 1];
          return getOperationOutputColumns(lastPreviousOp);
        }
        // If first operation, get from sources
        return sources.flatMap(s => s.selected_columns || []);

      case 'lookup':
        // Lookup operations pass through all input columns unchanged (just filters rows)
        const lookupOp = op as any; // LookupOperation type

        // If lookup has source_id (first operation), get columns from that source
        if (lookupOp.source_id) {
          return getColumnsForSource(lookupOp.source_id);
        }

        // Otherwise, get from previous operation
        if (previousOperations.length > 0) {
          const lastPreviousOp = previousOperations[previousOperations.length - 1];
          return getOperationOutputColumns(lastPreviousOp);
        }

        // Fallback: get from sources
        return sources.flatMap(s => s.selected_columns || []);

      // For other operations (consolidate, sort), return empty for now
      default:
        return [];
    }
  };

  const leftColumns = getColumnsForSource(operation.left);
  const rightColumns = getColumnsForSource(operation.right);

  // Include 'result' as an option (output of previous operation)
  const sourceOptions = ['result', ...availableSources];

  // Validate that current values exist in available sources
  const isLeftValid = sourceOptions.includes(operation.left);
  const isRightValid = sourceOptions.includes(operation.right);

  // Handle column selection
  const handleColumnToggle = (side: 'left' | 'right', column: string) => {
    const field = side === 'left' ? 'left_columns' : 'right_columns';
    const availableColumns = side === 'left' ? leftColumns : rightColumns;

    // If undefined (SELECT *), convert to array of all columns first
    const current = operation[field] === undefined
      ? [...availableColumns]
      : operation[field];

    const updated = current.includes(column)
      ? current.filter((c) => c !== column)
      : [...current, column];

    // Keep as array even if empty - don't convert to undefined
    handleUpdate(field, updated);
  };

  const handleSelectAllColumns = (side: 'left' | 'right') => {
    const field = side === 'left' ? 'left_columns' : 'right_columns';
    const availableColumns = side === 'left' ? leftColumns : rightColumns;

    // If undefined or all columns selected, clear selection
    // Otherwise select all columns
    const allSelected = !operation[field] ||
                       operation[field].length === availableColumns.length;

    if (allSelected) {
      handleUpdate(field, []); // Empty array = none selected
    } else {
      handleUpdate(field, [...availableColumns]); // Array with all columns
    }
  };

  const isColumnSelected = (side: 'left' | 'right', column: string) => {
    const field = side === 'left' ? 'left_columns' : 'right_columns';
    const selected = operation[field];
    // undefined = all selected (SELECT *)
    if (!selected) return true;
    // Empty array = none selected
    if (selected.length === 0) return false;
    // Otherwise check if column is in the list
    return selected.includes(column);
  };

  return (
    <div className="space-y-4">
      {/* Output Name */}
      <div className="space-y-2">
        <Label htmlFor="output_name">Output Name (Optional)</Label>
        <Input
          id="output_name"
          value={operation.output_name || ''}
          onChange={(e) => handleUpdate('output_name', e.target.value)}
          placeholder="e.g., joined_employees (leave empty to use 'result')"
        />
        <p className="text-xs text-muted-foreground">
          Name this result so you can reference it in subsequent operations
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left Source */}
        <div className="space-y-2">
          <Label>Left Source</Label>
          <Select
            value={isLeftValid ? operation.left : ''}
            onValueChange={(value) => handleUpdate('left', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select source..." />
            </SelectTrigger>
            <SelectContent>
              {sourceOptions.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isLeftValid && operation.left && (
            <p className="text-xs text-destructive">
              Source "{operation.left}" not found. Please select a valid source.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Use "result" to reference output from previous operation
          </p>
        </div>

        {/* Right Source */}
        <div className="space-y-2">
          <Label>Right Source</Label>
          <Select
            value={isRightValid ? operation.right : ''}
            onValueChange={(value) => handleUpdate('right', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select source..." />
            </SelectTrigger>
            <SelectContent>
              {sourceOptions.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isRightValid && operation.right && (
            <p className="text-xs text-destructive">
              Source "{operation.right}" not found. Please select a valid source.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Join Type */}
        <div className="space-y-2">
          <Label>Join Type</Label>
          <Select
            value={operation.join_type}
            onValueChange={(value: JoinType) => handleUpdate('join_type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inner">Inner Join</SelectItem>
              <SelectItem value="left">Left Join</SelectItem>
              <SelectItem value="right">Right Join</SelectItem>
              <SelectItem value="outer">Outer Join</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Left Key */}
        <div className="space-y-2">
          <Label>Left Key Field</Label>
          {leftColumns.length > 0 ? (
            <Select
              value={operation.condition.left_key}
              onValueChange={(value) => handleConditionUpdate('left_key', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select field..." />
              </SelectTrigger>
              <SelectContent>
                {leftColumns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={operation.condition.left_key}
              onChange={(e) => handleConditionUpdate('left_key', e.target.value)}
              placeholder="e.g., employee_id"
            />
          )}
          {leftColumns.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Select a source to see available fields
            </p>
          )}
        </div>

        {/* Right Key */}
        <div className="space-y-2">
          <Label>Right Key Field</Label>
          {rightColumns.length > 0 ? (
            <Select
              value={operation.condition.right_key}
              onValueChange={(value) => handleConditionUpdate('right_key', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select field..." />
              </SelectTrigger>
              <SelectContent>
                {rightColumns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={operation.condition.right_key}
              onChange={(e) => handleConditionUpdate('right_key', e.target.value)}
              placeholder="e.g., emp_id"
            />
          )}
          {rightColumns.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Select a source to see available fields
            </p>
          )}
        </div>
      </div>

      {/* Column Selection */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left Columns */}
        {leftColumns.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Left Columns (Optional)</Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => handleSelectAllColumns('left')}
                className="h-auto p-0 text-xs"
              >
                {(!operation.left_columns ||
                  operation.left_columns.length === leftColumns.length)
                  ? 'Clear Selection'
                  : 'Select All'}
              </Button>
            </div>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {leftColumns.map((column) => (
                  <label key={column} className="flex items-center space-x-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isColumnSelected('left', column)}
                      onChange={() => handleColumnToggle('left', column)}
                      className="rounded border-gray-300"
                    />
                    <span className="truncate">{column}</span>
                  </label>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {!operation.left_columns
                ? 'All columns selected (SELECT *)'
                : operation.left_columns.length === 0
                ? 'No columns selected'
                : `${operation.left_columns.length} of ${leftColumns.length} columns selected`}
            </p>
          </div>
        )}

        {/* Right Columns */}
        {rightColumns.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Right Columns (Optional)</Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => handleSelectAllColumns('right')}
                className="h-auto p-0 text-xs"
              >
                {(!operation.right_columns ||
                  operation.right_columns.length === rightColumns.length)
                  ? 'Clear Selection'
                  : 'Select All'}
              </Button>
            </div>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {rightColumns.map((column) => (
                  <label key={column} className="flex items-center space-x-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isColumnSelected('right', column)}
                      onChange={() => handleColumnToggle('right', column)}
                      className="rounded border-gray-300"
                    />
                    <span className="truncate">{column}</span>
                  </label>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {!operation.right_columns
                ? 'All columns selected (SELECT *)'
                : operation.right_columns.length === 0
                ? 'No columns selected'
                : `${operation.right_columns.length} of ${rightColumns.length} columns selected`}
            </p>
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
        <strong>Join Preview:</strong> Join "{operation.left}" with "{operation.right}" using{' '}
        {operation.join_type} join on{' '}
        <span className="font-mono text-blue-600">{operation.left}.{operation.condition.left_key}</span>
        {' = '}
        <span className="font-mono text-green-600">{operation.right}.{operation.condition.right_key}</span>
        {(operation.left_columns !== undefined || operation.right_columns !== undefined) && (
          <>
            <br />
            <strong>Columns:</strong>{' '}
            {!operation.left_columns
              ? 'Left: * (all)'
              : operation.left_columns.length === 0
              ? 'Left: none'
              : `Left: ${operation.left_columns.join(', ')}`}
            {' | '}
            {!operation.right_columns
              ? 'Right: * (all)'
              : operation.right_columns.length === 0
              ? 'Right: none'
              : `Right: ${operation.right_columns.join(', ')}`}
          </>
        )}
      </div>
    </div>
  );
}
