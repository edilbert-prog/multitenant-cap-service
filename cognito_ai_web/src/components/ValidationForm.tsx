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
import {
  useConnections,
  useConnectionTables,
  useCreateValidation,
  useUpdateValidation,
  useValidation,
} from '../api/validation/hooks';
import type { Validation } from '../types/validation';
import { Alert } from './ui/alert';
import { AlertCircle } from 'lucide-react';

interface ValidationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  validationId?: number;
  onSuccess?: () => void;
}

export function ValidationForm({
  open,
  onOpenChange,
  validationId,
  onSuccess,
}: ValidationFormProps) {
  const isEdit = !!validationId;

  // API Hooks
  const { data: connections = [] } = useConnections();
  const { data: existingValidation, isLoading: isLoadingValidation } = useValidation(
    validationId || 0
  );
  const createMutation = useCreateValidation();
  const updateMutation = useUpdateValidation(validationId || 0);

  // Form state
  const [formData, setFormData] = useState({
    validation_name: '',
    description: '',
    left_connection_id: 0,
    right_connection_id: 0,
    left_query: '',
    right_query: '',
    key_fields: '',
    compare_fields: '',
    match_strategy: 'exact' as 'exact' | 'fuzzy',
    fuzzy_threshold: 0.8,
    status: 'active' as 'active' | 'inactive' | 'archived',
  });

  const [selectedLeftTable, setSelectedLeftTable] = useState('');
  const [selectedRightTable, setSelectedRightTable] = useState('');
  const [error, setError] = useState('');

  // Fetch tables for selected connections
  const { data: leftTables = [] } = useConnectionTables(formData.left_connection_id);
  const { data: rightTables = [] } = useConnectionTables(formData.right_connection_id);

  // Load existing validation data when editing
  useEffect(() => {
    if (existingValidation && isEdit) {
      setFormData({
        validation_name: existingValidation.validation_name || '',
        description: existingValidation.description || '',
        left_connection_id: existingValidation.left_connection_id || 0,
        right_connection_id: existingValidation.right_connection_id || 0,
        left_query: existingValidation.left_query || '',
        right_query: existingValidation.right_query || '',
        key_fields: Array.isArray(existingValidation.key_fields)
          ? existingValidation.key_fields.join(', ')
          : '',
        compare_fields: Array.isArray(existingValidation.compare_fields)
          ? existingValidation.compare_fields.join(', ')
          : '',
        match_strategy: existingValidation.match_strategy || 'exact',
        fuzzy_threshold: existingValidation.fuzzy_threshold || 0.8,
        status: existingValidation.status || 'active',
      });
    }
  }, [existingValidation, isEdit]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        validation_name: '',
        description: '',
        left_connection_id: 0,
        right_connection_id: 0,
        left_query: '',
        right_query: '',
        key_fields: '',
        compare_fields: '',
        match_strategy: 'exact',
        fuzzy_threshold: 0.8,
        status: 'active',
      });
      setSelectedLeftTable('');
      setSelectedRightTable('');
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
    if (!formData.left_connection_id || !formData.right_connection_id) {
      setError('Both left and right connections are required');
      return;
    }
    if (!formData.left_query || !formData.right_query) {
      setError('Both left and right queries are required');
      return;
    }
    if (!formData.key_fields) {
      setError('Key fields are required');
      return;
    }

    // Prepare data for API
    const data = {
      validation_name: formData.validation_name,
      description: formData.description,
      left_connection_id: formData.left_connection_id,
      right_connection_id: formData.right_connection_id,
      left_query: formData.left_query,
      right_query: formData.right_query,
      key_fields: formData.key_fields.split(',').map((f) => f.trim()).filter(Boolean),
      compare_fields: formData.compare_fields.split(',').map((f) => f.trim()).filter(Boolean),
      match_strategy: formData.match_strategy,
      fuzzy_threshold: formData.match_strategy === 'fuzzy' ? formData.fuzzy_threshold : undefined,
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

  const handleTableSelect = (side: 'left' | 'right', tableName: string) => {
    if (side === 'left') {
      setSelectedLeftTable(tableName);
      setFormData((prev) => ({
        ...prev,
        left_query: `SELECT * FROM ${tableName}`,
      }));
    } else {
      setSelectedRightTable(tableName);
      setFormData((prev) => ({
        ...prev,
        right_query: `SELECT * FROM ${tableName}`,
      }));
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isLoadingValidation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Validation' : 'Create New Validation'}</DialogTitle>
          <DialogDescription>
            Configure a validation rule to compare data from two sources
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <div className="ml-2">{error}</div>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="match_strategy">Match Strategy</Label>
                <Select
                  value={formData.match_strategy}
                  onValueChange={(value: 'exact' | 'fuzzy') =>
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

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive' | 'archived') =>
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
          </div>

          {/* Left Source Configuration */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-lg font-semibold">Left Source (Reference)</h3>

            <div className="space-y-2">
              <Label htmlFor="left_connection">Connection *</Label>
              <Select
                value={formData.left_connection_id.toString()}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, left_connection_id: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a connection" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((conn) => (
                    <SelectItem key={conn.connection_id} value={conn.connection_id.toString()}>
                      {conn.connection_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.left_connection_id > 0 && leftTables.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="left_table">Select Table (Optional)</Label>
                <Select
                  value={selectedLeftTable}
                  onValueChange={(value) => handleTableSelect('left', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a table to auto-fill query" />
                  </SelectTrigger>
                  <SelectContent>
                    {leftTables.map((table) => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="left_query">Query *</Label>
              <Textarea
                id="left_query"
                value={formData.left_query}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, left_query: e.target.value }))
                }
                placeholder="SELECT * FROM table_name WHERE condition"
                rows={4}
                className="font-mono text-sm"
                required
              />
            </div>
          </div>

          {/* Right Source Configuration */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-lg font-semibold">Right Source (Comparison)</h3>

            <div className="space-y-2">
              <Label htmlFor="right_connection">Connection *</Label>
              <Select
                value={formData.right_connection_id.toString()}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, right_connection_id: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a connection" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((conn) => (
                    <SelectItem key={conn.connection_id} value={conn.connection_id.toString()}>
                      {conn.connection_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.right_connection_id > 0 && rightTables.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="right_table">Select Table (Optional)</Label>
                <Select
                  value={selectedRightTable}
                  onValueChange={(value) => handleTableSelect('right', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a table to auto-fill query" />
                  </SelectTrigger>
                  <SelectContent>
                    {rightTables.map((table) => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="right_query">Query *</Label>
              <Textarea
                id="right_query"
                value={formData.right_query}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, right_query: e.target.value }))
                }
                placeholder="SELECT * FROM table_name WHERE condition"
                rows={4}
                className="font-mono text-sm"
                required
              />
            </div>
          </div>

          {/* Comparison Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Comparison Configuration</h3>

            <div className="space-y-2">
              <Label htmlFor="key_fields">Key Fields *</Label>
              <Input
                id="key_fields"
                value={formData.key_fields}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, key_fields: e.target.value }))
                }
                placeholder="e.g., employee_id, customer_id (comma-separated)"
                required
              />
              <p className="text-sm text-muted-foreground">
                Fields used to match records between sources
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compare_fields">Compare Fields</Label>
              <Input
                id="compare_fields"
                value={formData.compare_fields}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, compare_fields: e.target.value }))
                }
                placeholder="e.g., name, department, salary (comma-separated)"
              />
              <p className="text-sm text-muted-foreground">
                Fields to compare for differences (leave empty to compare all fields)
              </p>
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
              {isLoading ? 'Saving...' : isEdit ? 'Update Validation' : 'Create Validation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
