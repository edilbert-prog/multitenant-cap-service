import { Label } from '../ui/label';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useUploadedDatasources } from '../../api/validation/hooks';
import type { LookupOperation, SourceDefinition, TransformOperation, JoinOperation } from '../../types/validation';
import { useState, useEffect } from 'react';

interface LookupOperationEditorProps {
  operation: LookupOperation;
  sources: SourceDefinition[];
  availableSources: string[];
  previousOperations: TransformOperation[];
  validationId?: number;
  onChange: (operation: LookupOperation) => void;
}

export function LookupOperationEditor({
  operation,
  sources,
  availableSources,
  previousOperations,
  validationId,
  onChange,
}: LookupOperationEditorProps) {
  const { data: uploadedDatasources = [] } = useUploadedDatasources(validationId || 0);

  const [currentPipelineColumns, setCurrentPipelineColumns] = useState<string[]>([]);
  const [lookupSourceColumns, setLookupSourceColumns] = useState<string[]>([]);

  // Determine if this is the first operation
  const isFirstOperation = previousOperations.length === 0;

  // Get columns from selected source or pipeline
  useEffect(() => {
    let columns: string[] = [];

    if (isFirstOperation && operation.source_id) {
      // First operation with source selected - show that source's columns
      const source = sources.find(s => s.source_id === operation.source_id);
      if (source) {
        if (source.selected_columns && source.selected_columns.length > 0) {
          columns = source.selected_columns;
        } else {
          const datasource = uploadedDatasources.find(
            ds => ds.datasource_id === source.uploaded_datasource_id
          );
          columns = datasource?.columns || [];
        }
      }
    } else if (previousOperations.length > 0) {
      // Infer columns from previous operation output
      const lastOp = previousOperations[previousOperations.length - 1];

      if (lastOp.operation === 'join') {
        const joinOp = lastOp as JoinOperation;
        // Get left columns
        let leftCols: string[] = [];
        if (joinOp.left_columns && joinOp.left_columns.length > 0 && !joinOp.left_columns.includes('*')) {
          leftCols = joinOp.left_columns;
        } else {
          const leftSource = sources.find(s => s.source_id === joinOp.left);
          if (leftSource) {
            const ds = uploadedDatasources.find(d => d.datasource_id === leftSource.uploaded_datasource_id);
            leftCols = ds?.columns || [];
          }
        }

        // Get right columns
        let rightCols: string[] = [];
        if (joinOp.right_columns && joinOp.right_columns.length > 0 && !joinOp.right_columns.includes('*')) {
          rightCols = joinOp.right_columns;
        } else {
          const rightSource = sources.find(s => s.source_id === joinOp.right);
          if (rightSource) {
            const ds = uploadedDatasources.find(d => d.datasource_id === rightSource.uploaded_datasource_id);
            rightCols = ds?.columns || [];
          }
        }

        columns = [...leftCols, ...rightCols];
      } else {
        // For other operations, fallback to all source columns
        sources.forEach(source => {
          if (source.selected_columns && source.selected_columns.length > 0) {
            columns.push(...source.selected_columns);
          } else {
            const ds = uploadedDatasources.find(d => d.datasource_id === source.uploaded_datasource_id);
            if (ds?.columns) columns.push(...ds.columns);
          }
        });
      }
    } else {
      // Fallback: show all source columns
      sources.forEach(source => {
        if (source.selected_columns && source.selected_columns.length > 0) {
          columns.push(...source.selected_columns);
        } else {
          const ds = uploadedDatasources.find(d => d.datasource_id === source.uploaded_datasource_id);
          if (ds?.columns) columns.push(...ds.columns);
        }
      });
    }

    setCurrentPipelineColumns([...new Set(columns)]);
  }, [operation.source_id, sources, previousOperations, uploadedDatasources, isFirstOperation]);

  // Get columns from selected lookup source
  useEffect(() => {
    if (operation.lookup_source_id) {
      // Find the source by source_id
      const source = sources.find(s => s.source_id === operation.lookup_source_id.toString());
      if (source) {
        if (source.selected_columns && source.selected_columns.length > 0) {
          setLookupSourceColumns(source.selected_columns);
        } else {
          const datasource = uploadedDatasources.find(
            ds => ds.datasource_id === source.uploaded_datasource_id
          );
          setLookupSourceColumns(datasource?.columns || []);
        }
      } else {
        setLookupSourceColumns([]);
      }
    } else {
      setLookupSourceColumns([]);
    }
  }, [operation.lookup_source_id, sources, uploadedDatasources]);

  const handleChange = (field: keyof LookupOperation, value: any) => {
    onChange({
      ...operation,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Source Selector (Only for first operation) */}
      {isFirstOperation && (
        <div className="space-y-2">
          <Label>Source</Label>
          <Select
            value={operation.source_id || ''}
            onValueChange={(value) => handleChange('source_id', value)}
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
            Select which source to apply the lookup filter to
          </p>
        </div>
      )}

      {/* Filter Column (Current Pipeline) */}
      <div className="space-y-2">
        <Label>Filter Column (Current Pipeline)</Label>
        {currentPipelineColumns.length > 0 ? (
          <Select
            value={operation.filter_column}
            onValueChange={(value) => handleChange('filter_column', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select column to filter..." />
            </SelectTrigger>
            <SelectContent>
              {currentPipelineColumns.map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={operation.filter_column}
            onChange={(e) => handleChange('filter_column', e.target.value)}
            placeholder="Column name"
          />
        )}
        <p className="text-xs text-muted-foreground">
          Column from current pipeline to filter
        </p>
      </div>

      {/* Match Type */}
      <div className="space-y-2">
        <Label>Match Type</Label>
        <Select
          value={operation.match_type}
          onValueChange={(value: 'include' | 'exclude') =>
            handleChange('match_type', value)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="include">Include matches (keep only)</SelectItem>
            <SelectItem value="exclude">Exclude matches (remove)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {operation.match_type === 'include'
            ? 'Keep only rows where values exist in lookup source'
            : 'Remove rows where values exist in lookup source'}
        </p>
      </div>

      {/* Lookup Source */}
      <div className="space-y-2">
        <Label>Lookup Source</Label>
        <Select
          value={operation.lookup_source_id || ''}
          onValueChange={(value) => handleChange('lookup_source_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select lookup source..." />
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
          Source containing the list of values to match against
        </p>
      </div>

      {/* Lookup Column */}
      <div className="space-y-2">
        <Label>Lookup Column</Label>
        {lookupSourceColumns.length > 0 ? (
          <Select
            value={operation.lookup_column}
            onValueChange={(value) => handleChange('lookup_column', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select column..." />
            </SelectTrigger>
            <SelectContent>
              {lookupSourceColumns.map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={operation.lookup_column}
            onChange={(e) => handleChange('lookup_column', e.target.value)}
            placeholder="Column name"
            disabled={!operation.lookup_source_id}
          />
        )}
        <p className="text-xs text-muted-foreground">
          Column in lookup source containing values to match
        </p>
      </div>

      {/* Output Name (Optional) */}
      <div className="space-y-2">
        <Label>Output Name (Optional)</Label>
        <Input
          value={operation.output_name || ''}
          onChange={(e) => handleChange('output_name', e.target.value)}
          placeholder="e.g., filtered_customers"
        />
        <p className="text-xs text-muted-foreground">
          Give this result a name to reference it in later operations
        </p>
      </div>

      {/* Preview */}
      {operation.filter_column && operation.lookup_column && (
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
          <strong>Lookup:</strong> {operation.match_type === 'include' ? 'Keep' : 'Remove'} rows
          where <code className="bg-background px-1 py-0.5 rounded">{operation.filter_column}</code>
          {' '}{operation.match_type === 'include' ? 'exists in' : 'does not exist in'}{' '}
          <code className="bg-background px-1 py-0.5 rounded">{operation.lookup_column}</code>
        </div>
      )}
    </div>
  );
}
