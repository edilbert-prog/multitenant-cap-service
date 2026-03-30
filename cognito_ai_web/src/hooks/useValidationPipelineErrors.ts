/**
 * React Hook for Pipeline Validation
 *
 * Automatically validates pipeline configuration whenever sources, operations,
 * or comparison fields change. Returns validation errors for display in UI.
 */

import { useMemo } from 'react';
import type {
  TransformOperation,
  SourceDefinition,
  DataSource,
} from '../types/validation';
import {
  validateValidationConfiguration,
  type PipelineValidationResult,
} from '../utils/pipelineValidation';

interface UseValidationPipelineErrorsProps {
  leftSources: SourceDefinition[];
  leftPipeline: TransformOperation[];
  rightSources: SourceDefinition[];
  rightPipeline: TransformOperation[];
  keyFields: string[];
  compareFields: string[];
  datasources: DataSource[];
}

/**
 * Hook to validate entire validation configuration
 *
 * @example
 * ```tsx
 * const validation = useValidationPipelineErrors({
 *   leftSources,
 *   leftPipeline,
 *   rightSources,
 *   rightPipeline,
 *   keyFields,
 *   compareFields,
 *   datasources,
 * });
 *
 * if (validation.hasErrors) {
 *   console.log('Errors found:', validation.operationErrors);
 * }
 * ```
 */
export function useValidationPipelineErrors(
  props: UseValidationPipelineErrorsProps
): PipelineValidationResult {
  const {
    leftSources,
    leftPipeline,
    rightSources,
    rightPipeline,
    keyFields,
    compareFields,
    datasources,
  } = props;

  // Memoize validation result to avoid recalculating on every render
  const validationResult = useMemo(() => {
    return validateValidationConfiguration(
      leftSources,
      leftPipeline,
      rightSources,
      rightPipeline,
      keyFields,
      compareFields,
      datasources
    );
  }, [
    leftSources,
    leftPipeline,
    rightSources,
    rightPipeline,
    keyFields,
    compareFields,
    datasources,
  ]);

  return validationResult;
}

/**
 * Get total error count across all validation areas
 */
export function getTotalErrorCount(validation: PipelineValidationResult): number {
  return (
    validation.operationErrors.length +
    validation.keyFieldErrors.length +
    validation.compareFieldErrors.length
  );
}

/**
 * Get error for a specific operation index
 */
export function getOperationError(
  validation: PipelineValidationResult,
  operationIndex: number
): string[] | undefined {
  const error = validation.operationErrors.find(
    (e) => e.operationIndex === operationIndex
  );
  return error?.errors;
}

/**
 * Check if a specific operation has errors
 */
export function hasOperationError(
  validation: PipelineValidationResult,
  operationIndex: number
): boolean {
  return validation.operationErrors.some(
    (e) => e.operationIndex === operationIndex
  );
}
