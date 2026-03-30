/**
 * Pipeline Validation Utilities
 *
 * Validates pipeline operations against available datasources before execution.
 * Catches column reference errors, missing sources, and configuration issues at design-time.
 */

import type {
  TransformOperation,
  JoinOperation,
  FilterOperation,
  MapOperation,
  LookupOperation,
  SourceDefinition,
  DataSource,
} from '../types/validation';

export interface OperationError {
  operationIndex: number;
  operationType: string;
  errors: string[];
}

export interface PipelineValidationResult {
  hasErrors: boolean;
  operationErrors: OperationError[];
  keyFieldErrors: string[];
  compareFieldErrors: string[];
}

/**
 * Get columns available from a source definition
 */
export function getSourceColumns(
  source: SourceDefinition,
  datasources: DataSource[]
): string[] {
  // If source has selected_columns, use those
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

  // Connection-based datasource
  const datasource = datasources.find(
    (ds) =>
      ds.connection_id === source.connection_id &&
      (source.query?.includes(ds.table_name || '') ||
        source.query?.includes(ds.display_name))
  );
  return datasource?.columns || [];
}

/**
 * Calculate output columns from an operation
 */
export function calculateOperationOutputColumns(
  operation: TransformOperation,
  inputColumns: string[],
  sources: SourceDefinition[],
  datasources: DataSource[]
): string[] {
  switch (operation.operation) {
    case 'join': {
      const joinOp = operation as JoinOperation;

      // Get columns from left source
      // If left is "result", use inputColumns (from previous operation)
      let leftCols: string[];
      if (joinOp.left === 'result') {
        leftCols = inputColumns;
      } else {
        const leftSource = sources.find(s => s.source_id === joinOp.left);
        leftCols = leftSource ? getSourceColumns(leftSource, datasources) : [];
      }

      // Get columns from right source
      // If right is "result", use inputColumns (from previous operation)
      let rightCols: string[];
      if (joinOp.right === 'result') {
        rightCols = inputColumns;
      } else {
        const rightSource = sources.find(s => s.source_id === joinOp.right);
        rightCols = rightSource ? getSourceColumns(rightSource, datasources) : [];
      }

      // Apply column selection if specified
      const selectedLeftCols = joinOp.left_columns && joinOp.left_columns.length > 0
        ? joinOp.left_columns
        : leftCols;
      const selectedRightCols = joinOp.right_columns && joinOp.right_columns.length > 0
        ? joinOp.right_columns
        : rightCols;

      return [...selectedLeftCols, ...selectedRightCols];
    }

    case 'map': {
      const mapOp = operation as MapOperation;
      const outputColumns = new Set(inputColumns);

      if (mapOp.mappings && Array.isArray(mapOp.mappings)) {
        mapOp.mappings.forEach((mapping) => {
          if (mapping.type === 'drop' && mapping.source_field) {
            outputColumns.delete(mapping.source_field);
          } else if (mapping.type === 'rename' && mapping.source_field && mapping.target_field) {
            outputColumns.delete(mapping.source_field);
            outputColumns.add(mapping.target_field);
          } else if (mapping.type === 'derive' && mapping.target_field) {
            outputColumns.add(mapping.target_field);
          }
        });
      }

      return Array.from(outputColumns);
    }

    case 'filter':
    case 'lookup':
      // These operations pass through all input columns unchanged
      return inputColumns;

    default:
      return inputColumns;
  }
}

/**
 * Validate a JOIN operation
 */
export function validateJoinOperation(
  operation: JoinOperation,
  sources: SourceDefinition[],
  datasources: DataSource[],
  operationIndex: number,
  availableOutputs: Set<string> = new Set()
): string[] {
  const errors: string[] = [];

  // Check if left source exists (can be a real source, "result", or a named output)
  const isLeftResult = operation.left === 'result';
  const isLeftNamedOutput = availableOutputs.has(operation.left);
  const leftSource = sources.find(s => s.source_id === operation.left);

  if (!leftSource && !isLeftResult && !isLeftNamedOutput) {
    errors.push(`Left source '${operation.left}' does not exist`);
  }

  // If using "result" and this is the first operation, that's an error
  if (isLeftResult && operationIndex === 0) {
    errors.push(`Cannot use 'result' as left source in first operation`);
  }

  // Check if right source exists (can be a real source, "result", or a named output)
  const isRightResult = operation.right === 'result';
  const isRightNamedOutput = availableOutputs.has(operation.right);
  const rightSource = sources.find(s => s.source_id === operation.right);

  if (!rightSource && !isRightResult && !isRightNamedOutput) {
    errors.push(`Right source '${operation.right}' does not exist`);
  }

  // If using "result" and this is the first operation, that's an error
  if (isRightResult && operationIndex === 0) {
    errors.push(`Cannot use 'result' as right source in first operation`);
  }

  // Note: We skip detailed column validation for "result" and named outputs here
  // because we don't have the column information available at this point in validation.
  // The column validation will happen at runtime in the backend.

  // If sources exist, check key fields
  if (leftSource) {
    const leftColumns = getSourceColumns(leftSource, datasources);
    if (leftColumns.length === 0) {
      errors.push(`Left source '${operation.left}' has no columns available`);
    } else if (operation.condition.left_key && !leftColumns.includes(operation.condition.left_key)) {
      errors.push(
        `Left key field '${operation.condition.left_key}' not found in source '${operation.left}'. ` +
        `Available columns: ${leftColumns.join(', ')}`
      );
    }

    // Validate selected left columns
    if (operation.left_columns && operation.left_columns.length > 0) {
      const missingCols = operation.left_columns.filter(col => !leftColumns.includes(col));
      if (missingCols.length > 0) {
        errors.push(
          `Selected left columns not found: ${missingCols.join(', ')}. ` +
          `Available: ${leftColumns.join(', ')}`
        );
      }
    }
  }

  if (rightSource) {
    const rightColumns = getSourceColumns(rightSource, datasources);
    if (rightColumns.length === 0) {
      errors.push(`Right source '${operation.right}' has no columns available`);
    } else if (operation.condition.right_key && !rightColumns.includes(operation.condition.right_key)) {
      errors.push(
        `Right key field '${operation.condition.right_key}' not found in source '${operation.right}'. ` +
        `Available columns: ${rightColumns.join(', ')}`
      );
    }

    // Validate selected right columns
    if (operation.right_columns && operation.right_columns.length > 0) {
      const missingCols = operation.right_columns.filter(col => !rightColumns.includes(col));
      if (missingCols.length > 0) {
        errors.push(
          `Selected right columns not found: ${missingCols.join(', ')}. ` +
          `Available: ${rightColumns.join(', ')}`
        );
      }
    }
  }

  return errors;
}

/**
 * Validate a FILTER operation
 */
export function validateFilterOperation(
  operation: FilterOperation,
  inputColumns: string[],
  operationIndex: number
): string[] {
  const errors: string[] = [];

  if (!operation.conditions || operation.conditions.length === 0) {
    errors.push('Filter operation must have at least one condition');
    return errors;
  }

  // Check each condition field
  operation.conditions.forEach((condition, idx) => {
    if (!condition.field) {
      errors.push(`Condition ${idx + 1}: field is required`);
    } else if (inputColumns.length > 0 && !inputColumns.includes(condition.field)) {
      errors.push(
        `Condition ${idx + 1}: field '${condition.field}' not found. ` +
        `Available columns: ${inputColumns.join(', ')}`
      );
    }
  });

  return errors;
}

/**
 * Validate a MAP operation
 */
export function validateMapOperation(
  operation: MapOperation,
  inputColumns: string[],
  operationIndex: number
): string[] {
  const errors: string[] = [];

  if (!operation.mappings || operation.mappings.length === 0) {
    errors.push('Map operation must have at least one mapping');
    return errors;
  }

  // Check each mapping
  operation.mappings.forEach((mapping, idx) => {
    if (mapping.type === 'rename' || mapping.type === 'drop') {
      if (!mapping.source_field) {
        errors.push(`Mapping ${idx + 1}: source field is required`);
      } else if (inputColumns.length > 0 && !inputColumns.includes(mapping.source_field)) {
        errors.push(
          `Mapping ${idx + 1}: source field '${mapping.source_field}' not found. ` +
          `Available columns: ${inputColumns.join(', ')}`
        );
      }
    }

    if (mapping.type === 'rename' && !mapping.target_field) {
      errors.push(`Mapping ${idx + 1}: target field is required for rename`);
    }

    if (mapping.type === 'derive' && !mapping.target_field) {
      errors.push(`Mapping ${idx + 1}: target field is required for derive`);
    }
  });

  return errors;
}

/**
 * Validate a LOOKUP operation
 */
export function validateLookupOperation(
  operation: LookupOperation,
  inputColumns: string[],
  sources: SourceDefinition[],
  datasources: DataSource[],
  operationIndex: number
): string[] {
  const errors: string[] = [];

  // Check filter column
  if (!operation.filter_column) {
    errors.push('Lookup operation: filter column is required');
  } else if (inputColumns.length > 0 && !inputColumns.includes(operation.filter_column)) {
    errors.push(
      `Lookup filter column '${operation.filter_column}' not found. ` +
      `Available columns: ${inputColumns.join(', ')}`
    );
  }

  // Check lookup source
  if (!operation.lookup_source_id) {
    errors.push('Lookup operation: lookup source is required');
  } else {
    const lookupSource = sources.find(s => s.source_id === operation.lookup_source_id);
    if (!lookupSource) {
      errors.push(`Lookup source '${operation.lookup_source_id}' does not exist`);
    } else {
      const lookupColumns = getSourceColumns(lookupSource, datasources);

      // Check lookup column
      if (!operation.lookup_column) {
        errors.push('Lookup operation: lookup column is required');
      } else if (lookupColumns.length > 0 && !lookupColumns.includes(operation.lookup_column)) {
        errors.push(
          `Lookup column '${operation.lookup_column}' not found in source '${operation.lookup_source_id}'. ` +
          `Available columns: ${lookupColumns.join(', ')}`
        );
      }
    }
  }

  return errors;
}

/**
 * Validate an entire pipeline
 */
export function validatePipeline(
  operations: TransformOperation[],
  sources: SourceDefinition[],
  datasources: DataSource[]
): OperationError[] {
  const operationErrors: OperationError[] = [];

  // Calculate columns available at each step
  let currentColumns: string[] = [];

  // Track available outputs (named outputs from previous operations)
  const availableOutputs = new Set<string>();

  // Start with columns from all sources
  if (sources.length > 0) {
    currentColumns = sources.flatMap(s => getSourceColumns(s, datasources));
    currentColumns = [...new Set(currentColumns)]; // Remove duplicates
  }

  operations.forEach((operation, index) => {
    let errors: string[] = [];

    switch (operation.operation) {
      case 'join':
        errors = validateJoinOperation(
          operation as JoinOperation,
          sources,
          datasources,
          index,
          availableOutputs
        );
        break;

      case 'filter':
        errors = validateFilterOperation(operation as FilterOperation, currentColumns, index);
        break;

      case 'map':
        errors = validateMapOperation(operation as MapOperation, currentColumns, index);
        break;

      case 'lookup':
        errors = validateLookupOperation(
          operation as LookupOperation,
          currentColumns,
          sources,
          datasources,
          index
        );
        break;
    }

    if (errors.length > 0) {
      operationErrors.push({
        operationIndex: index,
        operationType: operation.operation,
        errors,
      });
    }

    // Track named outputs for future operations to reference
    if ('output_name' in operation && operation.output_name) {
      availableOutputs.add(operation.output_name);
    }

    // Update currentColumns for next operation
    currentColumns = calculateOperationOutputColumns(
      operation,
      currentColumns,
      sources,
      datasources
    );
  });

  return operationErrors;
}

/**
 * Validate key fields against pipeline output columns
 */
export function validateKeyFields(
  keyFields: string[],
  leftColumns: string[],
  rightColumns: string[]
): string[] {
  const errors: string[] = [];

  if (keyFields.length === 0) {
    // This is not an error - user may be saving a draft
    return errors;
  }

  keyFields.forEach(field => {
    const inLeft = leftColumns.includes(field);
    const inRight = rightColumns.includes(field);

    if (!inLeft && !inRight) {
      errors.push(
        `Key field '${field}' not found in either left or right output. ` +
        `Left columns: ${leftColumns.join(', ')}. Right columns: ${rightColumns.join(', ')}`
      );
    } else if (!inLeft) {
      errors.push(
        `Key field '${field}' not found in left output. ` +
        `Available: ${leftColumns.join(', ')}`
      );
    } else if (!inRight) {
      errors.push(
        `Key field '${field}' not found in right output. ` +
        `Available: ${rightColumns.join(', ')}`
      );
    }
  });

  return errors;
}

/**
 * Validate compare fields against pipeline output columns
 */
export function validateCompareFields(
  compareFields: string[],
  leftColumns: string[],
  rightColumns: string[]
): string[] {
  const errors: string[] = [];

  // Compare fields are optional
  if (compareFields.length === 0) {
    return errors;
  }

  compareFields.forEach(field => {
    const inLeft = leftColumns.includes(field);
    const inRight = rightColumns.includes(field);

    if (!inLeft && !inRight) {
      errors.push(
        `Compare field '${field}' not found in either left or right output. ` +
        `Left columns: ${leftColumns.join(', ')}. Right columns: ${rightColumns.join(', ')}`
      );
    }
  });

  return errors;
}

/**
 * Main validation function - validates entire validation configuration
 */
export function validateValidationConfiguration(
  leftSources: SourceDefinition[],
  leftPipeline: TransformOperation[],
  rightSources: SourceDefinition[],
  rightPipeline: TransformOperation[],
  keyFields: string[],
  compareFields: string[],
  datasources: DataSource[]
): PipelineValidationResult {
  // Validate left pipeline
  const leftErrors = validatePipeline(leftPipeline, leftSources, datasources);

  // Validate right pipeline
  const rightErrors = validatePipeline(rightPipeline, rightSources, datasources);

  // Calculate final output columns from each side
  let leftColumns: string[] = [];
  let rightColumns: string[] = [];

  if (leftSources.length > 0) {
    leftColumns = leftSources.flatMap(s => getSourceColumns(s, datasources));
    leftColumns = [...new Set(leftColumns)];

    leftPipeline.forEach(op => {
      leftColumns = calculateOperationOutputColumns(op, leftColumns, leftSources, datasources);
    });
  }

  if (rightSources.length > 0) {
    rightColumns = rightSources.flatMap(s => getSourceColumns(s, datasources));
    rightColumns = [...new Set(rightColumns)];

    rightPipeline.forEach(op => {
      rightColumns = calculateOperationOutputColumns(op, rightColumns, rightSources, datasources);
    });
  }

  // Validate key and compare fields
  const keyFieldErrors = validateKeyFields(keyFields, leftColumns, rightColumns);
  const compareFieldErrors = validateCompareFields(compareFields, leftColumns, rightColumns);

  const operationErrors = [...leftErrors, ...rightErrors];

  return {
    hasErrors: operationErrors.length > 0 || keyFieldErrors.length > 0 || compareFieldErrors.length > 0,
    operationErrors,
    keyFieldErrors,
    compareFieldErrors,
  };
}
