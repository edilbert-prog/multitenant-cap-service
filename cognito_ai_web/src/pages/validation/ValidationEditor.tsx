import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, ArrowLeft, Save, AlertTriangle, Edit, Check, X, Play, ExternalLink, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { MultiSourceSelector } from '@/components/MultiSourceSelector';
import { PipelineBuilder } from '@/components/PipelineBuilder';
import { UploadedFilesList } from '@/components/UploadedFilesList';
import {
  useCreateValidation,
  useUpdateValidation,
  useValidation,
  useDataSources,
  useUploadedDatasources,
  useRunValidation,
  useSAPDatasources,
} from '@/api/validation/hooks';
import type {
  SourceDefinition,
  TransformOperation,
  MatchStrategy,
  ValidationStatus,
  JoinOperation,
  MapOperation as MapOperationType,
  FilterOperation,
  DataSource,
} from '@/types/validation';
import ValidationLayout from './ValidationLayout';
import { useValidationPipelineErrors, getTotalErrorCount } from '@/hooks/useValidationPipelineErrors';

export default function ValidationEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const validationId = id ? parseInt(id) : undefined;

  // API Hooks
  const { data: existingValidation, isLoading: isLoadingValidation } = useValidation(
    validationId || 0
  );
  const createMutation = useCreateValidation();
  const updateMutation = useUpdateValidation(validationId || 0);
  const runMutation = useRunValidation();
  const { data: regularDatasources = [] } = useDataSources();
  const { data: uploadedDatasources = [] } = useUploadedDatasources(validationId || 0);
  const { data: sapDatasources = [] } = useSAPDatasources();


  console.log('[ValidationEditor] uploadedDatasources:', uploadedDatasources);
  console.log('[ValidationEditor] sapDatasources:', sapDatasources);

  // Merge uploaded Excel datasources + SAP datasources with regular datasources
  const datasources: DataSource[] = [
    ...regularDatasources,
    ...uploadedDatasources.map(ud => {
      console.log('[ValidationEditor] Mapping uploaded datasource:', {
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
        table_name: ud.temp_table_name,
        columns: ud.columns || [], // ✅ Use columns from API response
        uploaded_datasource_id: ud.datasource_id,
      };
    }),
    // Add SAP datasources (only if sync is complete)
    ...sapDatasources
      .filter(sd => sd.sync_status === 'complete')
      .map(sd => ({
        id: `sap_${sd.id}`,
        display_name: sd.name,
        connection_id: sd.connection_id as any,
        connection_name: 'SAP',
        source_type: sd.source_type as any,
        database_name: undefined,
        table_name: sd.temp_table_name || sd.table_name,
        columns: sd.columns || [],
        sap_datasource_id: sd.id,
      })),
  ];

  // Form state
  const [formData, setFormData] = useState({
    validation_name: '',
    description: '',
    match_strategy: 'exact' as MatchStrategy,
    fuzzy_threshold: 0.8,
    status: 'active' as ValidationStatus,
    key_fields: '',
    compare_fields: '',
  });

  // Left side: sources + pipeline
  const [leftSources, setLeftSources] = useState<SourceDefinition[]>([]);
  const [leftPipeline, setLeftPipeline] = useState<TransformOperation[]>([]);

  // Right side: sources + pipeline
  const [rightSources, setRightSources] = useState<SourceDefinition[]>([]);
  const [rightPipeline, setRightPipeline] = useState<TransformOperation[]>([]);

  // Comparison fields (as arrays)
  const [keyFields, setKeyFields] = useState<string[]>([]);
  const [compareFields, setCompareFields] = useState<string[]>([]);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showFiles, setShowFiles] = useState(true);

  // Helper functions to get available columns from pipelines
  const getColumnsFromSource = (source: SourceDefinition): string[] => {
    // If source has selected_columns, use those
    if (source.selected_columns && source.selected_columns.length > 0) {
      return source.selected_columns;
    }

    // Handle uploaded Excel datasources (temp table architecture)
    if (source.uploaded_datasource_id) {
      const datasource = datasources.find(
        (ds) => ds.uploaded_datasource_id === source.uploaded_datasource_id
      );
      // Columns are fetched from MySQL temp table
      return datasource?.columns || [];
    }

    // Otherwise, get all columns from connection-based datasource
    const datasource = datasources.find(
      (ds) =>
        ds.connection_id === source.connection_id &&
        (source.query?.includes(ds.table_name || '') ||
          source.query?.includes(ds.display_name))
    );
    return datasource?.columns || [];
  };

  const getOperationOutputColumns = (
    operation: TransformOperation,
    inputColumns: string[]
  ): string[] => {
    switch (operation.operation) {
      case 'join': {
        const joinOp = operation as JoinOperation;
        // For JOIN, we'd need to resolve left/right sources and get their columns
        // For now, return inputColumns (simplified)
        return inputColumns;
      }
      case 'map': {
        const mapOp = operation as MapOperationType;
        const outputColumns = new Set(inputColumns);
        if (mapOp.mappings && Array.isArray(mapOp.mappings)) {
          mapOp.mappings.forEach((mapping) => {
            // Handle drop: remove the field
            if (mapping.type === 'drop' && mapping.source_field) {
              outputColumns.delete(mapping.source_field);
            }
            // Handle rename: remove old name, add new name
            else if (mapping.type === 'rename' && mapping.source_field && mapping.target_field) {
              outputColumns.delete(mapping.source_field);
              outputColumns.add(mapping.target_field);
            }
            // Handle derive: just add new field
            else if (mapping.type === 'derive' && mapping.target_field) {
              outputColumns.add(mapping.target_field);
            }
          });
        }
        return Array.from(outputColumns);
      }
      case 'filter':
        // FILTER passes through all input columns unchanged
        return inputColumns;
      case 'consolidate':
        // CONSOLIDATE would have group_by fields + aggregation aliases
        // For now, return inputColumns (simplified)
        return inputColumns;
      default:
        return inputColumns;
    }
  };

  const getPipelineOutputColumns = (
    sources: SourceDefinition[],
    pipeline: TransformOperation[]
  ): string[] => {
    if (sources.length === 0) return [];

    // Start with columns from first source
    let currentColumns: string[] = [];

    if (sources.length === 1 && pipeline.length === 0) {
      // No pipeline - just return source columns
      return getColumnsFromSource(sources[0]);
    }

    // Get columns from all sources
    const allSourceColumns = sources.flatMap((s) => getColumnsFromSource(s));
    currentColumns = [...new Set(allSourceColumns)];

    // Apply each operation in sequence
    for (const operation of pipeline) {
      currentColumns = getOperationOutputColumns(operation, currentColumns);
    }

    return currentColumns;
  };

  const getCommonColumns = (leftCols: string[], rightCols: string[]): string[] => {
    return leftCols.filter((col) => rightCols.includes(col));
  };

  // Calculate available columns
  const leftColumns = getPipelineOutputColumns(leftSources, leftPipeline);
  const rightColumns = getPipelineOutputColumns(rightSources, rightPipeline);
  const commonColumns = getCommonColumns(leftColumns, rightColumns);

  console.log('[ValidationEditor] Column detection:', {
    leftSources,
    rightSources,
    leftColumns,
    rightColumns,
    commonColumns,
  });

  // Validate pipeline configuration
  const pipelineValidation = useValidationPipelineErrors({
    leftSources,
    leftPipeline,
    rightSources,
    rightPipeline,
    keyFields,
    compareFields,
    datasources,
  });

  const totalErrorCount = getTotalErrorCount(pipelineValidation);

  // Split operation errors by left/right pipeline
  const leftPipelineErrors = pipelineValidation.operationErrors.filter(
    (err) => err.operationIndex < leftPipeline.length
  );
  const rightPipelineErrors = pipelineValidation.operationErrors.filter(
    (err) => err.operationIndex >= leftPipeline.length
  ).map(err => ({
    ...err,
    operationIndex: err.operationIndex - leftPipeline.length,
  }));

  // Check if validation is complete (ready to run)
  const isValidationComplete = () => {
    const hasLeftSources = leftSources.length > 0;
    const hasRightSources = rightSources.length > 0;
    const leftNeedsPipeline = leftSources.length > 1 && leftPipeline.length === 0;
    const rightNeedsPipeline = rightSources.length > 1 && rightPipeline.length === 0;

    return (
      formData.validation_name &&
      hasLeftSources &&
      hasRightSources &&
      keyFields.length > 0 &&
      !leftNeedsPipeline &&
      !rightNeedsPipeline
    );
  };

  // Load existing validation data when editing
  useEffect(() => {
    if (existingValidation && isEdit) {
      setFormData({
        validation_name: existingValidation.validation_name || '',
        description: existingValidation.description || '',
        match_strategy: existingValidation.match_strategy || 'exact',
        fuzzy_threshold: existingValidation.fuzzy_threshold || 0.8,
        status: existingValidation.status || 'active',
        key_fields: '', // Removed - using separate state
        compare_fields: '', // Removed - using separate state
      });

      // Load comparison fields
      if (Array.isArray(existingValidation.key_fields)) {
        setKeyFields(existingValidation.key_fields);
      }
      if (Array.isArray(existingValidation.compare_fields)) {
        setCompareFields(existingValidation.compare_fields);
      }

      // Load sources and pipeline
      if (existingValidation.left_sources) {
        setLeftSources(existingValidation.left_sources);
      }
      if (existingValidation.right_sources) {
        setRightSources(existingValidation.right_sources);
      }
      if (existingValidation.left_pipeline?.operations) {
        setLeftPipeline(existingValidation.left_pipeline.operations);
      }
      if (existingValidation.right_pipeline?.operations) {
        setRightPipeline(existingValidation.right_pipeline.operations);
      }
    }
  }, [existingValidation, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Only validation_name is required for saving a draft
    if (!formData.validation_name) {
      setError('Validation name is required');
      return;
    }

    // Note: Multi-source pipeline validation is deferred until validation execution
    // This allows users to save drafts while building up their configuration

    // Prepare data for API
    const data = {
      validation_name: formData.validation_name,
      description: formData.description,
      left_sources: leftSources,
      right_sources: rightSources,
      left_pipeline:
        leftPipeline.length > 0 ? { operations: leftPipeline } : null,
      right_pipeline:
        rightPipeline.length > 0 ? { operations: rightPipeline } : null,
      key_fields: keyFields,
      compare_fields: compareFields,
      match_strategy: formData.match_strategy,
      fuzzy_threshold:
        formData.match_strategy === 'fuzzy' ? formData.fuzzy_threshold : undefined,
      status: formData.status,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync(data);
        setSuccessMessage('Validation saved successfully!');
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const result = await createMutation.mutateAsync(data);
        // Navigate to edit page for the newly created validation
        navigate(`/validations/${result.data.validation_id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save validation');
    }
  };

  const handleSaveAndRun = async () => {
    setError('');
    setSuccessMessage('');

    // Validate that validation is complete
    if (!isValidationComplete()) {
      setError('Please complete all required fields before running the validation');
      return;
    }

    // Prepare data for API
    const data = {
      validation_name: formData.validation_name,
      description: formData.description,
      left_sources: leftSources,
      right_sources: rightSources,
      left_pipeline:
        leftPipeline.length > 0 ? { operations: leftPipeline } : null,
      right_pipeline:
        rightPipeline.length > 0 ? { operations: rightPipeline } : null,
      key_fields: keyFields,
      compare_fields: compareFields,
      match_strategy: formData.match_strategy,
      fuzzy_threshold:
        formData.match_strategy === 'fuzzy' ? formData.fuzzy_threshold : undefined,
      status: formData.status,
    };

    try {
      let currentValidationId = validationId;

      // Step 1: Save the validation
      if (isEdit) {
        await updateMutation.mutateAsync(data);
        setSuccessMessage('Validation saved! Running...');
      } else {
        const result = await createMutation.mutateAsync(data);
        currentValidationId = result.data.validation_id;
        setSuccessMessage('Validation created! Running...');
      }

      // Step 2: Run the validation
      if (currentValidationId) {
        const result = await runMutation.mutateAsync(currentValidationId);
        setSuccessMessage('Validation executed successfully!');

        // Auto-navigate to results page
        if (result?.result_id) {
          navigate(`/validation/results/${result.result_id}`);
        } else {
          // Fallback: show modal if no result_id
          setValidationResult(result);
          setShowResultsModal(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save and run validation');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || runMutation.isPending || isLoadingValidation;

  // Get list of source IDs for pipeline builder
  const leftSourceIds = leftSources.map((s) => s.source_id);
  const rightSourceIds = rightSources.map((s) => s.source_id);

  return (
    <ValidationLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        {/* Title with inline edit */}
        <div className="space-y-2">
          {!isEditingHeader ? (
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {formData.validation_name || 'New Validation'}
              </h1>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingHeader(true)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              {!isValidationComplete() && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">
                  Draft
                </Badge>
              )}
              {isValidationComplete() && (
                <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                  Complete
                </Badge>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={formData.validation_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, validation_name: e.target.value }))
                  }
                  placeholder="Validation Name"
                  className="text-2xl font-bold h-12"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingHeader(false)}
                  className="h-8 w-8 p-0"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingHeader(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Description (optional)"
                rows={2}
              />
            </div>
          )}

          {!isEditingHeader && formData.description && (
            <p className="text-muted-foreground">{formData.description}</p>
          )}
          {!isEditingHeader && !formData.description && (
            <p className="text-muted-foreground text-sm">
              Click edit to add a description
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <div className="ml-2">{error}</div>
          </Alert>
        )}

        {successMessage && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <Check className="h-4 w-4" />
            <div className="ml-2">{successMessage}</div>
          </Alert>
        )}

        {/* Validation Errors Summary */}
        {pipelineValidation.hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Pipeline has {totalErrorCount} validation errors</AlertTitle>
            <AlertDescription>
              <p className="mb-2">Fix the following issues before running the validation:</p>
              <ul className="list-disc ml-4 space-y-1">
                {pipelineValidation.operationErrors.length > 0 && (
                  <li>
                    <strong>Operations:</strong> {pipelineValidation.operationErrors.length} operation{pipelineValidation.operationErrors.length > 1 ? 's have' : ' has'} errors
                    <ul className="list-disc ml-4 mt-1">
                      {pipelineValidation.operationErrors.map((err) => (
                        <li key={err.operationIndex} className="text-sm">
                          Operation {err.operationIndex + 1} ({err.operationType.toUpperCase()}): {err.errors.length} error{err.errors.length > 1 ? 's' : ''}
                        </li>
                      ))}
                    </ul>
                  </li>
                )}
                {pipelineValidation.keyFieldErrors.length > 0 && (
                  <li>
                    <strong>Key Fields:</strong> {pipelineValidation.keyFieldErrors.length} error{pipelineValidation.keyFieldErrors.length > 1 ? 's' : ''}
                  </li>
                )}
                {pipelineValidation.compareFieldErrors.length > 0 && (
                  <li>
                    <strong>Compare Fields:</strong> {pipelineValidation.compareFieldErrors.length} error{pipelineValidation.compareFieldErrors.length > 1 ? 's' : ''}
                  </li>
                )}
              </ul>
              <p className="mt-2 text-sm font-medium">Scroll down to see detailed error messages in each section.</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Warning for missing pipeline operations */}
        {((leftSources.length > 1 && leftPipeline.length === 0) ||
          (rightSources.length > 1 && rightPipeline.length === 0)) && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <div className="ml-2">
              <div className="font-semibold">Pipeline Operations Required</div>
              <div className="text-sm text-muted-foreground mt-1">
                {leftSources.length > 1 && leftPipeline.length === 0 &&
                  'Left side has multiple sources - add JOIN operations to combine them. '}
                {rightSources.length > 1 && rightPipeline.length === 0 &&
                  'Right side has multiple sources - add JOIN operations to combine them. '}
                You can save as draft and add pipeline operations later.
              </div>
            </div>
          </Alert>
        )}

        {/* Files Section (collapsible) */}
        {isEdit && validationId && (
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <button
              type="button"
              onClick={() => setShowFiles(!showFiles)}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-semibold">Uploaded Files</h3>
              {showFiles ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {showFiles && (
              <div className="pt-2">
                <UploadedFilesList validationId={validationId} />
              </div>
            )}
          </div>
        )}

        {/* Left Source Configuration */}
        <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold border-b border-blue-200 pb-2">
            Left Source (Reference Data)
          </h3>

          <MultiSourceSelector
            sources={leftSources}
            onChange={setLeftSources}
            label="Data Sources"
            validationId={validationId || 0}
          />

          {leftSources.length > 0 && (
            <PipelineBuilder
              operations={leftPipeline}
              onChange={setLeftPipeline}
              availableSources={leftSourceIds}
              sources={leftSources}
              label="Transformation Pipeline"
              validationId={validationId || 0}
              operationErrors={leftPipelineErrors}
            />
          )}
        </div>

        {/* Right Source Configuration */}
        <div className="bg-green-50/50 border border-green-200 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold border-b border-green-200 pb-2">
            Right Source (Comparison Data)
          </h3>

          <MultiSourceSelector
            sources={rightSources}
            onChange={setRightSources}
            label="Data Sources"
            validationId={validationId || 0}
          />

          {rightSources.length > 0 && (
            <PipelineBuilder
              operations={rightPipeline}
              onChange={setRightPipeline}
              availableSources={rightSourceIds}
              sources={rightSources}
              label="Transformation Pipeline"
              validationId={validationId || 0}
              operationErrors={rightPipelineErrors}
            />
          )}
        </div>

        {/* Comparison Configuration */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">
            Comparison Configuration
          </h3>

          {/* Show available columns summary */}
          {(leftSources.length > 0 || rightSources.length > 0) && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <div className="font-semibold text-blue-900 mb-1">Left Output Columns</div>
                <div className="text-blue-700">
                  {leftColumns.length > 0 ? (
                    <>{leftColumns.length} column(s): {leftColumns.slice(0, 5).join(', ')}{leftColumns.length > 5 && '...'}</>
                  ) : (
                    <span className="text-muted-foreground">Configure sources to see columns</span>
                  )}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="font-semibold text-green-900 mb-1">Right Output Columns</div>
                <div className="text-green-700">
                  {rightColumns.length > 0 ? (
                    <>{rightColumns.length} column(s): {rightColumns.slice(0, 5).join(', ')}{rightColumns.length > 5 && '...'}</>
                  ) : (
                    <span className="text-muted-foreground">Configure sources to see columns</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Warning if no common columns */}
          {leftColumns.length > 0 && rightColumns.length > 0 && commonColumns.length === 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <div className="ml-2">
                <div className="font-semibold">No Common Columns Found</div>
                <div className="text-sm mt-1">
                  Left and right sides have no columns in common. Use MAP operations to create matching column names.
                </div>
              </div>
            </Alert>
          )}

          {/* Info about common columns */}
          {commonColumns.length > 0 && (
            <div className="bg-muted p-3 rounded text-sm">
              <strong>Common Columns ({commonColumns.length}):</strong> {commonColumns.join(', ')}
            </div>
          )}

          {/* Key Field Errors */}
          {pipelineValidation.keyFieldErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Key Field Errors</AlertTitle>
              <AlertDescription>
                <ul className="list-disc ml-4 space-y-1">
                  {pipelineValidation.keyFieldErrors.map((error, idx) => (
                    <li key={idx} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Compare Field Errors */}
          {pipelineValidation.compareFieldErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Compare Field Errors</AlertTitle>
              <AlertDescription>
                <ul className="list-disc ml-4 space-y-1">
                  {pipelineValidation.compareFieldErrors.map((error, idx) => (
                    <li key={idx} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Key Fields */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">
                  Key Fields {isValidationComplete() && <span className="text-destructive">*</span>}
                </Label>
                {commonColumns.length > 0 && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => {
                      if (keyFields.length === commonColumns.length) {
                        setKeyFields([]);
                      } else {
                        setKeyFields([...commonColumns]);
                      }
                    }}
                    className="h-auto p-0 text-xs"
                  >
                    {keyFields.length === commonColumns.length ? 'Clear Selection' : 'Select All'}
                  </Button>
                )}
              </div>
              {commonColumns.length > 0 ? (
                <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                  {commonColumns.map((column) => (
                    <label key={column} className="flex items-center space-x-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={keyFields.includes(column)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setKeyFields([...keyFields, column]);
                          } else {
                            setKeyFields(keyFields.filter((f) => f !== column));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="truncate">{column}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded">
                  No common columns available
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Fields used to match records between left and right sides
                {keyFields.length > 0 && ` (${keyFields.length} selected)`}
              </p>
            </div>

            {/* Compare Fields */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Compare Fields</Label>
                {commonColumns.length > 0 && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => {
                      if (compareFields.length === commonColumns.length) {
                        setCompareFields([]);
                      } else {
                        setCompareFields([...commonColumns]);
                      }
                    }}
                    className="h-auto p-0 text-xs"
                  >
                    {compareFields.length === commonColumns.length ? 'Clear Selection' : 'Select All'}
                  </Button>
                )}
              </div>
              {commonColumns.length > 0 ? (
                <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                  {commonColumns.map((column) => (
                    <label key={column} className="flex items-center space-x-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={compareFields.includes(column)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCompareFields([...compareFields, column]);
                          } else {
                            setCompareFields(compareFields.filter((f) => f !== column));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="truncate">{column}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded">
                  No common columns available
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Fields to check for differences (empty = all common fields)
                {compareFields.length > 0 && ` (${compareFields.length} selected)`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="match_strategy">Match Strategy</Label>
              <Select
                value={formData.match_strategy}
                onValueChange={(value: MatchStrategy) =>
                  setFormData((prev) => ({ ...prev, match_strategy: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">Exact Match</SelectItem>
                  <SelectItem value="fuzzy">Fuzzy Match</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.match_strategy === 'fuzzy' && (
              <div className="space-y-2">
                <Label htmlFor="fuzzy_threshold">Fuzzy Threshold</Label>
                <Input
                  id="fuzzy_threshold"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.fuzzy_threshold}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fuzzy_threshold: parseFloat(e.target.value),
                    }))
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Bar */}
        <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t shadow-lg py-4 px-6 mt-8 -mx-6 flex justify-between items-center gap-2 z-10">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/validation/workflows')}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="outline" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
            <Button
              type="button"
              onClick={handleSaveAndRun}
              disabled={isLoading || !isValidationComplete() || pipelineValidation.hasErrors}
              className="bg-green-600 hover:bg-green-700 text-white"
              title={
                pipelineValidation.hasErrors
                  ? `Cannot run: ${totalErrorCount} validation error${totalErrorCount > 1 ? 's' : ''}`
                  : !isValidationComplete()
                  ? 'Complete all required fields to run'
                  : 'Run validation'
              }
            >
              <Play className="h-4 w-4 mr-2" />
              {runMutation.isPending ? 'Running...' : pipelineValidation.hasErrors ? 'Fix Errors to Run' : 'Run'}
            </Button>
          </div>
        </div>
      </form>

      {/* Results Modal */}
      <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              Validation Complete
            </DialogTitle>
            <DialogDescription>
              Your validation has been executed successfully. Here's a summary of the results:
            </DialogDescription>
          </DialogHeader>

          {validationResult && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-700 font-medium">Fully Matched</div>
                  <div className="text-3xl font-bold text-green-900 mt-1">
                    {((validationResult.matched || 0) - (validationResult.differences || 0))}
                  </div>
                  <div className="text-xs text-green-600 mt-1">Perfect matches</div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-sm text-yellow-700 font-medium">Differences</div>
                  <div className="text-3xl font-bold text-yellow-900 mt-1">
                    {validationResult.differences || 0}
                  </div>
                  <div className="text-xs text-yellow-600 mt-1">Matched with differences</div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-700 font-medium">Left Only</div>
                  <div className="text-3xl font-bold text-blue-900 mt-1">
                    {validationResult.left_only || 0}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">Only in left source</div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-sm text-purple-700 font-medium">Right Only</div>
                  <div className="text-3xl font-bold text-purple-900 mt-1">
                    {validationResult.right_only || 0}
                  </div>
                  <div className="text-xs text-purple-600 mt-1">Only in right source</div>
                </div>
              </div>

              {/* Total Records */}
              <div className="bg-muted rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Records Compared</span>
                  <span className="text-2xl font-bold">
                    {(validationResult.total_left || 0) + (validationResult.total_right || 0)}
                  </span>
                </div>
              </div>

              {/* Execution Info */}
              {validationResult.execution_time_ms && (
                <div className="text-sm text-muted-foreground">
                  Execution time: {(validationResult.execution_time_ms / 1000).toFixed(2)}s
                </div>
              )}
              {validationResult.match_percentage !== undefined && (
                <div className="text-sm text-muted-foreground">
                  Match rate: {validationResult.match_percentage.toFixed(1)}%
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowResultsModal(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowResultsModal(false);
                if (validationResult?.result_id) {
                  navigate(`/validation/results/${validationResult.result_id}`);
                } else {
                  navigate('/validation/results');
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Results
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ValidationLayout>
  );
}
