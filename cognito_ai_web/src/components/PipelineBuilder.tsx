import { useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Plus, Trash2, MoveUp, MoveDown, ChevronDown, ChevronUp, Edit, Save, AlertCircle } from 'lucide-react';
import type {
  TransformOperation,
  JoinOperation,
  FilterOperation,
  ConsolidateOperation,
  MapOperation,
  LookupOperation,
  DeduplicateOperation,
  SourceDefinition,
} from '../types/validation';
import { JoinOperationEditor } from './operations/JoinOperationEditor';
import { FilterOperationEditor } from './operations/FilterOperationEditor';
import { ConsolidateOperationEditor } from './operations/ConsolidateOperationEditor';
import { MapOperationEditor } from './operations/MapOperationEditor';
import { LookupOperationEditor } from './operations/LookupOperationEditor';
import { DeduplicateOperationEditor } from './operations/DeduplicateOperationEditor';
import type { OperationError } from '../utils/pipelineValidation';

interface PipelineBuilderProps {
  operations: TransformOperation[];
  onChange: (operations: TransformOperation[]) => void;
  availableSources: string[]; // List of source IDs that can be referenced
  sources: SourceDefinition[]; // Full source definitions for column lookup
  label: string;
  validationId: number; // Required for validation-scoped datasources
  operationErrors?: OperationError[]; // Validation errors for operations
}

export function PipelineBuilder({
  operations,
  onChange,
  availableSources,
  sources,
  label,
  validationId,
  operationErrors = [],
}: PipelineBuilderProps) {
  const [operationType, setOperationType] = useState<string>('join');

  // Helper to get errors for a specific operation
  const getOperationErrors = (index: number): string[] => {
    const error = operationErrors.find(e => e.operationIndex === index);
    return error?.errors || [];
  };

  // Add a new operation
  const handleAddOperation = () => {
    let newOperation: TransformOperation;

    switch (operationType) {
      case 'join':
        newOperation = {
          operation: 'join',
          left: availableSources[0] || '',
          right: availableSources[1] || '',
          join_type: 'inner',
          condition: {
            left_key: '',
            right_key: '',
          },
        } as JoinOperation;
        break;
      case 'filter':
        newOperation = {
          operation: 'filter',
          conditions: [],
          logic: 'and',
        } as FilterOperation;
        break;
      case 'consolidate':
        newOperation = {
          operation: 'consolidate',
          group_by: [],
          aggregations: [],
        } as ConsolidateOperation;
        break;
      case 'map':
        newOperation = {
          operation: 'map',
          mappings: [],
        } as MapOperation;
        break;
      case 'lookup':
        newOperation = {
          operation: 'lookup',
          filter_column: '',
          lookup_source_id: '',
          lookup_column: '',
          match_type: 'include',
        } as LookupOperation;
        break;
      case 'deduplicate':
        newOperation = {
          operation: 'deduplicate',
          keys: [],
          strategy: 'first',
        } as DeduplicateOperation;
        break;
      default:
        return;
    }

    onChange([...operations, newOperation]);
  };

  // Remove an operation by index
  const handleRemoveOperation = (index: number) => {
    const updatedOperations = operations.filter((_, i) => i !== index);
    onChange(updatedOperations);
  };

  // Move operation up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updatedOperations = [...operations];
    [updatedOperations[index - 1], updatedOperations[index]] = [
      updatedOperations[index],
      updatedOperations[index - 1],
    ];
    onChange(updatedOperations);
  };

  // Move operation down
  const handleMoveDown = (index: number) => {
    if (index === operations.length - 1) return;
    const updatedOperations = [...operations];
    [updatedOperations[index], updatedOperations[index + 1]] = [
      updatedOperations[index + 1],
      updatedOperations[index],
    ];
    onChange(updatedOperations);
  };

  // Update an operation
  const handleUpdateOperation = (index: number, operation: TransformOperation) => {
    const updatedOperations = [...operations];
    updatedOperations[index] = operation;
    onChange(updatedOperations);
  };

  return (
    <div className="space-y-4">
      <Label className="text-lg font-semibold">{label}</Label>

      {/* Add Operation Controls */}
      <div className="flex gap-2">
        <Select value={operationType} onValueChange={setOperationType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="join">Join</SelectItem>
            <SelectItem value="filter">Filter</SelectItem>
            <SelectItem value="lookup">Lookup Filter</SelectItem>
            <SelectItem value="deduplicate">Deduplicate</SelectItem>
            <SelectItem value="consolidate">Consolidate</SelectItem>
            <SelectItem value="map">Map/Transform</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          onClick={handleAddOperation}
          disabled={availableSources.length === 0}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Operation
        </Button>
      </div>

      {/* Info message when no sources */}
      {availableSources.length === 0 && (
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
          Add at least one source above before creating pipeline operations
        </div>
      )}

      {/* Operations List */}
      {operations.length === 0 && availableSources.length > 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>No operations added yet</p>
          <p className="text-sm">
            Pipeline operations transform your data before comparison
          </p>
        </div>
      )}

      <div className="space-y-3">
        {operations.map((operation, index) => {
          // Build available sources up to this point (include previous operations' outputs)
          const sourcesUpToHere = [...availableSources];
          const previousOperations = operations.slice(0, index);

          for (let i = 0; i < index; i++) {
            const prevOp = operations[i];
            if ('output_name' in prevOp && prevOp.output_name) {
              sourcesUpToHere.push(prevOp.output_name);
            }
          }

          return (
            <OperationItem
              key={index}
              operation={operation}
              index={index}
              availableSources={sourcesUpToHere}
              sources={sources}
              previousOperations={previousOperations}
              totalOperations={operations.length}
              validationId={validationId}
              errors={getOperationErrors(index)}
              onUpdate={(op) => handleUpdateOperation(index, op)}
              onRemove={() => handleRemoveOperation(index)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
            />
          );
        })}
      </div>
    </div>
  );
}

// Individual operation item wrapper
interface OperationItemProps {
  operation: TransformOperation;
  index: number;
  availableSources: string[];
  sources: SourceDefinition[];
  previousOperations: TransformOperation[];
  totalOperations: number;
  validationId: number; // Required for validation-scoped datasources
  errors: string[]; // Validation errors for this operation
  onUpdate: (operation: TransformOperation) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function OperationItem({
  operation,
  index,
  availableSources,
  sources,
  previousOperations,
  totalOperations,
  validationId,
  errors,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: OperationItemProps) {
  // Check if operation is incomplete (newly added)
  const isIncompleteOperation = () => {
    switch (operation.operation) {
      case 'join':
        const joinOp = operation as JoinOperation;
        return !joinOp.condition.left_key || !joinOp.condition.right_key;
      case 'filter':
        const filterOp = operation as FilterOperation;
        return filterOp.conditions.length === 0;
      case 'consolidate':
        const consolidateOp = operation as ConsolidateOperation;
        return consolidateOp.group_by.length === 0 && consolidateOp.aggregations.length === 0;
      case 'map':
        const mapOp = operation as MapOperation;
        return mapOp.mappings.length === 0;
      case 'lookup':
        const lookupOp = operation as LookupOperation;
        return !lookupOp.filter_column || !lookupOp.lookup_source_id || !lookupOp.lookup_column;
      case 'deduplicate':
        const deduplicateOp = operation as DeduplicateOperation;
        return (deduplicateOp.keys || []).length === 0;
      default:
        return true;
    }
  };

  const isNewOperation = isIncompleteOperation();
  const [isExpanded, setIsExpanded] = useState(isNewOperation);
  const [isEditing, setIsEditing] = useState(isNewOperation); // Start in edit mode if incomplete

  // Determine operation type badge color
  const getOperationBadge = () => {
    const badges = {
      join: 'bg-blue-100 text-blue-800',
      filter: 'bg-green-100 text-green-800',
      lookup: 'bg-yellow-100 text-yellow-800',
      deduplicate: 'bg-pink-100 text-pink-800',
      consolidate: 'bg-purple-100 text-purple-800',
      map: 'bg-orange-100 text-orange-800',
    };
    return badges[operation.operation] || 'bg-gray-100 text-gray-800';
  };

  const handleSave = () => {
    setIsEditing(false);
    setIsExpanded(false);
  };

  // Get operation summary for collapsed view
  const getOperationSummary = () => {
    switch (operation.operation) {
      case 'join':
        const joinOp = operation as JoinOperation;
        return `${joinOp.left} ${joinOp.join_type} ${joinOp.right} on ${joinOp.condition.left_key} = ${joinOp.condition.right_key}`;
      case 'filter':
        const filterOp = operation as FilterOperation;
        // Show actual filter conditions with operator symbols
        const getOperatorSymbol = (op: string) => {
          const symbols: Record<string, string> = {
            'equals': '=',
            'not_equals': '≠',
            'contains': '⊃',
            'not_contains': '⊅',
            'gt': '>',
            'gte': '≥',
            'lt': '<',
            'lte': '≤',
            'in': '∈',
            'not_in': '∉',
            'is_null': 'IS NULL',
            'is_not_null': 'IS NOT NULL',
          };
          return symbols[op] || op;
        };

        if (filterOp.conditions.length === 0) {
          return 'No conditions';
        }

        // Format conditions with logic operator
        const conditionStrings = filterOp.conditions.map(c => {
          const value = ['is_null', 'is_not_null'].includes(c.operator)
            ? ''
            : ` ${typeof c.value === 'string' && c.value.includes(' ') ? `"${c.value}"` : c.value}`;
          return `${c.field} ${getOperatorSymbol(c.operator)}${value}`;
        });

        // If more than 3 conditions, show first 2 and count
        if (conditionStrings.length > 3) {
          const shown = conditionStrings.slice(0, 2).join(` ${filterOp.logic.toUpperCase()} `);
          return `${shown} ${filterOp.logic.toUpperCase()} (+${conditionStrings.length - 2} more)`;
        }

        return conditionStrings.join(` ${filterOp.logic.toUpperCase()} `);
      case 'consolidate':
        const consolidateOp = operation as ConsolidateOperation;
        if (consolidateOp.group_by.length === 0 && consolidateOp.aggregations.length === 0) {
          return 'Not configured';
        }

        const groupByStr = consolidateOp.group_by.length > 0
          ? `Group by ${consolidateOp.group_by.slice(0, 2).join(', ')}${consolidateOp.group_by.length > 2 ? ` (+${consolidateOp.group_by.length - 2})` : ''}`
          : '';

        const aggStr = consolidateOp.aggregations.length > 0
          ? consolidateOp.aggregations.slice(0, 2).map(a => `${a.function.toUpperCase()}(${a.field})`).join(', ') +
            (consolidateOp.aggregations.length > 2 ? ` (+${consolidateOp.aggregations.length - 2})` : '')
          : '';

        return [groupByStr, aggStr].filter(s => s).join(' → ');
      case 'map':
        const mapOp = operation as MapOperation;
        if (mapOp.mappings.length === 0) {
          return 'No mappings';
        }

        // Show first 2 mappings
        const mappingStrs = mapOp.mappings.slice(0, 2).map(m => {
          if (m.type === 'rename') {
            return `${m.source_field} → ${m.target_field}`;
          } else if (m.type === 'drop') {
            return `Drop ${m.source_field}`;
          } else {
            return `${m.target_field} = ${m.expression || 'expr'}`;
          }
        });

        const extra = mapOp.mappings.length > 2 ? ` (+${mapOp.mappings.length - 2})` : '';
        return mappingStrs.join(', ') + extra;
      case 'lookup':
        const lookupOp = operation as LookupOperation;
        if (!lookupOp.filter_column || !lookupOp.lookup_column) {
          return 'Not configured';
        }
        const action = lookupOp.match_type === 'include' ? 'Keep' : 'Remove';
        const sourceLabel = lookupOp.source_id || 'previous result';
        const lookupLabel = lookupOp.lookup_source_id?.replace('source_', 'Source ') || lookupOp.lookup_source_id;
        return `${action} rows from ${sourceLabel} where ${lookupOp.filter_column} ${lookupOp.match_type === 'include' ? '∈' : '∉'} ${lookupLabel}.${lookupOp.lookup_column}`;
      case 'deduplicate':
        const deduplicateOp = operation as DeduplicateOperation;
        if ((deduplicateOp.keys || []).length === 0) {
          return 'No key columns selected';
        }
        const keyStr = deduplicateOp.keys.slice(0, 3).join(', ') + (deduplicateOp.keys.length > 3 ? ` (+${deduplicateOp.keys.length - 3})` : '');
        return `Remove duplicates by [${keyStr}], keep ${deduplicateOp.strategy || 'first'}`;
      default:
        return '';
    }
  };

  // Collapsed view
  if (!isExpanded && !isEditing) {
    return (
      <div className={`border rounded-lg p-3 bg-card hover:bg-accent/10 transition-colors ${errors.length > 0 ? 'border-destructive border-2' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Header line */}
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-1 text-xs font-semibold rounded ${getOperationBadge()}`}>
                {operation.operation.toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground">Operation {index + 1}</span>
              {('output_name' in operation && operation.output_name) && (
                <span className="text-xs font-medium text-primary">→ {operation.output_name}</span>
              )}
              {errors.length > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {errors.length} error{errors.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            {/* Summary line (with wrapping) */}
            <div className="text-sm text-foreground break-words font-mono pl-1">
              {getOperationSummary()}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8 p-0"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="h-8 w-8 p-0"
              title="Expand"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-8 w-8 p-0"
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className={`border rounded-lg p-4 space-y-4 bg-card ${errors.length > 0 ? 'border-destructive border-2' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 text-xs font-semibold rounded ${getOperationBadge()}`}
          >
            {operation.operation.toUpperCase()}
          </span>
          <span className="text-sm text-muted-foreground">
            Operation {index + 1}
          </span>
          {errors.length > 0 && (
            <Badge variant="destructive">
              {errors.length} error{errors.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {isEditing && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSave}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onMoveUp}
            disabled={index === 0}
            className="h-8 w-8 p-0"
          >
            <MoveUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onMoveDown}
            disabled={index === totalOperations - 1}
            className="h-8 w-8 p-0"
          >
            <MoveDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Errors</AlertTitle>
          <AlertDescription>
            <ul className="list-disc ml-4 space-y-1">
              {errors.map((error, idx) => (
                <li key={idx} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Operation Editor */}
      {operation.operation === 'join' && (
        <JoinOperationEditor
          operation={operation as JoinOperation}
          availableSources={availableSources}
          sources={sources}
          previousOperations={previousOperations}
          validationId={validationId}
          onChange={onUpdate}
        />
      )}
      {operation.operation === 'filter' && (
        <FilterOperationEditor
          operation={operation as FilterOperation}
          sources={sources}
          availableSources={availableSources}
          previousOperations={previousOperations}
          onChange={onUpdate}
        />
      )}
      {operation.operation === 'consolidate' && (
        <ConsolidateOperationEditor
          operation={operation as ConsolidateOperation}
          sources={sources}
          onChange={onUpdate}
        />
      )}
      {operation.operation === 'map' && (
        <MapOperationEditor
          operation={operation as MapOperation}
          sources={sources}
          previousOperations={previousOperations}
          validationId={validationId}
          onChange={onUpdate}
        />
      )}
      {operation.operation === 'lookup' && (
        <LookupOperationEditor
          operation={operation as LookupOperation}
          sources={sources}
          availableSources={availableSources}
          previousOperations={previousOperations}
          validationId={validationId}
          onChange={onUpdate}
        />
      )}
      {operation.operation === 'deduplicate' && (
        <DeduplicateOperationEditor
          operation={operation as DeduplicateOperation}
          sources={sources}
          availableSources={availableSources}
          previousOperations={previousOperations}
          onChange={onUpdate}
        />
      )}
    </div>
  );
}
