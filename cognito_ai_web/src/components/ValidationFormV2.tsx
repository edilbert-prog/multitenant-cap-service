import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Alert } from './ui/alert';
import { AlertCircle } from 'lucide-react';
import { MultiSourceSelector } from './MultiSourceSelector';
import { PipelineBuilder } from './PipelineBuilder';
import {
  useCreateValidation,
  useUpdateValidation,
  useValidation,
} from '../api/validation/hooks';
import type {
  SourceDefinition,
  TransformOperation,
  MatchStrategy,
  ValidationStatus,
} from '../types/validation';

interface ValidationFormV2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  validationId?: number;
  onSuccess?: () => void;
}

export function ValidationFormV2({
  open,
  onOpenChange,
  validationId,
  onSuccess,
}: ValidationFormV2Props) {
  const isEdit = !!validationId;

  // API Hooks
  const { data: existingValidation, isLoading: isLoadingValidation } = useValidation(
    validationId || 0
  );
  const createMutation = useCreateValidation();
  const updateMutation = useUpdateValidation(validationId || 0);

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

  const [error, setError] = useState('');

  // Load existing validation data when editing
  useEffect(() => {
    if (existingValidation && isEdit) {
      setFormData({
        validation_name: existingValidation.validation_name || '',
        description: existingValidation.description || '',
        match_strategy: existingValidation.match_strategy || 'exact',
        fuzzy_threshold: existingValidation.fuzzy_threshold || 0.8,
        status: existingValidation.status || 'active',
        key_fields: Array.isArray(existingValidation.key_fields)
          ? existingValidation.key_fields.join(', ')
          : '',
        compare_fields: Array.isArray(existingValidation.compare_fields)
          ? existingValidation.compare_fields.join(', ')
          : '',
      });

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

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        validation_name: '',
        description: '',
        match_strategy: 'exact',
        fuzzy_threshold: 0.8,
        status: 'active',
        key_fields: '',
        compare_fields: '',
      });
      setLeftSources([]);
      setLeftPipeline([]);
      setRightSources([]);
      setRightPipeline([]);
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!formData.validation_name) {
      setError('Validation name is required');
      return;
    }
    if (leftSources.length === 0 || rightSources.length === 0) {
      setError('Both left and right sources are required');
      return;
    }
    if (!formData.key_fields) {
      setError('Key fields are required');
      return;
    }

    // Validate multi-source has pipeline
    if (leftSources.length > 1 && leftPipeline.length === 0) {
      setError('Left side has multiple sources but no pipeline operations');
      return;
    }
    if (rightSources.length > 1 && rightPipeline.length === 0) {
      setError('Right side has multiple sources but no pipeline operations');
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
      key_fields: formData.key_fields.split(',').map((f) => f.trim()).filter(Boolean),
      compare_fields: formData.compare_fields
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean),
      match_strategy: formData.match_strategy,
      fuzzy_threshold:
        formData.match_strategy === 'fuzzy' ? formData.fuzzy_threshold : undefined,
      status: formData.status,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to save validation');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isLoadingValidation;

  // Get list of source IDs for pipeline builder
  const leftSourceIds = leftSources.map((s) => s.source_id);
  const rightSourceIds = rightSources.map((s) => s.source_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Validation' : 'Create New Validation'}
          </DialogTitle>
          <DialogDescription>
            Configure a validation rule with multiple data sources and transformation
            pipelines
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <div className="ml-2">{error}</div>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Basic Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validation_name">Validation Name *</Label>
                <Input
                  id="validation_name"
                  value={formData.validation_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, validation_name: e.target.value }))
                  }
                  placeholder="e.g., Employee Data Validation"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: ValidationStatus) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe what this validation does"
                rows={2}
              />
            </div>
          </div>

          {/* Left Source Configuration */}
          <div className="space-y-4 border rounded-lg p-6 bg-blue-50/30">
            <h3 className="text-lg font-semibold border-b pb-2">
              Left Source (Reference Data)
            </h3>

            <MultiSourceSelector
              sources={leftSources}
              onChange={setLeftSources}
              label="Data Sources"
            />

            {leftSources.length > 0 && (
              <PipelineBuilder
                operations={leftPipeline}
                onChange={setLeftPipeline}
                availableSources={leftSourceIds}
                sources={leftSources}
                label="Transformation Pipeline"
              />
            )}
          </div>

          {/* Right Source Configuration */}
          <div className="space-y-4 border rounded-lg p-6 bg-green-50/30">
            <h3 className="text-lg font-semibold border-b pb-2">
              Right Source (Comparison Data)
            </h3>

            <MultiSourceSelector
              sources={rightSources}
              onChange={setRightSources}
              label="Data Sources"
            />

            {rightSources.length > 0 && (
              <PipelineBuilder
                operations={rightPipeline}
                onChange={setRightPipeline}
                availableSources={rightSourceIds}
                sources={rightSources}
                label="Transformation Pipeline"
              />
            )}
          </div>

          {/* Comparison Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Comparison Configuration
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="key_fields">Key Fields *</Label>
                <Input
                  id="key_fields"
                  value={formData.key_fields}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, key_fields: e.target.value }))
                  }
                  placeholder="e.g., employee_id, customer_id"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Fields used to match records (comma-separated)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="compare_fields">Compare Fields</Label>
                <Input
                  id="compare_fields"
                  value={formData.compare_fields}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      compare_fields: e.target.value,
                    }))
                  }
                  placeholder="e.g., name, department, salary"
                />
                <p className="text-xs text-muted-foreground">
                  Fields to compare for differences (empty = all fields)
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? 'Saving...'
                : isEdit
                ? 'Update Validation'
                : 'Create Validation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
