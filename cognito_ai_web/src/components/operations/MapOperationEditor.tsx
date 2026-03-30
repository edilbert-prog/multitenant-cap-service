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
import type { MapOperation, FieldMapping, SourceDefinition, TransformOperation, JoinOperation, DataSource } from '../../types/validation';

interface MapOperationEditorProps {
  operation: MapOperation;
  sources: SourceDefinition[];
  previousOperations?: TransformOperation[]; // Operations that came before this MAP
  onChange: (operation: MapOperation) => void;
  validationId: number; // ✅ Required for fetching uploaded datasources
}

export function MapOperationEditor({
  operation,
  sources,
  previousOperations = [],
  onChange,
  validationId,
}: MapOperationEditorProps) {
  const { data: regularDatasources = [] } = useDataSources();
  const { data: uploadedDatasources = [] } = useUploadedDatasources(validationId);

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
      table_name: ud.temp_table_name,
      columns: ud.columns || [], // Use columns from temp table
      uploaded_datasource_id: ud.datasource_id,
    })),
  ];

  // Get columns from previous operation's output (if exists), otherwise from sources
  const getAvailableColumns = (): string[] => {
    // If there are previous operations, get columns from the last operation's output
    if (previousOperations.length > 0) {
      const lastOp = previousOperations[previousOperations.length - 1];
      return getOperationOutputColumns(lastOp);
    }

    // Otherwise, get from sources
    const allColumns: string[] = [];
    sources.forEach((source) => {
      let columns: string[] = [];

      if (source.selected_columns && source.selected_columns.length > 0) {
        columns = source.selected_columns;
      } else {
        // Handle uploaded Excel datasources (temp table architecture)
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
              (source.query.includes(ds.table_name || '') ||
                source.query.includes(ds.display_name))
          );
          columns = datasource?.columns || [];
        }
      }

      allColumns.push(...columns);
    });

    return [...new Set(allColumns)];
  };

  // Get columns from a source (handles selected_columns)
  const getColumnsFromSource = (sourceId: string): string[] => {
    const source = sources.find(s => s.source_id === sourceId);
    if (!source) {
      console.log(`[getColumnsFromSource] Source not found: ${sourceId}`);
      return [];
    }

    // If user explicitly selected specific columns, use those
    if (source.selected_columns && source.selected_columns.length > 0) {
      console.log(`[getColumnsFromSource] Using selected_columns for ${sourceId}:`, source.selected_columns);
      return source.selected_columns;
    }

    // Handle uploaded Excel datasources (temp table architecture)
    if (source.uploaded_datasource_id) {
      const datasource = datasources.find(
        (ds) => ds.uploaded_datasource_id === source.uploaded_datasource_id
      );
      const columns = datasource?.columns || [];
      console.log(`[getColumnsFromSource] Uploaded datasource ${sourceId}:`, columns);
      return columns;
    }

    // Handle connection-based datasources
    const datasource = datasources.find(
      (ds) =>
        ds.connection_id === source.connection_id &&
        (source.query.includes(ds.table_name || '') ||
          source.query.includes(ds.display_name))
    );
    const columns = datasource?.columns || [];
    console.log(`[getColumnsFromSource] Connection-based datasource ${sourceId}:`, columns);
    return columns;
  };

  // Calculate what columns an operation produces
  const getOperationOutputColumns = (op: TransformOperation, opIndex: number = previousOperations.length - 1): string[] => {
    switch (op.operation) {
      case 'join': {
        const joinOp = op as JoinOperation;

        // Get columns from left side
        let leftCols: string[] = [];
        if (joinOp.left_columns && joinOp.left_columns.length > 0 && !joinOp.left_columns.includes('*')) {
          // Explicit column selection (not SELECT *)
          leftCols = joinOp.left_columns;
        } else {
          // No explicit selection OR ['*'] = SELECT * from left
          // Need to get columns from the left source (could be another operation or a source)
          const opsBeforeThis = previousOperations.slice(0, opIndex);
          const leftOpIndex = opsBeforeThis.findIndex(o => 'output_name' in o && o.output_name === joinOp.left);
          if (leftOpIndex >= 0) {
            leftCols = getOperationOutputColumns(opsBeforeThis[leftOpIndex], leftOpIndex);
          } else {
            leftCols = getColumnsFromSource(joinOp.left);
          }
        }

        // Get columns from right side
        let rightCols: string[] = [];
        if (joinOp.right_columns && joinOp.right_columns.length > 0 && !joinOp.right_columns.includes('*')) {
          // Explicit column selection (not SELECT *)
          rightCols = joinOp.right_columns;
        } else {
          // No explicit selection OR ['*'] = SELECT * from right
          const opsBeforeThis = previousOperations.slice(0, opIndex);
          const rightOpIndex = opsBeforeThis.findIndex(o => 'output_name' in o && o.output_name === joinOp.right);
          if (rightOpIndex >= 0) {
            rightCols = getOperationOutputColumns(opsBeforeThis[rightOpIndex], rightOpIndex);
          } else {
            rightCols = getColumnsFromSource(joinOp.right);
          }
        }

        // JOIN output: Only add 'right_' prefix to columns that conflict with left
        const rightColsWithSmartPrefix = rightCols.map(col => {
          const hasConflict = leftCols.includes(col);
          return hasConflict ? `right_${col}` : col;
        });

        const result = [...leftCols, ...rightColsWithSmartPrefix];
        console.log('[MapOperationEditor] JOIN columns:', {
          leftCols,
          rightCols,
          rightColsWithSmartPrefix,
          result
        });
        return result;
      }
      case 'filter':
        // FILTER passes through all columns
        if (opIndex > 0) {
          return getOperationOutputColumns(previousOperations[opIndex - 1], opIndex - 1);
        }
        return [];
      case 'map': {
        // MAP passes through all input columns + adds new ones
        const mapOp = op as MapOperation;
        let inputCols: string[] = [];
        if (opIndex > 0) {
          inputCols = getOperationOutputColumns(previousOperations[opIndex - 1], opIndex - 1);
        }
        const outputCols = new Set(inputCols);
        mapOp.mappings?.forEach((mapping) => {
          if (mapping.type === 'drop' && mapping.source_field) {
            outputCols.delete(mapping.source_field);
          } else if (mapping.target_field) {
            outputCols.add(mapping.target_field);
          }
        });
        return Array.from(outputCols);
      }
      default:
        return [];
    }
  };

  const availableColumns = getAvailableColumns();
  const handleAddMapping = () => {
    const newMapping: FieldMapping = {
      type: 'rename',
      source_field: '',
      target_field: '',
    };
    onChange({
      ...operation,
      mappings: [...operation.mappings, newMapping],
    });
  };

  const handleRemoveMapping = (index: number) => {
    onChange({
      ...operation,
      mappings: operation.mappings.filter((_, i) => i !== index),
    });
  };

  const handleUpdateMapping = (
    index: number,
    field: keyof FieldMapping,
    value: any
  ) => {
    const updatedMappings = [...operation.mappings];
    updatedMappings[index] = {
      ...updatedMappings[index],
      [field]: value,
    };
    onChange({
      ...operation,
      mappings: updatedMappings,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="font-semibold">Field Mappings</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddMapping}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Mapping
        </Button>
      </div>

      {operation.mappings.length === 0 && (
        <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded">
          No field mappings added yet
        </div>
      )}

      <div className="space-y-3">
        {operation.mappings.map((mapping, index) => (
          <div key={index} className="border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Select
                value={mapping.type}
                onValueChange={(value: 'rename' | 'derive' | 'drop') =>
                  handleUpdateMapping(index, 'type', value)
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rename">Rename</SelectItem>
                  <SelectItem value="derive">Derive</SelectItem>
                  <SelectItem value="drop">Drop</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveMapping(index)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            {mapping.type === 'rename' ? (
              <div className="grid grid-cols-2 gap-3">
                {/* Source Field */}
                <div className="space-y-2">
                  <Label className="text-xs">Source Field</Label>
                  {availableColumns.length > 0 ? (
                    <Select
                      value={mapping.source_field || ''}
                      onValueChange={(value) =>
                        handleUpdateMapping(index, 'source_field', value)
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
                      value={mapping.source_field || ''}
                      onChange={(e) =>
                        handleUpdateMapping(index, 'source_field', e.target.value)
                      }
                      placeholder="old_name"
                    />
                  )}
                </div>

                {/* Target Field */}
                <div className="space-y-2">
                  <Label className="text-xs">Target Field</Label>
                  <Input
                    value={mapping.target_field}
                    onChange={(e) =>
                      handleUpdateMapping(index, 'target_field', e.target.value)
                    }
                    placeholder="new_name"
                  />
                </div>
              </div>
            ) : mapping.type === 'drop' ? (
              <div className="space-y-2">
                {/* Source Field to Drop */}
                <div className="space-y-2">
                  <Label className="text-xs">Field to Drop</Label>
                  {availableColumns.length > 0 ? (
                    <Select
                      value={mapping.source_field || ''}
                      onValueChange={(value) => {
                        handleUpdateMapping(index, 'source_field', value);
                        handleUpdateMapping(index, 'target_field', value); // Set target same as source (not used but required)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field to remove..." />
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
                      value={mapping.source_field || ''}
                      onChange={(e) => {
                        handleUpdateMapping(index, 'source_field', e.target.value);
                        handleUpdateMapping(index, 'target_field', e.target.value);
                      }}
                      placeholder="field_name"
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    This field will be removed from the output
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Target Field */}
                <div className="space-y-2">
                  <Label className="text-xs">Target Field</Label>
                  <Input
                    value={mapping.target_field}
                    onChange={(e) =>
                      handleUpdateMapping(index, 'target_field', e.target.value)
                    }
                    placeholder="new_field_name"
                  />
                </div>

                {/* Expression */}
                <div className="space-y-2">
                  <Label className="text-xs">Expression</Label>
                  <Input
                    value={mapping.expression || ''}
                    onChange={(e) =>
                      handleUpdateMapping(index, 'expression', e.target.value)
                    }
                    placeholder="e.g., concat(first_name, ' ', last_name)"
                    className="font-mono text-sm"
                  />
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">
                      📚 Available Functions (click to expand)
                    </summary>
                    <div className="mt-2 space-y-1 pl-4 font-mono bg-muted/50 p-2 rounded">
                      <div><strong>String:</strong> concat(), upper(), lower(), trim(), substring(), replace(), length()</div>
                      <div><strong>Null:</strong> coalesce(), ifnull()</div>
                      <div><strong>Math:</strong> add(), subtract(), multiply(), divide(), round(), abs()</div>
                      <div><strong>Example:</strong> concat(first_name, " ", last_name)</div>
                    </div>
                  </details>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Preview */}
      {operation.mappings.length > 0 && (
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
          <strong>Map:</strong>
          {operation.mappings.map((mapping, i) => (
            <div key={i}>
              {mapping.type === 'rename'
                ? `Rename "${mapping.source_field}" to "${mapping.target_field}"`
                : mapping.type === 'drop'
                ? `Drop "${mapping.source_field}"`
                : `Derive "${mapping.target_field}" = ${mapping.expression}`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
